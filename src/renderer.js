import { WrapModes } from "./constants.js";

export class Renderer {
  constructor(
    eventBus,
    canvas,
    { fallbackVertexShader = "", fallbackFragmentShader = "" } = {}
  ) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    this._eventBusListenerRegistry = [];
    this.textures = { A: null, B: null };
    this.simFramebufferA = null;
    this.simTextureA = null;
    this.simFramebufferB = null;
    this.simTextureB = null;
    this.useSimFramebufferA = true;
    this.activeDisplayProgram = null;
    this.simProgram = null;
    this.displayProgram = null;
    this.brokenProgram = null;
    this.simShaderValid = true;
    this.displayShaderValid = true;
    this.quadBuffer = null;
    this.animationId = null;
    this.startTime = Date.now();
    this.frameCount = 0;
    this.mouse = { x: 0, y: 0 };
    this.gl = null;

    this.vertexShaderSrc = fallbackVertexShader;
    this.fragmentShaderSrc = fallbackFragmentShader;

    this._onSimShaderChanged = (code) => this.setSimShader(code);

    this._onDisplayShaderChanged = (code) => this.setDisplayShader(code);

    this._onTextureLoaded = ({ slot, image, wrapMode }) => {
      const src = image.src;
      const isDataUrl = src.startsWith("data:");
      const shortSrc = isDataUrl ? "data:image/..." : src.split("/").pop();
      if (image) this.updateGLTexture(image, slot, wrapMode);
    };

    this._onMouseMoved = ({ x, y }) => {
      this.mouse.x = x;
      this.mouse.y = y;
    };

    this._onWrapModeChanged = ({ slot, wrapMode }) => {
      if (this.textures[slot]) {
        this.updateTextureWrapMode(this.textures[slot], wrapMode);
      }
    };

    this._onTextureReleased = (slotId) => this.resetGLTexture(slotId);

    this.setupEventListeners();

    this.initWebGL();
  }

  setupEventListeners() {
    this.addEventBusListener("shaderchanged:sim", this._onSimShaderChanged);
    this.addEventBusListener(
      "shaderchanged:display",
      this._onDisplayShaderChanged
    );
    this.addEventBusListener("texture:loaded", this._onTextureLoaded);
    this.addEventBusListener("mouse:moved", this._onMouseMoved);
    this.addEventBusListener(
      "texture:wrapModeChanged",
      this._onWrapModeChanged
    );
    this.addEventBusListener(
      "texture:releaseRequested",
      this._onTextureReleased
    );
  }

  addEventBusListener(eventName, handler) {
    this.eventBus.on(eventName, handler);
    this._eventBusListenerRegistry.push(() =>
      this.eventBus.off(eventName, handler)
    );
  }

  removeEventBusListeners() {
    this._eventBusListenerRegistry.forEach((unsub) => unsub());
    this._eventBusListenerRegistry = [];
  }

  initWebGL() {
    this.resizeCanvasToDisplaySize();
    this.gl =
      this.canvas.getContext("webgl2") || this.canvas.getContext("webgl");
    if (!this.gl) throw new Error("WebGL is not supported in this browser.");
    const fbPairA = this.createFramebufferTexturePair(
      this.canvas.width,
      this.canvas.height
    );
    const fbPairB = this.createFramebufferTexturePair(
      this.canvas.width,
      this.canvas.height
    );
    this.simFramebufferA = fbPairA.framebuffer;
    this.simTextureA = fbPairA.texture;
    this.simFramebufferB = fbPairB.framebuffer;
    this.simTextureB = fbPairB.texture;
    this.useSimFramebufferA = true;
    this.simProgram = null;
    this.displayProgram = null;
    this.setupWebGL();
    this.compileBrokenShader();
    this.startAnimation();
  }

  resizeCanvasToDisplaySize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  setupWebGL() {
    if (!this.gl) return;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.setupQuad();
  }

  setupQuad() {
    const vertices = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

      -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    ]);
    this.quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }

  compileBrokenShader() {
    if (!this.gl) return;
    try {
      this.brokenProgram = this.createProgramFromSources(
        this.vertexShaderSrc,
        this.fragmentShaderSrc
      );
    } catch (e) {
      console.error("Failed to compile broken shader fallback", e);
      this.brokenProgram = null;
    }
  }

  createProgramFromSources(vertexSrc, fragmentSrc) {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSrc
    );
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(this.gl.getProgramInfoLog(program));
    }
    return program;
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(error);
    }
    return shader;
  }

  createFramebufferTexturePair(width, height) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { framebuffer, texture };
  }

  startAnimation() {
    const render = () => {
      if (this.brokenProgram) {
        this.render();
      }
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  render() {
    const gl = this.gl;
    const time = (Date.now() - this.startTime) / 1000;
    const writeFramebuffer = this.useSimFramebufferA
      ? this.simFramebufferA
      : this.simFramebufferB;
    const readTexture = this.useSimFramebufferA
      ? this.simTextureB
      : this.simTextureA;

    const simProgram = this.simShaderValid
      ? this.simProgram
      : this.brokenProgram;
    if (!simProgram) return;

    gl.useProgram(simProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.setCommonUniforms(simProgram, time, this.frameCount);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTexture);
    gl.uniform1i(gl.getUniformLocation(simProgram, "iChannel0"), 0);

    if (this.textures.A) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.textures.A);
      gl.uniform1i(gl.getUniformLocation(simProgram, "iChannel1"), 1);
    }
    if (this.textures.B) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.textures.B);
      gl.uniform1i(gl.getUniformLocation(simProgram, "iChannel2"), 2);
    }

    this.drawQuad(simProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const outputTexture = this.useSimFramebufferA
      ? this.simTextureA
      : this.simTextureB;
    const displayProgram = this.activeDisplayProgram;
    if (!displayProgram) return;

    gl.useProgram(displayProgram);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);
    this.setCommonUniforms(displayProgram, time, this.frameCount);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, outputTexture);
    gl.uniform1i(gl.getUniformLocation(displayProgram, "iChannel0"), 0);

    if (this.textures.A) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.textures.A);
      gl.uniform1i(gl.getUniformLocation(displayProgram, "iChannel1"), 1);
    }
    if (this.textures.B) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.textures.B);
      gl.uniform1i(gl.getUniformLocation(displayProgram, "iChannel2"), 2);
    }

    this.drawQuad(displayProgram);

    this.eventBus.emit("canvas:updateInfo", {
      canvas: this.canvas,
      meta: {
        time,
        frameCount: this.frameCount,
      },
    });

    this.useSimFramebufferA = !this.useSimFramebufferA;
  }

  setCommonUniforms(program, time, frame) {
    const gl = this.gl;

    const resLoc = gl.getUniformLocation(program, "iResolution");
    if (resLoc) gl.uniform2f(resLoc, this.canvas.width, this.canvas.height);

    gl.uniform1f(gl.getUniformLocation(program, "iTime"), time);

    const iFrameLoc = gl.getUniformLocation(program, "iFrame");
    if (iFrameLoc !== -1 && iFrameLoc !== null) {
      gl.uniform1i(iFrameLoc, frame);
    }

    this.frameCount++;

    const loc = gl.getUniformLocation(program, "iMouse");
    if (loc) {
      gl.uniform2f(loc, this.mouse.x, this.mouse.y);
    }
  }

  clearSimulation() {
    this.frameCount = 0;
  }

  clearFramebuffers() {
    [this.simFramebufferA, this.simFramebufferB].forEach((fb) => {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    });
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  drawQuad(program) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

    const posLoc = gl.getAttribLocation(program, "position");
    if (posLoc === -1) return;

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  updateGLTexture(img, slot, wrapMode = WrapModes.REPEAT) {
    const gl = this.gl;
    if (this.textures[slot]) {
      gl.deleteTexture(this.textures[slot]);
      this.textures[slot] = null;
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const wrapEnum = {
      CLAMP_TO_EDGE: gl.CLAMP_TO_EDGE,
      REPEAT: gl.REPEAT,
      MIRRORED_REPEAT: gl.MIRRORED_REPEAT,
    };
    const wrap = wrapEnum[wrapMode] || gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.textures[slot] = texture;
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  resetGLTexture(slotId) {
    const gl = this.gl;
    if (!gl) return;
    const texture = this.textures[slotId];
    if (texture) {
      gl.deleteTexture(texture);
      this.textures[slotId] = null;
    }
  }

  updateTextureWrapMode(texture, wrapModeString) {
    const gl = this.gl;
    const wrapMode = this.wrapModeFromString(wrapModeString);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  wrapModeFromString(mode) {
    const gl = this.gl;
    switch (mode) {
      case WrapModes.REPEAT:
        return gl.REPEAT;
      case WrapModes.MIRROR:
        return gl.MIRRORED_REPEAT;
      case WrapModes.CLAMP:
      default:
        return gl.CLAMP_TO_EDGE;
    }
  }

  setTextureWrapParams(gl, wrapModeString) {
    const wrapMode = this.wrapModeFromString(wrapModeString);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
  }

  setSimShader(code) {
    const gl = this.gl;
    if (!gl) return;

    try {
      const newProgram = this.createProgramFromSources(
        this.vertexShaderSrc,
        code
      );
      if (this.simProgram) gl.deleteProgram(this.simProgram);
      this.simProgram = newProgram;
      this.simShaderValid = true;

      this.eventBus.emit("error:shader", { type: "sim", message: null });
      this.clearSimulation();
    } catch (e) {
      this.simShaderValid = false;

      if (this.simProgram) gl.deleteProgram(this.simProgram);
      this.simProgram = null;

      this.eventBus.emit("error:shader", {
        type: "sim",
        message: e.message,
        errorString: e.message,
        source: code,
      });
    }

    this.updateDisplayProgram();
  }

  setDisplayShader(code) {
    const gl = this.gl;
    if (!gl) return;

    try {
      const newProgram = this.createProgramFromSources(
        this.vertexShaderSrc,
        code
      );
      if (this.displayProgram) gl.deleteProgram(this.displayProgram);
      this.displayProgram = newProgram;
      this.displayShaderValid = true;

      this.eventBus.emit("error:shader", { type: "display", message: null });
    } catch (e) {
      this.displayShaderValid = false;

      if (this.displayProgram) gl.deleteProgram(this.displayProgram);
      this.displayProgram = null;

      this.eventBus.emit("error:shader", {
        type: "display",
        message: e.message,
        errorString: e.message,
        source: code,
      });
    }

    this.updateDisplayProgram();
  }

  updateDisplayProgram() {
    const gl = this.gl;
    if (!gl) return;

    if (this.simShaderValid && this.displayShaderValid) {
      this.activeDisplayProgram = this.displayProgram;
    } else {
      this.activeDisplayProgram = this.brokenProgram;
    }
  }

  dispose() {
    this.removeEventBusListeners();

    const gl = this.gl;
    if (!gl) return;

    this.stopAnimation();

    if (this.displayProgram) {
      gl.deleteProgram(this.displayProgram);
      this.displayProgram = null;
    }

    if (this.simProgram) {
      gl.deleteProgram(this.simProgram);
      this.simProgram = null;
    }

    if (this.simTextureA) {
      gl.deleteTexture(this.simTextureA);
      this.simTextureA = null;
    }

    if (this.simTextureB) {
      gl.deleteTexture(this.simTextureB);
      this.simTextureB = null;
    }

    if (this.simFramebufferA) {
      gl.deleteFramebuffer(this.simFramebufferA);
      this.simFramebufferA = null;
    }

    if (this.simFramebufferB) {
      gl.deleteFramebuffer(this.simFramebufferB);
      this.simFramebufferB = null;
    }

    for (const key of Object.keys(this.textures)) {
      const texture = this.textures[key];
      if (texture) {
        gl.deleteTexture(texture);
        this.textures[key] = null;
      }
    }

    this.gl = null;
  }
}
