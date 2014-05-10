var util = require('./util');

// TODO: TEST again, modified...
function Person(){
    this.ID = null;
    this.Location = null;
    this.Orientation = null;
    this.OwnedDeviceID = null;
    this.TrackedBy = [];
}

function Person(id, location){
    try{
        if(location.X == null || location.Y == null || location.Z == null){
            var err = new Error("X, Y, or Z is null")
            this.emit('error', err);
        }

        this.ID = id;
        this.Location = location;
        this.Orientation = null;
        this.OwnedDeviceID = null;
        this.PairingState = "unpaired";
        this.TrackedBy = [];
        this.LastUpdated = new Date();
    }
    catch(err){
        return false;
    }
}

Person.prototype = {
    DisplayOnScreen: function(){
        console.log("This is a prototype function...");
    }
}

exports.Person = Person;

// TODO: TEST
function Device(){
    try{
        this.ID = null;
        this.Location = {X: null, Y: null, Z:null};
        this.Orientation = null;
        this.FOV = util.DEFAULT_FIELD_OF_VIEW;
        this.Height = null;
        this.Width =  null;
        this.OwnerID = null;
        this.PairingState = "unpaired";
        this.IntersectionPoint = {X: 0, Y: 0};
        this.LastUpdated = new Date();
        this.stationary = false;
    }
    catch(err){
    }
}

Device.prototype = {

}

exports.Device = Device;

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
				zIntercept: null,
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
		line.zIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
	}
	
	return line;
}

// TODO: test!
exports.makeLineUsingOrientation = function(start, orientation){
	var line = 	{startPoint: {X: start.X, Y: start.Y, Z: start.Z},
				endPoint: {X: null, Y: null, Z: null},
				slope: null,
				zIntercept: null,
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
		line.zIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
	}
	
	return line;
}