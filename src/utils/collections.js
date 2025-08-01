import { isCallable, isObject } from './assertions';
export function findIndex(arrayLike, predicate) {
  const array = Array.isArray(arrayLike) ? arrayLike : toArray(arrayLike);
  if (isCallable(array.findIndex)) {
    return array.findIndex(predicate);
  }
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      return i;
    }
  }
  return -1;
}
export function find(arrayLike, predicate) {
  const array = Array.isArray(arrayLike) ? arrayLike : toArray(arrayLike);
  const idx = findIndex(array, predicate);
  return idx === -1 ? undefined : array[idx];
}
export function includes(collection, item) {
  return collection.indexOf(item) !== -1;
}
export function toArray(arrayLike) {
  if (isCallable(Array.from)) {
    return Array.from(arrayLike);
  }
  return _copyArray(arrayLike);
}
function _copyArray(arrayLike) {
  const array = [];
  const length = arrayLike.length;
  for (let i = 0; i < length; i++) {
    array.push(arrayLike[i]);
  }
  return array;
}
export function values(obj) {
  if (isCallable(Object.values)) {
    return Object.values(obj);
  }
  return Object.keys(obj).map(k => obj[k]);
}
export function merge(target, source) {
  Object.keys(source).forEach(key => {
    if (isObject(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      merge(target[key], source[key]);
      return;
    }
    target[key] = source[key];
  });
  return target;
}
