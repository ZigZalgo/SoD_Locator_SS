/**
 * Created by Yuxibro on 16-03-27.
 */
var locator = require('../locator');
var factory = require('../factory');
var frontend = require('../../frontend');
var sod_util = require('../sod_util');
var pulse = require("../pulse");
var async =
    require("async");

var ERPersons = {};
exports.ERPersons = ERPersons;
exports.createERPerson = function(socket){

}
exports.updateERPersonData = function(socket,updateData){
    var personOfInterest;
    if(!ERPersons.hasOwnProperty(updateData.personID.toString())){
        console.log("person "+updateData.personID+" doesn't exists, making new person");
        var person = new factory.Person(117,null,socket);
        //console.log("person: "+JSON.stringify(person));
        person["socket"] = socket.id
        person["devices"] = {};
        person.devices[socket.id] = socket.id;
        if(locator.devices.hasOwnProperty(socket.id)){
            var deviceRequested = locator.devices[socket.id]
            deviceRequested.ownerID = person.uniquePersonID;
            deviceRequested.pairingState = "ERPerson"
        }
        ERPersons[person.uniquePersonID] = person;
    }else{
        personOfInterest = ERPersons[updateData.personID.toString()]
        if(updateData.hasOwnProperty("heartbeat")){
            if(Number(updateData['heartbeat'])!=0){
                console.log("beep : "+Number(updateData['heartbeat']));
            }
            personOfInterest.heartbeat = updateData["heartbeat"]
            console.log("updated person "+personOfInterest.uniquePersonID+" heartbeat to "+updateData['heartbeat']);
        }
        if(updateData.hasOwnProperty("GeoLocation")){
            personOfInterest['GeoLocation']['lat'] = updateData["GeoLocation"]["lat"]
            personOfInterest["GeoLocation"]["lng"] = updateData["GeoLocation"]["lng"]
            console.log("updated person "+personOfInterest.uniquePersonID+" location to "+personOfInterest['GeoLocation']['lat']+' - '+ personOfInterest['GeoLocation']['lng']);
        }
    }
}

exports.calculateGeoLocationDistance = function(GeoLocation1,GeoLocation2){
    console.log('\tlocation1: '+JSON.stringify(GeoLocation1)+'\n'
    +'\tlocation2: '+JSON.stringify(GeoLocation2));
    if(GeoLocation1.hasOwnProperty("lat") && GeoLocation2.hasOwnProperty("lng")){
        var geoDistance= getDistanceFromLatLonInKm(GeoLocation1.lat,GeoLocation1.lng,GeoLocation2.lat,GeoLocation2.lng)
        console.log("Get result from two geo distance: "+geoDistance);
        //TODO: Return this geo distance
    }else{
        console.log("Cannot calculate distance based on lat/lng. Param missing");
    }
}
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2){
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}