var zmq = require('zmq');
var locator = require('./locator');
	
var	pull_socket = zmq.socket('pull');

exports.start = function (){
	locator.start();
}

exports.handleRequest = function (data){
	
	// Handles different requests here 	
	var request = JSON.parse(data.toString());
	var requestType = request[0];
	var requestBody = request[1];
	
	switch(requestType){
		case 'personUpdate':
			console.log('Handling person update');
			
			requestBody.forEach(function(item){

				var personInstance = {ID: item.Person_ID, Location: {X: item.Location.X, Y: item.Location.Y, Z: item.Location.Z}};	
				locator.updatePersons(personInstance);			
				
				console.log(locator.printPersons());
			});
			
			break;
		case 'deviceUpdate':
			break;
		case 'gestureSent':
			break;
		case 'spatialRequest':
			break;
	}
}