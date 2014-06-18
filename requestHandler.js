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
    //START REGISTRATION EVENTS//////////////////////////////////////////////////////////////////////////////////////

    socket.on('registerDevice', function(deviceInfo, fn){
        frontend.clients[socket.id].clientType = deviceInfo.deviceType;
        locator.registerDevice(socket, deviceInfo);
        if(fn!=undefined){
            fn({"status": 'server: your device has been registered'})
        }
    });

    socket.on('registerSensor', function(sensorInfo, fn){
        frontend.clients[socket.id].clientType = "sensor";
        var sensor = new factory.Sensor(socket);
        sensor.sensorType = sensorInfo.sensorType;
        sensor.FOV = sensorInfo.FOV;
        sensor.rangeInMM = sensorInfo.rangeInMM;
        sensor.frameHeight = sensorInfo.frameHeight;
        sensor.frameWidth = sensorInfo.frameWidth;
        locator.registerSensor(sensor);
        if(fn!=undefined){
            fn({"status": 'server: you registered as a "sensor"'})
        }
    });

    socket.on('registerWebClient', function(clientInfo, fn){
        frontend.clients[socket.id].clientType = "webClient";
        if(fn!=undefined){
            fn({"status": 'server: you registered as a "webClient"'})
        }
    });
    //END REGISTRATION EVENTS////////////////////////////////////////////////////////////////////////////////////////

    //START PAIRING EVENTS///////////////////////////////////////////////////////////////////////////////////////////
    socket.on('setPairingState', function (data, fn) {
        locator.setPairingState(socket.id);
        if(fn!=undefined){
            fn({"status": 'server: device pairing state has been set to "pairing"'})
        }
    });

    socket.on('pairDeviceWithPerson', function (request, fn) {
        if(request.deviceSocketID != undefined){
            locator.pairDevice(request.deviceSocketID, request.uniquePersonID, socket);
        }
        else{
            locator.pairDevice(socket.id, request.uniquePersonID, socket);
        }

        fn(({"status": 'success'}));
    });

    socket.on('unpairDevice', function (request, fn) {
        locator.unpairDevice(socket.id, request.personID);
        if(fn!=undefined){
            fn({"status": 'server: your device has been unpaired'})
        }
    });

    socket.on('unpairAllDevices', function (request, fn) {
        locator.unpairAllDevices();
        if(fn!=undefined){
            fn({"status": 'server: all devices have been unpaired'})
        }
    });

    socket.on('unpairAllPeople', function (request, fn) {
        locator.unpairAllPeople();
        if(fn!=undefined){
            fn({"status": 'server: all people have been unpaired'})
        }
    });
    //END PAIRING EVENTS/////////////////////////////////////////////////////////////////////////////////////////////


    //START LOCATOR SERVICES/////////////////////////////////////////////////////////////////////////////////////////
    socket.on('getDevicesInView', function (device, fn) {
        if(fn!=undefined){
            fn(locator.getDevicesInFront(device.ID));
        }
    });

    socket.on('updateOrientation', function (request) {
        //not checking for fn(callback), since adding a callback here would be costly
        locator.updateDeviceOrientation(request.orientation, socket);
    });

    socket.on('getPeopleFromServer', function (request, fn) {
        if(fn!=undefined){
            fn((locator.persons));
        }
    });

    socket.on('getClientsFromServer', function (request, fn) {
        var selectedValues = {};
        for(var key in frontend.clients){
            selectedValues[key] = {socketID: frontend.clients[key].id, clientType: frontend.clients[key].clientType}

        };

        if(fn != undefined){
            fn(selectedValues);
        }
    });

    socket.on('getDevicesWithSelection', function (request, fn) {
        switch(request.selection){
            case 'all':
                fn(locator.devices);
                break;
            case 'inView':
                fn(locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id)));
                break;
            default:
                fn(locator.devices);
        }
    });
    //END LOCATOR SERVICES///////////////////////////////////////////////////////////////////////////////////////////

    //START SENDING SERVICES/////////////////////////////////////////////////////////////////////////////////////////

    /*
    * Send string to devices based on selection
    *   'all'       -- So far we can send to all the devices that are connected to the server,
    *   'inView'    -- The devices in the view of the device who calls this function.
    *   ''          -- to nobody. Server still acknowledge the event
    **/
    socket.on('sendStringToDevicesWithSelection', function (request, fn) {
        switch(request.selection){
            case 'all':
                for(var key in locator.devices){
                    // send to all the devices except the one who calls it.
                    if(locator.devices.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        console.log('sending to a '+locator.devices[key].deviceType);
                        frontend.clients[key].emit("string", {data: request.data})
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: string sent to all"});
                }
                break;
            case 'inView':
                var devicesInView = locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id));
                for(var key in devicesInView){
                    if(devicesInView.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("string", {data: request.data})
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: string sent to inView"});
                }
                break;
            default:
                for(var key in locator.devices){
                    if(locator.devices.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("string", {data: request.data})
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: string sent"});
                }
        }
    });


    socket.on('sendDictionaryToDevicesWithSelection', function (request, fn) {
        switch(request.selection){
            case 'all':
                for(var key in locator.devices){
                    if(locator.devices.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("dictionary", {data: request.data})
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: dictionary sent"});
                }
                break;
            case 'inView':
                console.log("SENDING " + JSON.stringify(request.data) + " TO ALL DEVICES IN VIEW: " + JSON.stringify(locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id))));
                var devicesInView = locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id));
                for(var key in devicesInView){
                    if(devicesInView.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("dictionary", {data: request.data})
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: dictionary sent"});
                }
                break;
            default:
                for(var key in locator.devices){
                    if(locator.devices.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("dictionary", {data: request.data})
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: dictionary sent"});
                }
        }
    });

    socket.on('requestDataFromSelection', function (request, fn) {
        switch(request.selection){
            case 'all':
                for(var key in locator.devices){
                    if(locator.devices.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("request", {requestName: request.requestName}, function(data){
                            console.log("Got data from request: " + data);
                            socket.emit("requestedData", data);
                        })
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: request sent"});
                }
                break;
            case 'inView':
                var devicesInView = locator.getDevicesInView(socket.id, locator.getDevicesInFront(socket.id));
                for(var key in devicesInView){
                    if(devicesInView.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("request", {requestName: request.requestName}, function(data){
                            console.log("Got data from request: " + data);
                            socket.emit("requestedData", data);
                        })
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: request sent"});
                }
                break;
            default:
                for(var key in locator.devices){
                    if(locator.devices.hasOwnProperty(key) && socket!=frontend.clients[key]){
                        frontend.clients[key].emit("request", {requestName: request.requestName}, function(data){
                            console.log("Got data from request: " + data);
                            socket.emit("requestedData", data);
                        })
                    }
                }
                if(fn!=undefined){
                    fn({status: "server: request sent"});
                }
        }
    });

    //END SENDING SERVICES///////////////////////////////////////////////////////////////////////////////////////////

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
        if(fn!=undefined){
            fn((locator.sensors));
        }
    });

    socket.on('getCalibrationFrames', function(request, fn){
        frontend.clients[request.referenceSensorID].emit('getFrameFromSensor', socket.id);
        frontend.clients[request.uncalibratedSensorID].emit('getFrameFromSensor', socket.id);
    });

    socket.on('calibrateSensors', function (request, fn){
        var translateRule = locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints);
        frontend.clients[request.uncalibratedSensorID].emit('setTranslateRule', locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints))
        locator.sensors[request.uncalibratedSensorID].calibration =
        {Rotation: translateRule.degree, TransformX: translateRule.xDistance, TransformY: translateRule.zDistance,xSpaceTransition:translateRule.xSpaceTransition,ySpaceTransition:translateRule.zSpaceTransition, StartingLocation: translateRule.startingLocation};
        locator.sensors[request.uncalibratedSensorID].isCalibrated = true;

        fn(locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints));
        //take two sensorIDs from request, call locator.calibrateSensors(sid1, sid2)
        //return calibration for client? nah....... maybe....
    });
    socket.on('getDevicesFromServer',function(request,fn){
        console.log("get Devices From Server!");
        locator.printDevices();
        if(fn!=undefined){
            fn((locator.devices));
        }
    });



}