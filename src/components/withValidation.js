import { h } from 'vue';
import { ValidationProvider } from './Provider';
import { identity } from '../utils';
import {
  findModel,
  findModelConfig,
  mergeVNodeListeners,
  getInputEventName,
  normalizeSlots,
  findValue
} from '../utils/vnode';
import { createValidationCtx, onRenderUpdate, createCommonHandlers } from './common';
import { getListeners } from '../utils/components';
export function withValidation(component, mapProps = identity) {
  const options = 'options' in component ? component.options : component;
  const providerOpts = ValidationProvider.options;
  const hoc = {
    name: `${options.name || 'AnonymousHoc'}WithValidation`,
    props: { ...providerOpts.props },
    data: () => providerOpts.data,
    computed: { ...providerOpts.computed },
    methods: { ...providerOpts.methods },
    beforeUnmount: providerOpts.beforeUnmount,
    inject: providerOpts.inject
  };
  const eventName = (options && options.model && options.model.event) || 'update:modelValue';
  hoc.render = function () {
    this.registerField();
    const vctx = createValidationCtx(this);
    const listeners = { ...getListeners(this.$attrs) };
    const model = findModel(this.$vnode);
    this._inputEventName = this._inputEventName || getInputEventName(this.$vnode, model);
    const value = findValue(this.$vnode);
    onRenderUpdate(this, value && value.value);
    const { onInput, onBlur, onValidate } = createCommonHandlers(this);
    mergeVNodeListeners(listeners, eventName, onInput);
    mergeVNodeListeners(listeners, 'blur', onBlur);
    this.normalizedEvents.forEach(evt => {
      mergeVNodeListeners(listeners, evt, onValidate);
    });
    const { prop } = findModelConfig(this.$vnode) || { prop: 'modelValue' };
    const props = { ...this.$attrs, ...{ [prop]: model && model.value }, ...mapProps(vctx) };
    return h(
      options,
      {
        attrs: this.$attrs,
        props,
        on: listeners,
        slots: this.$slots
      },
      normalizeSlots(this.$slots, this.vnode.ctx)
    );
  };
  return hoc;
}
