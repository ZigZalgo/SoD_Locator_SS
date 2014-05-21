var express = require('express.io');
var app = express();
var http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
io.set('log level',5);
var requestHandler = require('./requestHandler');
var factory = require('./factory');
var locator = requestHandler.locator;
var util = require('./util');
var allClients = [];
exports.io = io;
exports.allClients = allClients;

server.listen(3000);

requestHandler.start();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
app.get('/setup', function (req, res) {
    res.sendfile(__dirname + '/setup.html');
});
app.get('/user', function (req, res) {
    res.sendfile(__dirname + '/user.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('error', function() { console.log("error"); });
    console.log("something connected with sessionID: " + socket.id);
    requestHandler.handleRequest(socket);

    allClients.push({socketID: socket.id, clientType: null});

    socket.on('disconnect', function() {
        console.log('Got disconnect!');

        //run cleanup functions for socket
        if(allClients[util.findWithAttr(allClients, "socketID", socket.id)] != undefined){
            switch(allClients[util.findWithAttr(allClients, "socketID", socket.id)].clientType){
                case 'sensor':
                    socket.emit("refreshWebClientSensors", {});
                    console.log("CLEANING UP SENSOR")
                    locator.cleanUpSensor(socket.id);
                    break;
                case 'webClient':
                    break;
                case 'device':
                    break;
                default:
                    break;
            }
            allClients.splice(util.findWithAttr(allClients, "socketID", socket.id), 1);
        }
    });
});