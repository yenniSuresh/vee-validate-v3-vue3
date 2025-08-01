import { alphaDash } from './alpha_helper';
const validate = (value, { locale = '' } = {}) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { locale }));
  }
  if (!locale) {
    return Object.keys(alphaDash).some(loc => alphaDash[loc].test(value));
  }
  return (alphaDash[locale] || alphaDash.en).test(value);
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
