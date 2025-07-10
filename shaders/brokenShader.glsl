// brokenShader.glsl
// This fallback shader is shown when the user's shader fails to compile.
//
// It displays a solid magenta color — a classic "debug" color
// used to indicate missing or broken content in rendering pipelines.

void main() {
    // Output a fully opaque magenta color
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}