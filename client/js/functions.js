// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
	        window.webkitRequestAnimationFrame ||
	        window.mozRequestAnimationFrame    ||
	        window.oRequestAnimationFrame      ||
	        window.msRequestAnimationFrame     ||
	        function(callback){
	        	setTimeout(callback, 1000 / 60);
	        }
})();

function text2html(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function $(code){
	var select=code.slice(1,code.length);
	switch(code[0]){
		case '.':
			return document.getElementsByClassName(select);
		break;
		case '#':
			return document.getElementById(select);
		break;
		default:
			return document.getElementsByTagName(code);
		break;
	}
}

function fade(el,time,start,end,callback) {
	el.style.opacity = start;

	var begin = +new Date();
	var goal = begin + time;
	var diff = end - start;
	var tick = function() {
		var now = +new Date();
		if (now > goal){
			el.style.opacity = end;
			callback();
			return;
		}
		var op = diff * (now-begin)/(goal-begin)
		el.style.opacity = start <= end ? op : 1 + op;
		requestAnimationFrame(tick);
	}
	tick();
}

function ajaxGet(url,callback){
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onload = callback
	request.onerror = callback
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

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function wildcard(str, rule) {
	return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
}


function wildcardList(str,rules){
	for(var i in rules){
		if(wildcard(str,rules[i]))return true;
	}
	
	return false;
}
