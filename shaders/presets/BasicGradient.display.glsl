// BasicGradient.display.glsl
//
// Simple vertical gradient from bottom to top with non-linear color ramps.
//
// The red and blue channels fade with different powers for a subtle color variation.
// Green channel is linear from bottom to top.

precision mediump float;
uniform vec2 iResolution;

void main() {
    float yNorm = gl_FragCoord.y / iResolution.y;

    gl_FragColor = vec4(
        pow(1.0 - yNorm, 0.5), // Red channel: fades with sqrt for smooth falloff
        yNorm,                 // Green channel: linear gradient upwards
        pow(1.0 - yNorm, 1.5), // Blue channel: fades faster for contrast
        1.0                    // Opaque alpha
    );
}
