var zmq = require('zmq'),
	requestHandler = require('./requestHandler');
	
var pull_socket = zmq.socket('pull');

requestHandler.start();

pull_socket.bindSync('tcp://192.168.20.179:5570');
	
pull_socket.on('message', function (data) {	
	requestHandler.handleRequest(data);
});	

pull_socket.on('error', function(err){
	console.log("Error");
	console.log(err);
});