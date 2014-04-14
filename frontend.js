var io = require('socket.io').listen(3000);
var zmq = require('zmq'),
    requestHandler = require('./requestHandler');
var factory = require('./factory');
var locator = requestHandler.locator;
	
var request_socket = zmq.socket('rep');
var pull_socket = zmq.socket('pull');
var address = 'tcp://192.168.20.12:'
//var socketList = [socket];

requestHandler.start();

io.sockets.on('connection', function (socket) {
    socket.on('getDevicesInView', function (device, fn) {
        fn(requestHandler.getDevicesInView(device));
    });
  
    socket.on('registerDevice', function(device){
    	requestHandler.registerDevice(device);
    });

    socket.on('setPairingState', function (data) {
        locator.setPairingState(data.additionalInfo.deviceID);
    });

    socket.on('unpairDevice', function (request) {
        locator.unpairDevice(request.additionalInfo.deviceID, request.additionalInfo.personID);
    });

    socket.on('sendOrientation', function (request) {
        var device = new factory.Device();
        device.Orientation = request.additionalInfo.orientation;
        device.ID = request.additionalInfo.deviceID;
        locator.updateDeviceOrientation(device);
    });

    socket.on('unpairDevice', function (request) {
        locator.unpairDevice(request.additionalInfo.deviceID, request.additionalInfo.personID);
    });

    socket.on('unpairAllPeople', function (request, fn) {
        locator.unpairAllPeople();
        fn(JSON.stringify({"status": 'success'}));
    });

    socket.on('sendDeviceInfoToServer', function (request, fn) {
        console.log("Got request to init device");
        locator.initDevice(request.additionalInfo.deviceID, request.additionalInfo.height, request.additionalInfo.width);
        fn(JSON.stringify({"status": 'success'}));
    });

    socket.on('getPeopleFromServer', function (request, fn) {
        locator.purgeInactivePersons();
        fn(JSON.stringify(locator.Persons));
    });

    socket.on('getDevicesWithSelection', function (request, fn) {
        locator.purgeInactiveDevices();
        console.log(request.additionalInfo.selection);
        switch(request.additionalInfo.selection){
            case 'all':
                fn(JSON.stringify(locator.Devices));
                break;
            case 'inView':
                console.log("GETTING ALL DEVICES IN VIEW");
                fn(JSON.stringify(locator.Persons))
                console.log(locator.getDevicesInFront(request.additionalInfo.deviceID));
                break;
            default:
                fn(JSON.stringify(locator.Devices));
        }
    });

    socket.on('forcePairRequest', function (request, fn) {
        var deviceID = request.additionalInfo.deviceID;
        var personID = request.additionalInfo.personID;
        locator.pairDevice(deviceID, personID, socket);
        fn(JSON.stringify({"status": 'success'}));
    });
});

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