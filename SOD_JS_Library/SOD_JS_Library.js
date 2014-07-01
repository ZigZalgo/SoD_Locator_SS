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
        orientation : 0,
        FOV : 0,
        height : 0,
        width :  0,
        ownerID : null,
        pairingState : "unpaired",
        intersectionPoint : {X: 0, Y: 0},
        lastUpdated : new Date(),
        stationary : false,
        deviceIP : ''
    }
    //setters
    for(var key in deviceInfo){
        //console.log('key '+ key +' :'+ deviceInfo[key]);
        this.device[key] = deviceInfo[key];
        //console.log('device.key: '+ this.device.key);
    }
    this.socket= null;
    this.userListeners = {};
    //this.device = device;
}

SODDevice.prototype = {
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
    registerDevice: function(callbackFunction){
        try{
            console.log("Registering device..." + JSON.stringify(this.device))
            this.socket.emit('registerDevice', this.device, callbackFunction)
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
    requestDataFromSelection : function(selection,data,ID){
        console.log(JSON.stringify({selection:selection,data:data}));
        if(ID !=undefined){
            this.socket.emit('requestDataFromSelection',{selection:selection,data:data,ID:ID});
        }
        this.socket.emit('requestDataFromSelection',{selection:selection,data:data});
    },getDistanceToDevice : function(targetID,callbackFunction){
        console.log(JSON.stringify((targetID)));
        if(targetID !=undefined){
            console.log('targetID is not defined yet');
        }
        this.socket.emit('getDistanceToDevice',{ID:targetID},callbackFunction);
    },getDeviceWithSelectionChain : function(selectionChain,callbackFunction){
        console.log('selectionChain: ' + JSON.stringify(selectionChain));
        this.socket.emit('getDevicesWithSelectionChain',{selection:selectionChain},callbackFunction);
    }
}


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
    registerSensor: function(callbackFunction){
        try{
            console.log("Registering device..." + JSON.stringify(this.device))
            this.socket.emit('registerSensor', this.sensor, callbackFunction)
        }
        catch(err){
            console.log(err)
            console.log("Failed to register device.")
        }
    },
    reconnect : function(callbackFunction){
        if(!this.socket.socket.connected){ //is this right?
            this.initialize();
        }else{
            console.log('Sensor is already connected');
        }
    },
    addPeople: function(numPeople){
        try{
            var i;
            for(i =0;i<numPeople;i++) {
                var person = {ID:'JS_'+ i.toFixed(0),location:{X:-0.2,Y:1,Z:1}};
                this.people.push(person);
            }
            this.socket.emit('personUpdate',this.people);
            console.log('JS Sensor Client generated '+numPeople+' people and pushed to the server');
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
                       person.location.X +=0.2;
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


