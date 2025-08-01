import { isEmptyArray, isNullOrUndefined } from '../utils';
const validate = (value, { allowFalse } = { allowFalse: true }) => {
  const result = {
    valid: false,
    required: true
  };
  if (isNullOrUndefined(value) || isEmptyArray(value)) {
    return result;
  }
  if (value === false && !allowFalse) {
    return result;
  }
  result.valid = !!String(value).trim().length;
  return result;
};
export const computesRequired = true;
const params = [
  {
    name: 'allowFalse',
    default: true
  }
];
export { validate, params };
export default {
  validate,
  params,
  computesRequired
};
