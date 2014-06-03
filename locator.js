var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
var frontend = require('./frontend');
var events = require("events");
var EventEmitter = require("events").EventEmitter;

var persons = {};
var devices = {};
var sensors = {};
var sensorsReference = null;
exports.persons = persons;
exports.devices = devices;
exports.sensors = sensors;

// TODO: test!
exports.start = function(){
	// Do initialization here, if any
};

exports.registerSensor = function(sensor){
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    console.log("REFERENCE IS: " + sensorsReference)
    if(sensorsReference == null){
        sensor.calibration = {Rotation: 0, TransformX: 0, TransformY: 0, StartingLocation: {X: 0, Y: 0, Z: 0}};
        sensor.isCalibrated = true;
        sensorsReference = sensor;
        console.log("setting default reference")
        sensors[sensor.socketID] = sensor;
    }
    else{
        sensors[sensor.socketID] = sensor;
    }
};

exports.calibrateSensors = function(sensorOnePoints, sensorTwoPoints){
    console.log("Calibrating sensors...")
    return util.getTranslationRule(sensorOnePoints[0], sensorOnePoints[1], sensorTwoPoints[0], sensorTwoPoints[1])
}

exports.removeIDsNoLongerTracked = function(socket, newListOfPeople){
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            for(var IDkey in persons[key].ID){
                if(persons[key].ID[IDkey] == socket.id && util.findWithAttr(newListOfPeople, "ID", IDkey) == undefined){
                    delete persons[key].ID[IDkey];
                }
            }
        }
        if(Object.keys(persons).indexOf(key) == Object.keys(persons).length - 1){
            locator.removeUntrackedPeople();
        }
    }
}

exports.updatePersons = function(receivedPerson, socket){
    if(Object.keys(persons).length == 0){
        //nobody being tracked, add new person
        if(Object.keys(persons).indexOf(key) == Object.keys(persons).length - 1){
            //person was not found
            if(receivedPerson.ID != undefined && receivedPerson.location != undefined){ //if provided an ID and a location, update
                var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
                person.lastUpdated = new Date();
                persons[person.uniquePersonID] = person;
                console.log(persons[person.uniquePersonID])
            }
        }
    }
    else{
        //there are people being tracked, see if they match
        var counter = Object.keys(persons).length;
        for(var key in persons){
            counter --;
            if(persons.hasOwnProperty(key)){
                if(persons[key].ID[receivedPerson.ID] != undefined){
                    //person found
                    try{
                        persons[key].location.X = receivedPerson.location.X.toFixed(3);
                        persons[key].location.Y = receivedPerson.location.Y.toFixed(3);
                        persons[key].location.Z = receivedPerson.location.Z.toFixed(3);
                        persons[key].lastUpdated = new Date();
                        if(persons[key].ownedDeviceID != null){
                            devices[persons[key].ownedDeviceID].location.X = receivedPerson.location.X.toFixed(3);
                            devices[persons[key].ownedDeviceID].location.Y = receivedPerson.location.Y.toFixed(3);
                            devices[persons[key].ownedDeviceID].location.Z = receivedPerson.location.Z.toFixed(3);
                        }
                    }
                    catch(err){
                        console.log("Error updating person: " + err)
                        //if null or cannot read for some other reason... remove null
                        if(persons[key] == null){
                            delete persons[key];
                        }
                    }
                    break;
                }
                else{
                    if(counter == 0){
                        //person was not found
                        if(receivedPerson.ID != undefined && receivedPerson.location != undefined){ //if provided an ID and a location, update
                            var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
                            person.lastUpdated = new Date();
                            persons[person.uniquePersonID] = person;
                        }
                    }
                }
            }
        }
    }
};

exports.pairDevice = function(deviceSocketID, uniquePersonID, socket){
    var statusMsg = "Device Socket ID: " + deviceSocketID +
        "\nPerson ID: " + uniquePersonID;

    if(devices[deviceSocketID] != undefined && persons[uniquePersonID] != undefined){
        if(devices[deviceSocketID].pairingState == "unpaired" && persons[uniquePersonID].pairingState == "unpaired"){
            devices[deviceSocketID].ownerID = uniquePersonID;
            devices[deviceSocketID].pairingState = "paired";
            persons[uniquePersonID].ownedDeviceID = deviceSocketID;
            persons[uniquePersonID].pairingState = "paired";
            statusMsg += "\n Pairing successful.";
        }
        else{
            statusMsg += "\nPairing attempt unsuccessful";
            if(devices[deviceSocketID].pairingState != "unpaired"){
                statusMsg += "Device unavailable for pairing.";
            }
            if(persons[uniquePersonID].pairingState != "unpaired"){
                statusMsg += "Person unavailable for pairing.";
            }
        }
    }
    else{
            statusMsg += "Pairing attempt unsuccessful. One or both objects were not found.";
    }
    socket.send(JSON.stringify({"status": statusMsg, "ownerID": uniquePersonID}));
}

//tested
exports.printPersons = function(){
	console.log("People tracked: ");
    var output;
    console.log(persons);
    try{
        console.log("There are "+object.keys(persons).length+" people in this view."); // adding sensor ID if possible

        for(var key in persons){
            if(persons.hasOwnProperty(key)){
                console.log("The "+object.keys(persons).indexOf(key)+"th Person --> "
                    + JSON.stringify(persons[key], null, 2));
                console.log(JSON.stringify(persons[key].uniquePersonID))
            }
        }
    }
    catch(err){
        console.log("Error printing people: " + err);
        return false;
    }
	console.log("///////////////////////////////////////////////////////////////");
    return true;
}

exports.setPairingState = function(deviceSocketID){
    if(devices[deviceSocketID] != null){
        devices[deviceSocketID].pairingState = "pairing";
    }
}

exports.unpairDevice = function(deviceSocketID){
    if(devices[deviceSocketID] != undefined){
        if(devices[deviceSocketID].ownerID != null){
            try{
                persons[devices[deviceSocketID].ownerID].pairingState = "unpaired";
                persons[devices[deviceSocketID].ownerID].ownedDeviceID = null;
                persons[devices[deviceSocketID].ownerID].orientation = null;
            }
            catch(err){
                console.log(err + "\tError unpairing device > removing person associations > most likely person does not exist?")
            }
        }
        try{
            devices[deviceSocketID].pairingState = "unpaired";
            devices[deviceSocketID].location.X = null;
            devices[deviceSocketID].location.Y = null;
            devices[deviceSocketID].location.Z = null;
            devices[deviceSocketID].ownerID = null;
        }
        catch(err){
            console.log(err + "\tError resetting pairing state of device, possibly device is not tracked anymore?")
        }

    }
}
exports.unpairAllDevices = function(){
    for(var key in devices){
        if(devices.hasOwnProperty(key)){
            locator.unpairDevice(key);
        }
    }
}

exports.printDevices = function(){
    console.log("devices tracked: ");
    try{
        for(var key in devices){
            if(devices.hasOwnProperty(key)){
                console.log(JSON.stringify(devices));
            }
        }
    }
    catch(err){
        console.log("Error printing devices: " + err);
        return false;
    }
    console.log("///////////////////////////////////////////////////////////////");
    return true;
}

// TODO: implement!
// TODO: test!
exports.updateDeviceOrientation = function(orientation, socket){
    if(devices[socket.id] != undefined){
        try{
            devices[socket.id].orientation = orientation;
            devices[socket.id].lastUpdated = new Date();
            if(devices[socket.id].ownerID != null){
                persons[devices[socket.id].ownerID].orientation = orientation;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(devices[socket.id] == null){
                delete devices[socket.id]
            }
        }
    }
    else{
        if(orientation != undefined){
            var device = new factory.Device(socket);
            device.orientation = orientation;
            device.lastUpdated = new Date();
            devices[socket.id] = device;
        }
    }
}

exports.unpairAllPeople = function(){
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            locator.unpairPerson(key);
        }

    }
}

exports.unpairPerson = function(socketID){
    try{
        if(persons[socketID] != null){
            console.log("Unpairing person with ID: " + socketID);
            persons[socketID].pairingState = 'unpaired';
            persons[socketID].ownedDeviceID = null;
            persons[socketID].orientation = null;
        }
    }
    catch(err){
        console.log("Error unpairing persion: " + err);
    }
    if(persons[socketID].ownedDeviceID != null){
        try{
            devices[persons[socketID].ownedDeviceID].location = {X: null, Y: null, Z: null};
            devices[persons[socketID].ownedDeviceID].pairingState = "unpaired";
            devices[persons[socketID].ownedDeviceID].ownerID = null;
        }
        catch(err){
            console.log(err + "\tError unpairing persons > removing device associations > most likely device does not exist?")
        }

    }
}

exports.removeUntrackedPeople = function(){
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            if(Object.keys(persons[key].ID).length === 0){
                delete persons[key];
            }
        }
    }
}

exports.cleanUpDevice = function(socketID){
    var personID = devices[socketID].ownerID;
    if(devices[socketID].pairingState == "paired" && personID != null){
        if(persons[personID] != undefined){
            persons[personID].ownedDeviceID = null;
            persons[personID].pairingState = "unpaired";
            persons[personID].orientation = null;
        }
        else{
            //person is no longer tracked
        }
    }

    delete devices[socketID];
    frontend.io.sockets.emit("refreshStationaryLayer", {});
}

exports.cleanUpSensor = function(socketID){
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    delete sensors[socketID];
    var counter = Object.keys(persons).length;
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            for(var IDkey in persons[key].ID){
                if(persons[key].ID.hasOwnProperty(IDkey)){
                    if(persons[key].ID[IDkey] == socketID){
                        delete persons[key].ID[IDkey];
                    }
                }
            }
        }
        if(counter == 0){
            locator.removeUntrackedPeople();
        }
    }

    /////
    if(sensorsReference.socketID == socketID){
        if(Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)}).length > 0){
            sensors[Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)})[0]].isCalibrated = true;
            sensors[Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)})[0]].calibration = {Rotation: 0, TransformX: 0, TransformY: 0, StartingLocation: {X: 0, Y: 0, Z: 0}};
            sensorsReference = sensors[Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)})[0]];
        }
        else{
                if(Object.keys(sensors).length != 0){
                    sensors[Object.keys(sensors)[0]].isCalibrated = true;
                    sensorsReference = sensors[Object.keys(sensors)[0]]
                }
                else{
                    sensorsReference = null;
                }
        }
    }
    else{
        console.log("All good, removed sensor is not reference");
    }
}

exports.registerDevice = function(socket, deviceInfo){
    if(devices[socket.id] != undefined){
        devices[socket.id].height = deviceInfo.height;
        devices[socket.id].width = deviceInfo.width;

        console.log("Device initiated late, updating height and width");
    }
    else{
        var device = new factory.Device(socket);
        device.height = deviceInfo.height;
        device.width = deviceInfo.width;
        device.FOV = deviceInfo.FOV;
        device.lastUpdated = new Date();
        if(deviceInfo.stationary == true){
            device.stationary = deviceInfo.stationary;
            device.location = {X: deviceInfo.locationX, Y: deviceInfo.locationY, Z: deviceInfo.locationZ}
            frontend.io.sockets.emit("refreshStationaryLayer", {});
        }
        devices[socket.id] = device;
        console.log("Registering device: " + JSON.stringify(device));
    }
}

// TODO: implement!
// TODO: test!
exports.getDevicesInView = function(observerSocketID, devicesInFront){
    console.log("devicesInFront: " + JSON.stringify(devicesInFront));
    console.log("GetDevicesInView was called");
	// TODO: test
    //console.log(devices[observerSocketID]);
	//var returnDevices = {};
    var returnDevices = {};
    var observerLineOfSight = factory.makeLineUsingOrientation(devices[observerSocketID].location, devices[observerSocketID].orientation);
    for(var i = 0; i <= devicesInFront.length; i++){
        if(i == devicesInFront.length){
            console.log("returning devicesInView!\n" + JSON.stringify(returnDevices))
            return returnDevices;
        }
        else{
            if(devices[devicesInFront[i]].width != null){
                var sides = util.getLinesOfShape(devices[devicesInFront[i]]);
                var intersectionPoints = [];
                console.log("Sides: " + JSON.stringify(sides))

                sides.forEach(function(side){
                    var intPoint = util.getIntersectionPoint(observerLineOfSight, side);
                    if(intPoint != null){
                        console.log("Added an intersection point")
                        intersectionPoints.push(intPoint);
                    }
                });

                if(intersectionPoints.length != 0){
                    console.log("intersection points not empty");
                    //this.continue;
                    var nearestPoint = intersectionPoints[0];
                    var shortestDistance = util.distanceBetweenPoints(devices[observerSocketID].location, nearestPoint);

                    intersectionPoints.forEach(function(point){
                        var distance = util.distanceBetweenPoints(devices[observerSocketID].location, point);
                        if(distance < shortestDistance){
                            nearestPoint = point;
                            shortestDistance = distance;
                        }
                    });

                    var ratioOnScreen = util.GetRatioPositionOnScreen(devicesInFront[i], nearestPoint);

                    devices[devicesInFront[i]].intersectionPoint.X = ratioOnScreen.X;
                    devices[devicesInFront[i]].intersectionPoint.Y = ratioOnScreen.Y;
                    console.log("Pushed a target for sending!");
                    returnDevices[devicesInFront[i]] = devices[devicesInFront[i]];
                }
            }
        }
    };
}

// TODO: implement!
// TODO: test!
exports.getDevicesInFront = function(observerSocketID){
	// TODO: implement!
	// List<Device> returnDevices = new List<Device>();
    var observer = devices[observerSocketID];
    var returnDevices = [];

    console.log("Observer has socketID of: " + observerSocketID)

	// //(CB - Should we throw an exception here? Rather then just returning an empty list?)
    try{
        if (observer.location == null || observer.orientation == null)
             return returnDevices;
         if (observer.FOV == 0.0)
             return returnDevices;
    }
    catch(err){
        console.log("Error getting devices in front of device " + devices[observerSocketID].uniqueDeviceID + ": " + err);
    }

	// // We imagine the field of view as two vectors, pointing away from the observing device. Targets between the vectors are in view.
	// // We will use angles to represent these vectors.
    try{
        //get the angle to sens
        var angleToSensor =util.getPersonOrientation(observer.location.X,observer.location.Z);
        var leftFieldOfView = util.normalizeAngle(360 - observer.orientation  - 90 - angleToSensor+ 15);
        var rightFieldOfView = util.normalizeAngle(360 - observer.orientation  - 90 -angleToSensor- 15);

        console.log("Left FOV = " + leftFieldOfView)
        console.log("Right FOV = " + rightFieldOfView)

        return Object.keys(devices).filter(function(key){
            //var angle = util.normalizeAngle(Math.atan2(devices[key].location.Y - observer.location.Y, devices[key].location.X - observer.location.X) * 180 / Math.PI);


            if(devices[key] != observer && devices[key].location != undefined){
                console.log("Deivice Location:: \n" + JSON.stringify(devices[key].location))

                console.log("Angle from observer to target: " + util.normalizeAngle(Math.atan2(devices[key].location.Z - observer.location.Z, devices[key].location.X - observer.location.X) * 180 / Math.PI))
                console.log("Observer: \n" + JSON.stringify(observer))
                console.log("Target: \n" + JSON.stringify(devices[key]))
                if (leftFieldOfView > rightFieldOfView &&
                    (util.normalizeAngle(Math.atan2(devices[key].location.Z - observer.location.Z, devices[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView &&
                    (util.normalizeAngle(Math.atan2(devices[key].location.Z - observer.location.Z, devices[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView){
                    return true;
                }
                else if (leftFieldOfView < rightFieldOfView)
                {
                    if ((util.normalizeAngle(Math.atan2(devices[key].location.Z - observer.location.Z, devices[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView ||
                        (util.normalizeAngle(Math.atan2(devices[key].location.Z - observer.location.Z, devices[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView){
                        return true;
                    }
                }
            }
        })
    }
    catch(err){
        console.log("Error getting devices in front of device " + devices[observerSocketID].uniqueDeviceID + ": " + err);
    }
}

// TODO: implement!
// TODO: test!
exports.GetNearestDeviceInView = function(observer){
	// TODO: test
    var devicesInView = this.GetDevicesInView(observer);
    return this.FindNearestDevice(observer, devicesInView);
}

// TODO: implement!
// TODO: test!
exports.GetDevicesWithinRange = function(observer, distance){
	// TODO: test
    var returnDevices = {};
    if(observer.location == null){
        return returnDevices;
    }

    devices.forEach(function(device){
        if(device == observer){
           //this.continue /////is this necessary, if it's an else if?
        }
        else if(device.location != null && util.distanceBetweenPoints((observer.location, device.location) < distance)){
            returnDevices.push(device);
        }
    });

    return returnDevices;
}

// TODO: implement!
// TODO: test!
exports.GetNearestDeviceWithinRange = function(observer, distance){
	// TODO: test
    var devicesInView = this.GetDevicesWithinRange(observer, distance);
    return this.FindNearestDevice(observer, devicesInView);
}

// TODO: implement!
// TODO: test!
exports.FindNearestDevice = function(observer, deviceList){
	// TODO: test
    if(_.size(deviceList) > 0){
        return null;
    }
    else{
        var nearest = null;

        deviceList.forEach(function(device){
           if(device != observer && device.location != null){//!=null equivalent to .HasValue?
               nearest = device;
           }
        });
        if(nearest == null){
            return null;
        }

        deviceList.forEach(function(device){
           if(device != observer && device.location != null &&
                        util.distanceBetweenPoints(device.location, observer.location) < util.distanceBetweenPoints(nearest.location, observer.location)){
              nearest = device;
           }
        });
        return nearest;
    }
}