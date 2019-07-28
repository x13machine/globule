import crypto from 'crypto';

function uuid(){
	return crypto.randomBytes(8).toString('base64').slice(0, -1);
}

function validIP(ip){
	return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function validNumber(v,b,t){
	return typeof v === 'number' && b <= v && v<=t;
}

function getKeyByValue(obj,value) {
	for( let prop in obj ) {
		if(obj[ prop ] === value)return prop;
	}

}

export default {
	uuid,
	validIP,
	validNumber,
	getKeyByValue
};
