var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator')
var util = require('./util');
var frontend = require('./../frontend');
var Q = require('q');
var async = require("async");
var pulse = require("./pulse");
var dataService = require("./data");
//var events = require("events");


var dataPoints = {};
var persons = {};
var devices = {};

//Modifications For Beacon
var sensors = {kinects:{},leapMotions:{},iBeacons:{}, iBeaconRcvrs:{}};
var visibleBeacons = {};
exports.visibleBeacons = visibleBeacons;
//

var data = {};
var projector = {};
var configuration = {};
exports.kinectSensorsReference = null;
exports.persons = persons;
exports.devices = devices;
exports.sensors = sensors;
exports.dataPoints = dataPoints;
exports.projectors = projector;
//exports = projector;
exports.projectorService = require("./Services/projector");
exports.kinectService = require('./Services/kinect');
exports.leapMotionService = require('./Services/leapMotion');
exports.iBeaconService = require('./Services/iBeacon');
exports.tangoService = require('./Services/tango');


var room = new factory.Room({X:0,Y:0,Z:0},6, 8, 4);
exports.room = room;


// TODO: test!
/*exports.start = function(){
    // Do initialization here, if any
    // load flashback from stateFile
    locator.loadConfig();
};*/


exports.registerSensor = function(socket,type,sensorInfo,callback){
    // switch for type of sensor handler.
    frontend.clients[socket.id].clientType = "sensor";
    switch(sensorInfo.sensorType.toLowerCase()){
        case "kinect":
            console.log("Register Kinect Inc");
            locator.kinectService.registerKinectHandler(socket,sensorInfo,callback);
            break;
        case "kinect2":
            console.log("Register Kinect Inc");
            locator.kinectService.registerKinectHandler(socket,sensorInfo,callback);
            break;
        case "leapmotion":
            console.log("Register Leap Inc");

            locator.leapMotionService.registerLeapMotionHandler(socket,sensorInfo,callback);
            break;
        case "ibeacon":
            //console.log("Register iBeacon Inc");
            locator.iBeaconService.registerIBeaconHandler(socket,sensorInfo,callback);
            break;
        default:
            console.log("Unkonwn Sensor Type: "+ sensorInfo.sensorType);
    }
}

//----------------------------START OF BEACON---------------------------------------------------------------------------//
//Handles recieving beacons list

exports.handleDeregisteringBeaconTransmitter = function(socket){
    locator.iBeaconService.deRegisterIBeaconTrHandler(socket);
}

exports.handleDeregisteringBeaconReciever = function (socket){
    locator.iBeaconService.deRegisterIBeaconRcvrHandler(socket);
}

exports.handleUpdatedBeaconsList = function(socket, beaconsList, callback){
    locator.iBeaconService.handleUpdatedBeaconsList(socket, beaconsList, callback);
}

exports.getBeaconsTransmitterList = function (socket){
    locator.iBeaconService.sendTransmittersList(socket);
}

exports.getBeaconsRecieverList = function (socket){
    locator.iBeaconService.sendRecieversList(socket);
}

exports.getBeaconsTransmittersListLocation = function (socket, fn){
    locator.iBeaconService.getBeaconsTransmittersListLocation(socket, fn);
}

exports.updateSpeedAndOrientation = function (socket, date, fn){
    locator.iBeaconService.updateSpeedAndOrientation(socket, date, fn);
}

exports.calibrateKinnectLocationWithDeviceSenosorLocation = function (socket, date){
    locator.iBeaconService.calibrateKinnectLocationWithDeviceSenosorLocation(socket, date);
}

exports.deletePersonFromLists = function (socket, date, fn){
    locator.iBeaconService.clearPersonFromLists(socket, date, fn);
}

exports.updatePersonLocationWithBeaconReadings = function (socket, data, fn){
    locator.iBeaconService.updatePersonLocationWithBeaconReadings(socket, data, fn);
}

//------------------------------END OF BEACON---------------------------------------------------------------//


// calibration to sensors
exports.calibrateSensors = function(sensorOnePoints, sensorTwoPoints){
    console.log("Calibrating Kinect...");
    return util.getTranslationRule(sensorOnePoints[0], sensorOnePoints[1], sensorTwoPoints[0], sensorTwoPoints[1])
}

/*
 * Function that check if a string is empty
 * */
function isEmpty(str) {
    return (!str || 0 === str.length);
}

/*
 *  Grab data from targetObject to requestObject
 *
 * **/
function grabDataInRange(requestObject,targetObject){
    var distance,dataRange;
    distance = util.distanceBetweenPoints(requestObject.location,targetObject.location); // get distance between data and object
    console.log(requestObject);
    if(targetObject.observer.observerType=='radial'&&distance<targetObject.observer.observeRange){
        try{
            console.log('-> Grab event emit: person : ' + targetObject.ID + ' grab dataPoint: ' + requestObject.uniquePersonID);
            frontend.io.sockets.emit('grabInObserveRange',{payload:{observer:{ID:targetObject.ID,type:'dataPoint'},invader:requestObject.uniquePersonID}});
        }catch(err){
            console.log('*Failed to emit grabInObserveRange event due to: '+err);
        }
    }

    if(targetObject.data != undefined && Object.keys(targetObject.data).length != 0) {
        // if there exists data in side of an object, grab all the data
        for (var dataKey in targetObject.data) {
           /* if(targetObject.data.hasOwnProperty(dataKey)) {
                console.log(targetObject.data[dataKey]);
                dataRange = targetObject.data[dataKey].range;
                // get range of this point
                if (requestObject.data[dataKey] == undefined && distance <= dataRange) {
                    // if the data is not exited in the requestObject.
                    requestObject.data[dataKey] = targetObject.data[dataKey];
                    console.log('\t->-> Object grabbed:' + JSON.stringify(requestObject.data[dataKey].name) + ' From targetobject');
                }
            }*/
        }
    }else{
        console.log('\t->-> Ojbect grabbed '+'0 data from target.' );
    }
}

//*
// Request Object grab all the data from targetObject
// *//
function grabAllData(requestObject,targetObject){
    if(targetObject.data != undefined) {
        // if there exists data in side of an object, grab all the data
        for (var dataKey in targetObject.data) {
            if(targetObject.data.hasOwnProperty(dataKey)) {
                requestObject.data[dataKey] = targetObject.data[dataKey];
                console.log('\t->-> Object grabbed: ' + JSON.stringify(requestObject.data[dataKey].name) + ' From targetobject');
            }
        }
    }
}


/**
 *  Drop data from current location of the requestsObject with a range
 *  if the location is within the range of
 *
 * */
exports.dropData = function(socket,requestObject,dropRange,fn){
    var dataPointCounter = 0;
    var dataPointsLength = Object.keys(dataPoints).length;
    if(requestObject!=undefined) {
        if (requestObject.data != undefined) {
            if (requestObject.location != undefined && dropRange != undefined && Object.keys(requestObject.data).length != 0) {
                console.log('drop data request from: ' + JSON.stringify(requestObject) + ' dropRange: ' + dropRange);
                //var dropLocation = requestObject.location;
                for (var key in dataPoints) {
                    if (dataPoints.hasOwnProperty(key)) {
                        // if reach the end of the dataPoints list
                        dataPointCounter++;
                        //console.log('Current DP: ' + JSON.stringify(dataPoints[key]));
                        //console.log(dataPointCounter+ ' / '+ dataPointsLength);
                        var distance, dataPointDropRange;
                        dataPointDropRange = dataPoints[key].dropRange;              // get range of this point
                        //console.log('->-> Calculating: ' + JSON.stringify(requestObject.location) + ' with DP:' + dataPoints[key].ID + ' location: ' + JSON.stringify(dataPoints[key].location));
                        distance = util.distanceBetweenPoints(requestObject.location, dataPoints[key].location); // get distance between data and object
                        if (distance <= dataPointDropRange) {
                            grabAllData(dataPoints[key], requestObject);    //dump the data once and return.
                            console.log('-> Dumping data to data point: ' + dataPoints[key].ID + ' since the distance: ' + distance + ' within dropRange: ' + dropRange);
                            if (fn != undefined) {
                                fn('\t->-> dumping data to dataPoint ' + dataPoints[key].ID);
                            }
                            frontend.io.sockets.emit("refreshStationaryLayer", {}); // refresh the fronted layer
                            return;
                        } else if (dataPointCounter == dataPointsLength) {
                            var currentLocation = {X: requestObject.location.X, Y: requestObject.location.Y, Z: requestObject.location.Z};
                            locator.registerDataPoint(socket, {location: currentLocation, data: Object.keys(requestObject.data), dropRange: dropRange}, fn); //dataPointInfo.location,socket.id,dataPointInfo.range,registerData
                        }
                    }// end of hasOwnproperty
                }
                // if it is not in any dataPoints range

            } else {
                console.log('\t->-> 0 ' + ' data has been dropped by object ' + requestObject);
                if (fn != undefined) {
                    fn('Dump data requestObject is not well defined.');
                }
            }
        } else {
            console.log('Request object does not have any data');
        }
    }
}
// send message to subscriber if defined, otherwise send message to All
exports.emitEventToSubscriber = function(eventName,message,subscribers){
    console.log('emitting evetns to subscriber: '+JSON.stringify(subscribers) + JSON.stringify(message));
    if(subscribers.length!=0){
        //for
        subscribers.forEach(function(subscriber){
            //frontend.io.sockets.emit(eventName,message);
            if(subscriber.subscriberType == 'device'){
                for(var key in locator.devices){
                    if(locator.devices.hasOwnProperty(key) && locator.devices[key].uniqueDeviceID == subscriber.ID){
                        console.log('-> emiting event to device: '+locator.devices[key].uniqueDeviceID);
                        frontend.clients[key].emit(eventName,message);
                    }
                }
            }
        })
    }else{  // END of subscriber length checker
        frontend.io.sockets.emit(eventName,message); // send event to everybody
    }
}

/* inRangeEvent functions calculate whether a person is in range of a device. */
function inRangeEvent(){
    //for all the people that are been tracked
    for(var personKey in locator.persons){
        if(locator.persons.hasOwnProperty(personKey)){
            for(var deviceKey in locator.devices){
                if(locator.devices.hasOwnProperty(deviceKey)){
                    // if a person in in range of any device fire out broadcast event
                    try{
                        if(locator.persons[personKey].inRangeOf[deviceKey]==undefined) // handles enter event
                        {
                            //console.log(JSON.stringify(locator.devices[deviceKey].observer));
                            if(locator.devices[deviceKey].observer.observerType == 'radial' &&
                                util.distanceBetweenPoints(locator.persons[personKey].location,locator.devices[deviceKey].location)<=locator.devices[deviceKey].observer.observeRange)
                            {
                                locator.persons[personKey].inRangeOf[deviceKey] = {type:'device',ID:locator.devices[deviceKey].uniqueDeviceID};
                                frontend.clients[locator.devices[deviceKey].socketID].emit("enterObserveRange", {payload:{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},visitor:locator.persons[personKey].uniquePersonID}});
                                console.log('-> enter radial'+JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                            }else if(locator.devices[deviceKey].observer.observerType == 'rectangular'
                                && util.isInRect(locator.persons[personKey].location,util.getObserverLocation(locator.devices[deviceKey]),locator.devices[deviceKey].observer.observeWidth,locator.devices[deviceKey].observer.observeHeight) == true) // handles rectangular
                            {
                                locator.persons[personKey].inRangeOf[deviceKey] = {type:'device',ID:locator.devices[deviceKey].uniqueDeviceID};
                                frontend.clients[locator.devices[deviceKey].socketID].emit("enterObserveRange", {payload:{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},visitor:locator.persons[personKey].uniquePersonID}});
                                console.log('-> enter rect! '+JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                            }
                        }
                        else if(locator.persons[personKey].inRangeOf[deviceKey]!=undefined) // handles leaves event
                        {
                            if (locator.devices[deviceKey].observer.observerType == 'radial' && util.distanceBetweenPoints(locator.persons[personKey].location, locator.devices[deviceKey].location) > locator.devices[deviceKey].observer.observeRange) {
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveObserveRange", {payload: {observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'}, visitor: locator.persons[personKey].uniquePersonID}});
                                delete locator.persons[personKey].inRangeOf[deviceKey];
                            }
                            if (locator.devices[deviceKey].observer.observerType == 'rectangular'
                                && util.isInRect(locator.persons[personKey].location, util.getObserverLocation(locator.devices[deviceKey]), locator.devices[deviceKey].observer.observeWidth, locator.devices[deviceKey].observer.observeHeight) == false) // handles rectangular
                            {
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveObserveRange", {payload: {observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'}, visitor: locator.persons[personKey].uniquePersonID}});
                                delete locator.persons[personKey].inRangeOf[deviceKey];
                            }
                        }
                    }catch(err){
                        console.log('emitting enter and fail event failed ... due to: ' +err);
                    }
                }// end of if ownPropertys
            }// end of all devices

            // start checking all the dataPoints
            for(var dataPointKey in locator.dataPoints){
                if(locator.dataPoints.hasOwnProperty(dataPointKey)){
                    if(locator.persons[personKey].inRangeOf[dataPointKey]==undefined){ // handles enter event
                        if(locator.dataPoints[dataPointKey].observer.observerType=='rectangular'){
                            if(util.isInRect(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location,locator.dataPoints[dataPointKey].observer.observeWidth,locator.dataPoints[dataPointKey].observer)==true){
                                console.log('person inside of dataPoint: '+dataPointKey );
                                locator.persons[personKey].inRangeOf[dataPointKey] = {type:'dataPoint',ID:locator.dataPoints[dataPointKey].ID};
                                //TODO: add sendMessageToSubscriber function call
                                locator.emitEventToSubscriber('enterObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber)
                                console.log('-> enter rec '+JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                            }
                        }else if(locator.dataPoints[dataPointKey].observer.observerType=='radial' && util.distanceBetweenPoints(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location)<=locator.dataPoints[dataPointKey].observer.observeRange){ // end of rectangualar
                            locator.persons[personKey].inRangeOf[dataPointKey] = {type:'dataPoint',ID:locator.dataPoints[dataPointKey].ID};
                            locator.emitEventToSubscriber('enterObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber)
                            console.log('-> enter radial '+JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                        }
                    }else if(locator.persons[personKey].inRangeOf[dataPointKey]!=undefined){ // handles leave event
                        if(locator.dataPoints[dataPointKey].observer.observerType=='rectangular'){
                            //console.log('inRange '+ (locator.dataPoints[dataPointKey].location.Z-locator.dataPoints[dataPointKey].observer.observeHeight/2));
                            if(util.isInRect(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location,locator.dataPoints[dataPointKey].observer.observeWidth,locator.dataPoints[dataPointKey].observer.observeHeight)==false){
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                                //frontend.io.sockets.emit('leaveObserveRange', {payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}});
                                locator.emitEventToSubscriber('leaveObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber);
                                delete locator.persons[personKey].inRangeOf[dataPointKey];
                            }
                        }else if(locator.dataPoints[dataPointKey].observer.observerType=='radial' && util.distanceBetweenPoints(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location)>locator.dataPoints[dataPointKey].observer.observeRange){ // end of rectangualar
                            console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                            //frontend.io.sockets.emit('leaveObserveRange', {payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}});
                            locator.emitEventToSubscriber('leaveObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber);
                            delete locator.persons[personKey].inRangeOf[dataPointKey];
                        }
                    }// in range of somebdoy ends
                }
            }
        }// END of ALL DATAPOINTS

    }
}


/*
 * check all the data location and grab data if within range
 *   param: object  -> can be people , devices , dataPoints
 * **/
function grabEventHandler(object){
    //var distance;
    //var dataRange;
    for( var key in dataPoints){
        if(dataPoints.hasOwnProperty(key)){
            //dataRange = dataPoints[key].range;              // get range of this point
            //distance = util.distanceBetweenPoints(object.location,dataPoints[key].location); // get distance between data and object
            grabDataInRange(object,dataPoints[key]); // try to grab data from all the dataPoints
            //if(distance <= dataRange){
            // starting transfer data
            //var data = {dataPath:dataPoints[key].data};// copy data path from dataPoints to person;
            //grabDataInRange(object,dataPoints[key]);
            //}
        }
    }

}


/**
 *  Handles the gesture from person performs the action
 *  param:
 *      -> key: the key of the person object
 *      -> gesture: the gesture of the person
 *      -> the socket ID (sensor's socket)
 * */
function gestureHandler(key,gesture,socket){
    switch(gesture){
        case "Grab":
            console.log("-> GRAB gesture detected from person: " + key + "!");
            grabEventHandler(persons[key]); // try to grab data if any data is within range
            frontend.io.sockets.emit("gesture",{person:locator.persons[key].uniquePersonID,gesture:"Grab"});
            break;
        case "Release":
            console.log("-> RELEASE gesture detected from person: " + key + "!");
            locator.dropData(socket,persons[key],0.5); // set the default drop range to 1 meter for now
            frontend.io.sockets.emit("gesture",{person:locator.persons[key].uniquePersonID,gesture:"Release"});
            break;
        default:
            console.log("Some gesture detected from person " + key + ": " + persons[key]);
    }
}


exports.updatePersons = function(receivedPerson, socket,callback){
   //var association = {skeletonID:receivedPerson.ID,uniquePersonID:person.uniquePersonID}; // the assication between the receivedPersonID and the uniquePersonID
    if(Object.keys(persons).length == 0){
        //nobody being tracked, add new person
        //person was not found
        if((receivedPerson.trackingState==1) && receivedPerson.ID != undefined && receivedPerson.location != undefined){ //if provided an ID and a location, update
            console.log("received Person: "+JSON.stringify(receivedPerson));
            var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
            person.lastUpdated = new Date();
            person.currentlyTrackedBy = socket.id;
            person.gesture = receivedPerson.gesture;
            if(receivedPerson.leftHandLocation!=null){
                person.hands.left.location = receivedPerson.lefthandLocation;
            }
            if(receivedPerson.rightHandLocation!=null){
                person.hands.right.location = receivedPerson.rightHandLocation;
            }
            persons[person.uniquePersonID] = person;
            callback({skeletonID:receivedPerson.ID,uniquePersonID:person.uniquePersonID});
        }else{
            callback(null);
        }
    }
    else{
        //there are people being tracked, see if they match
        //var counter = Object.keys(persons).length;
        var nearestDistance = 1000;
        var nearestPersonID = null;
        var existingID = [];
        var receivedPersonProcessed = false;        // a lock make sure async doesn't process same received person twice

        async.eachSeries(Object.keys(persons),function(personKey,eachSeriesCallback){
            // process each person individually
            if(persons.hasOwnProperty(personKey) && receivedPersonProcessed == false){
                var personInList = locator.persons[personKey];
                existingID = existingID.concat(Object.keys(personInList.ID));


                // add this person to existing IDs
                if(personInList.ID[receivedPerson.ID]!=undefined){
                    // receivedPerson is in one of persons' ID list
                    // Handles gesture of this person
                    personInList.gesture = receivedPerson.gesture;
                    if(receivedPerson.gesture!=null){
                        gestureHandler(personKey,personInList.gesture,socket);//handles the guesture
                    }


                    if(personInList.currentlyTrackedBy == socket.id){
                        // receivedPerson also come the the main track sensor, update personInList attributes
                        try{

                            personInList.location.X = receivedPerson.location.X.toFixed(3);
                            personInList.location.Y = receivedPerson.location.Y.toFixed(3);
                            personInList.location.Z = receivedPerson.location.Z.toFixed(3);
                            personInList.lastUpdated = new Date();
                            //personInList.gesture = receivedPerson.gesture;
                            // handles the person's gesture.
                            /*if(receivedPerson.gesture!=null){
                                gestureHandler(personKey,personInList.gesture,socket);//handles the guesture
                            }*/
                            if(receivedPerson.leftHandLocation!=null){
                                personInList.hands.left.location = receivedPerson.leftHandLocation;
                            }
                            if(receivedPerson.rightHandLocation!=null){
                                personInList.hands.right.location = receivedPerson.rightHandLocation;
                            }
                            if(personInList.ownedDeviceID != null) {
                                /**
                                 *  Check which hand/base the ownedDevice is paired to. Update the location based on
                                 *      the hands location if it's detected. Otherwise use base loaction.
                                 * */
                                switch(personInList.pairingState){
                                    case "leftHand":
                                        if(receivedPerson.leftHandLocation!=null){
                                            devices[personInList.ownedDeviceID].location.X = receivedPerson.leftHandLocation.X.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Y = receivedPerson.leftHandLocation.Y.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Z = receivedPerson.leftHandLocation.Z.toFixed(3);
                                        }else{
                                            devices[personInList.ownedDeviceID].location.X = receivedPerson.location.X.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Y = receivedPerson.location.Y.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Z = receivedPerson.location.Z.toFixed(3);
                                        }
                                        break;
                                    case "rightHand":
                                        if(receivedPerson.rightHandLocation!=null){
                                            devices[personInList.ownedDeviceID].location.X = receivedPerson.rightHandLocation.X.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Y = receivedPerson.rightHandLocation.Y.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Z = receivedPerson.rightHandLocation.Z.toFixed(3);
                                        }else{
                                            devices[personInList.ownedDeviceID].location.X = receivedPerson.location.X.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Y = receivedPerson.location.Y.toFixed(3);
                                            devices[personInList.ownedDeviceID].location.Z = receivedPerson.location.Z.toFixed(3);
                                        }
                                        break;
                                    case "base":
                                        devices[personInList.ownedDeviceID].location.X = receivedPerson.location.X.toFixed(3);
                                        devices[personInList.ownedDeviceID].location.Y = receivedPerson.location.Y.toFixed(3);
                                        devices[personInList.ownedDeviceID].location.Z = receivedPerson.location.Z.toFixed(3);
                                        break;
                                    default:
                                        console.log("unknown pairing state: "+personInList.pairingState);
                                }

                            }
                            //console.log("\t->received Peron got updated " + "with personList.");
                            receivedPersonProcessed = true;    // set the lock to true indicate the receivedPersons has been processed
                            callback({skeletonID:receivedPerson.ID,uniquePersonID:personInList.uniquePersonID})
                            //console.log("udpate Person hand "+JSON.stringify(personInList.hands));
                            eachSeriesCallback();
                        }catch (e){
                            console.log("error update person with existing ID: "+e);
                        }
                    }// END of currentattractedBy
                    else{
                        //console.log("receivedPerson is in ID list, but not currenly tracked by this sensor");
                        if(receivedPerson.gesture != null){
                            console.log("person detected "+receivedPerson.gesture+" but not tracked by this sensor");
                            //gestureHandler(personKey,personInList.gesture,socket);//handles the guesture
                        }
                        eachSeriesCallback();
                    }
                }else{
                    //  The receivedPerson that is not in  this person list
                    if(util.distanceBetweenPoints(personInList.location, receivedPerson.location) < nearestDistance){
                        //
                        nearestDistance= util.distanceBetweenPoints(personInList.location, receivedPerson.location);
                        nearestPersonID = personKey;
                        eachSeriesCallback();
                    }else{
                        eachSeriesCallback();
                    }

                }
            }// if person key actually exitst
        },function(err){
            // found the closes person in list for this receivedPerson, see if the distance is within the threshold
            if(receivedPersonProcessed == false) // if the received person hasn't been processed
            {
                if (nearestDistance < 0.4) {
                    //console.log("Done with all persons."+" with closest person: "+nearestPersonID+" ,distance: "+nearestDistance);
                    // if the sensor hasn't been registered to the person's seen-by-sensor list, and the person isn't used in any other person's list

                    if ((existingID.indexOf(receivedPerson.ID) == -1) && persons[nearestPersonID].ID[receivedPerson.ID] == undefined) {
                        //console.log('person '+persons[nearestPersonID].uniquePersonID+' is now tracked by ' + socket.id);
                        //locator.removeUntrackedPersonID(persons[nearestPersonID].ID, receivedPerson.ID,socket)
                        console.log('-> Merging person to ' + persons[nearestPersonID].uniquePersonID + ' with nearestDistance : ' + nearestDistance);
                        var foundSensorSocketInPersonID = util.findKeyByValue(persons[nearestPersonID].ID,socket.id);
                        if(foundSensorSocketInPersonID!=false){
                            console.log("Person already contains sensor ID. Deleting.");
                            delete persons[nearestPersonID].ID[foundSensorSocketInPersonID];
                        }
                        persons[nearestPersonID].ID[receivedPerson.ID] = socket.id;
                        persons[nearestPersonID].gesture = receivedPerson.gesture;
                        persons[nearestPersonID].lastUpdated = new Date();
                        console.log('->-> Person ' + persons[nearestPersonID].uniquePersonID + ' ID length: (' + Object.keys(persons[nearestPersonID].ID).length + ') with details: ' + JSON.stringify(persons[nearestPersonID].ID));
                        callback({skeletonID:receivedPerson.ID,uniquePersonID:persons[nearestPersonID].uniquePersonID});
                    }else{
                        callback(null)
                    }
                } // out side of the threshold
                else {
                    //locator.removeUntrackedPersonID(persons[key].ID, receivedPerson.ID,socket);
                    //end of iterations, person not found and not near a tracked person
                    //util.findWithAttr(persons,'ID',receivedPerson.ID);
                    if ((existingID.indexOf(receivedPerson.ID) == -1) && (receivedPerson.ID != undefined) && (receivedPerson.location != undefined)) { //if provided an ID and a location, update
                        if((receivedPerson.trackingState == 1)){
                            var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
                            person.lastUpdated = new Date();
                            person.currentlyTrackedBy = socket.id;
                            person.gesture = receivedPerson.gesture;
                            if (person.gesture != null) {
                                gestureHandler(person.uniquePersonID, person.gesture, socket);//handles the guesture
                            }
                            persons[person.uniquePersonID] = person;
                            console.log('-> Register new person ' + person.uniquePersonID + ' since the distance off by ' + nearestDistance + ' with ID:' + JSON.stringify(person.ID) + ' by sensor :' + socket.id);
                            callback({skeletonID:receivedPerson.ID,uniquePersonID:person.uniquePersonID});
                        }else{
                            callback(null);
                            //console.log("\t->A new person detected, though not sure if it is a person yet. TrackingState: "+receivedPerson.trackingState);
                        }

                    }
                }
            }
        })


/*
        for(var key in persons){
            counter --;
            if(persons.hasOwnProperty(key)){
                existingID = existingID.concat(Object.keys(persons[key].ID));
                //console.log(persons[key].currentlyTrackedBy + " == " + socket.id)
                // the received the person's ID exists in a person's ID list AND this person is tracked by this sensor
                if(persons[key].ID[receivedPerson.ID] != undefined && persons[key].currentlyTrackedBy == socket.id){
                    //person found and updating person's new information and device information
                    //console.log('Found and updating person :' + key);
                    //console.log('Person '+persons[key].uniquePersonID+' gesture: ' + receivedPerson.gesture);
                    try{
                        persons[key].location.X = receivedPerson.location.X.toFixed(3);
                        persons[key].location.Y = receivedPerson.location.Y.toFixed(3);
                        persons[key].location.Z = receivedPerson.location.Z.toFixed(3);
                        persons[key].lastUpdated = new Date();
                        persons[key].gesture = receivedPerson.gesture;
                        // handles the person's gesture.
                        if(persons[key].gesture != null){
                            gestureHandler(key,persons[key].gesture,socket);//handles the guesture
                        }

                        if(persons[key].ownedDeviceID != null){
                            devices[persons[key].ownedDeviceID].location.X = receivedPerson.location.X.toFixed(3);
                            devices[persons[key].ownedDeviceID].location.Y = receivedPerson.location.Y.toFixed(3);
                            devices[persons[key].ownedDeviceID].location.Z = receivedPerson.location.Z.toFixed(3);
                        }
                        break;


                    }
                    catch(err){
                        console.log("Error updating person: " + err)
                        //if null or cannot read for some other reason... remove null
                        if(persons[key] == null){
                            delete persons[key];
                        }
                    }
                }
                // this person comes in with a new ID
                else{
                    //console.log('counter: '+counter);
                    //// updating the nearest person
                    if(util.distanceBetweenPoints(persons[key].location, receivedPerson.location) < nearestDistance){

                        nearestDistance= util.distanceBetweenPoints(persons[key].location, receivedPerson.location);
                        nearestPersonID = key;
                        // reach the end of the people list   
                    }
                    if(counter == 0){
                        // check if the nearest person is within the threshold, merge the person into the existing person
                        if(nearestDistance < 0.4){
                            // if the sensor hasn't been registered to the person's seen-by-sensor list
                            if((existingID.indexOf(receivedPerson.ID)==-1) && persons[nearestPersonID].ID[receivedPerson.ID]==undefined ){
                                console.log('person '+persons[nearestPersonID].uniquePersonID+' is now tracked by ' + socket.id);
                                //locator.removeUntrackedPersonID(persons[nearestPersonID].ID, receivedPerson.ID,socket)
                                console.log('-> Merging person to '+persons[nearestPersonID].uniquePersonID+' with nearestDistance : ' + nearestDistance);
                                persons[nearestPersonID].ID[receivedPerson.ID] = socket.id;
                                persons[nearestPersonID].gesture = receivedPerson.gesture;
                                persons[nearestPersonID].lastUpdated = new Date();
                                // handle the person's guesture
                                if(persons[nearestPersonID].gesture != null){
                                    gestureHandler(nearestPersonID,persons[nearestPersonID].gesture,socket);//handles the guesture
                                }
                                console.log('->-> Person ' + persons[nearestPersonID].uniquePersonID +' list ('+Object.keys(persons[nearestPersonID].ID).length+') with details: '+JSON.stringify(persons[nearestPersonID].ID));
                            }
                        } // out side of the threshold
                        else{
                            locator.removeUntrackedPersonID(persons[key].ID, receivedPerson.ID,socket);
                            //end of iterations, person not found and not near a tracked person

                            //util.findWithAttr(persons,'ID',receivedPerson.ID);
                            console.log('\t->-> new person trackingState: ' + receivedPerson.trackingState +' not existed :'+ (existingID.indexOf(receivedPerson.ID)==-1));
                            if((existingID.indexOf(receivedPerson.ID)==-1) && (receivedPerson.trackingState==1)&&(receivedPerson.ID != undefined) && (receivedPerson.location != undefined)){ //if provided an ID and a location, update
                                var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
                                person.lastUpdated = new Date();
                                person.currentlyTrackedBy = socket.id;
                                person.gesture = receivedPerson.gesture;
                                if(person.gesture != null){
                                    gestureHandler(key,persons[key].gesture,socket);//handles the guesture
                                }
                                persons[person.uniquePersonID] = person;
                                console.log('-> Register new person '+person.uniquePersonID+' since the distance off by '+ nearestDistance +' with ID:'+JSON.stringify(person.ID)+' by sensor :' + socket.id);
                            }

                        }
                    }
                }// end of "Come of new ID"
            }
        }*/
    }
}; // end of update people list

/*
 *
 * */
exports.removeIDsNoLongerTracked = function(socket, newListOfPeople){
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            // for all the keys in current person's ID list
            for(var IDkey in persons[key].ID){
                //if current sensor socket ID is exists in the current person's ID list, and this sensor ID doesn't exit in the new list of people
                if(persons[key].ID[IDkey] == socket.id && util.findWithAttr(newListOfPeople, "ID", IDkey) == undefined){
                    try{
                        if(Object.keys(persons[key].ID).length > 1){
                            console.log('Person :'+persons[key].uniquePersonID+' currentlyTrackedBy before: ' + persons[key].currentlyTrackedBy +' seen by: '+ JSON.stringify(persons[key].ID) + ' deleting : '+persons[key].ID[IDkey]);//persons[key].ID[Object.keys(persons[key].ID)[0]]);
                            delete persons[key].ID[IDkey];
                            if(persons[key].currentlyTrackedBy == socket.id){
                                /*var i = 0;  // counter for person in person id list
                                do{*/
                                    //console.log('\t->->-> Do while loop : ' + persons[key].uniquePersonID);
                                    persons[key].currentlyTrackedBy = persons[key].ID[Object.keys(persons[key].ID)[0]];//Object.keys(persons[key].ID)[0];
                                    /*i++;
                                }while(persons[key].currentlyTrackedBy == socket.id && i <= 15)*/

                                console.log('person ' + key + ' is changed to seen by: ' + persons[key].currentlyTrackedBy);
                            }
                        }else{
                            delete persons[key].ID[IDkey];
                            console.log('-> Delete Person '+persons[key].uniquePersonID+ ' it is seen by '+ Object.keys(persons[key].ID).length + ' sensors');
                            //delete persons[key];
                        }
                    }
                    catch(err){
                        console.log("failed to update currentlyTrackedBy to new socket.id: " + err);
                    }

                }
            }
        }
    }// end of for in loop
}


// Remove all the people doesn have ID in it
exports.removeUntrackedPeople = function(timeOutInMS,socket){
    var now = new Date();
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            //console.log('-> now: '+now.getTime());
            //console.log('-> lastUpdated: '+ persons[key].lastUpdated.getTime());
            //console.log('-> difference: '+ (now.getTime()-persons[key].lastUpdated));
            if(Object.keys(persons[key].ID).length == 0 && (now.getTime()-persons[key].lastUpdated) > timeOutInMS ){
                //console.log('-> Timed out (' + timeOutInMS + ' ms), deleting person ' + persons[key].uniquePersonID);
                //could refactor using promises or callback
                locator.iBeaconService.personLeavesKinnectView(persons[key]);

                if(persons[key].ownedDeviceID != null){
                    if(persons[key].pairingState!="unpaired"){
                        console.log("paired");
                        frontend.clients[persons[key].ownedDeviceID].emit("pairedPersonDisappear",{PersonID:persons[key].uniquePersonID,location:persons[key].location})
                    }
                    devices[persons[key].ownedDeviceID].ownerID = null;
                    devices[persons[key].ownedDeviceID].pairingState = "unpaired";
                    delete persons[key];

                }
                else{
                    delete persons[key];
                }
            }
        }
    }
}

//
exports.removeUntrackedPersonID = function(personIDList,receivedPersonID,sensorSocket){
    // if received person is not in person's ID list
    console.log('\t->-> im in!');
    if(personIDList[receivedPersonID]==undefined){
        // if the sensor socket.id exists
        console.log('\t->-> existing ID: '+ util.findKeyWithAttr(personIDList,sensorSocket.id));
        if(util.findKeyWithAttr(personIDList,sensorSocket.id)!=null){

            console.log('\t-> Deleting '+util.findKeyWithAttr(personIDList,sensorSocket.id)+' from ' + JSON.stringify(personIDList));
            delete personIDList[util.findKeyWithAttr(personIDList,sensorSocket.id)];
        }
    }
}

exports.pairAndNotify = function(deviceSocketID, uniquePersonID,pairType){
    devices[deviceSocketID].ownerID = uniquePersonID;
    devices[deviceSocketID].pairingState = pairType;
    //devices[deviceSocketID].loaction = persons[uniquePersonID].location;
    frontend.clients[deviceSocketID].emit("devicePaired", {
        name: devices[deviceSocketID].name,
        ID: devices[deviceSocketID].uniqueDeviceID,
        deviceType: devices[deviceSocketID].deviceType,
        ownerID: uniquePersonID
    });
}
/**
 * pairType:
 *      base        - baseJoint, belly area of skeleton
 *      leftHand    - leftHandJoint of skeleton
 *      rightHand   - right hand joint of skeleton
 *      unpaired    - no paired
 * */
exports.pairDevice = function(deviceSocketID, uniquePersonID,pairType,socket,callback){
    var statusMsg = "Device Socket ID: " + deviceSocketID +
        " - Person ID: " + uniquePersonID;
    //console.log(pairType);

    if(locator.devices[deviceSocketID] != undefined && locator.persons[uniquePersonID] != undefined){
        if(locator.devices[deviceSocketID].pairingState == "unpaired" && persons[uniquePersonID].pairingState == "unpaired"){
            // pair device with person
            locator.pairAndNotify(deviceSocketID, uniquePersonID,pairType);
            // pair person with device
            persons[uniquePersonID].ownedDeviceID = deviceSocketID;
            persons[uniquePersonID].pairingState = pairType;
            statusMsg += "\n Pairing successful.";
            console.log(statusMsg);
            frontend.clients[deviceSocketID].emit("gotPaired",{device:locator.devices[deviceSocketID].uniqueDeviceID,person:persons[uniquePersonID].uniquePersonID,status:"success"});
        }
        else{
            statusMsg += "\nPairing attempt unsuccessful";
            if(locator.devices[deviceSocketID].pairingState != "unpaired"){
                statusMsg += "Device unavailable for pairing.";
            }
            if(persons[uniquePersonID].pairingState != "unpaired"){
                statusMsg += "Person unavailable for pairing.";
            }
            console.log(statusMsg);
            frontend.clients[deviceSocketID].emit("gotPaired",{device:devices[deviceSocketID].uniqueDeviceID,person:persons[uniquePersonID],status:statusMsg});
        }
    }
    else{
        statusMsg += "Pairing attempt unsuccessful. One or both objects were not found.";
        //frontend.clients[deviceSocketID].emit("gotPaired",{deviceID:locator.devices[deviceSocketID].uniqueDeviceID,personID:persons[uniquePersonID],status:statusMsg});
        console.log(JSON.stringify(locator.devices[deviceSocketID]) + " -\n " + JSON.stringify(persons[uniquePersonID]) );
    }
    socket.send(JSON.stringify({"status": statusMsg, "ownerID": uniquePersonID}));
    /*if(callback!=undefined){
        try{
            callback();
        }catch(e){
            console.log("unable to call callback function " + e);
        }
    }else{
        console.log("no callback has been defined.");
    }*/
}

//tested
exports.printPersons = function(){
    console.log("People tracked: ");
    try{
        console.log("There are "+object.keys(persons).length+" people in this view."); // adding sensor ID if possible

        for(var key in persons){
            if(persons.hasOwnProperty(key)){
                console.log("The "+object.keys(persons).indexOf(key)+"th Person --> "
                    + JSON.stringify(persons[key], null, 2));
                //console.log(JSON.stringify(persons[key].uniquePersonID))
            }
        }
    }
    catch(err){
        console.log("Error printing people: \t" + err);
        return false;
    }
    console.log("///////////////////////////////////////////////////////////////");
    return true;
}

exports.setPairingState = function(deviceSocketID){
    if(devices[deviceSocketID] != null){
        devices[deviceSocketID].pairingState = "pairing";
    }
}

exports.unpairDeviceAndPerson = function(deviceSocketID, uniquePersonID){
    if(devices[deviceSocketID] != undefined && devices[deviceSocketID] != null){
        try{
            devices[deviceSocketID].pairingState = "unpaired";
            devices[deviceSocketID].location.X = null;
            devices[deviceSocketID].location.Y = null;
            devices[deviceSocketID].location.Z = null;
            devices[deviceSocketID].ownerID = null;
        }
        catch(err){
            console.log("Failed to unpair device, possibly device no longer tracked: \t" + err);
        }
        try{
            frontend.clients[deviceSocketID].emit("deviceUnpaired", {
                name: devices[deviceSocketID].name,
                ID: devices[deviceSocketID].uniqueDeviceID,
                deviceType: devices[deviceSocketID].deviceType
            });
        }
        catch(err){
            console.log("Failed to emit unpaired event to device: \t" + err);
        }
    }

    if(persons[uniquePersonID] != undefined && persons[uniquePersonID] != null){
        try{
            persons[uniquePersonID].pairingState = "unpaired";
            persons[uniquePersonID].ownedDeviceID = null;
            persons[uniquePersonID].orientation.yaw = null;
        }
        catch(err){
            console.log("Failed to unpair person: \t" + err);
        }
    }
}

exports.unpairDevice = function(deviceSocketID){
    try{
        locator.unpairDeviceAndPerson(deviceSocketID, devices[deviceSocketID].ownerID);
    }
    catch(err){
        console.log("Failed trying to unpair device, perhaps device is no longer tracked: \t" + err)
    }
}

exports.unpairAllDevices = function(){
    for(var key in devices){
        if(devices.hasOwnProperty(key)){
            locator.unpairDevice(key);
        }
    }
}

exports.unpairPerson = function(uniquePersonID){
    try{
        locator.unpairDeviceAndPerson(persons[uniquePersonID].ownedDeviceID, uniquePersonID);
    }
    catch(err){
        console.log("Failed trying to unpair person, perhaps person is no longer tracked: \t" + err);
    }
}

exports.unpairAllPeople = function(){
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            locator.unpairPerson(key);
        }
    }
}

exports.updateDeviceOrientation = function(orientation, socket){
    if(devices[socket.id] != undefined){
        try{
            locator.devices[socket.id].orientation = orientation;
            locator.devices[socket.id].lastUpdated = new Date();
            if(devices[socket.id].ownerID != null){
                locator.persons[devices[socket.id].ownerID].orientation = orientation;
            }
            //console.log("update orientation: "+JSON.stringify(locator.devices[socket.id]));
        }
        catch(err){
            //if null or cannot read for some other reason... remove null
            if(devices[socket.id] == null){
                delete devices[socket.id];
            }
        }
    }
    else{
        /*if(orientation != undefined){
            var device = new factory.Device(socket);
            device.orientation = orientation;
            device.lastUpdated = new Date();
            devices[socket.id] = device;
        }*/
        //console.log("update orientaion of a device hasn't registered");
    }
}

/*
 *   clean up the dataPoints that is disconnected
 * */
exports.cleanUpDataPoint = function(socketID){
    // simply delete this data point for now
    for(var key in dataPoints){
        if(dataPoints.hasOwnProperty(key) && dataPoints[key].socketID == socketID){
            console.log('-> dataPoints Client: '+ key+' has been cleaned');
            // clean up the dataPoints that is disconnected
            delete locator.dataPoints[key];
        }
    }

    //refresh visualizer
    frontend.io.sockets.emit("refreshStationaryLayer", {});
}

exports.cleanUpDevice = function(socketID){
    var personID = devices[socketID].ownerID;
    if(devices[socketID].pairingState != "unpaired" && personID != null){
        if(persons[personID] != undefined){
            persons[personID].ownedDeviceID = null;
            persons[personID].pairingState = "unpaired";
            persons[personID].orientation = null;
        }
        else{
            //person is no longer tracked
        }
    }

    delete devices[socketID];
    frontend.io.sockets.emit("refreshStationaryLayer", {});
}


// handles clean up sensor request
exports.cleanUpSensor = function(socketID,socket){
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    //delete sensors[socketID];
    util.recursiveDeleteKey(locator.sensors,socketID).then(function(callback){
        switch(callback.toLowerCase()) {
            case 'kinects':
                console.log("a kinect disconnected");
                var counter = Object.keys(locator.persons).length;
                //delete sensor keys in people object list
                for (var key in locator.persons) {
                    counter--;
                    if (locator.persons.hasOwnProperty(key)) {
                        for (var IDkey in locator.persons[key].ID) {
                            if (locator.persons[key].ID.hasOwnProperty(IDkey)) {
                                if (locator.persons[key].ID[IDkey] == socketID) {
                                    delete locator.persons[key].ID[IDkey];
                                    if (counter == 0) {
                                        locator.removeUntrackedPeople(0,socket);
                                    }
                                }
                            }
                        }
                    }
                }

                // handles reference sensor for locator
                if (locator.kinectSensorsReference.socketID == socketID) {
                    if (Object.keys(sensors.kinects).filter(function (key) {
                        return(sensors.kinects[key].isCalibrated)
                    }).length > 0) {
                        var secondCalibratedSensor = sensors.kinects[Object.keys(sensors.kinects).filter(function (key) {
                            return(sensors.kinects[key].isCalibrated)
                        })[0]];
                        // set the second calibrat
                        secondCalibratedSensor.isCalibrated = true;
                        secondCalibratedSensor.calibration = secondCalibratedSensor.calibration; //{Rotation: 0, TransformX: 0, TransformY: 0,xSpaceTransition:0,ySpaceTransition:0, StartingLocation: {X: 0, Y: 0, Z: 0}};
                        locator.kinectSensorsReference = secondCalibratedSensor;
                        console.log('Reference sensor is set to ' + JSON.stringify(locator.kinectSensorsReference));
                    }
                    else {
                        if (Object.keys(sensors.kinects).length != 0) {
                            sensors.kinects[Object.keys(sensors.kinects)[0]].isCalibrated = true;
                            locator.kinectSensorsReference = sensors.kinects[Object.keys(sensors.kinects)[0]]
                        }
                        else {
                            locator.kinectSensorsReference = null;
                        }
                    }
                }
                else {
                    console.log("All good, removed sensor is not reference");
                };
                break;
            case "leapmotions":
                //TODO: Handle leapMotion Deletion Process
                console.log("leapMotion disconnected .. ");

                break;
            case "ibeacons":
                console.log("iBeacon disconnnected");
                locator.iBeaconService.cleanUp(socketID);
                break;
            default:
                console.log("unknown type sensor dc'ed: " + callback);
        }// end of check type
    }).catch(function(error){console.log("error on delete sensor from list: " + error);}).done();// End of 1st then
};
/*
 Update a registered device with a new device info
 */
exports.updateDevice = function(socketid,deviceInfo,fn){

    if(devices[socketid] != undefined){
        console.log('Updating Device ' + devices[socketid].uniqueDeviceID +' with device info: '+JSON.stringify(deviceInfo));
        for(var key in deviceInfo){
            devices[socketid][key] = deviceInfo[key];
        }
    }else{
        console.log("got a device update request but the device hasn't been registered yet");
    }
    if(fn!=undefined){
        fn(devices[socketid]);
    }
}

/*
 * Registering data with data info
 *
 * */
exports.registerData = function (dataInfo,fn){
    //console.log('received data: ' + JSON.stringify(dataInfo));
    try{
        if(data[dataInfo.name]==undefined){
            var newData = new factory.data(dataInfo.name,dataInfo.type,dataInfo.dataPath,dataInfo.range);
            data[newData.name] = newData;
            console.log('-> registered data: '+ JSON.stringify(data[newData.name]));
        }else{
            console.log('-> '+ dataInfo.name+  ' has been registered');
        }
    }catch(err){
        console.log('Unable to register data due to: '+ err);
    }
}

/*
 *   Registering dataPoint with dataPoint info
 * */
exports.registerDataPoint = function(socket,dataPointInfo,fn){
    console.log('received dataPoint' + JSON.stringify(dataPointInfo));
    var registerData = {};
    try{
        var registerData;
        dataPointInfo.data.forEach(function(dataName){
            registerData[dataName]=data[dataName];
        })
        

        var location = dataPointInfo.location;
        if (location == undefined)
            location = {X: dataPointInfo.locationX, Y: dataPointInfo.locationY, Z: dataPointInfo.locationZ};

        var observer = dataPointInfo.observer;
        if (observer == undefined)
            observer  = { observerType: dataPointInfo.observerType, observeWidth: dataPointInfo.observeWidth, observeHeight: dataPointInfo.observeHeight, observerDistance: dataPointInfo.observerDistance };

        var subscriber = dataPointInfo.subscriber;
        if (subscriber == undefined)
            subscriber = {subscriberType: dataPointInfo.subscriberType, ID: dataPointInfo.ID };

        var dataPoint = new factory.dataPoint(location,socket.id,dataPointInfo.dropRange,registerData,observer,subscriber);
        frontend.clients[socket.id].clientType = "dataPointClient";
        dataPoints[dataPoint.ID] = dataPoint; // reigster dataPoint to the list with its ID as its key
        //console.log('all data points: ' +JSON.stringify(dataPoints));
        console.log('new datapoint: ' + JSON.stringify(dataPoint));
        if(fn!=undefined){
            fn(dataPoints[socket.id]);
        }
        // fresh visualizer
        frontend.io.sockets.emit("refreshStationaryLayer", {});
    }catch(err){
        console.log('failed registering data point due to: '+err);
    }
}

exports.registerDevice = function(socket, deviceInfo,fn){
    console.log(JSON.stringify(devices[socket.id]) + '\tdeviceInfo: '+ JSON.stringify(deviceInfo));
    if(devices[socket.id] != undefined){
        devices[socket.id].depth = deviceInfo.depth;
        devices[socket.id].width = deviceInfo.width;
        devices[socket.id].height = deviceInfo.height;
        devices[socket.id].deviceType = deviceInfo.deviceType;
        devices[socket.id].location = {X: deviceInfo.locationX, Y: deviceInfo.locationY, Z: deviceInfo.locationZ}
        if(deviceInfo.location!=undefined){
            devices[socket.id].location = {X: deviceInfo.location.X, Y: deviceInfo.location.Y, Z: deviceInfo.location.Z}
        }
        console.log("Device initiated late, updating height and width");
    }
    else{
        // if client is running on server side, the socket IP will be localhost ip
        // here to set that to actual server IP
        var socketIP;
        if(socket.handshake.address.address=='127.0.0.1' && frontend.serverAddress!=undefined){
            console.log(socket.handshake.address.address+' --> ' + frontend.serverAddress);
            socketIP = frontend.serverAddress;
        }else{
            socketIP = socket.handshake.address.address;
        }
        //console.log("Orientation: "+JSON.stringify(deviceInfo.orientation));
        //console.log('got deviceInfo.ID'+ deviceInfo.ID);
        var device = new factory.Device(socket, {ID: deviceInfo.ID, orientation: deviceInfo.orientation});
        if(deviceInfo.name != null && deviceInfo.name != undefined){
            device.name = deviceInfo.name;
        }
        else{
            device.name = "Device " + device.ID;
        }

        if(deviceInfo.observer != undefined) {device.observer = deviceInfo.observer;}
        if(deviceInfo.depth!=undefined){
            device.depth = deviceInfo.depth;
        }else{
            console.log("depth value is not defined in the depth value. Setting it to default : 1");
            device.depth = 1;
        }
        device.width = deviceInfo.width;
        device.height = deviceInfo.height;
        device.deviceType = deviceInfo.deviceType;
        device.FOV = deviceInfo.FOV;
        device.lastUpdated = new Date();
        device.deviceIP = socketIP;
        if(typeof(deviceInfo.orientation)=="number"){
            //console.log("orientation in deviceInfo is not defined as pitch and yaw. Setting pitch to default : 0");
            device.orientation = {pitch:0,yaw:deviceInfo.orientation};
        }else{
            //console.log(deviceInfo.orientation);
            device.orientation = deviceInfo.orientation;
        }

        if(device.orientation != undefined){
            if(device.orientation.yaw>=360){
                device.orientation.yaw = device.orientation.yaw % 360;
            }
        }
        // JSclient may register deivce with location as well.
        if(deviceInfo.location!=undefined){
            device.location = {X: deviceInfo.location.X, Y: deviceInfo.location.Y, Z: deviceInfo.location.Z}
        }else{
            if(deviceInfo.locationX !=undefined){
                device.location = {X: deviceInfo.locationX, Y: deviceInfo.locationY, Z: deviceInfo.locationZ}
            }
        }
        // for stationary layer refreshes
        if(deviceInfo.stationary == true){
            device.stationary = deviceInfo.stationary;
            //device.location = {X: deviceInfo.locationX, Y: deviceInfo.locationY, Z: deviceInfo.locationZ}
            frontend.io.sockets.emit("refreshStationaryLayer", {});
        }

        devices[socket.id] = device; // officially register the device to locator(server)
        try{
            socket.broadcast.emit("someDeviceConnected", { name: deviceInfo.name, ID: locator.devices[socket.id].uniqueDeviceID,deviceType: deviceInfo.deviceType});
        }
        catch(err){
            console.log("Error emitting name or ID, device may still be registering: " + err);
        }
        console.log("Registering device: " + JSON.stringify(device)+"\n");
        //console.log('emitting registered device ID : '+ locator.devices[socket.id].uniqueDeviceID);
        if (fn != undefined) {
            console.log('callback with' + JSON.stringify({ID:devices[socket.id].uniqueDeviceID,status:"registered",entity:devices[socket.id],deviceID:device.uniqueDeviceID,socketID:socket.id,currentDeviceNumber:Object.keys(locator.devices).length,orientation:device.orientation}));
            fn({ID:devices[socket.id].uniqueDeviceID,status:"registered",entity:devices[socket.id],deviceID:device.uniqueDeviceID,socketID:socket.id,currentDeviceNumber:Object.keys(locator.devices).length,orientation:device.orientation});
        }

        switch(deviceInfo.deviceType) {
            case "iBeaconRcvr":
                console.log("Device Type is iBeaconRcvr");
                locator.iBeaconService.registerIBeaconRcvrHandler(socket, deviceInfo, fn);
                break;
            case "Tango":
                console.log("A tango tries to register.");
                break;
            default:
        }


    }
}



/*
 *   The observer could be a device.
 *   location, height, width shall all be defined.
 * */
exports.getIntersectionPointInRoom = function(observer,callback){
    //console.log("In Projection observerOrientation: "+ JSON.stringify(observer.orientation));
    // pitch as z rotation, yaw as Y rotation
    var room = locator.room;
    var observerHeight = observer.location.Y;
    var pitchRad = observer.orientation.pitch * util.DEGREES_TO_RADIANS;
    util.isInRect(observer.location,room.location,room.length,room.depth,function(observerInRoom){
        if(observerInRoom) {
            //console.log('orientation: '+JSON.stringify(observer.orientation));
            if (observer.orientation.pitch > 0) { // if the observer is looking up
                var hit = "ceiling"
                var projectionFromHeight = (room.location.Y + room.height - observerHeight) / Math.tan(pitchRad);   //get the projection from the Y location of the observer
                var intersectedY = room.location.Y + room.height;
            } else if(observer.orientation.pitch < 0){  // if the observer is looking down
                var projectionFromHeight = observerHeight / Math.tan(pitchRad);   //get the projection from the Y location of the observer
                var intersectedY = room.location.Y;
                var hit = "floor"
            }else {
                var hit = "neither";
            }
            var initialVector = {X:1,Y:0,Z:0};
            // use water fall to chain the tasks.
            async.parallel([
                //check floor and ceiling
                function (plcallback) {
                    if(hit != 'neither') {
                        //console.log();
                        util.translateOrientationToReference(observer,
                            function (orientationToReference) {
                               // console.log("Ori to Reference: "+orientationToReference);
                                util.matrixTransformation(initialVector, -orientationToReference, function (arg) {
                                  //  console.log("Direction Vector: "+JSON.stringify(arg)+" ProjectionFromHeight: "+projectionFromHeight);
                                    //console.log("direction: "+JSON.stringify(arg));
                                    //var observerSightIn2DV = factory.makeLineUsingOrientation(observer.location, orientationToReference);
                                    util.pointMoveToDirection(observer.location, arg, Math.abs(projectionFromHeight), function (movedLocation) {
                                        //console.log("MovedLocation: " + JSON.stringify(movedLocation));
                                        util.inRoom(movedLocation, function (inRoomBool) {
                                        // console.log("In room ? "+inRoomBool);
                                            if (inRoomBool == false) {
                                                plcallback(null, null);
                                            } else {
                                                movedLocation.Y = intersectedY;
                                                plcallback(null, {
                                                    side: hit,
                                                    intersectedPoint: movedLocation
                                                });
                                            }
                                        })
                                    })
                                })
                            })
                    }else{
                        plcallback(null,null);
                    }
                },
                function (plcallback) {
                    // check if intersected on four walls
                    util.getIntersectedWall(observer, function (result) {
                        //console.log(result);
                        plcallback(null, result)
                    })
                }
            ], function (err, result) {
                // filter out the null from parallel result.
                //console.log("ID: "+observer.uniqueDeviceID+" - "+JSON.stringify(result));
                var filteredResult = result.filter(function (element) {
                    return element != null && element != undefined;
                })
                if (filteredResult.length == 1) {
                    callback(filteredResult,{
                        type:observer.deviceType,
                        id:observer.uniqueDeviceID,
                        name:observer.name
                    });
                } else {
                    console.log("\t*Error trying to get intersection on wall" + "\n" +
                    "\tError Result: " + JSON.stringify(filteredResult));
                    callback(null,{
                        type:observer.deviceType,
                        id:observer.uniqueDeviceID,
                        name:observer.name
                    });
                }
            });
        }//end of if observer is in room
    })
    //return rotatedVector;
    //callback(projectionFromHeight)


}


// TODO: implement!
// TODO: test!
exports.calcIntersectionPointsForDevices = function(observerSocketID, devicesInFront,done){
    var returnDevices = {};
    util.translateOrientationToReference(locator.devices[observerSocketID],
    function(orientationToReference){
        //console.log('got orientation to reference: ' + orientationToReference);
        var observerLineOfSight = factory.makeLineUsingOrientation(locator.devices[observerSocketID].location, orientationToReference);
        if(devicesInFront!=undefined) {
            var intersectionPoints = [];
            async.each(devicesInFront,
                function(deviceInFront,deviceInFrontCallback){ // using async each function to iterate through the whole array
                    if (devices[deviceInFront] != undefined) {
                        if (devices[deviceInFront].width != null) {
                            var sides = util.getLinesOfShape(devices[deviceInFront]);

                            var intersectionPointWrap = {intersectionPoint:null,distance:1000,observerSocketID:locator.devices[observerSocketID].socketID,intersectedSocketID:locator.devices[deviceInFront].socketID,relevance:{X:0,Y:0}};
                            //console.log("Sides: " + JSON.stringify(sides))
                            async.each(sides,
                                // 2nd param is the function that each item is passed to
                                function(side, callback){
                                    util.getIntersectionPoint(observerLineOfSight, side).then(
                                        function(IntersectionPoint){
                                            //console.log("intersection point: " + JSON.stringify(IntersectionPoint));
                                            if (IntersectionPoint != null) {
                                                //console.log("Added an intersection point: " + JSON.stringify(intPoint))
                                                var distance = util.distanceBetweenPoints(devices[observerSocketID].location, IntersectionPoint);
                                                if(distance<=intersectionPointWrap.distance){
                                                    intersectionPointWrap.intersectionPoint = IntersectionPoint;
                                                    intersectionPointWrap.distance = distance;
                                                }
                                            }
                                            callback(); // callback when this iteration is done
                                        }
                                    );
                                },
                                // 3rd param is the function to call when everything's done
                                function(err){
                                    if(deviceInFrontCallback != undefined){
                                        try{
                                            if(intersectionPointWrap.distance!=1000){
                                                intersectionPointWrap.relevance.X = (intersectionPointWrap.intersectionPoint.X - locator.devices[intersectionPointWrap.intersectedSocketID].location.X)/(locator.devices[intersectionPointWrap.intersectedSocketID].width/2);
                                                // got which side the intersection point first hit. Added yValue of the intersection point in
                                                var yValue = (Math.tan(locator.devices[observerSocketID].orientation.pitch/180*Math.PI)*intersectionPointWrap.distance)////+devices[observerSocketID].height; // calculate
                                                intersectionPointWrap.intersectionPoint.Y = yValue+devices[observerSocketID].height;
                                                intersectionPointWrap.relevance.Y = (intersectionPointWrap.intersectionPoint.Y-devices[observerSocketID].location.Y)/(locator.devices[intersectionPointWrap.intersectedSocketID].height/2);  //Math.round((intersectionPointWrap.relevance/(devices[deviceInFront].width/2))*100)/100;
                                                intersectionPoints.push(intersectionPointWrap);
                                                //console.log(intersectionPointWrap.relevance.X+" - " +intersectionPointWrap.relevance.Y + "(yValue:"+yValue+")");
                                                //console.log("Observer location: "+ JSON.stringify(locator.devices[observerSocketID].location));
                                                deviceInFrontCallback(); // interation callback for outer each function
                                            }else{
                                                deviceInFrontCallback(null);
                                            }
                                        }catch(e){
                                            console.log(' error in callback: '+ e);
                                        }
                                    }else{
                                        //callback is empty
                                    }

                                }
                            );
                        }
                    }
                    else {
                        console.log("devices:\n " + JSON.stringify(devices))
                        console.log("devicesInFront:\n " + JSON.stringify(devicesInFront));
                        console.log("i:\n " + JSON.stringify(i));
                    }
                },function(err){
                    //console.log(intersectionPoints);
                    if(done != undefined){
                        try{
                            done(intersectionPoints);
                        }catch(e){
                            console.log(' error in callback: '+ e);
                        }
                    }else{
                        //callback is empty
                    }
                })

        }// end for checking devicesInfront undefined
    })// end of reference wit callback
}

// get all the devices that are in the view of the devices
exports.getDevicesInView = function(observerSocketID,deviceList){
    // get all the devices in front
    var devicesKeysInFront = this.getDevicesInFront(observerSocketID,deviceList);
    var returnList = {};
    // fill up the returnlist as the devices that are inFront ie. in the FOV
    for(var i=0;i<devicesKeysInFront.length;i++){
        returnList[devicesKeysInFront[i]] = locator.devices[devicesKeysInFront[i]];
    }
    return returnList;
}

/// Get all the devices that are in the FOV of the device
exports.getDevicesInFront = function(observerSocketID, deviceList){
    // List<Device> returnDevices = new List<Device>();
    var observer = locator.devices[observerSocketID];
    var returnDevices = {};
    //console.log("Observer: "+ JSON.stringify(observer));
    //console.log(observerSocketID + ' - ' + JSON.stringify(deviceList));
    //(CB - Should we throw an exception here? Rather then just returning an empty list?)
    if(observer!=undefined) {
        if (observer.orientation != undefined) { // check if observer orientation is null
            function filterFOV(observer, deviceList) {
                try {

                    if (observer.location == null || observer.orientation.yaw == null)
                        return returnDevices;
                    if (observer.FOV == 0.0)
                        return returnDevices;
                    if (observer.FOV == 360.0) {
                        return Object.keys(deviceList).filter(function (key) {
                            if (deviceList[key] != observer && deviceList[key].location != undefined) {
                                return true;
                            }
                        })
                    }
                }
                catch (err) {
                    console.log("Error getting devices in front of device FOV/Location" + ": " + err);
                }

            }

            // // We imagine the field of view as two vectors, pointing away from the observing device. Targets between the vectors are in view.
            // // We will use angles to represent these vectors.
            try {

                //get the angle to sens
                var angleToSensor = util.getObjectOrientationToSensor(observer.location.X, observer.location.Z);
                var leftFieldOfView = util.normalizeAngle(360 - observer.orientation.yaw - 90 - angleToSensor + (observer.FOV / 2));
                var rightFieldOfView = util.normalizeAngle(360 - observer.orientation.yaw - 90 - angleToSensor - (observer.FOV / 2));

                //console.log("Left FOV = " + leftFieldOfView)
                //console.log("Right FOV = " + rightFieldOfView)s

                return Object.keys(deviceList).filter(function (key) {
                    //var angle = util.normalizeAngle(Math.atan2(devices[key].location.Y - observer.location.Y, devices[key].location.X - observer.location.X) * 180 / Math.PI);
                    if (deviceList[key] != observer && deviceList[key].location != undefined) {
                        //console.log(deviceList[key].location);
                        if (leftFieldOfView > rightFieldOfView &&
                            (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView &&
                            (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView) {
                            return true;
                        }
                        else if (leftFieldOfView < rightFieldOfView) {
                            if ((util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView ||
                                (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView) {
                                return true;
                            }
                        }
                    }
                });
            }
            catch (err) {
                console.log("Error getting devices in front of device " + ": " + err);
            }
        } else { // end of checking observer orientation
            console.log("observer " + observer.uniqueDeviceID + " orientation is null.");
        }
    }else{
        console.log("Observer is undefined in get Devices in front");
    }
}

// TODO: test!
exports.getNearestDevice = function (observer, listDevices) {
    //recursive function to return nearest device, given an observer and a list of devices to compare
    var compareNextDeviceInList = function (keyIndexOfDeviceList, currentClosestDevice) {
        //if not end of recursion
        if (keyIndexOfDeviceList >= 0) {
            if(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].uniqueDeviceID == observer.uniqueDeviceID){
                return compareNextDeviceInList(keyIndexOfDeviceList - 1, currentClosestDevice);
            }
            else{
                //first call passes null as currentClosestDevice, pick device from list as currentClosestDevice
                if (currentClosestDevice == null) {
                    return compareNextDeviceInList(keyIndexOfDeviceList - 1, listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]])
                }

                //if device in list is closer to observer than currentClosestDevice, replace currentClosestDevice with device in list
                else if (util.distanceBetweenPoints(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].location, observer.location) <
                    util.distanceBetweenPoints(currentClosestDevice.location, observer.location)) {
                    return compareNextDeviceInList(keyIndexOfDeviceList - 1, listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]]);
                }
                //currentClosestDevice is closer to observer than device in list, no change
                else {
                    return compareNextDeviceInList(keyIndexOfDeviceList - 1, currentClosestDevice);
                }
            }
        }
        //end of recursion
        else {
            if(currentClosestDevice == null){
                return {};
            }
            else{
                var container = {};
                container[currentClosestDevice.socketID] = currentClosestDevice;
                return container;
            }
        }
    }

    return compareNextDeviceInList(Object.keys(listDevices).length - 1, null)
};

// TODO: test!
exports.getDevicesWithinRange = function (observer, maxRange, listDevices) {
    var filterDeviceListByRange = function (keyIndexOfDeviceList, listDevicesToReturn) {
        if (keyIndexOfDeviceList >= 0) {
            if(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].uniqueDeviceID == observer.uniqueDeviceID){
                return filterDeviceListByRange(keyIndexOfDeviceList - 1, listDevicesToReturn);
            }
            else if (util.distanceBetweenPoints(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].location, observer.location) > maxRange) {
                console.log(util.distanceBetweenPoints(listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]].location, observer.location));
                console.log(maxRange);
                return filterDeviceListByRange(keyIndexOfDeviceList - 1, listDevicesToReturn);
            }
            else {
                //check to see list is modified before sending as param in return recursive call
                listDevicesToReturn[Object.keys(listDevices)[keyIndexOfDeviceList]] = listDevices[Object.keys(listDevices)[keyIndexOfDeviceList]];
                return filterDeviceListByRange(keyIndexOfDeviceList - 1, listDevicesToReturn);
            }
        }
        //end of recursion
        else {
            return listDevicesToReturn;
        }
    }


    return filterDeviceListByRange(Object.keys(listDevices).length-1, {});
};

exports.getAllDevicesExceptSelf = function (ownSocket, deviceList){
    delete deviceList[key];
    return deviceList;
}

/*
 * get all the devices that is been paried
 * **/
exports.getPairedDevice = function(listDevices){
    var pairedDevices = {};
    if(Object.keys(listDevices).length!=0){
        for(var key in devices){
            if(devices.hasOwnProperty(key) && listDevices[key].pairingState != 'unpaired'){
                pairedDevices[key] = devices[key];
            }
        }
    }
    return pairedDevices;
}

exports.getDeviceByID = function (ID){
    try{
        var container = {};

        if(ID != undefined){
            if(devices[util.getDeviceSocketIDByID(ID)] != undefined){
                container[util.getDeviceSocketIDByID(ID)] = devices[util.getDeviceSocketIDByID(ID)];
                return container;
            }
            else{
                //no device with that ID
                return {};
            }
        }
        else{
            //ID undefined
            return {};
        }
    }
    catch(err){
        console.log('Error trying to get single device with ID(' + ID + '): ' + err);
    }
}

exports.getDataPointByID = function (ID){
    try{
        var container = {};

        if(ID != undefined){
            if(devices[ID] != undefined){
                container[ID] = devices[ID];
                return container;
            }
            else{
                //no device with that ID
                return {};
            }
        }
        else{
            //ID undefined
            return {};
        }
    }
    catch(err){
        console.log('Error trying to get single device with ID(' + ID + '): ' + err);
    }
}

exports.printDevices = function(){
    console.log("devices tracked: ");
    try{
        for(var key in devices){
            if(devices.hasOwnProperty(key)){
                console.log(JSON.stringify(devices));
            }
        }
    }
    catch(err){
        console.log("Error printing devices: " + err);
        return false;
    }
    console.log("///////////////////////////////////////////////////////////////");
    return true;
}

exports.uncalibrateSensor = function(sensorSocketID,fn){
    console.log('received id: ' + sensorSocketID)
    frontend.clients[sensorSocketID].emit('resetRule', '');


    //if(this sensor isn't the only calibrated sensor)
    //sets sensor to uncalibrated
    for(var key in sensors.kinects){
        if(sensors.kinects.hasOwnProperty(key)){
            if(sensors.kinects[key].isCalibrated && key!=sensorSocketID){
                sensors.kinects[sensorSocketID].isCalibrated = false;

            }
        }
    }
}

// send refreshstationaryLayer event to all the webclients
exports.refreshStationarylayer = function(){
    console.log("Refreshing stationary layer....");
    for(var key in frontend.clients){
        if(frontend.clients.hasOwnProperty(key)){
            //console.log(frontend.clients[key].clientType);
            if(frontend.clients[key].clientType == "webClient"){
                try{
                    frontend.clients[key].emit("refreshStationaryLayer");
                }catch(e){
                    console.log("unable to send refreshstationtaryLayer to webClients due to: "+ e);
                }
            }
        }
    }
}

// Emit event to paired device of a person
exports.emitEventToPairedDevice = function(person,eventName,payload){
    if(person.pairingState!="unpaired" && person.ownedDeviceID!=undefined){
        try{
            if(person.pairingState != "unpaired"){
                console.log("Emiting: "+eventName+" with palyload "+JSON.stringify(payload)+
                    " to "+locator.devices[person.ownedDeviceID].uniqueDeviceID+" with person:"+JSON.stringify(person));
                frontend.clients[person.ownedDeviceID].emit(eventName,payload);
            }
        }catch(e){
            console.log("Unable to emit to person's ownDevice due to: "+e);
        }
    }else{
        console.log("Person is not paired. Or the ownedDeviceID is undefined: " + JSON.stringify(person));
    }
}



//Handle setting changes on server
exports.changeSetting = function(type,property,value,callback){
    console.log('\t'+type + " - " +property + ' -> ' + value );
    switch(type){
        case "pulse":
            if(property=="inRangeEvents"||property=="inViewEvents"
                ||property=="sendIntersectionPoints"|| property=="roomIntersectionEvents"){
                pulse.eventsSwitch[property]=value;
                callback(true);
            }else{
                callback(false)
            }
            break;
        case "room":
            callback(false);
            break;
        default:
            console.log(" Unknow settting change request: "+type);
            callback(false);
    }
}

//save current state of SOD into a file
var stateCounter = 0;
exports.saveCurrentState = function(){
    var currentState = {stateID:stateCounter++, devices:locator.devices, sensors:locator.sensors,
        room:{
            location:locator.room.location,
            length:locator.room.length,
            depth:locator.room.depth,
            height:locator.room.height
        },
        timestamp:null};
    dataService.saveDataToFile(JSON.stringify(currentState,null,4),"data/reserved/config.json",function(err){
        if(err==1){
            //file successfully saved. 1 - success
            try{
                configuration = currentState;
                Object.keys(devices).forEach(function(deviceKey){
                    frontend.clients[deviceKey].emit("rememberWhoYouAre",
                        {
                            stateID:currentState.stateID,
                            type:locator.devices[deviceKey].deviceType,
                            ID: locator.devices[deviceKey].uniqueDeviceID
                        });
                })
            }catch(e){
                console.log("error emitting rememberWhoYouAre");
            }
        }else{
            console.log("Err while save to file: "+err );
        }
    })
}

exports.loadConfig = function(){
    //console.log();
    dataService.loadJSONWithCallback("data/reserved/config.json",function(callback){
        if(callback!=null){
            //console.log(callback);
            console.log("Config file loaded..");
            configuration = callback;
            locator.room = new factory.Room(configuration.room.location,configuration.room.length,configuration.room.depth,configuration.room.height);
            /*Object.keys(configuration.sensors.iBeacons).forEach(function(configBeaconKey){
                locator.sensors.iBeacons[configBeaconKey] = configuration.sensors.iBeacons[configBeaconKey];
            })*/
            locator.sensors.iBeacons = configuration.sensors.iBeacons;

            //console.log(JSON.stringify(locator.room,null,4));
        }
    })
}
//
//  Load and modify the config file based on
//      entity:
//                  -   iBeacon , save the current state of the iBeacon transmitters
//      action:
/*                    -   1      save the current sate of the
                      -   0      clear all the entity in config file
// */
exports.loadModifySaveCurrentState_single = function(entity,action,finalCallback){
    var configSensorCounter = 500;
    dataService.loadJSONWithCallback("data/reserved/config.json",function(callback){
        if(callback!=null){
            //console.log(callback);
            var current_config= callback;
            current_config.stateID ++;
            //console.log("Config file loaded.."+JSON.stringify(configuration,null,4));
            switch(entity){
                case "iBeacon":
                    // performs the action for storing current iBeacon state
                    if(action==1) {
                        async.each(Object.keys(sensors.iBeacons), function (iBeaconKey, eachCallback) {
                            if (sensors.iBeacons[iBeaconKey].isDevice == false && sensors.iBeacons[iBeaconKey].isFromConfig==false) {
                                console.log("found one beacon");
                                (function(iBeacon){
                                    configSensorCounter++;
                                    //console.log(iBeacon);
                                    current_config.sensors.iBeacons["saved-"+iBeaconKey] = iBeacon;
                                    current_config.sensors.iBeacons["saved-"+iBeaconKey].ID = current_config.stateID*10+iBeacon.ID;
                                    current_config.sensors.iBeacons["saved-"+iBeaconKey].isFromConfig = true;
                                })(sensors.iBeacons[iBeaconKey]);

                                eachCallback()
                            }else{
                                eachCallback();
                            }
                        }, function (err) {
                            // after the whole list is processed
                            console.log(current_config);
                            dataService.saveDataToFile(JSON.stringify(current_config, null, 4), "data/reserved/config.json", function (err) {
                                if (err == 1) {
                                    //file successfully saved. 1 - success
                                    console.log("current state of iBeacons has been successfully stored.");
                                    if(finalCallback!=undefined){
                                        finalCallback(1);
                                    }
                                } else {
                                    console.log("Err while save to file: " + err);
                                }
                            })
                        });
                    }else if(action==0){
                        // handles clear event for iBeacons
                        var tempDeletediBeaconsFromConfig = {};
                        async.each(Object.keys(current_config.sensors.iBeacons), function (iBeaconKey, eachCallback) {
                            if (current_config.sensors.iBeacons[iBeaconKey].isDevice == false) {
                                console.log("found one beacon to delete");
                                tempDeletediBeaconsFromConfig[iBeaconKey] = current_config.sensors.iBeacons[iBeaconKey];
                                delete current_config.sensors.iBeacons[iBeaconKey];
                                eachCallback();
                            }else{
                                eachCallback();
                            }
                        }, function (err) {
                            //console.log(current_config);
                            dataService.saveDataToFile(JSON.stringify(current_config, null, 4), "data/reserved/config.json", function (err) {
                                if (err == 1) {
                                    //file successfully saved. 1 - success
                                    locator.loadConfig();
                                    if(finalCallback!=undefined){
                                        finalCallback({status:1,clearedConfigBeacons:tempDeletediBeaconsFromConfig});
                                    }
                                    console.log("current state of iBeacons has been successfully stored.");
                                } else {
                                    console.log("Err while save to file: " + err);
                                }
                            })
                        });
                    }
                    break;
                case "room":
                    locator.room = new factory.Room(configuration.room.location,configuration.room.length,configuration.room.depth,configuration.room.height);
                    break;
                default :
                    console.log("Unknown modify option:"+entity);
            }


            //console.log(JSON.stringify(locator.room,null,4));
        }
    })

}
