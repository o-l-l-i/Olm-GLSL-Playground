export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, cb) {
    (this.listeners[event] ||= []).push(cb);
  }

  off(event, cb) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((fn) => fn !== cb);
    if (this.listeners[event].length === 0) {
      delete this.listeners[event];
    }
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }

  removeAllListeners() {
    this.listeners = {};
  }
}
