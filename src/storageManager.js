export class StorageManager {
  constructor(prefix = "") {
    this.prefix = prefix ? `${prefix}.` : "";
  }

  _key(key) {
    return this.prefix + key;
  }

  get(key, fallback = null) {
    const k = this._key(key);
    try {
      const val = localStorage.getItem(k);
      return val !== null ? val : fallback;
    } catch (e) {
      console.warn(`StorageManager.get failed for ${k}:`, e);
      return fallback;
    }
  }

  set(key, value) {
    const k = this._key(key);
    try {
      localStorage.setItem(k, value);
    } catch (e) {
      console.warn(`StorageManager.set failed for ${k}:`, e);
    }
  }

  remove(key) {
    const k = this._key(key);
    try {
      localStorage.removeItem(k);
    } catch (e) {
      console.warn(`StorageManager.remove failed for ${k}:`, e);
    }
  }
}
