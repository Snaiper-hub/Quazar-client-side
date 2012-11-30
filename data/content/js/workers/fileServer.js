var net = require('net');
var fs = require('fs');

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

var server = net.createServer(function (socket) {
	var filePath = process.env.filePath;
	var rs = fs.createReadStream(filePath, {
		bufferSize: 1024 * 1024
	});
	try{
		rs.pipe(socket);
	}catch(err){
	// try something smart here too
	}
	var biteStamp = 0;
	var speedCheck = setInterval(function () {
		var speed = rounding(socket.bytesWritten - biteStamp);
		process.send({
			type: 'progressUpdate',
			speed: speed,
			bytesWritten: socket.bytesWritten
		});
		biteStamp = socket.bytesWritten;
	}, 1000);

	rs.on('end', function () {
		process.send({
			type: 'workerExit',
			bytesWritten: socket.bytesWritten
		});
		clearInterval(speedCheck);
		socket.destroy();
		process.exit();
	});
	
}).listen(9090, function () {
	process.send({
		type: 'serverReady'
	});
});