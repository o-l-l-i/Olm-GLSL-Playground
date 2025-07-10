export class TextureSlotPersistence {
  constructor(storage) {
    this.storage = storage;
  }

  save(slotId, dataURL, name, wrapMode, sourceType = "data") {
    this.storage.set(`${slotId}.dataURL`, dataURL);
    this.storage.set(`${slotId}.name`, name);
    this.storage.set(`${slotId}.wrapMode`, wrapMode);
    this.storage.set(`${slotId}.sourceType`, sourceType);
  }

  load(slotId) {
    const name = this.storage.get(`${slotId}.name`);
    const wrapMode = this.storage.get(`${slotId}.wrapMode`);
    const sourceType = this.storage.get(`${slotId}.sourceType`);
    let source = null;

    if (sourceType === "data") {
      source = this.storage.get(`${slotId}.dataURL`);
    } else if (sourceType === "url") {
      source = this.storage.get(`${slotId}.dataURL`);
    }

    return {
      name,
      wrapMode,
      sourceType,
      source,
    };
  }

  saveWrapMode(slotId, wrapMode) {
    this.storage.set(`${slotId}`, wrapMode);
  }

  getWrapMode(slotId) {
    return this.storage.get(`${slotId}`, "REPEAT");
  }

  clear(slotId) {
    this.storage.remove(`${slotId}.dataURL`);
    this.storage.remove(`${slotId}.name`);
    this.storage.remove(`${slotId}.wrapMode`);
    this.storage.remove(`${slotId}.sourceType`);
  }

  clearSlots(slotIds = ["A", "B"]) {
    slotIds.forEach((slotId) => this.clear(slotId));
  }
}
