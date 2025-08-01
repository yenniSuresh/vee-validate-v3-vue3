import { RuleContainer } from '../extend';
import { includes, isObject, warn, isLocator } from './index';
export function normalizeRules(rules) {
  const acc = {};
  Object.defineProperty(acc, '_$$isNormalized', {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false
  });
  if (!rules) {
    return acc;
  }
  if (isObject(rules) && rules._$$isNormalized) {
    return rules;
  }
  if (isObject(rules)) {
    return Object.keys(rules).reduce((prev, curr) => {
      let params = [];
      if (rules[curr] === true) {
        params = [];
      } else if (Array.isArray(rules[curr])) {
        params = rules[curr];
      } else if (isObject(rules[curr])) {
        params = rules[curr];
      } else {
        params = [rules[curr]];
      }
      if (rules[curr] !== false) {
        prev[curr] = buildParams(curr, params);
      }
      return prev;
    }, acc);
  }
  if (typeof rules !== 'string') {
    warn('rules must be either a string or an object.');
    return acc;
  }
  return rules.split('|').reduce((prev, rule) => {
    const parsedRule = parseRule(rule);
    if (!parsedRule.name) {
      return prev;
    }
    prev[parsedRule.name] = buildParams(parsedRule.name, parsedRule.params);
    return prev;
  }, acc);
}
function buildParams(ruleName, provided) {
  const ruleSchema = RuleContainer.getRuleDefinition(ruleName);
  if (!ruleSchema) {
    return provided;
  }
  const params = {};
  if (!ruleSchema.params && !Array.isArray(provided)) {
    throw new Error('You provided an object params to a rule that has no defined schema.');
  }
  if (Array.isArray(provided) && !ruleSchema.params) {
    return provided;
  }
  let definedParams;
  if (!ruleSchema.params || (ruleSchema.params.length < provided.length && Array.isArray(provided))) {
    let lastDefinedParam;
    definedParams = provided.map((_, idx) => {
      let param = ruleSchema.params && ruleSchema.params[idx];
      lastDefinedParam = param || lastDefinedParam;
      if (!param) {
        param = lastDefinedParam;
      }
      return param;
    });
  } else {
    definedParams = ruleSchema.params;
  }
  for (let i = 0; i < definedParams.length; i++) {
    const options = definedParams[i];
    let value = options.default;
    if (Array.isArray(provided)) {
      if (i in provided) {
        value = provided[i];
      }
    } else if (options.name in provided) {
      value = provided[options.name];
    } else if (definedParams.length === 1) {
      value = provided;
    }
    if (options.isTarget) {
      value = createLocator(value, options.cast);
    }
    if (typeof value === 'string' && value[0] === '@') {
      value = createLocator(value.slice(1), options.cast);
    }
    if (!isLocator(value) && options.cast) {
      value = options.cast(value);
    }
    if (params[options.name]) {
      params[options.name] = Array.isArray(params[options.name]) ? params[options.name] : [params[options.name]];
      params[options.name].push(value);
    } else {
      params[options.name] = value;
    }
  }
  return params;
}
export const parseRule = rule => {
  let params = [];
  const name = rule.split(':')[0];
  if (includes(rule, ':')) {
    params = rule.split(':').slice(1).join(':').split(',');
  }
  return { name, params };
};
function createLocator(value, castFn) {
  const locator = crossTable => {
    const val = crossTable[value];
    return castFn ? castFn(val) : val;
  };
  locator.__locatorRef = value;
  return locator;
}
export function extractLocators(params) {
  if (Array.isArray(params)) {
    return params.filter(param => isLocator(param) || (typeof param === 'string' && param[0] === '@'));
  }
  return Object.keys(params)
    .filter(key => isLocator(params[key]))
    .map(key => params[key]);
}
