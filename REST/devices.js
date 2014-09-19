/**
 * Created by yuxiw_000 on 9/18/2014.
 */
/* Handles all devices related requests, ease up locator.js workload*/


var locator = require('../locator');

exports.updateOrientation= function(req, res){
    //locator.updateDeviceOrientation(req.params.orientation,req.params.id);
    console.log('-> received udpateOrientation request for device:'+req.params.id +'\t new orientation:'+ req.params.id);
    for(var key in locator.devices){
        if(locator.devices.hasOwnProperty(key)&&locator.devices[key].uniqueDeviceID==req.params.id){

            locator.devices[key].orientation = Math.round(req.params.orientation*100)/100;
            console.log(locator.devices[key].orientation);
        }
    }
    res.status(200);
    res.send(req.params.id,locator.devices[key].orientation)
}