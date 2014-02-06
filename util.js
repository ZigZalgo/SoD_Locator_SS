var factory = require('./factory');

var DEFAULT_FIELD_OF_VIEW = 25.0;
var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;


exports.normalizeAngle(value){
	if(value >= 0){
		return value % 360;
	}
	else{
		return (360 - Math.Abs(doublevalue % 360)) % 360;
	}
}

exports.translateFromCoordinateSpace(){
	// TODO: implement!
	// Leave until we have multiple Kinects. Otherwise, use the Kinect coordinate space
	// We will probably need this but we might need to re-implement it in a different way
}

exports.distanceBetweenPoints(a,b){
	return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Y - b.Y, 2) + Math.pow(a.Z - b.Z, 2));
}

exports.angleBetweenPoints(start, end){
	// TODO: implement!
	// We will probably need this but we might need to re-implement it in a different way
	var unnormalizedDegrees = Math.atan2(end.Z - start.Z, end.X - start.X) * RADIANS_TO_DEGREES;
	return NormalizeAngle(unnormalizedDegrees);
}

exports.getLinesOfDevice(device){

}

exports.getIntersectionPoint(line1, line2){
	var IntersectionPoint = null;
            
	//if lines are parallel
	if (line1.isVerticalLine && line2.isVerticalLine || line1.slope == line2.slope)
		return null;
	else if (line1.isVerticalLine)
	{
		var yValue = line2.slope * line1.x + line2.yIntercept;
		IntersectionPoint = factory.make2DPoint(line1.x, yValue);
	}
	else if (line2.isVerticalLine)
	{
		var yValue = line1.slope * line2.x + line1.yIntercept;
		IntersectionPoint = factory.make2DPoint(line2.x, yValue);
	}
	else
	{
		var xValue = (line2.yIntercept - line1.yIntercept) / (line1.slope - line2.slope);
		var yValue = line1.slope * xValue + line1.yIntercept;
		IntersectionPoint = factory.make2DPoint(xValue, yValue);
	}

	if (line1.isLineSegement)
	{
		if(isGreater(IntersectionPoint.X, line1.startPoint.X) && isGreater(IntersectionPoint.X, line1.endPoint.X) ||
			isLess(IntersectionPoint.X, line1.startPoint.X) && isLess(IntersectionPoint.X, line1.endPoint.X) ||
			isGreater(IntersectionPoint.Y, line1.startPoint.Y) && isGreater(IntersectionPoint.Y, line1.endPoint.Y) ||
			isLess(IntersectionPoint.Y, line1.startPoint.Y) && isLess(IntersectionPoint.Y, line1.endPoint.Y))
			return null;
	}
	
	if (line2.isLineSegement)
	{
		if (isGreater(IntersectionPoint.X, line2.startPoint.X) && isGreater(IntersectionPoint.X, line2.endPoint.X) ||
			isLess(IntersectionPoint.X, line2.startPoint.X) && isLess(IntersectionPoint.X, line2.endPoint.X) ||
			isGreater(IntersectionPoint.Y, line2.startPoint.Y) && isGreater(IntersectionPoint.Y, line2.endPoint.Y) ||
			isLess(IntersectionPoint.Y, line2.startPoint.Y) && isLess(IntersectionPoint.Y, line2.endPoint.Y))
			return null;
	}
	 
	return IntersectionPoint;
}

function isGreater(num1, num2){
	var answer = num1 - num2;
	answer = Math.round(answer*1000)/1000;
	if (answer > 0) { return true; }
	return false;
}

function isLess(num1, num2){
	var answer = num1 - num2;
	answer = Math.round(answer*1000)/1000;
	if (answer < 0) { return true; }
	return false;
}