// GameOfLife.sim.glsl
//
// Implements Conway's Game of Life rules for cellular automaton simulation.
//
// On frame 0: initialize randomly with ~15% alive cells.
// After that: apply Game of Life rules to compute next state.

precision mediump float;

uniform vec2 iResolution;
uniform int iFrame;
uniform sampler2D iChannel0; // previous simulation state

void main() {
    if (iFrame == 0) {
        // Initialize random alive/dead cells at start (~15% alive)
        float r = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor = vec4(vec3(step(0.85, r)), 1.0);
        return;
    }

    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 texel = 1.0 / iResolution.xy;

    // Current cell state
    float state = texture2D(iChannel0, uv).r;

    // Count live neighbors
    int count = 0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            if (x == 0 && y == 0) continue; // skip self
            vec2 offset = vec2(float(x), float(y)) * texel;
            float neighbor = texture2D(iChannel0, uv + offset).r;
            count += int(neighbor > 0.5);
        }
    }

    // Apply Game of Life rules
    float nextState = state;
    if (state > 0.5) {
        // Survival: 2 or 3 neighbors alive -> stay alive, else die
        nextState = (count == 2 || count == 3) ? 1.0 : 0.0;
    } else {
        // Birth: dead cell with exactly 3 alive neighbors -> becomes alive
        nextState = (count == 3) ? 1.0 : 0.0;
    }

    gl_FragColor = vec4(vec3(nextState), 1.0);
}
