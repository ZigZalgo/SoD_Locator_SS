var util = require('./util');

// TODO: test!
exports.makePerson = function(id, location){
	return	{ID: id, 
			Location: {X: location.X, Y: location.Y, Z: location.Z},
			Orientation: null,
			OwnedDeivceID: null, 
			TrackedBy: []};
}

// TODO: test!
exports.makeDevice = function(){
	return	{ID: null,
			Location: {X: null, Y: null, Z:null},
			Orientation: null,
			FOV: util.DEFAULT_FIELD_OF_VIEW,
			Height: null,
			Width: null,
			OwnerID: null,
			IntersectionPoint: {X: 0, Y: 0}};
}

// TODO: test!
exports.make2DPoint = function(x,y){
	return {X: x,
			Y: y};
}

// TODO: test!
exports.makeLineUsingPoints = function(start, end){
	var line = 	{startPoint: {X: start.X, Y: start.Y, Z: start.Z},
				endPoint: {X: end.X, Y: end.Y, Z: end.Z},
				slope: null,
				yIntercept: null,
				isVerticalLine: null, 
				x: null,
				isLineSegment: true};			
	
	if(end.X === start.X){
		line.isVerticalLine = true;
		line.x = start.X;
	}
	else{
		line.isVerticalLine = false;
		line.slope = (end.Y - start.Y) / (end.X - start.X);
		line.yIntercept = start.Y - line.slope * start.X;
	}
	
	return line;
}

// TODO: test!
exports.makeLineUsingOrientation = function(start, orientation){
	var line = 	{startPoint: {X: start.X, Y: start.Y, Z: start.Z},
				endPoint: {X: null, Y: null, Z: null},
				slope: null,
				yIntercept: null,
				isVerticalLine: null, 
				x: null,
				isLineSegment: false};
				
	if(orientation === 90 || orientation === 270){
		line.isVerticalLine = true;
		line.x = start.X;
	}
	else{
		line.isVerticalLine = false;
		line.slope = orientation * Math.PI / 180;
		line.slope = Math.tan(line.slope);
		line.yIntercept = start.Y - line.slope * start.X;
	}
	
	return line;
}