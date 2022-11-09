#version 300 es

precision mediump float;

in vec2 position;
in vec2 velocity;

uniform sampler2D screenTexture;
uniform vec2 dimensions;

out vec2 outPosition;
out vec2 outVelocity;

float turnSpeed = 0.2;

float FOV = 0.8;
float sensorOffset = 3.0;
int sensorSize = 0;


vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

vec4 sense(vec2 texCoord) {
	vec4 sum = vec4(0.0);
	for (int i = -sensorSize; i <= sensorSize; i++) {
		for (int j = -sensorSize; j <= sensorSize; j++) {
			vec2 offsetCoord = texCoord + vec2(i, j) / dimensions;
			vec4 offsetColor = texture(screenTexture, offsetCoord);

            sum += offsetColor;
		}
	}

	return sum;
}

void main() {
    vec2 texCoord = (position + 1.0) / 2.0;

    outPosition = position + velocity / dimensions;

    outVelocity = velocity;

    vec2 directionForward = velocity;
    vec2 directionRight = rotate(velocity, 0.5 * FOV);
    vec2 directionLeft = rotate(velocity, -0.5 * FOV);

    vec4 senseFoward = sense(texCoord + directionForward * sensorOffset / dimensions);
    vec4 senseRight = sense(texCoord + directionRight * sensorOffset / dimensions);
    vec4 senseLeft = sense(texCoord + directionLeft * sensorOffset / dimensions);

    if (senseFoward.x > senseRight.x && senseFoward.x > senseLeft.x) {
        outVelocity = velocity;
    } else if (senseRight.x > senseFoward.x && senseRight.x > senseLeft.x) {
        outVelocity = velocity + directionRight * turnSpeed;
    } else if (senseLeft.x > senseFoward.x && senseLeft.x > senseRight.x) {
        outVelocity = velocity + directionLeft * turnSpeed;
    }

    outVelocity = normalize(outVelocity);

    if (outPosition.x <= -1.0 || outPosition.x >= 1.0) {
        outVelocity.x *= -1.0;
    }

    if (outPosition.y <= -1.0 || outPosition.y >= 1.0) {
        outVelocity.y *= -1.0;
    }


}