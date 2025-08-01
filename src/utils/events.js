import { isCallable, toArray, isNaN } from './index';
export const isEvent = evt => {
  if (!evt) {
    return false;
  }
  if (typeof Event !== 'undefined' && isCallable(Event) && evt instanceof Event) {
    return true;
  }
  if (evt && evt.srcElement) {
    return true;
  }
  return false;
};
export function normalizeEventValue(value) {
  if (!isEvent(value)) {
    return value;
  }
  const input = value.target;
  if (input.type === 'file' && input.files) {
    return toArray(input.files);
  }
  if (input._vModifiers && input._vModifiers.number) {
    const valueAsNumber = parseFloat(input.value);
    if (isNaN(valueAsNumber)) {
      return input.value;
    }
    return valueAsNumber;
  }
  if (input._vModifiers && input._vModifiers.trim) {
    const trimmedValue = typeof input.value === 'string' ? input.value.trim() : input.value;
    return trimmedValue;
  }
  return input.value;
}
