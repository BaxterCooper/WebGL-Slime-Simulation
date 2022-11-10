# WebGL-Slime-Simulation

![Image](./images/image2.png)

## Agent Class
```js
class Agent {
    constructor() {
        this.position = [Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0];
        this.velocity = [Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0];
    }
}
```

The agent class has 2 properties.

- `position`: represents the agents position as a 2D coordinate ranging from `[-1.0, 1.0]`.

- `velocity`: represents the agents velocity as a 2D vector ranging from `[-1.0, 1.0]`.

In this simulation the starting `position` and `velocity` are randomized but these can easly be changes to see how different starting positions and velocities play out.

## Shader Programs

This project requires 4 shader programs.

1. **Agent Program** - responsable for drawing the agents to a screen texture.
2. **Screen Program** - responsable for taking the screen texture and drawing it to the screen.
3. **Process Program** - responsable for applying post-processing effects to the screen texture.
4. **Update Program** - responsable for updating agent data.

### Agent Program

#### Vertex Shader
```glsl
#version 300 es

precision mediump float;

in vec2 position;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = 1.0;
}
```

The vertex shader simply takes in the `position` of an agent and outputs this as the `gl_Position` to the fragment shader. Here we have also specified the `gl_PointSize` to be 1 pixel.

#### Fragment Shader
```glsl
#version 300 es

precision mediump float;

uniform vec3 agentColor;

out vec4 fragColor;

void main() {
    fragColor = vec4(agentColor, 1.0);
}
```

The fragment shader takes in 1 uniform `agentColor` which specifies the RGB color of the agent. The fragment shader then outputs `fragColor` with the RGB value of the `agentColor` and its alpha channel set to 1 meaning it is fully opaque.

### Screen Program

#### Vertex Shader
```glsl
#version 300 es

precision mediump float;

in vec2 position;

out vec2 texCoord;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    texCoord = (position + 1.0) / 2.0;
}
```

The vertex shader takes as input `position` which are the coordinates required to draw 2 triangles to cover the entire screen and outputs this as `gl_Position` to the fragment shader. 

The vertex shader also `texCoord` to be `(position + 1.0) / 2.0`. This is because in glsl screen-coordinates range from `[-1.0, 1.0]` whereas texture-coordinates range from `[0.0, 1.0]`.

#### Fragment Shader
```glsl
#version 300 es

precision mediump float;

in vec2 texCoord;

uniform sampler2D screenTexture;

out vec4 fragColor;

void main() {
    fragColor = texture(screenTexture, texCoord);
}
```

The fragment shader takes as input `texCoord` which was outputted from the vertex shader and a uniform sampler2D `screenTexture` which is the texture that will be drawn to the screen.

The fragment shader then sets each pixel on the screen to be the color of the `screenTexture` at its respective `texCoord`.

### Process Program

#### Vertex Shader
```glsl
#version 300 es

precision mediump float;

in vec2 position;

out vec2 texCoord;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    texCoord = (position + 1.0) / 2.0;
}
```

This vertex shader is identical to the screen program's vertex shader as they are both using a texture.

#### Fragment Shader
```glsl
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
```

This fragment shader takes all the same inputs as the screen program's fragment shader with the addition of 2 more uniforms `dimensions` and `fadeSpeed`.

The first part of this program is applying a simple 3x3 box-blur. This is done by summing up the `color` of the current pixel and all of its immediate neighbouring pixels. Here we are also making use of `dimensions`, this is because as the texture-coordinates range from `[0.0, 1.0]` and so our offset first has the be divided by the dimensions of the screen to get the `offsetCoord`. Finally the sum is divided by 9 to get the average.

The second part is to fade the entire screen. This reduces the RBG value of the `color` by the `fadeSpeed`.

Finally we set the `fragColor` to this new calculate `color`.

### Update Program

#### Vertex Shader
```glsl
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


out vec2 outPosition;
out vec2 outVelocity;

// rotates a vector by 'a' radians
vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

// sums the value of pixels in a square area
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

    // update agent's position
    outPosition = position + velocity / dimensions;

    // calculate sensor directions
    vec2 directionForward = velocity;
    vec2 directionRight = rotate(velocity, 0.5 * sensorFOV);
    vec2 directionLeft = rotate(velocity, -0.5 * sensorFOV);

    // sense
    vec4 senseForward = sense(texCoord + directionForward * sensorOffset / dimensions);
    vec4 senseRight = sense(texCoord + directionRight * sensorOffset / dimensions);
    vec4 senseLeft = sense(texCoord + directionLeft * sensorOffset / dimensions);

    // sum the RGB components of the sense vector
    float weightForward = senseForward.x + senseForward.y + senseForward.z;
    float weightRight = senseRight.x + senseRight.y + senseRight.z;
    float weightLeft = senseLeft.x + senseLeft.y + senseLeft.z;

    if (weightForward > weightRight && weightForward > weightLeft) {
        // continue forward
        outVelocity = velocity;
    } else if (weightRight > weightForward && weightRight > weightLeft) {
        // turn right
        outVelocity = velocity + directionRight * turnSpeed;
    } else if (weightLeft > weightForward && weightLeft > weightRight) {
        // turn left
        outVelocity = velocity + directionLeft * turnSpeed;
    } else {
        // continue forward
        outVelocity = velocity;
    }

    outVelocity = normalize(outVelocity);

    // boundary conditions
    if (outPosition.x <= -1.0 || outPosition.x >= 1.0) {
        outVelocity.x *= -1.0;
    }

    if (outPosition.y <= -1.0 || outPosition.y >= 1.0) {
        outVelocity.y *= -1.0;
    }
}
```

There are lots of components to this but the concept is fairly simple. 

#### Fragment Shader
```glsl
#version 300 es

precision mediump float;

void main() {}
```

As this update program simply writes agent data into buffers. The fragment shader is not used and so this is empty.


## JavaScript

### High-Level Overview

#### Agent Program
For the agent program we are going to need 2 buffers, one to store agent positions and the other to store agent velocities.

#### Screen Program

#### Process Program

#### Update Program