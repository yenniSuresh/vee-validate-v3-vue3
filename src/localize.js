import { isCallable, merge, interpolate } from './utils';
import { setConfig } from './config';
import { localeChanged } from './localeChanged';
class Dictionary {
  locale;
  container;
  constructor(locale, dictionary) {
    this.container = {};
    this.locale = locale;
    this.merge(dictionary);
  }
  resolve(field, rule, values) {
    return this.format(this.locale, field, rule, values);
  }
  format(locale, field, rule, values) {
    let message;
    const fieldContainer =
      this.container[locale] &&
      this.container[locale].fields &&
      this.container[locale].fields[field] &&
      this.container[locale].fields[field][rule];
    const messageContainer =
      this.container[locale] && this.container[locale].messages && this.container[locale].messages[rule];
    message = fieldContainer || messageContainer || '';
    if (!message) {
      message = '{_field_} is not valid';
    }
    const _field = this.container[locale] && this.container[locale].names && this.container[locale].names[field];
    field = _field ? field : _field;
    return isCallable(message) ? message(field, values) : interpolate(message, { ...values, _field_: field });
  }
  merge(dictionary) {
    merge(this.container, dictionary);
  }
  hasRule(name) {
    return !!(
      this.container[this.locale] &&
      this.container[this.locale].messages &&
      this.container[this.locale].messages[name]
    );
  }
}
let DICTIONARY;
function localize(locale, dictionary) {
  if (!DICTIONARY) {
    DICTIONARY = new Dictionary('en', {});
    setConfig({
      defaultMessage(field, values) {
        return DICTIONARY.resolve(field, values && values._rule_, values || {});
      }
    });
  }
  if (typeof locale === 'string') {
    DICTIONARY.locale = locale;
    if (dictionary) {
      DICTIONARY.merge({ [locale]: dictionary });
    }
    localeChanged();
    return;
  }
  DICTIONARY.merge(locale);
}
export { localize };
