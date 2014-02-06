var factory = require('./factory');
	
var Persons = [];
var Devices = [];

exports.start = function(){
	// Do initialization here, if any
};

exports.updatePersons = function(person){
    var found = false;
    Persons.forEach(function(item) {
        if(item.ID == person.ID){
            found = true;
			
			Persons[Persons.indexOf(item)].Location.X = person.Location.X;
            Persons[Persons.indexOf(item)].Location.Y = person.Location.Y;
            Persons[Persons.indexOf(item)].Location.Z = person.Location.Z;
        }
    });
	
	if(!found){
		Persons.push(person);
	}
};

exports.printPersons = function(){
	console.log("People tracked: ");
	Persons.forEach(function(item) { console.log("ID: " + item.ID + "     X: " + item.Location.X + "      Y: " + item.Location.Y + "      Z: " + item.Location.Z) });
	console.log("///////////////////////////////////////////////////////////////");
}

exports.updateDevices = function(device){
	// TODO: implement!
}

exports.getDevicesInView = function(observer){
	// TODO: implement!
	var obseverLineOfSight = factory.makeLineUsingOrientation(observer.Location, observer.Orientation);
	
	var devicesInView 
}