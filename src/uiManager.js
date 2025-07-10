import { sanitizeShaderSource } from "./utils.js";
import { shaderPresets } from "../src/shaderPresets.js";

export class UIManager {
  constructor(eventBus, canvas) {
    this.eventBus = eventBus;
    this.canvas = canvas;
    this._listenerRegistry = [];
    this._eventBusUnsubscribers = [];
    this.querySelectors();
    this.setupDOMListeners();
    this.setupEventBusListeners();
    this.populatePresetDropdown(shaderPresets);
    this.initializeUIState();
  }

  querySelectors() {
    this.errorPanel = document.getElementById("errorPanel");
    this.errorContent = document.getElementById("errorContent");
    this.canvasInfo = document.getElementById("canvasInfo");
    this.presetSelect = document.getElementById("presetSelect");
    this.resetButton = document.getElementById("resetShaders");
    this.resetTextureAButton = document.querySelector('[data-texture="A"]');
    this.resetTextureBButton = document.querySelector('[data-texture="B"]');
    this.wrapModeASelect = document.getElementById("wrapModeA");
    this.wrapModeBSelect = document.getElementById("wrapModeB");
    this.errorCloseBtn = document.getElementById("errorCloseBtn");
  }

  addListener(element, eventType, handler) {
    if (!element || !eventType || !handler) return;
    element.addEventListener(eventType, handler);
    this._listenerRegistry.push(() =>
      element.removeEventListener(eventType, handler)
    );
  }

  setupDOMListeners() {
    if (this.resetButton) {
      this.addListener(this.resetButton, "click", () => {
        this.eventBus.emit("ui:resetClick");
      });
    }

    if (this.resetTextureAButton) {
      this.addListener(this.resetTextureAButton, "click", () => {
        this.eventBus.emit("ui:resetTexture", { slotId: "A" });
        this.eventBus.emit("texture:releaseRequested", { slotId: "A" });
      });
    }

    if (this.resetTextureBButton) {
      this.addListener(this.resetTextureBButton, "click", () => {
        this.eventBus.emit("ui:resetTexture", { slotId: "B" });
        this.eventBus.emit("texture:releaseRequested", { slotId: "B" });
      });
    }

    if (this.wrapModeASelect) {
      this.addListener(this.wrapModeASelect, "change", (e) => {
        this.eventBus.emit("ui:wrapModeChange", {
          slot: "A",
          wrapMode: e.target.value,
        });
      });
    }

    if (this.wrapModeBSelect) {
      this.addListener(this.wrapModeBSelect, "change", (e) => {
        this.eventBus.emit("ui:wrapModeChange", {
          slot: "B",
          wrapMode: e.target.value,
        });
      });
    }

    if (this.presetSelect) {
      this.addListener(this.presetSelect, "change", (e) => {
        this.handlePresetSelection(e.target.value);
      });
    }

    if (this.errorCloseBtn) {
      this.addListener(this.errorCloseBtn, "click", () =>
        this.hideErrorPanel()
      );
    }

    if (this.canvas) {
      this.addListener(this.canvas, "mousemove", (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
        this.eventBus.emit("mouse:moved", { x: mouseX, y: mouseY });
      });

      this.addListener(this.canvas, "mouseout", () => {
        this.eventBus.emit("mouse:moved", { x: 0, y: 0 });
      });
    }
  }

  setupEventBusListeners() {
    this._updateErrorPanelHandler = ({ simErrors, displayErrors }) => {
      this.updateErrorPanel(simErrors, displayErrors);
    };
    this._wrapModeChangedHandler = ({ slot, wrapMode }) => {
      this.setTextureWrapModeDropdown(slot, wrapMode);
    };
    this._wrapModeResponseHandler = ({ slot, wrapMode }) => {
      this.setTextureWrapModeDropdown(slot, wrapMode);
    };

    this._updateCanvasInfoHandler = ({
      canvas,
      meta: { time, frameCount },
    }) => {
      this.updateCanvasInfo(canvas, time, frameCount);
    };
    this.eventBus.on("errorPanel:update", this._updateErrorPanelHandler);
    this.eventBus.on("texture:wrapModeChanged", this._wrapModeChangedHandler);
    this.eventBus.on("texture:wrapModeResponse", this._wrapModeResponseHandler);
    this.eventBus.on("canvas:updateInfo", this._updateCanvasInfoHandler);

    this._eventBusUnsubscribers = [
      () =>
        this.eventBus.off("errorPanel:update", this._updateErrorPanelHandler),
      () =>
        this.eventBus.off(
          "texture:wrapModeChanged",
          this._wrapModeChangedHandler
        ),
      () =>
        this.eventBus.off(
          "texture:wrapModeResponse",
          this._wrapModeResponseHandler
        ),
      () =>
        this.eventBus.off("canvas:updateInfo", this._updateCanvasInfoHandler),
    ];
  }

  handlePresetSelection(selected) {
    const preset = shaderPresets[selected];
    if (!preset) return;

    Promise.all([
      fetch(preset.simPath).then((r) => r.text()),
      fetch(preset.displayPath).then((r) => r.text()),
    ])
      .then(([simSource, displaySource]) => {
        const cleanSimSource = sanitizeShaderSource(simSource);
        const cleanDisplaySource = sanitizeShaderSource(displaySource);

        this.eventBus.emit("preset:load", {
          simSource: cleanSimSource,
          displaySource: cleanDisplaySource,
          textures: preset.textures,
        });
      })
      .catch((err) => {
        console.error("Error loading preset:", err);
      });
  }

  initializeUIState() {
    this.initializeWrapModes();
  }

  initializeWrapModes() {
    this.eventBus.emit("texture:getWrapMode", { slot: "A" });
    this.eventBus.emit("texture:getWrapMode", { slot: "B" });
  }

  updateErrorPanel(simErrors, displayErrors) {
    let errorHtml = "";
    let hasErrors = false;

    if (displayErrors && displayErrors.length > 0) {
      hasErrors = true;
      errorHtml +=
        '<h2>Errors in Display Shader:</h2><div class="error-section">';
      errorHtml += displayErrors
        .map((err) => `<div>Line ${err.row + 1}: ${err.text}</div>`)
        .join("");
      errorHtml += "</div>";
    }

    if (simErrors && simErrors.length > 0) {
      hasErrors = true;
      errorHtml +=
        '<h2>Errors in Simulation Shader:</h2><div class="error-section">';
      errorHtml += simErrors
        .map((err) => `<div>Line ${err.row + 1}: ${err.text}</div>`)
        .join("");
      errorHtml += "</div>";
    }

    if (hasErrors) {
      this.setErrorContent(errorHtml);
      this.showErrorPanel();
    } else {
      this.clearErrorContent();
      this.hideErrorPanel();
    }
  }

  updateCanvasInfo(canvas, time, frameCount) {
    if (this.canvasInfo) {
      this.canvasInfo.innerHTML = `Resolution: ${canvas.width}x${
        canvas.height
      }<br>Time: ${time.toFixed(2)}<br>Frame: ${frameCount}`;
    }
  }

  showErrorPanel() {
    if (this.errorPanel) this.errorPanel.classList.add("show");
  }

  hideErrorPanel() {
    if (this.errorPanel) this.errorPanel.classList.remove("show");
  }

  setErrorContent(html) {
    if (this.errorContent) this.errorContent.innerHTML = html;
  }

  clearErrorContent() {
    if (this.errorContent) this.errorContent.innerHTML = "";
  }

  setCanvasInfo(html) {
    if (this.canvasInfo) this.canvasInfo.innerHTML = html;
  }

  setTextureWrapModeDropdown(slotId, mode) {
    if (slotId === "A" && this.wrapModeASelect instanceof HTMLSelectElement) {
      this.wrapModeASelect.value = mode;
    } else if (
      slotId === "B" &&
      this.wrapModeBSelect instanceof HTMLSelectElement
    ) {
      this.wrapModeBSelect.value = mode;
    }
  }

  populatePresetDropdown(shaderPresets) {
    if (!this.presetSelect) return;
    this.presetSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select Preset --";
    placeholder.disabled = true;
    placeholder.selected = true;
    this.presetSelect.appendChild(placeholder);
    Object.keys(shaderPresets).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      this.presetSelect.appendChild(option);
    });
    if (this.presetSelect instanceof HTMLSelectElement) {
      this.presetSelect.selectedIndex = 0;
    }
  }

  dispose() {
    this._listenerRegistry.forEach((unsub) => unsub());
    this._listenerRegistry = [];
    this._eventBusUnsubscribers.forEach((off) => off());
    this._eventBusUnsubscribers = [];
  }
}
