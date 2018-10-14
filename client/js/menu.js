var quotes = $(".quotes");
var quoteIndex = 0;
var quoteDelay = 1000;
var quoteFade = 2000;

function showNextQuote() {
	quoteIndex++;
	var quote = quotes[quoteIndex % quotes.length];
	quote.style.display = 'block';
	fade(quote,quoteFade,0,1,function(){
		setTimeout(function(){
			fade(quote,quoteFade,1,0,function(){
				quote.style.display = 'none';
				showNextQuote();
			});
		},quoteDelay);
	});
}

showNextQuote();

var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

if(!isChrome)$('#not-chrome').style.display='block';

$('#play').onclick = start;
$('#spectate').onclick = start;
$('#nick').onkeypress = function(e){
	if(e.keyCode == 13) start();
}

$('#nick').value = sessionStorage.nick || '';
$('#color').value = sessionStorage.color || '#0000FF';
