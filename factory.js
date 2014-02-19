var util = require('./util');

// tested... should it be possible to create a Person if null ID passed? I've left that as YES for now, otherwise just emit another error
exports.makePerson = function(id, location){
    try{
        if(location.X == null || location.Y == null || location.Z == null){
            var err = new Error("X, Y, or Z is null")
            this.emit('error', err);
        }
        return	{ID: id,
                Location: {X: location.X, Y: location.Y, Z: location.Z},
                Orientation: null,
                OwnedDeviceID: null,
                TrackedBy: []};
    }
    catch(err){
        return false;
    }
}

// tested
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

// tested
exports.make2DPoint = function(x,y){
	return {X: x,
			Y: y};
}

// tested
exports.makeLineUsingPoints = function(start, end){
	var line = 	{startPoint: {X: start.X, Y: start.Y, Z: start.Z},
				endPoint: {X: end.X, Y: end.Y, Z: end.Z},
				slope: null,
				yIntercept: null,
				isVerticalLine: null, 
				x: null,
				isLineSegment: true};			
	
	if(line.endPoint.X === line.startPoint.X){
		line.isVerticalLine = true;
		line.x = line.startPoint.X;
	}
	else{
		line.isVerticalLine = false;
		line.slope = (line.endPoint.Z - line.startPoint.Z) / (line.endPoint.X - line.startPoint.X);
		line.yIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
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
		line.x = line.startPoint.X;
	}
	else{
		line.isVerticalLine = false;
		line.slope = orientation * Math.PI / 180;
		line.slope = Math.tan(line.slope);
		line.yIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
	}
	
	return line;
}