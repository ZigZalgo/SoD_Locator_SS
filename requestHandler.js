var locator = require('./locator');
var factory = require('./factory');

// TODO: test!
exports.start = function (){
	locator.start();
}

// TODO: test!
exports.handleRequest = function (data){
	
	// Handles different requests here 	
	var request = JSON.parse(data.toString());
	var requestType = request[0];
	var requestBody = request[1];
	
	switch(requestType){
		case 'personUpdate':			
			requestBody.forEach(function(item){
				var person = factory.makePerson(item.Person_ID, item.Location);				
				locator.updatePersons(person);			
				
				// Logging current list of users in the locator
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