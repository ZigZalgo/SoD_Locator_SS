/**
 * Created by YX on 2/3/2015.
 */

/*
 *   Kinect Service Module
 *
 * */

var locator     =   require('./../locator');
var frontend    =   require('../../frontend');
var factory     =   require('./../factory');
var util        =   require('./../util');

// handles when registerKinect gets called
exports.registerKinectHandler = function(socket,sensorInfo,callback){
    // Generating a kinect sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        var kinect = new factory.Kinect(socket);
        //kinect.sensorType = sensorInfo.sensorType;
        kinect.FOV = sensorInfo.FOV;
        kinect.rangeInMM = sensorInfo.rangeInMM;
        kinect.frameHeight = sensorInfo.frameHeight;
        kinect.frameWidth = sensorInfo.frameWidth;
        if (sensorInfo.translateRule != undefined) {
            var receivedCalibration = {Rotation: sensorInfo.translateRule.changeInOrientation, TransformX: sensorInfo.translateRule.dX, TransformY: sensorInfo.translateRule.dZ, xSpaceTransition: sensorInfo.translateRule.xSpace, ySpaceTransition: sensorInfo.translateRule.zSpace,
                StartingLocation: {X: sensorInfo.translateRule.startingLocation.X, Y: sensorInfo.translateRule.startingLocation.Y, Z: sensorInfo.translateRule.startingLocation.Z}};
            kinect.calibration = receivedCalibration;
        }
        //fn({"status": 'server: you registered as a "sensor"',sensorNumber:Object.keys(locator.sensors).length})
        registerKinect(kinect, callback);

    } else {
        console.log('received null sensor info. Can not register to the server');
    }
}

//register kinect to sensor list
function registerKinect(kinect,callback){
    //handles reference Kinect
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    console.log('received sensor: ' +JSON.stringify(kinect));
    console.log("REFERENCE IS: " + locator.kinectSensorsReference);
    if(locator.kinectSensorsReference == null){
        //sensor.calibration = {Rotation: 0, TransformX: 0, TransformY: 0,xSpaceTransition:0,ySpaceTransition:0, StartingLocation: {X: 0, Y: 0, Z: 0}};
        kinect.isCalibrated = true;
        locator.kinectSensorsReference = kinect;
        console.log("setting default reference");
        locator.sensors.kinects[kinect.socketID] = kinect;
        if(callback!=undefined){
            callback({status:"registered",entity:locator.sensors.kinects[kinect.socketID]})
        }
    }
    else{
        locator.sensors.kinects[kinect.socketID] = kinect;
        if(callback!=undefined){
            callback({status:"registered",entity:locator.sensors.kinects[kinect.socketID]})
        }
    }
};
