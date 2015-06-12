/**
 * Created by Nabil Muthanna on 2/3/2015.
 */
/*
 *   iBeacon Service Module
 *
 * */
var locator     =   require('./../locator');
var frontend    =   require('../../frontend');
var factory     =   require('./../factory');
var util        =   require('./../util');


//Modifications by Nabil Muthanna
//------------------------------------------------------------------------------------------------------------//
/**
 * Update the visible transmitter beacons list to this beacon reciever
 **/
exports.handleUpdatedBeaconsList = function(socket, beaconslist, callback){  
     if (Object.keys(beaconslist).length != 0) 
     {     
        var parsed = beaconslist;
        var arr = [];
        for(var x in parsed){
            arr.push(parsed[x]);
        }

        //Add it the list of visible beacons
        locator.visibleBeacons[socket.id] = arr;

        console.log('printing the updated beaconslist visible to' + locator.sensors.iBeaconRcvrs[socket.id].name +' iBeacon reciever');
        var obj = locator.visibleBeacons[socket.id];
        for( var key in obj){
            if(obj.hasOwnProperty(key)){
                console.log('updated list uuid  ' + obj[key].uuid);
                console.log('updated list major  ' + obj[key].major);
                console.log('updated list minor  ' + obj[key].minor);
                console.log('updated list approximity  ' + obj[key].approximity);
                console.log('updated list RSSI  ' + obj[key].rssi);
            }
        }

    } else {
        console.log('received null of the new beacons list');
    }
}

// handles when registerBeacon gets called
exports.registerIBeaconHandler = function(socket,sensorInfo,callback){

    console.log('Registeration of iBeacon transmitter is being confirmed');
    // Generating a Beacon sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        var iBeacon = new factory.iBeacon(socket, sensorInfo);
        registerIBeacon(iBeacon, callback);

        //Confirm registration of iBeacon
        socket.emit('registered',{data:iBeacon.ID});


    } else {
        console.log('received null sensor info. Can not register to the server');
    }
}



exports.deRegisterIBeaconTrHandler = function (socket){
    
    console.log('Printing the new Beacons list for testing before deRegistering');
    console.log(JSON.stringify(locator.sensors.iBeacons));

    //Remove the beacon from the beacon Transimitters list
    delete locator.sensors.iBeacons[socket.id];

    //Sending new updated list of transmitters to all recievers
    sendTransmittersList(null, true);

    console.log('Printing the new Beacons list for testing after deRegistering');
    console.log(JSON.stringify(locator.sensors.iBeacons));
}

//Handles registering ibeaconReciever
exports.registerIBeaconRcvrHandler = function(socket,sensorInfo,callback){
    console.log('\nInside registerIBeaconRcvrHandler\n');
    // Generating a Beacon sensor object to be added to iBeaconRcvrs list
    if (Object.keys(sensorInfo).length != 0) {
        var iBeaconRcvr = new factory.iBeaconRcvr(socket, sensorInfo);
        locator.sensors.iBeaconRcvrs[iBeaconRcvr.socketID] = iBeaconRcvr;

        //Send list of beacons transimitters
        sendTransmittersList(socket, false);

    } else {
        console.log('received null sensor info. Can not register to the server');
    }
}


function isNotIncluded(uuids, uuid){
    for(var id in uuids){
        if(id == uuid)
            return false;
    }
    return true;
}

//Send list of transmitters to either all reciever beacons 
// when new tranmitter is registered or deregistered
// or
// to who recently registered as beacon reciever
function sendTransmittersList(socket, allRcvrs){
    //Generate a list of different uuids the server is a ware of
    var uuidsList = {};
    var identifiersList = {};
    var majorsList = {};
    var minorsList = {};

    var counter = 0;

    if(false){
        for(var beacon in locator.sensors.iBeacons){
            if(isNotIncluded(transmittersList, beacon.uuid)){
                //Add it to uuids array
                uuidsList[counter] = beacon.uuid;
                identifiersList[counter] = beacon.identifier;
                counter++;
            }
        }
    }

   uuidsList[counter] = "EBEFD083-70A2-47C8-9837-E7B5634DF524";
   identifiersList[counter] = "ASELab.iBeaconModules";
   majorsList[counter] = "1";
   minorsList[counter] = "1";

    //Send transmitters beacons list to the client/Clients
    if(allRcvrs){
         for(var iBeaconRcvr in locator.sensors.iBeaconRcvrs){
            if(iBeaconRcvr != null && frontend.clients[iBeaconRcvr.socketID] != null)
            {
                frontend.clients[iBeaconRcvr.socketID].emit("transmittersList", {data: {uuidsList: uuidsList, identifiersList: identifiersList, majorsList:majorsList, minorsList:minorsList }});
            }        
         }
    } else{
        socket.emit("transmittersList", {data: {uuidsList: uuidsList, identifiersList: identifiersList, majorsList:majorsList, minorsList:minorsList }});
    } 
}

//register Ibeacon to sensor list
function registerIBeacon(iBeacon,callback){
    //handles reference Beacon
    frontend.io.sockets.emit("refreshWebClientSensors", {});
    console.log('received sensor: ' +JSON.stringify(iBeacon));
    
    //Update beaconslist with the new beacon
    locator.sensors.iBeacons[iBeacon.socketID] = iBeacon;

    //Modifications by Nabil Muthanna
    //------------------------------------------------------------------------------------------------------------//
    //print the new list for testing
    console.log('Printing the new Beacons list for testing');
    console.log(JSON.stringify(locator.sensors.iBeacons));
    
    //send the new list to all connected ios devices
    sendTransmittersList(null, true);

    if(callback!=undefined){
        callback({status:"registered",entity:locator.sensors.iBeacons[iBeacon.socketID]});
    }
};
//------------------------------------------------------------------------------------------------------------//
//Modifications