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


var ERPerson = new Person()

function createERPerson(socket){

    ERPerson["socket"] = socket.id
    ERPerson["devices"] = {};
    if(locator.devices.hasOwnDevice(socket.id)) {
        var deviceRequested = locator.devices[socket.id]
        ERPerson.devices[socket.id] = deviceRequested;
        deviceRequested.ownerID = person.uniquePersonID;
        deviceRequested.pairingState = "ER"
    }
}
function updateERPersonData(socket){

}