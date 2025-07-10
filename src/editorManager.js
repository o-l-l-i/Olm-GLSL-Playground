import { StorageManager } from "../src/storageManager.js";
import { ShaderPersistence } from "../src/shaderPersistence.js";

export class EditorManager {
  constructor(
    eventBus,
    {
      simEditorId = "simEditor",
      displayEditorId = "displayEditor",
      defaultSimShader = "",
      defaultDisplayShader = "",
    } = {}
  ) {
    this.eventBus = eventBus;
    this._eventUnsubscribers = [];
    this.errorMarkers = new Map();
    this.storage = new StorageManager();
    this.shaderPersistence = new ShaderPersistence(this.storage);

    const initialSimShader =
      this.shaderPersistence.loadSim() || defaultSimShader;
    const initialDisplayShader =
      this.shaderPersistence.loadDisplay() || defaultDisplayShader;
    this.simEditor = this.createEditor(simEditorId, initialSimShader);
    this.displayEditor = this.createEditor(
      displayEditorId,
      initialDisplayShader
    );

    this.setupEventListeners();
  }

  createEditor(domId, initialValue) {
    const editor = ace.edit(domId);
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/glsl");
    editor.setValue(initialValue, -1);
    editor.session.setUseWrapMode(true);
    editor.setFontSize(16);
    editor.session.setUseWorker(false);
    return editor;
  }

  init() {
    this.eventBus.emit("shaderchanged:sim", this.getSimShader());
    this.eventBus.emit("shaderchanged:display", this.getDisplayShader());
  }

  setupEventListeners() {
    this._suppressEmit = false;

    this._onUpdateAnnotations = ({ editorType, annotations }) => {
      this.updateEditorAnnotations(editorType, annotations);
    };

    this._simChangeHandler = () => {
      if (this._suppressEmit) return;
      const shader = this.getSimShader();
      this.eventBus.emit("shaderchanged:sim", shader);
      this.shaderPersistence.saveSim(shader);
    };

    this._displayChangeHandler = () => {
      if (this._suppressEmit) return;
      const shader = this.getDisplayShader();
      this.eventBus.emit("shaderchanged:display", shader);
      this.shaderPersistence.saveDisplay(shader);
    };

    this._onShaderLoadSim = (code) => {
      this.setSimShader(code);
    };

    this._onShaderLoadDisplay = (code) => {
      this.setDisplayShader(code);
    };

    this.eventBus.on("editor:updateAnnotations", this._onUpdateAnnotations);
    this.simEditor.on("change", this._simChangeHandler);
    this.displayEditor.on("change", this._displayChangeHandler);
    this.eventBus.on("shader:loadSim", this._onShaderLoadSim);
    this.eventBus.on("shader:loadDisplay", this._onShaderLoadDisplay);

    this._eventUnsubscribers.push(
      () =>
        this.eventBus.off(
          "editor:updateAnnotations",
          this._onUpdateAnnotations
        ),
      () => this.simEditor.off("change", this._simChangeHandler),
      () => this.displayEditor.off("change", this._displayChangeHandler),
      () => this.eventBus.off("shader:loadSim", this._onShaderLoadSim),
      () => this.eventBus.off("shader:loadDisplay", this._onShaderLoadDisplay)
    );
  }

  clearAnnotations(editorType) {
    const editor = editorType === "sim" ? this.simEditor : this.displayEditor;
    const session = editor.getSession();
    const markers = this.errorMarkers.get(editor) || [];
    markers.forEach((id) => session.removeMarker(id));
    session.clearAnnotations();
    this.errorMarkers.delete(editor);
  }

  updateEditorAnnotations(editorType, annotations) {
    if (!Array.isArray(annotations)) return;

    const editor = editorType === "sim" ? this.simEditor : this.displayEditor;
    if (!editor) return;

    const session = editor.getSession();
    const Range = ace.require("ace/range").Range;

    const existingMarkers = this.errorMarkers.get(editor) || [];
    existingMarkers.forEach((markerId) => session.removeMarker(markerId));
    this.errorMarkers.set(editor, []);

    this.clearAnnotations(editorType);

    const newMarkers = [];
    annotations.forEach((annotation) => {
      if (annotation.row >= 0 && annotation.type === "error") {
        const markerId = session.addMarker(
          new Range(annotation.row, 0, annotation.row, 1),
          "error-line-highlight",
          "fullLine"
        );
        newMarkers.push(markerId);
      }
    });
    this.errorMarkers.set(editor, newMarkers);

    session.setAnnotations(annotations);

    editor.renderer.updateFull();
  }

  getSimShader() {
    return this.simEditor.getValue();
  }

  setSimShader(code) {
    this._suppressEmit = true;
    this.simEditor.setValue(code, -1);
    this.shaderPersistence.saveSim(code);
    this.eventBus.emit("shaderchanged:sim", code);
    this._suppressEmit = false;
  }

  getDisplayShader() {
    return this.displayEditor.getValue();
  }

  setDisplayShader(code) {
    this._suppressEmit = true;
    this.displayEditor.setValue(code, -1);
    this.shaderPersistence.saveDisplay(code);
    this.eventBus.emit("shaderchanged:display", code);
    this._suppressEmit = false;
  }

  dispose() {
    this._eventUnsubscribers.forEach((off) => off());

    [this.simEditor, this.displayEditor].forEach((editor) => {
      const session = editor.getSession();
      const markers = this.errorMarkers.get(editor) || [];
      markers.forEach((id) => session.removeMarker(id));
      session.clearAnnotations();
      this.errorMarkers.delete(editor);
    });
  }
}
