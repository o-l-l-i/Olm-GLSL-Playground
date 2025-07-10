// AccumulationBuffer.display.glsl
//
// Simple pass-through display shader that shows the final simulation buffer.
//
// This fetches from iChannel0, which contains the output from the simulation.

precision mediump float;

uniform vec2 iResolution;
uniform sampler2D iChannel0;

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    vec4 color = texture2D(iChannel0, uv);
    gl_FragColor = color;
}
