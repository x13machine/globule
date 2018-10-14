function connect(host){
	var uri = (location.protocol == 'http:' ? 'ws://': 'wss://') + (host  || location.host);
	
	window.serverUrl = location.protocol+ '//' + (host  || location.host);
	var ws = new WebSocket(uri);
	var socket = {
		messages:[],
		callbacks:{},
		ws: ws,
		call: function(type,data){
			var callback = socket.callbacks[type];
			if(callback)callback(data);
		},
		on: function(type,callback){
			socket.callbacks[type]=callback;
		},
		append: function(a,b){
			b = b || null;
			if(a)socket.messages = socket.messages.concat([a,b]);
		},
		emit: function(a,b){
			b = b || null;
			if(a)socket.messages = socket.messages.concat([a,b]);
			ws.send(BISON.encode(socket.messages));
			socket.messages = [];
		}
	}
	
	ws.onmessage = function(message) {
		var data = BISON.decode(message.data);
		
		if(!Array.isArray(data) || data.length % 2 == 1)return;
		for(var i=0;i<data.length;i+=2){
			socket.call(data[i],data[i+1]);
		}
	}
	
	return socket;
}
