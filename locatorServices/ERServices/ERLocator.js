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
    console.log(updateData);
    var personOfInterest;
    if(!ERPersons.hasOwnProperty(updateData.personID.toString())){
        console.log("person "+updateData.personID+" doesn't exists");
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
        console.log("person exists udpating info ");
        personOfInterest = ERPersons[updateData.personID.toString()]
        //console.log(personOfInterest);
        if(updateData.hasOwnProperty("heartbeat")){
            personOfInterest.heartbeat = updateData["heartbeat"]
            console.log("udpated person heartbeat to ");
        }
    }

}