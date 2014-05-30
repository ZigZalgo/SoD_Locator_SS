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
            for(var key in persons[i].ID){
                console.log("delete condition: " + (persons[i].ID[key] == socket.id && util.findWithAttr(newListOfPeople, "Person_ID", key) == undefined))
                if(persons[i].ID[key] == socket.id && util.findWithAttr(newListOfPeople, "Person_ID", key) == undefined){
                    console.log("DELETING")
                    delete persons[i].ID[key];
                }
            }
        }
        else{
            persons.forEach(function(person){
                console.log("Checking for empty ID lists")
                console.log(JSON.stringify(person));
                if(Object.keys(person.ID).length === 0){
                    console.log("removing at index: " + persons.indexOf(person))
                    persons.splice(persons.indexOf(person), 1);
                }
            })
        }
    }
}

exports.updatePersons = function(receivedPerson, socket){
    if(persons.filter(function(person){
        return (person.ID[receivedPerson.Person_ID] != undefined)}).length > 0){
        console.log('persons found')
        var returnedID = persons.indexOf(persons.filter(function(person){return (person.ID[receivedPerson.Person_ID] != undefined)})[0]);
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
        console.log('person not found')
        if(receivedPerson.Person_ID != undefined && receivedPerson.Location != undefined){ //if provided an ID and a location, update
            console.log(receivedPerson.Person_ID)
            var person = new factory.Person(receivedPerson.Person_ID, receivedPerson.Location, socket);
            person.LastUpdated = new Date();
            persons.push(person);
            console.log("pushing: " + JSON.stringify(person))
        }
    }
};

exports.pairDevice = function(deviceSocketID, uniquePersonID, socket){
    var statusMsg = "Device Socket ID: " + deviceSocketID +
        "\nPerson ID: " + uniquePersonID;

    if(devices[deviceSocketID] != undefined){
        var returnedIndex = util.findWithAttr(persons, "uniquePersonID", uniquePersonID);
        console.log(returnedIndex);
        if(util.findWithAttr(persons, "uniquePersonID", uniquePersonID) != undefined){
            if(devices[deviceSocketID].PairingState == "unpaired" && person.PairingState == "unpaired"){
                devices[deviceSocketID].OwnerID = persons[personIndex].ID; //fix this after fixing personID
                devices[deviceSocketID].PairingState = "paired";
                persons[returnedIndex].OwnedDeviceID = deviceSocketID;
                persons[returnedIndex].PairingState = "paired";
                statusMsg += "\n Pairing successful.";
            }
            else{
                statusMsg += "\nPairing attempt unsuccessful";
                if(devices[deviceSocketID].PairingState != "unpaired"){
                    statusMsg += "Device unavailable for pairing.";
                }
                if(persons[returnedIndex].PairingState != "unpaired"){
                    statusMsg += "Person unavailable for pairing.";
                }
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

exports.setPairingState = function(deviceSocketID){
    if(devices[deviceSocketID] != null){
        devices[deviceSocketID].PairingState = "pairing";
    }
}

exports.unpairDevice = function(deviceSocketID, personID){
    if(devices[deviceSocketID] != undefined){
        devices[deviceSocketID].PairingState = "unpaired";
        devices[deviceSocketID].OwnerID = null;
        devices[deviceSocketID].Location.X = null;
        devices[deviceSocketID].Location.Y = null;
        devices[deviceSocketID].Location.Z = null;
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
    if(devices[device.socketID] != undefined){
        try{
            devices[device.socketID].LastUpdated = new Date();

            if(devices[device.socketID].OwnerID != null){
                persons[util.findWithAttr(persons, "ID", devices[device.socketID].OwnerID)].Orientation = device.Orientation;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(devices[device.socketID] == null){
                delete devices[device.socketID]
            }
        }
    }
    else{
        if(device.Orientation != undefined){
            device.LastUpdated = new Date();
            devices[device.socketID] = device;
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
            for(var key in persons[i].ID){
                if(persons[i].ID.hasOwnProperty(key)){
                    if(persons[i].ID[key] == socketID){
                        console.log("Person " + i + "has ID with socket being removed.");
                        delete persons[i].ID[key];
                    }
                }
            }
        }
        else{
            for(var j = persons.length-1; j >= 0; j--){
                console.log(JSON.stringify(persons))
                if(Object.keys(persons[j].ID).length <= 0){
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

exports.registerDevice = function(socket, deviceInfo){
    if(devices[socket.id] != undefined){
        devices[socket.id].Height = deviceInfo.height;
        devices[socket.id].Width = deviceInfo.width;
        console.log("Device initiated late, updating height and width");
    }
    else{
        var device = new factory.Device(socket);
        device.Height = deviceInfo.height;
        device.Width = deviceInfo.width;
        device.LastUpdated = new Date();
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
    console.log(devices[observerSocketID]);
	//var returnDevices = {};
    var returnDevices = [];
    var observerLineOfSight = factory.makeLineUsingOrientation(devices[observerSocketID].Location, devices[observerSocketID].Orientation);
    for(var i = 0; i <= devicesInFront.length; i++){
        if(i == devicesInFront.length){
            console.log("returning devicesInView!")
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
                    var shortestDistance = util.distanceBetweenPoints(devices[observerSocketID].Location, nearestPoint);

                    intersectionPoints.forEach(function(point){
                        var distance = util.distanceBetweenPoints(devices[observerSocketID].Location, point);
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
exports.getDevicesInFront = function(observerSocketID){
	// TODO: implement!
	// List<Device> returnDevices = new List<Device>();
    var observer = devices[observerSocketID];
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