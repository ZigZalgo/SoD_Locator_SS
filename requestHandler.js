var locator = require('./locator');
var factory = require('./factory');
var frontend = require('./frontend');
var portList = [];

// TODO: test!
exports.start = function (){
	locator.start();
}

// TODO: test!
exports.handleRequest = function (data, socket){
	
	// Handles different requests here 	
	var request = JSON.parse(data.toString());
	var requestType = request.requestType;

    console.log(requestType);
    console.log("Got request");
	switch(requestType){
        case 'requestPort':
            console.log("handling request for port number");
            var assignPort = randomIntInc(50000, 60000);
            console.log(portList.indexOf(assignPort));
            while(portList.indexOf(assignPort) != -1){
                var assignPort = randomIntInc(50000, 60000);
            }
            portList.push(assignPort);
            frontend.updateSocket(assignPort);
            console.log("Binded to " + assignPort);
            socket.send(assignPort);
            break;
        case 'relinquishPort':
            console.log("handling request for relinquishing port " + parseInt(request.additionalInfo));
            try{
                portList.splice(portList.indexOf(parseInt(request.additionalInfo)), 1)
                console.log("Ports tracked: " + portList);
                frontend.unbindSocket(request.additionalInfo);
                socket.send('success');
            }
            catch(err){
                console.log(err);
            }
            break;
		case 'personUpdate':
            var requestBody = request.persons;
			requestBody.forEach(function(item){
				//var person = factory.makePerson(item.Person_ID, item.Location);
                var person = new factory.Person(item.Person_ID, item.Location);
				locator.updatePersons(person);

				// Logging current list of users in the locator
				locator.printPersons();
			});
            console.log("handling request for update person");
			break;
		case 'deviceUpdate':
			console.log(requestBody);
		case 'gestureSent':
			break;
		case 'spatialRequest':
			break;
	}
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}