const validate = (value, { regex }) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { regex }));
  }
  return regex.test(String(value));
};
const params = [
  {
    name: 'regex',
    cast(value) {
      if (typeof value === 'string') {
        return new RegExp(value);
      }
      return value;
    }
  }
];
export { validate, params };
export default {
  validate,
  params
};
