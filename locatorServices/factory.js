var util = require('./util');

var uniquePersonCounter = 0;
var reservedDeviceIDRange = 100;
var uniqueDeviceCounter = reservedDeviceIDRange + 1;
var uniqueSensorCounter = 0;
var uniqueDataPointCounter = 0;
var uniqueDataCounter = 0;
var uniqueProjectorCounter = 0;

// data object (first class)
function data(){
    this.ID = null;
    this.dataPath = null;
    this.type= null;
    this.name = null;
    this.range = null;
}

function data(fileName,fileType,path,range){
    this.ID = uniqueDataCounter++ ;
    this.name = fileName;
    this.type = fileType;
    this.dataPath = path;
    this.range = range;
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
    this.observer = null;
    this.subscriber = null;
}
function dataPoint(location,socketID,dropRange,data,observer,subscriber){
    try{
        if(location.X == null || location.Y == null || location.Z == null){
            var err = new Error("X, Y, or Z is null");
            this.emit('error', err);
        }
        this.ID = uniqueDataPointCounter++;
        this.socketID = socketID;
        this.location = location;
        this.dropRange = dropRange;
        this.observer = observer;
        if(data!=undefined){
            this.data = data;
        }
        this.subscriber = subscriber;
    }catch(err){
        return false;
    }
}
dataPoint.prototype = {
};
exports.dataPoint = dataPoint;

function projector(socketID,data,subscriber){
    try{
        
        this.ID = uniqueProjectorCounter++;
        this.socketID = socketID;
        if(data!=undefined){
            this.data = data;
        }
        this.subscriber = subscriber;
        this.subscriber.subscriberType = subscriber.subscriberType;
        
    }catch(err){
        return false;
    }
}
projector.prototype = {
};
exports.projector = projector;


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
        this.inRangeOf = {};
        this.hands = {left:{ID:null,gesture:null,sensorID:null,lastUpdated:null,location:null},right:{ID:null,gesture:null,sensorID:null,lastUpdated:null,location:null}}
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


// Kinect constructor
function Kinect(socket){
    try{
        this.ID = uniqueSensorCounter ++;
        this.socketID = socket.id;
        this.sensorType = "kinect";
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

exports.Kinect = Kinect;


// Leap motion constructor
function leapMotion(socket){
    try{
        this.ID = uniqueSensorCounter ++;
        this.socketID = socket.id;
        this.sensorType = "leapMotion";
        //this.FOV = 0;
        this.lastUpdated = new Date();
        this.location = {X:null,Y:null,Z:null};
        //this.calibration = {Rotation: null, TransformX: null, TransformY: null,xSpaceTransition:null,ySpaceTransition:null, StartingLocation: {X: 0, Y: 0, Z: 0}};
        //this.isCalibrated = false;
        //console.log("constructing sensor: "+ JSON.stringify(this.calibration));
    }
    catch(err){
        return false;
    }
}

exports.leapMotion = leapMotion;


//-----------------------------------------------  iBeacon  --------------------------------------------------//   
//------------------------------------------------------------------------------------------------------------//   
//------------------------------------------------------------------------------------------------------------//   
function iBeacon(socket, sensorInfo, deviceSocketID, personID){
    try{  
        this.uuid = sensorInfo.uuid;
        this.major = sensorInfo.major;
        this.minor = sensorInfo.minor;
        this.identifier = sensorInfo.identifier;
        this.name = sensorInfo.name;
        
        //Is this sensor a device as well
        if(sensorInfo.isDevice != undefined){
            if(sensorInfo.isDevice == 'YES'){
                this.isDevice = true;
            } else{
                this.isDevice = false;
            }
        }
            
        else{
            this.isDevice = false;
        }
       
        //Default Ranges
        this.immediateRange = '1';
        this.nearRange = '5';
        this.farRange = '10';

        this.location = {X: null, Y: null, Z:null};
        this.deviceSocketID = deviceSocketID;
        this.personID = personID;

        this.ID = uniqueSensorCounter ++;
        this.beaconType = 'Tr';
        this.socketID = socket.id;
        this.sensorType = "iBeacon";
        this.lastUpdated = new Date();
    }
    catch(err){
        return false;
    }
}

exports.iBeacon = iBeacon;

//BeaconRcvr Constructor
function iBeaconRcvr(socket, sensorInfo, deviceSocketID){
    console.log('\nInside iBeaconRcvr\n');
    try{


        this.name = sensorInfo.name;
        this.location = {X: null, Y: null, Z:null};
        this.deviceSocketID = deviceSocketID;
        if(sensorInfo.personId != undefined){
            this.personID = sensorInfo.personId;
        }else{
            this.personId = -1;
        }

        this.ID = uniqueSensorCounter ++;
        this.beaconType = 'Rcvr';
        this.socketID = socket.id;
        this.sensorType = "iBeaconRcvr";
        this.lastUpdated = new Date();
    }
    catch(err){
        return false;
    }
}
exports.iBeaconRcvr = iBeaconRcvr;

function beaconLocation (iBeacon){
    try{
        this.location = {};
        this.location.X = iBeacon.location.X;
        this.location.Y = iBeacon.location.Y;
        this.location.Z = iBeacon.location.Z;

        this.immediateRange = iBeacon.immediateRange;
        this.nearRange = iBeacon.nearRange;
        this.farRange = iBeacon.farRange;
    
        this.ID = iBeacon.ID;

    } catch (err){
        return false;
    }
}

exports.beaconLocation = beaconLocation;

//-------------------------------------------END of iBEacon--------------------------------------------------//


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

        //console.log("Options: "+JSON.stringify(opts));
        this.orientation = {pitch:0,yaw:0}
        if(opts['orientation']['yaw']){
            if(intRegex.test(opts['orientation']['yaw'])) {
                if(0 <= opts['orientation'] && opts['orientation']['yaw'] <= 360){
                    console.log("Device orientation: " + opts['orientation']['yaw']);
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
        this.depth = null;
        this.height = null;
        this.width =  null;
        this.ownerID = null;
        this.pairingState = "unpaired";
        this.intersectionPoint = {X: 0, Y: 0};
        this.lastUpdated = new Date();
        this.stationary = false;
        this.deviceIP = '';
        this.observer = null;
        this.inRangeOf = {};
        this.inViewList = {};
        this.subscribeToEvents ={
            roomIntersectionEvents:true,
            inViewEvents:true,
            observerRangeEvents:false,
            intersectionPointsEvents:false
        };
    }
    catch(err){
    }
}
Device.prototype = {

};

exports.Device = Device;


// tested
exports.make2DPoint = function (x, z) {
    return {X: x,
        Y: 0,Z: z};
};


// tested
exports.makeLineUsingPoints = function (start, end) {
    //console.log('start: '+JSON.stringify(start));
    //console.log('end: '+JSON.stringify(end));
    ///if(start.X == end.X)
    var line = {startPoint: {X: start.X, Y: start.Y, Z: start.Z},
        endPoint: {X: end.X, Y: end.Y, Z: end.Z},
        slope: null,
        zIntercept: null,
        isVerticalLine: null,
        x: null,
        isLineSegment: true};
    if (start.X == end.X) {
        line.isVerticalLine = true;
        line.x = line.startPoint.X;

        return line;
    }
    else {
        line.isVerticalLine = false;
        line.slope = (line.endPoint.Z - line.startPoint.Z) / (line.endPoint.X - line.startPoint.X);
        line.zIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
        //console.log("zIntercept: "+line.zIntercept + ' slope: '+ line.slope + ' - startPoint:' + JSON.stringify(line.startPoint) + ' - endPoint ' + JSON.stringify(line.endPoint) );
        return line;
    }
};

// TODO: test!
exports.makeLineUsingOrientation = function(start, orientation) {
    var yaw = null;
    if(typeof(orientation)=="object"&& orientation.yaw != undefined){
        var yaw = orientation.yaw;
    }else{
        var yaw = orientation;
    }
    var line = {startPoint: {X: start.X, Y: start.Y, Z: start.Z},
        endPoint: {X: null, Y: null, Z: null},
        slope: null,
        zIntercept: null,
        isVerticalLine: null,
        x: null,
        isLineSegment: false};

    if (yaw === 90 || yaw === 270) {
        line.isVerticalLine = true;
        line.x = line.startPoint.X;
    }
    else {
        line.isVerticalLine = false;
        line.slope = yaw * Math.PI / 180;
        line.slope = Math.tan(line.slope);
        line.zIntercept = line.startPoint.Z - line.slope * line.startPoint.X;
    }
    return line;
};


/*
*   Location is a JSON object ie, {X:0,Y:0,Z:0} indicates the location of the device
*   walls property:
*       top,left,right,bottom - as in two D space
*       relative computation are basically using projection
* */
function Room(location,Length,Depth,Height){
    this.location = location;
    this.length = Length;
    this.depth = Depth;
    this.height = Height;
    this.walls = {
        top:{
            startingPoint:{X:location.X-this.length/2,Y:location.Y+this.height,Z:location.Z+this.depth/2},
            endingPoint:{X:location.X+this.length/2,Y:location.Y+this.height,Z:location.Z+this.depth/2}
        },
        left:{
            startingPoint:{X:location.X-this.length/2,Y:location.Y+this.height,Z:location.Z+this.depth/2},
            endingPoint:{X:location.X-this.length/2,Y:location.Y+this.height,Z:location.Z-this.depth/2}
        },
        right:{
            startingPoint:{X:location.X+this.length/2,Y:location.Y+this.height,Z:location.Z+this.depth/2},
            endingPoint:{X:location.X+this.length/2,Y:location.Y+this.height,Z:location.Z-this.depth/2}
        },
        bottom:{
            startingPoint:{X:location.X-this.length/2,Y:location.Y+this.height,Z:location.Z-this.depth/2},
            endingPoint:{X:location.X+this.length/2,Y:location.Y+this.height,Z:location.Z-this.depth/2}
        }
    }
    this.ceiling = {        //ceiling in 2D
        length:this.length,
        depth: this.depth,
        height:this.height
    }

}
Room.prototype = {

};
exports.Room = Room;
