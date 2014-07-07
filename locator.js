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
    console.log('received sensor: ' +JSON.stringify(sensor));
    console.log("REFERENCE IS: " + sensorsReference);
    if(sensorsReference == null){
        //sensor.calibration = {Rotation: 0, TransformX: 0, TransformY: 0,xSpaceTransition:0,ySpaceTransition:0, StartingLocation: {X: 0, Y: 0, Z: 0}};
        sensor.isCalibrated = true;
        sensorsReference = sensor;
        console.log("setting default reference");
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
            // for all the keys in current person's ID list
            for(var IDkey in persons[key].ID){
                //if current sensor socket ID is exists in the current person's ID list, and this sensor ID doesn't exit in the new list of people
                if(persons[key].ID[IDkey] == socket.id && util.findWithAttr(newListOfPeople, "ID", IDkey) == undefined){
                    try{
                        if(persons[key].currentlyTrackedBy == persons[key].ID[IDkey] && Object.keys(persons[key].ID).length > 0){
                            console.log('Person :'+persons[key].uniquePersonID+' currentlyTrackedBy before: ' + persons[key].currentlyTrackedBy +' seen by: '+ JSON.stringify(persons[key].ID) + ' deleting : '+persons[key].ID[IDkey]);//persons[key].ID[Object.keys(persons[key].ID)[0]]);
                            delete persons[key].ID[IDkey];

                            console.log('person ' + key + ' is changed to seen by: ' + persons[key].currentlyTrackedBy);
                        }

                    }
                    catch(err){
                        console.log("failed to update currentlyTrackedBy to new socket.id: " + err);
                    }

                }
                 persons[key].currentlyTrackedBy = persons[key].ID[Object.keys(persons[key].ID)[0]];//Object.keys(persons[key].ID)[0];
            }
        }
        try{
            locator.removeUntrackedPeople();
        }
        catch(err){
            console.log("error trying to remove untracked people: " + err);
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
                person.currentlyTrackedBy = socket.id;
                persons[person.uniquePersonID] = person;
            }
        }
    }
    else{
        //there are people being tracked, see if they match
        var counter = Object.keys(persons).length;
        var nearestPerson;
        var nearestDistance = 1000;
        for(var key in persons){
            counter --;
            if(persons.hasOwnProperty(key)){
                //console.log(persons[key].currentlyTrackedBy + " == " + socket.id)
                // the received the person's ID exists in a person's ID list AND this person is tracked by this sensor
                if(persons[key].ID[receivedPerson.ID] != undefined && persons[key].currentlyTrackedBy == socket.id){
                    //person found and updating person's new information nd device information
                    //console.log('Found and updating person :' + key);
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
                // this person comes in with a new ID
                else{
                    //console.log('counter: '+counter);
                    //// updating the nearest person
                    if(util.distanceBetweenPoints(persons[key].location, receivedPerson.location) < nearestDistance){
                        //console.log('updating nearest person by ' + persons[key].uniquePersonID +' for person :' + JSON.stringify(receivedPerson) );
                        //nearestPerson = persons[key];
                        //console.log(JSON.stringify(persons[key].location) + 'life is hard : '+ JSON.stringify(receivedPerson.location));
                        nearestDistance= util.distanceBetweenPoints(persons[key].location, receivedPerson.location);

                        ////
                        // reach the end of the people list
                        if(counter == 0){

                            // check if the nearest person is within the threshold
                            if(nearestDistance < 0.4){
                                //nearestPerson.ID[receivedPerson.ID] = socket.id; // add the sensor ID to the the nearest person's ID

                                // if the sensor hasn't been registered to the person's seen by sensor list
                                if(persons[key].ID[receivedPerson.ID]==undefined){
                                    console.log('person '+persons[key].uniquePersonID+' is started being seen by ' + socket.id);
                                    console.log('merging person to '+persons[key].uniquePersonID+' with nearestDistance : ' + nearestDistance);
                                    persons[key].ID[receivedPerson.ID] = socket.id;
                                }
                                //console.log('only updating nearest person');
                                //locator.removeDuplicateInstancesOfTrackedPerson(persons[key].uniquePersonID, receivedPerson.ID)
                                locator.removeUntrackedPeople();
                            }
                            else{
                                console.log('register new person : ' + JSON.stringify(receivedPerson.location) +' by sensor :' + socket.id);
                                ///end of iterations, person not found and not near a tracked person
                                if(receivedPerson.ID != undefined && receivedPerson.location != undefined){ //if provided an ID and a location, update
                                    var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
                                    person.lastUpdated = new Date();
                                    person.currentlyTrackedBy = socket.id;
                                    persons[person.uniquePersonID] = person;
                                }
                            }
                        }
                    }

                }
            }
        }
    }
};

exports.removeDuplicateInstancesOfTrackedPerson = function(uniquePersonID, personID){
    for(var key in persons){
        // for all the people other than this person
        if(key != uniquePersonID){
            // for all the keys in the person's ID list
            for(var IDkey in persons[key].ID){
                if(IDkey == personID){
                    delete persons[key].ID[IDkey];
                    console.log('removing '+personID+' from uniquePersonID: ' + uniquePersonID);
                }
            }
        }
        try{
            locator.removeUntrackedPeople();
        }
        catch(err){
            console.log("error while trying to remove untracked people after checking for duplicate instances of tracked people: \n" + err);
        }
    }
}
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
        counter--;
        if(persons.hasOwnProperty(key)){
            for(var IDkey in persons[key].ID){
                if(persons[key].ID.hasOwnProperty(IDkey)){
                    if(persons[key].ID[IDkey] == socketID){
                        delete persons[key].ID[IDkey];
                        if(counter == 0){
                            locator.removeUntrackedPeople();
                        }
                    }
                }
            }
        }
    }

    /////
    if(sensorsReference.socketID == socketID){
        if(Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)}).length > 0){
            sensors[Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)})[0]].isCalibrated = true;
            sensors[Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)})[0]].calibration = {Rotation: 0, TransformX: 0, TransformY: 0,xSpaceTransition:0,ySpaceTransition:0, StartingLocation: {X: 0, Y: 0, Z: 0}};
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
        devices[socket.id].deviceType = deviceInfo.deviceType;

        console.log("Device initiated late, updating height and width");
    }
    else{
        // if client is running on server side, the socket IP will be localhost ip
        // here to set that to actual server IP
        var socketIP;
        if(socket.handshake.address.address=='127.0.0.1' && frontend.serverAddress!=undefined){
            console.log(socket.handshake.address.address+' --> ' + frontend.serverAddress);
            socketIP = frontend.serverAddress;
        }else{
            socketIP = socket.handshake.address.address;
        }
        console.log("IP: "+socketIP);
        //console.log('got deviceInfo.ID'+ deviceInfo.ID);
        var device = new factory.Device(socket, {ID: deviceInfo.ID, orientation: deviceInfo.orientation});
        if(deviceInfo.name != null && deviceInfo.name != undefined){
            device.name = deviceInfo.name;
        }
        else{
            device.name = "Device " + device.ID;
        }

        device.height = deviceInfo.height;
        device.width = deviceInfo.width;
        device.deviceType = deviceInfo.deviceType;
        device.FOV = deviceInfo.FOV;
        device.lastUpdated = new Date();
        device.deviceIP = socketIP;
        // for station
        if(deviceInfo.stationary == true){
            device.stationary = deviceInfo.stationary;
            device.location = {X: deviceInfo.locationX, Y: deviceInfo.locationY, Z: deviceInfo.locationZ}
            frontend.io.sockets.emit("refreshStationaryLayer", {});
        }
        // JSclient may register deivce with location as well.
        if(deviceInfo.location!=undefined){
            device.location = {X: deviceInfo.location.X, Y: deviceInfo.location.Y, Z: deviceInfo.location.Z}
        }


        devices[socket.id] = device; // officiciallly register the device to locator(server)
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
    console.log("length of devicesInFront: " + devicesInFront.length)
    for(var i = 0; i <= devicesInFront.length; i++){

        if(i == devicesInFront.length){
            console.log("returning devicesInView!\n" + JSON.stringify(returnDevices))
            return returnDevices;
        }
        else{
            if(devices[devicesInFront[i]]!= undefined){
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
            else{
                console.log("devices:\n " + JSON.stringify(devices))
                console.log("devicesInFront:\n " + JSON.stringify(devicesInFront));
                console.log("i:\n " + JSON.stringify(i));
            }

        }
    };
}

// TODO: implement!
// TODO: test!
exports.getDevicesInFront = function(observerSocketID, deviceList){
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

        return Object.keys(deviceList).filter(function(key){
            //var angle = util.normalizeAngle(Math.atan2(devices[key].location.Y - observer.location.Y, devices[key].location.X - observer.location.X) * 180 / Math.PI);


            if(deviceList[key] != observer && deviceList[key].location != undefined){
                console.log("Deivice Location:: \n" + JSON.stringify(deviceList[key].location))

                console.log("Angle from observer to target: " + util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI))
                console.log("Observer: \n" + JSON.stringify(observer))
                console.log("Target: \n" + JSON.stringify(deviceList[key]))

                console.log("First condition less than lFOV: " + util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI));
                console.log("Second condition greater than rFOV: " + (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)))
                if (leftFieldOfView > rightFieldOfView &&
                    (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView &&
                    (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView){
                    return true;
                }
                else if (leftFieldOfView < rightFieldOfView)
                {
                    if ((util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView ||
                        (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView){
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

// TODO: test!
exports.getNearestDevice = function (observer, listDevices) {
    //recursive function to return nearest device, given an observer and a list of devices to compare
    var compareNextDeviceInList = function (keyIndexOfDeviceList, currentClosestDevice) {
        //if not end of recursion
        if (keyIndexOfDeviceList >= 0) {
            if(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].uniqueDeviceID == observer.uniqueDeviceID){
                return compareNextDeviceInList(keyIndexOfDeviceList - 1, currentClosestDevice);
            }
            else{
                //first call passes null as currentClosestDevice, pick device from list as currentClosestDevice
                if (currentClosestDevice == null) {
                    return compareNextDeviceInList(keyIndexOfDeviceList - 1, listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]])
                }

                //if device in list is closer to observer than currentClosestDevice, replace currentClosestDevice with device in list
                else if (util.distanceBetweenPoints(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].location, observer.location) <
                    util.distanceBetweenPoints(currentClosestDevice.location, observer.location)) {
                    return compareNextDeviceInList(keyIndexOfDeviceList - 1, listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]]);
                }
                //currentClosestDevice is closer to observer than device in list, no change
                else {
                    return compareNextDeviceInList(keyIndexOfDeviceList - 1, currentClosestDevice);
                }
            }
        }
        //end of recursion
        else {
            if(currentClosestDevice == null){
                return {};
            }
            else{
                var container = {};
                container[currentClosestDevice.socketID] = currentClosestDevice;
                return container;
            }
        }
    }

    return compareNextDeviceInList(Object.keys(listDevices).length - 1, null)
};

// TODO: test!
exports.getDevicesWithinRange = function (observer, maxRange, listDevices) {

    var filterDeviceListByRange = function (keyIndexOfDeviceList, listDevicesToReturn) {
        if (keyIndexOfDeviceList >= 0) {
            if(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].uniqueDeviceID == observer.uniqueDeviceID){
                return filterDeviceListByRange(keyIndexOfDeviceList - 1, listDevicesToReturn);
            }
            else if (util.distanceBetweenPoints(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].location, observer.location) > maxRange) {
                console.log(util.distanceBetweenPoints(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].location, observer.location));
                console.log(maxRange);
                return filterDeviceListByRange(keyIndexOfDeviceList - 1, listDevicesToReturn);
            }
            else {
                //check to see list is modified before sending as param in return recursive call
                listDevicesToReturn[Object.keys(listDevices)[keyIndexOfDeviceList]] = listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]];
                return filterDeviceListByRange(keyIndexOfDeviceList - 1, listDevicesToReturn);
            }
        }
        //end of recursion
        else {
            return listDevicesToReturn;
        }
    }

    return filterDeviceListByRange(Object.keys(listDevices).length-1, {});
};