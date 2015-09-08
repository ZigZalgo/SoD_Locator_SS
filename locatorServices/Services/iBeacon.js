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
var timeInterval = (1/30);
var devices = {};

//Sensors
var persons = {};
//Valid it it left the kinnect view
var validToUpdatePersonLocation = {};

var personsToSocketIds = {};


var counter = 0; 


//-------------------------    Registration   ---------------------------------------------------------------------------//

// handles when registerBeacon gets called
exports.registerIBeaconHandler = function(socket,sensorInfo,callback){

    // Generating a Beacon sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        
        if(sensorInfo.beaconType == "Tr"){
            //Transmitter beacon
            //console.log('Beacon typ is Transmitter.');
            registerIBeacon(socket, sensorInfo, callback);
            //registerBeaconTemporarily(socket, sensorInfo, callback);
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
        if(checkIfBeaconAlreadyRegistered(iBeacon) == false){
            locator.sensors.iBeacons[iBeacon.minor] = iBeacon;
            socket.emit('registered',{data:iBeacon.beaconType}); 

            console.log('Beacon Tr registration is confirmed with the following info:\n' + JSON.stringify(locator.sensors.iBeacons[socket.id]));
            console.log('Printing the new Tr Beacons list');
            console.log(locator.sensors.iBeacons);  
        }else{
            console.log('Beacon Tr is already registered///.');
        }
        
    } else{
        console.log('Beacon Tr is already registered.');
    } 
}

function checkIfBeaconAlreadyRegistered (beacon){
    for (ibeacon in locator.sensors.iBeacons){
        if(beacon.uuid == locator.sensors.iBeacons[ibeacon].uuid){
            if(beacon.major == locator.sensors.iBeacons[ibeacon].major){
                if(beacon.minor == locator.sensors.iBeacons[ibeacon].minor){
                    return true;
                }
            }
        }
    }
    return false;
}

//TODO - delete this function
function registerBeaconTemporarily (socket, sensorInfo, callback){
    
    // var deviceSocketID = checkIfExisted(sensorInfo.name);
    // var iBeacon = new factory.iBeacon(socket, sensorInfo, deviceSocketID);

    // if(locator.sensors.iBeacons[iBeacon.minor] == undefined){
    //     locator.sensors.iBeacons[iBeacon.minor] = iBeacon;
    //     socket.emit('registered',{data:iBeacon.beaconType}); 

    //     console.log('Beacon Tr registration is confirmed with the following info:\n' + JSON.stringify(locator.sensors.iBeacons[socket.id]));
    //     console.log('Printing the new Tr Beacons list');
    //     console.log(locator.sensors.iBeacons);  
    // }

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
            //console.log('\tDevice with given name is found');
            return socketID;
        }
    }

    if(bool == false){
        //console.log('No device name found with the given name');
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


exports.cleanUp = function (socketID){
    /*
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
    */
}


//-------------------------  End of Beacons   ---------------------------------------------------------------------------//





//-------------------------  Start of Device Sensors   ---------------------------------------------------------------------------//

exports.calibrateKinnectLocationWithDeviceSenosorLocation = function(socketID, data){
    console.log('Calibrate Kinnect with device sensors');
    calibrate(socketID, data.personId);
}


exports.personLeavesKinnectView = function(updatedPerson){
    personLeavesKinnectView(updatedPerson);
}
 

//TODO - Change Name to 'updatePersonLocationFromSensorUpdates'
exports.updateSpeedAndOrientation = function(socket, sensorData, fn){
    console.log('updatePersonLocationFromSensorUpdates with device sensors');
    updatePersonLocationFromSensorUpdates(socket, sensorData);
}


exports.updatePersonLocationWithBeaconReadings = function(socket, data, fn){
    updatePersonLocationFromBeaconReadings(socket.id, data);
}


exports.clearPersonFromLists = function (socket, personData, fn){
    deletePersonFromPersonList(socket, personData.personId);
}




/////       Helper Functions        ////

/* 
    In the calibration step:
        Save socketId to person ID to be able to alert the device later one once the person leaves the kinnect view
        for location updates

        TODO - delete third line
*/
function calibrate (socketID, personID){
    
    console.log('Calibration step wih ' + JSON.stringify(personID));
    try{
        personsToSocketIds[personID] = socketID;
        //persons[personID] = JSON.parse(JSON.stringify(locator.persons[personID]));
        //persons[personID].observerType = 'Device Sensors';
    } catch(err){
         console.log('error calibrate ' + 'due to' + err);
    } 
}

/* 
    Gets Called whenever the person leaves the kinnect view 
    As a result: Ask the device for location updates either by sensors or beacons
                 Save last known location by kinnect for the person
*/

function personLeavesKinnectView (personData){

    console.log('Person with the following information has left the kinnect view' + JSON.stringify(personData));

    try{
        //Alert the device to update its location using either its sensors, beacons or both
        if(personsToSocketIds[personData.uniquePersonID] != undefined){
            personsToSocketIds[personData.uniquePersonID].emit("updatePersonLocation", {});
            
            //Save the last known person location by kinnect
            persons[personData.uniquePersonID] = JSON.parse(JSON.stringify(personData));
        }

        
    } catch(err){
         console.log('error personLeavesKinnectView ' + 'due to' + err);
    }  
}


/*
    Given the following Info
        - Approx. distance covered by the device calculated step counting sensor
        - Yaw : rotation angles around z axis (prependicular to vertical and horizontal plane). 
        - personId : id of the person who is associated with the device that is doing the readings
    This function takes the approx. distance and split into x and z component using the following formula
        X-component = Approx. distance * cos(yaw). 
        Z-component = Approx. distance * sin(yaw). 
    Once done, it updates the person location using the following formula
        Person's X new location = perosn's X old location + X-component;
        Person's Z new location = perosn's Z old location + Z-component;
*/
function updatePersonLocationFromSensorUpdates (socketID, sensorData)
{


    try{

        getOrientationFromTwoLocations(previousKinnectDeviceLocation, locator.persons[sensorData.personId].location, sensorData.orientation);
       
        //Check if person with the same id exists (Tracked by sensor location updates)
        if(persons[sensorData.personId] != undefined){

            var distanceInX = (sensorData.distance  * math.cos(math.unit(sensorData.orientation.yaw, 'deg'))).toFixed(3);
            var distanceInZ = (sensorData.distance  * math.sin(math.unit(sensorData.orientation.yaw, 'deg'))).toFixed(3);

            console.log(' distance in X ' + distanceInX);
            console.log(' distance in Z ' + distanceInZ);
                
            persons[sensorData.personId].location.X = parseFloat(persons[sensorData.personId].location.X) + parseFloat(distanceInX);
            persons[sensorData.personId].location.Y = 1;
            persons[sensorData.personId].location.Z = parseFloat(persons[sensorData.personId].location.Z) + parseFloat(distanceInZ);

            persons[sensorData.personId].location.X = persons[sensorData.personId].location.X.toFixed(4);
            persons[sensorData.personId].location.Z = persons[sensorData.personId].location.Z.toFixed(4);

            console.log(' updated distance in X ' + persons[sensorData.personId].location.X);
            console.log(' updated distance in Z ' + persons[sensorData.personId].location.Z);


            //Update original list (locator.persons)
            if(locator.persons[sensorData.personId] == undefined){

                locator.persons[sensorData.personId] = JSON.parse(JSON.stringify(persons[sensorData.personId]));

            } else{

                locator.persons[sensorData.personId].location.X = persons[sensorData.personId].location.X;
                locator.persons[sensorData.personId].location.Y = persons[sensorData.personId].location.Y;
                locator.persons[sensorData.personId].location.Z = persons[sensorData.personId].location.Z;
                locator.persons[sensorData.personId].observerType = 'Device Sensors';
            }
        
        } else{
                console.log('Not Valid yet to update its location');
                console.log('Orientations that come from the device and from Kinnect');

        }
           
    } catch(err){
         console.log('error updatePersonLocation ' + 'due to' + err);
    } 
}


/*
    Given the following information
        - At least three beacons are visible to the device
        - 3 distancees from device to beacons (radious). 
        - The geographical location of each beacon (Known at the calibration stage- static beacons)
            which will represent the center of the three circles. 

    Using the radiouses(d) and the center of circles(beacons locations), make three circles
    Find the intersection of the three circles(beacons cricles) to determine the location of the device/person

    Link - https://answers.yahoo.com/question/index?qid=20110127015240AA9RjyZ
*/
function updatePersonLocationFromBeaconReadings (socketID, beaconReadingsData)
{

    console.log('Inside updatePersonLocationFromBeaconReadings');
    var equationOne = {x:0, z:0, offset:0};
    var equationTwo = {x:0, z:0, offset:0};
    var equationThree = {x:0, z:0, offset:0};
    
    var equationFour = {x:0, z:0, offset:0};
    var equationFive = {x:0, z:0, offset:0};

    //Get beacons Location with the corresponding radious
    var beacons = getBeaconsLocationWithTheirCorresspondingRadious(beaconReadingsData);

    equationOne.x = parseInt(beacons.beaconOne.location.x)*(-2);
    equationOne.z = parseInt(beacons.beaconOne.location.z)*(-2);
    equationOne.offset =  Math.pow(parseInt(beacons.beaconOne.radious), 2)-(Math.pow(parseInt(beacons.beaconOne.location.x),2) +
                                                                            Math.pow(parseInt(beacons.beaconOne.location.z),2));
    console.log("Equation One is " + equationOne.x + "X " + equationOne.z + "Z " + " = " + equationOne.offset)
   

    equationTwo.x = parseInt(beacons.beaconTwo.location.x)*(-2);
    equationTwo.z = parseInt(beacons.beaconTwo.location.z)*(-2);
    equationTwo.offset =  Math.pow(parseInt(beacons.beaconTwo.radious), 2)-(Math.pow(parseInt(beacons.beaconTwo.location.x),2) +
                                                                            Math.pow(parseInt(beacons.beaconTwo.location.z),2));
    console.log("Equation Two is " + equationTwo.x + "X " + equationTwo.z + "Z " + " = " + equationTwo.offset)
    

    equationThree.x = parseInt(beacons.beaconThree.location.x)*(-2);
    equationThree.z = parseInt(beacons.beaconThree.location.z)*(-2);
    equationThree.offset =  Math.pow(parseInt(beacons.beaconThree.radious), 2)-(Math.pow(parseInt(beacons.beaconThree.location.x),2) +
                                                                            Math.pow(parseInt(beacons.beaconThree.location.z),2));
    console.log("Equation Three is " + equationThree.x + "X " + equationThree.z + "Z " + " = " + equationThree.offset)



    //Equation one == Equation Two ==> results in Equation Four
    equationFour.x = equationOne.x - equationTwo.x;
    equationFour.z = equationOne.z - equationTwo.z;
    equationFour.offset = equationTwo.offset - equationOne.offset;
    console.log("Equation one == Equation Two : " + equationFour.x + "X " + equationFour.z + "Z " + " = " + equationFour.offset)
    
    //Equation one == Equation Three ==> results in Equation Five
    equationFive.x = equationOne.x - equationThree.x;
    equationFive.z = equationOne.z - equationThree.z;
    equationFive.offset = equationThree.offset - equationOne.offset;
    console.log("Equation one == Equation Three : " + equationFive.x + "X " + equationFive.z + "Z " + " = " + equationFive.offset)
    
    var matrix = [[equationFour.x, equationFour.z, equationFour.offset],[equationFive.x, equationFive.z, equationFive.offset]];
    var values = getMatrixValues(matrix);

    console.log("New Perosn Location is " + JSON.stringify(values));
    console.log("First Perosn List " + JSON.stringify(persons));
    
    if(persons[beaconReadingsData.personId] != undefined){
        
        persons[beaconReadingsData.personId].location.X = values[0];
        persons[beaconReadingsData.personId].location.Z = values[1];
        
        //Update original list (locator.persons)
        if(locator.persons[beaconReadingsData.personId] == undefined){
            locator.persons[beaconReadingsData.personId] = JSON.parse(JSON.stringify(persons[beaconReadingsData.personId]));
            console.log("updated person location is " + locator.persons[beaconReadingsData.personId]);
        } else{

            locator.persons[beaconReadingsData.personId].location.X = persons[beaconReadingsData.personId].location.X;
            locator.persons[beaconReadingsData.personId].location.Y = persons[beaconReadingsData.personId].location.Y;
            locator.persons[beaconReadingsData.personId].location.Z = persons[beaconReadingsData.personId].location.Z;
            locator.persons[beaconReadingsData.personId].observerType = 'Beacon Sensors';
            frontend.io.sockets.emit("refreshWebClientSensors", {});
        }
    } else{
        console.log('Not Valid yet to update its location');
        console.log('Orientations that come from the device and from Kinnect');

    }
}


/**
    Data has to contain at least three beacons distances to the device (radiouses)
    This function will read the beacons location (static locations)
**/
function getBeaconsLocationWithTheirCorresspondingRadious (data){
   
   // var beacons = {
   //      beaconOne:{radious:41, location:{x:3, y:0, z:-50}},
   //      beaconTwo:{radious:13, location:{x:-11, y:0, z:2}},
   //      beaconThree:{radious:25, location:{x:-13, y:0, z:-34}},
   //  };

    var beacons = {};
    beacons["beaconOne"] = {};
    beacons["beaconTwo"] = {};
    beacons["beaconThree"] = {};


    var beaconOne = {};
    beaconOne["location"] = {};
    var beaconTwo = {};
    beaconTwo["location"] = {};
    var beaconThree = {};
    beaconThree["location"] = {};

    console.log('Data arrived at getBeaconsLocationWithTheirCorresspondingRadious' + JSON.stringify(data));
    var i = 0; 
    var saved = "saved-";

    console.log("locator Beacons are :\n" + JSON.stringify(locator.sensors.iBeacons));
    for(var beacon in data){
        if(locator.sensors.iBeacons[data[beacon].minor] != undefined){
            console.log("ELements");

            if(i == 0) {
                console.log("ELement One " + JSON.stringify(locator.sensors.iBeacons[data[beacon].minor].location));
                console.log("radious " + data[beacon].radious)
                console.log("X " + locator.sensors.iBeacons[data[beacon].minor].location.X)
                console.log("Y " + locator.sensors.iBeacons[data[beacon].minor].location.Y)
                console.log("Z " + locator.sensors.iBeacons[data[beacon].minor].location.Z)

                var radious = data[beacon].radious;
                var x = locator.sensors.iBeacons[data[beacon].minor].location.X;
                var y = locator.sensors.iBeacons[data[beacon].minor].location.Y;
                var z = locator.sensors.iBeacons[data[beacon].minor].location.Z;

                beaconOne.radious = radious;
                beaconOne["location"]["x"] = x;
                beaconOne["location"]["y"] = y;
                beaconOne["location"]["z"] = z;
            }
            if(i == 1) {
                console.log("ELement Two " + JSON.stringify(locator.sensors.iBeacons[data[beacon].minor].location));
                console.log("radious " + data[beacon].radious)
                console.log("X " + locator.sensors.iBeacons[data[beacon].minor].location.X)
                console.log("Y " + locator.sensors.iBeacons[data[beacon].minor].location.Y)
                console.log("Z " + locator.sensors.iBeacons[data[beacon].minor].location.Z)

                var radious = data[beacon].radious;
                var x = locator.sensors.iBeacons[data[beacon].minor].location.X;
                var y = locator.sensors.iBeacons[data[beacon].minor].location.Y;
                var z = locator.sensors.iBeacons[data[beacon].minor].location.Z;

                beaconTwo.radious = radious;
                beaconTwo["location"]["x"] = x;
                beaconTwo["location"]["y"] = y;
                beaconTwo["location"]["z"] = z;
            }

            if(i == 2) {
                console.log("ELement Three " + JSON.stringify(locator.sensors.iBeacons[data[beacon].minor].location));
                console.log("radious " + data[beacon].radious)
                console.log("X " + locator.sensors.iBeacons[data[beacon].minor].location.X)
                console.log("Y " + locator.sensors.iBeacons[data[beacon].minor].location.Y)
                console.log("Z " + locator.sensors.iBeacons[data[beacon].minor].location.Z)

                var radious = data[beacon].radious;
                var x = locator.sensors.iBeacons[data[beacon].minor].location.X;
                var y = locator.sensors.iBeacons[data[beacon].minor].location.Y;
                var z = locator.sensors.iBeacons[data[beacon].minor].location.Z;

                beaconThree.radious = radious;
                beaconThree["location"]["x"] = x;
                beaconThree["location"]["y"] = y;
                beaconThree["location"]["z"] = z;
            }
        } else if(locator.sensors.iBeacons[saved + data[beacon].minor] != undefined){
            console.log('Beacons was in the config file');
            var locatorId = saved + data[beacon].minor;

            if(i == 1) {
                console.log("ELement One " + JSON.stringify(locator.sensors.iBeacons[locatorId].location));
                console.log("radious " + data[beacon].radious)
                console.log("X " + locator.sensors.iBeacons[locatorId].location.X)
                console.log("Y " + locator.sensors.iBeacons[locatorId].location.Y)
                console.log("Z " + locator.sensors.iBeacons[locatorId].location.Z)

                var radious = data[beacon].radious;
                var x = locator.sensors.iBeacons[locatorId].location.X;
                var y = locator.sensors.iBeacons[locatorId].location.Y;
                var z = locator.sensors.iBeacons[locatorId].location.Z;

                beaconOne.radious = radious;
                beaconOne["location"]["x"] = x;
                beaconOne["location"]["y"] = y;
                beaconOne["location"]["z"] = z;
            }
            if(i == 2) {
                console.log("ELement Two " + JSON.stringify(locator.sensors.iBeacons[locatorId].location));
                console.log("radious " + data[beacon].radious)
                console.log("X " + locator.sensors.iBeacons[locatorId].location.X)
                console.log("Y " + locator.sensors.iBeacons[locatorId].location.Y)
                console.log("Z " + locator.sensors.iBeacons[locatorId].location.Z)

                var radious = data[beacon].radious;
                var x = locator.sensors.iBeacons[locatorId].location.X;
                var y = locator.sensors.iBeacons[locatorId].location.Y;
                var z = locator.sensors.iBeacons[locatorId].location.Z;

                beaconTwo.radious = radious;
                beaconTwo["location"]["x"] = x;
                beaconTwo["location"]["y"] = y;
                beaconTwo["location"]["z"] = z;
            }

            if(i == 3) {
                console.log("ELement Three " + JSON.stringify(locator.sensors.iBeacons[locatorId].location));
                console.log("radious " + data[beacon].radious)
                console.log("X " + locator.sensors.iBeacons[locatorId].location.X)
                console.log("Y " + locator.sensors.iBeacons[locatorId].location.Y)
                console.log("Z " + locator.sensors.iBeacons[locatorId].location.Z)

                var radious = data[beacon].radious;
                var x = locator.sensors.iBeacons[locatorId].location.X;
                var y = locator.sensors.iBeacons[locatorId].location.Y;
                var z = locator.sensors.iBeacons[locatorId].location.Z;

                beaconThree.radious = radious;
                beaconThree["location"]["x"] = x;
                beaconThree["location"]["y"] = y;
                beaconThree["location"]["z"] = z;
            }

        }


        i++;
    }

    beacons["beaconOne"] = beaconOne;
    beacons["beaconTwo"] = beaconTwo;
    beacons["beaconThree"] = beaconThree;

    console.log('Beacons Locations and their corresponding radiouses \n' + JSON.stringify(beacons));
    return beacons;
}



/**
    Given a matrix of the form 
        1   2   3   | 1  
        4   5   6   | 1  
        1   0   1   | 1 
    This function will solve this matrix resulting in
    Result: 0 -1 1  

    Link: http://martin-thoma.com/solving-linear-equations-with-gaussian-elimination/#tocAnchor-1-4
**/
function getMatrixValues (A){
    var n = A.length;

    for (var i=0; i<n; i++) {
        // Search for maximum in this column
        var maxEl = Math.abs(A[i][i]);
        var maxRow = i;
        for(var k=i+1; k<n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for (var k=i; k<n+1; k++) {
            var tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }

        // Make all rows below this one 0 in current column
        for (k=i+1; k<n; k++) {
            var c = -A[k][i]/A[i][i];
            for(var j=i; j<n+1; j++) {
                if (i==j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
        }
    }

    // Solve equation Ax=b for an upper triangular matrix A
    var x = new Array(n);
    for (var i=n-1; i>-1; i--) {
        x[i] = A[i][n]/A[i][i];
        for (var k=i-1; k>-1; k--) {
            A[k][n] -= A[k][i] * x[i];
        }
    }
    return x;
}

/*
    Delete perons with the given personID from all tracking lists
*/
function deletePersonFromPersonList (socketID,  personID){
    console.log('Trying to delete person form both lists');
    
    try{

        if(persons[personID] != undefined){
            delete persons[personID];
            console.log('deleted from the secondary list');
            if(locator.persons[personID] != undefined){
                delete locator.persons[personID];
                console.log('deleted from the main list');
            }
        } else{
            console.log('No person is found with the given ID' + personID);
        }
        
        frontend.io.sockets.emit("refreshWebClientSensors", {});
    } catch (err){
        console.log('unable to delete from persons List due to' + err);
    }
}


/** 
    Given Location One and Location Two, It will return the rotation angles in all axes
**/
function getOrientationFromTwoLocations (locationOne, locationTwo, orientation){

    console.log('Location one is ' + JSON.stringify(locationOne));
    console.log('Location two is ' + JSON.stringify(locationTwo));

    var rotationAnglesInDegress = {rotationInx:0, rotationInY:0, rotationInZ:0};

    if(locationOne.X != locationTwo.X || locationOne.Y != locationTwo.Y || locationOne.Z != locationTwo.Z){
        //Get Distance traveled in X, Y, Z
        var distanceInX = locationTwo.X - locationOne.X;
        var distanceInY = locationTwo.Y - locationOne.Y;
        var distanceInZ = locationTwo.Z - locationOne.Z;

        //Get rotations angles in degrees
        var rotationInx = 90 - (math.atan(distanceInZ/distanceInY) * (180/Math.PI));
        var rotationInY = 90 - (math.atan(distanceInZ/distanceInX) * (180/Math.PI));
        var rotationInZ = 90 - (math.atan(distanceInX/distanceInY) * (180/Math.PI));
        
        rotationAnglesInDegress.rotationInx = rotationInx;
        rotationAnglesInDegress.rotationInY = rotationInY;
        rotationAnglesInDegress.rotationInZ = rotationInZ;
        
        //Update the previous location to be the new location
        previousKinnectDeviceLocation.X = locationTwo.X;
        previousKinnectDeviceLocation.Y = locationTwo.Y;
        previousKinnectDeviceLocation.Z = locationTwo.Z;

        previousKinnectDeviceRotations.X = rotationAnglesInDegress.rotationInx;
        previousKinnectDeviceRotations.Y = rotationAnglesInDegress.rotationInY;
        previousKinnectDeviceRotations.Z = rotationAnglesInDegress.rotationInZ;

    } else{
        rotationAnglesInDegress.rotationInx = previousKinnectDeviceRotations.X;
        rotationAnglesInDegress.rotationInY = previousKinnectDeviceRotations.Y;
        rotationAnglesInDegress.rotationInZ = previousKinnectDeviceRotations.Z;
    } 

    console.log('Kinnect Rotations : rotationInx ' + rotationAnglesInDegress.rotationInx + ' rotationInY ' + rotationAnglesInDegress.rotationInY 
        + ' rotationInZ ' + rotationAnglesInDegress.rotationInZ);
    console.log('Device Rotations  : rotationInx ' + orientation.pitch + ' rotationInY ' + orientation.roll + 
            ' rotationInZ ' + orientation.yaw);
   
 
    
    return rotationAnglesInDegress;
}







//------------------------- End of Device Sensors  ---------------------------------------------------------------------------//

setInterval(function() { 
        if(counter == 5){
            //testCase();
            //testCase2(); //Change person color once they leave the kinnect FOV
            //testCase3(); //print orientation calculated from  two locations.
        }

        counter = counter + 1;
    }, 5000);



//Test Case
function testCase (){

    var personID = 0;
    var socketID = 111111111;
    
    if(locator.persons[personID] != undefined){
        persons[socketID] = JSON.parse(JSON.stringify(locator.persons[personID]));


        delete locator.persons[personID];
        
        setInterval(function() {  
            console.log('updating person Location');
            testHelper(socketID, 1, 45);
        }, 10000);
    }
}

function testCase2(){
    var person = JSON.parse(JSON.stringify(locator.persons[0]));
    person.observerType = 'beacons';

    locator.persons[0] = person;
}

function testCase3 (){
    var locationOne = {X: 0, Y: 0, Z:0};
    var locationTwo = {X: 1, Y: 1, Z:1};
    var orientation = {yaw:0, pitch: 0, roll:0};

    getOrientationFromTwoLocations(locationOne, locationTwo, orientation);
}

function testHelper (socketID, distance, angle){
    var sensorData = {
                        distance:{}, 
                        orientation:
                            {yaw:{}
                        }
                    };

    sensorData.distance = distance;
    sensorData.orientation.yaw = angle;

    console.log('Update Person Location with the following info ' + JSON.stringify(sensorData));

    updatePersonLocation(socketID, sensorData);
}


function updateSpeedAndRotationsRateToGetOffset(locationTwo, data){

    // console.log('\nTrying to update the speed and Orientation of the device');
    // console.log('previous location' + JSON.stringify(previousKinnectDeviceLocation));
    // console.log('previous Rotations' + JSON.stringify(previousKinnectDeviceRotations));
    try{
        var speedAndRotationsInformation = {speed:{}, 
                rotationsInformation:
                {
                    rotationsRate:{rotationXRate:0, rotationYRate:0, rotationZRate:0}, 
                    rotationsAngles:{rotationX:0, rotationY:0, rotationZ:0}
                }
            };

        //Get Speed based in kinnect info
        var distanceInX = locationTwo.X - previousKinnectDeviceLocation.X;
        var distanceInY = locationTwo.Y - previousKinnectDeviceLocation.Y;
        var distanceInZ = locationTwo.Z - previousKinnectDeviceLocation.Z;
        // console.log('distance in X ' + distanceInX + ' distance in Y ' + distanceInY + ' distance in Z  ' + distanceInZ);

        var distance = Math.sqrt(Math.pow(distanceInX, 2) + Math.pow(distanceInY, 2) + Math.pow(distanceInZ, 2));
        speedAndRotationsInformation.speed = (distance/timeInterval);

        //Get rotations angles in degrees
        var rotationInx = 90 - (math.atan(distanceInZ/distanceInY) * (180/Math.PI));
        var rotationInY = 90 - (math.atan(distanceInZ/distanceInX) * (180/Math.PI));
        var rotationInZ = 90 - (math.atan(distanceInX/distanceInY) * (180/Math.PI));
        console.log('rotationInx ' + rotationInx + ' rotationInY ' + rotationInY + ' rotationInZ ' + rotationInZ);
        
        //update rotationsa angles in radians
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

        //update the old rotation angles to be the next rotation
        previousKinnectDeviceRotations.rotationX = rotationInx;
        previousKinnectDeviceRotations.rotationY = rotationInY;
        previousKinnectDeviceRotations.rotationZ = rotationInZ;

        // console.log('Updated speed and RotationRates' + JSON.stringify(speedAndRotationsInformation));
        // console.log('Updated previous location' + JSON.stringify(previousKinnectDeviceLocation));
        // console.log('Updated previous Rotations' + JSON.stringify(previousKinnectDeviceRotations) + '\n\n');

        //Log the updates
        //LogUpdatesToAFile(data, speedAndRotationsInformation);

    }catch(err){
            console.log('Failed to get the speed and orientation of device due to: '+err);
    }
}



function LogUpdatesToAFile(data, speedAndRotations)
{
    // console.log("Logging the updates .....")
    var date = new Date();
    var kinnectData = {speed:{}, rotationsRate:{rotationXRate:0, rotationYRate:0, rotationZRate:0}, timeStamp:date};
    var deviceData = {speed:{}, rotationsRate:{rotationXRate:0, rotationYRate:0, rotationZRate:0}, timeStamp:date}
    
    //Get device data 
    deviceData.speed = data.speed;
    deviceData.rotationsRate.rotationXRate = data.rotationsRate.rotationXRate;
    deviceData.rotationsRate.rotationYRate = data.rotationsRate.rotationYRate;
    deviceData.rotationsRate.rotationZRate = data.rotationsRate.rotationZRate;

    
    //Get Kinnect Data
    kinnectData.speed = speedAndRotations.speed;
    kinnectData.rotationsRate.rotationXRate = speedAndRotations.rotationsInformation.rotationsRate.rotationXRate;
    kinnectData.rotationsRate.rotationYRate = speedAndRotations.rotationsInformation.rotationsRate.rotationYRate;
    kinnectData.rotationsRate.rotationZRate = speedAndRotations.rotationsInformation.rotationsRate.rotationZRate;

    // console.log('Device Data ' + JSON.stringify(deviceData) );
    // console.log('kinnectData ' + JSON.stringify(kinnectData));
    
    fs.appendFileSync('/Users/hal9000/Desktop/ASELAB/Kinnectlog.txt', '\n'+ JSON.stringify(kinnectData) + '\n', encoding='utf8');
    fs.appendFileSync('/Users/hal9000/Desktop/ASELAB/Devicelog.txt', '\n' + JSON.stringify(deviceData) + '\n', encoding='utf8');

    // console.log("Done logging.")
}


function getDeviceSocketID (deviceID){
    for(var socketID in locator.devices){
        if(locator.devices[socketID].uniqueDeviceID == deviceID){
            console.log('\tFound the device with the same ID');
            return socketID;
        }
    }
     return null;
}



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

var maxPresumePeopleNumber = -1; // Globle to current module
exports.updateMaxPresumePeopleNumber = function(maxPeopleNumber, callback){
    //locator.updateDeviceOrientation(req.params.orientation,req.params.id);
    //console.log('-> '+maxPeopleNumber);
    maxPresumePeopleNumber = maxPeopleNumber;
    console.log("change maxPresumePeopleNumber to: "+maxPresumePeopleNumber);
    callback(1)
}

setInterval(function() {  
    //refreshBeaconsLocation();

}, 500);

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






