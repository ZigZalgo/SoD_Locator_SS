var locator = require('../locator');
var factory = require('../factory');
var frontend = require('../../frontend');
var sod_util = require('../sod_util');
var ERLocator = require('./ERLocator');
var pulse = require("../pulse");
var async =
    require("async");

exports.handle = function(socket){
    // Handles all the sockets related to ER scenario
    socket.on("ERPersonUpdate",function(personData, cb){
        console.log("\nUpdate Person Data: "+JSON.stringify(personData));
            //console.log(personData)
        if(personData.hasOwnProperty("personID")){
            ERLocator.updateERPersonData(socket,personData);
        }
    })
    socket.on("getAllERPerson",function(data,callback){
        callback(ERLocator.ERPersons)
    })
    socket.on("showMediaAll",function(){
        socket.broadcast.emit("showMedia")
    })
    socket.on("updateERLocation",function(request,callback){
        //console.log(request);
        var requestLocation = request.split(',')
        socket.broadcast.emit("updateERLocationOnMap",{lat:requestLocation[0],lng:requestLocation[1]})
    });
    socket.on('updatePOIRequest',function(request,callback){
        console.log(JSON.stringify(request));
        if(request.hasOwnProperty('id')&&request.hasOwnProperty('description')&&
            request.hasOwnProperty('location')&&request.hasOwnProperty('eventType')){
            var POIUpdateMsg = {id:request.id,description:request.description,location:request.location,eventType:request.eventType}
            socket.broadcast.emit('POIUpdate',POIUpdateMsg,function(){

            })
        }else{
            console.log('Wrong event request '+ JSON.stringify(request))
        }
    })
}