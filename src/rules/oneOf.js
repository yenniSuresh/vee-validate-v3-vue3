import { toArray } from '../utils';
const validate = (value, options) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, options));
  }
  return toArray(options).some(item => item == value);
};
export { validate };
export default {
  validate
};
