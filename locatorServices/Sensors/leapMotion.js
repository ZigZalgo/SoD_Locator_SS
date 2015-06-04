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
var async       =   require('async');

var maximumDistanceThreshold = 1.5;

// handles when registerKinect gets called
exports.registerLeapMotionHandler = function(socket,sensorInfo,callback){
    // Generating a kinect sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        var leap = new factory.leapMotion(socket);
        leap.sensorType = sensorInfo.sensorType;
        leap.location = sensorInfo.location;
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

// on event "handsUpdate" for request handler
exports.updatePersonWithHandData = function(handData,callback){
    console.log("Got hand data: "+handData);
    //TODO: find the closest person
    handData.sensorID = locator.sensors.leapMotions[handData.socketID].ID;
    // use async module to handle when all the people are being processed
    if(Object.keys(locator.persons)>=0) {
        util.getNearest(locator.sensors.leapMotions[handData.socketID], locator.persons, function (nearestObjectWithDistance) {
            console.log("Nearest object: " + JSON.stringify(nearestObjectWithDistance));
            if(nearestObjectWithDistance.distance<=maximumDistanceThreshold){
                // once the closes person is within the threshold
                console.log("ID: "+ locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].uniquePersonID);
                if(locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].uniquePersonID!=undefined){
                    switch(handData.whichHand){
                        case "left":
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.left.gesture = handData.gesture;
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.left.ID = handData.ID;
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.left.sensorID = handData.sensorID;
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.left.lastUpdated = new Date().getTime();
                            callback({status: "success", entity:locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands,reason:"Done smoothly"});//expect(data.entity.socketID).to.equal(client1.socket.transport.sessid);
                            break;
                        case "right":
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.right.gesture = handData.gesture;
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.right.ID = handData.ID;
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.right.sensorID = handData.sensorID;
                            locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands.right.lastUpdated = new Date().getTime();
                            callback({status: "success", entity:locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands,reason:"Done smoothly"});//expect(data.entity.socketID).to.equal(client1.socket.transport.sessid);
                            break;
                        //TODO: handles "Both" hands data
                        default:
                            console.log("Unknown type for which hand "+handData.whichhand);
                            callback({status: "fail", entity:locator.persons[nearestObjectWithDistance.nearestObject.uniquePersonID].hands,reason:"Unknown hand"+handData.whichHand});//expect(data.entity.socketID).to.equal(client1.socket.transport.sessid);
                    }

                }
            }else{
                callback({status: "failed", entity: handData.socketID,reason:"Closest person is outside of threshold"});//expect(data.entity.socketID).to.equal(client1.socket.transport.sessid);
            }
        });//
    }else{
        console.log("No people found.. with handData: "+JSON.stringify(handData));
        callback({status: "failed", entity: handData.socketID,reason:"No people found on Server"});//expect(data.entity.socketID).to.equal(client1.socket.transport.sessid);
    }
}



exports.purgeUnusedHands = function(){

    async.each(Object.keys(locator.persons),function(key,itrCallback){
        var now = new Date().getTime();
        //console.log(locator.persons[key].hands);
        if(locator.persons[key].hands.left.ID != null){
            console.log();
            if((now-locator.persons[key].hands.left.lastUpdated)/1000>3){
                //console.log("Over three second: "+ (now-locator.persons[key].hands.left.lastUpdated)/1000);
                locator.persons[key].hands.left.ID = null;
                locator.persons[key].hands.left.gesture = null;
                locator.persons[key].hands.left.sensorID = null;
            }
        }
        if(locator.persons[key].hands.right.ID != null){
            if((now-locator.persons[key].hands.left.lastUpdated)/1000>3){
                console.log("Over three second: "+ (now-locator.persons[key].hands.left.lastUpdated)/1000);
                locator.persons[key].hands.right.ID = null;
                locator.persons[key].hands.right.gesture = null;
                locator.persons[key].hands.right.sensorID = null;
            }
        }
    },function(err){
        // if any of the file processing produced an error, err would equal that error
        if( err ) {
            // One of the iterations produced an error.
            // All processing will now stop.
            console.log('A person failed to process'+err);
        } else {
            //console.log('All persons were processed successfully');
        }
    });

}
