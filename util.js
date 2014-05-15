var factory = require('./factory');

exports.DEFAULT_FIELD_OF_VIEW = 25.0;
exports.KINECT_VIEW_RANGE = 28.5;               // not being used yet
var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
//var KINECT_X_MAX = 1;

// Tested!
exports.normalizeAngle = function(value){
	if(value >= 0){
		return value % 360;
	}
	else{
		return (360 - Math.abs(value % 360)) % 360;
	}
}

// Tested!
exports.distanceBetweenPoints = function(a,b){
	// We implemented this to handle the 2D case
	// In the Kinect coordinate space, the Y is the height axis so we are 
	// only considering X and Z coordinates when finding the distance.
	
	// We are still passing a 3D point, however, as it will make migrating 
	// to 3D easier.
	
	// We check whether the points are in 2D or 3D and do the 
	// calculations accordingly
	if(a.Z == null){
		return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Y - b.Y, 2));
	}
	else{
		return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Z - b.Z, 2));
	}
}

// Tested!
exports.angleBetweenPoints = function(start, end){
	// We implemented this to handle the 2D case
	// In the Kinect coordinate space, the Y is the height axis so we are 
	// only considering X and Z coordinates when finding the distance.
	
	// We are still passing a 3D point, however, as it will make migrating 
	// to 3D easier.
	var unnormalizedDegrees = Math.atan2(end.Z - start.Z, end.X - start.X) * RADIANS_TO_DEGREES;
	return this.normalizeAngle(unnormalizedDegrees);
}

// Tested!
exports.getIntersectionPoint = function(line1, line2){
	var IntersectionPoint = null;
            
	//if lines are parallel
	if (line1.isVerticalLine && line2.isVerticalLine || line1.slope == line2.slope)
		return null;
	else if (line1.isVerticalLine)
	{
		var yValue = line2.slope * line1.x + line2.zIntercept;
		IntersectionPoint = factory.make2DPoint(line1.x, yValue);
	}
	else if (line2.isVerticalLine)
	{
		var yValue = line1.slope * line2.x + line1.zIntercept;
		IntersectionPoint = factory.make2DPoint(line2.x, yValue);
	}
	else
	{
		var xValue = (line2.zIntercept - line1.zIntercept) / (line1.slope - line2.slope);
		var yValue = line1.slope * xValue + line1.zIntercept;
		IntersectionPoint = factory.make2DPoint(xValue, yValue);
	}

	if (line1.isLineSegement)
	{
		if(isGreater(IntersectionPoint.X, line1.startPoint.X) && isGreater(IntersectionPoint.X, line1.endPoint.X) ||
			isLess(IntersectionPoint.X, line1.startPoint.X) && isLess(IntersectionPoint.X, line1.endPoint.X) ||
			isGreater(IntersectionPoint.Y, line1.startPoint.Z) && isGreater(IntersectionPoint.Y, line1.endPoint.Z) ||
			isLess(IntersectionPoint.Y, line1.startPoint.Z) && isLess(IntersectionPoint.Y, line1.endPoint.Z))
			return null;
	}
	
	if (line2.isLineSegement)
	{
		if (isGreater(IntersectionPoint.X, line2.startPoint.X) && isGreater(IntersectionPoint.X, line2.endPoint.X) ||
			isLess(IntersectionPoint.X, line2.startPoint.X) && isLess(IntersectionPoint.X, line2.endPoint.X) ||
			isGreater(IntersectionPoint.Y, line2.startPoint.Z) && isGreater(IntersectionPoint.Y, line2.endPoint.Z) ||
			isLess(IntersectionPoint.Y, line2.startPoint.Z) && isLess(IntersectionPoint.Y, line2.endPoint.Z))
			return null;
	}
	 
	return IntersectionPoint;
}

// Tested!
exports.isGreater = function(num1, num2){
	var answer = num1 - num2;
	answer = Math.round(answer*1000)/1000;
	if (answer > 0) { return true; }
	return false;
}

// Tested!
exports.isLess = function(num1, num2){
	var answer = num1 - num2;
	answer = Math.round(answer*1000)/1000;
	if (answer < 0) { return true; }
	return false;
}

// Tested!
exports.getLinesOfShape = function(device){
	var returnLines = [];
	var corners = this.getCornersOfShape(device);

	try{
		var topSide = factory.makeLineUsingPoints(corners[0], corners[1]);
		var rightSide = factory.makeLineUsingPoints(corners[1], corners[2]);
		var bottomSide = factory.makeLineUsingPoints(corners[2], corners[3]);
		var leftSide = factory.makeLineUsingPoints(corners[3], corners[0]);
	
		returnLines.push(topSide);
		returnLines.push(rightSide);
		returnLines.push(bottomSide);
		returnLines.push(leftSide);		
		
		return returnLines;
	}
	
	catch(err){
		// Device does not have a location
		// This will return an empty list
		// console.log('Device must have a location');
		return returnLines;
	}

	
}

/*
    get the orientation of a person based on X value of the person
    @param:
            personX         -- X position of the person
            personZ         -- Z position of the person
    @return:
            returnDegree    -- degree value of orientation (+/- KINECT_VIEW_RANGE)
*/
exports.getPersonOrientation = function(personX,personZ){
    var angleTowardsKinect = Math.atan2(personX,personZ);
    var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
    /*  Based on the assumption of X is not in meters
    var XtoZ_ratio = Math.tan(KINECT_VIEW_RANGE*DEGREES_TO_RADIANS);
    var Z = KINECT_X_MAX/XtoZ_ratio;
    var angleTowardsKinect = Math.atan(personX/Z);                    // get the radiance of the person orientation
    var returnDegree = angleTowardsKinect*RADIANS_TO_DEGREES;               // return degree for testing
    */
    return returnDegree;
}


/*
 get Distance from person to kinect
 @param:
        personX         -- X position of the person
        personZ         -- Z position of the person
 @return:
        returnDistance    -- Distance value of orientation
 */
exports.getDistanceToKinect = function(personX,personZ){
    var returnDistance = Math.sqrt(personX*personX+personZ*personZ);
    return returnDistance;
}


// Tested!
exports.getCornersOfShape = function(device){
	var returnPoints = [];
	var intPoints = [];
	try{
		var deviceLocation = device.Location;
		
		intPoints.push(factory.make2DPoint(deviceLocation.X + device.Width / 2, deviceLocation.Z + device.Height / 2));
		intPoints.push(factory.make2DPoint(deviceLocation.X + device.Width / 2, deviceLocation.Z - device.Height / 2));
		intPoints.push(factory.make2DPoint(deviceLocation.X - device.Width / 2, deviceLocation.Z - device.Height / 2));
		intPoints.push(factory.make2DPoint(deviceLocation.X - device.Width / 2, deviceLocation.Z + device.Height / 2));
	}
	catch(err){
		// Device does not have a location
		// This will return an empty list
		// console.log('Error: Device must have a location!');
		return returnPoints;
	}

	var angle = 0; 
	
	if(device.Orientation != null){
		// This will help when we consider sending to moving devices that change its 
		// orientation dynamically. The choice of 270 is for consistency with the 
		// current code that handles the special case of a tabletop facing away 
		// from the kinect
		angle = device.Orientation - 90;
		angle = angle * DEGREES_TO_RADIANS;		
	}
	
	else
	{
		// No changes neccessary
		return intPoints;
	}	

	intPoints.forEach(function(point){
		var xValue = (point.X - deviceLocation.X) * Math.cos(angle) - (point.Y - deviceLocation.Z) * Math.sin(angle) + deviceLocation.X;
		var yValue = (point.Y - deviceLocation.Z) * Math.cos(angle) + (point.X - deviceLocation.X) * Math.sin(angle) + deviceLocation.Z;

		var newPoint = factory.make2DPoint(xValue, yValue);
		returnPoints.push(newPoint);		
	});
	
	return returnPoints;
}

// Tested!
exports.GetRatioPositionOnScreen = function(target, intersection){
	var cornersOfShape = this.getCornersOfShape(target);
	if(cornersOfShape.length <1){
		// Device does not have a location
		return factory.make2DPoint(-1, -1);
	}
	var distance1 = this.distanceBetweenPoints(intersection,cornersOfShape[0]);
	var distance2 = this.distanceBetweenPoints(intersection,cornersOfShape[1]);
	var distance3 = this.distanceBetweenPoints(cornersOfShape[0],cornersOfShape[1]);
	if (Math.abs(distance3 - (distance1 + distance2)) < 0.01)
	{
		var xRatio = 1;
		var yRatio = distance1 / distance3;
		return factory.make2DPoint(xRatio, yRatio);
	}

	distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[2]);
	distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[1]);
	distance3 = this.distanceBetweenPoints(cornersOfShape[1], cornersOfShape[2]);
	if (Math.abs(distance3 - (distance1 + distance2)) < 0.01)
	{
		var yRatio = 1;
		var xRatio = distance1 / distance3;
		return factory.make2DPoint(xRatio, yRatio);
	}

	distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[3]);
	distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[2]);
	distance3 = this.distanceBetweenPoints(cornersOfShape[2], cornersOfShape[3]);
	if (Math.abs(distance3 - (distance1 + distance2)) < 0.01)
	{
		var xRatio = 0;
		var yRatio = distance1 / distance3;
		return factory.make2DPoint(xRatio, yRatio);
	}

	distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[3]);
	distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[0]);
	distance3 = this.distanceBetweenPoints(cornersOfShape[3], cornersOfShape[0]);
	if (Math.abs(distance3 - (distance1 + distance2)) < 0.01)
	{
		var yRatio = 0;
		var xRatio = distance1 / distance3;
		return factory.make2DPoint(xRatio, yRatio);		
	}

	return factory.make2DPoint(-1, -1);
}

// TODO: implement!
// TODO: test!
exports.translateFromCoordinateSpace = function(){
	// TODO: implement!
	// Leave until we have multiple Kinects. Otherwise, use the Kinect coordinate space
	// We will probably need this but we might need to re-implement it in a different way
}

exports.findWithAttr = function(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
}