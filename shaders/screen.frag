#version 300 es

precision mediump float;

in vec2 texCoord;

uniform sampler2D screenTexture;

out vec4 fragColor;

void main() {
    fragColor = texture(screenTexture, texCoord);
}