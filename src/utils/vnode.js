import { isCallable, isNullOrUndefined, includes, isSpecified } from './index';
import { normalizeRules } from './rules';
import { RuleContainer } from '../extend';

export const isTextInput = vnode => {
  const attrs = vnode.props || vnode.el; // Changed: Use vnode.props instead of vnode.data.attrs
  if (vnode.type === 'input' && (!attrs || !attrs.type)) {
    // Changed: Use vnode.type instead of vnode.tag
    return true;
  }
  if (vnode.type === 'textarea') {
    // Changed: Use vnode.type instead of vnode.tag
    return true;
  }
  return includes(['text', 'password', 'search', 'email', 'tel', 'url', 'number'], attrs && attrs.type);
};

export function findModel(vnode) {
  if (!vnode.props) {
    // Changed: Use vnode.props instead of vnode.data
    return undefined;
  }
  const nonStandardVNodeData = vnode.props; // Changed: Use vnode.props instead of vnode.data
  if ('model' in nonStandardVNodeData) {
    return nonStandardVNodeData.model;
  }
  if (!vnode.props['v-model']) {
    // Changed: Check for v-model in vnode.props
    return undefined;
  }
  return { name: 'model', value: vnode.props['v-model'] }; // Changed: Return model object structure directly
}

export function findValue(vnode) {
  const model = findModel(vnode);
  if (model) {
    return { value: model.value }; // Changed: Access model.value directly
  }
  const config = findModelConfig(vnode);
  const prop = (config && config.prop) || 'modelValue';
  if (vnode.props && prop in vnode.props) {
    // Changed: Use vnode.props instead of componentOptions.propsData
    const propsDataWithValue = vnode.props; // Changed: Use vnode.props instead of componentOptions.propsData
    return { value: propsDataWithValue[prop] };
  }
  if (vnode.props && 'modelValue' in vnode.props) {
    // Changed: Use vnode.props instead of vnode.data.domProps
    return { value: vnode.props.modelValue };
  }
  return undefined;
}

function extractChildren(vnode) {
  if (Array.isArray(vnode)) {
    return vnode;
  }
  if (Array.isArray(vnode.children)) {
    return vnode.children;
  }
  if (vnode.type && Array.isArray(vnode.children)) {
    // Changed: Use vnode.type instead of vnode.componentOptions
    return vnode.children;
  }
  return [];
}

export function findInputNodes(vnode) {
  if (!Array.isArray(vnode) && findValue(vnode) !== undefined) {
    return [vnode];
  }
  const children = extractChildren(vnode);
  return children.reduce((nodes, node) => {
    const candidates = findInputNodes(node);
    if (candidates.length) {
      nodes.push(...candidates);
    }
    return nodes;
  }, []);
}

export function findModelConfig(vnode) {
  if (!vnode.type) return null; // Changed: Use vnode.type instead of vnode.componentOptions
  return vnode.type.model; // Changed: Access model directly from vnode.type
}

export function mergeVNodeListeners(obj, eventName, handler) {
  if (isNullOrUndefined(obj[eventName])) {
    obj[eventName] = [handler];
    return;
  }
  if (isCallable(obj[eventName]) && obj[eventName].fns) {
    const invoker = obj[eventName];
    invoker.fns = Array.isArray(invoker.fns) ? invoker.fns : [invoker.fns];
    if (!includes(invoker.fns, handler)) {
      invoker.fns.push(handler);
    }
    return;
  }
  if (isCallable(obj[eventName])) {
    const prev = obj[eventName];
    obj[eventName] = [prev];
  }
  if (Array.isArray(obj[eventName]) && !includes(obj[eventName], handler)) {
    obj[eventName].push(handler);
  }
}

export function addVNodeListener(vnode, eventName, handler) {
  if (!vnode.props) {
    vnode.props = {};
  }

  const eventKey = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;

  mergeVNodeListeners(vnode.props, eventKey, handler);
}

export function getInputEventName(vnode, model) {
  if (vnode.type) {
    // Changed: Use vnode.type instead of vnode.componentOptions
    const { event } = findModelConfig(vnode) || { event: 'update:modelValue' };
    return event;
  }
  if (model && model.modifiers && model.modifiers.lazy) {
    return 'change';
  }
  if (isTextInput(vnode)) {
    return 'update:modelValue';
  }
  return 'change';
}

export function isHTMLNode(node) {
  return includes(['input', 'select', 'textarea'], node.type); // Changed: Use node.type instead of node.tag
}

export function normalizeSlots(slots, ctx) {
  const acc = [];
  return Object.keys(slots).reduce((arr, key) => {
    slots[key].forEach(vnode => {
      if (!vnode.context) {
        vnode.context = ctx; // Changed: Set context directly on vnode
        if (!vnode.props) {
          // Changed: Use vnode.props instead of vnode.data
          vnode.props = {};
        }
        vnode.props.slot = key; // Changed: Set slot property directly on vnode.props
      }
    });
    return arr.concat(slots[key]);
  }, acc);
}

function resolveTextualRules(vnode) {
  const attrs = vnode.props; // Changed: Use vnode.props instead of vnode.data.attrs
  const rules = {};
  if (!attrs) return rules;
  if (attrs.type === 'email' && RuleContainer.getRuleDefinition('email')) {
    rules.email = ['multiple' in attrs];
  }
  if (attrs.pattern && RuleContainer.getRuleDefinition('regex')) {
    rules.regex = attrs.pattern;
  }
  if (attrs.maxlength >= 0 && RuleContainer.getRuleDefinition('max')) {
    rules.max = attrs.maxlength;
  }
  if (attrs.minlength >= 0 && RuleContainer.getRuleDefinition('min')) {
    rules.min = attrs.minlength;
  }
  if (attrs.type === 'number') {
    if (isSpecified(attrs.min) && RuleContainer.getRuleDefinition('min_value')) {
      rules.min_value = Number(attrs.min);
    }
    if (isSpecified(attrs.max) && RuleContainer.getRuleDefinition('max_value')) {
      rules.max_value = Number(attrs.max);
    }
  }
  return rules;
}

export function resolveRules(vnode) {
  const htmlTags = ['input', 'select', 'textarea'];
  const attrs = vnode.props; // Changed: Use vnode.props instead of vnode.data.attrs
  if (!includes(htmlTags, vnode.type) || !attrs) {
    // Changed: Use vnode.type instead of vnode.tag
    return {};
  }
  const rules = {};
  if ('required' in attrs && attrs.required !== false && RuleContainer.getRuleDefinition('required')) {
    rules.required = attrs.type === 'checkbox' ? [true] : true;
  }
  if (isTextInput(vnode)) {
    return normalizeRules({ ...rules, ...resolveTextualRules(vnode) });
  }
  return normalizeRules(rules);
}

export function normalizeChildren(context, slotProps) {
  if (context.$slots.default) {
    return context.$slots.default(slotProps) || [];
  }
  return context.$slots.default || [];
}
