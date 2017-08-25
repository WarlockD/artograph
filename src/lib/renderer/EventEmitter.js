export default class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(eventName, listener) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(listener);
  }

  off(eventName, listener) {
    const listeners = this.listeners[eventName];

    if (!listeners) throw new Error(`There is no listeners for "${eventName}"`);

    this.listeners[eventName] = listeners.filter((existingListener) => {
      return existingListener !== listener;
    });
  }

  emit(eventName, ...params) {
    const listeners = this.listeners[eventName];

    if (!listeners) return;

    for (let i = 0, len = listeners.length; i < len; i += 1) {
      const listener = listeners[i];
      listener(...params);
    }
  }
}
