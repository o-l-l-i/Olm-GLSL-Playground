// SignedDistanceField.display.glsl
//
// Demonstrates 2D signed distance fields (SDF) combining a moving circle and box
// with smooth union blending and a glow + contour visualization.
//
// iTime drives animation, iResolution provides viewport size.

precision mediump float;

uniform vec2 iResolution;
uniform float iTime;

// Signed distance to circle centered at origin with radius r
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// Signed distance to axis-aligned box centered at origin with half-size b
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Smooth union operator between two distances d1 and d2 with smoothing factor k
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

void main() {
    // Normalize coordinates to [-aspect, aspect] x [-1, 1]
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

    // Animate circle and box positions smoothly over time
    vec2 circlePos = vec2(sin(iTime), cos(iTime)) * 0.4;
    vec2 boxPos = vec2(cos(iTime * 0.7), sin(iTime * 0.7)) * 0.3;

    // Calculate signed distances for shapes at their animated positions
    float dCircle = sdCircle(uv - circlePos, 0.2);
    float dBox = sdBox(uv - boxPos, vec2(0.2, 0.2));

    // Combine shapes using smooth union for soft blending
    float d = opSmoothUnion(dCircle, dBox, 0.1);

    // Glow effect based on distance field value (higher near surface)
    float glow = exp(-10.0 * d);
    vec3 col = vec3(0.1, 0.6, 1.0) * glow;

    // Contour lines created using a banded function on fract(d * 20)
    vec3 contour = 2.0 * vec3(1.0) * smoothstep(0.1, 0.0, abs(fract(d * 20.0) - 0.5));

    // Blend contour lines lightly with glow color
    col = mix(col, contour, 0.05);

    gl_FragColor = vec4(col, 1.0);
}
