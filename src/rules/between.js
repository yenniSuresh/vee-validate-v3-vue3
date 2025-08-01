const validate = (value, { min, max } = {}) => {
  if (Array.isArray(value)) {
    return value.every(val => !!validate(val, { min, max }));
  }
  return Number(min) <= value && Number(max) >= value;
};
const params = [
  {
    name: 'min'
  },
  {
    name: 'max'
  }
];
export { validate, params };
export default {
  validate,
  params
};
