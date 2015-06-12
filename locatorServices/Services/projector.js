var locator     =   require('./../locator');
var frontend    =   require('../../frontend');
var factory     =   require('./../factory');
var util        =   require('./../util');



// ===================== Projected Pixels =====================

// Register the projector with room setup and connection

exports.registerProjector = function(socket,projectorInfo,fn){
    console.log('received projector' + JSON.stringify(projectorInfo));
    var registerData = {};
    try{
        // var registerData;
        // projectorInfo.data.forEach(function(dataName){
        //     registerData[dataName]=projector[dataName];
        // })
        console.log('register projector data: ' + JSON.stringify(projectorInfo.data));
        projectorInfo.subscriber.socketID = socket.id;
        var proj = new factory.projector(socket.id,projectorInfo.data,projectorInfo.subscriber);

        frontend.clients[socket.id].clientType = "ProjectorClient";
        locator.projectors = {};
        locator.projectors[0] = proj; // reigster projector to the list with its ID as its key

        //console.log('all data points: ' +JSON.stringify(dataPoints));
        // if(fn!=undefined){
        //     fn(dataPoints[socket.id]);
        // }
        // // fresh visualizer
        // frontend.io.sockets.emit("refreshStationaryLayer", {});
    }catch(err){
        console.log('failed registering projector due to: '+err);
    }
}

exports.connectToProjector = function(socket,deviceInfo,fn) {
    try {

        console.log("Get the current projector from list");
        console.log(locator.projectors);
        if (locator.projectors != undefined) {
            // send the first projector
            fn(locator.projectors[0]);
        }
    }
    catch(err) {
        console.log('projector connection failed due to: ' +err)
    }
}

exports.getRoom = function(socket,deviceInfo,fn) {

    try {

        console.log("Calling device");
        console.log(deviceInfo);
        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("getAllSurfacesController", deviceInfo, function (data) {
                console.log("room: " + controller.data.Surfaces);
                controller.data = data;
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('projector connection failed due to: ' +err)
    }
}

exports.newWindow = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("addWindowController", apidata, function (data) {
                console.log("new window id: " + data);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add window failed due to: ' +err)
    }
}

exports.newCircle = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("newCircleController", apidata, function (data) {
                console.log("new circle id: " + data);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add circle failed due to: ' +err)
    }
}


exports.moveCircle = function(socket,apidata,fn) {


    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("moveCircleController", apidata, function (data) {
                console.log("move circle id: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add circle failed due to: ' +err)
    }
}

exports.newRectangle = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("newRectangleController", apidata, function (data) {
                console.log("new rectangle name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add rectangle failed due to: ' +err)
    }
}


exports.moveRectangle = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("moveRectangleController", apidata, function (data) {
                console.log("moved rectangle name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('move rectangle failed due to: ' +err)
    }
}

exports.newTexRectangle = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("newTexRectangleController", apidata, function (data) {
                console.log("new image name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add image failed due to: ' +err)
    }
}

exports.moveTexRectangle = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("moveTexRectangleController", apidata, function (data) {
                console.log("moved rectangle name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('move rectangle failed due to: ' +err)
    }
}

exports.newLine = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("newLineController", apidata, function (data) {
                console.log("new line name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add line failed due to: ' +err)
    }
}


exports.newText = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("newTextController", apidata, function (data) {
                console.log("new text name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add text failed due to: ' +err)
    }
}


exports.newPath = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("newPathController", apidata, function (data) {
                console.log("new path name: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('new path failed due to: ' +err)
    }
}

exports.addLineToPath = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("addLineToPathController", apidata, function (data) {
                console.log("add to path named: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('add to path failed due to: ' +err)
    }
}

exports.removeElement = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("removeElementController", apidata, function (data) {
                console.log("removed element named: " + apidata["name"]);
                fn(data);
            });
        }
    }
    catch(err) {
        console.log('remove failed due to: ' +err)
    }
}


exports.getElementsOnWindow = function(socket,apidata,fn) {

    try {

        if (locator.projectors != undefined) {

            // send the request to the subscriber
            var controller = locator.projectors[0];
            frontend.clients[controller.socketID].emit("getElementsOnWindowController", apidata, function (data) {

                fn(data);
            });
        }
    }
    catch(err) {
        console.log('get elements failed due to: ' +err)
    }
}






