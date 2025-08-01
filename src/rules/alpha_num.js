import { alphanumeric } from './alpha_helper';
const validate = (value, { locale = '' } = {}) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { locale }));
  }
  if (!locale) {
    return Object.keys(alphanumeric).some(loc => alphanumeric[loc].test(value));
  }
  return (alphanumeric[locale] || alphanumeric.en).test(value);
};
const params = [
  {
    name: 'locale'
  }
];
export { validate, params };
export default {
  validate,
  params
};
