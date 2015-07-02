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

var fs = require('fs');
var math = require('mathjs');

var previousKinnectDeviceLocation = {X: 0, Y: 0, Z:0};
var previousKinnectDeviceRotations = {rotationX:0, rotationY:0, rotationZ:0};
var timeInterval = (1/5);

//-------------------------    Registration   ---------------------------------------------------------------------------//

// handles when registerBeacon gets called
exports.registerIBeaconHandler = function(socket,sensorInfo,callback){

    // Generating a Beacon sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        
        if(sensorInfo.beaconType == "Tr"){
            //Transmitter beacon
            console.log('Beacon typ is Transmitter.');
            registerIBeacon(socket, sensorInfo, callback);
        } 
        else if (sensorInfo.beaconType == "Rcvr"){
            //Reciever Beacon
            console.log('Beacon typ is Reciever.');
            registerIBeaconRcvrHandler(socket,sensorInfo,callback);
        } 
        else{
            console.log('Unknown beaocn type');
        }


    } else {
        console.log('received null sensor info. Can not register to the server');
    }
}




//register Ibeacon to sensor list
function registerIBeacon(socket, sensorInfo, callback){
    console.log('Registering Transmitter Beacon ...');
    if(locator.sensors.iBeacons[socket.id] == undefined){
        var deviceSocketID = checkIfExisted(sensorInfo.name);
        var iBeacon = new factory.iBeacon(socket, sensorInfo, deviceSocketID);

        //handles reference Beacon
        frontend.io.sockets.emit("refreshWebClientSensors", {});
        
        var personID = '-1';
        var personFound = false;
        var tmpPerson = null; 
        
        //Update beacon location if applicable
        if(sensorInfo.personId != undefined){
            for(var person in locator.persons){
                if(sensorInfo.personId == person){
                    personFound = true;
                    tmpPerson = person;
                    iBeacon.location.X = locator.persons[person].location.X;
                    iBeacon.location.Y = locator.persons[person].location.Y;
                    iBeacon.location.Z = locator.persons[person].location.Z;
                }
            }
            if(personFound == false){
                console.log('Could not find a person with personId provided');
            } else{
                console.log('found a person with personId provided with the following info:\n' + JSON.stringify(locator.persons[tmpPerson]));
            }
        }

        //Update beaconslist with the new beacon
        locator.sensors.iBeacons[iBeacon.socketID] = iBeacon;
        socket.emit('registered',{data:iBeacon.beaconType}); 

        console.log('Beacon Tr registration is confirmed with the following info:\n' + JSON.stringify(locator.sensors.iBeacons[socket.id]));
        console.log('Printing the new Tr Beacons list');
        console.log(locator.sensors.iBeacons);  
    } else{
        console.log('Beacon Tr is already registered.');
    } 
}



//Handles registering ibeaconReciever
//TODO - Update location of reciever every time frame from the device it is paired  with
// as well as trasmitters if applicable
function registerIBeaconRcvrHandler (socket,sensorInfo,callback){
    console.log('\nRegistering Recvr Beacon ...\n');

    if(locator.sensors.iBeaconRcvrs[socket.id] == undefined){

        if (Object.keys(sensorInfo).length != 0) {
            var deviceSocketID = checkIfExisted(sensorInfo.name);
            var iBeaconRcvr = new factory.iBeaconRcvr(socket, sensorInfo, deviceSocketID);
            locator.sensors.iBeaconRcvrs[iBeaconRcvr.socketID] = iBeaconRcvr;
            socket.emit('registered',{data:iBeaconRcvr.beaconType});
           

            console.log('Beacon Rcvr registration is confirmed with the following info:\n' + JSON.stringify(iBeaconRcvr));
            console.log('Printing the new Tr Beacons list\n');
            console.log(locator.sensors.iBeaconRcvrs);

        } else {
            console.log('received null sensor info. Can not register to the server');
        }
    } else{
        console.log('Reciever Beacon is already registered!');
    }
}



function checkIfExisted (deviceName){
    var bool = false;

    for(var socketID in locator.devices){        
        if(locator.devices[socketID].name == deviceName){
            bool = true;
            console.log('\tDevice with given name is found');
            return socketID;
        }
    }

    if(bool == false){
        console.log('No device name found with the given name');
        return null;
    }
}

//-------------------------  End OF Registration   ---------------------------------------------------------------------------//


//-------------------------  de_Registration   ---------------------------------------------------------------------------//

exports.deRegisterIBeaconTrHandler = function (socket){

    if(locator.sensors.iBeacons[socket.id] != undefined){
        delete locator.sensors.iBeacons[socket.id];
        console.log('de-registering beacon tranmitter is confirmed.')
        console.log('updated transmitters list is \n' + JSON.stringify(locator.sensors.iBeacons));
    }
}

exports.deRegisterIBeaconRcvrHandler = function (socket){

    if(locator.sensors.iBeaconRcvrs[socket.id] != undefined){
        delete locator.sensors.iBeaconRcvrs[socket.id];
        console.log('de-registering beacon reciever is confirmed.')
        console.log('updated recievers list is \n' + JSON.stringify(locator.sensors.iBeaconRcvrs));
        if(locator.visibleBeacons[socket.id] != undefined){
            delete locator.visibleBeacons[socket.id];
        }
    }
}

//-------------------------  End of de_Registration   ---------------------------------------------------------------------------//





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

exports.sendTransmittersList = function(socket){
    var trBeaconsList = locator.sensors.iBeacons;
    console.log('Sending list of beacons transmitters...\n' + JSON.stringify(trBeaconsList));
    socket.emit("getBeaconsTransmittersList", {data: trBeaconsList});
}

exports.sendRecieversList = function (socket){
    var rcvrBeaconsList = locator.sensors.iBeaconRcvrs;
    console.log('Sending list of beacons recievers...\n' + JSON.stringify(rcvrBeaconsList));
    socket.emit('getBeaconsRecieverList', {data: rcvrBeaconsList});
}

exports.getBeaconsTransmittersListLocation = function(socket, fn){
    var locations = {};

    for(var beacon in locator.sensors.iBeacons){
        var location = new factory.beaconLocation(locator.sensors.iBeacons[beacon]);
        console.log('Beacon Location :' + JSON.stringify(locator.sensors.iBeacons[beacon]));
        locations[beacon] = location;
    }

    console.log('\nSending locations of beacons transmitters...\n' + JSON.stringify(locations));
    socket.emit('getBeaconsTransmittersListLocation', {data: locations});    
}

//JGRzY7PL9NNSWMtZ8Ion
exports.cleanUp = function (socketID){

    console.log('\ncleanUp is called for beacons');
    
    if(locator.sensors.iBeacons[socketID] != undefined){
        delete locator.sensors.iBeacons[socketID];
        console.log('Deleted beacon transmitter\n');
        locator.loadConfig();
    }

    if(locator.sensors.iBeaconRcvrs[socketID] != undefined){
        delete locator.sensors.iBeaconRcvrs[socketID];
        console.log('Deleted beacon reciever\n');

        if(locator.visibleBeacons[socketID] != undefined){
            console.log('Deleted beacon reciever visible beacons\n');
            delete locator.visibleBeacons[socketID];
        }
    }

    
    console.log('Beacons Transmitters \n' + JSON.stringify(locator.sensors.iBeacons));
    console.log('Beacons Recievers \n' + JSON.stringify(locator.sensors.iBeaconRcvrs));
    console.log('Beacons Visible Beacons \n' + JSON.stringify(locator.visibleBeacons));
}

//Send list of transmitters to either all reciever beacons 
// when new tranmitter is registered or deregistered
// or
// to who recently registered as beacon reciever
/*
function sendTransmittersList(socket, allRcvrs){
    //Generate a list of different uuids the server is a ware of
    var uuidsList = {};
    var identifiersList = {};
    var majorsList = {};
    var minorsList = {};
486240
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

function isNotIncluded(uuids, uuid){
    for(var id in uuids){
        if(id == uuid)
            return false;
    }
    return true;
}
*/

function refreshBeaconsLocation(){
    //console.log("refreshBeaconsLocation is called");
    
    for(var beacon in locator.sensors.iBeacons){
        if(locator.sensors.iBeacons[beacon].deviceSocketID != undefined){
            updateTrBeaconLocation(beacon, locator.sensors.iBeacons[beacon].deviceSocketID, locator.sensors.iBeacons[beacon].isDevice);
        }
    }

    for (var iBeaconRcvr in locator.sensors.iBeaconRcvrs){
        if(locator.sensors.iBeaconRcvrs[iBeaconRcvr].deviceSocketID){
            updateRcvrBeaconLocation(iBeaconRcvr, locator.sensors.iBeacons[beacon].deviceSocketID);
        }
    }
}


function updateTrBeaconLocation(beaconTrID, deviceSocketID, isDevice){
    console.log("updateTrBeaconLocation is called");
    if(locator.devices[deviceSocketID] != undefined && isDevice){
        locator.sensors.iBeacons[beaconTrID].location.X = locator.devices[deviceSocketID].location.X;
        locator.sensors.iBeacons[beaconTrID].location.Y = locator.devices[deviceSocketID].location.Y;
        locator.sensors.iBeacons[beaconTrID].location.Z = locator.devices[deviceSocketID].location.Z;
    } else{
        console.log('No device associated with this beacon tr');
    }
}


function updateRcvrBeaconLocation(beaconRcvrID, deviceSocketID){
    console.log("updateRcvrBeaconLocation is called");
    if(locator.devices[deviceSocketID] != undefined){
        locator.sensors.iBeaconRcvrs[beaconRcvrID].location.X = locator.devices[deviceSocketID].location.X;
        locator.sensors.iBeaconRcvrs[beaconRcvrID].location.Y = locator.devices[deviceSocketID].location.Y;
        locator.sensors.iBeaconRcvrs[beaconRcvrID].location.Z = locator.devices[deviceSocketID].location.Z;
    } else{
        console.log('No device associated with this beacon rcvr');
    }
}


setInterval(function() {  
    //refreshBeaconsLocation();

}, 500);



exports.updateSpeedAndOrientation = function(socket, date, fn){
    
    try{
        //Get the current device location from kinnect
        if(locator.devices[socket.id] != undefined){
            console.log('\tDevice with given socket ID is found');

            console.log('Previous device location is ' + JSON.stringify(previousKinnectDeviceLocation));
            console.log('Current device location is ' + JSON.stringify(locator.devices[socket.id].location));

            //Get speed and rotations rate of device from kinnect
            var speedAndRotations = getSpeedAndRotationsRate(previousKinnectDeviceLocation, 
                locator.devices[socket.id].location);
            if(speedAndRotations != null){
                //TODO
                //Write data recieved from client to sa file
                //Write the speedAndRotations of the client from kinnect to a file
                //fs.appendFileSync('Kinnectlog.txt', 'Hello', encoding='utf8');
                //fs.appendFileSync('Devicelog.txt', 'Hello', encoding='utf8');
            } else{
                console.log('*Failed to update Speed And Orientation due to: '+err);

            }


        }
        else{
            console.log('\tDevice with given socket ID  is not found');
            
        
            var initialLocation = {X:0, Y:0, Z:0};
            var finalLocation = {X:2, Y:2, Z:2};

            var speedAndRotations = getSpeedAndRotationsRate(initialLocation, 
                finalLocation);
        }
    } catch(err){
            console.log('*Failed to update Speed And Orientation due to: '+err);
    }
    
}

function getSpeedAndRotationsRate(locationOne, locationTwo){

    console.log('\nTrying to update the speed and Orientation of the device');

    //console.log('previous location' + JSON.stringify(previousKinnectDeviceLocation));
    //console.log('previous Rotations' + JSON.stringify(previousKinnectDeviceRotations));

    try{
        var speedAndRotationsInformation = {speed:{}, 
                rotationsInformation:
                {
                    rotationsRate:{rotationXRate:0, rotationYRate:0, rotationZRate:0}, 
                    rotationsAngles:{rotationX:0, rotationY:0, rotationZ:0}
                }
            };

        //Get Speed
        var distanceInX = locationTwo.X - locationOne.X;
        var distanceInY = locationTwo.Y - locationOne.Y;
        var distanceInZ = locationTwo.Z - locationOne.Z;
        
        //console.log('distance in X ' + distanceInX + ' distance in Y ' + distanceInY + ' distance in Z  ' + distanceInZ);

        var distance = Math.sqrt(Math.pow(distanceInX, 2) + Math.pow(distanceInY, 2) + Math.pow(distanceInZ, 2));

        speedAndRotationsInformation.speed = (distance/timeInterval);

        //Get rotations in degrees
        var rotationInx = 90 - (math.atan(distanceInZ/distanceInY) * (180/Math.PI))
        var rotationInY = 90 - (math.atan(distanceInZ/distanceInX) * (180/Math.PI))
        var rotationInZ = 90 - (math.atan(distanceInX/distanceInY) * (180/Math.PI))
        
        //console.log('rotationInx ' + rotationInx + ' rotationInY ' + rotationInY + ' rotationInZ ' + rotationInZ);
        
        //Get rotations in radians
        speedAndRotationsInformation.rotationsInformation.rotationsAngles.rotationX = rotationInx * (Math.PI/180);
        speedAndRotationsInformation.rotationsInformation.rotationsAngles.rotationY = rotationInY * (Math.PI/180);
        speedAndRotationsInformation.rotationsInformation.rotationsAngles.rotationZ = rotationInZ * (Math.PI/180);

        //Get rate of rotations in radians per second
        speedAndRotationsInformation.rotationsInformation.rotationsRate.rotationXRate = ((rotationInx * (Math.PI/180)) - previousKinnectDeviceRotations.rotationX)/ timeInterval;
        speedAndRotationsInformation.rotationsInformation.rotationsRate.rotationYRate = ((rotationInx * (Math.PI/180)) - previousKinnectDeviceRotations.rotationY)/ timeInterval;
        speedAndRotationsInformation.rotationsInformation.rotationsRate.rotationZRate = ((rotationInx * (Math.PI/180)) - previousKinnectDeviceRotations.rotationZ)/ timeInterval;

        //Update the previous location to be the new location
        previousKinnectDeviceLocation.X = locationTwo.X;
        previousKinnectDeviceLocation.Y = locationTwo.Y;
        previousKinnectDeviceLocation.Z = locationTwo.Z;

        //update the old rotation to be the next rotation
        previousKinnectDeviceRotations.rotationX = speedAndRotationsInformation.rotationsInformation.rotationsAngles.rotationX;
        previousKinnectDeviceRotations.rotationY = speedAndRotationsInformation.rotationsInformation.rotationsAngles.rotationY;
        previousKinnectDeviceRotations.rotationZ = speedAndRotationsInformation.rotationsInformation.rotationsAngles.rotationZ;

        //console.log('Updated speed and RotationRates' + JSON.stringify(speedAndRotationsInformation));
        //console.log('Updated previous location' + JSON.stringify(previousKinnectDeviceLocation));
        //console.log('Updated previous Rotations' + JSON.stringify(previousKinnectDeviceRotations));


        return speedAndRotationsInformation;
    }catch(err){
            console.log('Failed to get the speed and orientation of device due to: '+err);
            return null;
    }
}

;
//var previousKinnectDeviceRotations = {rotationX:0, rotationY:0, rotationZ:0};






