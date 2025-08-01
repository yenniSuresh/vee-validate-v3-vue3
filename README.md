# vee-validate-v3-vue3

A Vue 3 compatible port of [vee-validate v3](https://github.com/logaretm/vee-validate/tree/v3.4.14).  
This package allows developers to continue using vee-validate v3 without breaking changes while upgrading to Vue 3.

---

## ✨ Why use this package?

The official vee-validate v4 introduced significant breaking changes and a complete API overhaul.  
If you're migrating a large codebase from Vue 2 to Vue 3 and rely on vee-validate v3, this package:

- Lets you **migrate to Vue 3 without rewriting your validation logic**
- Retains **existing components and validation rules**
- Ensures compatibility with modern Vue 3 setups

---

## 📦 Installation

```bash
npm install vee-validate-v3-vue3
```

---

## 🔧 Usage

### Global Registration

```js
import Vue from 'vue';
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate-v3-vue3';

Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
```

### Rule Usage

```js
import { required, email } from 'vee-validate-v3-vue3/dist/rules';

extend('required', required);
extend('email', email);
```

---

## 🌐 CDN

```html
<script src="https://unpkg.com/vee-validate-v3-vue3/dist/vee-validate.min.js"></script>
```

You can access the components as global variables:

```js
const { ValidationProvider, ValidationObserver } = VeeValidate;
```

---

## ✅ Compatibility

- ✅ Vue 3.x
- ❌ Not compatible with Vue 2
- ✅ Fully backward-compatible with vee-validate v3 API

---

## 📁 Folder Structure

- `dist/` - CJS, ESM, and UMD bundles
- `dist/rules/` - Individual validation rules (same as v3)


## 🛠️ Development

Clone the repo and run:

```bash
npm install
npm run build
```

---

## 📢 Note

This is a **community-maintained** package to help developers avoid rewriting their vee-validate v3 code while adopting Vue 3.

This has worked perfectly for 10 months for me so decided to publish this as package.

---

## 📃 License

MIT
