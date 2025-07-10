// SimplexNoise.display.glsl
//
// 2D Simplex noise example with animated noise and coordinate perturbation.
// Uses permutation and modulation functions to generate smooth noise.
// Outputs a colorful grayscale noise visualization.
//
// Uniforms:
//  - iResolution: viewport size in pixels
//  - iTime: time in seconds for animation
//  - iMouse: mouse position (unused here, but can be extended)

precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;          // Optional, unused here
uniform sampler2D iChannel0;  // Simulation texture (unused here)
uniform sampler2D iChannel1;  // User texture A (unused here)
uniform sampler2D iChannel2;  // User texture B (unused here)

// Modulo 289 for avoiding large indices (permute helper)
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

// Permutation polynomial for pseudo-random hashing
vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

// 2D Simplex noise function
float snoise(vec2 v) {
    const vec4 C = vec4(
        0.211324865405187,  // (3.0 - sqrt(3.0)) / 6.0
        0.366025403784439,  // 0.5 * (sqrt(3.0) - 1.0)
        -0.577350269189626, // -1.0 + 2.0 * C.x
        0.024390243902439   // 1.0 / 41.0
    );

    // Skew the input space to determine which simplex cell we're in
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Determine which simplex corner we're in
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

    // Offsets for corners
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    // Wrap indices at 289 to avoid overflow
    i = mod289(i);

    // Permutations for gradient hashing
    vec3 p = permute(
        permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
    );

    // Compute contribution from each corner
    vec3 m = max(0.5 - vec3(
        dot(x0, x0),
        dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)
    ), 0.0);

    m = m * m;
    m = m * m;

    // Compute gradients
    vec3 x = 2.0 * fract(p * C.w) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Apply gradient weighting
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // Dot product of gradients and offsets
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.y = a0.y * x12.x + h.y * x12.y;
    g.z = a0.z * x12.z + h.z * x12.w;

    // Final noise value scaled to roughly [-1, 1]
    return 130.0 * dot(m, g);
}

void main() {
    // Normalize fragment coordinates
    vec2 uv = gl_FragCoord.xy / iResolution.xy;

    // Animate UVs to scroll noise over time
    uv += iTime * 0.01;

    // Scale up noise frequency
    uv *= 3.0;

    // Perturb UV coordinates with noise for a turbulent effect
    float t = snoise(uv + iTime * 0.33);
    vec2 perturbedUV = uv + 0.2 * vec2(snoise(uv + t), snoise(uv - t));

    // Sample noise at perturbed coordinates
    float n = snoise(perturbedUV);

    // Normalize noise value to [0,1]
    float nv = n * 0.5 + 0.5;

    // Create color channels from noise with slight variations
    float r = n * 1.2;
    float g = nv * 0.7;
    float b = nv * 1.5;

    // Output final color with full opacity
    gl_FragColor = vec4(r, g, b, 1.0);
}
