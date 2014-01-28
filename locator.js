var zmq = require('zmq')
var pull_socket = zmq.socket('pull');

var Persons = [];
var Person = {ID: null, Location: null};
var Location = {X: null, Y: null, Z: null};

//pass it an ID, just check if the ID exists, returns true/false
Array.prototype.containsPerson = function(searchID){
    var found = false;
    Persons.forEach(function(item) {
        if(item.ID == searchID){
            found = true;
        }
    });
    return found;
}

//pass it a Person object, if matching ID is found it will update the coordinates
Array.prototype.updatePerson = function(searchPerson){
    Persons.forEach(function(item) {
        if(item.ID == searchPerson.ID){
            Persons[Persons.indexOf(item)].Location.X = searchPerson.Location.X;
            Persons[Persons.indexOf(item)].Location.Y = searchPerson.Location.Y;
            Persons[Persons.indexOf(item)].Location.Z = searchPerson.Location.Z;
        }
    });
}

pull_socket.bindSync('tcp://192.168.1.2:5570');
pull_socket.on('message', function (data) {
    var value = JSON.parse(data.toString());
    value.forEach(function(item){
        console.log("Received Person ID: " + item.Person_ID + "     X: " + item.Location.X + "      Y: " + item.Location.Y + "      Z: " + item.Location.Z);

        //grabs the data from JSON object. Not sure if it's needed anymore... oh well, makes it easier to read
        var personInstance = {ID: item.Person_ID, Location: {X: item.Location.X, Y: item.Location.Y, Z: item.Location.Z}};

        //if ID exists, update it
        if(Persons.containsPerson(personInstance.ID)){
            Persons.updatePerson(personInstance);
            console.log("UPDATE location for " + personInstance.ID);
        }
        //if ID does not exist, add it
        else{
            Persons.push(personInstance);
            console.log("ADD new ID " + personInstance.ID + " to tracking list");
        }
    });
	
pull_socket.on('error', function(err){
	console.log("Error");
	console.log(err);
});

    //Print out IDs being tracked and their coordinates
    console.log("People tracked: ");
    Persons.forEach(function(item) { console.log("ID: " + item.ID + "     X: " + item.Location.X + "      Y: " + item.Location.Y + "      Z: " + item.Location.Z) });
    console.log("///////////////////////////////////////////////////////////////");
});