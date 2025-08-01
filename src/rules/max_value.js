import { isNullOrUndefined } from '../utils';
const validate = (value, { max }) => {
  if (isNullOrUndefined(value) || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.every(val => validate(val, { max }));
  }
  return Number(value) <= max;
};
const params = [
  {
    name: 'max',
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
