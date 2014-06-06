var util = require('./util');

var uniquePersonCounter = 0;
var uniqueDeviceCounter = 0;

// TODO: TEST again, modified...
function Person(){
    this.ID = null;
    this.location = null;
    this.orientation = null;
    this.orientationToKinect=null;
    this.ownedDeviceID = null;
    this.trackedBy = [];
}

function Person(id, location, socket){
    try{
        if(location.X == null || location.Y == null || location.Z == null){
            var err = new Error("X, Y, or Z is null")
            this.emit('error', err);
        }
        this.ID = {};
        this.ID[id] = socket.id;
        this.uniquePersonID = uniquePersonCounter++;
        this.location = location;
        this.location.X = location.X.toFixed(3);
        this.location.Y = location.Y.toFixed(3);
        this.location.Z = location.Z.toFixed(3);
        this.orientation = null;
        this.ownedDeviceID = null;
        this.pairingState = "unpaired";
        this.lastUpdatedBy = socket.id;
        this.lastUpdated = new Date();
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

function Sensor(socket){
    try{
        this.socketID = socket.id;
        this.sensorType = "";
        this.FOV = 0;
        this.lastUpdated = new Date();
        this.calibration = {Rotation: null, TransformX: null, TransformY: null,xSpaceTransition:null,ySpaceTransition:null, StartingLocation: {X: 0, Y: 0, Z: 0}};
        this.isCalibrated = false;
        console.log("constructing sensor: "+ JSON.stringify(this.calibration));
    }
    catch(err){
        return false;
    }
}

exports.Sensor = Sensor;

// TODO: TEST
function Device(socket){
    try{
        this.ID = null;
        this.socketID = socket.id;
        this.uniqueDeviceID = uniqueDeviceCounter++;
        this.deviceType = "Not specified";
        this.location = {X: null, Y: null, Z:null};
        this.orientation = null;
        this.FOV = util.DEFAULT_FIELD_OF_VIEW;
        this.height = null;
        this.width =  null;
        this.ownerID = null;
        this.pairingState = "unpaired";
        this.intersectionPoint = {X: 0, Y: 0};
        this.lastUpdated = new Date();
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