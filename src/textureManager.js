import { StorageManager } from "../src/storageManager.js";
import { WrapModes } from "./constants.js";
import { TextureSlotPersistence } from "./textureSlotPersistence.js";

export class TextureManager {
  constructor(eventBus, slots = ["A", "B"]) {
    this.eventBus = eventBus;
    this._eventBusUnsubscribers = [];
    this.textureSlots = slots;
    this.textureSlotData = {};
    this.textureFileInputHandlers = {};
    this.textureNames = {};
    this.storage = new StorageManager();
    this.texturePersistence = new TextureSlotPersistence(this.storage);
    this.initTextureSlots();
    this.initEventListeners();
  }

  initEventListeners() {
    this._onResetTextures = () => this.resetTextures();
    this._onResetTexture = ({ slot }) => this.resetTexture(slot);
    this._onLoadSavedTextures = () => this.loadSavedTextures();

    this._onSetWrapMode = ({ slot, wrapMode }) =>
      this.setTextureWrapMode(slot, wrapMode);
    this._onGetWrapMode = ({ slot }) => {
      const wrapMode = this.getWrapMode(slot);
      this.eventBus.emit("texture:wrapModeResponse", { slot, wrapMode });
    };
    this._onPersistWrapMode = ({ slot, wrapMode }) =>
      this.persistWrapMode(slot, wrapMode);

    this._onLoadFromURL = ({ url, slot, wrapMode }) =>
      this.loadTextureFromURL(url, slot, wrapMode);

    this._onPresetLoadData = ({ simSource, displaySource, textures }) => {
      this.eventBus.emit("shader:loadSim", simSource);
      this.eventBus.emit("shader:loadDisplay", displaySource);
      this.resetTextures();

      if (textures) {
        ["A", "B"].forEach((slotId) => {
          const texUrl = textures[`texture${slotId}DataURL`];
          const wrapMode =
            textures[`texture${slotId}WrapMode`] || WrapModes.REPEAT;
          if (texUrl) {
            const isDataURL = texUrl.startsWith("data:");
            const name = isDataURL
              ? `texture_${slotId}_from_data.png`
              : new URL(texUrl, window.location.href).pathname.split("/").pop();
            this.loadTextureFromURL(texUrl, slotId, wrapMode);
            this.setTextureWrapMode(slotId, wrapMode);
            this.texturePersistence.save(slotId, texUrl, name, wrapMode, "url");
          } else {
            console.warn(`No texture URL found for slot ${slotId}`);
          }
        });
      }
    };

    this.eventBus.on("textures:reset", this._onResetTextures);
    this.eventBus.on("texture:reset", this._onResetTexture);
    this.eventBus.on("texture:setWrapMode", this._onSetWrapMode);
    this.eventBus.on("texture:persistWrapMode", this._onPersistWrapMode);
    this.eventBus.on("texture:getWrapMode", this._onGetWrapMode);
    this.eventBus.on("textures:loadFromURL", this._onLoadFromURL);
    this.eventBus.on("preset:loadData", this._onPresetLoadData);
    this.eventBus.on("texture:loadSavedTextures", this._onLoadSavedTextures);

    this._eventBusUnsubscribers = [
      () => this.eventBus.off("textures:reset", this._onResetTextures),
      () => this.eventBus.off("texture:reset", this._onResetTexture),
      () => this.eventBus.off("texture:setWrapMode", this._onSetWrapMode),
      () =>
        this.eventBus.off("texture:persistWrapMode", this._onPersistWrapMode),
      () => this.eventBus.off("texture:getWrapMode", this._onGetWrapMode),
      () => this.eventBus.off("textures:loadFromURL", this._onLoadFromURL),
      () => this.eventBus.off("preset:loadData", this._onPresetLoadData),
      () =>
        this.eventBus.off(
          "texture:loadSavedTextures",
          this._onLoadSavedTextures
        ),
    ];
  }

  resizeImage(dataURL, maxSize = 512) {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        if (width <= maxSize && height <= maxSize) {
          return resolve(dataURL);
        }

        const scale = Math.min(maxSize / width, maxSize / height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const resizedDataURL = canvas.toDataURL("image/png");
        resolve(resizedDataURL);
      };
      img.src = dataURL;
    });
  }

  initTextureSlots() {
    this.textureSlots.forEach((id) => {
      const preview = /** @type {HTMLImageElement} */ (
        document.getElementById(`texturePreview${id}`)
      );
      const nameInput = /** @type {HTMLInputElement} */ (
        document.getElementById(`textureName${id}`)
      );
      const input = document.getElementById(`uploadTexture${id}`);
      const slot = {
        id,
        input,
        preview,
        nameInput,
        storageKey: `${id}.dataURL`,
        nameKey: `${id}.name`,
        wrapModeKey: `${id}.wrapMode`,
      };
      this.textureSlotData[id] = slot;

      const handler = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();

        reader.onload = (ev) => {
          const result = ev.target?.result;

          if (typeof result === "string") {
            this.resizeImage(result, 512).then((resizedDataURL) => {
              if (!resizedDataURL) return;
              const wrapMode = this.getWrapMode(id);

              this.texturePersistence.save(
                id,
                resizedDataURL,
                file.name,
                wrapMode,
                "url"
              );
              if (preview instanceof HTMLImageElement) preview.src = result;
              nameInput.value = file.name;
              this.loadTextureFromURL(resizedDataURL, id, wrapMode);

              this.textureNames[slot.storageKey] = file.name;
            });
          }
        };
        reader.readAsDataURL(file);
      };
      this.textureFileInputHandlers[id] = handler;
      if (input) input.addEventListener("change", handler);
    });
  }

  loadSavedTextures() {
    this.textureSlots.forEach((id) => {
      const slot = this.textureSlotData[id];

      if (!slot) {
        return;
      }

      const { source, name, wrapMode, sourceType } =
        this.texturePersistence.load(id);

      if (source) {
        if (slot.preview instanceof HTMLImageElement) slot.preview.src = source;
        if (slot.nameInput instanceof HTMLInputElement)
          slot.nameInput.value = name || "";

        this.loadTextureFromURL(source, id, wrapMode);
      }
    });
  }

  resetTexture(slotId, resetStorage = true) {
    const slot = this.textureSlotData[slotId];
    if (!slot) return;

    if (slot.input instanceof HTMLInputElement) slot.input.value = "";
    if (slot.nameInput instanceof HTMLInputElement) slot.nameInput.value = "";
    if (slot.preview instanceof HTMLImageElement) {
      slot.preview.src =
        "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    }

    if (resetStorage) {
      this.texturePersistence.clear(slotId);
    }

    this.eventBus.emit("texture:releaseRequested", slotId);

    this.setTextureWrapMode(slotId, WrapModes.REPEAT);
  }

  resetTextures() {
    this.textureSlots.forEach((id) => this.resetTexture(id));
  }

  setTextureWrapMode(slotId, wrapMode) {
    this.eventBus.emit("texture:wrapModeChanged", { slot: slotId, wrapMode });
  }

  persistWrapMode(slotId, wrapMode) {
    const slot = this.textureSlotData[slotId];
    if (!slot) return;
    this.texturePersistence.saveWrapMode(slot.wrapModeKey, wrapMode);
  }

  getWrapMode(slotId) {
    const slot = this.textureSlotData[slotId];
    if (!slot) return WrapModes.REPEAT;
    const mode = this.texturePersistence.getWrapMode(slot.wrapModeKey);
    return mode;
  }

  loadTextureFromURL(url, slotId, wrapMode) {
    const slot = this.textureSlotData[slotId];
    if (!slot || !slot.preview) return;

    const img = new Image();

    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (slot.preview instanceof HTMLImageElement) slot.preview.src = url;

      this.eventBus.emit("texture:loaded", {
        slot: slotId,
        dataURL: url,
        image: img,
        wrapMode,
      });
    };
    img.onerror = () => {
      console.error(`Failed to load texture image at ${url}`);
      this.eventBus.emit("texture:loaded", {
        slot: slotId,
        dataURL: url,
        image: null,
        wrapMode,
      });
    };
    img.src = url;
  }

  dispose() {
    this.textureSlots.forEach((id) => {
      const slot = this.textureSlotData[id];
      const handler = this.textureFileInputHandlers[id];

      if (slot?.input && handler) {
        slot.input.removeEventListener("change", handler);
      }

      this.resetTexture(id, false);
    });

    this._eventBusUnsubscribers.forEach((off) => off());
    this._eventBusUnsubscribers = [];
  }
}
