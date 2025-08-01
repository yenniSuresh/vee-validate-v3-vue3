import { isNullOrUndefined } from '../utils';
const validate = (value, { length }) => {
  if (isNullOrUndefined(value)) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { length }));
  }
  return String(value).length >= length;
};
const params = [
  {
    name: 'length',
    cast(value) {
      return Number(value);
    }
  }
];
export { validate, params };
export default {
  validate,
  params
};
