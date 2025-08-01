export function isNaN(value) {
  return value !== value;
}
export function isNullOrUndefined(value) {
  return value === null || value === undefined;
}
export function isEmptyArray(arr) {
  return Array.isArray(arr) && arr.length === 0;
}
export const isObject = obj => obj !== null && obj && typeof obj === 'object' && !Array.isArray(obj);
export function isRefEqual(lhs, rhs) {
  if (isNaN(lhs) && isNaN(rhs)) {
    return true;
  }
  return lhs === rhs;
}
export function isSpecified(val) {
  if (val === '') {
    return false;
  }
  return !isNullOrUndefined(val);
}
export function isCallable(fn) {
  return typeof fn === 'function';
}
export function isLocator(value) {
  return isCallable(value) && !!value.__locatorRef;
}
