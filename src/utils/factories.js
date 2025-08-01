export function createFlags() {
  return {
    untouched: true,
    touched: false,
    dirty: false,
    pristine: true,
    valid: false,
    invalid: false,
    validated: false,
    pending: false,
    required: false,
    changed: false,
    passed: false,
    failed: false
  };
}
