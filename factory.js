var util = require('./util');

var uniquePersonCounter = 0;
var reservedDeviceIDRange = 100;
var uniqueDeviceCounter = reservedDeviceIDRange + 1;
var uniqueSensorCounter = 0;
var uniqueDataPointCounter = 0;
var uniqueDataCounter = 0;

// data object (first class)
function data(){
    this.ID = null;
    this.dataPath = null;
    this.type= null;
    this.name = null;
}

function data(fileName,fileType,path){
    this.ID = uniqueDataCounter++ ;
    this.name = fileName;
    this.type = fileType;
    this.dataPath = path;
}
data.prototype={
};
exports.data = data;


// dataPoint Constructors
function dataPoint(){
    this.ID = null;
    this.location = null;
    this.data = null;
    this.range = null; // how far this data is allow to be seen
}
function dataPoint(location,socketID,range,data){
    try{
        if(location.X == null || location.Y == null || location.Z == null){
            var err = new Error("X, Y, or Z is null");
            this.emit('error', err);
        }
        this.ID = uniqueDataPointCounter++;
        this.socketID = socketID;
        this.location = location;
        this.range = range;
        if(data!=undefined){
            this.data = data;
        }
    }catch(err){
        return false;
    }
}
dataPoint.prototype = {
};
exports.dataPoint = dataPoint;

function Person(id, location, socket){
    try{
        if(location.X == null || location.Y == null || location.Z == null){
            var err = new Error("X, Y, or Z is null");
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
        this.currentlyTrackedBy = socket.id;
        this.lastUpdated = new Date();
        this.data = {};
        this.gesture = "untracked";
    }
    catch(err){
        return false;
    }
}

Person.prototype = {
    DisplayOnScreen: function () {
        console.log("This is a prototype function...");
    }
};

exports.Person = Person;

function Sensor(socket){
    try{
        this.ID = uniqueSensorCounter ++;
        this.socketID = socket.id;
        this.sensorType = "";
        this.FOV = 0;
        this.lastUpdated = new Date();
        this.calibration = {Rotation: null, TransformX: null, TransformY: null,xSpaceTransition:null,ySpaceTransition:null, StartingLocation: {X: 0, Y: 0, Z: 0}};
        this.isCalibrated = false;
        //console.log("constructing sensor: "+ JSON.stringify(this.calibration));
    }
    catch(err){
        return false;
    }
}

exports.Sensor = Sensor;

// TODO: TEST
function Device(socket, opts){
    try{
        var intRegex = /^\d+$/;
        if(opts['ID']){
            if(intRegex.test(opts['ID'])) {
                if(0 <= opts['ID'] && opts['ID'] <= reservedDeviceIDRange){
                    if(util.getDeviceSocketIDByID(opts['ID']) == undefined){
                        this.uniqueDeviceID = opts['ID'];
                    }
                    else{
                        console.log("Device tried to register with a reserved ID which already exists.");
                        this.uniqueDeviceID = uniqueDeviceCounter++;
                    }
                }
                else{
                    console.log("Device tried to reserve an ID outside the permitted range.");
                    this.uniqueDeviceID = uniqueDeviceCounter++;
                }
            }
            else{
                console.log("Device specified an invalid (non-integer) ID during registration.");
                this.uniqueDeviceID = uniqueDeviceCounter++;
            }
        }
        else{
            this.uniqueDeviceID = uniqueDeviceCounter++;
        }

        if(opts['orientation']){
            if(intRegex.test(opts['orientation'])) {
                if(0 <= opts['orientation'] && opts['orientation'] <= 360){
                    console.log("Device orientation: " + opts['orientation']);
                    this.orientation = opts['orientation'];
                }
                else{
                    console.log("Device specified an invalid angle for orientation (0 - 360).");
                    this.orientation = null;
                }
            }
            else{
                console.log("Device specified an invalid (non-integer) orientation during registration.");
                this.orientation = null;
            }
        }
        else{
            this.orientation = null;
        }

        this.name = null;
        this.socketID = socket.id;
        //this.uniqueDeviceID = uniqueDeviceCounter++;
        this.deviceType = "Not specified";
        this.location = {X: null, Y: null, Z:null};
        this.FOV = util.DEFAULT_FIELD_OF_VIEW;
        this.height = null;
        this.width =  null;
        this.ownerID = null;
        this.pairingState = "unpaired";
        this.intersectionPoint = {X: 0, Y: 0};
        this.lastUpdated = new Date();
        this.stationary = false;
        this.deviceIP = '';
    }
    catch(err){
    }
}
Device.prototype = {

};

exports.Device = Device;



// tested
exports.make2DPoint = function (x, y) {
    return {X: x,
        Y: y};
};

// tested
exports.makeLineUsingPoints = function (start, end) {
    var line = {startPoint: {X: start.X, Y: start.Y, Z: start.Z},
        endPoint: {X: end.X, Y: end.Y, Z: end.Z},
        slope: null,
        zIntercept: null,
        isVerticalLine: null,
        x: null,
        isLineSegment: true};

    if (line.endPoint.X === line.startPoint.X) {
        line.isVerticalLine = true;
        line.x = line.startPoint.X;
    }
    else {
        line.isVerticalLine = false;
        line.slope = (line.endPoint.Z - line.startPoint.Z) / (line.endPoint.X - line.startPoint.X);
        line.zIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
    }

    return line;
};

// TODO: test!
exports.makeLineUsingOrientation = function (start, orientation) {
    var line = {startPoint: {X: start.X, Y: start.Y, Z: start.Z},
        endPoint: {X: null, Y: null, Z: null},
        slope: null,
        zIntercept: null,
        isVerticalLine: null,
        x: null,
        isLineSegment: false};

    if (orientation === 90 || orientation === 270) {
        line.isVerticalLine = true;
        line.x = line.startPoint.X;
    }
    else {
        line.isVerticalLine = false;
        line.slope = orientation * Math.PI / 180;
        line.slope = Math.tan(line.slope);
        line.zIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
    }

    return line;
};