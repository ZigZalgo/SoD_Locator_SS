var zmq = require('zmq'),
	requestHandler = require('./requestHandler');
	
var request_socket = zmq.socket('rep');
var pull_socket = zmq.socket('pull');
var address = 'tcp://192.168.20.12:'
//var socketList = [socket];

requestHandler.start();

request_socket.bindSync(address + '5570');

request_socket.on('message', function (data) {
    //console.log("Received request on request socket");
    console.log(data);
    requestHandler.handleRequest(data, request_socket);
});

request_socket.on('error', function(err){
	console.log("Error");
	console.log(err);
});

exports.updatePairSocket = function(portNumber){
    pull_socket.bindSync(address + portNumber);
    console.log(address + portNumber);
    console.log("Pair Socket is updated");
}

exports.updateRequestSocket = function(portNumber){
    request_socket.bindSync(address + portNumber);
    console.log(address + portNumber);
    console.log("Request Socket is updated");
}

exports.unbindSocket = function(portNumber){
    pull_socket.unbind(address + portNumber); //unbind? is it really unbinding? not tested, trivial for now...
    console.log(address + portNumber + ' removed.');
}

pull_socket.on('message', function (data) {
    //console.log("Received request on pull socket");
    requestHandler.handleRequest(data, pull_socket);
});

pull_socket.on('error', function(err){
    console.log("Error");
    console.log(err);
});