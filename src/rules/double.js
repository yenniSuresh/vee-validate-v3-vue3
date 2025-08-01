const validate = (value, params) => {
  const { decimals = 0, separator = 'dot' } = params || {};
  const separators = {
    dot: '.',
    comma: ','
  };
  const delimiterRegexPart = separator === 'comma' ? ',?' : '\\.?';
  const decimalRegexPart = decimals === 0 ? '\\d*' : `(\\d{${decimals}})?`;
  const regex = new RegExp(`^-?\\d+${delimiterRegexPart}${decimalRegexPart}$`);
  return Array.isArray(value) ? value.every(val => regex.test(String(val))) : regex.test(String(value));
};
const params = [
  {
    name: 'decimals',
    default: 0
  },
  {
    name: 'separator',
    default: 'dot'
  }
];
export { validate, params };
export default {
  validate,
  params
};
