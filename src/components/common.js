import { nextTick } from 'vue';
import { isCallable, debounce, isRefEqual } from '../utils';
import { modes } from '../modes';
import { findModel, getInputEventName, addVNodeListener, findValue } from '../utils/vnode';
import { EventBus } from '../eventBus';

function shouldValidate(ctx, value) {
  if (!ctx._ignoreImmediate && ctx.immediate) {
    return true;
  }
  if (!isRefEqual(ctx.value, value) && ctx.normalizedEvents.length) {
    return true;
  }
  if (ctx._needsValidation) {
    return true;
  }
  if (!ctx.initialized && value === undefined) {
    return true;
  }
  return false;
}
export function createValidationCtx(ctx) {
  return {
    ...ctx.flags,
    errors: ctx.errors,
    classes: ctx.classes,
    failedRules: ctx.failedRules,
    reset: () => ctx.reset(),
    validate: (...args) => ctx.validate(...args),
    ariaInput: {
      'aria-invalid': ctx.flags.invalid ? 'true' : 'false',
      'aria-required': ctx.isRequired ? 'true' : 'false',
      'aria-errormessage': `vee_${ctx.id}`
    },
    ariaMsg: {
      id: `vee_${ctx.id}`,
      'aria-live': ctx.errors.length ? 'assertive' : 'off'
    }
  };
}
export function onRenderUpdate(vm, value) {
  if (!vm.initialized) {
    vm.initialValue = value;
  }
  const validateNow = shouldValidate(vm, value);
  vm._needsValidation = false;
  vm.value = value;
  vm._ignoreImmediate = true;
  if (!validateNow) {
    return;
  }
  const validate = () => {
    if (vm.immediate || vm.flags.validated) {
      return triggerThreadSafeValidation(vm);
    }
    vm.validateSilent();
  };
  if (vm.initialized) {
    validate();
    return;
  }
  EventBus.on(`vee-validate-provider-mounted-${vm.vue2To3ProviderCounter}`, () => validate());
}
export function computeModeSetting(ctx) {
  const compute = isCallable(ctx.mode) ? ctx.mode : modes[ctx.mode];
  return compute(ctx);
}
export function triggerThreadSafeValidation(vm) {
  const pendingPromise = vm.validateSilent();
  vm._pendingValidation = pendingPromise;
  return pendingPromise.then(result => {
    if (pendingPromise === vm._pendingValidation) {
      vm.applyResult(result);
      vm._pendingValidation = undefined;
    }
    return result;
  });
}
export function createCommonHandlers(vm) {
  if (!vm.$veeOnInput) {
    vm.$veeOnInput = e => {
      vm.syncValue(e);
      vm.setFlags({ dirty: true, pristine: false });
    };
  }
  const onInput = vm.$veeOnInput;
  if (!vm.$veeOnBlur) {
    vm.$veeOnBlur = () => {
      vm.setFlags({ touched: true, untouched: false });
    };
  }
  const onBlur = vm.$veeOnBlur;
  let onValidate = vm.$veeHandler;
  const mode = computeModeSetting(vm);
  if (!onValidate || vm.$veeDebounce !== vm.debounce) {
    onValidate = debounce(() => {
      nextTick(() => {
        if (!vm._pendingReset) {
          triggerThreadSafeValidation(vm);
        }
        vm._pendingReset = false;
      });
    }, mode.debounce || vm.debounce);
    vm.$veeHandler = onValidate;
    vm.$veeDebounce = vm.debounce;
  }
  return { onInput, onBlur, onValidate };
}
export function addListeners(vm, node) {
  const value = findValue(node);
  vm._inputEventName = vm._inputEventName || getInputEventName(node, findModel(node));
  onRenderUpdate(vm, value && value.value);
  const { onInput, onBlur, onValidate } = createCommonHandlers(vm);
  addVNodeListener(node, vm._inputEventName, onInput);
  addVNodeListener(node, 'blur', onBlur);
  vm.normalizedEvents.forEach(evt => {
    addVNodeListener(node, evt, onValidate);
  });
  vm.initialized = true;
}
