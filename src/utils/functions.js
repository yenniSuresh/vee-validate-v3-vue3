export function identity(x) {
  return x;
}
export function debounce(fn, wait = 0, token = { cancelled: false }) {
  if (wait === 0) {
    return fn;
  }
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = undefined;
      if (!token.cancelled) fn(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
