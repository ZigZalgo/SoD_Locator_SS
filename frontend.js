var zmq = require('zmq'),
	requestHandler = require('./requestHandler');
	
var request_socket = zmq.socket('rep');
var pull_socket = zmq.socket('pull');
var address = 'tcp://192.168.20.12:'
//var socketList = [socket];

requestHandler.start();

request_socket.bindSync(address + '5570');

request_socket.on('message', function (data) {
    console.log("Received request");
    requestHandler.handleRequest(data, request_socket);
});

request_socket.on('error', function(err){
	console.log("Error");
	console.log(err);
});

exports.updateSocket = function(portNumber){
    pull_socket.bindSync(address + portNumber);
    console.log(address + portNumber);
    console.log("this is updated");
}

exports.unbindSocket = function(portNumber){
    pull_socket.unbind(address + portNumber); //unbind? is it really unbinding? not tested, trivial for now...
    console.log(address + portNumber + ' removed.');
}

pull_socket.on('message', function (data) {
    console.log("Received request");
    requestHandler.handleRequest(data, pull_socket);
});

pull_socket.on('error', function(err){
    console.log("Error");
    console.log(err);
});