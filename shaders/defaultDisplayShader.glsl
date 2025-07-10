// defaultDisplayShader.glsl
// This is the default display shader shown when the app starts.
// It visualizes the screen-space UV coordinates and creates a smooth
// animated background using time-based color modulation.

// Set the default precision for floats
precision mediump float;

// -----------
// Uniforms (provided by the system):
// -----------
uniform vec2 iResolution;      // Canvas resolution (width, height)
uniform float iTime;           // Time in seconds since load
uniform float iFrame;          // Frame counter
uniform vec2 iMouse;           // Mouse position (normalized 0..1 when pressed, or negative when not)
uniform sampler2D iChannel0;   // Simulation output (if any)
uniform sampler2D iChannel1;   // User texture slot A
uniform sampler2D iChannel2;   // User texture slot B

void main() {
    // Normalize fragment coordinates to UV space (0.0 - 1.0)
    vec2 uv = gl_FragCoord.xy / iResolution;

    // Animate blue channel using a sine wave over time
    float blue = 0.5 + 0.5 * sin(iTime);

    // Output color: red = uv.x, green = uv.y, blue = animated
    gl_FragColor = vec4(uv.x, uv.y, blue, 1.0);
}