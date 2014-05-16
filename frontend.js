var express = require('express.io');
var app = express();
var http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
io.set('log level',5);
var requestHandler = require('./requestHandler');
var factory = require('./factory');
var locator = requestHandler.locator;

//var address = 'tcp://192.168.0.104:'
server.listen(3000);
//var socketList = [socket];

var visibleLayers;

requestHandler.start();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
app.get('/setup', function (req, res) {
    res.sendfile(__dirname + '/setup.html');
});

io.sockets.on('connection', function (socket) {
    console.log("something connected");
    requestHandler.handleRequest(socket);
});