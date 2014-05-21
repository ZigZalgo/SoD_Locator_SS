var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
var frontend = require('./frontend');
var events = require("events");
var EventEmitter = require("events").EventEmitter;
	
var persons = [];
var devices = [];
var sensors = [];
sensors.reference = null;
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
    console.log("REFERENCE IS: " + sensors.reference)
    if(sensors.reference == null || sensors.length == 0){
        console.log("")
        sensor.calibration = {Rotation: 0, TransformX: 0, TransformY: 0};
        sensor.isCalibrated = true;
        sensors.reference = sensor;
        console.log("setting default reference")
        sensors.push(sensor);
    }
    else{
        sensors.push(sensor);
    }
};

exports.calibrateSensors = function(){
    console.log("Calibrating sensors...")
    var sensor1 = sensors[0];
    var sensor2 = sensors[1];
    sensor1.points = [];
    sensor2.points = [];

    console.log("Sensor1: " + sensor1.sensorType);
    console.log("Sensor2: " + sensor2.sensorType);

    //BIG ASSUMPTION: assuming only two people on server... this is a restriction during setup
    var interval = setInterval(function(){
        console.log("SETTING INTERVAL");
        if(sensor1.points.length == 2 && sensor2.points.length == sensor1.points.length){
            clearInterval(interval);

            console.log("Sensor1...\n" + JSON.stringify(sensor1));
            console.log("Sensor2...\n" + JSON.stringify(sensor2));
            console.log("THIS IS THE POINT CONTAINER FOR CALIBRATION");
            frontend.io.sockets.emit("webMessageEvent", util.getTranslationRule(sensor1.points[0], sensor1.points[1], sensor2.points[0], sensor2.points[1]))
            return (util.getTranslationRule(sensor1.points[0], sensor1.points[1], sensor2.points[0], sensor2.points[1]))
        }
        else{
            sensor1.points.push({X: persons[util.findWithAttr(persons, "LastUpdatedBy", sensor1.socketID)].Location.X, Z: persons[util.findWithAttr(persons, "LastUpdatedBy", sensor1.socketID)].Location.Z});
            sensor2.points.push({X: persons[util.findWithAttr(persons, "LastUpdatedBy", sensor2.socketID)].Location.X, Z: persons[util.findWithAttr(persons, "LastUpdatedBy", sensor2.socketID)].Location.Z});
            console.log("Sensor1 points count is: " + sensor1.points.length)
            console.log("Sensor2 points count is: " + sensor2.points.length)
        }
    }, 3000);
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
                devices[util.findWithAttr(devices, "ID", persons[returnedID].OwnedDeviceID)].Location.X = receivedPerson.Location.X.toFixed(3);
                devices[util.findWithAttr(devices, "ID", persons[returnedID].OwnedDeviceID)].Location.Y = receivedPerson.Location.Y.toFixed(3);
                devices[util.findWithAttr(devices, "ID", persons[returnedID].OwnedDeviceID)].Location.Z = receivedPerson.Location.Z.toFixed(3);
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
    var deviceIndex = util.findWithAttr(devices, "ID", deviceID);
    var personIndex = util.findWithAttr(persons, "ID", personID);
    var statusMsg = "Device ID: " + deviceID +
                    "\nDevice Index: " + deviceIndex +
                    "\nPerson ID: " + personID +
                    "\nPerson Index: " + personIndex + "\n\n";
    if(deviceIndex != undefined && personIndex != undefined){
        if(devices[deviceIndex].PairingState == "unpaired" && persons[personIndex].PairingState == "unpaired"){
            devices[deviceIndex].OwnerID = persons[personIndex].ID;
            devices[deviceIndex].PairingState = "paired";
            persons[personIndex].OwnedDeviceID = devices[deviceIndex].ID;
            persons[personIndex].PairingState = "paired";
            statusMsg += "\n Pairing successful.";
        }
        else{
            statusMsg += "\nPairing attempt unsuccessful";
            if(devices[deviceIndex].PairingState != "unpaired"){
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
    devices.forEach(function(device){
        var timeDifference = (new Date() - device.LastUpdated);
        if(timeDifference > 3000 && device.stationary == false){
            devices.splice(devices.indexOf(device), 1)
        }
    })
}

exports.setPairingState = function(deviceID){
    var index = util.findWithAttr(devices, 'ID', deviceID);
    if(index != -1){
        devices[index].PairingState = "pairing";
    }
}

exports.unpairDevice = function(deviceID, personID){
    if(util.findWithAttr(devices, 'ID', deviceID) != undefined){
        devices[util.findWithAttr(devices, 'ID', deviceID)].PairingState = "unpaired";
        devices[util.findWithAttr(devices, 'ID', deviceID)].OwnerID = null;
        devices[util.findWithAttr(devices, 'ID', deviceID)].Location.X = null;
        devices[util.findWithAttr(devices, 'ID', deviceID)].Location.Y = null;
        devices[util.findWithAttr(devices, 'ID', deviceID)].Location.Z = null;
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
        devices.forEach(function(item) {
            console.log(JSON.stringify(item));
            if(item = null){
                console.log("null device");
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

// TODO: implement!
// TODO: test!
exports.updateDeviceOrientation = function(device){
    this.purgeInactiveDevices();
    if(util.findWithAttr(devices, "ID", device.ID) != undefined){
        try{
            devices[util.findWithAttr(devices, "ID", device.ID)].Orientation = device.Orientation;
            devices[util.findWithAttr(devices, "ID", device.ID)].LastUpdated = new Date();

            if(devices[util.findWithAttr(devices, "ID", device.ID)].OwnerID != null){
                persons[util.findWithAttr(persons, "ID", devices[util.findWithAttr(devices, "ID", device.ID)].OwnerID)].Orientation = device.Orientation;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(devices[util.findWithAttr(devices, "ID", device.ID)] == null){
                devices.splice(devices.indexOf(devices[util.findWithAttr(devices, "ID", device.ID)]), 1)
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
    sensors.splice(util.findWithAttr(sensors, "socketID", socketID), 1);
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
                console.log("CHECKING FOR EMPTY ID LISTS");
                console.log(JSON.stringify(persons))
                if(persons[j].ID.length <= 0){
                    console.log("REMOVING AN EMPTY ID LIST AT INDEX:  " + j)
                    persons.splice(j, 1);
                }

            }
        }
    }
}

exports.initDevice = function(deviceID, height, width){
    if(util.findWithAttr(devices, "ID", deviceID) != undefined){
        devices[util.findWithAttr(devices, "ID", deviceID)].Height = height;
        devices[util.findWithAttr(devices, "ID", deviceID)].Width = width;
        console.log("Device initiated late, updating height and width");
    }
    else{
        var device = new factory.Device();
        device.ID = deviceID;
        device.Height = height;
        device.Width = width;
        device.LastUpdated = new Date();
        devices.push(device);
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
    var returnDevices = [];
    var observerLineOfSight = factory.makeLineUsingOrientation(observer.Location, observer.Orientation);
    for(var i = 0; i <= devicesInFront.length; i++){
        console.log("i: " + i + " // " + devicesInFront.length);
        console.log("devices in front: " + devicesInFront);
        if(i == devicesInFront.length){
            console.log("returning devices for sending: " + returnDevices);
            return returnDevices;
        }
        else{
            console.log(devicesInFront[i]);
            if(devicesInFront[i].Width != null){
                console.log("width not null");
                var sides = util.getLinesOfShape(devicesInFront[i]);
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

                    devicesInFront[i].IntersectionPoint.X = ratioOnScreen.X;
                    devicesInFront[i].IntersectionPoint.Y = ratioOnScreen.Y;
                    console.log("Pushed a target for sending!");
                    returnDevices.push(devicesInFront[i]);
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
    var observer = devices[util.findWithAttr(devices, "ID", observerID)];
    console.log("GetDevicesInFront was called");
    var returnDevices = [];

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



        for(var i = 0; i <= devices.length; i++){
            console.log("i: " + i);
            if(i == devices.length){
                console.log("returning devices: " + returnDevices);
                return this.getDevicesInView(observer, returnDevices);
            }
            else{
                console.log("Searching all devices...");
                if(devices[i] != observer && devices[i].Location != undefined){
                    var angle = util.normalizeAngle(Math.atan2(devices[i].Location.Y - observer.Location.Y, devices[i].Location.X - observer.Location.X) * 180 / Math.PI);
                    if (leftFieldOfView > rightFieldOfView && angle < leftFieldOfView && angle > rightFieldOfView){
                        console.log("Pushed a target1!: " + devices[i]);
                        returnDevices.push(devices[i]);
                    }
                }
                else if (leftFieldOfView < rightFieldOfView)
                {
                    if (angle < leftFieldOfView || angle > rightFieldOfView){
                        returnDevices.push(devices[i]);
                        console.log("Pushed a target2!: " + devices[i]);
                    }
                }
            }
        }
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