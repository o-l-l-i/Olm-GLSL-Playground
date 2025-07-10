export class ErrorManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this._eventBusUnsubscribers = [];
    this.currentErrors = { sim: [], display: [] };
    this.setupEventListeners();
  }

  setupEventListeners() {
    this._shaderErrorListener = (error) => {
      if (!error || !error.type || !error.errorString) {
        this.currentErrors[error?.type] = [];
        this.emitUpdates();
        return;
      }

      const editorType = error.type;
      const parsedErrors = this.parseShaderErrors(error.errorString);

      this.currentErrors[editorType] = parsedErrors;
      this.emitUpdates();
    };

    this.eventBus.on("error:shader", this._shaderErrorListener);

    this._eventBusUnsubscribers.push(() =>
      this.eventBus.off("error:shader", this._shaderErrorListener)
    );
  }

  emitUpdates() {
    ["sim", "display"].forEach((editorType) => {
      this.eventBus.emit("editor:updateAnnotations", {
        editorType,
        annotations: this.currentErrors[editorType] || [],
      });
    });

    this.eventBus.emit("errorPanel:update", {
      simErrors: this.currentErrors.sim || [],
      displayErrors: this.currentErrors.display || [],
    });
  }

  parseShaderErrors(errorString) {
    const errors = [];
    const regex = /ERROR: (\d+):(\d+):(.*)/g;
    let match;
    while ((match = regex.exec(errorString)) !== null) {
      const lineNumber = parseInt(match[2], 10) - 1;
      const message = match[3].trim();
      errors.push({
        row: lineNumber,
        column: 0,
        text: message,
        type: "error",
      });
    }
    return errors;
  }

  dispose() {
    this._eventBusUnsubscribers?.forEach((off) => off());
    this._eventBusUnsubscribers = [];
    this.currentErrors = { sim: [], display: [] };
  }
}
