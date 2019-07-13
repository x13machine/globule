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
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onload = callback;
	request.onerror = callback;
	request.send();
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : {r:0,g:0,b:255};
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
	requestAnimFrame,
	ajaxGet,
	hexToRgb,
	getRandomInt
};