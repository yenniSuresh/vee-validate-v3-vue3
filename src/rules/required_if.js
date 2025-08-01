import { isEmptyArray, includes } from '../utils';
const testEmpty = value =>
  isEmptyArray(value) || includes([false, null, undefined], value) || !String(value).trim().length;
const validate = (value, { target, values }) => {
  let required;
  if (values && values.length) {
    if (!Array.isArray(values) && typeof values === 'string') {
      values = [values];
    }
    required = values.some(val => val == String(target).trim());
  } else {
    required = !testEmpty(target);
  }
  if (!required) {
    return {
      valid: true,
      required
    };
  }
  return {
    valid: !testEmpty(value),
    required
  };
};
const params = [
  {
    name: 'target',
    isTarget: true
  },
  {
    name: 'values'
  }
];
export const computesRequired = true;
export { validate, params };
export default {
  validate,
  params,
  computesRequired
};
