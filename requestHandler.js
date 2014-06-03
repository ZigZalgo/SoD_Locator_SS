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

    socket.on('registerDevice', function(deviceInfo, fn){ //changes this to stationary devices, or merge with iosAPI's "sendDeviceInfoToServer"
        frontend.clients[socket.id].clientType = deviceInfo.deviceType;
        locator.registerDevice(socket, deviceInfo);
        if(fn != undefined){
            fn(({"status": 'success'}));
        }
    });

    socket.on('registerSensor', function(sensorInfo){
        frontend.clients[socket.id].clientType = "sensor";
        var sensor = new factory.Sensor(socket);
        sensor.sensorType = sensorInfo.sensorType;
        sensor.FOV = sensorInfo.FOV;
        sensor.rangeInMM = sensorInfo.rangeInMM;
        sensor.frameHeight = sensorInfo.frameHeight;
        sensor.frameWidth = sensorInfo.frameWidth;
        locator.registerSensor(sensor);
    });

    socket.on('registerWebClient', function(clientInfo){
        frontend.clients[socket.id].clientType = "webClient";
    });

    socket.on('setPairingState', function (data) {
        locator.setPairingState(socket.id);
    });

    socket.on('updateOrientation', function (request) {
        locator.updateDeviceOrientation(request.orientation, socket);
    });

    socket.on('unpairDevice', function (request) {
        locator.unpairDevice(socket.id, request.personID);
    });

    socket.on('unpairAllDevices', function (request) {
        locator.unpairAllDevices();
    });

    socket.on('unpairAllPeople', function (request, fn) {
        locator.unpairAllPeople();
        fn({"status": 'success'});
    });

    socket.on('getPeopleFromServer', function (request, fn) {
        fn((locator.persons));
    });

    socket.on('getClientsFromServer', function (request, fn) {
        var selectedValues = {};
        for(var key in frontend.clients){
            selectedValues[key] = {socketID: frontend.clients[key].id, clientType: frontend.clients[key].clientType}
        };
        fn(selectedValues);
    });

    socket.on('getDevicesWithSelection', function (request, fn) {
        //console.log("Get Devices with Selection: " + request.selection);
        switch(request.selection){
            case 'all':
                fn(locator.devices);
                break;
            case 'inView':
                console.log("GETTING ALL DEVICES IN VIEW: " + JSON.stringify(locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id))));
                fn(locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id)));
                break;
            default:
                fn(locator.devices);
        }
    });

    socket.on('forcePairRequest', function (request, fn) {
        if(request.deviceSocketID != undefined){
            locator.pairDevice(request.deviceSocketID, request.uniquePersonID, socket);
        }
        else{
            locator.pairDevice(socket.id, request.uniquePersonID, socket);
        }

        fn(({"status": 'success'}));
    });

    socket.on('broadcast', function (request, fn) {
        socket.broadcast.emit(request.listener, {payload: request.payload, sourceID: socket.id});
    });

    socket.on('personUpdate', function(persons, fn){
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
        fn((locator.sensors));
    });

    socket.on('getCalibrationFrames', function(request, fn){
        frontend.clients[request.referenceSensorID].emit('getFrameFromSensor', socket.id);
        frontend.clients[request.uncalibratedSensorID].emit('getFrameFromSensor', socket.id);
    });

    socket.on('calibrateSensors', function (request, fn){
        var translateRule = locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints);
        frontend.clients[request.uncalibratedSensorID].emit('setTranslateRule', locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints))
        locator.sensors[request.uncalibratedSensorID].calibration =
        {Rotation: translateRule.degree, TransformX: translateRule.xDistance, TransformY: translateRule.zDistance, StartingLocation: translateRule.startingLocation};
        locator.sensors[request.uncalibratedSensorID].isCalibrated = true;

        fn(locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints));
        //take two sensorIDs from request, call locator.calibrateSensors(sid1, sid2)
        //return calibration for client? nah....... maybe....
    });
    socket.on('getDevicesFromServer',function(request,fn){
        console.log("get Devices From Server!");
        locator.printDevices();
        fn((locator.devices));
    });
}