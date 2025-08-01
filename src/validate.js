import { RuleContainer } from './extend';
import { interpolate, isEmptyArray, isLocator, isNullOrUndefined, isObject } from './utils';
import { getConfig } from './config';
import { normalizeRules } from './utils/rules';
export async function validate(value, rules, options = {}) {
  const shouldBail = options && options.bails;
  const skipIfEmpty = options && options.skipIfEmpty;
  const field = {
    name: (options && options.name) || '{field}',
    rules: normalizeRules(rules),
    bails: shouldBail ? true : shouldBail,
    skipIfEmpty: skipIfEmpty ? true : skipIfEmpty,
    forceRequired: false,
    crossTable: (options && options.values) || {},
    names: (options && options.names) || {},
    customMessages: (options && options.customMessages) || {}
  };
  const result = await _validate(field, value, options);
  const errors = [];
  const failedRules = {};
  const regenerateMap = {};
  result.errors.forEach(e => {
    const msg = e.msg();
    errors.push(msg);
    failedRules[e.rule] = msg;
    regenerateMap[e.rule] = e.msg;
  });
  return {
    valid: result.valid,
    required: result.required,
    errors,
    failedRules,
    regenerateMap
  };
}
async function _validate(field, value, { isInitial = false } = {}) {
  const { shouldSkip, required, errors } = await _shouldSkip(field, value);
  if (shouldSkip) {
    return {
      valid: !errors.length,
      required,
      errors
    };
  }
  const rules = Object.keys(field.rules).filter(rule => !RuleContainer.isRequireRule(rule));
  const length = rules.length;
  for (let i = 0; i < length; i++) {
    if (isInitial && RuleContainer.isLazy(rules[i])) {
      continue;
    }
    const rule = rules[i];
    const result = await _test(field, value, {
      name: rule,
      params: field.rules[rule]
    });
    if (!result.valid && result.error) {
      errors.push(result.error);
      if (field.bails) {
        return {
          valid: false,
          required,
          errors
        };
      }
    }
  }
  return {
    valid: !errors.length,
    required,
    errors
  };
}
async function _shouldSkip(field, value) {
  const requireRules = Object.keys(field.rules).filter(RuleContainer.isRequireRule);
  const length = requireRules.length;
  const errors = [];
  const isEmpty = isNullOrUndefined(value) || value === '' || isEmptyArray(value);
  const isEmptyAndOptional = isEmpty && field.skipIfEmpty;
  let isRequired;
  for (let i = 0; i < length; i++) {
    const rule = requireRules[i];
    const result = await _test(field, value, {
      name: rule,
      params: field.rules[rule]
    });
    if (!isObject(result)) {
      throw new Error('Require rules has to return an object (see docs)');
    }
    if (result.required !== undefined) {
      isRequired = result.required;
    }
    if (!result.valid && result.error) {
      errors.push(result.error);
      if (field.bails) {
        return {
          shouldSkip: true,
          required: result.required,
          errors
        };
      }
    }
  }
  if (isEmpty && !isRequired && !field.skipIfEmpty) {
    return {
      shouldSkip: false,
      required: isRequired,
      errors
    };
  }
  if (!field.bails && !isEmptyAndOptional) {
    return {
      shouldSkip: false,
      required: isRequired,
      errors
    };
  }
  return {
    shouldSkip: !isRequired && isEmpty,
    required: isRequired,
    errors
  };
}
async function _test(field, value, rule) {
  const ruleSchema = RuleContainer.getRuleDefinition(rule.name);
  if (!ruleSchema || !ruleSchema.validate) {
    throw new Error(`No such validator '${rule.name}' exists.`);
  }
  const normalizedValue = ruleSchema.castValue ? ruleSchema.castValue(value) : value;
  const params = fillTargetValues(rule.params, field.crossTable);
  let result = await ruleSchema.validate(normalizedValue, params);
  if (typeof result === 'string') {
    const values = {
      ...(params || {}),
      _field_: field.name,
      _value_: value,
      _rule_: rule.name
    };
    return {
      valid: false,
      error: { rule: rule.name, msg: () => interpolate(result, values) }
    };
  }
  if (!isObject(result)) {
    result = { valid: result };
  }
  return {
    valid: result.valid,
    required: result.required,
    error: result.valid ? undefined : _generateFieldError(field, value, ruleSchema, rule.name, params)
  };
}
function _generateFieldError(field, value, ruleSchema, ruleName, params) {
  const message = field.customMessages[ruleName] ? field.customMessages[ruleName] : ruleSchema.message;
  const ruleTargets = _getRuleTargets(field, ruleSchema, ruleName);
  const { userTargets, userMessage } = _getUserTargets(field, ruleSchema, ruleName, message);
  const values = {
    ...(params || {}),
    _field_: field.name,
    _value_: value,
    _rule_: ruleName,
    ...ruleTargets,
    ...userTargets
  };
  return {
    msg: () => _normalizeMessage(userMessage || getConfig().defaultMessage, field.name, values),
    rule: ruleName
  };
}
function _getRuleTargets(field, ruleSchema, ruleName) {
  const params = ruleSchema.params;
  if (!params) {
    return {};
  }
  const numTargets = params.filter(param => param.isTarget).length;
  if (numTargets <= 0) {
    return {};
  }
  const names = {};
  let ruleConfig = field.rules[ruleName];
  if (!Array.isArray(ruleConfig) && isObject(ruleConfig)) {
    ruleConfig = params.map(param => ruleConfig[param.name]);
  }
  for (let index = 0; index < params.length; index++) {
    const param = params[index];
    let key = ruleConfig[index];
    if (!isLocator(key)) {
      continue;
    }
    key = key.__locatorRef;
    const name = field.names[key] || key;
    names[param.name] = name;
    names[`_${param.name}_`] = field.crossTable[key];
  }
  return names;
}
function _getUserTargets(field, ruleSchema, ruleName, userMessage) {
  const userTargets = {};
  const rules = field.rules[ruleName];
  const params = ruleSchema.params || [];
  if (!rules) {
    return {};
  }
  Object.keys(rules).forEach((key, index) => {
    const rule = rules[key];
    if (!isLocator(rule)) {
      return {};
    }
    const param = params[index];
    if (!param) {
      return {};
    }
    const name = rule.__locatorRef;
    userTargets[param.name] = field.names[name] || name;
    userTargets[`_${param.name}_`] = field.crossTable[name];
  });
  return {
    userTargets,
    userMessage
  };
}
function _normalizeMessage(template, field, values) {
  if (typeof template === 'function') {
    return template(field, values);
  }
  return interpolate(template, { ...values, _field_: field });
}
function fillTargetValues(params, crossTable) {
  if (Array.isArray(params)) {
    return params.map(param => {
      const targetPart = typeof param === 'string' && param[0] === '@' ? param.slice(1) : param;
      if (targetPart in crossTable) {
        return crossTable[targetPart];
      }
      return param;
    });
  }
  const values = {};
  const normalize = value => {
    if (isLocator(value)) {
      return value(crossTable);
    }
    return value;
  };
  Object.keys(params).forEach(param => {
    values[param] = normalize(params[param]);
  });
  return values;
}
