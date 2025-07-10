import { WrapModes  } from './constants.js';

export const shaderPresets = {
  'Basic Gradient': {
    simPath: './shaders/presets/BasicGradient.sim.glsl',
    displayPath: './shaders/presets/BasicGradient.display.glsl',
  },

  'Checker': {
    simPath: './shaders/presets/Checker.sim.glsl',
    displayPath: './shaders/presets/Checker.display.glsl',
  },

  'Textured': {
    simPath: './shaders/presets/Textured.sim.glsl',
    displayPath: './shaders/presets/Textured.display.glsl',
    textures: {
      textureADataURL: './textures/textureA.png',
      textureAWrapMode: WrapModes.REPEAT,
      textureBDataURL: './textures/textureB.png',
      textureBWrapMode: WrapModes.REPEAT,
    },
  },
  'Mouse Position': {
  simPath: './shaders/presets/MousePosition.sim.glsl',
  displayPath: './shaders/presets/MousePosition.display.glsl',
},
  'Accumulation Buffer': {
    simPath: './shaders/presets/AccumulationBuffer.sim.glsl',
    displayPath: './shaders/presets/AccumulationBuffer.display.glsl',
  },
  'Simplex Noise': {
    simPath: './shaders/presets/SimplexNoise.sim.glsl',
    displayPath: './shaders/presets/SimplexNoise.display.glsl',
  },
  'Curve Fun': {
    simPath: './shaders/presets/CurveFun.sim.glsl',
    displayPath: './shaders/presets/CurveFun.display.glsl',
  },
  'Game of Life': {
    simPath: './shaders/presets/GameOfLife.sim.glsl',
    displayPath: './shaders/presets/GameOfLife.display.glsl',
  },
  'Signed Distance Field': {
    simPath: './shaders/presets/SignedDistanceField.sim.glsl',
    displayPath: './shaders/presets/SignedDistanceField.display.glsl',
  },
};
