class Event {
  /**
   * @type {Function}
   */
  _off;

  constructor(off) {
    this._off = off;
  }

  off() {
    this._off();
  }
}

class EventBusService {
  /**
   * @var {Map} events;
   */

  constructor() {
    this.events = new Map();
  }

  on(eventName, eventHandler) {
    const eventHandlers = this.events.get(eventName);
    if (eventHandlers) {
      eventHandlers.push(eventHandler);
    } else {
      this.events.set(eventName, [eventHandler]);
    }

    return new Event(() => this.off(eventName, eventHandler));
  }

  emit(eventName, ...eventData) {
    const eventHandlers = this.events.get(eventName) || [];

    return Promise.all(eventHandlers.map(async handler => handler(...eventData)));
  }

  off(eventName, handler) {
    const eventHandlers = this.events.get(eventName);
    if (!eventHandlers) {
      return;
    }
    if (!handler) {
      this.events.set(eventName, []);

      return;
    }
    const handlerIndex = eventHandlers.indexOf(handler);
    if (handlerIndex !== -1) {
      eventHandlers.splice(handlerIndex, 1);
    }
  }
}

const eventBusService = new EventBusService();

class EventBusProxy {
  constructor(eventName, eventHandler) {
    this.eventName = eventName;
    this.eventHandler = eventHandler;
    eventBusService.on(this.eventName, this.eventHandler);
  }

  off() {
    eventBusService.off(this.eventName, this.eventHandler);
  }
}

const handler = {
  get(target, prop) {
    if (prop === 'on') {
      return function (...args) {
        return new EventBusProxy(...args);
      };
    }
    return target[prop];
  }
};

export const EventBus = new Proxy(eventBusService, handler);
