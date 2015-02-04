/**
 * Created by YX on 2/3/2015.
 */
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
exports.registerIBeaconHandler = function(socket,sensorInfo,callback){
    // Generating a kinect sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        var iBeacon = new factory.iBeacon(socket);
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
        registerIBeacon(iBeacon, callback);

    } else {
        console.log('received null sensor info. Can not register to the server');
    }
}

//register kinect to sensor list
function registerIBeacon(iBeacon,callback){
    //handles reference Kinect
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    console.log('received sensor: ' +JSON.stringify(iBeacon));
    locator.sensors.iBeacons[iBeacon.socketID] = iBeacon;
    if(callback!=undefined){
        callback({status:"registered",entity:locator.sensors.iBeacons[iBeacon.socketID]});
    }
};