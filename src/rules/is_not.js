const validate = (value, { other }) => value !== other;
const params = [
  {
    name: 'other'
  }
];
export { validate, params };
export default {
  validate,
  params
};
