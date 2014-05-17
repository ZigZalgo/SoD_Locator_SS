var express = require('express.io');
var app = express();
var http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
io.set('log level',5);
var requestHandler = require('./requestHandler');
var factory = require('./factory');
var locator = requestHandler.locator;
var allClients = [];

server.listen(3000);

process.addListener( "uncaughtException", function captureException( err ) {
    console.log('Error occurred, prevented Node.js crash: ' + err);
});

requestHandler.start();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
app.get('/setup', function (req, res) {
    res.sendfile(__dirname + '/setup.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('error', function() { console.log("error"); });
    console.log("something connected with sessionID: " + socket.id);
    requestHandler.handleRequest(socket);

    allClients.push(socket);

    socket.on('disconnect', function() {
        console.log('Got disconnect!');

        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
    });
});

