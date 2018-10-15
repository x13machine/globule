function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r:0,g:0,b:255};
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(c) {
	return componentToHex(c[0]) + componentToHex(c[1]) + componentToHex(c[2]);
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
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

function getRandom(low, high) {
	return ~~(Math.random() * (high - low)) + low;
}

function getRandomFloat(low, high) {
	return Math.random() * (high - low) + low;
}

function x2c(x){
	return rgbToHex(HSVtoRGB(1/360*x,1,1));
}

function a2c(a){
	return '#' + x2c(a);
}

if(typeof global == "object"){
	global.hexToRgb = hexToRgb;
	global.componentToHex = componentToHex;
	global.rgbToHex = rgbToHex;
	global.HSVtoRGB = HSVtoRGB;
	global.getRandom = getRandom;
	global.a2c = a2c;
	global.x2c = x2c;
}
