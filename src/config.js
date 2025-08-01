const DEFAULT_CONFIG = {
  defaultMessage: `{_field_} is not valid.`,
  skipOptional: true,
  classes: {
    touched: 'touched',
    untouched: 'untouched',
    valid: 'valid',
    invalid: 'invalid',
    pristine: 'pristine',
    dirty: 'dirty'
  },
  bails: true,
  mode: 'aggressive',
  useConstraintAttrs: true
};
export let currentConfig = { ...DEFAULT_CONFIG };
export const getConfig = () => currentConfig;
export const setConfig = newConf => {
  currentConfig = { ...currentConfig, ...newConf };
};
export const configure = cfg => {
  setConfig(cfg);
};
