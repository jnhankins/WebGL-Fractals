"use strict";

const VERTEX_COUNT = 1000000;

// Fade IN/OUT Parameters
const FADEIN_TIME_MS = 1000;
const FADEOUT_TIME_MS = 3000;
const FADEOUT_PERCENT = 0.99;

// Affine parameters
const AFFINE0 = [0.5, 0.0, 0.433, 0.0, 0.5, -0.375];
const AFFINE1 = [0.5, 0.0, 0.0, 0.0, 0.5, 0.375];
const AFFINE2 = [0.5, 0.0,-0.433, 0.0, 0.5, -0.375];
const AFFINE3 = [ 0, 1, 0, -1, 0, 0];
const affine0 = AFFINE0.slice();
const affine1 = AFFINE1.slice();
const affine2 = AFFINE2.slice();
const affines = [affine0, affine1, affine2, AFFINE3];

// Animation Parameters
const TIME_SCALE = 0.5;
const ROTATE_RATE0 = -1/7;
const DRIFT_RATE0 = 1/700;
const ROTATE_RATE1 = 1/13;
const DRIFT_RATE1 = -1/1300;
const ROTATE_RATE2 = -1/23;
const DRIFT_RATE2 = 1/2300;

const COLOR_RATE = 1/180000;

const RNG_OFFSET = Math.random()*1e7;

function main() {

	// Get the WebGL canvas
	const canvas = document.getElementById("glCanvas");

	// Initialize the WebGL context
	const gl = initWebGL(canvas);

	// Initialize the program
	const programInfo = {
		fadeOutProgram: initFadeOutProgram(gl),
		fboProgram: initFboProgram(gl),
		canvasProgram: initCanvasProgram(gl),
	}

	// Initialize the data buffers
	const programData = initProgramData(gl, programInfo);

	// Initialize the mouse handler
	const mouse = initMouseHandler(canvas, programInfo);

	// Start the main render loop
	window.requestAnimationFrame(function(currTime) {
		animate(canvas, gl, programInfo, programData, mouse, currTime, currTime);
	});
}

function initFadeOutProgram(gl) {

	// Frame buffer vertex shader source code
	const vsSource =
		'attribute vec2 a_position;' +

		'void main(void) {' +
		'  gl_Position = vec4(a_position, 0.0, 1.0);' +
		'}';

	// Frame buffer fragment shader source code
	const fsSource =
		'precision mediump float;' +

		'uniform vec4 u_color;' +

		'void main(void) {' +
		'  gl_FragColor = u_color;' +
		'}';

	// Create the shader program
	const shaderProgram = buildShaderProgram(gl, vsSource, fsSource);

	// Bundle
	const programInfo = {
		program: shaderProgram,
		aPositionLocation: gl.getAttribLocation(shaderProgram, 'a_position'),
		uScalingLocation: gl.getUniformLocation(shaderProgram, 'u_scaling'),
		uColorLocation: gl.getUniformLocation(shaderProgram, 'u_color'),
	};

	return programInfo;
}

function initFboProgram(gl) {

	// Frame buffer vertex shader source code
	const vsSource =
		'attribute vec3 a_position;' +

		'varying float v_color;' +

		'void main(void) {' +
		'  v_color = a_position.z; ' +
		'  gl_Position = vec4(a_position.xy, 0.0, 1.0);' +
		'  gl_PointSize = 1.0;' +
		'}';

	// Frame buffer fragment shader source code
	const fsSource =
		'precision highp float;' +

		'uniform vec3 u_color0;' + 
		'uniform vec3 u_color1;' + 
		'uniform vec3 u_color2;' + 
		'varying float v_color;' +

		'void main(void) {' +
		'  float c0 = max(1.0 - v_color, 0.0);' +
		'  float c1 = 1.0 - abs(1.0 - v_color);' +
		'  float c2 = max(v_color - 1.0, 0.0);' +
		'  vec3 color = c0*u_color0 + c1*u_color1 + c2*u_color2;' +
		'  gl_FragColor = vec4(color.x, color.y, color.z, 0.99);' +
		//'  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);' +
		'}';

	// Create the shader program
	const shaderProgram = buildShaderProgram(gl, vsSource, fsSource);

	// Bundle
	const programInfo = {
		program: shaderProgram,
		aPositionLocation: gl.getAttribLocation(shaderProgram, 'a_position'),
		uColor0Location: gl.getUniformLocation(shaderProgram, 'u_color0'),
		uColor1Location: gl.getUniformLocation(shaderProgram, 'u_color1'),
		uColor2Location: gl.getUniformLocation(shaderProgram, 'u_color2'),
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
		'  gl_FragColor = texture2D(u_texture, v_texcoord);' +
		//'  vec4 texColor = texture2D(u_texture, v_texcoord);' +
		//'  float r = texColor.x;' +
		//'  float g = texColor.y;' +
		//'  float b = texColor.z;' +
		//'  float a = texColor.w;' + 
		//'  a = (a == 1.0 ? 0.0 : 1.0);' +
		//'  float z = a;' +
		//'  r *= z;' +
		//'  g *= z;' +
		//'  b *= z;' +
		//'  gl_FragColor = vec4(r, g, b, 1.0);' +
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
		 1.0, -1.0,
		-1.0, -1.0,
		-1.0,  1.0,
		// Second triangle:
		-1.0,  1.0,
		 1.0,  1.0,
		 1.0, -1.0
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
		pixelArray[p*4+0] = 0;
		pixelArray[p*4+1] = 0;
		pixelArray[p*4+2] = 0;
		pixelArray[p*4+3] = 0;
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
	const vertexCount = VERTEX_COUNT;

	// Fill an array with points in the unit square
	const vertexArray = new Float32Array(vertexCount*3);
	for (let v = 0; v < vertexCount; v++) {
		vertexArray[v*3+0] = Math.random()*2.0 - 1.0;
		vertexArray[v*3+1] = Math.random()*2.0 - 1.0;
		vertexArray[v*3+2] = Math.floor(Math.random()*3.0);
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

function initMouseHandler(canvas, programInfo) {
	var mouseDown = false;
	var lastMouseX = 0;
	var lastMouseY = 0;

	function handleMouseDown(event) {
		mouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
		//console.log('x=' + lastMouseX + ' y=' + lastMouseY + ' mouseDown=TRUE');
	}

	function handleMouseUp(event) {
		mouseDown = false;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
		//console.log('x=' + lastMouseX + ' y=' + lastMouseY + ' mouseDown=FALSE');
	}

	function handleMouseMove(event) {
		let newX = event.clientX;
		let newY = event.clientY;

		/*
		var deltaX = newX - lastMouseX;
		var newRotationMatrix = mat4.create();
		mat4.identity(newRotationMatrix);
		mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

		var deltaY = newY - lastMouseY;
		mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

		mat4.multiply(newRotationMatrix, moonRotationMatrix, moonRotationMatrix);
		*/

		lastMouseY = newY;
		lastMouseX = newX
		//console.log('x=' + lastMouseX + ' y=' + lastMouseY + ' mouseDown=' + mouseDown);
	}

	canvas.onmousedown = handleMouseDown;
	canvas.onmouseup = handleMouseUp;
	canvas.onmousemove = handleMouseMove;

	return {
		mouseDown: function() { return mouseDown;  },
		lastMouseX: function() { return lastMouseX; },
		lastMouseY: function() { return lastMouseY; },
	};
}

function animate(canvas, gl, programInfo, programData, mouse, prevTime, currTime) {

	mouseAnimation(mouse, RNG_OFFSET+TIME_SCALE*currTime);

	renderFadeOut(canvas, gl, programInfo.fadeOutProgram, programData, prevTime, currTime, false);

	renderTexture(canvas, gl, programInfo.fboProgram, programData, prevTime, currTime);

	renderFadeOut(canvas, gl, programInfo.fadeOutProgram, programData, prevTime, currTime, true);

	renderCanvas(canvas, gl, programInfo.canvasProgram, programData, prevTime, currTime);

	// Loop
	window.requestAnimationFrame(function(nextTime) {
		animate(canvas, gl, programInfo, programData, mouse, currTime, nextTime);
	});
}

function mouseAnimation(mouse, currTime) {
	const mPos = getMousePosition(mouse);
	copyAffine(AFFINE0, affine0);
	copyAffine(AFFINE1, affine1);
	copyAffine(AFFINE2, affine2);
	animateAffine(mPos, affine0, currTime, ROTATE_RATE0, DRIFT_RATE0);
	animateAffine(mPos, affine1, currTime, ROTATE_RATE1, DRIFT_RATE1);
	animateAffine(mPos, affine2, currTime, ROTATE_RATE2, DRIFT_RATE2);

	//animateAffine(mPos, affine3, currTime, 1/91);
}

function getMousePosition(mouse) {
	let canvasW = 1024;
	let canvasH = 1024;
	let mouseX = +2.0*mouse.lastMouseX()/canvasW - 1.0;
	let mouseY = -2.0*mouse.lastMouseY()/canvasH + 1.0;
	return {
		x: mouseX,
		y: mouseY,
	}
}

function copyAffine(src, dst) {
	dst[0] = src[0];
	dst[1] = src[1];
	dst[2] = src[2];
	dst[3] = src[3];
	dst[4] = src[4];
	dst[5] = src[5];
}

function animateAffine(mPos, affine, currTime, rotationRate, DRIFT_RATE) {

/*
	const DIST = 1.7320381058163818/2;
	const aPos = getAffinePosition(affine);
	const dist = distance(mPos, aPos);
	//if (dist > DIST)
	//	return;
	let radians = Math.atan2(mPos.x-aPos.x, mPos.y-aPos.y);
	//radians *= (1.0/(dist*dist+1.0));//(1.0-(dist/DIST));
	//const radians = (1.0-(dist/DIST))*Math.PI*0.5;
	console.log('dx='+(mPos.x-aPos.x)+' dy='+(mPos.y-aPos.y) + ' angle='+radians);
	console.log('dx='+(mPos.x-aPos.x)+' dy='+(mPos.y-aPos.y) + ' angle='+currAngle);
*/
	const currAngle = rotationRate*(currTime/1000.0)*(2*Math.PI);
	rotateAffine(affine, currAngle);

	const t = DRIFT_RATE * currTime;
	const dr = Math.sin(t)*0.25;
	const dx = Math.sin(t)*dr;
	const dy = Math.cos(t)*dr;
	moveAffine(affine, dx, dy);
}

function getAffinePosition(affine) {
	const A = affine[0];
	const B = affine[1];
	const C = affine[2];
	const D = affine[3];
	const E = affine[4];
	const F = affine[5];
	const Z = A + E + B*D - A*E - 1;
	const X = (C*(E-1) - B*F) / Z;
	const Y = (F*(A-1) - C*D) / Z;
	return {
		x: X,
		y: Y,
	}
}

function rotateAffine(affine, radians) {
	const A = affine[0];
	const D = affine[3];
	const B = affine[1];
	const E = affine[2];
	const sin = Math.sin(radians);
	const cos = Math.cos(radians);
	const a = A * cos + D * sin;
	const d = D * cos - A * sin;
	const b = B * cos + E * sin;
	const e = E * cos - B * sin;
	affine[0] = a;
	affine[3] = d;
	affine[1] = b;
	affine[2] = e;
}

function moveAffine(affine, dx, dy) {
	affine[2] += dx;
	affine[5] += dy;
}

function distance(p0, p1) {
	return Math.sqrt((p0.x-p1.x)*(p0.x-p1.x) + (p0.y-p1.y)*(p0.y-p1.y));
}

function renderFadeOut(canvas, gl, programInfo, programData, prevTime, currTime, fadeIn) {
	// Calculate the amount 
	const fadeInAmount = 1.0 - Math.pow(Math.min(currTime/FADEIN_TIME_MS, 1.0), 2.0);
	const fadeOutAmount = 1.0 - Math.pow(1.0 - FADEOUT_PERCENT, (currTime - prevTime)/FADEOUT_TIME_MS);
	const fadeAmount = fadeIn ? fadeInAmount : fadeOutAmount;
	if (fadeAmount == 0.0) {
		return;
	}
	if (!fadeIn) console.log(fadeAmount);

	currTime - FADEIN_TIME_MS

	// Switch the render output location to the FBO
	gl.bindFramebuffer(gl.FRAMEBUFFER, programData.frameBuffer);

	// Clear the color buffer bit
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// Required for some reason
	gl.disable(gl.DEPTH_TEST);

	// Enable blending
	gl.enable(gl.BLEND);

	// Blend function
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	// Set the shader program
	gl.useProgram(programInfo.program);

	// Set the view port
	gl.viewport(0, 0, 1024, 1024);

	// Set the fade out color
	gl.uniform4fv(programInfo.uColorLocation, new Float32Array([0.0, 0.0, 0.0, fadeAmount]));

	// Turn on the position attribute
	gl.enableVertexAttribArray(programInfo.aPositionLocation);

	// Bind the position buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, programData.positionBuffer);

	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	gl.vertexAttribPointer(programInfo.aPositionLocation, 2, gl.FLOAT, false, 0, 0);

	// Draw the triangle
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// Generate a mipmap for the rendered texture
	gl.bindTexture(gl.TEXTURE_2D, programData.texture);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Switch the render output location back to the canvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// Required for some reason
	gl.disable(gl.BLEND);
}

//var n = 0;
function renderTexture(canvas, gl, programInfo, programData, prevTime, currTime) {
	//n += programData.points.vertexCount;
	//console.log((n/(currTime/1000)) + ' pts per second');

	// Switch the render output location to the FBO
	gl.bindFramebuffer(gl.FRAMEBUFFER, programData.frameBuffer);

	// Clear the color buffer bit
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// Required for some reason
	gl.disable(gl.DEPTH_TEST);

	// Enable blending
	gl.enable(gl.BLEND);

	// Blend function
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	// Set the shader program
	gl.useProgram(programInfo.program);

	// Set the view port
	gl.viewport(0, 0, 1024, 1024);

	let h = (RNG_OFFSET+currTime)*COLOR_RATE;
	let h0 = (h + 5.0/12.0) % 1.0;
	let h1 = h;
	let h2 = (h + 17.0/12.0) % 1.0;
	console.log(h0 + ' ' + h1 + ' ' + h2);
	
	let color0 = HSVtoRGB(h0, 1, 1);
	let color1 = HSVtoRGB(h1, 1, 1);
	let color2 = HSVtoRGB(h2, 1, 1);

	gl.uniform3fv(programInfo.uColor0Location, color0);
	gl.uniform3fv(programInfo.uColor1Location, color1);
	gl.uniform3fv(programInfo.uColor2Location, color2);

	// Monte Carlo iteration (iterative function loop)
	const vertexCount = programData.points.vertexCount;
	const vertexArray = programData.points.vertexArray;
	for (let v = 0; v < vertexCount; v++) {
		const rand = Math.random()*3*2;
		const affineIdx = Math.floor(rand < 3 ? rand : 3);
		//console.log(rand + " " + affineIdx);
		const affine = affines[affineIdx];
		const x0 = vertexArray[v*3+0];
		const y0 = vertexArray[v*3+1];
		const x1 = affine[0] * x0 + affine[1] * y0 + affine[2];
		const y1 = affine[3] * x0 + affine[4] * y0 + affine[5];
		vertexArray[v*3+0] = x1;
		vertexArray[v*3+1] = y1;
		if (affineIdx <= 2) {
			const c0 = vertexArray[v*3+2];
			const c1 = (c0 + affineIdx) * 0.5;
			vertexArray[v*3+2] = c1;
		}
	}

	// Turn on the position attribute
	gl.enableVertexAttribArray(programInfo.aPositionLocation);

	// Bind the position buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, programData.points.vertexBuffer);

	// Pass the vertex data to the buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexArray);

	// Point the attribute to the currently bound VBO
	gl.vertexAttribPointer(programInfo.aPositionLocation, 3, gl.FLOAT, false, 0, 0);

	// Draw the triangle
	gl.drawArrays(gl.POINTS, 0, vertexCount);

	// Generate a mipmap for the rendered texture
	gl.bindTexture(gl.TEXTURE_2D, programData.texture);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Switch the render output location back to the canvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// Required for some reason
	gl.disable(gl.BLEND);
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b];
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