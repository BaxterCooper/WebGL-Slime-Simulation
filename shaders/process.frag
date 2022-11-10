#version 300 es

precision mediump float;

in vec2 texCoord;

uniform sampler2D screenTexture;
uniform vec2 dimensions;
uniform float fadeSpeed;

out vec4 fragColor;

void main() {
    vec4 color = vec4(0.0);

    // 3x3 box-blur
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offsetCoord = texCoord + vec2(i, j) / dimensions;
            vec4 offsetColor = texture(screenTexture, offsetCoord);

            color += offsetColor;
        }
    }
    color /= 9.0;

    // fade
    color.xyz -= fadeSpeed;

    fragColor = color;
}