// GameOfLife.display.glsl
//
// Displays the current state of the Game of Life simulation:
// alive cells are white, dead cells are black.

precision mediump float;

uniform vec2 iResolution;
uniform sampler2D iChannel0; // simulation state texture

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float val = texture2D(iChannel0, uv).r; // red channel stores alive state
    gl_FragColor = vec4(vec3(val), 1.0);    // white = alive, black = dead
}
