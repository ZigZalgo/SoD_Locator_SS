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


//Sensors/Beacons
var personsToSocketIds = {};
var persons = {};
var deviceSensorData = {};
var beaconData = {}; 


//-------------------------    Registration   ---------------------------------------------------------------------------//

// handles when registerBeacon gets called
exports.registerIBeaconHandler = function(socket,sensorInfo,callback){

    // Generating a Beacon sensor object to be added to list
    if (Object.keys(sensorInfo).length != 0) {
        
        if(sensorInfo.beaconType == "Tr"){
            //Transmitter beacon
            console.log('Registering Transmitter Beacon ...');
            registerIBeacon(socket, sensorInfo, callback);
            //registerBeaconTemporarily(socket, sensorInfo, callback);
        } 
        else if (sensorInfo.beaconType == "Rcvr"){
            //Reciever Beacon
            console.log('Registering Beacon Reciever ...');
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

/*
    return true if the provided beacon is already in the list of beacons tracked by the server
    using the minor, major and uuid. 
    return false otherwise.
*/
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
    //console.log('Calibrate Kinnect with device sensors');
    //calibrate(socketID, data.personId);
    setUpForLogging (data.personId);
}


exports.personLeavesKinnectView = function(updatedPerson){
    //personLeavesKinnectView(updatedPerson);
}
 

//TODO - Change Name to 'updatePersonLocationFromSensorUpdates'
exports.updateSpeedAndOrientation = function(socket, sensorData, fn){
    //console.log('updatePersonLocationFromSensorUpdates with device sensors');
    //updatePersonLocationFromSensorUpdates(socket, sensorData);
    updatePersonLocationFromSensorUpdatesForLogging(socket, sensorData);
}


exports.updatePersonLocationWithBeaconReadings = function(socket, data, fn){
    //updatePersonLocationFromBeaconReadings(socket.id, data);
    updatePersonLocationFromBeaconReadingsForLogging(socket.id, data);
}


exports.clearPersonFromLists = function (socket, personData, fn){
    deletePersonFromPersonList(socket, personData.personId);
}



/* 
    In the calibration step:
        Save socketId to person ID to be able to alert the device later one once the person leaves the kinnect view
        for location updates

        TODO - delete third line
*/
function calibrate (socketID, personId){
    
    console.log('Calibration step wih ' + JSON.stringify(personId));
    try{
        personsToSocketIds[personId] = socketID;
    } catch(err){
         console.log('error calibrate ' + 'due to' + err);
    }
}

/* 
    Gets Called whenever the person leaves the kinnect view 
    As a result: Ask the device for location updates either by sensors or beacons
                 Save last known location by kinnect for the person

    TODO - update locater.js to call this function when a person is paired with a device
         - Uncomment this
*/

function personLeavesKinnectView (personData){

    //console.log('Person with the following information has left the kinnect view' + JSON.stringify(personData));
    try{
        if(personsToSocketIds[personData.uniquePersonID] != undefined){
            
            //Alert the device to update its location using either its sensors, beacons or both
            //personsToSocketIds[personData.uniquePersonID].emit("updatePersonLocation", {});
            
            //Save the last known person location by kinnect
            persons[personData.uniquePersonID] = JSON.parse(JSON.stringify(personData));
            persons[personData.uniquePersonID].observerType = 'Device Sensors';     
            
            deviceSensorData[personData.uniquePersonID] = {distance:0, 
                                            location:{X:persons[personData.uniquePersonID].location.X, Y:persons[personData.uniquePersonID].location.Y, Z:persons[personData.uniquePersonID].location.Z}, 
                                            rotationAnglesInDegress:{yaw:0, pitch:0, roll:0}};
            beaconData[personData.uniquePersonID] = {location:{X:persons[personData.uniquePersonID].location.X, Y:persons[personData.uniquePersonID].location.Y, Z:persons[personData.uniquePersonID].location.Z}};
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

        if(persons[sensorData.personId] != undefined){
            //Left kinnect view
            var newLocation = getPersonLocationFromSensors(sensorData.distance, sensorData.orientation.yaw, persons[sensorData.personId].location);
            
            deviceSensorData[sensorData.personId].distance = sensorData.distance;
            deviceSensorData[sensorData.personId].location.X = newLocation.X;
            deviceSensorData[sensorData.personId].location.Z = newLocation.Z;
            deviceSensorData[sensorData.personId].rotationAnglesInDegress.yaw = sensorData.orientation.yaw;
            deviceSensorData[sensorData.personId].rotationAnglesInDegress.pitch = sensorData.orientation.pitch;
            deviceSensorData[sensorData.personId].rotationAnglesInDegress.roll = sensorData.orientation.roll;
            //console.log('Sensor Updates is '+ JSON.stringify(deviceSensorData[sensorData.personId]));
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
    if(persons[beaconReadingsData.personId] != undefined){
        //Left kinnect view
        var newLocation = getPersonLocationFromBeacons(beaconReadingsData);

        //Filter the beacons readings
        var updatedCurrentLocation = filterBeaconReadings(beaconData[beaconReadingsData.personId].location, newLocation);
        beaconData[beaconReadingsData.personId].location.X = updatedCurrentLocation.X;
        beaconData[beaconReadingsData.personId].location.Z = updatedCurrentLocation.Z;

        //console.log('Beacon Updates is '+ JSON.stringify(beaconData[beaconReadingsData.personId]));
        updatePersonLocationWithNewLocation(beaconReadingsData.personId);
    }

    else{
        //console.log('Not Valid yet to update its location');
    }
}




function triangulatePersonLocationFromBeaconReadings (socketID, beaconReadingsData){

    //Get beacons Location with the corresponding radius
    // var beacons = {
    //     beaconOne:{radious:41, location:{x:3, y:0, z:-50}},
    //     beaconTwo:{radious:13, location:{x:-11, y:0, z:2}},
    //     beaconThree:{radious:25, location:{x:-13, y:0, z:-34}},
    // }; 
    // console.log("Beacons are " + JSON.stringify(beacons));
    var beacons = getBeaconsLocationWithTheirCorresspondingRadious(beaconReadingsData);


    //Centers of the three circles - fix this
    var P1 = { x: parseFloat(beacons.beaconOne.location.x),
        y: parseFloat(beacons.beaconOne.location.y),
        z: parseFloat(beacons.beaconOne.location.z)};
    var P2 = { x: parseFloat(beacons.beaconTwo.location.x),
        y: parseFloat(beacons.beaconTwo.location.y),
        z: parseFloat(beacons.beaconTwo.location.z)};
    var P3 = { x: parseFloat(beacons.beaconThree.location.x),
        y: parseFloat(beacons.beaconThree.location.y),
        z: parseFloat(beacons.beaconThree.location.z)};

    var r_1 = parseFloat(beacons.beaconOne.radious);
    var r_2 = parseFloat(beacons.beaconTwo.radious);
    var r_3 = parseFloat(beacons.beaconThree.radious);
    
    var P2_P1 = sumVector(P2, negateVector(P1));
    var d = magnitudeOfVector(P2_P1);
    var e_x = divideVectorbyScalar(P2_P1, d);

    var P3_P1 = sumVector(P3, negateVector(P1));
    var i = dotProductOfTwoVectors(e_x, P3_P1);

    var ie_x = multiplyVectorbyScalar(e_x, i);
    var P3_P1_ie_x = sumVector(P3_P1, negateVector(ie_x));
    var e_y = divideVectorbyScalar(P3_P1_ie_x, magnitudeOfVector(P3_P1_ie_x));

    var j = dotProductOfTwoVectors(e_y, P3_P1);

    var x = (Math.pow(r_1, 2) - Math.pow(r_2, 2) + Math.pow(d, 2)) / (2 * d);
    var y = (Math.pow(r_1, 2) - Math.pow(r_3, 2) + Math.pow(i, 2) + Math.pow(j, 2)) / (2 *j) - (i/j)* x;

    var intersectionPoint = sumVector(P1, sumVector(multiplyVectorbyScalar(e_x, x), multiplyVectorbyScalar(e_y, y)));

    console.log("intersection Point is " + JSON.stringify(intersectionPoint));

    if(persons[beaconReadingsData.personId] != undefined){
        
        persons[beaconReadingsData.personId].location.X = intersectionPoint.x;
        persons[beaconReadingsData.personId].location.Z = intersectionPoint.z;

        //Update original list (locator.persons) - TODO refactor this code
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


/* Helper Functions */

function getPersonLocationFromSensors (distance, angle, previousLocation)
{

    var newLocation = {X:0, Y:0, Z:0};
    
    var distanceInX = (parseFloat(distance) * math.cos(math.unit(angle, 'deg'))).toFixed(3);
    var distanceInZ = (parseFloat(distance)  * math.sin(math.unit(angle, 'deg'))).toFixed(3);
    
    newLocation.X = parseFloat(previousLocation.X) + parseFloat(distanceInX);
    newLocation.Z = parseFloat(previousLocation.Z) + parseFloat(distanceInZ);
    
    newLocation.X = newLocation.X.toFixed(4);
    newLocation.Z = newLocation.Z.toFixed(4);

    return newLocation;
}

function getPersonLocationFromBeacons(beaconReadingsData)
{
    var newLocation = {};
    var equationOne = {x:0, z:0, offset:0};
    var equationTwo = {x:0, z:0, offset:0};
    var equationThree = {x:0, z:0, offset:0};
    
    var equationFour = {x:0, z:0, offset:0};
    var equationFive = {x:0, z:0, offset:0};

    //Get beacons Location with the corresponding radious
    var beacons = getBeaconsLocationWithTheirCorresspondingRadious(beaconReadingsData);
    
    equationOne.x = parseFloat(beacons.beaconOne.location.x)*(-2);
    equationOne.z = parseFloat(beacons.beaconOne.location.z)*(-2);
    equationOne.offset =  Math.pow(parseFloat(beacons.beaconOne.radious), 2)-(Math.pow(parseFloat(beacons.beaconOne.location.x),2) +
                                                                            Math.pow(parseFloat(beacons.beaconOne.location.z),2));   
    equationTwo.x = parseFloat(beacons.beaconTwo.location.x)*(-2);
    equationTwo.z = parseFloat(beacons.beaconTwo.location.z)*(-2);
    equationTwo.offset =  Math.pow(parseFloat(beacons.beaconTwo.radious), 2)-(Math.pow(parseFloat(beacons.beaconTwo.location.x),2) +
                                                                            Math.pow(parseFloat(beacons.beaconTwo.location.z),2));
    equationThree.x = parseFloat(beacons.beaconThree.location.x)*(-2);
    equationThree.z = parseFloat(beacons.beaconThree.location.z)*(-2);
    equationThree.offset =  Math.pow(parseFloat(beacons.beaconThree.radious), 2)-(Math.pow(parseFloat(beacons.beaconThree.location.x),2) +
                                                                            Math.pow(parseFloat(beacons.beaconThree.location.z),2));
    //Equation one == Equation Two ==> results in Equation Four
    equationFour.x = equationOne.x - equationTwo.x;
    equationFour.z = equationOne.z - equationTwo.z;
    equationFour.offset = equationTwo.offset - equationOne.offset;
    
    //Equation one == Equation Three ==> results in Equation Five
    equationFive.x = equationOne.x - equationThree.x;
    equationFive.z = equationOne.z - equationThree.z;
    equationFive.offset = equationThree.offset - equationOne.offset;
    
    //Solve the equations(4,5) to get X and Z values
    var matrix = [[equationFour.x, equationFour.z, equationFour.offset],[equationFive.x, equationFive.z, equationFive.offset]];
    var values = getMatrixValues(matrix);
    values[0] = -1 * parseFloat(values[0]);
    values[1] = -1 * parseFloat(values[1]);
    
    newLocation.X = values[0];
    newLocation.Z = values[1];

    return newLocation;
}

function updatePersonLocationWithNewLocation (personId)
{
    console.log('Previous Location is ' + JSON.stringify(persons[personId].location));
    console.log('Distance Sent From Sensors ' + deviceSensorData[personId].distance);
    console.log('Location Approx. From Sensors is ' + JSON.stringify(deviceSensorData[personId].location));
    console.log('Rotation Angles From Sensors ' + JSON.stringify(deviceSensorData[personId].rotationAnglesInDegress));
    console.log("Location Approx. From Beacons " + JSON.stringify(beaconData[personId].location));

    var filteredLocation = regression(persons[personId].location, deviceSensorData[personId].distance, 
            deviceSensorData[personId].location, deviceSensorData[personId].rotationAnglesInDegress, beaconData[personId].location);
    updateListWithNewLocation(personId, filteredLocation);
}


function filterBeaconReadings (previousLocation, currentLocation)
{

    var distance = 0;
    var maxDistance = 2;
    var updatedCurrentLocation = {X:currentLocation.X, Z:currentLocation.Z};

    distance = Math.sqrt(Math.pow(parseFloat((currentLocation.X) - parseFloat(previousLocation.X)), 2) 
        + Math.pow(parseFloat((currentLocation.Z) - parseFloat(previousLocation.Z)), 2));
     
    console.log('Calculated distance is ' + distance);

    if(distance > maxDistance){
        //filter
        console.log('Calculated distance is greater than 2 ');
        updatedCurrentLocation.X = previousLocation.X;
        updatedCurrentLocation.Z = previousLocation.Z;
    }

    return updatedCurrentLocation;
}


function regression (previousLocation, distance, locationFromDeviceSensors, deviceSensorAttitude, locationFromBeacon) 
{
    var filteredNewPersonLocation = {};

    //Coefficients For X
    var Xc1 = 1.0005777453083653;
    var Xc2 = -0.004128593247979738;
    var Xc3 = -0.02150378415284372;
    var Xc4 = 0.00401697019208289;
    var Xc5 = 0.0024411412401917736;
    var Xc6 = 0.000007768542613258376;
    var Xc7 = 0.0004064830592859838;
    var Xc8 = -6.702270899356888 * Math.pow(10, -7);
    var Xc9 = 0.002290223495516543;
    var Xc10 = -0.0005242321224923328;

    //Coefficients For Z
    var Zc1 = 0.007838682582534468;
    var Zc2 = 1.0002323418340708;
    var Zc3 = -0.020036976481169828;
    var Zc4 = -0.005546354522727104;
    var Zc5 = -0.003479226546057387;
    var Zc6 = 0.000015883328001277;
    var Zc7 = 0.0009205157706720997;
    var Zc8 = 0.000012793491439261746;
    var Zc9 = -0.002155883652313796;
    var Zc10 = 0.00010402709575781186;

    var newX = (Xc1 * parseFloat(previousLocation.X)) + (Xc2 * parseFloat(previousLocation.Z)) + (distance * Xc3)
                + (Xc4 * parseFloat(locationFromDeviceSensors.X)) + (Xc5 * parseFloat(locationFromDeviceSensors.Z))
                + (Xc6 * parseFloat(deviceSensorAttitude.yaw)) + (Xc7 * parseFloat(deviceSensorAttitude.pitch)) 
                + (Xc8 * parseFloat(deviceSensorAttitude.roll))
                + (Xc9 * parseFloat(locationFromBeacon.X)) + (Xc10 * parseFloat(locationFromBeacon.Z)); 

     var newZ = (Zc1 * parseFloat(previousLocation.X)) + (Zc2 * parseFloat(previousLocation.Z)) + (distance * Zc3)
                + (Zc4 * parseFloat(locationFromDeviceSensors.X)) + (Zc5 * parseFloat(locationFromDeviceSensors.Z))
                + (Zc6 * parseFloat(deviceSensorAttitude.yaw)) + (Zc7 * parseFloat(deviceSensorAttitude.pitch)) 
                + (Xc8 * parseFloat(deviceSensorAttitude.roll))
                + (Zc9 * parseFloat(locationFromBeacon.X)) + (Zc10 * parseFloat(locationFromBeacon.Z));

    filteredNewPersonLocation.X = newX;
    filteredNewPersonLocation.Z = newZ;

    //console.log('previous Location is ' + JSON.stringify(previousLocation));
    console.log('filteredNewPersonLocation is ' + JSON.stringify(filteredNewPersonLocation));

    return filteredNewPersonLocation;
}

function updateListWithNewLocation (personId, newLocation) {
    
    if(persons[personId] != undefined){
        persons[personId].location.X = newLocation.X;
        persons[personId].location.Z = newLocation.Z;
        
        //Update original list (locator.persons)
        if(locator.persons[personId] == undefined){
            locator.persons[personId] = JSON.parse(JSON.stringify(persons[personId]));
        } else{
            locator.persons[personId].location.X = newLocation.X;
            locator.persons[personId].location.Z = newLocation.Z;
        }
    }
}


function sumVector (firstVector, secondVector)
{
    var sum = {};
    sum.x = parseFloat(firstVector.x) + parseFloat(secondVector.x);
    sum.y = parseFloat(firstVector.y) + parseFloat(secondVector.y);
    sum.z = parseFloat(firstVector.z) + parseFloat(secondVector.z);

    return sum;
}

function negateVector (vector){
    
    var negation = {};
    negation.x = (-1) * parseFloat(vector.x);
    negation.y = (-1) * parseFloat(vector.y);
    negation.z = (-1) * parseFloat(vector.z);

    return negation;
}

function divideVectorbyScalar (vector, scalar){
    
    var division = {};
    division.x = parseFloat(vector.x) / parseFloat(scalar);
    division.y = parseFloat(vector.y) / parseFloat(scalar);
    division.z = parseFloat(vector.z) / parseFloat(scalar);

    return division;
}

function multiplyVectorbyScalar (vector, scalar){

    var product = {};
    product.x = parseFloat(vector.x) * parseFloat(scalar);
    product.y = parseFloat(vector.y) * parseFloat(scalar);
    product.z = parseFloat(vector.z) * parseFloat(scalar);

    return product;
}

function dotProductOfTwoVectors (firstVector, secondVector){
    var x = parseFloat(firstVector.x) * parseFloat(secondVector.x);
    var y = parseFloat(firstVector.y) * parseFloat(secondVector.y);
    var z = parseFloat(firstVector.z) * parseFloat(secondVector.z);

    return x + y + z;
}

function magnitudeOfVector (vector){
    return Math.sqrt(Math.pow(parseFloat(vector.x), 2) + Math.pow(parseFloat(vector.y),2) 
            + Math.pow(parseFloat(vector.z),2));
}

/**
    Data has to contain at least three beacons distances to the device (radiouses)
    This function will read the beacons location (static locations)
**/
function getBeaconsLocationWithTheirCorresspondingRadious (data)
{
   
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

    //console.log('Data arrived at getBeaconsLocationWithTheirCorresspondingRadious' + JSON.stringify(data));
    var i = 0; 
    var saved = "saved-";

    //console.log("locator Beacons are :\n" + JSON.stringify(locator.sensors.iBeacons));
    for(var beacon in data){
        if(locator.sensors.iBeacons[data[beacon].minor] != undefined){
        
            if(i == 0) {
                // console.log("ELement One " + JSON.stringify(locator.sensors.iBeacons[data[beacon].minor].location));
                // console.log("radious " + data[beacon].radious)
                // console.log("X " + locator.sensors.iBeacons[data[beacon].minor].location.X)
                // console.log("Y " + locator.sensors.iBeacons[data[beacon].minor].location.Y)
                // console.log("Z " + locator.sensors.iBeacons[data[beacon].minor].location.Z)

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
                // console.log("ELement Two " + JSON.stringify(locator.sensors.iBeacons[data[beacon].minor].location));
                // console.log("radious " + data[beacon].radious)
                // console.log("X " + locator.sensors.iBeacons[data[beacon].minor].location.X)
                // console.log("Y " + locator.sensors.iBeacons[data[beacon].minor].location.Y)
                // console.log("Z " + locator.sensors.iBeacons[data[beacon].minor].location.Z)

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
                // console.log("ELement Three " + JSON.stringify(locator.sensors.iBeacons[data[beacon].minor].location));
                // console.log("radious " + data[beacon].radious)
                // console.log("X " + locator.sensors.iBeacons[data[beacon].minor].location.X)
                // console.log("Y " + locator.sensors.iBeacons[data[beacon].minor].location.Y)
                // console.log("Z " + locator.sensors.iBeacons[data[beacon].minor].location.Z)

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
            //console.log('Beacons was in the config file');
            var locatorId = saved + data[beacon].minor;

            if(i == 1) {
                // console.log("ELement One " + JSON.stringify(locator.sensors.iBeacons[locatorId].location));
                // console.log("radious " + data[beacon].radious)
                // console.log("X " + locator.sensors.iBeacons[locatorId].location.X)
                // console.log("Y " + locator.sensors.iBeacons[locatorId].location.Y)
                // console.log("Z " + locator.sensors.iBeacons[locatorId].location.Z)

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
                // console.log("ELement Two " + JSON.stringify(locator.sensors.iBeacons[locatorId].location));
                // console.log("radious " + data[beacon].radious)
                // console.log("X " + locator.sensors.iBeacons[locatorId].location.X)
                // console.log("Y " + locator.sensors.iBeacons[locatorId].location.Y)
                // console.log("Z " + locator.sensors.iBeacons[locatorId].location.Z)

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
                // console.log("ELement Three " + JSON.stringify(locator.sensors.iBeacons[locatorId].location));
                // console.log("radious " + data[beacon].radious)
                // console.log("X " + locator.sensors.iBeacons[locatorId].location.X)
                // console.log("Y " + locator.sensors.iBeacons[locatorId].location.Y)
                // console.log("Z " + locator.sensors.iBeacons[locatorId].location.Z)

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
    
    //console.log('Beacons Locations and their corresponding radiouses \n' + JSON.stringify(beacons));
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

//------------------------- End of Device Sensors/Beacons   ---------------------------------------------------------------------------//





//------------------------- Logging  ---------------------------------------------------------------------------//

var sensorsReadingsList = {};
var beaconsReadingsList = {};

var sensorsReadingsStarted = true;
var beaconsReadingsStarted = true;
var loggingModeIsEnabled = true;

var previousKinnectLocation = {};
var previousBeaconLocation = {};

var distanceFromSensors = {};
var orientationFromSensor = {};
var accelVector = {};
var gyroVector = {};

var previousLocations = {};
var currentLocations = {};
var usersNotVisibleToKinnect = {};


function setUpForLogging (personId)
{
    console.log('Setting up for logging');  
    if(locator.persons[personId] != undefined){
        sensorsReadingsList[personId] = JSON.parse(JSON.stringify(locator.persons[personId]));
        beaconsReadingsList[personId] = JSON.parse(JSON.stringify(locator.persons[personId]));
        distanceFromSensors[personId] = 0;
        orientationFromSensor[personId] = {};
        accelVector[personId] = {};
        gyroVector[personId] = {};

        previousKinnectLocation[personId] = {};
        previousBeaconLocation[personId] = {};

        console.log('Done Setting up for logging');
    }
}


function updatePersonLocationFromSensorUpdatesForLogging(socketID, sensorData)
{
    try{
        //Check if person with the same id exists (Tracked by sensor location updates)
        if(sensorsReadingsList[sensorData.personId] != undefined){
            sensorsReadingsStarted == true 
            var newLocation = getPersonLocationFromSensors(sensorData.distance, sensorData.orientation.yaw, sensorsReadingsList[sensorData.personId].location);
            
            sensorsReadingsList[sensorData.personId].location.X = newLocation.X;
            sensorsReadingsList[sensorData.personId].location.Z = newLocation.Z;
            distanceFromSensors[sensorData.personId] = sensorData.distance;
            orientationFromSensor[sensorData.personId] = JSON.parse(JSON.stringify(sensorData.orientation));
            accelVector[sensorData.personId] = JSON.parse(JSON.stringify(sensorData.acceleration));
            gyroVector[sensorData.personId] = JSON.parse(JSON.stringify(sensorData.rotationsRate));

            WriteToALogFile(sensorData.personId);
        }
           
    } catch(err){
         console.log('error updatePersonLocationFromSensorUpdatesForLogging ' + 'due to' + err);
    } 
}


function updatePersonLocationFromBeaconReadingsForLogging (socketID, beaconReadingsData)
{
    if(beaconsReadingsList[beaconReadingsData.personId] != undefined){

        var newLocation = getPersonLocationFromBeacons(beaconReadingsData);
        var updatedCurrentLocation = filterBeaconReadings(beaconsReadingsList[beaconReadingsData.personId].location, newLocation);

        beaconsReadingsList[beaconReadingsData.personId].location.X = updatedCurrentLocation.X;
        beaconsReadingsList[beaconReadingsData.personId].location.Z = updatedCurrentLocation.Z;
        //console.log('Updating baacon logs with ' + JSON.stringify(beaconsReadingsList[beaconReadingsData.personId].location));

    } else {
        console.log('Not able to update beacon list of persons locations');
    }
}


function WriteToALogFile (personId) {
    //time stamp
    var date = new Date();

     //Get the data
    var logData = {kinnectData:{}, deviceSensorData:{}, beaconData:{}, timeStamp:date};
    logData.kinnectData = getKinnectData(personId);
    logData.deviceSensorData = getSensorData(personId);
    logData.beaconData = getBeaconData(personId);
        
    //Write to the log file
    console.log('\nData to log is \n' + JSON.stringify(logData));
    fs.appendFileSync('/Users/hal9000/Desktop/ASELAB/log.txt', '\n'+ JSON.stringify(logData) + '\n', encoding='utf8');
}

function getKinnectData (personId){

    var kinnectData = {location:{}, previousLocation:{}, rotationAnglesInDegress:{}};
    var location =  {X:0, Y:0, Z:0};
    var previousLocation =  JSON.parse(JSON.stringify(previousKinnectLocation[personId]));
   
    if(locator.persons[personId] != undefined){
       location.X = locator.persons[personId].location.X;
       location.Y = locator.persons[personId].location.Y;
       location.Z = locator.persons[personId].location.Z;

       kinnectData.location = location;
       kinnectData.previousLocation = previousLocation;
       kinnectData.rotationAnglesInDegress = getOrientationFromTwoLocations(previousLocation, location);
       previousKinnectLocation[personId] = JSON.parse(JSON.stringify(location));
    }

    return kinnectData;
}


function getSensorData (personId)
{
    var deviceSensorDataLog = {distance:0, location:{X:0, Y:0, Z:0}, rotationAnglesInDegress:{}, gyroData:{}, accelData:{}};
    
    if(sensorsReadingsList[personId] != undefined){
        deviceSensorDataLog.distance = distanceFromSensors[personId];
        deviceSensorDataLog.rotationAnglesInDegress = JSON.parse(JSON.stringify(orientationFromSensor[personId]));
        deviceSensorDataLog.gyroData = JSON.parse(JSON.stringify(accelVector[personId]));
        deviceSensorDataLog.accelData = JSON.parse(JSON.stringify(gyroVector[personId]));
        deviceSensorDataLog.location = JSON.parse(JSON.stringify(beaconsReadingsList[personId].location));
    }
    
    return deviceSensorDataLog;
}


function getBeaconData (personId)
{

    var beaconDataLog = {location:{}, rotationAnglesInDegress:{}};
    var location =  {X:0, Y:0, Z:0};
   
    if(beaconsReadingsList[personId] != undefined){
       location.X = beaconsReadingsList[personId].location.X;
       location.Y = beaconsReadingsList[personId].location.Y;
       location.Z = beaconsReadingsList[personId].location.Z;

       beaconDataLog.location = location;
       beaconDataLog.rotationAnglesInDegress = getOrientationFromTwoLocations(previousBeaconLocation[personId], beaconsReadingsList[personId].location);
       previousBeaconLocation[personId] = JSON.parse(JSON.stringify(location));
    }

    return beaconDataLog;
}

/** 
    Given Location One and Location Two, It will return the rotation angles in all axes
**/
function getOrientationFromTwoLocations (locationOne, locationTwo){

    // console.log('Location one is ' + JSON.stringify(locationOne));
    // console.log('Location two is ' + JSON.stringify(locationTwo));

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
    }
        
    return rotationAnglesInDegress;
}

function updatePreviousLocations (personId){

    if(locator.persons[personId] != undefined){
        previousKinnectLocation.X = locator.persons[personId].location.X;
        previousKinnectLocation.Y = locator.persons[personId].location.Y;
        previousKinnectLocation.Z = locator.persons[personId].location.Z;

        //console.log('Update previousKinnectLocation '+ JSON.stringify(previousKinnectLocation));
    }
 
    if(beaconsReadingsList[personId] != undefined){
        previousBeaconLocation.X = beaconsReadingsList[personId].location.X;
        previousBeaconLocation.Y = beaconsReadingsList[personId].location.Y;
        previousBeaconLocation.Z = beaconsReadingsList[personId].location.Z;

        //console.log('Update previousBeaconLocation '+ JSON.stringify(previousBeaconLocation));
    }
}

//------------------------- End of Logging  ---------------------------------------------------------------------------//

/*
//Test Cases
var counter = 0;
setInterval(function() { 
        if(counter == 5){
            //testCase();
            //testCase2(); //Change person color once they leave the kinnect FOV
            //testCase3(); //print orientation calculated from  two locations.
            //triangulatePersonLocationFromBeaconReadings(234, 4234);
            //testCase4();
            //testCase5();
            //testCase6();
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

    getOrientationFromTwoLocations(locationOne, locationTwo);
}

function testCase4 (){

    var personId = 0;
    sensorsReadingsList[personId] = locator.persons[personId];
    beaconsReadingsList[personId] = locator.persons[personId];
   
    sensorsReadingsStarted = true;
    beaconsReadingsStarted = true;

    distanceFromSensors = 10;
    orientationFromSensor = {yaw:45, pitch: 45, roll:45};
    accelVector = {X:10, Y:10, Z:10};
    gyroVector = {X:10, Y:10, Z:10};

    WriteToALogFile(personId);
}

function testCase5 () {
    var currentLocation = {X:3, Z:4}; 
    var previousLocation = {X:7, Z:1};

    var currentUpdatedLocation = filterBeaconReadings(previousLocation, currentLocation);
    console.log('current Updated location is '+ JSON.stringify(currentUpdatedLocation));
}

function testCase6 (){

    var previousLocation = {X:1, Y:1, Z:1};
    var distance = 2;
    var locationFromDeviceSensors = {X:1.5, Y:1, Z:2};
    var deviceSensorAttitude = {yaw:45, pitch:45, roll:45};
    var locationFromBeacon = {X:1.5, Y:1, Z:2};

    regression(previousLocation, distance, locationFromDeviceSensors, deviceSensorAttitude, locationFromBeacon)
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
   

*/
;




