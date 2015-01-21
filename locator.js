var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
var frontend = require('./frontend');
var Q = require('q');
var async = require("async");

//var events = require("events");


var dataPoints = {};
var persons = {};
var devices = {};
var sensors = {};
var datas = {};
var sensorsReference = null;

exports.persons = persons;
exports.devices = devices;
exports.sensors = sensors;
exports.dataPoints = dataPoints;
// TODO: test!
exports.start = function(){
    // Do initialization here, if any
};

exports.registerSensor = function(sensor){
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    console.log('received sensor: ' +JSON.stringify(sensor));
    console.log("REFERENCE IS: " + sensorsReference);
    if(sensorsReference == null){
        //sensor.calibration = {Rotation: 0, TransformX: 0, TransformY: 0,xSpaceTransition:0,ySpaceTransition:0, StartingLocation: {X: 0, Y: 0, Z: 0}};
        sensor.isCalibrated = true;
        sensorsReference = sensor;
        console.log("setting default reference");
        sensors[sensor.socketID] = sensor;
    }
    else{
        sensors[sensor.socketID] = sensor;
    }
};

exports.calibrateSensors = function(sensorOnePoints, sensorTwoPoints){
    console.log("Calibrating sensors...");
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
            if(targetObject.data.hasOwnProperty(dataKey)) {
                dataRange = targetObject.data[dataKey].range;
                // get range of this point
                if (requestObject.data[dataKey] == undefined && distance <= dataRange) {
                    // if the data is not exited in the requestObject.
                    requestObject.data[dataKey] = targetObject.data[dataKey];
                    console.log('\t->-> Object grabbed:' + JSON.stringify(requestObject.data[dataKey].name) + ' From targetobject');
                }
            }
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
    if(requestObject.data!=undefined){
        if(requestObject.location!=undefined && dropRange != undefined && Object.keys(requestObject.data).length != 0){
            console.log('drop data request from: '+ JSON.stringify(requestObject) + ' dropRange: '+ dropRange);
            //var dropLocation = requestObject.location;
            for(var key in dataPoints) {
                if(dataPoints.hasOwnProperty(key)){
                    // if reach the end of the dataPoints list
                    dataPointCounter ++;
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
                    }else if(dataPointCounter==dataPointsLength) {
                        var currentLocation = {X:requestObject.location.X,Y:requestObject.location.Y,Z:requestObject.location.Z};
                        locator.registerDataPoint(socket,{location:currentLocation,data:Object.keys(requestObject.data),dropRange:dropRange},fn); //dataPointInfo.location,socket.id,dataPointInfo.range,registerData
                    }
                }// end of hasOwnproperty
            }
            // if it is not in any dataPoints range

        }else{
            console.log('\t->-> 0 ' + ' data has been dropped by object '+ requestObject );
            if(fn!=undefined){
                fn('Dump data requestObject is not well defined.');
            }
        }
    }else{
        console.log('Request object does not have any data');
    }
}
// send message to subscriber if defined, otherwise send message to All
function emitEventToSubscriber(eventName,message,subscribers){
    console.log('emitting evetns to subscriber: ' + JSON.stringify(message));
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
                                frontend.clients[locator.devices[deviceKey].socketID].emit("enterObserveRange", {payload:{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},invader:locator.persons[personKey].uniquePersonID}});
                                console.log('-> enter radial'+JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                            }else if(locator.devices[deviceKey].observer.observerType == 'rectangular'
                                && util.isInRect(locator.persons[personKey].location,util.getObserverLocation(locator.devices[deviceKey]),locator.devices[deviceKey].observer.observeWidth,locator.devices[deviceKey].observer.observeHeight) == true) // handles rectangular
                            {
                                locator.persons[personKey].inRangeOf[deviceKey] = {type:'device',ID:locator.devices[deviceKey].uniqueDeviceID};
                                frontend.clients[locator.devices[deviceKey].socketID].emit("enterObserveRange", {payload:{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},invader:locator.persons[personKey].uniquePersonID}});
                                console.log('-> enter rect '+JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                            }
                        }
                        else if(locator.persons[personKey].inRangeOf[deviceKey]!=undefined) // handles leaves event
                        {
                            if (locator.devices[deviceKey].observer.observerType == 'radial' && util.distanceBetweenPoints(locator.persons[personKey].location, locator.devices[deviceKey].location) > locator.devices[deviceKey].observer.observeRange) {
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveObserveRange", {payload: {observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'}, invader: locator.persons[personKey].uniquePersonID}});
                                delete locator.persons[personKey].inRangeOf[deviceKey];
                            }
                            if (locator.devices[deviceKey].observer.observerType == 'rectangular'
                                && util.isInRect(locator.persons[personKey].location, util.getObserverLocation(locator.devices[deviceKey]), locator.devices[deviceKey].observer.observeWidth, locator.devices[deviceKey].observer.observeHeight) == false) // handles rectangular
                            {
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveObserveRange", {payload: {observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'}, invader: locator.persons[personKey].uniquePersonID}});
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
                                emitEventToSubscriber('enterObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, invader: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber)
                                console.log('-> enter rec '+JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                            }
                        }else if(locator.dataPoints[dataPointKey].observer.observerType=='radial' && util.distanceBetweenPoints(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location)<=locator.dataPoints[dataPointKey].observer.observeRange){ // end of rectangualar
                            locator.persons[personKey].inRangeOf[dataPointKey] = {type:'dataPoint',ID:locator.dataPoints[dataPointKey].ID};
                            emitEventToSubscriber('enterObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, invader: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber)
                            console.log('-> enter radial '+JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                        }
                    }else if(locator.persons[personKey].inRangeOf[dataPointKey]!=undefined){ // handles leave event
                        if(locator.dataPoints[dataPointKey].observer.observerType=='rectangular'){
                            //console.log('inRange '+ (locator.dataPoints[dataPointKey].location.Z-locator.dataPoints[dataPointKey].observer.observeHeight/2));
                            if(util.isInRect(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location,locator.dataPoints[dataPointKey].observer.observeWidth,locator.dataPoints[dataPointKey].observer.observeHeight)==false){
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                                //frontend.io.sockets.emit('leaveObserveRange', {payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, invader: locator.persons[personKey].uniquePersonID}});
                                emitEventToSubscriber('leaveObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, invader: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber);
                                delete locator.persons[personKey].inRangeOf[dataPointKey];
                            }
                        }else if(locator.dataPoints[dataPointKey].observer.observerType=='radial' && util.distanceBetweenPoints(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location)>locator.dataPoints[dataPointKey].observer.observeRange){ // end of rectangualar
                            console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                            //frontend.io.sockets.emit('leaveObserveRange', {payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, invader: locator.persons[personKey].uniquePersonID}});
                            emitEventToSubscriber('leaveObserveRange',{payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, invader: locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber);
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
            break;
        case "Release":
            console.log("-> RELEASE gesture detected from person: " + key + "!");
            locator.dropData(socket,persons[key],0.5); // set the default drop range to 1 meter for now
            break;
        default:
            console.log("Some gesture detected from person " + key + ": " + persons[key].gesture);
    }
}


exports.updatePersons = function(receivedPerson, socket){

    if(Object.keys(persons).length == 0){
        //nobody being tracked, add new person
        //person was not found
        if((receivedPerson.trackingState==1) && receivedPerson.ID != undefined && receivedPerson.location != undefined){ //if provided an ID and a location, update
            var person = new factory.Person(receivedPerson.ID, receivedPerson.location, socket);
            person.lastUpdated = new Date();
            person.currentlyTrackedBy = socket.id;
            person.gesture = receivedPerson.gesture;
            persons[person.uniquePersonID] = person;
        }
    }
    else{
        //there are people being tracked, see if they match
        var counter = Object.keys(persons).length;
        var nearestDistance = 1000;
        var nearestPersonID = null;
        var existingID = [];
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



                    }
                    catch(err){
                        console.log("Error updating person: " + err)
                        //if null or cannot read for some other reason... remove null
                        if(persons[key] == null){
                            delete persons[key];
                        }
                    }
                    break; // whtat is this break for ??
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
        }
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
                                var i = 0;  // counter for person in person id list
                                do{
                                    console.log('\t->->-> Do while loop : ' + persons[key].uniquePersonID);
                                    persons[key].currentlyTrackedBy = persons[key].ID[Object.keys(persons[key].ID)[i]];//Object.keys(persons[key].ID)[0];
                                    i++;
                                }while(persons[key].currentlyTrackedBy == socket.id && i <= 15)

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
exports.removeUntrackedPeople = function(timeOutInMS){
    var now = new Date();
    for(var key in persons){
        if(persons.hasOwnProperty(key)){
            //console.log('-> now: '+now.getTime());
            //console.log('-> lastUpdated: '+ persons[key].lastUpdated.getTime());
            //console.log('-> difference: '+ (now.getTime()-persons[key].lastUpdated));
            if(Object.keys(persons[key].ID).length == 0 && (now.getTime()-persons[key].lastUpdated) > timeOutInMS ){
                //console.log('-> Timed out (' + timeOutInMS + ' ms), deleting person ' + persons[key].uniquePersonID);
                //could refactor using promises or callback
                if(persons[key].ownedDeviceID != null){
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

exports.pairAndNotify = function(deviceSocketID, uniquePersonID){
    devices[deviceSocketID].ownerID = uniquePersonID;
    devices[deviceSocketID].pairingState = "paired";
    frontend.clients[deviceSocketID].emit("devicePaired", {
        name: devices[deviceSocketID].name,
        ID: devices[deviceSocketID].uniqueDeviceID,
        deviceType: devices[deviceSocketID].deviceType,
        ownerID: uniquePersonID
    });
}

exports.pairDevice = function(deviceSocketID, uniquePersonID,socket,callback){
    var statusMsg = "Device Socket ID: " + deviceSocketID +
        "\nPerson ID: " + uniquePersonID;

    if(devices[deviceSocketID] != undefined && persons[uniquePersonID] != undefined){
        if(devices[deviceSocketID].pairingState == "unpaired" && persons[uniquePersonID].pairingState == "unpaired"){
            locator.pairAndNotify(deviceSocketID, uniquePersonID);
            persons[uniquePersonID].ownedDeviceID = deviceSocketID;
            persons[uniquePersonID].pairingState = "paired";
            statusMsg += "\n Pairing successful.";
            frontend.clients[deviceSocketID].emit("gotPaired",{device:devices[deviceSocketID].uniqueDeviceID,person:persons[uniquePersonID].uniquePersonID,status:"success"});
        }
        else{
            statusMsg += "\nPairing attempt unsuccessful";
            if(devices[deviceSocketID].pairingState != "unpaired"){
                statusMsg += "Device unavailable for pairing.";
            }
            if(persons[uniquePersonID].pairingState != "unpaired"){
                statusMsg += "Person unavailable for pairing.";
            }
            frontend.clients[deviceSocketID].emit("gotPaired",{device:devices[deviceSocketID].uniqueDeviceID,person:persons[uniquePersonID],status:statusMsg});
        }
    }
    else{
        statusMsg += "Pairing attempt unsuccessful. One or both objects were not found.";
        frontend.clients[deviceSocketID].emit("gotPaired",{deviceID:devices[deviceSocketID].uniqueDeviceID,personID:persons[uniquePersonID],status:statusMsg});
    }
    socket.send(JSON.stringify({"status": statusMsg, "ownerID": uniquePersonID}));
    if(callback!=undefined){
        try{
            callback();
        }catch(e){
            console.log("unable to call callback function " + e);
        }
    }else{
        console.log("no callback has been defined.");
    }
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
            devices[socket.id].orientation = orientation;
            devices[socket.id].lastUpdated = new Date();
            if(devices[socket.id].ownerID != null){
                persons[devices[socket.id].ownerID].orientation = orientation;
            }
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
        console.log("update orientaion of a device hasn't registered");
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
    if(devices[socketID].pairingState == "paired" && personID != null){
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

exports.cleanUpSensor = function(socketID){
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    delete sensors[socketID];
    var counter = Object.keys(persons).length;

    for(var key in persons){
        counter--;
        if(persons.hasOwnProperty(key)){
            for(var IDkey in persons[key].ID){
                if(persons[key].ID.hasOwnProperty(IDkey)){
                    if(persons[key].ID[IDkey] == socketID){
                        delete persons[key].ID[IDkey];
                        if(counter == 0){
                            locator.removeUntrackedPeople(0);
                        }
                    }
                }
            }
        }
    }

    /////
    if(sensorsReference.socketID == socketID){
        if(Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)}).length > 0){
            var secondCalibratedSensor = sensors[Object.keys(sensors).filter(function(key){return(sensors[key].isCalibrated)})[0]];
            // set the second calibrat
            secondCalibratedSensor.isCalibrated = true;
            secondCalibratedSensor.calibration = secondCalibratedSensor.calibration; //{Rotation: 0, TransformX: 0, TransformY: 0,xSpaceTransition:0,ySpaceTransition:0, StartingLocation: {X: 0, Y: 0, Z: 0}};
            sensorsReference = secondCalibratedSensor;
            console.log('Reference sensor is set to ' + JSON.stringify(sensorsReference));
        }
        else{
            if(Object.keys(sensors).length != 0){
                sensors[Object.keys(sensors)[0]].isCalibrated = true;
                sensorsReference = sensors[Object.keys(sensors)[0]]
            }
            else{
                sensorsReference = null;
            }
        }
    }
    else{
        console.log("All good, removed sensor is not reference");
    }
}
/*
 Update a registered device with a new device info
 */
exports.updateDevice = function(socket,deviceInfo,fn){

    if(devices[socket] != undefined){
        console.log('Updating Device ' + devices[socket].uniqueDeviceID +' with device info: '+JSON.stringify(deviceInfo));
        for(var key in deviceInfo){
            devices[socket][key] = deviceInfo[key];
        }
    }else{
        console.log("got a device update request but the device hasn't been registered yet");
    }

    if(fn!=undefined){
        fn(devices[socket]);
    }
}

/*
 * Registering data with data info
 *
 * */
exports.registerData = function (dataInfo,fn){
    //console.log('received data: ' + JSON.stringify(dataInfo));
    try{
        if(datas[dataInfo.name]==undefined){
            var newData = new factory.data(dataInfo.name,dataInfo.type,dataInfo.dataPath,dataInfo.range);
            datas[newData.name] = newData;
            console.log('-> registered data: '+ JSON.stringify(datas[newData.name]));
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
            registerData[dataName]=datas[dataName];
        })
        console.log('register data: ' + JSON.stringify(registerData));
        var dataPoint = new factory.dataPoint(dataPointInfo.location,socket.id,dataPointInfo.dropRange,registerData,dataPointInfo.observer,dataPointInfo.subscriber);
        frontend.clients[socket.id].clientType = "dataPointClient";
        dataPoints[dataPoint.ID] = dataPoint; // reigster dataPoint to the list with its ID as its key
        //console.log('all data points: ' +JSON.stringify(dataPoints));
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
        console.log("Orientation: "+JSON.stringify(deviceInfo.orientation));
        //console.log('got deviceInfo.ID'+ deviceInfo.ID);
        var device = new factory.Device(socket, {ID: deviceInfo.ID, orientation: deviceInfo.orientation});
        if(deviceInfo.name != null && deviceInfo.name != undefined){
            device.name = deviceInfo.name;
        }
        else{
            device.name = "Device " + device.ID;
        }

        if(deviceInfo.observer != undefined) {device.observer = deviceInfo.observer;};
        device.depth = deviceInfo.depth;
        device.width = deviceInfo.width;
        device.height = deviceInfo.height;
        device.deviceType = deviceInfo.deviceType;
        device.FOV = deviceInfo.FOV;
        device.lastUpdated = new Date();
        device.deviceIP = socketIP;
        device.orientation = deviceInfo.orientation;
        // for stationary layer refreshes
        if(deviceInfo.stationary == true){
            device.orientation = deviceInfo.orientation;
            device.stationary = deviceInfo.stationary;
            device.location = {X: deviceInfo.locationX, Y: deviceInfo.locationY, Z: deviceInfo.locationZ}
            frontend.io.sockets.emit("refreshStationaryLayer", {});
        }

        // JSclient may register deivce with location as well.
        if(deviceInfo.location!=undefined){
            device.location = {X: deviceInfo.location.X, Y: deviceInfo.location.Y, Z: deviceInfo.location.Z}
        }

        devices[socket.id] = device; // officially register the device to locator(server)
        console.log("Registering device: " + JSON.stringify(device));
        console.log('emitting registered device ID : '+ locator.devices[socket.id].uniqueDeviceID);
        if (fn != undefined) {
            //console.log('callback with' + {deviceID:device.uniqueDeviceID,socketID:socket.id});
            fn({deviceID:device.uniqueDeviceID,socketID:socket.id,currentDeviceNumber:Object.keys(locator.devices).length,orientation:device.orientation});
        }

        frontend.clients[socket.id].emit('registered',{deviceID:locator.devices[socket.id].uniqueDeviceID});
    }
}

// TODO: implement!
// TODO: test!
exports.calcIntersectionPoints = function(observerSocketID, devicesInFront,done){
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
    console.log("inView Function ");
    var devicesKeysInFront = this.getDevicesInFront(observerSocketID,deviceList);
    console.log(devicesKeysInFront);
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
    if(observer.orientation!=null){ // check if observer orientation is null
        function filterFOV(observer,deviceList){
            try{

                if (observer.location == null || observer.orientation.yaw == null)
                    return returnDevices;
                if (observer.FOV == 0.0)
                    return returnDevices;
                if (observer.FOV == 360.0){
                    return Object.keys(deviceList).filter(function(key){
                        if(deviceList[key] != observer && deviceList[key].location != undefined){
                            return true;
                        }
                    })
                }
            }
            catch(err){
                console.log("Error getting devices in front of device FOV/Location" + ": " + err);
            }

        }

        // // We imagine the field of view as two vectors, pointing away from the observing device. Targets between the vectors are in view.
        // // We will use angles to represent these vectors.
        try{
            //get the angle to sens
            var angleToSensor =util.getObjectOrientationToSensor(observer.location.X,observer.location.Z);
            var leftFieldOfView = util.normalizeAngle(360 - observer.orientation.yaw  - 90 - angleToSensor+ (observer.FOV/2));
            var rightFieldOfView = util.normalizeAngle(360 - observer.orientation.yaw  - 90 -angleToSensor- (observer.FOV/2));

            //console.log("Left FOV = " + leftFieldOfView)
            //console.log("Right FOV = " + rightFieldOfView)s

            return Object.keys(deviceList).filter(function(key){
                //var angle = util.normalizeAngle(Math.atan2(devices[key].location.Y - observer.location.Y, devices[key].location.X - observer.location.X) * 180 / Math.PI);
                if(deviceList[key] != observer && deviceList[key].location != undefined){
                    if (leftFieldOfView > rightFieldOfView &&
                        (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView &&
                        (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView){
                        return true;
                    }
                    else if (leftFieldOfView < rightFieldOfView)
                    {
                        if ((util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView ||
                            (util.normalizeAngle(Math.atan2(deviceList[key].location.Z - observer.location.Z, deviceList[key].location.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView){
                            return true;
                        }
                    }
                }
            });
        }
        catch(err){
            console.log("Error getting devices in front of device " + ": " + err);
        }
    }else{ // end of checking observer orientation
        console.log("observer "+observer.uniqueDeviceID+" orientation is null.");
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
            if(devices.hasOwnProperty(key) && listDevices[key].pairingState == 'paired'){
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
    for(var key in sensors){
        if(sensors.hasOwnProperty(key)){
            if(sensors[key].isCalibrated && key!=sensorSocketID){
                sensors[sensorSocketID].isCalibrated = false;

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