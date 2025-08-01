import { defineComponent, h, getCurrentInstance } from 'vue';
import { values, findIndex, debounce, createFlags } from '../utils';
import { normalizeChildren } from '../utils/vnode';
import { getListeners } from '../utils/components';
const FLAGS_STRATEGIES = [
  ['pristine', 'every'],
  ['dirty', 'some'],
  ['touched', 'some'],
  ['untouched', 'every'],
  ['valid', 'every'],
  ['invalid', 'some'],
  ['pending', 'some'],
  ['validated', 'every'],
  ['changed', 'some'],
  ['passed', 'every'],
  ['failed', 'some']
];
let OBSERVER_COUNTER = 0;
function data() {
  const refs = {};
  const errors = {};
  const flags = createObserverFlags();
  const fields = {};
  const observers = [];
  return {
    id: '',
    refs,
    observers,
    errors,
    flags,
    fields
  };
}
function provideSelf() {
  return {
    $_veeObserver: this
  };
}
export const ValidationObserver = defineComponent({
  name: 'ValidationObserver',
  provide: provideSelf,
  inject: {
    $_veeObserver: {
      from: '$_veeObserver',
      default() {
        const _i = getCurrentInstance();
        if (!_i.vnode.ctx.$_veeObserver) {
          return null;
        }
        return _i.vnode.ctx.$_veeObserver;
      }
    }
  },
  props: {
    tag: {
      type: String,
      default: 'span'
    },
    vid: {
      type: String,
      default() {
        return `obs_${OBSERVER_COUNTER++}`;
      }
    },
    slim: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data,
  created() {
    this.id = this.vid;
    register(this);
    const onChange = debounce(({ errors, flags, fields }) => {
      this.errors = errors;
      this.flags = flags;
      this.fields = fields;
    }, 16);
    this.$watch(computeObserverState, onChange);
  },
  activated() {
    register(this);
  },
  deactivated() {
    unregister(this);
  },
  beforeUnmount() {
    unregister(this);
  },
  methods: {
    observe(subscriber, kind = 'provider') {
      if (kind === 'observer') {
        this.observers.push(subscriber);
        return;
      }
      this.refs = { ...this.refs, ...{ [subscriber.id]: subscriber } };
    },
    unobserve(id, kind = 'provider') {
      if (kind === 'provider') {
        const provider = this.refs[id];
        if (!provider) {
          return;
        }

        delete this.refs[id];

        return;
      }
      const idx = findIndex(this.observers, o => o.id === id);
      if (idx !== -1) {
        this.observers.splice(idx, 1);
      }
    },
    async validateWithInfo({ silent = false } = {}) {
      const results = await Promise.all([
        ...values(this.refs)
          .filter(r => !r.disabled)
          .map(ref => ref[silent ? 'validateSilent' : 'validate']().then(r => r.valid)),
        ...this.observers.filter(o => !o.disabled).map(obs => obs.validate({ silent }))
      ]);
      const isValid = results.every(r => r);
      const { errors, flags, fields } = computeObserverState.call(this);
      this.errors = errors;
      this.flags = flags;
      this.fields = fields;
      return {
        errors,
        flags,
        fields,
        isValid
      };
    },
    async validate({ silent = false } = {}) {
      const { isValid } = await this.validateWithInfo({ silent });
      return isValid;
    },
    async handleSubmit(cb) {
      const isValid = await this.validate();
      if (!isValid || !cb) {
        return;
      }
      return cb();
    },
    reset() {
      return [...values(this.refs), ...this.observers].forEach(ref => ref.reset());
    },
    setErrors(errors) {
      Object.keys(errors).forEach(key => {
        const provider = this.refs[key];
        if (!provider) return;
        let errorArr = errors[key] || [];
        errorArr = typeof errorArr === 'string' ? [errorArr] : errorArr;
        provider.setErrors(errorArr);
      });
      this.observers.forEach(observer => {
        observer.setErrors(errors);
      });
    }
  },
  render() {
    const children = normalizeChildren(this, prepareSlotProps(this));

    return this.slim && children.length <= 1 ? children[0] : h(this.tag, { on: getListeners(this.$attrs) }, children);
  }
});
function unregister(vm) {
  if (vm.$_veeObserver) {
    vm.$_veeObserver.unobserve(vm.id, 'observer');
  }
}
function register(vm) {
  if (vm.$_veeObserver) {
    vm.$_veeObserver.observe(vm, 'observer');
  }
}
function prepareSlotProps(vm) {
  return {
    ...vm.flags,
    errors: vm.errors,
    fields: vm.fields,
    validate: vm.validate,
    validateWithInfo: vm.validateWithInfo,
    passes: vm.handleSubmit,
    handleSubmit: vm.handleSubmit,
    reset: vm.reset
  };
}
function createObserverFlags() {
  return {
    ...createFlags(),
    valid: true,
    invalid: false
  };
}
function computeObserverState() {
  const vms = [...values(this.refs), ...this.observers.filter(o => !o.disabled)];
  let errors = {};
  const flags = createObserverFlags();
  let fields = {};
  const length = vms.length;
  for (let i = 0; i < length; i++) {
    const vm = vms[i];
    if (Array.isArray(vm.errors)) {
      errors[vm.id] = vm.errors;
      fields[vm.id] = {
        id: vm.id,
        name: vm.name,
        failedRules: vm.failedRules,
        ...vm.flags
      };
      continue;
    }
    errors = { ...errors, ...vm.errors };
    fields = { ...fields, ...vm.fields };
  }
  FLAGS_STRATEGIES.forEach(([flag, method]) => {
    flags[flag] = vms[method](vm => vm.flags[flag]);
  });
  return { errors, flags, fields };
}
