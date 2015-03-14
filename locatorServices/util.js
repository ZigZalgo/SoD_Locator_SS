var factory = require('./factory');
var locator = require('./locator');
var util = require('./util');
var Q = require('q');
var async = require('async');

exports.DEFAULT_FIELD_OF_VIEW = 25.0;
exports.KINECT_VIEW_RANGE = 28.5;               // not being used yet
exports.ROUND_RATIO         = 150;         // the round ratio for dealing with not accurate calculation

var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
var tolerance = 0.05;


/*
 take a location from sub-kinect and translate to the location to the MASTER kinect
 @param:
 location        -- the location of a point from the sub-kinect
 translateRules  -- the rules each sub-kinect has for translate the points in its plane to the MASTER-kinect
 @return:
 rotatedPoint    -- the translated location of point in the subKinect to the MASTER kinect
 */
exports.translateToCoordinateSpace = function (location, translateRules) {
    var vectorToStartingPoint = this.getVector(translateRules.startingLocation, location);
    var rotatedPoint = this.matrixTransformation(vectorToStartingPoint, translateRules.degree);
    rotatedPoint.X += translateRules.xDistance + translateRules.startingLocation.X;
    rotatedPoint.Z += translateRules.zDistance + translateRules.startingLocation.Z;
    return rotatedPoint;
};


/*
 Get translation rule for a sensor which is not from the master Kinect when doing calibration
 Since we are only considering 2D situation, Use dot product to get the angle between two sensor
 @param:
 startingLocation1   -- The location of the starting point observed by the MASTER kinect
 endingLocation1     -- The location of the ending point observed by the MASTER kinect
 startingLocation2   -- The location of the starting point observed by the sub-kinect
 endingLocation2     -- The location of the ending point observed by the sub-kinect
 @return:
 translationRules    -- returns an object contains:
 * angle           -- the angle between two sensors ("+" as clockwise, "-" as counter-clockwise)
 * x.Distance      -- the x distance between the point from sub-kinect to MASTER-kinect
 * z.Distance      -- the z distance between the point from sub-kinect to MASTER-kinect
 * startingLocation-- contains the location of the startingPoint of the sub-kinect
 */
exports.getTranslationRule = function (startingLocation1, endingLocation1, startingLocation2, endingLocation2) {
    //console.log("S1P1: " + JSON.stringify(startingLocation1) + "     S1P2: " + JSON.stringify(endingLocation1) + "    S2P1: " + JSON.stringify(startingLocation2) + "     S2P2: " + JSON.stringify(endingLocation2));
    return(setVariables(fixSign));

    function setVariables(cb) {
        var degreeBetweenVectors = util.getDegreeOfTwoVectors(util.getVector(startingLocation1, endingLocation1), util.getVector(startingLocation2, endingLocation2)); // using dot product
        var rotatedVector2 = util.matrixTransformation(util.getVector(startingLocation2, endingLocation2), degreeBetweenVectors);               // clockwise
        var counterRotatedVector2 = util.matrixTransformation(util.getVector(startingLocation2, endingLocation2), -degreeBetweenVectors);
        var rotatedVectorEndingLocation2 = util.matrixTransformation(endingLocation2, degreeBetweenVectors);
        //console.log("CALLING fixSign with degreeBetweenVectors = " + degreeBetweenVectors)
        return(cb(degreeBetweenVectors, rotatedVector2, counterRotatedVector2, rotatedVectorEndingLocation2));
    }

    function fixSign(degreeBetweenVectors, rotatedVector2, counterRotatedVector2, rotatedVectorEndingLocation2) {
        var spaceTransitionX;
        var spaceTransitionZ;
        if (Math.abs(rotatedVector2.X - util.getVector(startingLocation1, endingLocation1).X) < util.ROUND_RATIO && Math.abs(rotatedVector2.Z - util.getVector(startingLocation1, endingLocation1).Z) < util.ROUND_RATIO) {
            spaceTransitionX = (endingLocation1.X - rotatedVectorEndingLocation2.X);
            spaceTransitionZ = (endingLocation1.Z - rotatedVectorEndingLocation2.Z);
            return {
                degree: degreeBetweenVectors,
                xDistance: startingLocation1.X - startingLocation2.X,
                zDistance: startingLocation1.Z - startingLocation2.Z,
                xSpaceTransition: spaceTransitionX,
                zSpaceTransition: spaceTransitionZ,
                startingLocation: startingLocation2
            };
        }
        else if (Math.abs(counterRotatedVector2.X - util.getVector(startingLocation1, endingLocation1).X) < util.ROUND_RATIO && Math.abs(counterRotatedVector2.Z - util.getVector(startingLocation1, endingLocation1).Z) < util.ROUND_RATIO) {
            var counterRotatedVectorEndingLocation2 = util.matrixTransformation(endingLocation2, -degreeBetweenVectors);
            spaceTransitionX = (endingLocation1.X - counterRotatedVectorEndingLocation2.X);
            spaceTransitionZ = (endingLocation1.Z - counterRotatedVectorEndingLocation2.Z);
            return {
                degree: -degreeBetweenVectors,
                xDistance: startingLocation1.X - startingLocation2.X,
                zDistance: startingLocation1.Z - startingLocation2.Z,
                xSpaceTransition: spaceTransitionX,
                zSpaceTransition: spaceTransitionZ,
                startingLocation: startingLocation2
            };
        } else {
            console.log('Couldnot get rotation degree... Reselect Points.');
            return {
                degree: NaN,
                xDistance: startingLocation1.X - startingLocation2.X,
                zDistance: startingLocation1.Z - startingLocation2.Z,
                xSpaceTransition: spaceTransitionX,
                zSpaceTransition: spaceTransitionZ,
                startingLocation: startingLocation2
            };
        }
    }

};


//
exports.getSpaceTransitionRule = function (startingLocation1, endingLocation1, startingLocation2, endingLocation2, angle) {
    //var vectorBetweenSpace = {X:0,Y:0,Z:0};
// Using ending location points.
    //console.log("endingLocation1: "+ JSON.stringify(endingLocation1));
    var rotatedVectorEndingLocation2 = this.matrixTransformation(endingLocation2, angle);
    //console.log("rotated: " + JSON.stringify(rotatedVectorEndingLocation2));
    return testCallback(endingLocation1, rotatedVectorEndingLocation2);
    function testCallback(endingLocation1, rotatedVectorEndingLocation2) {
        var x = endingLocation1.X - rotatedVectorEndingLocation2.X;
        var z = endingLocation1.Z - rotatedVectorEndingLocation2.Z;
        //console.log('Z:'+JSON.stringify(z));
        var transition = {X: x, Y: 0, Z: z};
        return transition;
    }
};
/*exports.cb = function(stuffReturn){
    return stuffReturn;
}*/
/*
 get the vector from two points, since we are dealing with 2D space we only care about X and Z value of a location
 @param:
 locationA         -- the location of the starting point
 locationB         -- the location of the ending point
 @return:
 returnVector      -- return the vector of the two points
 */
exports.getVector = function (locationA, locationB) {
    return {X: locationB.X - locationA.X, Y: 0, Z: locationB.Z - locationA.Z};
    //typeof callback === 'function' && callback();
};


/*
 use dot product to calculate the degree between two vectors
 @param:
 vector1             -- first vector
 vector2             -- second vector
 @return:
 returnDegrees       -- The degree between two vectors
 */
exports.getDegreeOfTwoVectors = function (vector1, vector2) {
    var vector1length = Math.sqrt(Math.pow(vector1.X, 2) + Math.pow(vector1.Z, 2));
    var vector2length = Math.sqrt(Math.pow(vector2.X, 2) + Math.pow(vector2.Z, 2));
    var v1MulV2 = vector1.X * vector2.X + vector1.Z * vector2.Z;
    //var returnDegree = Math.atan2(vector1length,vector2length) * RADIANS_TO_DEGREES;;

    return Math.acos(v1MulV2 / (vector1length * vector2length)) * RADIANS_TO_DEGREES; // Dot product
};

/*
 Matrix CLOCKWISE transformation ,
 given point(x,y) and rotation angle A, return (x',y') after transformation.
 @param:
 personLocation   -- location contains x,y,z value of a point, we are going to use x,z since
 we are dealing with 2D-dimension
 angle            -- Rotation angle
 @return:
 returnLocation   -- location after transformation
 */
exports.matrixTransformation = function (personLocation, angle, callback) {
    var returnLocation = {X: 0, Y: 0, Z: 0};
    var returnX = personLocation.X * Math.cos(angle * DEGREES_TO_RADIANS) + personLocation.Z * Math.sin(angle * DEGREES_TO_RADIANS);
    var returnZ = personLocation.Z * Math.cos(angle * DEGREES_TO_RADIANS) - (personLocation.X * Math.sin(angle * DEGREES_TO_RADIANS));
    returnLocation.X = Math.round(returnX * this.ROUND_RATIO) / this.ROUND_RATIO;
    returnLocation.Z = Math.round(returnZ * this.ROUND_RATIO) / this.ROUND_RATIO;
    if(callback != undefined){
        try{
            callback(returnLocation);
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }
    return returnLocation; // for testing
};

// Tested!
exports.normalizeAngle = function (value) {
    if (value >= 0) {
        return value % 360;
    }
    else {
        return (360 - Math.abs(value % 360)) % 360;
    }
};

// Tested!
exports.distanceBetweenPoints = function (a, b) {
    // We implemented this to handle the 2D case
    // In the Kinect coordinate space, the Y is the height axis so we are
    // only considering X and Z coordinates when finding the distance.

    // We are still passing a 3D point, however, as it will make migrating
    // to 3D easier.

    // We check whether the points are in 2D or 3D and do the
    // calculations accordingly
    //console.log('request: ' + JSON.stringify(a) + ' b: '+ JSON.stringify(b));
    if (a.Z == null) {
        return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Y - b.Y, 2));
    }
    else {
        return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Z - b.Z, 2));
    }
};

// Tested!
exports.angleBetweenPoints = function (start, end) {
    // We implemented this to handle the 2D case
    // In the Kinect coordinate space, the Y is the height axis so we are
    // only considering X and Z coordinates when finding the distance.

    // We are still passing a 3D point, however, as it will make migrating
    // to 3D easier.
    var unnormalizedDegrees = Math.atan2(end.Z - start.Z, end.X - start.X) * RADIANS_TO_DEGREES;
    return this.normalizeAngle(unnormalizedDegrees);
};

// function that check if a point is in inside of an rectangle

exports.isInRect = function(objectLocation,observerLocation,width,height,fn){
    if(objectLocation.X<=(observerLocation.X - width/2)||(objectLocation.X >=observerLocation.X+width/2)||
        (objectLocation.Z<=(observerLocation.Z - height/2)) || objectLocation.Z >= (observerLocation.Z + height/2)){
        return false;
    }else{
        //console.log("object:"+JSON.stringify(objectLocation)+" observer: "+JSON.stringify(observerLocation) + " width: "+width+" height: "+JSON.stringify(height));
        return true;
    }
};

/*
*   The observer could be a device.
*   location, height, width shall all be defined.
* */
exports.getXZProjectionFromOrientation = function(observer,callback){
    console.log("In Projection observerOrientation: "+ JSON.stringify(observer.orientation));
    // pitch as z rotation, yaw as Y rotation
    var room = locator.room;
    var observerHeight = observer.location.Y;
    var pitchRad = observer.orientation.pitch * DEGREES_TO_RADIANS;
    var projectionFromHeight = Math.tan(pitchRad)*observerHeight;

    if(observer.orientation.pitch>=0){ // if the observer is looking up
        var projectionFromHeight = Math.tan(pitchRad)*observerHeight;
        //callback(projectionFromHeight)
    }else{  // if the observer is looking down
    // TODO: Assume orientation.yaw is 0, what the vector looks like
        var initialVector = util.getVector(observer.location,{X:0,Y:0,Z:0});

        var rotatedVector = util.matrixTransformation(initialVector,observer.orientation.yaw,function(data){
            if(callback!=undefined){
                callback(data)
            }else{
                console.log("callback undefined in function util.getXZProjectionFromOrientation()");
            }
        })
        return rotatedVector;
        //callback(projectionFromHeight)
    }

}

// in 2D
exports.pointMoveToDirection = function(locationOfPoint, moveDirectionVector, distance,callback){
    util.getDistanceOfTwoLocation({X:0,Y:0,Z:0},moveDirectionVector,function(result){
        console.log(locationOfPoint);
        var ratioToDistance = result/distance;
        callback({
            X:locationOfPoint.X+ratioToDistance*moveDirectionVector.X,
            Y:locationOfPoint.Y,
            Z:locationOfPoint.Z+ratioToDistance*moveDirectionVector.Z
        });
    })
}

// Tested!
exports.getIntersectionPoint = function (line1, line2) {
    //if lines are parallel
    var isGreater = util.isGreater;
    var isLess = util.isLess;
    return calculatePossibleInt(line1,line2).then(
        function(IntersectionPoint){
            if (line1.isLineSegement) {
                if (((IntersectionPoint.X > line1.startPoint.X+tolerance) && (IntersectionPoint.X > line1.endPoint.X+tolerance)) ||
                    ((IntersectionPoint.X < line1.startPoint.X-tolerance) && (IntersectionPoint.X < line1.endPoint.X-tolerance)) ||
                    ((IntersectionPoint.Z > line1.startPoint.Z+tolerance) && (IntersectionPoint.Z > line1.endPoint.Z+tolerance)) ||
                    ((IntersectionPoint.Z < line1.startPoint.Z-tolerance) && (IntersectionPoint.Z < line1.endPoint.Z-tolerance)))
                {return Q(null)}else{return Q(IntersectionPoint)};
            }else{return Q(IntersectionPoint)}
        },function(error){console.log(error)}).
        then(function(IntersectionPoint){
            if (line2.isLineSegment) {
                if (((IntersectionPoint.X > line2.startPoint.X+tolerance) && (IntersectionPoint.X > line2.endPoint.X+tolerance)) ||
                    ((IntersectionPoint.X < line2.startPoint.X-tolerance) && (IntersectionPoint.X < line2.endPoint.X-tolerance)) ||
                    ((IntersectionPoint.Z > line2.startPoint.Z+tolerance) && (IntersectionPoint.Z > line2.endPoint.Z+tolerance)) ||
                    ((IntersectionPoint.Z < line2.startPoint.Z-tolerance) && (IntersectionPoint.Z < line2.endPoint.Z-tolerance)))
                {return Q(null)}else {return Q(IntersectionPoint)}}
            else {return Q(IntersectionPoint)}
        },function(error){console.log(error)})

};

function calculatePossibleInt(line1,line2){
    var IntersectionPoint = null;
    if (line1.isVerticalLine && line2.isVerticalLine || line1.slope == line2.slope)
        return null;
    else if (line1.isVerticalLine) {
        var yValue = line2.slope * line1.x + line2.zIntercept;
        IntersectionPoint = factory.make2DPoint(line1.x, yValue);
    }
    else if (line2.isVerticalLine) {
        var yValue = line1.slope * line2.x + line1.zIntercept;
        IntersectionPoint = factory.make2DPoint(line2.x, yValue);
    }
    else {
        var xValue = (line2.zIntercept - line1.zIntercept) / (line1.slope - line2.slope);
        var yValue = 0;
        //console.log(line2.zIntercept + " - " + line1.zIntercept + ' / ' + line1.slope + ' - ' + line2.slope );
        //console.log(" Y: " + yValue + "pitch: "+ );
        var zValue = line1.slope * xValue + line1.zIntercept;
        IntersectionPoint = {X:xValue,Y: yValue,Z:zValue};
    }
    return Q(IntersectionPoint);
}
// Tested!
exports.isGreater = function (num1, num2) {
    var answer = num1 - num2;
    answer = Math.round(answer * 1000) / 1000;
    //console.log("answer:  " + answer);
    if (answer > 0) {
        return true;
    }
    return false;
};

// Tested!
exports.isLess = function (num1, num2) {
    var answer = num1 - num2;
    answer = Math.round(answer * 1000) / 1000;
    if (answer < 0) {
        return true;
    }
    return false;
};

// Tested!
exports.getLinesOfShape = function (device) {
    var returnLines = [];
    var corners = this.getCornersOfShape(device);
    //onsole.log("corners -> "+ JSON.stringify(corners));
    try {
        var topSide = factory.makeLineUsingPoints(corners[0], corners[1]);
        var rightSide = factory.makeLineUsingPoints(corners[1], corners[2]);
        var bottomSide = factory.makeLineUsingPoints(corners[2], corners[3]);
        var leftSide = factory.makeLineUsingPoints(corners[3], corners[0]);

        returnLines.push(topSide);
        returnLines.push(rightSide);
        returnLines.push(bottomSide);
        returnLines.push(leftSide);

        //console.log(returnLines[0].startPoint);
        return returnLines;
    }

    catch (err) {
        // Device does not have a location
        // This will return an empty list
        // console.log('Device must have a location');
        return returnLines;
    }


};

/*
    get the orientation of a person based on X value of the person
    @param:
            personX         -- X position of the person
            personZ         -- Z position of the person
    @return:
            returnDegree    -- degree value of orientation (+/- KINECT_VIEW_RANGE)
*/
exports.getObjectOrientationToSensor = function (personX, personZ,callback) {
    var angleTowardsKinect = Math.atan2(personX, personZ);
    var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
    if(callback != undefined){
        try{
            callback(returnDegree);
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }
    return returnDegree;
};

/*
*   Translate Orientation of a device to a reference space
* */
exports.translateOrientationToReference = function(device,callback){
    if(device!=undefined) {
        this.getObjectOrientationToSensor(device.location.X,device.location.Z,function(orientationToSensor){
            //console.log('Get orientation to Kinect: '+ (orientationToSensor+device.orientation));
            if(callback != undefined){
                try{
                    callback(-(90+(orientationToSensor+device.orientation.yaw)));
                }catch(e){
                    console.log(' error in callback: '+ e);
                }
            }else{
                //callback is empty
            }
        });
    }else{
        console.log('orientation is not defined in translateOrietationToReference');
    }
};
/*
 get Distance from person to kinect
 @param:
        personX         -- X position of the person
        personZ         -- Z position of the person
 @return:
        returnDistance    -- Distance value of orientation
 */
exports.getDistanceToKinect = function (personX, personZ) {
    var returnDistance = Math.sqrt(personX * personX + personZ * personZ);
    return returnDistance;
};

/*
* Get a observerLocation of a object with orientation and observer (such as device objects)
* */
exports.getObserverLocation = function(objectWithObserver){
    var actualOrientation = 360 - (objectWithObserver.orientation.yaw + util.getObjectOrientationToSensor(objectWithObserver.location.X,objectWithObserver.location.Z) + 90+ objectWithObserver.FOV/2);
    var rotatedDirection = util.matrixTransformation({X:objectWithObserver.observer.observerDistance,Y:0,Z:0},-(actualOrientation+objectWithObserver.FOV/2));
    var observerLocation = {X:rotatedDirection.X+objectWithObserver.location.X,Y:rotatedDirection.Y+objectWithObserver.location.Y,Z:rotatedDirection.Z+objectWithObserver.location.Z};
    return observerLocation;
}


// Tested!
exports.getCornersOfShape = function (device,callback) {
    var returnPoints = [];
    var intPoints = [];
    try {
        var deviceLocation = device.location;

        intPoints.push(factory.make2DPoint(deviceLocation.X + device.width / 2, deviceLocation.Z + device.depth / 2));
        intPoints.push(factory.make2DPoint(deviceLocation.X + device.width / 2, deviceLocation.Z - device.depth / 2));
        intPoints.push(factory.make2DPoint(deviceLocation.X - device.width / 2, deviceLocation.Z - device.depth / 2));
        intPoints.push(factory.make2DPoint(deviceLocation.X - device.width / 2, deviceLocation.Z + device.depth / 2));
    }
    catch (err) {
        // Device does not have a location
        // This will return an empty list
        // console.log('Error: Device must have a location!');
        return returnPoints;
    }

    var angle = 0;

    if (device.orientation != null) {
        // This will help when we consider sending to moving devices that change its
        // orientation dynamically. The choice of 270 is for consistency with the
        // current code that handles the special case of a tabletop facing away
        // from the kinect
        angle = device.orientation - 90;
        angle = angle * DEGREES_TO_RADIANS;
    }

    else {
        // No changes necessary
        return intPoints;
    }

    /*intPoints.forEach(function (point) {
        var xValue = (point.X - deviceLocation.X) * Math.cos(angle) - (point.Y - deviceLocation.Z) * Math.sin(angle) + deviceLocation.X;
        var yValue = (point.Y - deviceLocation.Z) * Math.cos(angle) + (point.X - deviceLocation.X) * Math.sin(angle) + deviceLocation.Z;
        var newPoint = factory.make2DPoint(xValue, yValue);
        returnPoints.push(newPoint);
    });*/
    returnPoints = intPoints;
    //console.log("points -> "+ JSON.stringify(intPoints));

    if(callback != undefined){
        try{
            callback(returnPoints);
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }

    return returnPoints;
};

/**/
exports.intersectionOnDevice = function(intersection,corners){
    return Q(corners);
}

// Tested!
exports.GetRatioPositionOnScreen = function (target, intersection,callback) {
    var cornersOfShape = this.getCornersOfShape(locator.devices[target]);
    if (cornersOfShape.length < 1) {
        // Device does not have a location
        return factory.make2DPoint(-1, -1);
    }
    //console.log(intersection)
    var distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[0]);
    var distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[1]);
    var distance3 = this.distanceBetweenPoints(cornersOfShape[0], cornersOfShape[1]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var xRatio = 1;
        var yRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }

    distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[2]);
    distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[1]);
    distance3 = this.distanceBetweenPoints(cornersOfShape[1], cornersOfShape[2]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var yRatio = 1;
        var xRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }

    distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[3]);
    distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[2]);
    distance3 = this.distanceBetweenPoints(cornersOfShape[2], cornersOfShape[3]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var xRatio = 0;
        var yRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }

    distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[3]);
    distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[0]);
    distance3 = this.distanceBetweenPoints(cornersOfShape[3], cornersOfShape[0]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var yRatio = 0;
        var xRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }
    return factory.make2DPoint(-1, -1);
};

// TODO: implement!
// TODO: test!
exports.translateFromCoordinateSpace = function () {
    // TODO: implement!
    // Leave until we have multiple Kinects. Otherwise, use the Kinect coordinate space
    // We will probably need this but we might need to re-implement it in a different way
};

exports.findWithAttr = function (array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
};

exports.findWithAttrWeak = function (array, attr, query) {
    for (var i = 0; i < array.length; i += 1) {
        if (JSON.stringify(array[i][attr]).indexOf(JSON.stringify(query)) != -1) {
            return i;
            //console.log("returned: ");
        }
    }
};


exports.findKeyWithAttr = function(obj,value){
	if(typeof(obj) == "object"){
		for(var key in obj){
			//console.log('actually finding the key!!!!!!!!!!!!');
			if(obj[key] == value){
				return key;
			}
		}
		return null;
	}else{
		console.log("can not search through non object");
		return null;
	}
}
exports.getDeviceSocketIDByID = function (ID) {
    var counter = Object.keys(locator.devices).length;

    for (var key in locator.devices) {
        counter--;
        if (locator.devices.hasOwnProperty(key)) {
            if (ID == locator.devices[key].uniqueDeviceID) {
                return key;
            }
            else {
                if (counter == 0) {
                    return undefined;
                }
            }
        }
    }
};

exports.filterDevices = function(socket, request){
    //console.log('request-> '+ JSON.stringify(request) );
    if(request.selection == undefined || request.selection == null || request.selection[0] == undefined || request.selection[0] == null){
        return(locator.devices)
    }
    else{
        var filterSelection = function (i, listDevices) {
            //console.log(i);
            if (i <= (request.selection.length - 1)) {
                var regex = /([a-zA-Z ]+)([0-9\.]*).*?$/
                var result = request.selection[i].match(regex);
                var selectionType = result[1];
                var selectionParam = result[2];
                //console.log("filter #" + i + ": " + request.selection[i])
                //console.log(listDevices);
                switch (selectionType) {
                    case "all":
                        return filterSelection(i + 1, (listDevices)); //just in case
                        break;
                    case "allExclusive":
                        return filterSelection(i + 1, (locator.getAllDevicesExceptSelf(socket, listDevices)));
                        break;
                    case "inView":
                        return filterSelection(i + 1, locator.getDevicesInView(socket.id, listDevices));// locator.calcIntersectionPointsForDevices(socket.id, locator.getDevicesInFront(socket.id, listDevices)));
                        break;
                    case "paired":
                        return filterSelection(i + 1, locator.getPairedDevice(listDevices));
                        break;
                    case "inRange":
                        //return filterSelection(i+1, locator.getDevicesWithinRange(locator.devices[socket.id], listDevices));
                        return filterSelection(i + 1, locator.getDevicesWithinRange(locator.devices[socket.id], selectionParam, listDevices));
                        break;
                    case "nearest":
                        return filterSelection(i + 1, locator.getNearestDevice(locator.devices[socket.id], listDevices));
                        break;
                    case "single":
                        return filterSelection(i + 1, locator.getDeviceByID(selectionParam));
                        break;
                    default:
                        return filterSelection(i + 1, (listDevices)); //just in case
                }
            }
            else {
                return(listDevices);
            }
        }
        return (filterSelection(0, locator.devices));
    }
}

//delete related key item in a list and its sublist
exports.recursiveDeleteKey = function(list,keyForDelete){
    //console.log("Looking for "+keyForDelete + "");
    for(var key in list){
        //console.log(key);
        for(var subListKey in list[key]){
            if(subListKey == keyForDelete){
                console.log("deleted -> "+subListKey+" from "+key +" list");
                delete list[key][subListKey];
                return Q(key);
            }
        }
    }
}


/*
*   Handles the callbacks of SOD
* */
exports.callbackHandler= function(callback){
    if(callback != undefined){
        try{
            callback();
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }
}

exports.getNearest = function(subject,objectList,functionCallback){
    var nearestDistance = 1000,nearestObject = null;
    // use async.each handle callback after everything is done.
    async.eachSeries(Object.keys(objectList),function(index,itrCallback){
        //console.log(index);
        //console.log("\t"+JSON.stringify(subject)+"\n\t"+ JSON.stringify(objectList[index]));
        util.getDistanceOfTwoLocation(subject.location,objectList[index].location,function(distance){
            if(distance<nearestDistance){
                nearestDistance = distance;
                nearestObject = objectList[index];
                itrCallback();
            }else{
                itrCallback();
            }

        })
    },function(err){
        // if any of the file processing produced an error, err would equal that error
        if( err ) {
            // One of the iterations produced an error.
            // All processing will now stop.
            console.log('A person failed to process');
        } else {
            console.log('All persons were processed successfully');
            functionCallback({nearestObject: nearestObject,distance:nearestDistance});
        }
    })
}

exports.getDistanceOfTwoLocation = function(location1,location2,callback){
    if(location1.X!=undefined && location2.Z!= undefined) {
        callback(Math.sqrt(
                (location1.X - location2.X) * (location1.X - location2.X)
                +
                (location1.Z - location2.Z) * (location1.Z - location2.Z))
        );
    }else{
        console.log("   *Distance is not defined");
        callback(null);
    }
}

