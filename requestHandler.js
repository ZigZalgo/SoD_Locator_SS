var locator = require('./locator');
var factory = require('./factory');
var frontend = require('./frontend');
var util = require('./util');
var portList = [];

// TODO: test!
exports.start = function (){
	locator.start();
}

exports.getDevicesInView = function(device){
	return locator.getDevicesInFront(device.ID);
}

exports.registerDevice = function(device){
    device.stationary = true;
	locator.Devices.push(device);
}

exports.locator = locator;

exports.handleRequest = function (socket){
    socket.on('getDevicesInView', function (device, fn) {
        fn(requestHandler.getDevicesInView(device));
    });

    socket.on('registerDevice', function(device){
        requestHandler.registerDevice(device);
        //io.sockets.emit('123', 'hello');
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
        fn(({"status": 'success'}));
    });

    socket.on('sendDeviceInfoToServer', function (data, fn) {
        console.log("Got request to init device");
        console.log(data);
        locator.initDevice(data.additionalInfo.deviceID, data.additionalInfo.height, data.additionalInfo.width);
        fn(({"status": 'success'}));
    });

    socket.on('getPeopleFromServer', function (request, fn) {
        locator.purgeInactivePersons();
        fn((locator.Persons));
    });

    socket.on('getDevicesWithSelection', function (request, fn) {
        locator.purgeInactiveDevices();
        console.log(request.additionalInfo.selection);
        switch(request.additionalInfo.selection){
            case 'all':
                fn((locator.Devices));
                break;
            case 'inView':
                console.log("GETTING ALL DEVICES IN VIEW");
                fn(locator.getDevicesInFront(request.additionalInfo.deviceID));
                break;
            default:
                fn((locator.Devices));
        }
    });

    socket.on('forcePairRequest', function (request, fn) {
        var deviceID = request.additionalInfo.deviceID;
        var personID = request.additionalInfo.personID;
        locator.pairDevice(deviceID, personID, socket);
        fn(({"status": 'success'}));
    });

    socket.on('broadcast', function (request, fn) {
        socket.broadcast.emit(request.listener, request.payload);
    });

    socket.on('testingEvent', function (request, fn) {
        io.sockets.emit('testingEvent', request);
    });

    socket.on('save/layers/visible', function (request, fn) {
        visibleLayers = request;
        console.log(request);
        console.log(visibleLayers);
        console.log("saved visible layers");
    });

    socket.on('retrieve/layers/visible', function (request, fn) {
        console.log("retrieving visible layers...");
        console.log(request);
        if(visibleLayers != null && visibleLayers != undefined){
            fn((visibleLayers));
        }
    });

    socket.on('personUpdate', function(capsule, fn){
        console.log("personUpdate reeceived");
        //get persons from body, call update function for each person
        console.log(capsule.sensorID);
        var request = capsule.persons;
        request.forEach(function(item){
            var person = new factory.Person(item.Person_ID, item.Location);
            locator.updatePersons(person);
        });
        locator.printPersons();
    });
}