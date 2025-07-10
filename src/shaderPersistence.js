export class ShaderPersistence {
  constructor(storage) {
    this.storage = storage;
  }

  saveSim(simSource) {
    this.storage.set("shader.sim", simSource);
  }

  loadSim() {
    const simSource = this.storage.get("shader.sim") || "";
    return simSource;
  }

  saveDisplay(displaySource) {
    this.storage.set("shader.display", displaySource);
  }

  loadDisplay() {
    const displaySource = this.storage.get("shader.display") || "";
    return displaySource;
  }

  clearAll() {
    this.storage.remove("shader.sim");
    this.storage.remove("shader.display");
  }
}
