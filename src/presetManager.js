export class PresetManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this._eventBusUnsubscribers = [];
    this.init();
  }

  init() {
    this._onPresetLoad = (presetData) => {
      this.eventBus.emit("preset:loadData", presetData);
    };
    this.eventBus.on("preset:load", this._onPresetLoad);

    this._eventBusUnsubscribers = [
      () => this.eventBus.off("preset:load", this._onPresetLoad),
    ];
  }

  dispose() {
    this._eventBusUnsubscribers?.forEach((off) => off());
    this._eventBusUnsubscribers = [];
  }
}
