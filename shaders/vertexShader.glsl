// vertexShader.glsl
//
// This is the vertex shader used by both the display and simulation passes.
// It simply passes 2D vertex positions directly to the fragment shader.
//
// In this GLSL playground, we use a quad covering clip space,
// so no transformations or varying variables are needed.

attribute vec2 position;

void main() {
    // Project the 2D position into clip space (Z=0, W=1)
    gl_Position = vec4(position, 0.0, 1.0);
}