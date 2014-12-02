/**
 * Created by yuxiw_000 on 11/4/2014.
 */

var factory = require('./factory');
var _ = require('underscore');
var locator = require('./locator');
var util = require('./util');
var frontend = require('./frontend');
var async = require('async');
//var events = require("events");
var pulse = require('./pulse');
exports.initPulseInterval = 500;
exports.eventsSwitch = {inRangeEvents:true,inViewEvents:true,sendIntersectionPoints:true};
exports.intervals = {};
/* Event handler */
// exposing the heartbeat
exports.start = function(){
    pulse.intervals = {
        sendIntersectionPoints : null
    }
    console.log(' * Starting heartbeat on '+pulse.initPulseInterval + ' ms interval With pulse switch: ' + JSON.stringify(pulse.eventsSwitch));
        try{
            setInterval(function(){
                //console.log('Event Interval HeartBeat.');
                if(pulse.eventsSwitch.inRangeEvents == true){
                    inRangeEvent();
                }

                if(pulse.eventsSwitch.inViewEvents == true){
                    inViewEvent();
                }

            },pulse.initPulseInterval);
            if(pulse.eventsSwitch.sendIntersectionPoints == true){
                var sendIntersectionPointsInterval = setInterval(function(){
                        sendIntersectionPoints();
                    },pulse.initPulseInterval
                );
                pulse.intervals.sendIntersectionPoints = sendIntersectionPointsInterval;
            }

        }catch(e){
            console.log('unable to start heartbeat due to: '+ e);
        }
};



// all the event handlers
function sendIntersectionPoints(){
    for(var deviceKey in locator.devices){
        if(locator.devices.hasOwnProperty(deviceKey)){
            var socketID = locator.devices[deviceKey].socketID;
                locator.calcIntersectionPoints(socketID, locator.getDevicesInFront(socketID, locator.devices), function (intersectionList) {
                    //console.log('calling back? '+ JSON.stringify(intersectionPoint));
                    if (intersectionList != null) {
                        try {
                            // forEach is also sync
                            async.each(intersectionList,
                                function (intersectionPointWrapper, callback) {
                                    frontend.clients[intersectionPointWrapper.intersectedSocketID].emit("intersected", {relevance: intersectionPointWrapper.relevance, intersectionPoint: intersectionPointWrapper.intersectionPoint, intersectedBy: {type: "device", ID: locator.devices[intersectionPointWrapper.observerSocketID].uniqueDeviceID}});
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
    }
}


function inViewEvent(){
    for(var deviceKey in locator.devices){
        // interating through all the devices
        if(locator.devices.hasOwnProperty(deviceKey)){
            var CurrentInViewDeviceList = util.filterDevices(frontend.clients[deviceKey],{"selection":["inView"]});
            //console.log("key: "+  JSON.stringify(CurrentInViewDeviceList));
            for(var currentInViewDevicesKey in CurrentInViewDeviceList){
                if(locator.devices[deviceKey].inViewList[CurrentInViewDeviceList[currentInViewDevicesKey]] == undefined){
                    locator.devices[deviceKey].inViewList[CurrentInViewDeviceList[currentInViewDevicesKey]] = {type:'device',ID:locator.devices[CurrentInViewDeviceList[currentInViewDevicesKey]].uniqueDeviceID}
                    console.log('added-> ' +JSON.stringify(locator.devices[deviceKey].inViewList)  + ' to inViewlist');
                    try{
                        frontend.clients[locator.devices[deviceKey].socketID].emit("enterView",{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},
                            visitor:locator.devices[deviceKey].inViewList[CurrentInViewDeviceList[currentInViewDevicesKey]]});
                    }catch(e){
                        console.log("unable to send enterView event message due to: "+ e);
                    }

                }
            }// end of for CurrentInViewDevicelist
            for(var inViewListKey in locator.devices[deviceKey].inViewList){
                if(locator.devices[deviceKey].inViewList.hasOwnProperty(inViewListKey)){
                    //console.log("CurrentInViewDeviceList: "+JSON.stringify(CurrentInViewDeviceList));
                    if(locator.devices[deviceKey].inViewList[inViewListKey] != undefined && CurrentInViewDeviceList.indexOf(inViewListKey) == -1) {  // if the inViewList device
                        console.log('deleting->' +  JSON.stringify(locator.devices[deviceKey].inViewList[inViewListKey]));
                        try{
                            frontend.clients[locator.devices[deviceKey].socketID].emit("leaveView",{observer:{ID:locator.devices[deviceKey].uniqueDeviceID,type:'device'},
                                visitor:locator.devices[deviceKey].inViewList[inViewListKey]});
                            delete locator.devices[deviceKey].inViewList[inViewListKey];
                        }catch(e){
                            console.log("unable to send leaveView message due to: "+ e);
                        }


                    }
                }// End of if hasProperty
            }
        }
    }// end of inView Event
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
