/**
 * Created by yuxiw_000 on 6/18/14.
 */
/*
*   JS Client Implementation for SOD
*
* **/

function SOD(){
    //this.serverURL = serverURL;
    //this.socketURL = socketURL;
    this.socket= null;
    this.userListeners = {};
    this.device = null;
}

function SOD(device){
    //this.serverURL = serverURL;
    //this.socketURL = socketURL;
    this.socket= null;
    this.userListeners = {};
    this.device = device;
}

SOD.prototype = {
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
            console.log("Registering device...")
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
    }

}