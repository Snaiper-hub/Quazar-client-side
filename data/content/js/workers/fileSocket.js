var net = require('net');
var fs = require('fs');
var filePath = process.env.filePath;
var fileSocket = net.createConnection(9090, process.env.serverAddress, function () {
	process.send({
		type: 'serverConnectionEstablished'
	});
});
var ws = fs.createWriteStream(filePath, {
	bufferSize: 1024 * 1024
});

function rounding(speed){
	if(speed <= 1024){
		speed = speed + ' В/сек.';
	} else if(speed <= 1048576){
		speed = (speed/1024).toFixed(1) + ' КВ/сек.';
	} else if(speed <= 1073741824){
		speed = (speed/1048576).toFixed(1) + ' МВ/сек.';
	}
	return speed;
}

try{
	fileSocket.pipe(ws);
}catch(err){
// try something smart here
}

var biteStamp = 0;
var speedCheck = setInterval(function () {
	var speed = rounding(fileSocket.bytesRead - biteStamp);
	process.send({
		type: 'progressUpdate',
		speed: speed,
		bytesRead: fileSocket.bytesRead
	});
	biteStamp = fileSocket.bytesRead;
}, 1000);

fileSocket.on('close', function () {
	process.send({
		type: 'workerExit',
		bytesRead: fileSocket.bytesRead
	});
	clearInterval(speedCheck);
	fileSocket.destroy();
	process.exit();
});

fileSocket.on('error', function (err) {
	process.send({
		type: 'error',
		err: err
	});
});