var factory = require('./factory');

exports.DEFAULT_FIELD_OF_VIEW = 25.0;
exports.KINECT_VIEW_RANGE = 28.5;               // not being used yet
exports.ROUND_RATIO         = 1000000000;         // the round ratio for dealing with not accurate calculation

var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;


/*
    take a location from sub-kinect and translate to the location to the MASTER kinect
@param:
    location        -- the location of a point from the sub-kinect
    translateRules  -- the rules each sub-kinect has for translate the points in its plane to the MASTER-kinect
@return:
    rotatedPoint    -- the translated location of point in the subKinect to the MASTER kinect
*/
exports.translateToCoordinateSpace = function(location,translateRules)
{
    var vectorToStartingPoint = this.getVector(translateRules.startingLocation,location);
    var rotatedPoint = this.matrixTransformation(vectorToStartingPoint,translateRules.degree);
    rotatedPoint.X += translateRules.xDistance+translateRules.startingLocation.X;
    rotatedPoint.Z += translateRules.zDistance+translateRules.startingLocation.Z;
    return rotatedPoint;
}


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
exports. getTranslationRule= function(startingLocation1,endingLocation1,startingLocation2,endingLocation2){
    var vector1 = this.getVector(startingLocation1,endingLocation1);
    var vector2 = this.getVector(startingLocation2,endingLocation2);
    var degreeBetweenVectors = this.getDegreeOfTwoVectors(vector1,vector2); // using dot product
    var translateRules = {degree:0,xDistance: 0,zDistance: 0,
        startingLocation:startingLocation2};                                //initialize translation rules

    var xDistance = startingLocation1.X - startingLocation2.X;
    var zDistance = startingLocation1.Z - startingLocation2.Z;
    translateRules.xDistance = xDistance;
    translateRules.zDistance = zDistance;

    // Since dot product algorithm doesn't indicate whether the angle is clockwise or counter-clockwise, we need to check
    var rotatedVector2 = this.matrixTransformation(vector2,degreeBetweenVectors);               // clockwise
    var counterRotatedVector2 = this.matrixTransformation(vector2,-degreeBetweenVectors);       // counter clockwise
    if(Math.abs(rotatedVector2.X - vector1.X) < (1/this.ROUND_RATIO) && Math.abs(rotatedVector2.Z - vector1.Z) < this.ROUND_RATIO)
    {
        translateRules.degree = degreeBetweenVectors;  // represetn the degree of two sensor
    }
    else if(Math.abs(counterRotatedVector2.X - vector1.X) < (1/this.ROUND_RATIO) && Math.abs(counterRotatedVector2.Z - vector1.Z) < this.ROUND_RATIO)
    {
        translateRules.degree =  -degreeBetweenVectors;
    }else
    {
        translateRules.degree = NaN;
    }

    return translateRules;  // different sensors should have their own rules

}




/*
    get the vector from two points, since we are dealing with 2D space we only care about X and Z value of a location
 @param:
    locationA         -- the location of the starting point
    locationB         -- the location of the ending point
 @return:
    returnVector      -- return the vector of the two points
 */
exports.getVector = function(locationA,locationB){
    var returnVector = {X:0,Y:0,Z:0};
    returnVector.X = locationB.X - locationA.X;
    returnVector.Z = locationB.Z - locationA.Z;
    return returnVector;
}


/*
    use dot product to calculate the degree between two vectors
 @param:
    vector1             -- first vector
    vector2             -- second vector
 @return:
    returnDegrees       -- The degree between two vectors
 */
exports.getDegreeOfTwoVectors = function(vector1,vector2){
    var vector1length = Math.sqrt(Math.pow(vector1.X,2) + Math.pow(vector1.Z,2));
    var vector2length = Math.sqrt(Math.pow(vector2.X,2) + Math.pow(vector2.Z,2));
    var v1MulV2 = vector1.X* vector2.X + vector1.Z*vector2.Z;
    var returnDegree = Math.acos(v1MulV2/(vector1length*vector2length)) * RADIANS_TO_DEGREES; // Dot product
    //var returnDegree = Math.atan2(vector1length,vector2length) * RADIANS_TO_DEGREES;;

    if(isNaN(returnDegree))
    {
        /*var negativeVector2 = {X:(-vector2.X),Y:0,Z:(-vector2.Z)};
         v1MulV2 = vector1.X* negativeVector2.X + vector1.Z*negativeVector2.Z;
         returnDegree = Math.acos(v1MulV2/(vector1length*vector2length))
         * RADIANS_TO_DEGREES; // Dot product */
        return 0;
    }

    return returnDegree;
}

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
exports.matrixTransformation = function(personLocation,angle){
    var returnLocation = {X:0,Y:0,Z:0};
    var returnX = personLocation.X * Math.cos(angle * DEGREES_TO_RADIANS) + personLocation.Z * Math.sin(angle * DEGREES_TO_RADIANS);
    var returnZ = personLocation.Z * Math.cos(angle * DEGREES_TO_RADIANS) - (personLocation.X * Math.sin(angle * DEGREES_TO_RADIANS));
    returnLocation.X = Math.round(returnX*this.ROUND_RATIO)/this.ROUND_RATIO;
    returnLocation.Z = Math.round(returnZ*this.ROUND_RATIO)/this.ROUND_RATIO;
    return returnLocation; // for testing
}



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
		// No changes necessary
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

exports.findWithAttrWeak = function(array, attr, query) {
    for(var i = 0; i < array.length; i += 1) {
        console.log("looking through: " + JSON.stringify(array[i][attr]));
        console.log("with: " + JSON.stringify(query))
        //console.log(array[i][attr])
        if(JSON.stringify(array[i][attr]).indexOf(JSON.stringify(query)) != -1) {
            return i;
            console.log("returned: ");
        }
    }
}