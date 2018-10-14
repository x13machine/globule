global.uuid = function (){
	return crypto.randomBytes(8).toString('base64').slice(0, -1);
}

global.validIP = function(ip){
	return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}  

global.validNumber = function(v,b,t){
	return typeof v == 'number' && b <= v && v<=t;
}
global.getKeyByValue = function(obj,value) {
	for( var prop in obj ) {
		if(obj[ prop ] === value)return prop;
	}
}
