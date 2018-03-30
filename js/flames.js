"use strict";

// Sierpinski Triangle
const affine0 = [0.5, 0, 0.433, 0.0, 0.5, -0.25];
const affine1 = [0.5, 0,-0.433, 0.0, 0.5, -0.25];
const affine2 = [0.5, 0, 0.0, 0.0, 0.5, 0.5];
const affines = [affine0, affine1, affine2];

function main() {
	
	// Get the WebGL canvas
	const canvas = document.getElementById("glCanvas");
	
	// Initialize the WebGL context
	const gl = initWebGL(canvas);
	
	// Initialize the program
	const programInfo = initProgram(gl);
	
	// Initialize the data buffers
	const programData = initProgramData(gl, programInfo);
	
	window.requestAnimationFrame(function(currTime) {
		animate(canvas, gl, programInfo, programData, currTime, currTime);
	});
}

function initProgram(gl) {
	
	// Vertex shader source code
	const vsSource =
		'attribute vec2 aVertexPosition;' +
		
		'uniform vec2 uScalingFactor;' +
		'uniform vec2 uRotation;' +
		
		'void main(void) {' +
		'  vec2 pos = vec2(' +
		'	aVertexPosition.x * uRotation.y + aVertexPosition.y * uRotation.x,' +
		'	aVertexPosition.y * uRotation.y - aVertexPosition.x * uRotation.x);' +
		'  gl_Position = vec4(pos * uScalingFactor, 0.0, 1.0);' +
		'  gl_PointSize = 2.0;' +
		'}';
	
	// Fragment shader source code
	const fsSource =
		'void main(void) {' +
		'  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);' +
		'}';
	
	// Create the shader program
	const shaderProgram = buildShaderProgram(gl, vsSource, fsSource);
	
	// Use the program
	gl.useProgram(shaderProgram);
	
	// Get program locations
	const programInfo = {
		program: shaderProgram,
		aVertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		uScalingFactor: gl.getUniformLocation(shaderProgram, 'uScalingFactor'),
		uRotation: gl.getUniformLocation(shaderProgram, 'uRotation'),
	};
	
	// REturn the program info
	return programInfo;
}

function initProgramData(gl, programInfo) {
	
	// Number of vertexes
	const NUM_VERTEXES = 100;
	
	const programData = {
		vertexes: initVertexes(gl, programInfo, NUM_VERTEXES),
	};
	
	/*
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = NUM_VERTEXES;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.FLOAT;
	const pixel = new Float32Array(NUM_VERTEXES*4);
	for (let v = 0; v < NUM_VERTEXES; v++) {
		pixel[v*4+0] = Math.random()*2.0 - 1.0;
		pixel[v*4+1] = Math.random()*2.0 - 1.0;
		pixel[v*4+2] = Math.random();
		pixel[v*4+3] = Math.random();
	}
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
				width, height, border, srcFormat, srcType,
				pixel);
	gl.generateMipmap(gl.TEXTURE_2D);
	*/
	
	return programData;
}

function initVertexes(gl, programInfo, vertexCount) {
	
	// Fill an array with vertexes in the unit square
	const vertexArray = new Float32Array(vertexCount*2);
	for (let v = 0; v < vertexArray.length; v++) {
		vertexArray[v] = Math.random()*2.0 - 1.0;
	}

	// Create an empty buffer object to store the vertex buffer
	const vertexBuffer = gl.createBuffer();

	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

	// Point the attribute to the currently bound VBO
	gl.vertexAttribPointer(programInfo.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
	
	// Enable the attribute
	gl.enableVertexAttribArray(programInfo.aVertexPosition);
	
	// Unbind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// Group the array and the buffer
	const vertexes = {
		count: vertexCount,
		array: vertexArray,
		buffer: vertexBuffer,
		shaderLocation: programInfo.aVertexPosition,
	};
	
	return vertexes;
}

function animate(canvas, gl, programInfo, programData, prevTime, currTime) {

	// Clear the canvas
	gl.clearColor(1.0, 1.0, 1.0, 0.0);

	// Clear the color buffer bit
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Required for some reason
	gl.enable(gl.DEPTH_TEST);
	
	// Set the view port
	gl.viewport(0, 0, glCanvas.width, glCanvas.height);
	
	// Update the aspect ratio
	const aspectRatio = glCanvas.width / glCanvas.height;
	const scaleX = aspectRatio > 1.0 ? 1.0/aspectRatio : 1.0;
	const scaleY = aspectRatio < 1.0 ? aspectRatio : 1.0;
	gl.uniform2fv(programInfo.uScalingFactor, [scaleX, scaleY]);
	
	// Monte Carlo iteration (iterative function loop)
	const vertexCount = programData.vertexes.count;
	const vertexArray = programData.vertexes.array;
	for (let v = 0; v < vertexCount; v++) {
		const affineIdx = Math.floor(Math.random()*3);
		const affine = affines[affineIdx];
		const x0 = vertexArray[v*2+0];
		const y0 = vertexArray[v*2+1];
		const x1 = affine0[0] * x0 + affine[1] * y0 + affine[2];
		const y1 = affine0[3] * x0 + affine[4] * y0 + affine[5];
		vertexArray[v*2+0] = x1;
		vertexArray[v*2+1] = y1;
	}

	// Pass the vertex data to the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, programData.vertexes.buffer);
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
	// Unbind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	
	// Make the points rotate
	let angle = (currTime / 1000.0) * (Math.PI / 2.0);
	gl.uniform2fv(programInfo.uRotation, [Math.sin(angle), Math.cos(angle)]);
	
	// Draw the triangle
	gl.drawArrays(gl.POINTS, 0, programData.vertexes.count);
	
	// Loop
	window.requestAnimationFrame(function(nextTime) {
		animate(canvas, gl, programInfo, programData, currTime, nextTime);
	});
}

function buildShaderProgram(gl, vsSource, fsSource) {
	// Create the vertex shader program
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	
	// If the shader failed to compile, bail out
	if (vertexShader == null) {
		return;
	}

	// Create the fragment shader program
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	
	// If the shader failed to compile, bail out
	if (vertexShader == null) {
		return;
	}

	// Create a shader program object to store
	// the combined shader program
	const shaderProgram = gl.createProgram();
	
	// Attach the vertex shader
	gl.attachShader(shaderProgram, vertexShader);
	
	// Attach the fragment shader
	gl.attachShader(shaderProgram, fragmentShader);
	
	// Link both the programs
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		throw "Error linking shader program:" + gl.getProgramInfoLog(shaderProgram);
	}

	// Return the program
	return shaderProgram;
}

function loadShader(gl, type, source) {
	
	// Create the shader object
	const shader = gl.createShader(type);

	// Send the source to the shader object
	gl.shaderSource(shader, source);

	// Compile the shader program
	gl.compileShader(shader);

	// If shader failed to compile, alert
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw "Error compiling " + (type === gl.VERTEX_SHADER ? "vertex" : "fragment") + " shader: " + gl.getShaderInfoLog(shader);
	}

	// Return the shader object
	return shader;
}

function initWebGL(canvas) {
	// Get the WebGL context
	const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	
	// Only continue if WebGL is available and working 
	if (!gl) throw "Unable to initialize WebGL."
	
	// Activate the OES_texture_float extension so we can use float textures
	const ext = gl.getExtension('OES_texture_float'); 
	
	// Only continue if we can use float textures
	if (!ext) throw "Unable to initialize 'OES_texture_float' extension.";
	
	return gl;
}
