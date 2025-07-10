// MousePosition.display.glsl
//
// Visualizes the mouse position on screen by drawing a colored radial glow.
//
// Uses smoothstep for smooth color gradients fading out from the mouse pointer.

precision mediump float;

uniform vec2 iResolution; // viewport resolution in pixels
uniform vec2 iMouse;      // normalized mouse position [0..1]

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;

    // Compute distance from current fragment to mouse position
    float dist = distance(uv, iMouse);

    // Smooth radial gradients for each color channel with different falloffs
    float r = smoothstep(0.2, 0.03, dist); // red channel: large glow
    float g = smoothstep(0.4, 0.05, dist); // green channel: medium glow
    float b = smoothstep(0.1, 0.02, dist); // blue channel: small glow

    // Compose final color by inverting the smoothstep results for a glowing effect
    vec4 color = vec4(r, g, b, 1.0);

    gl_FragColor = color;
}
