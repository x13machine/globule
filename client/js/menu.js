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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

colorPickerInput(sessionStorage.color || getRandomInt(0,360));

function colorPickerInput(x){
	var canvas = $('#colorPicker');
	var ctx = canvas.getContext('2d');
	
	for(var i=0;i < canvas.width;i++){
		ctx.beginPath();
		ctx.rect(i, 0, 1, canvas.height);
		ctx.fillStyle = a2c(i * 2);
		ctx.fill();
	}
	ctx.lineWidth = 5;
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.beginPath();
	ctx.moveTo(x / 2, 0);
	ctx.lineTo(x / 2, canvas.width);
	ctx.stroke();
	
	var color = a2c(x);
	$('#colorNum').value = x;
	$('#colorNum').style.color = color;
	sessionStorage.color = x;
}

$('#colorPicker').onmousemove = function(data){
	if(data.buttons==1)colorPickerInput(data.offsetX * 2);
}

$('#colorPicker').onclick = function(data){
	colorPickerInput(data.offsetX * 2);
}

$('#colorNum').oninput = function(){
	this.value = Math.max(0,Math.min(360,Math.floor(this.value)));
	colorPickerInput(this.value);
}
