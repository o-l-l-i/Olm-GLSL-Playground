// Checker.display.glsl
//
// Simple checkerboard pattern with 32-pixel squares.
//
// Red channel is 1 if x is in first half of a 32px block,
// Green channel is 1 if y is in first half of a 32px block.
// Blue is 0, alpha is fully opaque.

precision mediump float;

void main() {
    float checkerX = mod(gl_FragCoord.x, 32.0) < 16.0 ? 1.0 : 0.0;
    float checkerY = mod(gl_FragCoord.y, 32.0) < 16.0 ? 1.0 : 0.0;

    gl_FragColor = vec4(checkerX, checkerY, 0.0, 1.0);
}
