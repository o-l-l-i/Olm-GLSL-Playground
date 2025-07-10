import { Renderer } from "./src/renderer.js";
import { EventBus } from "./src/eventBus.js";
import { EditorManager } from "./src/editorManager.js";
import { UIManager } from "./src/uiManager.js";
import { TextureManager } from "./src/textureManager.js";
import { ErrorManager } from "./src/errorManager.js";
import { PresetManager } from "./src/presetManager.js";
import { StorageManager } from "./src/storageManager.js";
import { ShaderPersistence } from "./src/shaderPersistence.js";
import { TextureSlotPersistence } from "./src/textureSlotPersistence.js";
import { ReadMeManager } from "./src/readMeManager.js";

async function loadText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load shader: ${path}`);
  return await res.text();
}

class GLSLPlayground {
  constructor({
    defaultSimShader,
    defaultDisplayShader,
    fallbackVertexShader,
    fallbackFragmentShader,
  }) {
    this.storage = new StorageManager();
    this.canvas = /** @type {HTMLCanvasElement} */ (
      document.getElementById("glCanvas")
    );
    if (!this.canvas) throw new Error("Canvas element not found.");

    this.eventBus = new EventBus();
    this._eventBusUnsubscribers = [];

    this.renderer = new Renderer(this.eventBus, this.canvas, {
      fallbackVertexShader,
      fallbackFragmentShader,
    });

    this.editorManager = new EditorManager(this.eventBus, {
      simEditorId: "simEditor",
      displayEditorId: "displayEditor",
      defaultSimShader,
      defaultDisplayShader,
    });

    this.errorManager = new ErrorManager(this.eventBus);
    this.presetManager = new PresetManager(this.eventBus);
    this.textureManager = new TextureManager(this.eventBus, ["A", "B"]);
    this.uiManager = new UIManager(this.eventBus, this.canvas);

    this.shaderPersistence = new ShaderPersistence(this.storage);
    this.textureSlotPersistence = new TextureSlotPersistence(this.storage);
    this.readMeManager = new ReadMeManager();

    this._disposables = [
      this.renderer,
      this.textureManager,
      this.uiManager,
      this.editorManager,
      this.errorManager,
      this.presetManager,
    ];

    this.setupUIBindings();
    this.editorManager.init();
    this.eventBus.emit("texture:loadSavedTextures");
  }

  setupUIBindings() {
    this._onResetClick = () => {
      this.shaderPersistence.clearAll();
      this.textureSlotPersistence.clearSlots(["A", "B"]);
      location.reload();
    };

    this._onResetTexture = ({ slotId: slot }) => {
      this.eventBus.emit("texture:reset", { slot });
    };

    this._onWrapModeChange = ({ slot, wrapMode }) => {
      this.eventBus.emit("texture:setWrapMode", { slot, wrapMode });
      this.eventBus.emit("texture:persistWrapMode", { slot, wrapMode });
    };

    this.eventBus.on("ui:resetClick", this._onResetClick);
    this.eventBus.on("ui:resetTexture", this._onResetTexture);
    this.eventBus.on("ui:wrapModeChange", this._onWrapModeChange);

    this._eventBusUnsubscribers.push(
      () => this.eventBus.off("ui:resetClick", this._onResetClick),
      () => this.eventBus.off("ui:resetTexture", this._onResetTexture),
      () => this.eventBus.off("ui:wrapModeChange", this._onWrapModeChange)
    );
  }

  dispose() {
    this._eventBusUnsubscribers.forEach((off) => off());
    this._disposables.forEach((d) => d?.dispose?.());
    this.canvas = null;
  }
}

const editor = ace.edit("displayEditor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/glsl");

async function main() {
  const [
    defaultDisplayShader,
    defaultSimShader,
    fallbackVertexShader,
    fallbackFragmentShader,
  ] = await Promise.all([
    loadText("./shaders/defaultDisplayShader.glsl"),
    loadText("./shaders/defaultSimShader.glsl"),
    loadText("./shaders/vertexShader.glsl"),
    loadText("./shaders/brokenShader.glsl"),
  ]);

  const playground = new GLSLPlayground({
    defaultSimShader,
    defaultDisplayShader,
    fallbackVertexShader,
    fallbackFragmentShader,
  });

  window.addEventListener("beforeunload", () => {
    playground.dispose();
  });
}

main().catch(console.error);
