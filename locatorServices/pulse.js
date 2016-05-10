/**
 * Created by yuxiw_000 on 11/4/2014.
 */

var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var sod_util = require('./sod_util');
var frontend = require('./../frontend');
var async = require('async');
var pulse = require('./pulse');
var ERLocator = require('./ERServices/ERLocator')

// Location variable
var heartbeat = null;
exports.initPulseInterval = 500;
exports.eventsSwitch = {
    inRangeEvents:true,
    inViewEvents:true,
    sendIntersectionPoints:true,
    roomIntersectionEvents:true
};

exports.intervals = {};
/* Event handler */
// exposing the heartbeat
exports.start = function(){
    pulse.intervals = {
        sendIntersectionPoints : null
    }
    console.log(' * Starting heartbeat on '+pulse.initPulseInterval + ' ms interval With pulse switch: ' + JSON.stringify(pulse.eventsSwitch));
        try{
            heartbeat = setInterval(function(){
                //console.log('Event Interval HeartBeat.');

                cleaner();
                if(pulse.eventsSwitch.inRangeEvents == true){
                    inRangeEvent();
                }

                if(pulse.eventsSwitch.roomIntersectionEvents == true){
                    roomIntersectionEvent();
                }

                if(pulse.eventsSwitch.inViewEvents == true){
                    inViewEvent();
                }

                if(pulse.eventsSwitch.sendIntersectionPoints==true){
                    sendIntersectionPoints();
                }

                // send ERResponder info out
                updateERResponders()
            },pulse.initPulseInterval);
            /*if(pulse.eventsSwitch.sendIntersectionPoints == true){
                var sendIntersectionPointsInterval = setInterval(function(){
                        sendIntersectionPoints();
                    },pulse.initPulseInterval
                );
                pulse.intervals.sendIntersectionPoints = sendIntersectionPointsInterval;
            }*/
        }catch(e){
            console.log('unable to start heartbeat due to: '+ e);
        }
};

function updateERResponders(){
    //console.log("ERPersons: "+JSON.stringify(ERLocator.ERPersons));
    if(Object.keys(frontend.clients).length != 0) {
        //console.log(frontend.clients[Object.keys(frontend.clients)[0]].clientType);
        frontend.clients[Object.keys(frontend.clients)[0]].broadcast.emit("OnRespondersUpdate",
            {
                "117": {
                    ID: 117,
                    heartbeat: 75,
                    GeoLocation: {lat: 51.080202, lng: -114.124955}
                },
                "118": {
                    ID: 118,
                    heartbeat: 150,
                    GeoLocation: {lat: 51.080876, lng:-114.128502}
                }
            });
    }
}

function roomIntersectionEvent(){
    //console.log('YO');
    //get all the devices that has locations
    var deviceList = locator.devices;
    for(var deviceKey in deviceList){
        if(deviceList.hasOwnProperty(deviceKey)){
            //console.log(deviceKey);
            var device = deviceList[deviceKey];
            if(device.location!=undefined && device.location!=null && device.orientation != null&& device.orientation != undefined&&device.hasOwnProperty("Observer")){
                locator.getIntersectionPointInRoom(device,function(intersectionPoint,observerCB){
                    //console.log(JSON.stringify(intersectionPoint));
                    if(intersectionPoint!=null && intersectionPoint!=undefined){
                        // if there is a legit intersection point broadcast events to all devices
                        Object.keys(deviceList).forEach(function(aDeviceKey){
                            if(deviceList[aDeviceKey].roomIntersectionEvents==true) {
                                frontend.clients[aDeviceKey].emit("intersectedOnWall",
                                    {
                                        observer: observerCB,
                                        intersectionPoint: intersectionPoint[0]
                                    })
                            }
                        })
                        // find all visualizer and send a event copy to them
                        for(var clientKey in frontend.clients){
                            //filter all webclient and sent event
                            if(frontend.clients.hasOwnProperty(clientKey)&&
                                frontend.clients[clientKey].clientType=="webClient"){
                                // sending a copy to visualizers
                                var intersectionPointForSend = intersectionPoint[0];
                                frontend.clients[clientKey].emit("intersectedOnWall",
                                    {
                                        observer:observerCB,
                                        intersectionPoint:intersectionPointForSend
                                    })
                            }
                        }
                    }else{
                        console.log("intersectionPoint undefined.");
                    }
                    })
            }// End of if device location is defined
        }
    }// End of devices list iteration
}




// all the event handlers
function sendIntersectionPoints(){
    for(var deviceKey in locator.devices){
        if(locator.devices.hasOwnProperty(deviceKey)) {
            var socketID = deviceKey;
            if (locator.devices[socketID].orientation != undefined) {
                locator.calcIntersectionPointsForDevices(socketID, locator.getDevicesInFront(deviceKey, locator.devices), function (intersectionList) {
                    //console.log('calling back? '+ JSON.stringify(intersectionPoint));
                    if (intersectionList != null) {
                        try {
                            // forEach is also sync
                            async.each(intersectionList,
                                function (intersectionPointWrapper, callback) {
                                    frontend.clients[intersectionPointWrapper.intersectedSocketID].emit("intersected", {
                                        relevance: intersectionPointWrapper.relevance,
                                        intersectionPoint: intersectionPointWrapper.intersectionPoint,
                                        intersectedBy: {
                                            type: "device",
                                            ID: locator.devices[intersectionPointWrapper.observerSocketID].uniqueDeviceID
                                        }
                                    });
                                    callback();
                                }, function (err) {
                                    // handles when all the events are fired
                                }
                            );
                            //console.log(locator.devices[intersectionList.observerSocketID].uniqueDeviceID+'->'+locator.devices[intersectionList.intersectedSocketID].uniqueDeviceID);
                            //frontend.clients[intersectionPoint.intersectedSocketID].emit("intersected", {relevance:intersectionPoint.relevance,intersectionPoint: intersectionList.intersectionPoint,intersectedBy:{type:"device",ID:locator.devices[intersectionPoint.observerSocketID].uniqueDeviceID}});

                        } catch (e) {
                            console.log("unable to send intersection events dueto: " + e);
                        }
                    }
                });
                //}// error checking for orientation
                //console.log('intersections: ' + JSON.stringify(intersections));
            }
        }// end of orientation null check
    }
}

function cleaner(){
    locator.leapMotionService.purgeUnusedHands();
}




// the handler for all the inview event
function inViewEvent(){
    for(var deviceKey in locator.devices){
        // interating through all the devices
        if(locator.devices.hasOwnProperty(deviceKey)) {
            if (locator.devices[deviceKey].orientation != undefined) {
                var CurrentInViewDeviceList = locator.getDevicesInFront(frontend.clients[deviceKey].id, locator.devices);
                //console.log("key: "+  JSON.stringify(CurrentInViewDeviceList));
                //console.log(CurrentInViewDeviceList);
                for (var currentInViewDevicesKey in CurrentInViewDeviceList) {
                    if (locator.devices[deviceKey].inViewList[CurrentInViewDeviceList[currentInViewDevicesKey]] == undefined) {
                        locator.devices[deviceKey].inViewList[CurrentInViewDeviceList[currentInViewDevicesKey]] = {
                            type: 'device',
                            ID: locator.devices[CurrentInViewDeviceList[currentInViewDevicesKey]].uniqueDeviceID
                        }
                        console.log('added-> ' + JSON.stringify(locator.devices[deviceKey].inViewList) + ' to inViewlist');
                        try {
                            frontend.clients[locator.devices[deviceKey].socketID].emit("enterView", {
                                observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'},
                                visitor: locator.devices[deviceKey].inViewList[CurrentInViewDeviceList[currentInViewDevicesKey]]
                            });
                        } catch (e) {
                            console.log("unable to send enterView event message due to: " + e);
                        }
                    }
                }// end of for CurrentInViewDevicelist
                for (var inViewListKey in locator.devices[deviceKey].inViewList) {
                    if (locator.devices[deviceKey].inViewList.hasOwnProperty(inViewListKey)) {
                        //console.log("CurrentInViewDeviceList: "+JSON.stringify(CurrentInViewDeviceList));
                        if (locator.devices[deviceKey].inViewList[inViewListKey] != undefined && CurrentInViewDeviceList.indexOf(inViewListKey) == -1) {  // if the inViewList device
                            console.log('deleting->' + JSON.stringify(locator.devices[deviceKey].inViewList[inViewListKey]));
                            try {
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveView", {
                                    observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'},
                                    visitor: locator.devices[deviceKey].inViewList[inViewListKey]
                                });
                                delete locator.devices[deviceKey].inViewList[inViewListKey];
                            } catch (e) {
                                console.log("unable to send leaveView message due to: " + e);
                            }
                        }
                    }// End of if hasProperty
                }
            }
        } // end of orientation check
    }// end of inView Event
}


/* inRangeEvent functions calculate whether a person is in range of a device. */
function inRangeEvent(){
    //for all the people that are been tracked
    //console.log("*********");
    for(var personKey in locator.persons){
        if(locator.persons.hasOwnProperty(personKey)){
            //console.log(personKey);
            for(var deviceKey in locator.devices){
                if(locator.devices.hasOwnProperty(deviceKey) && locator.devices[deviceKey].observer!=undefined){
                    // if a person in in range of any device fire out broadcast event
                    //try{
                        // if the person is not in range of this device yet
                        if(locator.persons[personKey].inRangeOf[deviceKey]==undefined) // handles enter event
                        {
                            if(locator.devices[deviceKey].observer.observerType == 'radial' &&
                                sod_util.distanceBetweenPoints(locator.persons[personKey].location,locator.devices[deviceKey].location)<=locator.devices[deviceKey].observer.observeRange)
                            {
                                locator.persons[personKey].inRangeOf[deviceKey] = {type:'device',ID:locator.devices[deviceKey].uniqueDeviceID};
                                frontend.clients[locator.devices[deviceKey].socketID].emit("enterObserveRange", {observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},visitor:{type:"person",ID:locator.persons[personKey].uniquePersonID}});
                                if(locator.persons[personKey].pairingState!="unpaired") {
                                    locator.emitEventToPairedDevice(locator.persons[personKey], "enterObserveRange",
                                         {
                                            observer: {
                                                ID: locator.devices[deviceKey].uniqueDeviceID,
                                                type: locator.devices[deviceKey].deviceType
                                            },
                                            visitor: {
                                                type: locator.devices[locator.persons[personKey].ownedDeviceID].deviceType,
                                                ID: locator.devices[locator.persons[personKey].ownedDeviceID].uniqueDeviceID
                                            }
                                        }
                                    )
                                }
                                console.log('-> enter radial'+JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                            }else if(locator.devices[deviceKey].observer.observerType == 'rectangular'
                                && sod_util.isInRect(locator.persons[personKey].location,sod_util.getObserverLocation(locator.devices[deviceKey]),locator.devices[deviceKey].observer.observeWidth,locator.devices[deviceKey].observer.observeHeight) == true) // handles rectangular
                            {
                                locator.persons[personKey].inRangeOf[deviceKey] = {type:'device',ID:locator.devices[deviceKey].uniqueDeviceID};
                                frontend.clients[locator.devices[deviceKey].socketID].emit("enterObserveRange", {observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},visitor:{type:"person",ID:locator.persons[personKey].uniquePersonID}});
                                console.log('-> enter rect '+JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey])+" person: "+JSON.stringify(locator.persons[personKey]));
                                if(locator.persons[personKey].pairingState!="unpaired"){
                                    locator.emitEventToPairedDevice(locator.persons[personKey],"enterObserveRange",{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:locator.devices[deviceKey].deviceType},visitor:{type:locator.devices[locator.persons[personKey].ownedDeviceID].deviceType,ID:locator.devices[locator.persons[personKey].ownedDeviceID].uniqueDeviceID}})
                                }

                            }
                        }
                        else if(locator.persons[personKey].inRangeOf[deviceKey]!=undefined) // handles leaves event
                        {
                            if (locator.devices[deviceKey].observer.observerType == 'radial' && sod_util.distanceBetweenPoints(locator.persons[personKey].location, locator.devices[deviceKey].location) > locator.devices[deviceKey].observer.observeRange) {
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveObserveRange", {observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'}, visitor: {type:"person",ID:locator.persons[personKey].uniquePersonID}});
                                if(locator.persons[personKey].pairingState!="unpaired") {
                                    locator.emitEventToPairedDevice(locator.persons[personKey], "leaveObserveRange",
                                        {
                                            observer: {
                                                ID: locator.devices[deviceKey].uniqueDeviceID,
                                                type: locator.devices[deviceKey].deviceType
                                            },
                                            visitor: {
                                                type: locator.devices[locator.persons[personKey].ownedDeviceID].deviceType,
                                                ID: locator.devices[locator.persons[personKey].ownedDeviceID].uniqueDeviceID
                                            }
                                        }
                                    )
                                }
                                delete locator.persons[personKey].inRangeOf[deviceKey];
                            }
                            if (locator.devices[deviceKey].observer.observerType == 'rectangular'
                                && sod_util.isInRect(locator.persons[personKey].location, sod_util.getObserverLocation(locator.devices[deviceKey]), locator.devices[deviceKey].observer.observeWidth, locator.devices[deviceKey].observer.observeHeight) == false) // handles rectangular
                            {
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[deviceKey]));
                                frontend.clients[locator.devices[deviceKey].socketID].emit("leaveObserveRange", {observer: {ID: locator.devices[deviceKey].uniqueDeviceID, type: 'device'}, visitor: {type:"person",ID:locator.persons[personKey].uniquePersonID}});
                                if(locator.persons[personKey].pairingState!="unpaired") {
                                    locator.emitEventToPairedDevice(locator.persons[personKey], "leaveObserveRange",
                                        {
                                            observer: {
                                                ID: locator.devices[deviceKey].uniqueDeviceID,
                                                type: locator.devices[deviceKey].deviceType
                                            },
                                            visitor: {
                                                type: locator.devices[locator.persons[personKey].ownedDeviceID].deviceType,
                                                ID: locator.devices[locator.persons[personKey].ownedDeviceID].uniqueDeviceID
                                            }
                                        }
                                    )
                                }delete locator.persons[personKey].inRangeOf[deviceKey];
                            }
                        }
                    /*}catch(err){
                        console.log('emitting enter and  ... due to: ' +err);
                    }*/
                }// end of if ownPropertys
                else{
                    //console.log("No observer detected for device "+locator.devices[deviceKey].uniqueDeviceID);
                }
            }// end of all devices

            // start checking all the dataPoints
            for(var dataPointKey in locator.dataPoints){
                if(locator.dataPoints.hasOwnProperty(dataPointKey)){
                    // if the person is not inrange of the deivce
                    if(locator.persons[personKey].inRangeOf[dataPointKey]==undefined){ // handles enter event
                        if(locator.dataPoints[dataPointKey].observer.observerType=='rectangular'){
                            if(sod_util.isInRect(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location,locator.dataPoints[dataPointKey].observer.observeWidth,locator.dataPoints[dataPointKey].observer.observeHeight)==true){
                                console.log('person inside of dataPoint: '+dataPointKey );
                                locator.persons[personKey].inRangeOf[dataPointKey] = {type:'dataPoint',ID:locator.dataPoints[dataPointKey].ID};
                                //TODO: add sendMessageToSubscriber function call
                                locator.emitEventToSubscriber('enterObserveRange',{observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: {type:"person",ID:locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber)
                                console.log('-> enter rec!! '+JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                            }
                        }else if(locator.dataPoints[dataPointKey].observer.observerType=='radial' && sod_util.distanceBetweenPoints(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location)<=locator.dataPoints[dataPointKey].observer.observeRange){ // end of rectangualar
                            locator.persons[personKey].inRangeOf[dataPointKey] = {type:'dataPoint',ID:locator.dataPoints[dataPointKey].ID};
                            locator.emitEventToSubscriber('enterObserveRange', {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: {type:"person",ID:locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber)
                            console.log('-> enter radial '+JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                        }
                    }else if(locator.persons[personKey].inRangeOf[dataPointKey]!=undefined){ // handles leave event
                        if(locator.dataPoints[dataPointKey].observer.observerType=='rectangular'){
                            //console.log('inRange '+ (locator.dataPoints[dataPointKey].location.Z-locator.dataPoints[dataPointKey].observer.observeHeight/2));
                            if(sod_util.isInRect(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location,locator.dataPoints[dataPointKey].observer.observeWidth,locator.dataPoints[dataPointKey].observer.observeHeight)==false){
                                console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                                //frontend.io.sockets.emit('leaveObserveRange', {payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}});
                                locator.emitEventToSubscriber('leaveObserveRange', {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: {type:"person",ID:locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber);
                                delete locator.persons[personKey].inRangeOf[dataPointKey];
                            }
                        }else if(locator.dataPoints[dataPointKey].observer.observerType=='radial' && sod_util.distanceBetweenPoints(locator.persons[personKey].location,locator.dataPoints[dataPointKey].location)>locator.dataPoints[dataPointKey].observer.observeRange){ // end of rectangualar
                            console.log('-> leaves ' + JSON.stringify(locator.persons[personKey].inRangeOf[dataPointKey]));
                            //frontend.io.sockets.emit('leaveObserveRange', {payload: {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: locator.persons[personKey].uniquePersonID}});
                            locator.emitEventToSubscriber('leaveObserveRange', {observer: {ID: locator.dataPoints[dataPointKey].ID, type: 'dataPoint'}, visitor: {type:"person",ID:locator.persons[personKey].uniquePersonID}},locator.dataPoints[dataPointKey].subscriber);
                            delete locator.persons[personKey].inRangeOf[dataPointKey];
                        }
                    }// in range of somebdoy ends
                }
            }
        }// END of ALL DATAPOINTS

    }
}

exports.refreshHeartbeat = function(property,value,callback){
    clearInterval(heartbeat);
    console.log(' * Restarting heartbeat on '+pulse.initPulseInterval + ' ms interval With pulse switch: ' + JSON.stringify(pulse.eventsSwitch));
    //console.log(pulse.eventsSwitch);
    heartbeat = setInterval(function(){
        //console.log('Event Interval HeartBeat.');

        cleaner();

        if(pulse.eventsSwitch.inRangeEvents == true){
            inRangeEvent();
        }

        if(pulse.eventsSwitch.roomIntersectionEvents == true){
            roomIntersectionEvent();
        }

        if(pulse.eventsSwitch.inViewEvents == true){
            inViewEvent();
        }

        if(pulse.eventsSwitch.sendIntersectionPoints==true){
            sendIntersectionPoints();
        }

    },pulse.initPulseInterval);
}
