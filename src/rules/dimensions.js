const validateImage = (file, width, height) => {
  const URL = window.URL || window.webkitURL;
  return new Promise(resolve => {
    const image = new Image();
    image.onerror = () => resolve(false);
    image.onload = () => resolve(image.width === width && image.height === height);
    image.src = URL.createObjectURL(file);
  });
};
const validate = (files, { width, height }) => {
  const list = [];
  files = Array.isArray(files) ? files : [files];
  for (let i = 0; i < files.length; i++) {
    if (!/\.(jpg|svg|jpeg|png|bmp|gif)$/i.test(files[i].name)) {
      return Promise.resolve(false);
    }
    list.push(files[i]);
  }
  return Promise.all(list.map(file => validateImage(file, width, height))).then(values => values.every(v => v));
};
const params = [
  {
    name: 'width',
    cast(value) {
      return Number(value);
    }
  },
  {
    name: 'height',
    cast(value) {
      return Number(value);
    }
  }
];
export { validate, params };
export default {
  validate,
  params
};
