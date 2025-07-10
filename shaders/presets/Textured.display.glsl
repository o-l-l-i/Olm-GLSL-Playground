// Textured.display.glsl
//
// Demonstrates usage of multiple textures with UV deformation and animation.
// Scrolls and warps two input textures, then blends them smoothly.
//
// Uniforms:
//  - iResolution: viewport size (pixels)
//  - iTime: animation time (seconds)
//  - iChannel1: user texture A
//  - iChannel2: user texture B

precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iChannel1; // Texture A
uniform sampler2D iChannel2; // Texture B

void main() {
    // Normalize pixel coordinates [0,1]
    vec2 uv1 = gl_FragCoord.xy / iResolution.xy;
    vec2 uv2 = uv1;

    // Scale UV coordinates to increase texture detail
    uv1 *= 2.0;
    // Apply vertical sine-wave deformation based on horizontal position
    uv1.y += sin(uv1.x * 3.0) * 0.1;

    // Scale second UV differently for texture B
    uv2 *= 3.0;
    // Apply horizontal sine-wave deformation based on vertical position
    uv2.x += sin(uv2.y * 3.0) * 0.2;

    // Animate horizontal and vertical offsets to scroll textures over time
    uv1.x += sin(iTime * 2.0);
    uv2.y += sin(iTime * 2.0 - 0.5);

    // Sample colors from textures with deformed UVs
    vec4 texA = texture2D(iChannel1, uv1);
    vec4 texB = texture2D(iChannel2, uv2);

    // Blend both textures evenly
    gl_FragColor = mix(texA, texB, 0.5);
}
