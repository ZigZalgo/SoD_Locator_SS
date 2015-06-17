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

//-------------------------    Registration   ---------------------------------------------------------------------------//

// handles when registerBeacon gets called
exports.registerIBeaconHandler = function(socket,sensorInfo,callback){

    // Generating a Beacon sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        
        if(sensorInfo.beaconType == "Tr"){
            //Transmitter beacon
         
            registerIBeacon(socket, sensorInfo, callback);
        } 
        else if (sensorInfo.beaconType == "Rcvr"){
            //Reciever Beacon
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
    
    if(locator.sensors.iBeacons[socket.id] == undefined){
        var deviceSocketID = checkIfExisted(sensorInfo.name);
        var iBeacon = new factory.iBeacon(socket, sensorInfo, deviceSocketID);

        //handles reference Beacon
        frontend.io.sockets.emit("refreshWebClientSensors", {});
        console.log('received sensor in registerIBeacon: ' +JSON.stringify(iBeacon));
        
        //Update beacon location if applicable
        if(sensorInfo.personId != undefined){
            for(var person in locator.persons){
                console.log(person);
                if(sensorInfo.personId == person){
                    iBeacon.location.X = locator.persons[person].location.X;
                    iBeacon.location.Y = locator.persons[person].location.Y;
                    iBeacon.location.Z = locator.persons[person].location.Z;
                }
            }
        }

        //Update beaconslist with the new beacon
        locator.sensors.iBeacons[iBeacon.socketID] = iBeacon;

        //console.log('Printing the new Beacons list for testing\n');
        console.log(JSON.stringify(locator.sensors.iBeacons));
        socket.emit('registered',{data:iBeacon.beaconType});   
    } else{
        console.log('Beacon is already registered.');
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
            console.log(JSON.stringify(locator.sensors.iBeaconRcvrs));
        } else {
            console.log('received null sensor info. Can not register to the server');
        }
    } else{
        console.log('Reciever Beacon is already registered!');
    }
}



function checkIfExisted (deviceName){
   
    console.log('Inside checkIfExisted Function \n');
    var bool = false;

    for(var socketID in locator.devices){        
        if(locator.devices[socketID].name == deviceName){
            bool = true;
            console.log('Device is already registered\n');
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
    }
}

exports.deRegisterIBeaconRcvrHandler = function (socket){

    if(locator.sensors.iBeaconRcvrs[socket.id] != undefined){
        delete locator.sensors.iBeaconRcvrs[socket.id];
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
    console.log('\nSending list of beacons transmitters...\n' + JSON.stringify(trBeaconsList) + '\n');
    socket.emit("getBeaconsTransmittersList", {data: trBeaconsList});
}

exports.sendRecieversList = function (socket){
    var rcvrBeaconsList = locator.sensors.iBeaconRcvrs;
    console.log('\nSending list of beacons recievers...\n' + JSON.stringify(rcvrBeaconsList) + '\n');
    socket.emit('getBeaconsRecieverList', {data: rcvrBeaconsList});
}

exports.getBeaconsTransmittersListLocation = function(socket, fn){
    var locations = {};

    for(var beacon in locator.sensors.iBeacons){
        console.log('\nBeacon_socketID :' + beacon + '\n');
        console.log('\nBeacon_info :' + JSON.stringify(locator.sensors.iBeacons[beacon])
            + '\n');
        var location = new factory.beaconLocation(locator.sensors.iBeacons[beacon]);
        console.log('Beacon Location :' + JSON.stringify(location));
        locations[beacon] = location;
    }

    console.log('\nSending locations of beacons transmitters...\n' + locations);
    socket.emit('getBeaconsTransmittersListLocation', {data: locations});    
}

//JGRzY7PL9NNSWMtZ8Ion
exports.cleanUp = function (socketID){

    console.log('cleanUp is called for beacons\n');
    
    for(var beacon in locator.sensors.iBeacons){  
        if(beacon.socketID == socketID){
            delete locator.sensors.iBeacons[socketID];
            console.log('Deleted beacon transmitter\n');
        }
    }

    if(locator.sensors.iBeaconRcvrs[socketID] != undefined){
        delete locator.sensors.iBeaconRcvrs[socketID];
        console.log('Deleted beacon reciever\n');

        if(locator.visibleBeacons[socketID] != undefined){
            console.log('Deleted beacon reciever visible beacons\n');
            delete locator.visibleBeacons[socketID];
        }
    }

    
    console.log('\n Beacons Transmitters \n' + locator.sensors.iBeacons + '\n');
    console.log('\n Beacons Recievers \n' + locator.sensors.iBeaconRcvrs + '\n');
    console.log('\n Beacons Visible Beacons \n' + locator.visibleBeacons + '\n');
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

;





