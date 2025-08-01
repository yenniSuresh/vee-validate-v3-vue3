const validate = (value, { multiple } = {}) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (multiple && !Array.isArray(value)) {
    value = String(value)
      .split(',')
      .map(emailStr => emailStr.trim());
  }
  if (Array.isArray(value)) {
    return value.every(val => re.test(String(val)));
  }
  return re.test(String(value));
};
const params = [
  {
    name: 'multiple',
    default: false
  }
];
export { validate, params };
export default {
  validate,
  params
};
