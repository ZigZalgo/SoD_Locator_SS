// Starting SoD Locator Services
var express = require('express.io');
var path = require('path');
var net = require("net");
var app = express().http().io();
app.use(express.static(path.join(__dirname,'public')))
var data = require('./locatorServices/data');
var sensorsREST = require('./locatorServices/REST/sensors');
var devicesREST = require('./locatorServices/REST/devices');
var locator = require('./locatorServices/locator');

//var static = require('node-static');
//var fileServer = new static.Server('./images');

// Server Initilize
init();

/*
net.createServer(
    function(socket)
    {
        socket.setEncoding('utf8');
        socket.on('data', function(data){
            //console.log(data);
            if(data.indexOf('policy-file-request') > -1){
                var toReturn = '';
                //console.log("REQUESTED POLICY FILE");

                //console.log("<?xml version=\"1.0\"?>");
                toReturn+="<?xml version=\"1.0\"?>\n";
                //console.log("<cross-domain-policy>");
                toReturn+=("<cross-domain-policy>\n");
                toReturn+=("<allow-access-from domain=\"*\" to-ports=\"*\"/>\n");
                //console.log("</cross-domain-policy>");
                toReturn+=("</cross-domain-policy>\n");
                //console.log(toReturn);
                socket.write(toReturn);
                socket.end();
            }
        })}
).listen(843);
*/


var http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);

io.set('log level',0);
var requestHandler = require('./locatorServices/requestHandler');
var fs = require('fs');
var factory = require('./locatorServices/factory');
var locator = requestHandler.locator;
var util = require('./locatorServices/sod_util');
var clients = {};
exports.io = io;
exports.clients = clients;
/* starting heartbeat*/
var pulse = require('./locatorServices/pulse');


app.configure(function(){
    app.use(express.bodyParser({ keepExtensions: true, uploadDir: './data/temp' }));
    //app.use(express.bodyParser({uploadDir:'./data'}));
    app.use(app.router);
    //locator.loadConfig();
})

if(isNaN(process.argv[2])){
    server.listen(3000);

}
else{
    server.listen(process.argv[2]);
}

//requestHandler.start();

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/view/setup.html');
});
app.get('/mobile', function (req, res) {
    res.sendfile(__dirname + '/view/mobile.html');
});
app.get('/grid', function (req, res) {
    res.sendfile(__dirname + '/view/Grid.html');
});
app.get('/ER', function (req, res) {
    res.sendfile(__dirname + '/view/ERMap/ERMap.html');
});

// React Section
app.get('/react', function (req, res) {
    res.sendfile(__dirname + '/view/react.html');
});
app.get('/reactjs',function(req,res){
    res.sendfile(__dirname+"/view/js/react-0.13.3/build/react.js");
})
app.get('/JSXTransformer',function(req,res){
    res.sendfile(__dirname+"/view/js/react-0.13.3/build/JSXTransformer.js");
})
app.post('/files/comments.json', function (req, res) {
    console.log(req.body);

    res.send('POST request to homepage' );
});
// END of React Section

app.get('/user', function (req, res) {
    res.sendfile(__dirname + '/view/user.html');
});
app.get('/testing', function (req, res) {
    res.sendfile(__dirname + '/view/testing.html');
});
app.get("/ERClient",function(req,res){
    res.sendfile(__dirname+"/view/ERMap/ERClient.html")
})

// Start: documentation
app.get('/scripts/prettify/prettify.js', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/scripts/prettify/prettify.js');
});

app.get('/global.html', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/global.html');
});

app.get('/crossdomain.xml', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/crossdomain.xml');
});



app.get('/scripts/prettify/lang-css.js', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/scripts/prettify/lang-css.js');
});

app.get('/styles/prettify-tomorrow.css', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/styles/prettify-tomorrow.css');
});

app.get('/scripts/linenumber.js', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/scripts/linenumber.js');
});

app.get('/requestHandler.js.html', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/requestHandler.js.html');
});

app.get('/styles/jsdoc-default.css', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/styles/jsdoc-default.css');
});

app.get('/doc', function (req, res) {
    res.sendfile(__dirname + '/data/reserved/doc/out/index.html');
});

app.get("/architecture",function(request,respond){
    respond.sendfile(__dirname+"/data/reserved/SoD-Architecture.png");
});
// End of documentation

app.get('/jquery', function (req, res) {
    res.sendfile(__dirname + '/view/js/jquery-1.11.1.min.js');
});


app.get('/kinetic', function (req, res) {
    res.sendfile(__dirname + '/view/js/kinetic-v5.1.0.min.js');
});

app.get('/jquery-mobile', function (req, res) {
    res.sendfile(__dirname + '/view/js/jquery.mobile-1.4.3.min.js');
});


app.get('/style', function (req, res) {
    res.sendfile(__dirname + '/view/style/style.css');
});
//jquery.mobile-1.4.3.min.css
app.get('/style-mobile', function (req, res) {
    res.sendfile(__dirname + '/view/style/jquery.mobile-1.4.3.min.css');
});
// I don't know why Jquery wants to load this so bad
app.get('/images/ajax-loader.gif', function (req, res) {
    res.sendfile(__dirname + '/view/images/ajax-loader.gif');
});

app.get('/overviewJS', function (req, res) {
    res.sendfile(__dirname + '/view/js/overview.js');
});


app.get('/calibrateJS', function (req, res) {
    res.sendfile(__dirname + '/view/js/calibrate.js');
});
app.get('/SoDLibrary', function (req, res) {
    res.sendfile(__dirname + '/SOD_JS_Library/SOD_JS_Library.js');
});
app.get('/JSDeviceClient', function (req, res) {
    res.sendfile(__dirname + '/SOD_JS_Library/SOD_JS_Sample_Client.html');
});
app.get('/JSSensorClient', function (req, res) {
    res.sendfile(__dirname + '/SOD_JS_Library/SOD_JS_Sensor_Client.html');
});
app.get('/JSclientCSS', function (req, res) {
    res.sendfile(__dirname + '/SOD_JS_Library/sample_client_style.css');
});
app.get('/JSDataPointClient', function (req, res) {
    res.sendfile(__dirname + '/SOD_JS_Library/SOD_JS_DataPoint_Client.html');
});
app.get('/data', function (req, res) {
    res.sendfile(__dirname + '/view/data.html');
});
app.get('/dataJS', function (req, res) {
    res.sendfile(__dirname + '/view/js/dataView.js');
});
app.get('/UIJS',function(req,res){
    res.sendfile(__dirname + '/view/js/UI.js');
})
app.get("/unity3DEngine",function(req,res){
    res.sendfile(__dirname+"/view/unity_visualizer.unity3d");
})
app.get("/unity3DVisualizer",function(req,res){
    res.sendfile(__dirname+"/view/unity_visualizer.html");
})

app.get('/setting',function(req,res){
    var tempLocatorRoom = locator.room;
    //console.log(locator.room);
    var currentSetting = {
        room:{location:locator.room.location,
            width:locator.room.width,
            height:locator.room.height,
            depth:locator.room.depth
        },
        pulse:pulse.eventsSwitch
    }
    res.status(200);
    res.send(currentSetting);
})
app.get('/people', function (req, res) {
    res.send(locator.persons);
});


app.post('/sensors/:id/uncalibrate', sensorsREST.uncalibrate);
app.post('/devices/updateOrientation/:id/:orientation', devicesREST.updateOrientation);


app.get('/files/:fileName.:ext', data.show);
app.get('/adf/', data.adfShow);
app.get('/files/:fileName', data.show);
app.get('/test', function(req,res){
    res.sendfile(__dirname+"/view/testing.html");
});
app.get('/filesList', data.fileList);
app.post('/upload', function(req, res) {
    /*console.log(req.files);
    console.log(req.files.dataFile.path + "          " + "data/temp/" + req.files.dataFile.name);*/
    //console.log(req);
    if(req.files.dataFile.name.length!=0) {
        fs.rename(req.files.dataFile.path, "data/temp/" +req.files.dataFile.name, function (err) {
            if (err) throw err;
            locator.registerData({name: req.files.dataFile.name, type: req.files.dataFile.type, dataPath: "files\\" + req.files.dataFile.name});
            res.sendfile(__dirname + '/view/data.html');
            //res.redirect('/');
        });
    }else{
        console.log('err: no file chosen');
    }
});

io.sockets.on('connection', function (socket) {
    socket.on('error', function() { console.log("error"); });
    console.log("something connected with sessionID [" + socket.id + "] and IP [" + socket.handshake.address.address + "]");

    requestHandler.handleRequest(socket);

    clients[socket.id] = socket;
    clients[socket.id].clientType = null;

    socket.on('disconnect', function() {
        console.log('Something disconnect...');
        // if the socket is a device socket
        if(locator.dataPoints[socket.id]!=undefined){
            console.log('dataPoints disconnected -> ID: ' + locator.dataPoints[socket.id].ID +' with data: ' + JSON.stringify(Object.keys(locator.dataPoints[socket.id].data)));
        }else if (locator.devices[socket.id] != undefined) {
            try {
                io.sockets.emit("someDeviceDisconnected", { name: locator.devices[socket.id].name, ID: locator.devices[socket.id].uniqueDeviceID, deviceType: locator.devices[socket.id].deviceType});
                console.log("device disconnected -> name: " + locator.devices[socket.id].name + ", ID: " + locator.devices[socket.id].uniqueDeviceID + ", deviceType: " + locator.devices[socket.id].deviceType)
            }
            catch (err) {
                io.sockets.emit("someDeviceDisconnected", { name: "failed to retrieve name" });
                console.log("failed to emit name of device, possibly null... error: " + err)
            }
        }
        //run cleanup functions for socket
        if(clients[socket.id] != undefined){
            switch(clients[socket.id].clientType){
                case 'sensor':
                    console.log("\tSensor Disconnected");
                    locator.cleanUpSensor(socket.id,socket);
                    break;
                case 'webClient':
                    break;
                case 'mobileWebClient':
                    console.log('A Mobile web client disconnected');
                    break;
                case 'dataPointClient':
                    locator.cleanUpDataPoint(socket.id);
                    break;
                case 'table':
                    console.log("CLEANING UP TABLE");
                    locator.cleanUpDevice(socket.id);
                    break;
                case 'iPad':
                    locator.cleanUpDevice(socket.id);
                    break;
                case 'iPhone':
                    locator.cleanUpDevice(socket.id);
                    break;
                case 'JSClient':
                    console.log("IMPLEMENT CLEAN UP CODE FOR JSCLIENT!");
                    locator.cleanUpDevice(socket.id);
                    break;
                case 'unityVisualizer':
                    console.log("-> Unity Visualizer Disconnected.");
                    break;
                default:
                    if(locator.devices[socket.id] != null) locator.cleanUpDevice(socket.id);
                    if(locator.sensors[socket.id] != null) locator.cleanUpSensor(socket.id);
            }
            delete clients[socket.id];
        }
    });
});

/*
*   Initialize the server by defined server IP address, and registering existing data files into data Objects
*
*
* **/
function init(){
    var os = require('os');
    var interfaces = os.networkInterfaces();

    //exports.serverAddress;
    setTimeout(function(){pulse.start();}, 3000); // three second after heartbeat



// setting up server IP and display in the console
    for (var k in interfaces) {
        for (k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family == 'IPv4' && !address.internal) {
                var serverAddress = address.address;
            }
        }
    }
    console.log('SOD server IP: '+ serverAddress + ":" + ((isNaN(process.argv[2])) ? 3000:process.argv[2]));


    // Initialize all the existing data in the data and convert them into object store them in the locator
    console.log('Loading existing data ...');
    var fs = require('fs');
    var dataDirectory = 'data/temp/';
//var thumbnailSize = 400;
    var util = require('./locatorServices/sod_util');
    var mime = require('mime');

    //
    var walk    = require('walk');
    var files   = [];
    var walker  = walk.walk(dataDirectory, { followLinks: false });
    walker.on('file', function(root, stat, next) {
        //files.push(stat.name);
        locator.registerData({name:stat.name,type:mime.lookup('data\\'+stat.name),dataPath:'\\files\\'+stat.name,range:0.2});
        next();
    });
    walker.on('end', function() {
        //console.log(files);
        locator.loadConfig();
        console.log('End of initializing data');
    });

}