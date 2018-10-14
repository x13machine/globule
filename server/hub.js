try{
	global.nodeID = fs.readFileSync(process.env.HOME + '/globule-id.txt').toString();
}catch(err){
	global.nodeID = crypto.randomBytes(8).toString('hex');
	fs.writeFile(process.env.HOME + '/globule-id.txt', nodeID);
}

console.log('nodeID',nodeID);

global.hubSocket = require('socket.io-client')(superConfig.hubApiUrl+'/'+superConfig.key+'?id='+nodeID+'&type=ffa',{
	'reconnectionDelay': 0
});

setInterval(function(){
	hubSocket.emit('players',{players: Object.keys(game.sockets).length.toString()});
},1000);

hubSocket.on('score',function(data){
	if(game.sockets[data.id])game.sockets[data.id].emit(optCodes['percentile'],data.percentile);
});

hubSocket.on('icmp',function(data){
	cp.execFile('ping', ['-c','1','-w','2',data.host], function(error, stdout, stderr){
		hubSocket.emit('icmp', {
			id: data.id,
			time: ((stdout.split('\n')[1] || '').split(' ').slice(-2)[0] || '').split('=')[1] * 1
		});
	});
});

