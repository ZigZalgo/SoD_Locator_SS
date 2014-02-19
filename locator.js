var factory = require('./factory');
	
var Persons = []; //consider changing to {}. currently Persons is created with a null object inside
var Devices = [];

// TODO: test!
exports.start = function(){
	// Do initialization here, if any
};

// tested
exports.updatePersons = function(person){
    var found = false;
    Persons.forEach(function(item) {
        try{
            if(item.ID == person.ID){
                found = true;

                Persons[Persons.indexOf(item)].Location.X = person.Location.X;
                Persons[Persons.indexOf(item)].Location.Y = person.Location.Y;
                Persons[Persons.indexOf(item)].Location.Z = person.Location.Z;
            }
        }
        catch(err){
            //if null or cannot read for some other reason... return false for now
            return false;
        }
    });
	
	if(!found){
		Persons.push(person);
	}
    return found;
};

// added tests, 1 failing, will check when in lab (see comment of definition for Persons[] above)
exports.printPersons = function(){
	console.log("People tracked: ");
    var output;
    console.log(Persons);
    try{
        Persons.forEach(function(item) {
            output = "ID: " + item.ID +
                "     X: " + item.Location.X +
                "     Y: " + item.Location.Y +
                "     Z: " + item.Location.Z;
            console.log(output)
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
exports.updateDevices = function(device){
	// TODO: implement!
}

// TODO: implement!
// TODO: test!
exports.getDevicesInView = function(observer){
	// TODO: implement!
	// var obseverLineOfSight = factory.makeLineUsingOrientation(observer.Location, observer.Orientation);

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
exports.GetDevicesInFront = function(observer){
	// TODO: implement!
	// List<Device> returnDevices = new List<Device>();

	// //(CB - Should we throw an exception here? Rather then just returning an empty list?)
	// if (observer.Location == null || observer.Orientation == null)
		// return returnDevices;
	// if (observer.FieldOfView == 0.0)
		// return returnDevices;

	// // We imagine the field of view as two vectors, pointing away from the observing device. Targets between the vectors are in view.
	// // We will use angles to represent these vectors.
	// double leftFieldOfView = Util.NormalizeAngle(observer.Orientation.Value + 30);
	// double rightFieldOfView = Util.NormalizeAngle(observer.Orientation.Value - 30);


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
	// TODO: implement!
	// List<Device> devicesInView = GetDevicesInView(observer);
	// return FindNearestDevice(observer, devicesInView);
}

// TODO: implement!
// TODO: test!
exports.GetDevicesWithinRange = function(observer, distance){
	// TODO: implement!
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
	// TODO: implement!
	// List<Device> devicesInView = GetDevicesWithinRange(observer, distance);
	// return FindNearestDevice(observer, devicesInView);
}

// TODO: implement!
// TODO: test!
exports.FindNearestDevice = function(observer, deviceList){
	// TODO: implement!
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