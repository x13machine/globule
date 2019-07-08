var config = {
	'https':false,
	'port':5050,
	'host': '0.0.0.0',
	'max':1000,
	'game': {
		'width':10000,
		'height':10000,
		'statUpdate':1000,
		'minRadius':10,
		'globHalfLife':100000,
		'playerHalfLife': 103000,
		'shootSizeRadio':0.04,
		'shootSpeed':30,
		'maxSpeed':500,
		'maxGlobs':1100,
		'globSpeed':20,
		'startRating': 100,
		'maxMassPercent':0.1,
		'colSize':400,
		'maxDelta':1,
		'playerSize':75,
		'globSize':70,
		'blockSize':400,
		'maxDim':3000,
		'addDim':300,
		'maxCamUpdate':0.1, 
		'tps':60
	}
};

module.exports = config;