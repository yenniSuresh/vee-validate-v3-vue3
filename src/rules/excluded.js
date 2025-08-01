import { validate as includes } from './oneOf';
const validate = (value, args) => !includes(value, args);
export { validate };
export default {
  validate
};
