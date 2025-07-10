// AccumulationBuffer.sim.glsl
//
// This simulation shader creates a trail effect by fading previous frames
// and rendering new soft shapes (a circle and a square) that move over time.
//
// The output is stored in iChannel0 (used as feedback in subsequent frames).

precision mediump float;

uniform float iTime;
uniform vec2 iResolution;
uniform sampler2D iChannel0; // Previous frame's buffer (with trails)

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;

    // Fade previous frame slightly (for trail effect)
    vec4 prev = texture2D(iChannel0, uv) * 0.97;
    if (prev.a < 0.08) {
        prev = vec4(0.0); // Clean up very faint remnants
    }

    // Animated positions
    vec2 circlePos = 0.5 + 0.25 * vec2(cos(iTime), sin(iTime));
    vec2 squarePos = 0.5 + 0.3 * vec2(sin(iTime * 0.7), cos(iTime * 1.3));

    // Draw a soft circular shape
    float distCircle = length(uv - circlePos);
    float circle = smoothstep(0.05, 0.04, distCircle);

    // Draw a soft square shape
    vec2 delta = abs(uv - squarePos);
    float square = smoothstep(0.05, 0.045, max(delta.x, delta.y));

    // Combine both shapes using additive color
    vec3 shapeColor =
        vec3(0.8, 0.2, 0.8) * circle + // Purple-ish circle
        vec3(0.2, 0.8, 0.3) * square;  // Green-ish square

    vec4 current = vec4(shapeColor, max(circle, square)); // Alpha = presence of shape

    // Blend with previous frame using max (preserves brighter areas)
    vec4 finalColor = max(current, prev);

    gl_FragColor = finalColor;
}
