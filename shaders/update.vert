#version 300 es

precision mediump float;

in vec2 position;
in vec2 velocity;

uniform sampler2D screenTexture;
uniform vec2 dimensions;

uniform float turnSpeed;
uniform float sensorFOV;
uniform float sensorOffset;
uniform int sensorSize;
uniform float agentSpeed;

out vec2 outPosition;
out vec2 outVelocity;

// Convert degrees to radians
float degToRad(float degrees) {
    return degrees * 3.14159265359 / 180.0;
}

// rotates a 2D vector 'a' radians counter-clockwise
vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

// sums the value of pixels in a square grid
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
    // texture coordinate
    vec2 texCoord = (position + 1.0) / 2.0;

    // update position with speed parameter
    outPosition = position + (velocity * agentSpeed) / dimensions;

    // Convert FOV from degrees to radians
    float sensorFOVRadians = degToRad(sensorFOV);
    
    // update velocity
    vec2 directionForward = velocity;
    vec2 directionRight = rotate(velocity, 0.5 * sensorFOVRadians);
    vec2 directionLeft = rotate(velocity, -0.5 * sensorFOVRadians);

    vec4 senseForward = sense(texCoord + directionForward * sensorOffset / dimensions);
    vec4 senseRight = sense(texCoord + directionRight * sensorOffset / dimensions);
    vec4 senseLeft = sense(texCoord + directionLeft * sensorOffset / dimensions);

    float weightForward = senseForward.x + senseForward.y + senseForward.z;
    float weightRight = senseRight.x + senseRight.y + senseRight.z;
    float weightLeft = senseLeft.x + senseLeft.y + senseLeft.z;

    if (weightForward > weightRight && weightForward > weightLeft) {
        outVelocity = velocity;
    } else if (weightRight > weightForward && weightRight > weightLeft) {
        outVelocity = velocity + directionRight * turnSpeed;
    } else if (weightLeft > weightForward && weightLeft > weightRight) {
        outVelocity = velocity + directionLeft * turnSpeed;
    } else {
        outVelocity = velocity;
    }

    // normalize
    outVelocity = normalize(outVelocity);

    // boundary condition
    if (outPosition.x <= -1.0 || outPosition.x >= 1.0) {
        outVelocity.x *= -1.0;
    }

    if (outPosition.y <= -1.0 || outPosition.y >= 1.0) {
        outVelocity.y *= -1.0;
    }
}