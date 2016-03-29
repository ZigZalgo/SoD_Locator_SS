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
        console.log("person "+updateData.personID+" doesn't exists");
        var person = new factory.Person();
        person["socket"] = socket.id
        person["devices"] = {};
        if(locator.devices.hasOwnDevice(socket.id)){
            var deviceRequested = locator.devices[socket.id]
            person.devices[socket.id] = deviceRequested;
            deviceRequested.ownerID = person.uniquePersonID;
            deviceRequested.pairingState = "ER"
        }
        ERPersons[person.uniquePersonID] = person;
    }else{
        console.log("person exists udpating info ");
        personOfInterest = ERPersons[updateData.personID.toString()]
        console.log(personOfInterest);
    }

}