/**
 * Created by yuxiw_000 on 6/18/14.
 */
/*
*   JS Client Implementation for SOD
*
* **/
/* The device for this JS Library*/




/*the constructor for registering device
*   Param: set any device property with JSON string such as {orientation:200}
*
**/

function SODDevice(deviceInfo){
    //this.serverURL = serverURL;
    //this.socketURL = socketURL;
    this.device = {  ID : null,
        name : 'JSClient',
        socketID : null,
        deviceType : "JSClientDevice",
        location : {X: 0, Y: 0, Z:0},
        orientation : {pitch: 0, yaw: 0},
        FOV : 0,
        depth : 0,
        width :  0,
        ownerID : null,
        pairingState : "unpaired",
        intersectionPoint : {X: 0, Y: 0},
        lastUpdated : new Date(),
        stationary : false,
        deviceIP : '',
        observer:null
    };


    this.isMobile = {
        Android: function() {
            return /Android/i.test(navigator.userAgent);
        },
        BlackBerry: function() {
            return /BlackBerry/i.test(navigator.userAgent);
        },
        iOS: function() {
            return /iPhone|iPad|iPod/i.test(navigator.userAgent);
        },
        Windows: function() {
            return /IEMobile/i.test(navigator.userAgent);
        },
        any: function() {
            return (this.Android() || this.BlackBerry() || this.iOS() || this.Windows());
        }
    };

    if(this.isMobile.any()==true){
        if(this.isMobile.iOS()==true){
            this.device.deviceType = "IPhone";
        }else if(this.isMobile.BlackBerry()==true){
            this.device.deviceType = "BlackBerry";
        }else if(this.isMobile.Windows()==true){
            this.device.deviceType = "WindowsPhone";
        }else if(this.isMobile.Android()){
            this.device.deviceType = "Android";
        }
    }else{
        alert("not a mobile device!");
    }



    //setters]
    console.log('deviceInfo: '+ JSON.stringify(deviceInfo));
    for(var key in deviceInfo){
        //console.log('key '+ key +' :'+ this.device[key]);
        this.device[key] = deviceInfo[key];
        if(key == 'stationary'){
            console.log('changed to: '+this.device[key] + '\t by deviceInfo: '+ this.device[key]);
        }
        //console.log('device.key: '+ this.device.key);
    }
    this.socket= null;
    this.userListeners = {};
    this.sendToDevices = null;



    //this.device = device;
}


SODDevice.prototype = {
    init: function(serverURL,socketURL, _SOD){
        //connect socket register device and hearing events
        $.getScript(socketURL,function(){
            _SOD.socket = io.connect(serverURL);
            _SOD.socket.on('connect',function(data){
                console.log('Socket Connected ...');
                _SOD.sendToDevices = new sendToDevices(_SOD.socket);
                //add any listeners that failed to add before socket was initialized
                for(var key in _SOD.userListeners){
                    if(_SOD.userListeners.hasOwnProperty(key)){
                        _SOD.addListener(key, _SOD.userListeners[key]);

                        //If user specified a connect event, it will automatically override the default one (ie. the block running now).
                        //Since the connect event already triggered, we want to manually trigger the user's specified code.
                        //After the first connect, subsequent reconnects will automatically run user's code.
                        if(key == "connect"){
                            _SOD.userListeners["connect"]();
                        }
                    }
                }
            })
        })
    },

    addListener: function(eventName, callback){
        try{
            console.log("Adding event listener: " + eventName)
            this.socket.on(eventName, callback);
        }
        catch(err){
            console.log(err);
            console.log('Socket is probably null, adding event listener "' + eventName + '" to queue, will try again after socket connects.')
            this.userListeners[eventName] = callback;
        }
    },
    registerDevice: function(sod){
        try{
            console.log("Registering device..." + JSON.stringify(this.device))
            this.socket.emit('registerDevice', this.device, function(data){
                sod.device.ID = data.deviceID;
                console.log('this device ID is set to'+sod.device.ID);
            })
        }
        catch(err){
            console.log(err)
            console.log("Failed to register device.")
        }
    },
    getDeviceWithSelection : function(selection,callbackFunction){
        this.socket.emit('getDevicesWithSelection',{selection:selection},callbackFunction)
    },
    reconnect : function(callbackFunction){
        if(!this.socket.socket.connected){ //is this right?
            this.initialize();
        }else{
            console.log('Device is already connected');
        }
    },
    getAllPeople : function(callbackFunction){
        this.socket.emit('getPeopleFromServer',{},callbackFunction);
    },
    unpairDevice : function(callbackFunction){
        this.socket.emit('unpairDevice',{},callbackFunction);
    },
    unpairAllPeople : function(callbackFunction){
        this.socket.emit('unpairAllPeople',{},callbackFunction);
    },
    unpairAllDevices : function(callbackFunction){
        this.socket.emit('unpairAllDevices',{},callbackFunction);
    },
    requestDataFromSelection : function(selection,data){
        console.log(JSON.stringify({selection:selection,data:data}));
        this.socket.emit('requestDataFromSelection',{selection:selection,data:data});
    },
    getDistanceToDevice : function(targetID,callbackFunction){
        console.log(JSON.stringify((targetID)));
        if(targetID !=undefined){
            console.log('targetID is not defined yet');
        }
        this.socket.emit('getDistanceToDevice',{ID:targetID},callbackFunction);
    },
    updateDeviceInfo : function(deviceInfo,callbackFunction){
        //deviceInfo.socket = this.socket;
        console.log('updating device info:'+ JSON.stringify(deviceInfo));
        this.socket.emit('updateDeviceInfo',deviceInfo,callbackFunction);
    },
    pairPersonWithID : function(personID){
        console.log('pairing with person' + personID);
        this.socket.emit('pairDeviceWithPerson',{deviceSocketID:this.socket.id,uniquePersonID:personID});
    },
    sendEventToDevices : function(eventName,payload,deviceList){
        console.log('sending string to devices: ' + eventName+" - "+payload+" - "+deviceList);
    }
};

var sendToDevices = function(socket){
    this.socket = socket;
}
sendToDevices.prototype = {
    all : function(eventName,payload){
        console.log(this);
        this.socket.emit("sendEventToDevicesWithSelection",{selection:['all'],eventName:eventName,data:payload},function(data){
            console.log(data);
        });
    },
    inView : function(){

    }
};



/************************************************************************************************************
 * ************************************************************************************************************
 * ************************************************************************************************************
 * ************************************************************************************************************
 * @param sensorInfo - contains all the information from sensor
 * @constructor
 */

function SODSensor(sensorInfo){
    //this.serverURL = serverURL;
    //this.socketURL = socketURL;

    if(sensorInfo.sensorType=="kinect"){
        this.sensor = {
            sensorType : 'JSSensor',
            FOV : 0,
            rangeInMM : 0,
            frameHeight : 0,
            frameWidth : 0
        }
        //setters
        for(var key in sensorInfo){
            //console.log('key '+ key +' :'+ deviceInfo[key]);
            this.sensor[key] = sensorInfo[key];
            //console.log('device.key: '+ this.device.key);
        }
    }else if(sensorInfo.sensorType == "iBeacon"){
        this.sensor = {
            sensorType:"iBeacon",
            beaconType:"Tr",
            uuid: 0,
            major:1,
            minor:2,
            identifier:3,
            name:"HappyJSBeaconTransmitter",
            personId:0

        }
    }

    this.socket= null;
    this.userListeners = {};
    this.people = [];
    this.movementInterval = null;
}
// sensor functions:
SODSensor.prototype = {
    init: function(serverURL,socketURL, _SOD){
        //connect socket register device and hearing events
        $.getScript(socketURL,function(){
            _SOD.socket = io.connect(serverURL);
            _SOD.socket.on('connect',function(data){
                console.log('Socket Connected ...');

                //add any listeners that failed to add before socket was initialized
                for(var key in _SOD.userListeners){
                    if(_SOD.userListeners.hasOwnProperty(key)){
                        _SOD.addListener(key, _SOD.userListeners[key]);

                        //If user specified a connect event, it will automatically override the default one (ie. the block running now).
                        //Since the connect event already triggered, we want to manually trigger the user's specified code.
                        //After the first connect, subsequent reconnects will automatically run user's code.
                        if(key == "connect"){
                            _SOD.userListeners["connect"]();
                        }
                    }
                }
            })
        })
    },//end of init
    addListener: function(eventName, callback){
        try{
            console.log("Adding event listener: " + eventName)
            this.socket.on(eventName, callback);
        }
        catch(err){
            console.log(err);
            console.log('Socket is probably null, adding event listener "' + eventName + '" to queue, will try again after socket connects.')
            this.userListeners[eventName] = callback;
        }
    },
    registerKinect: function(callbackFunction){
        try{
            console.log("Registering Senosr..." + JSON.stringify(this.sensor))
            this.socket.emit('registerSensor', this.sensor, callbackFunction)
        }
        catch(err){
            console.log(err)
            console.log("Failed to register sensor.")
        }
    },
    reconnect : function(callbackFunction){
        if(!this.socket.socket.connected){ //is this right?
            this.initialize();
        }else{
            console.log('Kinect is already connected');
        }
    },
    addPeople: function(numPeople){
        try{
            var i;
            for(i =0;i<numPeople;i++) {
                var person = {ID:'JS_'+ i.toFixed(0),location:{X:-0.2,Y:1,Z:1}, trackingState: 1};
                this.people.push(person);
            }
            this.socket.emit('personUpdate',this.people);
            console.log('JS Kinect Client generated '+numPeople+' people and pushed to the server');
        }catch(err){
            console.log(err)
            console.log("Failed to add people");
        }
    },
    // only has functions for moving right
    startMovement: function(){
        try {
            if(this.socket.socket.connected) {
                // the movement interval
                var sod = this;

                this.movementInterval = setInterval(function () {
                    sod.people.forEach(function(person) {
                        // move right 0.2
                       person.location.Z +=1;
                    })
                    sod.socket.emit('personUpdate', sod.people);

                }, 1000);
            }

        }catch(err){
            console.log(err)
            console.log("Failed to start movement");
        }
    },
    stopMovement: function(){
        try {
            if(this.socket.socket.connected) {
                //
                clearInterval(this.movementInterval);
                console.log('movement has stopped.');
            }

        }catch(err){
            console.log(err)
            console.log("Failed to stop movement");
        }
    }
}

///*
// Data point client section
//
//
//
// **////

function SODDataPoint(dataPointInfo){
    //this.serverURL = serverURL;
    //this.socketURL = socketURL;
    this.dataPoint = {
        location: {X:0,Y:0,Z:0},
        data: null,
        dropRange:0,
        observeRange: 0
    }
    //setters
    for(var key in dataPointInfo){
        //console.log('key '+ key +' :'+ dataPointInfo[key]);
        this.dataPoint[key] = dataPointInfo[key];
        console.log('dataPoint.key: '+ JSON.stringify(this.dataPoint[key]));
    }
    this.socket= null;
    this.userListeners = {};
}

SODDataPoint.prototype = {
    init: function(serverURL,socketURL, _SOD){
        //connect socket register device and hearing events
        $.getScript(socketURL,function(){
            _SOD.socket = io.connect(serverURL);
            _SOD.socket.on('connect',function(data){
                console.log('Socket Connected ...');

                //add any listeners that failed to add before socket was initialized
                for(var key in _SOD.userListeners){
                    if(_SOD.userListeners.hasOwnProperty(key)){
                        _SOD.addListener(key, _SOD.userListeners[key]);

                        //If user specified a connect event, it will automatically override the default one (ie. the block running now).
                        //Since the connect event already triggered, we want to manually trigger the user's specified code.
                        //After the first connect, subsequent reconnects will automatically run user's code.
                        if(key == "connect"){
                            _SOD.userListeners["connect"]();
                        }
                    }
                }
            })
        })
    },//end of init
    addListener: function(eventName, callback){
        try{
            console.log("Adding event listener: " + eventName)
            this.socket.on(eventName, callback);
        }
        catch(err){
            console.log(err);
            console.log('Socket is probably null, adding event listener "' + eventName + '" to queue, will try again after socket connects.')
            this.userListeners[eventName] = callback;
        }
    },registerDataPoint: function(sod,callbackFunction){
        try{
            console.log("Registering dataPoint..." + JSON.stringify(sod.dataPoint))
            this.socket.emit('registerDataPoint', sod.dataPoint, callbackFunction)
        }
        catch(err){
            console.log(err)
            console.log("Failed to register data point. Due to: " + err)
        }
    }
}