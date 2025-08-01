import { setConfig } from './config';
import { isCallable } from './utils';
const aggressive = () => ({
  on: ['update:modelValue', 'blur']
});
const lazy = () => ({
  on: ['change', 'blur']
});
const eager = ({ errors }) => {
  if (errors.length) {
    return {
      on: ['update:modelValue', 'change']
    };
  }
  return {
    on: ['change', 'blur']
  };
};
const passive = () => ({
  on: []
});
export const modes = {
  aggressive,
  eager,
  passive,
  lazy
};
export const setInteractionMode = (mode, implementation) => {
  setConfig({ mode });
  if (!implementation) {
    return;
  }
  if (!isCallable(implementation)) {
    throw new Error('A mode implementation must be a function');
  }
  modes[mode] = implementation;
};
