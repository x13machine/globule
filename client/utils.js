// shim layer with setTimeout fallback
function requestAnimFrame(callback){
	(window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	((callback) => setTimeout(callback, 1000 / 60)))(callback);
}

function ajaxGet(url,callback){
	let request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onload = callback;
	request.onerror = callback;
	request.send();
}

function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : {r:0,g:0,b:255};
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function componentToHex(c) {
	let hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(c) {
	return componentToHex(c[0]) + componentToHex(c[1]) + componentToHex(c[2]);
}

function HSVtoRGB(h, s, v) {
	let r, g, b, i, f, p, q, t;
	if (arguments.length === 1) {
		s = h.s, v = h.v, h = h.h;
	}
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
	return [Math.floor(r * 255),Math.floor(g * 255),Math.floor(b * 255)]
}

function x2c(x){
	return rgbToHex(HSVtoRGB(1/360*x,1,1));
}


export default {
	requestAnimFrame,
	ajaxGet,
	hexToRgb,
	getRandomInt,
	x2c
};