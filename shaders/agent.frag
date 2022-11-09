#version 300 es

precision mediump float;

uniform vec3 agentColor;

out vec4 fragColor;

void main() {
    fragColor = vec4(agentColor, 1.0);
}