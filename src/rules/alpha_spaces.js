import { alphaSpaces } from './alpha_helper';
const validate = (value, { locale = '' } = {}) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { locale }));
  }
  if (!locale) {
    return Object.keys(alphaSpaces).some(loc => alphaSpaces[loc].test(value));
  }
  return (alphaSpaces[locale] || alphaSpaces.en).test(value);
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
