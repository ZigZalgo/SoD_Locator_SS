var locator = require('./locator');
var factory = require('./factory');
var frontend = require('./frontend');
var util = require('./util');

// TODO: test!
exports.start = function (){
    locator.start();
}

exports.locator = locator;

exports.handleRequest = function (socket){
    socket.on('getDevicesInView', function (device, fn) {
        fn(locator.getDevicesInFront(device.ID));
    });

    socket.on('registerDevice', function(device){ //changes this to stationary devices, or merge with iosAPI's "sendDeviceInfoToServer"
        device.stationary = true;
        locator.devices.push(device);
    });

    socket.on('registerSensor', function(sensorInfo){
        frontend.allClients[util.findWithAttr(frontend.allClients, "socketID", socket.id)].clientType = "sensor";
        var sensor = new factory.Sensor(socket);
        sensor.sensorType = sensorInfo.sensorType;
        sensor.FOV = sensorInfo.FOV;
        locator.registerSensor(sensor);
    });

    socket.on('registerWebClient', function(clientInfo){
        frontend.allClients[util.findWithAttr(frontend.allClients, "socketID", socket.id)].clientType = "webClient";
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
        fn((locator.persons));
    });

    socket.on('getClientsFromServer', function (request, fn) {
        fn((frontend.allClients));
    });

    socket.on('getDevicesWithSelection', function (request, fn) {
        locator.purgeInactiveDevices();
        console.log(request.additionalInfo.selection);
        switch(request.additionalInfo.selection){
            case 'all':
                fn((locator.devices));
                break;
            case 'inView':
                console.log("GETTING ALL DEVICES IN VIEW");
                fn(locator.getDevicesInFront(request.additionalInfo.deviceID));
                break;
            default:
                fn((locator.devices));
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
        console.log("GOT A BROADCAST, relaying to: " + request.listener);
    });

    socket.on('personUpdate', function(persons, fn){
        //console.log("personUpdate reeceived");
        //get persons from body, call update function for each person
        if(persons!=null){
            locator.removeIDsNoLongerTracked(socket, persons);
            persons.forEach(function(person){
                locator.updatePersons(person, socket);
            });
        }
        else{
            console.log("request was null");
        }

        //locator.printPersons();
    });

    socket.on('error', function(err){
        console.log("error: " + err);
    })

    socket.on('uncaughtException', function (err){
        console.log("uncaughtException: " + err);
    });

    socket.on('getSensorsFromServer', function (request, fn) {
        console.log("getting sensors from server")
        fn((locator.sensors));
    });

    socket.on('calibrateSensors', function (request, fn){
        fn(locator.calibrateSensors());
        //take two sensorIDs from request, call locator.calibrateSensors(sid1, sid2)
        //return calibration for client? nah....... maybe....
    })
}