// CurveFun.display.glsl
//
// Renders colorful animated curves using multiple sine waves.
// Can be used for stylized monitor screens, HUDs, or procedural backgrounds.
//
// The curves are composed of combined sine functions with different frequencies,
// animated over time for smooth wave motion.
//
// Red, Green, and Blue channels each have their own distinct wave patterns.

precision mediump float;

uniform vec2 iResolution; // viewport resolution (pixels)
uniform float iTime;      // time in seconds

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution; // normalize coordinates [0..1]

    // Animate blue channel intensity slowly pulsing
    float blue = 0.5 + 0.5 * sin(iTime);

    // Construct red curve by summing multiple sine waves with different frequencies
    float curveR = sin(uv.x * 33.0 + iTime * 5.0) / 4.0;
          curveR += sin(uv.x * 16.6 + iTime * 5.0) / 4.0;
          curveR += sin(uv.x * 28.0 + iTime * 5.0) / 4.0;
    curveR /= 2.0;

    // Use step() to create a thresholded curve shape
    curveR = step(uv.y, curveR + 0.5);

    // Construct green curve similarly but with lower frequencies for variety
    float curveG = sin(uv.x * 5.0 + iTime * 5.0) / 4.0;
          curveG += sin(uv.x * 10.0 + iTime * 5.0) / 4.0;
          curveG += sin(uv.x * 4.0 + iTime * 5.0) / 4.0;
    curveG /= 2.0;
    curveG = step(uv.y, curveG + 0.5);

    // Construct blue curve with very low frequencies for smooth shapes
    float curveB = sin(uv.x * 2.0 + iTime * 5.0) / 4.0;
          curveB += sin(uv.x * 4.0 + iTime * 5.0) / 4.0;
          curveB += sin(uv.x * 8.0 + iTime * 5.0) / 4.0;
    curveB /= 2.0;
    curveB = step(uv.y, curveB + 0.5);

    // Output final color combining the three thresholded curves
    gl_FragColor = vec4(curveR, curveG, curveB, 1.0);
}
