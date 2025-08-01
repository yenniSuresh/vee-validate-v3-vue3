const validate = (value, { length }) => {
  if (Array.isArray(value)) {
    return value.every(val => validate(val, { length }));
  }
  const strVal = String(value);
  return /^[0-9]*$/.test(strVal) && strVal.length === length;
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
