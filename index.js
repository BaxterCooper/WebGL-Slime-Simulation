const agentParameters = {
    count: 100000,
    color: {r: 255, g: 255, b: 255},
    turnSpeed: 0.2
}

const sensorParameters = {
    FOV: 0.8,
    size: 0,
    offset: 3.0
}

const processParameters = {
    fadeSpeed: 0.01,
    blurSpeed: 0.0
}

const pane = new Tweakpane.Pane({
    title: 'Parameters',
});

const agentFolder = pane.addFolder({
    title: 'Agent Parameters',
    expanded: true
});

agentFolder.addInput(agentParameters, 'count');
agentFolder.addInput(agentParameters, 'color');
agentFolder.addInput(agentParameters, 'turnSpeed');

const sensorFolder = pane.addFolder({
    title: 'Sensor Parameters',
    expanded: true
});

sensorFolder.addInput(sensorParameters, 'FOV');
sensorFolder.addInput(sensorParameters, 'size');
sensorFolder.addInput(sensorParameters, 'offset');

const processFolder = pane.addFolder({
    title: 'Post-Processing Parameters',
    expanded: true
});

processFolder.addInput(processParameters, 'fadeSpeed');
processFolder.addInput(processParameters, 'blurSpeed');

pane.on('change', (event) => {
    agentParameters[event.presetKey] = event.value;
})


function main() {
    const gl = getContext();
    

    // ------------------------------------------------------------------------
    // PROGRAMS

    const agentProgram = createProgram(gl, './shaders/agent.vert', './shaders/agent.frag', null);
    const screenProgram = createProgram(gl, './shaders/screen.vert', './shaders/screen.frag', null);
    const processProgram = createProgram(gl, './shaders/process.vert', './shaders/process.frag', null);
    const updateProgram = createProgram(gl, './shaders/update.vert', './shaders/update.frag', ['outPosition', 'outVelocity']);


    // ------------------------------------------------------------------------
    // DATA

    const agents = new Array(agentParameters.count).fill(0).map(() => new Agent());

    const agentPositions = agents.map(agent => agent.position).flat();
    const agentVelocities = agents.map(agent => agent.velocity).flat();


    const screenVertices = [-1.0, -1.0,  -1.0, 1.0,  1.0, 1.0,  -1.0, -1.0,  1.0, -1.0,  1.0, 1.0]


    // ------------------------------------------------------------------------
    // TEXTURES

    const screenTexture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, screenTexture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const screenTexture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, screenTexture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    const screenTextureFramebuffer1 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, screenTextureFramebuffer1);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, screenTexture1, 0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const screenTextureFramebuffer2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, screenTextureFramebuffer2);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, screenTexture2, 0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // ------------------------------------------------------------------------
    // BUFFERS

    const agentPositionBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, agentPositionBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(agentPositions), gl.DYNAMIC_COPY);

    const agentVelocityBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, agentVelocityBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(agentVelocities), gl.DYNAMIC_COPY);


    const screenVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenVertices), gl.STATIC_DRAW);


    const agentPositionBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, agentPositionBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(agentPositions), gl.DYNAMIC_COPY);

    const agentVelocityBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, agentVelocityBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(agentVelocities), gl.DYNAMIC_COPY);


    // ------------------------------------------------------------------------
    // VAOs

    const agentVAO1 = gl.createVertexArray();
    gl.bindVertexArray(agentVAO1);
    gl.bindBuffer(gl.ARRAY_BUFFER, agentPositionBuffer1);
    gl.vertexAttribPointer(gl.getAttribLocation(agentProgram, 'position'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(agentProgram, 'position'));

    const agentVAO2 = gl.createVertexArray();
    gl.bindVertexArray(agentVAO2);
    gl.bindBuffer(gl.ARRAY_BUFFER, agentPositionBuffer2);
    gl.vertexAttribPointer(gl.getAttribLocation(agentProgram, 'position'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(agentProgram, 'position'));


    const screenVAO = gl.createVertexArray();
    gl.bindVertexArray(screenVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVerticesBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(screenProgram, 'position'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(screenProgram, 'position'));


    const processVAO = gl.createVertexArray();
    gl.bindVertexArray(processVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVerticesBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(processProgram, 'position'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(processProgram, 'position'));


    const updateVAO1 = gl.createVertexArray();
    gl.bindVertexArray(updateVAO1);
    gl.bindBuffer(gl.ARRAY_BUFFER, agentPositionBuffer1);
    gl.vertexAttribPointer(gl.getAttribLocation(updateProgram, 'position'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(updateProgram, 'position'));
    gl.bindBuffer(gl.ARRAY_BUFFER, agentVelocityBuffer1);
    gl.vertexAttribPointer(gl.getAttribLocation(updateProgram, 'velocity'), 2, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(updateProgram, 'velocity'));

    const updateVAO2 = gl.createVertexArray();
    gl.bindVertexArray(updateVAO2);
    gl.bindBuffer(gl.ARRAY_BUFFER, agentPositionBuffer2);
    gl.vertexAttribPointer(gl.getAttribLocation(updateProgram, 'position'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(updateProgram, 'position'));
    gl.bindBuffer(gl.ARRAY_BUFFER, agentVelocityBuffer2);
    gl.vertexAttribPointer(gl.getAttribLocation(updateProgram, 'velocity'), 2, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(updateProgram, 'velocity'));


    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    
    // ------------------------------------------------------------------------
    // RENDER

    let agentVAO = agentVAO1;
    let updateVAO = updateVAO1;

    let agentPositionBuffer = agentPositionBuffer2;
    let agentVelocityBuffer = agentVelocityBuffer2;

    let screenTexure = screenTexture1;
    let agentFramebuffer = screenTextureFramebuffer1;
    let processFramebuffer = screenTextureFramebuffer2;

    requestAnimationFrame(draw);

    function draw() {
        // draw agents to texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, agentFramebuffer);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.useProgram(agentProgram);
        const agentColor = Object.values(agentParameters.color).map((value) => value/255);
        gl.uniform3f(gl.getUniformLocation(agentProgram, 'agentColor'), ...agentColor);
        gl.bindVertexArray(agentVAO);
        gl.drawArrays(gl.POINTS, 0, agentParameters.count);


        // draw texture to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(screenProgram);

        gl.bindVertexArray(screenVAO);
        
        gl.bindTexture(gl.TEXTURE_2D, screenTexure);

        gl.drawArrays(gl.TRIANGLES, 0, 6);


        // apply post processing
        gl.bindFramebuffer(gl.FRAMEBUFFER, processFramebuffer);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(processProgram);

        gl.uniform2f(gl.getUniformLocation(processProgram, 'dimensions'), gl.canvas.width, gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(processProgram, 'fadeSpeed'), processParameters.fadeSpeed);
        
        gl.bindVertexArray(processVAO);
        
        gl.bindTexture(gl.TEXTURE_2D, screenTexure);

        gl.drawArrays(gl.TRIANGLES, 0, 6);


        // update agents
        gl.useProgram(updateProgram);
        gl.uniform2f(gl.getUniformLocation(updateProgram, 'dimensions'), gl.canvas.width, gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'turnSpeed'), agentParameters.turnSpeed);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'sensorFOV'), sensorParameters.FOV);
        gl.uniform1f(gl.getUniformLocation(updateProgram, 'sensorOffset'), sensorParameters.offset);
        gl.uniform1i(gl.getUniformLocation(updateProgram, 'sensorSize'), sensorParameters.size);
        gl.bindTexture(gl.TEXTURE_2D, screenTexure);

        gl.bindVertexArray(updateVAO);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, agentPositionBuffer);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, agentVelocityBuffer);
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);

        gl.drawArrays(gl.POINTS, 0, agentParameters.count);

        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

        // swap VAOs, buffers, textures and framebuffers
        if (agentVAO === agentVAO1) {
            agentVAO = agentVAO2;
            updateVAO = updateVAO2;
            agentPositionBuffer = agentPositionBuffer1;
            agentVelocityBuffer = agentVelocityBuffer1;
            screenTexure = screenTexture2;
            agentFramebuffer = screenTextureFramebuffer2;
            processFramebuffer = screenTextureFramebuffer1;

        } else {
            agentVAO = agentVAO1;
            updateVAO = updateVAO1;
            agentPositionBuffer = agentPositionBuffer2;
            agentVelocityBuffer = agentVelocityBuffer2;
            screenTexure = screenTexture1;
            agentFramebuffer = screenTextureFramebuffer1;
            processFramebuffer = screenTextureFramebuffer2;
        }

        requestAnimationFrame(draw);
    }
}

main();

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {*} vertexSourcePath 
 * @param {*} fragmentSourcePath 
 * @param {*} transformFeedbackVaryings 
 * @returns 
 */
function createProgram(gl, vertexSourcePath, fragmentSourcePath, transformFeedbackVaryings) {
    const vertexSource = fetch(vertexSourcePath);
    const fragmentSource = fetch(fragmentSourcePath);
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    if (transformFeedbackVaryings) {
        gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
    }

    gl.linkProgram(program);

    return program;
}

function getContext() {
    const canvas = document.getElementsByTagName("canvas")[0];
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const gl = canvas.getContext("webgl2");

    return gl;
}

function fetch(path, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, Boolean(callback));
    if (callback != null) {
        xhr.onload = function() {
            callback(xhr.responseText);
        };
    }
    xhr.send();
    return xhr.responseText;
}