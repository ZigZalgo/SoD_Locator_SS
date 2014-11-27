var locator = require('./locator');
var factory = require('./factory');
var frontend = require('./frontend');
var util = require('./util');

// TODO: test!
exports.start = function () {
    locator.start();
};

exports.locator = locator;

exports.handleRequest = function (socket) {
    //START REGISTRATION EVENTS//////////////////////////////////////////////////////////////////////////////////////
    /*socket.on('registerData',function(dataInfo,fn){
        locator.registerData(dataInfo,)
    });*/
    socket.on('registerDevice', function (deviceInfo, fn) {
        console.log("Something tried to register...");
        frontend.clients[socket.id].clientType = deviceInfo.deviceType;
        if(fn!=undefined) {
            locator.registerDevice(socket, deviceInfo,fn);
        }else{
            locator.registerDevice(socket,deviceInfo)
        }
        try{
            socket.broadcast.emit("someDeviceConnected", { name: deviceInfo.name, ID: locator.devices[socket.id].uniqueDeviceID,deviceType: deviceInfo.deviceType});
        }
        catch(err){
            console.log("Error emitting name or ID, device may still be registering: " + err);
        }
    });
    socket.on('registerDataPoint',function (dataPointInfo,fn){
        //console.log('registering dataPoint with info: ' + JSON.stringify(dataPointInfo));
        locator.registerDataPoint(socket,dataPointInfo,fn);
    });
    socket.on('registerSensor', function (sensorInfo, fn) {
        console.log('registering with sensorInfo: '+JSON.stringify(sensorInfo));
        if(Object.keys(sensorInfo).length != 0){
            frontend.clients[socket.id].clientType = "sensor";
            var sensor = new factory.Sensor(socket);
            sensor.sensorType = sensorInfo.sensorType;
            sensor.FOV = sensorInfo.FOV;
            sensor.rangeInMM = sensorInfo.rangeInMM;
            sensor.frameHeight = sensorInfo.frameHeight;
            sensor.frameWidth = sensorInfo.frameWidth;
            if(sensorInfo.translateRule!=undefined){
                var receivedCalibration =  {Rotation: sensorInfo.translateRule.changeInOrientation, TransformX: sensorInfo.translateRule.dX, TransformY: sensorInfo.translateRule.dZ,xSpaceTransition:sensorInfo.translateRule.xSpace,ySpaceTransition:sensorInfo.translateRule.zSpace,
                    StartingLocation: {X: sensorInfo.translateRule.startingLocation.X, Y: sensorInfo.translateRule.startingLocation.Y, Z: sensorInfo.translateRule.startingLocation.Z}};
                sensor.calibration = receivedCalibration;
            }
            locator.registerSensor(sensor);
            if (fn != undefined) {
                fn({"status": 'server: you registered as a "sensor"',sensorNumber:Object.keys(locator.sensors).length})
            }
        }else{
            console.log('received null sensor info. Can not register to the server');
        }
    });


    socket.on('registerWebClient', function (clientInfo, fn) {
        frontend.clients[socket.id].clientType = "webClient";
        if (fn != undefined) {
            fn({"status": 'server: you registered as a "webClient"'})
        }
    });
    socket.on('registerMobileWebClient', function (clientInfo, fn) {
        frontend.clients[socket.id].clientType = "mobileWebClient";
        console.log('-> A mobile web client has been registered');
        if (fn != undefined) {
            fn({"status": 'server: you registered as a "mobileWebClient"'})
        }
    });
    //END REGISTRATION EVENTS////////////////////////////////////////////////////////////////////////////////////////

    //START PAIRING EVENTS///////////////////////////////////////////////////////////////////////////////////////////
    socket.on('setPairingState', function (data, fn) {
        locator.setPairingState(socket.id);
        if (fn != undefined) {
            fn({"status": 'server: device pairing state has been set to "pairing"'})
        }
    });

    socket.on('pairDeviceWithPerson', function (request, fn) {
        if (request.uniqueDeviceID != undefined) {
            console.log('receive paring request: pair device '+ request.uniqueDeviceID +' with person ' + request.uniquePersonID );
            locator.pairDevice(util.getDeviceSocketIDByID(request.uniqueDeviceID),request.uniquePersonID,socket,fn);
        }else
        if (request.deviceSocketID != undefined) {
            locator.pairDevice(request.deviceSocketID, request.uniquePersonID,socket,fn);
        }
        else {
            locator.pairDevice(socket.id, request.uniquePersonID,socket,fn);
        }

        if(fn!=undefined){
            fn(({"status": 'pairing'+locator.devices[request.deviceSocketID].uniqueDeviceID+' with person: '+request.uniquePersonID+' success'}));
        }
    });

    socket.on('unpairDevice', function (request, fn) {
        locator.unpairDevice(socket.id, request.personID);
        if (fn != undefined) {
            fn({"status": 'server: your device has been unpaired'})
        }
    });

    socket.on('unpairAllDevices', function (request, fn) {
        locator.unpairAllDevices();
        if (fn != undefined) {
            fn({"status": 'server: all devices have been unpaired'})
        }
    });

    socket.on('unpairAllPeople', function (request, fn) {
        locator.unpairAllPeople();
        if (fn != undefined) {
            fn({"status": 'server: all people have been unpaired'})
        }
    });
    //END PAIRING EVENTS/////////////////////////////////////////////////////////////////////////////////////////////


    //START LOCATOR SERVICES/////////////////////////////////////////////////////////////////////////////////////////
    socket.on('updateOrientation', function (request) {
        //not checking for fn(callback), since adding a callback here would be costly
        console.log(request.orientation);
        locator.updateDeviceOrientation(request.orientation, socket);
    });

    // update device or data Point location
    socket.on('updateObjectLocation', function (request,fn) {
        //not checking for fn(callback), since adding a callback here would be costly
        switch(request.objectType){
            case 'device':
                console.log('-> update device Location event received with request' +JSON.stringify(request));
                locator.devices[Object.keys(locator.getDeviceByID(request.ID))[0]].location = request.newLocation;
                console.log('ID: '+ locator.devices[Object.keys(locator.getDeviceByID(request.ID))[0]].uniqueDeviceID+ ' -> ' +JSON.stringify(locator.devices[Object.keys(locator.getDeviceByID(request.ID))[0]].location));
                break;
            case 'dataPoint':
                locator.dataPoints[request.ID].location = request.newLocation;
                console.log('-> update dataPoints Location event received with request' +JSON.stringify(request));
                console.log('\t->->ID: '+ locator.dataPoints[request.ID].ID+ ' -> ' +JSON.stringify(locator.dataPoints[request.ID].location));
                console.log(fn);
                if(fn!=undefined){
                    fn();
                }
                //console.log('-> update dataPoint location event received with request' +JSON.stringify(request));
                break;
            default:
                console.log('-> Wrong type for udpating location');
        }
    });
    socket.on('updateDeviceInfo', function (deviceInfo, fn) {
        locator.updateDevice(socket.id,deviceInfo,fn);
    });
    socket.on('updateSensorInfo',function(sensorInfo,fn){
        if(sensorInfo.translateRule!=undefined){
            var receivedCalibration =  {Rotation: sensorInfo.translateRule.changeInOrientation, TransformX: sensorInfo.translateRule.dX, TransformY: sensorInfo.translateRule.dZ,xSpaceTransition:sensorInfo.translateRule.xSpace,ySpaceTransition:sensorInfo.translateRule.zSpace,
                StartingLocation: {X: sensorInfo.translateRule.startingLocation.X, Y: sensorInfo.translateRule.startingLocation.Y, Z: sensorInfo.translateRule.startingLocation.Z}};
            locator.sensors[socket.id].calibration = receivedCalibration;
            console.log(JSON.stringify(locator.sensors[socket.id].calibration));
        }

    });
    socket.on('getPeopleFromServer', function (request, fn) {
        if (fn != undefined) {
            fn((locator.persons));
        }
    });
    socket.on('dropData',function(request,fn){
        for(var key in locator.persons){
            if(locator.persons[key].uniquePersonID == request.ID){
                locator.dropData(socket,locator.persons[key],request.dropRange,fn);
            }
        }
        //locator.dropData(socket,request.ID,request.range);
    });
    socket.on('getClientsFromServer', function (request, fn) {
        var selectedValues = {};
        for (var key in frontend.clients) {
            selectedValues[key] = {socketID: frontend.clients[key].id, clientType: frontend.clients[key].clientType}

        };

        if (fn != undefined) {
            fn(selectedValues);
        }
    });

    socket.on('getDevicesWithSelection', function (request, fn) {
        //console.log("There are " + request.selection.length + " filters in selection array." + JSON.stringify(request.selection))
        //console.log(util.filterDevices(socket, request.selection));
        //console.log(request.selection)
        fn(util.filterDevices(socket, request));
    })

    socket.on('getDataPointsWithSelection', function (request, fn) {
        var selection = request.selection;
        if(fn!=undefined){
            switch (selection){
                case 'all':
                    fn(locator.dataPoints);
                default:
                    fn(locator.dataPoints);
            }
        }
    })

    socket.on('getDistanceToDevice', function (request, fn) {
        if (util.getDeviceSocketIDByID(request.ID) != undefined) {
            //target device found, return distance
            try {
                fn(util.distanceBetweenPoints(locator.devices[socket.id].location, locator.devices[util.getDeviceSocketIDByID(request.ID)].location));
            }
            catch (err) {
                console.log("Error calculating distance between devices: " + err);
            }
        }
        else {
            //target device not found
            fn(-1);
        }
    });

    socket.on('getDistanceBetweenDevices', function (request, fn) {
        if (util.getDeviceSocketIDByID(request.ID1) != undefined && util.getDeviceSocketIDByID(request.ID2) != undefined) {
            //target devices found, return distance
            try {
                fn(util.distanceBetweenPoints(locator.devices[util.getDeviceSocketIDByID(request.ID1)].location, locator.devices[util.getDeviceSocketIDByID(request.ID2)].location));
            }
            catch (err) {
                console.log("Error calculating distance between devices: " + err);
                fn(-1);
            }
        }
        else {
            //one or both target devices not found
            fn(-1);
        }
    });

    socket.on('getDistanceBetweenPersonAndDevice', function (request, fn) {
        if (locator.persons[request.ID1] != undefined && util.getDeviceSocketIDByID(request.ID2)!=undefined){
            try{
                fn(util.distanceBetweenPoints(locator.persons[request.ID1].location, locator.devices[util.getDeviceSocketIDByID(request.ID2)].location));
            }
            catch(err){
                console.log("Error calculating distance between person and device: " + err);
                fn(-1);
            }
        }
        else{
            fn(-1);
        }
    });

    socket.on('getDistanceBetweenPeople', function(request, fn){
        if(locator.persons[request.ID1] != undefined && locator.persons[request.ID2]){
            try{
                fn(util.distanceBetweenPoints(locator.persons[request.ID1].location, locator.persons[request.ID2].location));
            }
            catch(err){
                console.log("Error calculating distance between people: " + err);
                fn(-1);
            }
        }
    })
    //END LOCATOR SERVICES///////////////////////////////////////////////////////////////////////////////////////////

    //START SENDING SERVICES/////////////////////////////////////////////////////////////////////////////////////////
    socket.on('sendEventToDevicesWithSelectionIncludingSelf', function(payload, fn){
        for (var key in util.filterDevices(socket, payload)) {
            if (locator.devices.hasOwnProperty(key)) {
                if(payload.eventName==undefined){
                    frontend.clients[key].send(payload)
                }
                else{
                    frontend.clients[key].emit(payload.eventName, payload)
                }
            }
        }
        if (fn != undefined) {
            fn({status: "server: content sent to devices with selection: " + payload.selection});
        }
    });

    socket.on('sendEventToDevicesWithSelection', function(payload, fn){
        console.log(payload);
        for (var key in util.filterDevices(socket, payload)) {
            if (locator.devices.hasOwnProperty(key) && socket != frontend.clients[key]) {
                if(payload.eventName==undefined){
                    frontend.clients[key].send(payload.data)
                }
                else{
                    frontend.clients[key].emit(payload.eventName, payload.data)
                }
            }
        }
        if (fn != undefined) {
            fn({status: "server: content sent to devices with selection: " + payload.selection});
        }
    });

    socket.on('requestDataFromSelection', function (request, fn) {
        for (var key in util.filterDevices(socket, request)) {
            if (locator.devices.hasOwnProperty(key) && socket != frontend.clients[key]) {
                if(request.arguments==undefined) request.arguments = null;
                frontend.clients[key].emit("request", {dataRequested: request.data, arguments: request.arguments}, function (data) {
                    socket.emit(request.data, data);
                })
            }
        }
        if (fn != undefined) {
            fn({status: "server: request sent to devices with selection: " + request.selection});
        }
    });

    //END SENDING SERVICES///////////////////////////////////////////////////////////////////////////////////////////

    socket.on('broadcast', function (request, fn) {
        try {
            console.log(JSON.stringify(request));
            socket.broadcast.emit(request.listener, {payload: request.payload, sourceID: socket.id});
        }
        catch (err) {
            console.log(err + 'broadcasting failed.');
        }
    });

    socket.on('personUpdate', function (persons, fn) {
        //get persons from body, call update function for each person
        if (persons != null) {
            locator.removeIDsNoLongerTracked(socket, persons);
			try{
				locator.removeUntrackedPeople(1000);
			}
			catch(err){
				console.log("error trying to remove untracked people: " + err);
			}
            persons.forEach(function (person) {
                locator.updatePersons(person, socket);
            });
        }
        else {
            console.log("request was null");
        }

        //locator.printPersons();
    });

    socket.on('error', function (err) {
        console.log("error: " + err);
    })

    socket.on('uncaughtException', function (err) {
        console.log("uncaughtException: " + err);
    });

    socket.on('getSensorsFromServer', function (request, fn) {
        if (fn != undefined) {
            fn((locator.sensors));
        }
    });

    socket.on('getCalibrationFrames', function (request, fn) {
        // error checking see if the sensor is not defined
        if (frontend.clients[request.referenceSensorID] != undefined && frontend.clients[request.uncalibratedSensorID] != undefined) {
            frontend.clients[request.referenceSensorID].emit('getFrameFromSensor', socket.id);
            frontend.clients[request.uncalibratedSensorID].emit('getFrameFromSensor', socket.id);
        } else {
            console.log('reference sensor or calibrate sensor could be undefined.');
        }
    });

    socket.on('calibrateSensors', function (request, fn) {
        var translateRule = locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints);
        frontend.clients[request.uncalibratedSensorID].emit('setTranslateRule', locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints))
        locator.sensors[request.uncalibratedSensorID].calibration =
        {Rotation: translateRule.degree, TransformX: translateRule.xDistance, TransformY: translateRule.zDistance, xSpaceTransition: translateRule.xSpaceTransition, ySpaceTransition: translateRule.zSpaceTransition, StartingLocation: translateRule.startingLocation};
        locator.sensors[request.uncalibratedSensorID].isCalibrated = true;

        fn(locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints));
        //take two sensorIDs from request, call locator.calibrateSensors(sid1, sid2)
        //return calibration for client? nah....... maybe....
    });
};