/**
 * Created by ASE Lab on 08/09/14.
 */

var locator = require('../locator');
//var frontend = require('../frontend');

exports.uncalibrate = function(req, res){
    console.log("Send resetRule event to sensor.");
    locator.uncalibrateSensor(req.params.id);

    res.status(200);
    res.send(req.params.id)
}