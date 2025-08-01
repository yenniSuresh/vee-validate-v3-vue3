import { defineComponent, getCurrentInstance, h } from 'vue';
import isEqual from 'fast-deep-equal';
import { normalizeRules, extractLocators } from '../utils/rules';
import { normalizeEventValue } from '../utils/events';
import { findInputNodes, normalizeChildren, resolveRules, isHTMLNode } from '../utils/vnode';
import { isCallable, isNullOrUndefined, createFlags, includes, isLocator } from '../utils';
import { getConfig } from '../config';
import { validate } from '../validate';
import { RuleContainer } from '../extend';
import { addListeners, computeModeSetting, createValidationCtx, triggerThreadSafeValidation } from './common';
import '../localeChanged';
import { EventBus } from '../eventBus';

let PROVIDER_COUNTER = 0;
let VUE_2_to_3_PROVIDER_COUNTER = 0;
function data() {
  const errors = [];
  const fieldName = '';
  const defaultValues = {
    errors,
    value: undefined,
    initialized: false,
    initialValue: undefined,
    flags: createFlags(),
    failedRules: {},
    isActive: true,
    fieldName,
    id: '',
    vue2To3ProviderCounter: 0
  };
  return defaultValues;
}
export const ValidationProvider = defineComponent({
  name: 'ValidationProvider',
  inject: {
    $_veeObserver: {
      from: '$_veeObserver',
      default() {
        const _i = getCurrentInstance();
        if (!_i.vnode.ctx.$_veeObserver) {
          _i.vnode.ctx.$_veeObserver = createObserver();
        }
        return _i.vnode.ctx.$_veeObserver;
      }
    }
  },
  props: {
    vid: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: null
    },
    mode: {
      type: [String, Function],
      default: () => getConfig().mode
    },
    rules: {
      type: [Object, String],
      default: null
    },
    immediate: {
      type: Boolean,
      default: false
    },
    bails: {
      type: Boolean,
      default: () => getConfig().bails
    },
    skipIfEmpty: {
      type: Boolean,
      default: () => getConfig().skipOptional
    },
    debounce: {
      type: Number,
      default: 0
    },
    tag: {
      type: String,
      default: 'span'
    },
    slim: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    customMessages: {
      type: Object,
      default() {
        return {};
      }
    },
    detectInput: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  data,
  computed: {
    fieldDeps() {
      return Object.keys(this.normalizedRules).reduce((acc, rule) => {
        const deps = extractLocators(this.normalizedRules[rule]).map(dep =>
          isLocator(dep) ? dep.__locatorRef : dep.slice(1)
        );
        acc.push(...deps);
        deps.forEach(depName => {
          watchCrossFieldDep(this, depName);
        });
        return acc;
      }, []);
    },
    normalizedEvents() {
      const { on } = computeModeSetting(this);
      return (on || []).map(e => {
        if (e === 'update:modelValue') {
          return this._inputEventName;
        }
        return e;
      });
    },
    isRequired() {
      const rules = { ...this._resolvedRules, ...this.normalizedRules };
      const isRequired = Object.keys(rules).some(RuleContainer.isRequireRule);
      this.flags.required = !!isRequired;
      return isRequired;
    },
    classes() {
      const names = getConfig().classes;
      return computeClassObj(names, this.flags);
    },
    normalizedRules() {
      return normalizeRules(this.rules);
    }
  },
  watch: {
    rules: {
      deep: true,
      handler(val, oldVal) {
        this._needsValidation = !isEqual(val, oldVal);
      }
    }
  },
  created() {
    VUE_2_to_3_PROVIDER_COUNTER++;
    this.vue2To3ProviderCounter = VUE_2_to_3_PROVIDER_COUNTER;
  },
  mounted() {
    EventBus.on('change:locale', () => this.onLocaleChanged());
    EventBus.emit(`vee-validate-provider-mounted-${this.vue2To3ProviderCounter}`);
  },
  beforeUnmount() {
    this.$_veeObserver.unobserve(this.id);
    EventBus.off('change:locale', () => this.onLocaleChanged());
    EventBus.off(`vee-validate-provider-mounted-${this.vue2To3ProviderCounter}`);
  },
  activated() {
    this.isActive = true;
  },
  deactivated() {
    this.isActive = false;
  },
  methods: {
    onLocaleChanged() {
      if (!this.flags.validated) {
        return;
      }
      const regenerateMap = this._regenerateMap;
      if (regenerateMap) {
        const errors = [];
        const failedRules = {};
        Object.keys(regenerateMap).forEach(rule => {
          const msg = regenerateMap[rule]();
          errors.push(msg);
          failedRules[rule] = msg;
        });
        this.applyResult({ errors, failedRules, regenerateMap });
        return;
      }
      this.validate();
    },
    setFlags(flags) {
      Object.keys(flags).forEach(flag => {
        this.flags[flag] = flags[flag];
      });
    },
    syncValue(v) {
      const value = normalizeEventValue(v);
      this.value = value;
      this.flags.changed = !isEqual(this.initialValue, value);
    },
    reset() {
      this.errors = [];
      this.initialValue = this.value;
      const flags = createFlags();
      flags.required = this.isRequired;
      this.setFlags(flags);
      this.failedRules = {};
      this.validateSilent();
      this._pendingValidation = undefined;
      this._pendingReset = true;
      setTimeout(() => {
        this._pendingReset = false;
      }, this.debounce);
    },
    async validate(...args) {
      if (args.length > 0) {
        this.syncValue(args[0]);
      }
      return triggerThreadSafeValidation(this);
    },
    async validateSilent() {
      this.setFlags({ pending: true });
      const rules = { ...this._resolvedRules, ...this.normalizedRules };
      Object.defineProperty(rules, '_$$isNormalized', {
        value: true,
        writable: false,
        enumerable: false,
        configurable: false
      });
      const result = await validate(this.value, rules, {
        name: this.name || this.fieldName,
        ...createLookup(this),
        bails: this.bails,
        skipIfEmpty: this.skipIfEmpty,
        isInitial: !this.initialized,
        customMessages: this.customMessages
      });
      this.setFlags({
        pending: false,
        valid: result.valid,
        invalid: !result.valid
      });
      if (result.required !== undefined) {
        this.setFlags({
          required: result.required
        });
      }
      return result;
    },
    setErrors(errors) {
      this.applyResult({ errors, failedRules: {} });
    },
    applyResult({ errors, failedRules, regenerateMap }) {
      this.errors = errors;
      this._regenerateMap = regenerateMap;
      this.failedRules = { ...(failedRules || {}) };
      this.setFlags({
        valid: !errors.length,
        passed: !errors.length,
        invalid: !!errors.length,
        failed: !!errors.length,
        validated: true,
        changed: !isEqual(this.value, this.initialValue)
      });
    },
    registerField() {
      updateRenderingContextRefs(this);
    },
    checkComputesRequiredState() {
      const rules = { ...this._resolvedRules, ...this.normalizedRules };
      const isRequired = Object.keys(rules).some(RuleContainer.isRequireRule);
      return isRequired;
    }
  },
  render() {
    this.registerField();
    const ctx = createValidationCtx(this);
    const children = normalizeChildren(this, ctx);
    if (this.detectInput) {
      const inputs = findInputNodes(children);
      if (inputs.length) {
        inputs.forEach((input, idx) => {
          if (!includes(['checkbox', 'radio'], input.data && input.data.attrs && input.data.attrs.type) && idx > 0) {
            return;
          }
          const resolved = getConfig().useConstraintAttrs ? resolveRules(input) : {};
          if (!isEqual(this._resolvedRules, resolved)) {
            this._needsValidation = true;
          }
          if (isHTMLNode(input)) {
            this.fieldName =
              (input.data && input.data.attrs && input.data.attrs.name) ||
              (input.data && input.data.attrs && input.data.attrs.id);
          }
          this._resolvedRules = resolved;
          addListeners(this, input);
        });
      }
    }
    return this.slim && children.length <= 1 ? children[0] : h(this.tag, children);
  }
});
function computeClassObj(names, flags) {
  const acc = {};
  const keys = Object.keys(flags);
  const length = keys.length;
  for (let i = 0; i < length; i++) {
    const flag = keys[i];
    const className = (names && names[flag]) || flag;
    const value = flags[flag];
    if (isNullOrUndefined(value)) {
      continue;
    }
    if ((flag === 'valid' || flag === 'invalid') && !flags.validated) {
      continue;
    }
    if (typeof className === 'string') {
      acc[className] = value;
    } else if (Array.isArray(className)) {
      className.forEach(cls => {
        acc[cls] = value;
      });
    }
  }
  return acc;
}
function createLookup(vm) {
  const providers = vm.$_veeObserver.refs;
  const reduced = {
    names: {},
    values: {}
  };
  return vm.fieldDeps.reduce((acc, depName) => {
    if (!providers[depName]) {
      return acc;
    }
    acc.values[depName] = providers[depName].value;
    acc.names[depName] = providers[depName].name;
    return acc;
  }, reduced);
}
function extractId(vm) {
  if (vm.vid) {
    return vm.vid;
  }
  if (vm.name) {
    return vm.name;
  }
  if (vm.id) {
    return vm.id;
  }
  if (vm.fieldName) {
    return vm.fieldName;
  }
  PROVIDER_COUNTER++;
  return `_vee_${PROVIDER_COUNTER}`;
}
function updateRenderingContextRefs(vm) {
  const providedId = extractId(vm);
  const { id } = vm;
  if (!vm.isActive || (id === providedId && vm.$_veeObserver.refs[id])) {
    return;
  }
  if (id !== providedId && vm.$_veeObserver.refs[id] === vm) {
    vm.$_veeObserver.unobserve(id);
  }
  vm.id = providedId;
  vm.$_veeObserver.observe(vm);
}
function createObserver() {
  return {
    refs: {},
    observe(vm) {
      this.refs[vm.id] = vm;
    },
    unobserve(id) {
      delete this.refs[id];
    }
  };
}
function watchCrossFieldDep(ctx, depName, withHooks = true) {
  const providers = ctx.$_veeObserver.refs;
  if (!ctx._veeWatchers) {
    ctx._veeWatchers = {};
  }
  if (!providers[depName] && withHooks) {
    EventBus.on(`vee-validate-provider-mounted-${ctx.vue2To3ProviderCounter}`, () => {
      watchCrossFieldDep(ctx, depName, false);
    });
  }
  if (!isCallable(ctx._veeWatchers[depName]) && providers[depName]) {
    ctx._veeWatchers[depName] = providers[depName].$watch('value', () => {
      const isComputesRequired = ctx.checkComputesRequiredState();
      if (ctx.flags.validated) {
        ctx._needsValidation = true;
        ctx.validate();
      }
      if (isComputesRequired && !ctx.flags.validated) {
        ctx.validateSilent();
      }
    });
  }
}
