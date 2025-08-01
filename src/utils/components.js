export const getListeners = function (attrs) {
  return Object.keys(attrs).reduce((acc, key) => {
    // Check if the key starts with 'on' and is followed by a capital letter (e.g., onClick, onChange)
    if (key.startsWith('on') && key.length > 2 && key[2] === key[2].toUpperCase()) {
      acc[key] = attrs[key];
    }
    return acc;
  }, {});
};
