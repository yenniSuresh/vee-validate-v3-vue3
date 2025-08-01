import { isCallable, merge } from './utils';
const RULES = {};
function normalizeSchema(schema) {
  if (schema.params && schema.params.length) {
    schema.params = schema.params.map(param => {
      if (typeof param === 'string') {
        return { name: param };
      }
      return param;
    });
  }
  return schema;
}
export class RuleContainer {
  static extend(name, schema) {
    const rule = normalizeSchema(schema);
    if (RULES[name]) {
      RULES[name] = merge(RULES[name], schema);
      return;
    }
    RULES[name] = {
      lazy: false,
      computesRequired: false,
      ...rule
    };
  }
  static isLazy(name) {
    return !!(RULES[name] && RULES[name].lazy);
  }
  static isRequireRule(name) {
    return !!(RULES[name] && RULES[name].computesRequired);
  }
  static getRuleDefinition(ruleName) {
    return RULES[ruleName];
  }
}
export function extend(name, schema) {
  guardExtend(name, schema);
  if (typeof schema === 'object') {
    RuleContainer.extend(name, schema);
    return;
  }
  RuleContainer.extend(name, {
    validate: schema
  });
}
function guardExtend(name, validator) {
  if (isCallable(validator)) {
    return;
  }
  if (isCallable(validator.validate)) {
    return;
  }
  if (RuleContainer.getRuleDefinition(name)) {
    return;
  }
  throw new Error(`Extension Error: The validator '${name}' must be a function or have a 'validate' method.`);
}
