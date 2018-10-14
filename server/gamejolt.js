global.GJAPI = {
	base_url: "http://gamejolt.com/api/game/v1/",
	game_id: 0,
	private_key: "",
	format: "json",
	getURL: function(e, t) {
		t = t || {};
		var n = GJAPI.base_url + e + "/";
		if (Object.keys(t).length > 0) {
			n += "?";
			for (var r in t) {
				if (t.hasOwnProperty(r)) n += r + "=" + encodeURIComponent(t[r]) + "&"
			}
		}
		if (n.substr(n.length - 1) != "&") n += "?";
		n += "format=" + GJAPI.format + "&game_id=" + GJAPI.game_id;
		n += "&signature=" + crypto.createHash('md5').update(n + GJAPI.private_key).digest('hex');
		return n;
	},
	request: function(e, t, n) {
		if (arguments.length == 2) {
			n = t;
			t = {}
		}
		request(GJAPI.getURL(e, t), n)
	}
}

GJAPI.game_id = superConfig.gamejolt.gameID;
GJAPI.private_key = superConfig.gamejolt.key;

