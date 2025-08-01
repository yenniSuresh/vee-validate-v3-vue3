import { EventBus } from './eventBus';

export function localeChanged() {
  EventBus.emit('change:locale');
}
