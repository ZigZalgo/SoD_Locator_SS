/**
 * Created by YX on 2/3/2015.
 */

/*
*   Leap Motion Service Module
*
* */
var locator     =   require('./../locator');
var frontend    =   require('../../frontend');
var factory     =   require('./../factory');
var util        =   require('./../util');



// handles when registerKinect gets called
exports.registerLeapMotionHandler = function(socket,sensorInfo,callback){
    // Generating a kinect sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        var leap = new factory.leapMotion(socket);
        leap.sensorType = sensorInfo.sensorType;
        //leap.FOV = sensorInfo.FOV;
        //leap.rangeInMM = sensorInfo.rangeInMM;
        //leap.frameHeight = sensorInfo.frameHeight;
        //leap.frameWidth = sensorInfo.frameWidth;
        /*if (sensorInfo.translateRule != undefined) {
            var receivedCalibration = {Rotation: sensorInfo.translateRule.changeInOrientation, TransformX: sensorInfo.translateRule.dX, TransformY: sensorInfo.translateRule.dZ, xSpaceTransition: sensorInfo.translateRule.xSpace, ySpaceTransition: sensorInfo.translateRule.zSpace,
                StartingLocation: {X: sensorInfo.translateRule.startingLocation.X, Y: sensorInfo.translateRule.startingLocation.Y, Z: sensorInfo.translateRule.startingLocation.Z}};
            leap.calibration = receivedCalibration;
        }*/
        //fn({"status": 'server: you registered as a "sensor"',sensorNumber:Object.keys(locator.sensors).length})
        registerLeapMotion(leap, callback);

    } else {
        console.log('received null sensor info. Can not register to the server');
    }
}

//register kinect to sensor list
function registerLeapMotion(leap,callback){
    //handles reference Kinect
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    console.log('received sensor: ' +JSON.stringify(leap));
    locator.sensors.leapMotions[leap.socketID] = leap;
    if(callback!=undefined){
        callback({status:"registered",entity:locator.sensors.leapMotions[leap.socketID]});
    }

};