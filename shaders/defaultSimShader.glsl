// defaultSimShader.glsl
//
// This is the default simulation shader.
// It is rendered offscreen and used to generate persistent visual effects
// by accessing the previous frame via `iChannel0`.
//
// This system enables advanced behaviors like trails, Game of Life, fluid sim,
// or any time-evolving effect where history is important.

// -----------------
// Precision setting
// -----------------
precision mediump float;

// -----------------
// Uniforms (provided by the system)
// -----------------
uniform vec2 iResolution;      // Canvas resolution (width, height)
uniform float iTime;           // Time in seconds since start
uniform float iFrame;          // Frame number (incremented every update)
uniform vec2 iMouse;           // Mouse position (normalized 0..1, negative if not pressed)
uniform sampler2D iChannel0;   // Simulation texture from previous frame
uniform sampler2D iChannel1;   // Optional texture slot A
uniform sampler2D iChannel2;   // Optional texture slot B

void main() {
    // Compute normalized screen coordinates (UVs)
    vec2 uv = gl_FragCoord.xy / iResolution;

    // Default simulation outputs transparent black
    // You can replace this with logic that reads/writes to iChannel0
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
