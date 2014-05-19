var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
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
    console.log("registering server from locator.js");
    if(sensors.reference == null){
        this.Calibration = {Rotation: 0, TransformX: 0, TransformY: 0};
        //sensors.reference = sensor;
        console.log("setting default reference")
    }
    sensors.push(sensor);
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
    var sensor1target = persons[util.findWithAttr(persons, "LastUpdatedBy", sensor1.socket)];
    var sensor2target = persons[util.findWithAttr(persons, "LastUpdatedBy", sensor2.socket)];


    var interval = setInterval(function(){
        sensor1.points.push({X: sensor1target.Location.X, Y: sensor1target.Location.Y});
        sensor2.points.push({X: sensor2target.Location.X, Y: sensor2target.Location.Y});
        if(sensor1.points.count == 3 && sensor2.points.count == sensor1.points.count){
            clearInterval(interval);

            console.log("Sensor1...\n"
                + "X1: " + sensor1.points[0].X + "\tY1: " + sensor1.points[0].Y
                + "X2: " + sensor1.points[1].X + "\tY2: " + sensor1.points[1].Y
                + "X3: " + sensor1.points[2].X + "\tY3: " + sensor1.points[2].Y);

            console.log("Sensor2...\n"
                + "X1: " + sensor2.points[0].X + "\tY1: " + sensor2.points[0].Y
                + "X2: " + sensor2.points[1].X + "\tY2: " + sensor2.points[1].Y
                + "X3: " + sensor2.points[2].X + "\tY3: " + sensor2.points[2].Y);

            return {sensor1: sensor1, sensor2: sensor2}
        }
    }, 1000);


        //grab 3 points from each of two sensors (can change this for more sensors later...?


        //calculate centroids for both polygons

        //calculate transformation between the two centroids

        //calculate angle of (reference P1)(reference origin)(transformed P1)
}

// tested
exports.updatePersons = function(receivedPerson, socket){
    this.purgeInactivePersons();
    if(util.findWithAttrWeak(persons, "ID", {value: receivedPerson.Person_ID, originatingSocket: socket.id}) != undefined){
        console.log("FOUND WITH THIS ID: " + util.findWithAttrWeak(persons, "ID", {value: receivedPerson.Person_ID, originatingSocket: socket.id}))
        //person was found
        var returnedID = util.findWithAttrWeak(persons, "ID", {value: receivedPerson.Person_ID, originatingSocket: socket.id});
        try{
            persons[returnedID].Location.X = person.Location.X;
            persons[returnedID].Location.Y = person.Location.Y;
            persons[returnedID].Location.Z = person.Location.Z;
            persons[returnedID].LastUpdated = new Date();
            if(persons[returnedID].OwnedDeviceID != null){
                devices[util.findWithAttr(devices, "ID", persons[returnedID].OwnedDeviceID)].Location.X = receivedPerson.Location.X;
                devices[util.findWithAttr(devices, "ID", persons[returnedID].OwnedDeviceID)].Location.Y = receivedPerson.Location.Y;
                devices[util.findWithAttr(devices, "ID", persons[returnedID].OwnedDeviceID)].Location.Z = receivedPerson.Location.Z;
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
        console.log("NOT FOUND")
        console.log(receivedPerson.Person_ID)
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
        if(timeDifference > 900 && device.stationary == false){
            //console.log("TIME DIFFERENCE: " + timeDifference);
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

exports.purgeInactivePersons = function(){
    persons.forEach(function(person){
        var timeDifference = (new Date() - person.LastUpdated);
        try{
            if(timeDifference > 900){
                if(person.OwnedDeviceID != null){
                    devices[util.findWithAttr(devices, "ID", person.OwnedDeviceID)].PairingState = "unpaired";
                    devices[util.findWithAttr(devices, "ID", person.OwnedDeviceID)].OwnerID = null;
                }
                persons.splice(persons.indexOf(person), 1)
            }
        }
        catch(err){}
    })
}

exports.printDevices = function(){
    console.log("devices tracked: ");
    var output;
    //console.log(devices);
    try{
        devices.forEach(function(item) {
            output = "ID: " + item.ID +
                "     X: " + item.Location.X +
                "     Y: " + item.Location.Y +
                "     Z: " + item.Location.Z +
                "     Orientation: " + item.Orientation +
                "     PairingState: " + item.PairingState;
            console.log(output)
            if(item = null){
                console.log("null device");
            }
        });
    }
    catch(err){
        console.log("here??");
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

	// List<Device> returnDevices = new List<Device>();

	// Line obseverLineOfSight = new Line(observer.Location, observer.Orientation);

	// List<Device> devicesInView = GetDevicesInFront(observer);

	// foreach (Device target in devicesInView)
	// {
	// if (target.Width == null || target.Width == null)
		// continue;

	// List<Line> sides = getLinesOfShape(target);
	// List<Point?> intersectionPoints = new List<Point?>();

	// foreach (Line side in sides)
	// {
		// Point? intPoint = Line.getIntersectionPoint(obseverLineOfSight, side);
		// if (intPoint != null)
			// intersectionPoints.Add(intPoint);
	// }

	// if (intersectionPoints.Count == 0)
		// continue;

	// Point? nearestPoint = intersectionPoints[0];
	// double shortestDistance = Line.getDistanceBetweenPoints((Point)observer.Location, (Point)nearestPoint);

	// foreach (Point point in intersectionPoints)
	// {
		// double distance = Line.getDistanceBetweenPoints((Point)observer.Location, point);
		// if (distance < shortestDistance)
		// {
			// nearestPoint = point;
			// shortestDistance = distance;
		// }
	// }

	// Point ratioOnScreen = GetRatioPositionOnScreen(target, (Point)nearestPoint);


	// target.intersectionPoint["x"] = ratioOnScreen.X;
	// target.intersectionPoint["y"] = ratioOnScreen.Y;
	// returnDevices.Add(target);                
	// }

	// return returnDevices;
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

	// foreach (Device target in _devices)
	// {
		// if (target == observer || !target.Location.HasValue)
			// continue;

		// // Atan2 is the inverse tangent function, given lengths for the opposite and adjacent legs of a right triangle, it returns the angle
		// double angle = Util.NormalizeAngle(Math.Atan2(target.Location.Value.Y - observer.Location.Value.Y, target.Location.Value.X - observer.Location.Value.X) * 180 / Math.PI);

		// // Ordinarily, the angle defining the left boundary of the field of view will be larger than the angle for the right.
		// // For example, if our device has an orientation of 90.0 and a field of view of 15 degrees, then the left and right FoV vectors are at 97.5 and 82.5 degrees.
		// // In this case, the target must be at an angle between left and right to be in view.
		// if (leftFieldOfView > rightFieldOfView && angle < leftFieldOfView && angle > rightFieldOfView)
		// {
			// returnDevices.Add(target);
		// }
		// // If the field of view includes the X axis, then the left field of view will be smaller than the right field of view.
		// // For example, if our device has an orientation of 0.0 and a field of view of 15 degrees, then the left FoV vector will be at 7.5 degrees,
		// // and the right FoV will be at 352.5 degrees.
		// else if (leftFieldOfView < rightFieldOfView)
		// {
			// if (angle < leftFieldOfView || angle > rightFieldOfView)
				// returnDevices.Add(target);
		// }


	// }

	// return returnDevices;
}

// TODO: implement!
// TODO: test!
exports.GetNearestDeviceInView = function(observer){
	// TODO: test
    var devicesInView = this.GetDevicesInView(observer);
    return this.FindNearestDevice(observer, devicesInView);
	// List<Device> devicesInView = GetDevicesInView(observer);
	// return FindNearestDevice(observer, devicesInView);
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
        var wantToSkip = false;
        if(device == observer){
           //this.continue /////is this necessary, if it's an else if?
        }
        else if(device.Location != null && util.distanceBetweenPoints((observer.Location, device.Location) < distance)){
            returnDevices.push(device);
        }
    });

    return returnDevices;

	// List<Device> returnDevices = new List<Device>();

	// if (!observer.Location.HasValue)
		// return returnDevices;

	// foreach (Device device in _devices)
	// {
		// if (device == observer)
			// continue;
		// else if (device.Location.HasValue && Util.DistanceBetweenPoints(observer.Location.Value, device.Location.Value) < distance)
		// {
			// returnDevices.Add(device);
		// }
	// }

	// return returnDevices;
}

// TODO: implement!
// TODO: test!
exports.GetNearestDeviceWithinRange = function(observer, distance){
	// TODO: test
    var devicesInView = this.GetDevicesWithinRange(observer, distance);
    return this.FindNearestDevice(observer, devicesInView);

	// List<Device> devicesInView = GetDevicesWithinRange(observer, distance);
	// return FindNearestDevice(observer, devicesInView);
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


	// if (deviceList.Count == 0)
		// return null;
	// else
	// {
		// Device nearest = null;

		// //First, find a device with a location to compare against
		// foreach (Device device in deviceList)
		// {
			// if (device != observer && device.Location.HasValue)
			// {
				// nearest = device;
			// }
		// }
		// if (nearest == null)
			// return null;

		// //Find the device with the least distance to the observer
		// foreach (Device device in deviceList)
		// {
			// if (device != observer && device.Location.HasValue &&
				// Util.DistanceBetweenPoints(device.Location.Value, observer.Location.Value) < Util.DistanceBetweenPoints(nearest.Location.Value, observer.Location.Value))
			// {
				// nearest = device;
			// }
		// }
		// return nearest;

	// }
}