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
	const programInfo = {
		fboProgram: initFboProgram(gl),
		canvasProgram: initCanvasProgram(gl),
	}

	// Initialize the data buffers
	const programData = initProgramData(gl, programInfo);

	window.requestAnimationFrame(function(currTime) {
		animate(canvas, gl, programInfo, programData, currTime, currTime);
	});
}


function initFboProgram(gl) {
	
	// Frame buffer vertex shader source code
	const vsSource =
		'attribute vec2 a_position;' +
		'uniform vec2 u_scaling;' +
		
		'void main(void) {' +
		'  gl_Position = vec4(a_position * u_scaling, 0.0, 1.0);' +
		'  gl_PointSize = 1.0;' +
		'}';
	
	// Frame buffer fragment shader source code
	const fsSource =
		'void main(void) {' +
		'  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);' +
		'}';
	
	// Create the shader program
	const shaderProgram = buildShaderProgram(gl, vsSource, fsSource);
	
	// Bundle
	const programInfo = {
		program: shaderProgram,
		aPositionLocation: gl.getAttribLocation(shaderProgram, 'a_position'),
		uScalingLocation: gl.getUniformLocation(shaderProgram, 'u_scaling'),
	};
	
	return programInfo;
}

function initCanvasProgram(gl) {
	
	// Vertex shader source code
	const vsSource = // 'void main() {}';
		'attribute vec4 a_position;' +
		'attribute vec2 a_texcoord;' +
		
		'varying vec2 v_texcoord;' +
		'void main() {' +
		'  gl_Position = a_position;' +
		'  v_texcoord = a_texcoord;' +
		'}';
	
	// Fragment shader source code
	const fsSource =
		'precision mediump float;' +
		
		'varying vec2 v_texcoord;' +
		
		'uniform sampler2D u_texture;' +
		
		'void main() {' +
		'   gl_FragColor = texture2D(u_texture, v_texcoord);' +
		'}';
	
	const shaderProgram = buildShaderProgram(gl, vsSource, fsSource);
	
	return {
		program: shaderProgram,
		aPositionLocation: gl.getAttribLocation(shaderProgram, "a_position"),
		aTexcoordLocation: gl.getAttribLocation(shaderProgram, "a_texcoord"),
		uTextureLocation: gl.getUniformLocation(shaderProgram, "u_texture"),
	};
}

function initProgramData(gl) {
	const quadVtxCoords = initQuadVtxCoords(gl);
	const quadTxtCoords = initQuadTexCoords(gl);
	const quadTexture = initQuadTexture(gl);
	const frameBuffer = initFrameBuffer(gl, quadTexture);
	const pointsCoords = initPointsCoords(gl);

	return {
		positionBuffer: quadVtxCoords.vertexBuffer,
		texcoordBuffer: quadTxtCoords.vertexBuffer,
		texture: quadTexture.texture,
		frameBuffer: frameBuffer.frameBuffer,
		points: pointsCoords,
	};
}

function initQuadVtxCoords(gl) {

	// Quad = Two Triangles => Six Vertexes
	const vertexCount = 6;
	
	// Set the vertex positions
	const vertexArray = new Float32Array([
		// First triangle:
		 1.0,  1.0,
		-1.0,  1.0,
		-1.0, -1.0,
		// Second triangle:
		-1.0, -1.0,
		 1.0, -1.0,
		 1.0,  1.0
	]);

	// Create an empty buffer object to store the verties
	const vertexBuffer = gl.createBuffer();

	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

	return {
		vertexCount: vertexCount,
		vertexArray: vertexArray,
		vertexBuffer: vertexBuffer,
	};
}

function initQuadTexCoords(gl) {

	// Quad = Two Triangles => Six Vertexes
	const vertexCount = 6;

	const vertexArray = new Float32Array([
		// First triangle:
		 1.0,  0.0,
		 0.0,  0.0,
		 0.0,  1.0,
		// Second triangle:
		 0.0,  1.0,
		 1.0,  1.0,
		 1.0,  0.0
	]);

	// Create an empty buffer object to store the texcoords
	const vertexBuffer = gl.createBuffer();

	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

	return {
		vertexCount: vertexCount,
		vertexArray: vertexArray,
		vertexBuffer: vertexBuffer,
	};
}

function initQuadTexture(gl) {
	// Texture Parameters
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1024;
	const height = 1024;
	const border = 0;
	const format = gl.RGBA;
	const type = gl.UNSIGNED_BYTE;

	// Texture pixel content
	const pixelArray = new Uint8Array(width*height*4);
	for (let p = 0; p < width * height; p++) {
		pixelArray[p*4+0] = 255;
		pixelArray[p*4+1] = 0;
		pixelArray[p*4+2] = 0;
		pixelArray[p*4+3] = 255;
	}

	// Create the GL texture
	const texture = gl.createTexture();
	
	// Bind the texture so we can work with it
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	// Initialize the texture
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			width, height, border, format, type, pixelArray);
	
	// Generate a mipmap
	gl.generateMipmap(gl.TEXTURE_2D);

	// Clean up
	gl.bindTexture(gl.TEXTURE_2D, null);

	return {
		width: width,
		height: height,
		pixelArray: pixelArray,
		texture: texture,
	};
}

function initFrameBuffer(gl, quadTexture) {

	// Create a frame buffer object
	const frameBuffer = gl.createFramebuffer();
	
	// Bind the frame buffer so we can work with it
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

	// Make the size of the frame buffer match the texture
	frameBuffer.width = quadTexture.width;
	frameBuffer.height = quadTexture.height;

	// Create a render buffer to store depth information while rendering
	const renderbuffer = gl.createRenderbuffer();

	// Bind in the render buffer so we can work with it
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

	// Initialize the render buffer's data store
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBuffer.width, frameBuffer.height);

	// Bind in the texture so we can attach it
	gl.bindTexture(gl.TEXTURE_2D, quadTexture.texture);

	// Attach our texture to the frame buffer to serve as the color data store
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, quadTexture.texture, 0);

	// Attach our render buffer to the frame buffer to serve as the depth data store
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	// Clean up
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);

	return {
		frameBuffer: frameBuffer,
	};
}

function initPointsCoords(gl) {
	
	// Constant number of points
	const vertexCount = 10000;
	
	// Fill an array with points in the unit square
	const vertexArray = new Float32Array(vertexCount*2);
	for (let v = 0; v < vertexArray.length; v++) {
		vertexArray[v] = Math.random()*2.0 - 1.0;
	}

	// Create an empty buffer object to store the vertexes
	const vertexBuffer = gl.createBuffer();

	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);

	return {
		vertexCount: vertexCount,
		vertexArray: vertexArray,
		vertexBuffer: vertexBuffer,
	};
}

function animate(canvas, gl, programInfo, programData, prevTime, currTime) {
	
	renderTexture(canvas, gl, programInfo.fboProgram, programData, prevTime, currTime);
	
	renderCanvas(canvas, gl, programInfo.canvasProgram, programData, prevTime, currTime);
	
	// Loop
	window.requestAnimationFrame(function(nextTime) {
		animate(canvas, gl, programInfo, programData, currTime, nextTime);
	});
}

var n = 0;

function renderTexture(canvas, gl, programInfo, programData, prevTime, currTime) {
	n += programData.points.vertexCount;
	console.log((n/(currTime/1000)) + ' pts per second');

	// Switch the render output location to the FBO
	gl.bindFramebuffer(gl.FRAMEBUFFER, programData.frameBuffer);
	
	// Clear the canvas
	//gl.clearColor(0.0, 1.0, 0.0, 1.0);
	
	// Clear the color buffer bit
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Required for some reason
	gl.enable(gl.DEPTH_TEST);
	
	// Set the shader program
	gl.useProgram(programInfo.program);
	
	// Set the view port
	gl.viewport(0, 0, 1024, 1024);
	
	// Update the aspect ratio
	const aspectRatio = glCanvas.width / glCanvas.height;
	const scaleX = aspectRatio < 1.0 ? 1.0/aspectRatio : 1.0;
	const scaleY = aspectRatio > 1.0 ? aspectRatio : 1.0;
	gl.uniform2fv(programInfo.uScalingLocation, [scaleX, scaleY]);
	
	// Monte Carlo iteration (iterative function loop)
	const vertexCount = programData.points.vertexCount;
	const vertexArray = programData.points.vertexArray;
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

	// Turn on the position attribute
	gl.enableVertexAttribArray(programInfo.aPositionLocation);
	
	// Bind the position buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, programData.points.vertexBuffer);

	// Pass the vertex data to the buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexArray);

	// Point the attribute to the currently bound VBO
	gl.vertexAttribPointer(programInfo.aPositionLocation, 2, gl.FLOAT, false, 0, 0);
	
	// Draw the triangle
	gl.drawArrays(gl.POINTS, 0, vertexCount);
	
	// Generate a mipmap for the rendered texture
	gl.bindTexture(gl.TEXTURE_2D, programData.texture);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Switch the render output location back to the canvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function renderCanvas(canvas, gl, programInfo, programData, prevTime, currTime) {
	
	// Clear the canvas
	gl.clearColor(1.0, 1.0, 1.0, 0.0);
	
	// Clear the color buffer bit
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Required for some reason
	gl.enable(gl.DEPTH_TEST);
	
	// Set the shader program
	gl.useProgram(programInfo.program);
	
	// Set the view port
	gl.viewport(0, 0, glCanvas.width, glCanvas.height);

	// Turn on the position attribute
	gl.enableVertexAttribArray(programInfo.aPositionLocation);

	// Bind the position buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, programData.positionBuffer);

	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	gl.vertexAttribPointer(programInfo.aPositionLocation, 2, gl.FLOAT, false, 0, 0)

	// Turn on the teccord attribute
	gl.enableVertexAttribArray(programInfo.aTexcoordLocation);

	// Bind the position buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, programData.texcoordBuffer);

	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	gl.vertexAttribPointer(programInfo.aTexcoordLocation,  2, gl.FLOAT, false, 0, 0)

	// Tell the shader to use texture unit 0 for u_texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, programData.texture);
	gl.uniform1i(programInfo.uTextureLocation, 0);

	// Draw the geometry.
	gl.drawArrays(gl.TRIANGLES, 0, 6);
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