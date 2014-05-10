var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
var events = require("events");
var EventEmitter = require("events").EventEmitter;
	
var Persons = [];
var Devices = [];
exports.Persons = Persons;
exports.Devices = Devices;

// TODO: test!
exports.start = function(){
	// Do initialization here, if any
};

// tested
exports.updatePersons = function(person){
    this.purgeInactivePersons();
    if(util.findWithAttr(Persons, "ID", person.ID) != undefined){
        try{
            Persons[util.findWithAttr(Persons, "ID", person.ID)].Location.X = person.Location.X;
            Persons[util.findWithAttr(Persons, "ID", person.ID)].Location.Y = person.Location.Y;
            Persons[util.findWithAttr(Persons, "ID", person.ID)].Location.Z = person.Location.Z;
            Persons[util.findWithAttr(Persons, "ID", person.ID)].LastUpdated = new Date();
            if(Persons[util.findWithAttr(Persons, "ID", person.ID)].OwnedDeviceID != null){
                Devices[util.findWithAttr(Devices, "ID", Persons[util.findWithAttr(Persons, "ID", person.ID)].OwnedDeviceID)].Location.X = person.Location.X;
                Devices[util.findWithAttr(Devices, "ID", Persons[util.findWithAttr(Persons, "ID", person.ID)].OwnedDeviceID)].Location.Y = person.Location.Y;
                Devices[util.findWithAttr(Devices, "ID", Persons[util.findWithAttr(Persons, "ID", person.ID)].OwnedDeviceID)].Location.Z = person.Location.Z;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(Persons[util.findWithAttr(Persons, "ID", person.ID)] == null){
                Persons.splice(util.findWithAttr(Persons, "ID", person.ID), 1)
            }
        }
    }
	else{
        if(person.ID != undefined && person.Location != undefined){
            person.LastUpdated = new Date();
            Persons.push(person);
        }
	}
};

exports.pairDevice = function(deviceID, personID, socket){
    var deviceIndex = util.findWithAttr(Devices, "ID", deviceID);
    var personIndex = util.findWithAttr(Persons, "ID", personID);
    var statusMsg = "Device ID: " + deviceID +
                    "\nDevice Index: " + deviceIndex +
                    "\nPerson ID: " + personID +
                    "\nPerson Index: " + personIndex + "\n\n";
    if(deviceIndex != undefined && personIndex != undefined){
        if(Devices[deviceIndex].PairingState == "unpaired" && Persons[personIndex].PairingState == "unpaired"){
            Devices[deviceIndex].OwnerID = Persons[personIndex].ID;
            Devices[deviceIndex].PairingState = "paired";
            Persons[personIndex].OwnedDeviceID = Devices[deviceIndex].ID;
            Persons[personIndex].PairingState = "paired";
            statusMsg += "\n Pairing successful.";
        }
        else{
            statusMsg += "\nPairing attempt unsuccessful";
            if(Devices[deviceIndex].PairingState != "unpaired"){
                statusMsg += "Device unavailable for pairing.";
            }
            if(Persons[personIndex].PairingState != "unpaired"){
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
    console.log(Persons);
    try{
        Persons.forEach(function(item) {
            output = "ID: " + item.ID +
                "     X: " + item.Location.X +
                "     Y: " + item.Location.Y +
                "     Z: " + item.Location.Z +
                "     Orientation: " + item.Orientation;
            console.log(output)
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
    Devices.forEach(function(device){
        var timeDifference = (new Date() - device.LastUpdated);
        if(timeDifference > 3000 && device.stationary == false){
            //console.log("TIME DIFFERENCE: " + timeDifference);
            Devices.splice(Devices.indexOf(device), 1)
        }
    })
}

exports.setPairingState = function(deviceID){
    var index = util.findWithAttr(Devices, 'ID', deviceID);
    if(index != -1){
        Devices[index].PairingState = "pairing";
    }
}

exports.unpairDevice = function(deviceID, personID){
    if(util.findWithAttr(Devices, 'ID', deviceID) != undefined){
        Devices[util.findWithAttr(Devices, 'ID', deviceID)].PairingState = "unpaired";
        Devices[util.findWithAttr(Devices, 'ID', deviceID)].OwnerID = null;
        Devices[util.findWithAttr(Devices, 'ID', deviceID)].Location.X = null;
        Devices[util.findWithAttr(Devices, 'ID', deviceID)].Location.Y = null;
        Devices[util.findWithAttr(Devices, 'ID', deviceID)].Location.Z = null;
    }
    if(util.findWithAttr(Persons, 'ID', personID) != undefined){
        Persons[util.findWithAttr(Persons, "ID", personID)].PairingState = "unpaired";
        Persons[util.findWithAttr(Persons, "ID", personID)].OwnedDeviceID = null;
        Persons[util.findWithAttr(Persons, "ID", personID)].Orientation = null;
    }
}

exports.purgeInactivePersons = function(){
    Persons.forEach(function(person){
        var timeDifference = (new Date() - person.LastUpdated);
        try{
            if(timeDifference > 3000){
                if(person.OwnedDeviceID != null){
                    Devices[util.findWithAttr(Devices, "ID", person.OwnedDeviceID)].PairingState = "unpaired";
                    Devices[util.findWithAttr(Devices, "ID", person.OwnedDeviceID)].OwnerID = null;
                }
                Persons.splice(Persons.indexOf(person), 1)
            }
        }
        catch(err){}
    })
}

exports.printDevices = function(){
    console.log("Devices tracked: ");
    var output;
    //console.log(Devices);
    try{
        Devices.forEach(function(item) {
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
    if(util.findWithAttr(Devices, "ID", device.ID) != undefined){
        try{
            Devices[util.findWithAttr(Devices, "ID", device.ID)].Orientation = device.Orientation;
            Devices[util.findWithAttr(Devices, "ID", device.ID)].LastUpdated = new Date();

            if(Devices[util.findWithAttr(Devices, "ID", device.ID)].OwnerID != null){
                Persons[util.findWithAttr(Persons, "ID", Devices[util.findWithAttr(Devices, "ID", device.ID)].OwnerID)].Orientation = device.Orientation;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(Devices[util.findWithAttr(Devices, "ID", device.ID)] == null){
                Devices.splice(Devices.indexOf(Devices[util.findWithAttr(Devices, "ID", device.ID)]), 1)
            }
        }
    }
    else{
        if(device.ID != undefined && device.Orientation != undefined){
            device.LastUpdated = new Date();
            Devices.push(device);
        }
    }
}

exports.unpairAllPeople = function(){
    console.log("UNPAIRING ALL PEOPLE");
    Persons.forEach(function(person){
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
    if(util.findWithAttr(Devices, "ID", deviceID) != undefined){
        Devices[util.findWithAttr(Devices, "ID", deviceID)].Height = height;
        Devices[util.findWithAttr(Devices, "ID", deviceID)].Width = width;
        console.log("Device initiated late, updating height and width");
    }
    else{
        var device = new factory.Device();
        device.ID = deviceID;
        device.Height = height;
        device.Width = width;
        device.LastUpdated = new Date();
        Devices.push(device);
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
        console.log("Devices in front: " + devicesInFront);
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
    var observer = Devices[util.findWithAttr(Devices, "ID", observerID)];
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



        for(var i = 0; i <= Devices.length; i++){
            console.log("i: " + i);
            if(i == Devices.length){
                console.log("returning devices: " + returnDevices);
                return this.getDevicesInView(observer, returnDevices);
            }
            else{
                console.log("Searching all devices...");
                if(Devices[i] != observer && Devices[i].Location != undefined){
                    var angle = util.normalizeAngle(Math.atan2(Devices[i].Location.Y - observer.Location.Y, Devices[i].Location.X - observer.Location.X) * 180 / Math.PI);
                    if (leftFieldOfView > rightFieldOfView && angle < leftFieldOfView && angle > rightFieldOfView){
                        console.log("Pushed a target1!: " + Devices[i]);
                        returnDevices.push(Devices[i]);
                    }
                }
                else if (leftFieldOfView < rightFieldOfView)
                {
                    if (angle < leftFieldOfView || angle > rightFieldOfView){
                        returnDevices.push(Devices[i]);
                        console.log("Pushed a target2!: " + Devices[i]);
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

    Devices.forEach(function(device){
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