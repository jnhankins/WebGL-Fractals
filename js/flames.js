"use strict";

function initFlames() {
	
	// Get the WebGL canvas
	const canvas = document.getElementById("glCanvas");
	
	// Initialize the WebGL context
	const gl = canvas.getContext("webgl");
	
	// Only continue if WebGL is available and working 
	if (!gl) {
		alert("Unable to initialize WebGL.");
		return;
	}
	
	// Set clear color to black
	gl.clearColor(1.0, 0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	var SCR_W = 800;
	var SCR_H = 800;
	var MAX_ITERS = 100;
	
	
	function renderLoop() {
		gl.clearColor(Math.random(), 0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		setTimeout(renderLoop, 500);
	}
	
	renderLoop();
}