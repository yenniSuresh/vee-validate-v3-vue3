const validate = (value, { target }) => String(value) === String(target);
const params = [
  {
    name: 'target',
    isTarget: true
  }
];
export { validate, params };
export default {
  validate,
  params
};
