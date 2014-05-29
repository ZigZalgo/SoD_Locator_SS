var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
var frontend = require('./frontend');
var events = require("events");
var EventEmitter = require("events").EventEmitter;
	
var persons = [];
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
    console.log("registering server from locator.js");
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
    for(var i = 0; i <= persons.length; i++){
        if(i < persons.length){
            persons[i].ID.forEach(function(trackedID){
                if(trackedID.originatingSocket == socket.id && util.findWithAttr(newListOfPeople, "Person_ID", trackedID.value) == undefined){
                    persons[i].ID.splice(persons[i].ID.indexOf(trackedID), 1);
                }
            })
        }
        else{
            persons.forEach(function(person){
                if(person.ID.length <= 0){
                    persons.splice(persons.indexOf(person), 1);
                }
            })
        }
    }
}

exports.updatePersons = function(receivedPerson, socket){
    if(util.findWithAttrWeak(persons, "ID", {value: receivedPerson.Person_ID, originatingSocket: socket.id}) != undefined){
        //person already exists in database
        var returnedID = util.findWithAttrWeak(persons, "ID", {value: receivedPerson.Person_ID, originatingSocket: socket.id});
        try{
            persons[returnedID].Location.X = receivedPerson.Location.X.toFixed(3);
            persons[returnedID].Location.Y = receivedPerson.Location.Y.toFixed(3);
            persons[returnedID].Location.Z = receivedPerson.Location.Z.toFixed(3);
            persons[returnedID].distanceToKinect = util.getDistanceToKinect(location.X, location.Z).toFixed(3);
            persons[returnedID].orientationToKinect = util.getPersonOrientation(location.X, location.Z).toFixed(3);
            persons[returnedID].LastUpdated = new Date();
            if(persons[returnedID].OwnedDeviceID != null){
                devices[persons[returnedID].OwnedDeviceID].Location.X = receivedPerson.Location.X.toFixed(3);
                devices[persons[returnedID].OwnedDeviceID].Location.Y = receivedPerson.Location.Y.toFixed(3);
                devices[persons[returnedID].OwnedDeviceID].Location.Z = receivedPerson.Location.Z.toFixed(3);
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(persons[returnedID] == null){
                persons.splice(returnedID, 1)
            }
        }
    }
    else{
        //person was not found
        if(receivedPerson.Person_ID != undefined && receivedPerson.Location != undefined){ //if provided an ID and a location, update
            var person = new factory.Person(receivedPerson.Person_ID, receivedPerson.Location, socket);
            person.LastUpdated = new Date();
            persons.push(person);
        }
    }
};

exports.pairDevice = function(deviceID, personID, socket){
    var personIndex = util.findWithAttr(persons, "ID", personID);
    var statusMsg = "Device ID: " + deviceID +
                    "\nDevice Index: " + deviceIndex +
                    "\nPerson ID: " + personID +
                    "\nPerson Index: " + personIndex + "\n\n";
    if(deviceIndex != undefined && personIndex != undefined){
        if(devices[deviceID].PairingState == "unpaired" && persons[personIndex].PairingState == "unpaired"){
            devices[deviceID].OwnerID = persons[personIndex].ID;
            devices[deviceID].PairingState = "paired";
            persons[personIndex].OwnedDeviceID = deviceID;
            persons[personIndex].PairingState = "paired";
            statusMsg += "\n Pairing successful.";
        }
        else{
            statusMsg += "\nPairing attempt unsuccessful";
            if(devices[deviceID].PairingState != "unpaired"){
                statusMsg += "Device unavailable for pairing.";
            }
            if(persons[personIndex].PairingState != "unpaired"){
                statusMsg += "Person unavailable for pairing.";
            }
        }
    }
    else{
        statusMsg += "Pairing attempt unsuccessful. One or both objects were not found.";
    }
    socket.send(JSON.stringify({"status": statusMsg, "ownerID": personID}));
}

//tested
exports.printPersons = function(){
	console.log("People tracked: ");
    var output;
    console.log(persons);
    try{
        console.log("There are "+persons.length+" people in this view."); // adding sensor ID if possible

        persons.forEach(function(item) {
            console.log("The "+persons.indexOf(item)+"th Person --> "
                + JSON.stringify(item, null, 2));
            console.log(JSON.stringify(item.ID))
            if(persons.indexOf(item)>0)                             //if not the first person
            {
                console.log("\t Distance to the 0th person :"+  //print the distance between this person to the first person for testing
                    util.distanceBetweenPoints(persons[0].Location,item.Location));
            }
            if(item = null){
                console.log("null person");
            }
        });
    }
    catch(err){
        console.log(err);
        return false;
    }
	console.log("///////////////////////////////////////////////////////////////");
    return true;
}

exports.purgeInactiveDevices = function(){
    for(var key in devices){
        if(devices.hasOwnProperty(key)){
            var timeDifference = (new Date() - devices[key].LastUpdated);
            if(timeDifference > 3000 && devices[key].stationary == false){
                delete devices[key];
            }
        }
    }
}

exports.setPairingState = function(deviceID){
    if(devices[deviceID] != null){
        devices[deviceID].PairingState = "pairing";
    }
}

exports.unpairDevice = function(deviceID, personID){
    if(devices[deviceID] != undefined){
        devices[deviceID].PairingState = "unpaired";
        devices[deviceID].OwnerID = null;
        devices[deviceID].Location.X = null;
        devices[deviceID].Location.Y = null;
        devices[deviceID].Location.Z = null;
    }
    if(util.findWithAttr(persons, 'ID', personID) != undefined){
        persons[util.findWithAttr(persons, "ID", personID)].PairingState = "unpaired";
        persons[util.findWithAttr(persons, "ID", personID)].OwnedDeviceID = null;
        persons[util.findWithAttr(persons, "ID", personID)].Orientation = null;
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
        console.log(err);
        return false;
    }
    console.log("///////////////////////////////////////////////////////////////");
    return true;
}

// TODO: implement!
// TODO: test!
exports.updateDeviceOrientation = function(device){
    this.purgeInactiveDevices();
    if(devices[device.ID] != undefined){
        try{
            devices[device.ID].Orientation = device.Orientation;
            devices[device.ID].LastUpdated = new Date();

            if(devices[device.ID].OwnerID != null){
                persons[util.findWithAttr(persons, "ID", devices[device.ID].OwnerID)].Orientation = device.Orientation;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(devices[device.ID] == null){
                delete devices[device.ID]
            }
        }
    }
    else{
        if(device.ID != undefined && device.Orientation != undefined){
            device.LastUpdated = new Date();
            devices.push(device);
        }
    }
}

exports.unpairAllPeople = function(){
    console.log("UNPAIRING ALL PEOPLE");
    persons.forEach(function(person){
        if(person != null){
            console.log(person);
            person.PairingState = 'unpaired';
            person.OwnedDeviceID = null;
        }
        else{
            console.log("person is null");
        }
    })
}

exports.cleanUpSensor = function(socketID){
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    delete sensors[socketID];
    for(var i = 0; i <= persons.length; i++){
        console.log("Persons[] length: " + persons.length);
        console.log("i value: " + i);
        if(i < persons.length){
            while(util.findWithAttr(persons[i].ID, "originatingSocket", socketID) != undefined){
                console.log("Person " + i + "has ID with socket being removed.");
                persons[i].ID.splice(util.findWithAttr(persons[i].ID, "originatingSocket", socketID), 1);
            }
        }
        else{
            for(var j = persons.length-1; j >= 0; j--){
                console.log(JSON.stringify(persons))
                if(persons[j].ID.length <= 0){
                    persons.splice(j, 1);
                }

            }
        }
    }
    if(sensorsReference.socketID){
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
        console.log("1.  " + JSON.stringify(sensorsReference))
        console.log("2.  " + JSON.stringify(sensors[socketID]))
        console.log("all good, removed sensor is not reference");
    }
}

exports.initDevice = function(deviceID, height, width){
    if(devices[deviceID] != undefined){
        devices[deviceID].Height = height;
        devices[deviceID].Width = width;
        console.log("Device initiated late, updating height and width");
    }
    else{
        var device = new factory.Device();
        device.ID = deviceID;
        device.Height = height;
        device.Width = width;
        device.LastUpdated = new Date();
        devices[device.ID] = device;
        console.log("Initiating device");
    }
}

// TODO: implement!
// TODO: test!
exports.getDevicesInView = function(observer, devicesInFront){
    console.log("GetDevicesInView was called");
	// TODO: test
    console.log(observer);
	//var returnDevices = {};
    var returnDevices = {};
    var observerLineOfSight = factory.makeLineUsingOrientation(observer.Location, observer.Orientation);
    for(var i = 0; i <= devicesInFront.length; i++){
        if(i == devicesInFront.length){
            return returnDevices;
        }
        else{
            if(devices[devicesInFront[i]].Width != null){
                var sides = util.getLinesOfShape(devices[devicesInFront[i]]);
                var intersectionPoints = [];

                sides.forEach(function(side){
                    var intPoint = util.getIntersectionPoint(observerLineOfSight, side);
                    if(intPoint != null){
                        intersectionPoints.push(intPoint);
                    }
                });

                if(intersectionPoints.length != 0){
                    console.log("intersection points not empty");
                    //this.continue;
                    var nearestPoint = intersectionPoints[0];
                    var shortestDistance = util.distanceBetweenPoints(observer.Location, nearestPoint);

                    intersectionPoints.forEach(function(point){
                        var distance = util.distanceBetweenPoints(observer.Location, point);
                        if(distance < shortestDistance){
                            nearestPoint = point;
                            shortestDistance = distance;
                        }
                    });

                    var ratioOnScreen = util.GetRatioPositionOnScreen(devicesInFront[i], nearestPoint);

                    devices[devicesInFront[i]].IntersectionPoint.X = ratioOnScreen.X;
                    devices[devicesInFront[i]].IntersectionPoint.Y = ratioOnScreen.Y;
                    console.log("Pushed a target for sending!");
                    returnDevices.push(devices[devicesInFront[i]]);
                }
            }
        }
    };
}

// TODO: implement!
// TODO: test!
exports.getDevicesInFront = function(observerID){
	// TODO: implement!
	// List<Device> returnDevices = new List<Device>();
    var observer = devices[observerID];
    var returnDevices = {};

	// //(CB - Should we throw an exception here? Rather then just returning an empty list?)
    try{
        if (observer.Location == null || observer.Orientation == null)
             return returnDevices;
         if (observer.FOV == 0.0)
             return returnDevices;
    }
    catch(err){
        console.log(err);
    }

	// // We imagine the field of view as two vectors, pointing away from the observing device. Targets between the vectors are in view.
	// // We will use angles to represent these vectors.
    try{
        var leftFieldOfView = util.normalizeAngle(observer.Orientation + 30);
        var rightFieldOfView = util.normalizeAngle(observer.Orientation - 30);

        return Object.keys(devices).filter(function(key){
            //var angle = util.normalizeAngle(Math.atan2(devices[key].Location.Y - observer.Location.Y, devices[key].Location.X - observer.Location.X) * 180 / Math.PI);
            if(devices[key] != observer && devices[key].Location != undefined){
                if (leftFieldOfView > rightFieldOfView &&
                    (util.normalizeAngle(Math.atan2(devices[key].Location.Y - observer.Location.Y, devices[key].Location.X - observer.Location.X) * 180 / Math.PI)) < leftFieldOfView &&
                    (util.normalizeAngle(Math.atan2(devices[key].Location.Y - observer.Location.Y, devices[key].Location.X - observer.Location.X) * 180 / Math.PI)) > rightFieldOfView){
                    return true;
                }
            }
            else if (leftFieldOfView < rightFieldOfView)
            {
                if ((util.normalizeAngle(Math.atan2(devices[key].Location.Y - observer.Location.Y, devices[key].Location.X - observer.Location.X) * 180 / Math.PI)) < leftFieldOfView ||
                    (util.normalizeAngle(Math.atan2(devices[key].Location.Y - observer.Location.Y, devices[key].Location.X - observer.Location.X) * 180 / Math.PI)) > rightFieldOfView){
                    return true;
                }
            }
        })
    }
    catch(err){
        console.log(err);
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
    if(observer.Location == null){
        return returnDevices;
    }

    devices.forEach(function(device){
        if(device == observer){
           //this.continue /////is this necessary, if it's an else if?
        }
        else if(device.Location != null && util.distanceBetweenPoints((observer.Location, device.Location) < distance)){
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
           if(device != observer && device.Location != null){//!=null equivalent to .HasValue?
               nearest = device;
           }
        });
        if(nearest == null){
            return null;
        }

        deviceList.forEach(function(device){
           if(device != observer && device.Location != null &&
                        util.distanceBetweenPoints(device.Location, observer.Location) < util.distanceBetweenPoints(nearest.Location, observer.Location)){
              nearest = device;
           }
        });
        return nearest;
    }
}