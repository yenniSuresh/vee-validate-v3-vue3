import { alpha } from './alpha_helper';
const validate = (value, { locale = '' } = {}) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { locale }));
  }
  if (!locale) {
    return Object.keys(alpha).some(loc => alpha[loc].test(value));
  }
  return (alpha[locale] || alpha.en).test(value);
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
