var factory = require('./factory');

var DEFAULT_FIELD_OF_VIEW = 25.0;
var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;


exports.normalizeAngle = function(value){
	if(value >= 0){
		return value % 360;
	}
	else{
		return (360 - Math.Abs(doublevalue % 360)) % 360;
	}
}

// TODO: implement!
exports.translateFromCoordinateSpace = function(){
	// TODO: implement!
	// Leave until we have multiple Kinects. Otherwise, use the Kinect coordinate space
	// We will probably need this but we might need to re-implement it in a different way
}

exports.distanceBetweenPoints = function(a,b){
	return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Y - b.Y, 2) + Math.pow(a.Z - b.Z, 2));
}

exports.angleBetweenPoints = function(start, end){
	// TODO: implement!
	// We will probably need this but we might need to re-implement it in a different way
	var unnormalizedDegrees = Math.atan2(end.Z - start.Z, end.X - start.X) * RADIANS_TO_DEGREES;
	return NormalizeAngle(unnormalizedDegrees);
}

// TODO: implement!
exports.getLinesOfDevice = function(device){
	// TODO: implement!
	// var returnLines = [];
	// List<Point> corners = getCornersOfShape(device);

	// Line topSide = new Line(corners[0], corners[1]);
	// Line rightSide = new Line(corners[1], corners[2]);
	// Line bottomSide = new Line(corners[2], corners[3]);
	// Line leftSide = new Line(corners[3], corners[0]);

	// returnLines.Add(topSide);
	// returnLines.Add(rightSide);
	// returnLines.Add(bottomSide);
	// returnLines.Add(leftSide);

	// return returnLines;
}

// TODO: implement!
exports.getCornersOfShape = function(device){
	// TODO: implement!
	// List<Point> returnPoints = new List<Point>();
	// List<Point> intPoints = new List<Point>();
	// Point deviceLocation = device.Location.Value;

	// intPoints.Add(new Point((double)(deviceLocation.X + device.Width / 2), (double)(deviceLocation.Y + device.Height / 2)));
	// intPoints.Add(new Point((double)(deviceLocation.X + device.Width / 2), (double)(deviceLocation.Y - device.Height / 2)));
	// intPoints.Add(new Point((double)(deviceLocation.X - device.Width / 2), (double)(deviceLocation.Y - device.Height / 2)));
	// intPoints.Add(new Point((double)(deviceLocation.X - device.Width / 2), (double)(deviceLocation.Y + device.Height / 2)));

	// double angle;
	// // Check if the device's orientation is not null
	// if (device.Orientation != null)
	// {
		// // This will help when we consider sending to moving devices that change its 
		// // orientation dynamically. The choice of 270 is for consistency with the 
		// // current code that handles the special case of a tabletop facing away 
		// // from the kinect
		// angle = ((Double)device.Orientation - 90);
		// angle = angle * Math.PI / 180;
	// }

	// else
	// {
		// // No changes neccessary
		// return intPoints;
	// }

	// foreach (Point point in intPoints)
	// {
		// double xValue = (point.X - deviceLocation.X) * Math.Cos(angle) - (point.Y - deviceLocation.Y) * Math.Sin(angle) + deviceLocation.X;
		// double yValue = (point.Y - deviceLocation.Y) * Math.Cos(angle) + (point.X - deviceLocation.X) * Math.Sin(angle) + deviceLocation.Y;

		// Point newPoint = new Point(xValue, yValue);
		// returnPoints.Add(newPoint);
	// }

	// return returnPoints;
}

// TODO: implement!
exports.GetRatioPositionOnScreen = function(target, intersection){
	// TODO: implement!
	// List<Point> cornersOfShape = getCornersOfShape(target);

	// Double distance1 = Line.getDistanceBetweenPoints(intersection,cornersOfShape[0]);
	// Double distance2 = Line.getDistanceBetweenPoints(intersection,cornersOfShape[1]);
	// Double distance3 = Line.getDistanceBetweenPoints(cornersOfShape[0],cornersOfShape[1]);
	// if (Math.Abs(distance3 - (distance1 + distance2)) < 0.01)
	// {
		// Double xRatio = 1;
		// Double yRatio = distance1 / distance3;
		// //Double xRatio = distance1 / distance3;
		// //Double yRatio = 0;
		// return new Point(xRatio, yRatio);
	// }

	// distance1 = Line.getDistanceBetweenPoints(intersection, cornersOfShape[2]);
	// distance2 = Line.getDistanceBetweenPoints(intersection, cornersOfShape[1]);
	// distance3 = Line.getDistanceBetweenPoints(cornersOfShape[1], cornersOfShape[2]);
	// if (Math.Abs(distance3 - (distance1 + distance2)) < 0.01)
	// {
		// Double yRatio = 1;
		// Double xRatio = distance1 / distance3;
		// //Double xRatio = 1;
		// //Double yRatio = distance2 / distance3;
		// return new Point(xRatio, yRatio);
	// }

	// distance1 = Line.getDistanceBetweenPoints(intersection, cornersOfShape[3]);
	// distance2 = Line.getDistanceBetweenPoints(intersection, cornersOfShape[2]);
	// distance3 = Line.getDistanceBetweenPoints(cornersOfShape[2], cornersOfShape[3]);
	// if (Math.Abs(distance3 - (distance1 + distance2)) < 0.01)
	// {
		// Double xRatio = 0;
		// Double yRatio = distance1 / distance3;
		// //Double xRatio = distance1 / distance3;
		// //Double yRatio = 1;
		// return new Point(xRatio, yRatio);
	// }

	// distance1 = Line.getDistanceBetweenPoints(intersection, cornersOfShape[3]);
	// distance2 = Line.getDistanceBetweenPoints(intersection, cornersOfShape[0]);
	// distance3 = Line.getDistanceBetweenPoints(cornersOfShape[3], cornersOfShape[0]);
	// if (Math.Abs(distance3 - (distance1 + distance2)) < 0.01)
	// {
		// Double yRatio = 0;
		// Double xRatio = distance1 / distance3;
		// //Double xRatio = 0;
		// //Double yRatio = distance2 / distance3;
		// return new Point(xRatio, yRatio);
	// }

	// return new Point(-1, -1);
}

exports.getIntersectionPoint = function(line1, line2){
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

exports.isGreater = function(num1, num2){
	var answer = num1 - num2;
	answer = Math.round(answer*1000)/1000;
	if (answer > 0) { return true; }
	return false;
}

exports.isLess = function(num1, num2){
	var answer = num1 - num2;
	answer = Math.round(answer*1000)/1000;
	if (answer < 0) { return true; }
	return false;
}