var locator = require('./locator');
var factory = require('./factory');
var frontend = require('./frontend');
var util = require('./util');
var portList = [];

// TODO: test!
exports.start = function (){
	locator.start();
}

exports.getDevicesInView = function(device){
	return locator.getDevicesInFront(device.ID);
}

exports.registerDevice = function(device){
	locator.Devices.push(device);
}

exports.locator = locator;

// TODO: test!
exports.handleRequest = function (data, socket){
	
	// Handles different requests here 	
	var request = JSON.parse(data.toString());
	var requestType = request.requestType;

    //console.log(requestType);
    //console.log("Got request");
	switch(requestType){
        case 'requestPorts':
            console.log("handling request for dual port numbers");
            var assignPairPort = randomIntInc(50000, 60000);
            var assignRequestPort = randomIntInc(50000, 60000);
            while(portList.indexOf(assignPairPort) != -1){
                assignPairPort = randomIntInc(50000, 60000);
            }
            while(portList.indexOf(assignRequestPort) != -1){
                assignRequestPort = randomIntInc(50000, 60000);
            }
            if(util.findWithAttr(portList, "deviceID", request.additionalInfo.deviceID) == undefined){
                portList.push({"deviceID": request.additionalInfo.deviceID, "pairPort": assignPairPort, "requestPort": assignRequestPort});
            }
            else{
                portList[util.findWithAttr(portList, "deviceID", request.additionalInfo.deviceID)].pairPort = assignPairPort;
                portList[util.findWithAttr(portList, "deviceID", request.additionalInfo.deviceID)].requestPort = assignRequestPort;
            }

            frontend.updatePairSocket(assignPairPort);
            frontend.updateRequestSocket(assignRequestPort);
            console.log("Binded pair socket to " + assignPairPort + " and request socket to " + assignRequestPort);
            socket.send(JSON.stringify(portList[util.findWithAttr(portList, "deviceID", request.additionalInfo.deviceID)]));
            portList.forEach(function(port){
                console.log(port.deviceID + "\t" + port.pairPort + "\t" + port.requestPort);
            })
            break;
        case 'relinquishPort':
            console.log("handling request for relinquishing port " + parseInt(request.additionalInfo.port));
            try{
                portList.splice(portList.indexOf(parseInt(request.additionalInfo.port)), 1)
                console.log("Ports tracked: " + portList);
                frontend.unbindSocket(request.additionalInfo.port);
                socket.send(JSON.stringify({"status": 'success', "port": request.additionalInfo.port}));
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
				//locator.printPersons();
			});
            //console.log("handling request for update person");
			break;
		case 'deviceUpdate':
            break;
        case 'updateOrientation':
            var device = new factory.Device();
            device.Orientation = request.additionalInfo.orientation;
            device.ID = request.additionalInfo.deviceID;
            locator.updateDeviceOrientation(device);
            //locator.printDevices();
            break;
		case 'gestureSent':
			break;
		case 'spatialRequest':
			break;
        case 'setPairingState':
            locator.setPairingState(request.additionalInfo.deviceID);
            break;
        case 'unpairDevice':
            locator.unpairDevice(request.additionalInfo.deviceID, request.additionalInfo.personID);
            break;
        case 'getPeople':
            locator.purgeInactivePersons();
            socket.send(JSON.stringify(locator.Persons));
            break;
        case 'getDevices':
            locator.purgeInactiveDevices();
            console.log(request.additionalInfo.selection);
            switch(request.additionalInfo.selection){
                case 'all':
                    socket.send(JSON.stringify(locator.Devices));
                    break;
                case 'inView':
                    console.log("GETTING ALL DEVICES IN VIEW");
                    socket.send(JSON.stringify(locator.Persons))
                    console.log(locator.getDevicesInFront(request.additionalInfo.deviceID));
                    break;
                default:
                    socket.send(JSON.stringify(locator.Devices));
            }
            break;
        case 'forcePair':
            var deviceID = request.additionalInfo.deviceID;
            var personID = request.additionalInfo.personID;
            locator.pairDevice(deviceID, personID, socket);
            break;
        case 'unpairAllPeople':
            locator.unpairAllPeople();
            socket.send(JSON.stringify({"status": 'success'}));
            break;
        case 'initDevice':
            console.log("Got request to init device");
            locator.initDevice(request.additionalInfo.deviceID, request.additionalInfo.height, request.additionalInfo.width);
            socket.send(JSON.stringify({"status": 'success'}));
            break;
	}
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}