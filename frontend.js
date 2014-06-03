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
var clients = {};
exports.io = io;
exports.clients = clients;

server.listen(3000);

requestHandler.start();
/*
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
}); */

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/view/setup.html');
});
app.get('/user', function (req, res) {
    res.sendfile(__dirname + '/view/user.html');
});
app.get('/style', function (req, res) {
    res.sendfile(__dirname + '/view/style/style.css');
});

app.get('/overviewJS', function (req, res) {
    res.sendfile(__dirname + '/view/js/overview.js');
});
app.get('/calibrateJS', function (req, res) {
    res.sendfile(__dirname + '/view/js/calibrate.js');
});

io.sockets.on('connection', function (socket) {
    socket.on('error', function() { console.log("error"); });
    console.log("something connected with sessionID: " + socket.id);
    requestHandler.handleRequest(socket);

    clients[socket.id] = socket;
    clients[socket.id].clientType = null;

    socket.on('disconnect', function() {
        console.log('Got disconnect!');

        //run cleanup functions for socket
        if(clients[socket.id] != undefined){
            switch(clients[socket.id].clientType){
                case 'sensor':
                    socket.emit("refreshWebClientSensors", {});
                    console.log("CLEANING UP SENSOR")
                    locator.cleanUpSensor(socket.id);
                    break;
                case 'webClient':
                    break;
                case 'table':
                    locator.cleanUpDevice(socket.id);
                    break;
                default:
                    break;
            }
            delete clients[socket.id];
        }
    });
});