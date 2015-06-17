var locator = require('./locator');
var factory = require('./factory');
var frontend = require('./../frontend');
var util = require('./util');
var pulse = require("./pulse");
var async =
    require("async");
// TODO: test!
/*exports.start = function () {
    locator.start();
};*/

exports.locator = locator;
/**
 * socket comes in here to handle all the request.
 *
 * @param {object} socket hands all the request from socketIO
 *
 */
exports.handleRequest = function (socket) {
    //START REGISTRATION EVENTS//////////////////////////////////////////////////////////////////////////////////////

    /**
     *  "registerDevice" listener handles register Device request
     *  @event reigsterDevice
     *  @param {object} deviceInfo contains all info about the devcie who wants to register
     *  @param {requestCallback} fn return callback for registerDevice
     *  @listens reigsterDevice
     *  @example
 *  var deviceInfo = { ID: null,                        // customizable
                  name: 'JSClient',                     // customizable
                  socketID: null,                       // defined by server
                  deviceType: 'JSClientDevice',         // customizable
                  location: { X: 1, Y: 1, Z: 1 },       // customizable
                  orientation: { yaw: 30, pitch: 45 },  // customizable
                  FOV: 70,                              // customizable
                  depth: 1,                             // customizable
                  width: 1,                             // customizable
                  ownerID: null,                        // defined by server
                  pairingState: 'unpaired',             // defined by server
                  intersectionPoint: { X: 0, Y: 0 },    // defined by server
                  lastUpdated: '2015-06-10T21:58:34.024Z', // defined by server
                  stationary: true,                     // customizable
                  deviceIP: '',                         // defined by server
                  observer:                             // customizable
                   { observerType: 'rectangular',
                     observeWidth: 2,
                     observeHeight: 1,
                     observerDistance: 1 },
                  height: 1                             // customizable
     *  }
     *  socket.emit("registerDevice",deviceInfo,function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('registerDevice', function (deviceInfo, fn) {
        console.log("Something tried to register...");
        frontend.clients[socket.id].clientType = deviceInfo.deviceType;
        if(fn!=undefined) {
            locator.registerDevice(socket, deviceInfo,fn);
        }else{
            locator.registerDevice(socket,deviceInfo)
        }

    });


    /**
     *  "registerDataPoint" listener handles register Device request
     *  @event registerDataPoint
     *  @param {object} dataPointInfo contains all info about the dataPoint who wants to register
     *  @param {requestCallback} fn return callback
     *  @listens registerDataPoint
     *  @example
     *  var dataPointInfo = {
     *                          location: { X: 1, Y: 0, Z: 1 },     // customizable
                                data: [ '123.jpg', '' ],            // customizable
                                dropRange: 0,                       // customizable
                                observeRange: 0,                    // customizable
                                observer:                           // customizable
                                {
                                    observerType: 'rectangular',
                                    observeWidth: 2,
                                    observeHeight: 1
                                },
                                subscriber: [ { subscriberType: 'device', ID: 101 } ]   // customizable
     *   }
     *  socket.emit("registerDataPoint",dataPointInfo,function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('registerDataPoint',function (dataPointInfo,fn){
        //console.log('registering dataPoint with info: ' + JSON.stringify(dataPointInfo));
        locator.registerDataPoint(socket,dataPointInfo,fn);
    });

    /**
     *  "registerSensor" listener handles register sensor request
     *  @event registerSensor
     *  @param {object} sensorInfo contains all info about the dataPoint who wants to register
     *  @param {requestCallback} fn return callback
     *  @listens registerSensor
     *  @example
     *  var sensorInfo = {
     *      sensorType: 'kinect',
            FOV: 70,
            rangeInMM: 4000,
            frameHeight: 0,
            frameWidth: 0,
            translateRule:
            {
                startingLocation: { X: 0, Y: 0, Z: 0 },
                changeInOrientation: 0,
                xSpace: 0,
                zSpace: 0,
                dX: 0,
                dZ: 0
            }
     *  }
     *  socket.emit("registerSensor",sensorInfo,function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('registerSensor', function (sensorInfo, fn) {
        console.log('registering with sensorInfo: '+JSON.stringify(sensorInfo));
        console.log(sensorInfo);
        try{
            if(sensorInfo.sensorType!=null){
                locator.registerSensor(socket,sensorInfo.sensorType,sensorInfo,fn);
            }
        }catch(e) {
            console.log("Error Register Sensor with SensorInfo: " + JSON.stringify(sensorInfo)+"\n\tdue to: "+e);
        }
    });


    socket.on('registerProjector',function (projectorInfo,fn){
        locator.projectorService.registerProjector(socket,projectorInfo,fn);
    });

    /**
     *  "registerWebClient" listener handles register webclient any client call emit this event will yield to register as a webclient
     *  @event registerWebClient
     *  @param {object} clientInfo currently not being used.
     *  @param {requestCallback} fn return callback
     *  @listens registerWebClient
     *  @example
     *
     *  socket.emit("registerWebClient",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('registerWebClient', function (clientInfo, fn) {
        frontend.clients[socket.id].clientType = "webClient";
        if (fn != undefined) {
            fn({"status": 'server: you registered as a "webClient"'})
        }
    });
    /**
     *  "registerMobileWebClient" listener handles register mobileWebClient any client call emit this event will yield to register as a webclient
     *  @event registerMobileWebClient
     *  @param {object} clientInfo currently not being used.
     *  @param {requestCallback} fn return callback
     *  @listens registerMobileWebClient
     *  @example
     *
     *  socket.emit("registerMobileWebClient",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('registerMobileWebClient', function (clientInfo, fn) {
        frontend.clients[socket.id].clientType = "mobileWebClient";
        console.log('-> A mobile web client has been registered');
        if (fn != undefined) {
            fn({"status": 'server: you registered as a "mobileWebClient"'})
        }
    });
    /**
     *  "registerUnityVisualizer" listener handles register registerUnityVisualizer any client call emit this event will yield to register as a webclient
     *  @event registerUnityVisualizer
     *  @param {object} clientInfo currently not being used.
     *  @param {requestCallback} fn return callback
     *  @listens registerUnityVisualizer
     *  @example
     *
     *  socket.emit("registerMobileWebClient",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('registerUnityVisualizer',function(clientInfo,fn){
        frontend.clients[socket.id].clientType = "unityVisualizer";
        console.log("-> A Unity Visualizer Connected");
        if(fn!=undefined){
            fn({"status":"success"})
        }
    })
    socket.on("saveCurrentState",function(request,fn){
        //console.log("SaveCurrentState request received");
        locator.saveCurrentState();
    });
    socket.on("loadFromConfig",function(request,fn){
        //console.log("SaveCurrentState request received");
        locator.loadConfig();
    });
    //END REGISTRATION EVENTS////////////////////////////////////////////////////////////////////////////////////////

    //START PROJECTOR EVENTS////////////////////////////////////////////////////////////////////////////////////////

    socket.on('connectToProjector',function (deviceInfo,fn){
        locator.projectorService.connectToProjector(socket,deviceInfo,fn);
    });

    socket.on('getRoom',function (deviceInfo,fn){
        locator.projectorService.getRoom(socket,deviceInfo,fn);
    });

    socket.on('addWindow',function (apidata,fn){
        locator.projectorService.newWindow(socket,apidata,fn);
    });

    socket.on('newCircle',function (apidata,fn){
        locator.projectorService.newCircle(socket,apidata,fn);
    });

    socket.on('moveCircle',function (apidata,fn){
        locator.projectorService.moveCircle(socket,apidata,fn);
    });

    socket.on('newRectangle',function (apidata,fn){
        locator.projectorService.newRectangle(socket,apidata,fn);
    });

    socket.on('moveRectangle',function (apidata,fn){
        locator.projectorService.moveRectangle(socket,apidata,fn);
    });

    socket.on('newTexRectangle',function (apidata,fn){
        locator.projectorService.newTexRectangle(socket,apidata,fn);
    });

    socket.on('moveTexRectangle',function (apidata,fn){
        locator.projectorService.moveTexRectangle(socket,apidata,fn);
    });

    socket.on('newLine',function (apidata,fn){
        locator.projectorService.newLine(socket,apidata,fn);
    });

    socket.on('newText',function (apidata,fn){
        locator.projectorService.newText(socket,apidata,fn);
    });

    socket.on('newPath',function (apidata,fn){
        locator.projectorService.newPath(socket,apidata,fn);
    });

    socket.on('addLineToPath',function (apidata,fn){
        locator.projectorService.addLineToPath(socket,apidata,fn);
    });

    socket.on('removeElement',function (apidata,fn){
        locator.projectorService.removeElement(socket,apidata,fn);
    });

    socket.on('getElementsOnWindow',function (apidata,fn){
        locator.projectorService.getElementsOnWindow(socket,apidata,fn);
    });

    //END PROJECTOR EVENTS////////////////////////////////////////////////////////////////////////////////////////

    //START BEACON EVENTS////////////////////////////////////////////////////////////////////////////////////////
    
    socket.on('updatedBeaconsList', function (beaconsList, fn) {
        console.log('New Updated Beacons List: '+JSON.stringify(beaconsList));
        
        try{
            if(beaconsList != null){
                locator.handleUpdatedBeaconsList(socket, beaconsList, fn);
            }
            else{
                console.log('Isnide requestHandler.js: The beaconsList is empty');
            }
        }catch(e) {
            console.log('Isnide requestHandler.js');
            console.log("Error handling updated Beacons List: " + JSON.stringify(beaconsList)+"\n\tdue to: "+e);
        }
    });

    socket.on('getBeaconsTransmittersList', function () {
        locator.getBeaconsTransmitterList(socket);
    });

    socket.on('getBeaconsRecieverList', function () {
        locator.getBeaconsRecieverList(socket);
    });

    //Handle deregistering beaconTransmitter
    socket.on('deRegisterBeaconTransmitter', function(){
        locator.handleDeregisteringBeaconTransmitter(socket);
    });

    socket.on('deRegisterBeaconReciever', function(){
        locator.handleDeregisteringBeaconReciever(socket);
    });

    socket.on ('getBeaconsTransmittersListLocation', function(fn){
        locator.getBeaconsTransmittersListLocation(socket, fn);
    });

    //END BEACON EVENTS////////////////////////////////////////////////////////////////////////////////////////




    //START PAIRING EVENTS///////////////////////////////////////////////////////////////////////////////////////////
    socket.on('setPairingState', function (data, fn) {
        locator.setPairingState(socket.id);
        if (fn != undefined) {
            fn({"status": 'server: device pairing state has been set to "pairing"'})
        }
    });

    /**
     *  "pairDeviceWithPerson" listener handles pairs a device with a person such that the device will be using the person loaction, the person can use the orientation from device
     *  @event pairDeviceWithPerson
     *  @param {!object} request contains request inof of uniqueDeviceID, uniquePersonID and pairType
     *  @param {requestCallback} fn return callback
     *  @listens pairDeviceWithPerson
     *  @example
     *  // pair device ID-101 with person ID-1. Device will be using person(ID:1)'s base location
     *  var request = {
     *      uniqueDeviceID:101,
     *      uniquePersonID:1,
     *      pairType:"base" // pairType can be "base","leftHand","rightHand" . "base" indicates person's mid-belly position
     *  };
     *  socket.emit("pairDeviceWithPerson",request,function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('pairDeviceWithPerson', function (request, fn){
        //console.log("Paring request: "+JSON.stringify(request));
        if(request.pairType==undefined){
            console.log("PairType is null, please specify a pairType when request.");
            fn({status:"fail",msg:"need pairType in request(base,leftHand,or rightHand)."});
        }else{
            if (request.uniqueDeviceID != undefined) {
                console.log('receive paring request: pair device '+ request.uniqueDeviceID +' with person ' + request.uniquePersonID );
                locator.pairDevice(util.getDeviceSocketIDByID(request.uniqueDeviceID),request.uniquePersonID,request.pairType,socket,fn);
            }else
            if (request.deviceSocketID != undefined) {
                locator.pairDevice(request.deviceSocketID, request.uniquePersonID,request.pairType,socket,fn);
            }
            else {
                locator.pairDevice(socket.id, request.uniquePersonID,request.pairType,socket,fn);
            }
        }
    });

    /**
     *  "unpairDevice" listener handles unpair the device, whoever is firing this event, with paired person.
     *  @event unpairDevice
     *  @param {?object} request can be null
     *  @param {requestCallback} fn return callback
     *  @listens unpairDevice
     *  @example
     *  //
     *  socket.emit("unpairDevice",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('unpairDevice', function (request, fn) {
        locator.unpairDevice(socket.id, request.personID);
        if (fn != undefined) {
            fn({"status": 'server: your device has been unpaired'})
        }
    });

    /**
     *  "unpairAllDevices" listener handles unpair all the device with paired person.
     *  @event unpairAllDevices
     *  @param {?object} request can be null
     *  @param {?requestCallback} fn return callback
     *  @listens unpairAllDevices
     *  @example
     *  //
     *  socket.emit("unpairAllDevices",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('unpairAllDevices', function (request, fn) {
        locator.unpairAllDevices();
        if (fn != undefined) {
            fn({"status": 'server: all devices have been unpaired'})
        }
    });

    /**
     *  "unpairAllPeople" listener handles unpair all the people with paired device.
     *  @event unpairAllPeople
     *  @param {?object} request can be null
     *  @param {requestCallback} fn return callback
     *  @listens unpairAllPeople
     *  @example
     *  //
     *  socket.emit("unpairAllPeople",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('unpairAllPeople', function (request, fn) {
        locator.unpairAllPeople();
        if (fn != undefined) {
            fn({"status": 'server: all people have been unpaired'})
        }
    });
    //END PAIRING EVENTS/////////////////////////////////////////////////////////////////////////////////////////////


    //START LOCATOR SERVICES/////////////////////////////////////////////////////////////////////////////////////////

    /**
     *  "updateOrientation" listener handles device update it's orientation to the server
     *  @event updateOrientation
     *  @param {!object} request contains the orientation data of the device
     *  @param {requestCallback} fn return callback for updateOrientation
     *  @listens updateOrientation
     *  @example
     *  // orientation can contain pitch value and yaw value
     *  var request = {
     *      orientation:{
     *          pitch:30,
     *          yaw:45
     *      }
     *  };
     *  socket.emit("updateOrientation",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('updateOrientation', function (request) {
        //not checking for fn(callback), since adding a callback here would be costly
        //console.log("Update orientation..");
        if(typeof(request.orientation)=="number"){
            var orientationForUpdate = {yaw:request.orientation,pitch:0}
            locator.updateDeviceOrientation(orientationForUpdate, socket);
        }else{
            locator.updateDeviceOrientation(request.orientation, socket);
        }
    });

    /**
     *  "updateObjectLocation" listener handles device/dataPoint update its location to the server
     *  @event updateObjectLocation
     *  @param {!object} request contains the deviceType, ID, and newLocation
     *  @param {?requestCallback} fn return callback for updateObjectLocation
     *  @listens updateObjectLocation
     *  @example
     *  // orientation can contain pitch value and yaw value
     *  var request = {
     *      objectType:"device",    // can be "device" or "dataPoint"
     *      ID:0,
     *      location:{X:1,Y:1,Z:1}
     *  };
     *  socket.emit("updateObjectLocation",request,function(callback){
     *      console.log(callback);
     *  })
     * */
    // update device or data Point location
    socket.on('updateObjectLocation', function (request,fn) {
        //not checking for fn(callback), since adding a callback here would be costly
        switch(request.objectType){
            case 'device':
                console.log('-> update device Location event received with request' +JSON.stringify(request));
                locator.devices[Object.keys(locator.getDeviceByID(request.ID))[0]].location = request.newLocation;
                console.log('ID: '+ locator.devices[Object.keys(locator.getDeviceByID(request.ID))[0]].uniqueDeviceID+ ' -> ' +JSON.stringify(locator.devices[Object.keys(locator.getDeviceByID(request.ID))[0]].location));
                break;
            case 'dataPoint':
                locator.dataPoints[request.ID].location = request.newLocation;
                console.log('-> update dataPoints Location event received with request' +JSON.stringify(request));
                console.log('\t->->ID: '+ locator.dataPoints[request.ID].ID+ ' -> ' +JSON.stringify(locator.dataPoints[request.ID].location));
                console.log(fn);
                if(fn!=undefined){
                    fn();
                }
                //console.log('-> update dataPoint location event received with request' +JSON.stringify(request));
                break;
            default:
                console.log('-> Wrong type for udpating location');
        }
        locator.refreshStationarylayer(); // refresh all the stationary layer.
    });

    /**
     *  "updateDeviceInfo" listener handles update device information on the server.
     *  @event updateDeviceInfo
     *  @param {!object} deviceInfo contains the deviceInfo that we want to update
     *  @param {?requestCallback} fn return callback for updateDeviceInfo
     *  @listens updateDeviceInfo
     *  @example
     *  // orientation can contain pitch value and yaw value
     *  var deviceInfo = {
     *      objectType:"happiness",
     *      location:{X:1,Y:1,Z:1}
     *  };  // device property will be updated according to deviceInfo
     *  socket.emit("updateDeviceInfo",deviceInfo,function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('updateDeviceInfo', function (deviceInfo, fn) {
        locator.updateDevice(socket.id,deviceInfo,fn);
    });

    /**
     *  "updateSensorInfo" listener handles update sensor infomation on the server
     *  @event updateSensorInfo
     *  @param {!object} sensorInfo contains the sensorInfo that we want to update
     *  @param {?requestCallback} fn return callback for updateSensorInfo
     *  @listens updateSensorInfo
     *  @example
     *  // we mainly use this to update calibration rule of the sensor
     *  var sensorInfo = {
     *      translateRule:{
     *          changeInOrientation: 22,    // Rotation
     *          dX:0,                       // transformX
     *          dZ:0,                       // transformY
     *          xSpace: 0,                  // xSpaceTransition
     *          zSpace: 0,                  // ySpaceTransition
     *          startingLocation.X:0,       // startingLocation.X
     *          startingLocation.Y:0,       // startingLocation.Y
     *          startingLocation.Z:0        // startingLocation.Z
     *      }
     *  };  // device property will be updated according to deviceInfo
     *  socket.emit("updateSensorInfo",sensorInfo,function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('updateSensorInfo',function(sensorInfo,fn){
        if(sensorInfo.translateRule!=undefined){
            var receivedCalibration =  {Rotation: sensorInfo.translateRule.changeInOrientation, TransformX: sensorInfo.translateRule.dX, TransformY: sensorInfo.translateRule.dZ,xSpaceTransition:sensorInfo.translateRule.xSpace,ySpaceTransition:sensorInfo.translateRule.zSpace,
                StartingLocation: {X: sensorInfo.translateRule.startingLocation.X, Y: sensorInfo.translateRule.startingLocation.Y, Z: sensorInfo.translateRule.startingLocation.Z}};
            if(locator.sensors.kinects[socket.id]!=undefined){
                locator.sensors.kinects[socket.id].calibration = receivedCalibration;
                console.log(JSON.stringify(locator.sensors.kinects[socket.id].calibration));
            }
        }
    });

    socket.on('updateServerSettings',function(request,response){
        console.log("Setting change request" + JSON.stringify(request));
        if(request.hasOwnProperty("room")||request.hasOwnProperty("pulse")){
            for(var type in request){
                if(Object.keys(request[type]).length>0) {
                    console.log(type);
                    async.each(Object.keys(request[type]), function (aProperty, itrCallbackSetting) {
                        console.log(aProperty);
                        locator.changeSetting(type, aProperty, request[type][aProperty],function(data){
                            if(data){
                                itrCallbackSetting()
                            }else{
                                response(false);
                            }
                        })

                    }, function (err) {
                        //console.log("all done" + err);
                        if(type=='pulse'){
                            pulse.refreshHeartbeat();
                        }
                        response(true);
                    })
                }

            }
//  pulse.refreshHeartbeat(property,value,callback);
        }else{
            console.log("request doesn't have correct property");
        }
    });

    // END of update envets


    // Client requests
    /**
     *  "getPeopleFromServer" listener handles get all the people from server
     *  @event getPeopleFromServer
     *  @param {?object} request not being used
     *  @param {!requestCallback} fn return callback contains list of people on the server in dictionary
     *  @listens getPeopleFromServer
     *  @example
     *
     *
     *  socket.emit("getPeopleFromServer",function(callback){
     *      console.log(callback);  // callback object is the list of people from server
     *  })
     * */
    socket.on('getPeopleFromServer', function (request, fn) {
        if (fn != undefined) {
            fn((locator.persons));
        }
    });



    /**
     *  "dropData" listener handles when a person performs release handgesture and drop the data associate with the person to the location
     *      this function will check whether there is a dataPoint within the dropRange
     *          if there is a dataPoint within the range the data associate with the person will be dump into the dataPoint
     *          otherWise a new dataPoint will spawn on the current location where the person is standing and link the data to it.
     *  @event dropData
     *  @param {!object} request contains the dropRange of the person and the ID of the person
     *  @param {?requestCallback} fn return callback
     *  @listens dropData
     *  @example
     *  var request = {ID:0, dropRange:0.5};
     *  socket.emit("dropData",function(callback){
     *      console.log(callback);
     *  })
     * */
    socket.on('dropData',function(request,fn){
        for(var key in locator.persons){
            if(locator.persons[key].uniquePersonID == request.ID){
                locator.dropData(socket,locator.persons[key],request.dropRange,fn);
            }
        }
        //locator.dropData(socket,request.ID,request.range);
    });

    /**
     *  "getClientsFromServer" listener handles get all the clients from server
     *  @event getClientsFromServer
     *  @param {?object} request not being used
     *  @param {!requestCallback} fn return callback contains device socketID, clientType
     *  @listens getClientsFromServer
     *  @example
     *
     *
     *  socket.emit("getClientsFromServer",function(callback){
     *      console.log(callback);  // callback object is the list of client from server
     *  })
     * */
    socket.on('getClientsFromServer', function (request, fn) {
        var selectedValues = {};
        for (var key in frontend.clients) {
            selectedValues[key] = {socketID: frontend.clients[key].id, clientType: frontend.clients[key].clientType}
        };
        if (fn != undefined) {
            fn(selectedValues);
        }
    });

    /**
     *  "getDevicesWithSelection" listener handles get device with selection
     *  @event getDevicesWithSelection
     *  @param {!object} request contains the arrays of selection such as ["all", "inView", "inRange","allExclusive", "paired", "nearest", "single<ID number>"]
     *  @param {!requestCallback} fn return callback contains the selected device based on selection
     *  @listens getDevicesWithSelection
     *  @example
     *  // supported selection type are "all", "inView", "inRange","allExclusive", "paired", "nearest", "single<ID number>"
     *  var list = ["inView","nearest"];
     *  socket.emit("getDevicesWithSelection",{selection:list},function(callback){
     *      console.log(callback);  // callback contains the device that are inView but also nearest to the device who fire the event
     *  })
     * */
    socket.on('getDevicesWithSelection', function (request, fn) {
       // console.log("There are " + request.selection.length + " filters in selection array." + JSON.stringify(request.selection))
        //console.log(util.filterDevices(socket, request.selection));
        fn(util.filterDevices(socket, request));
    })


    /**
     *  "getDeviceInViewWithDistance" listener handles get device inView but also include the distance towards the device
     *  @event getDeviceInViewWithDistance
     *  @param {?object} request nullable
     *  @param {!requestCallback} fn return callback contains the device inView with additional field of the distance towards the device
     *  @listens getDeviceInViewWithDistance
     *  @example
     *  var request = null;
     *  socket.emit("getDeviceInViewWithDistance",request,function(callback){
     *      // callback contains the list of devices inView, in each device object there is a additional field indicates the distance from the device towards whoever fire the event
     *      console.log(callback);
     *  })
     * */
    socket.on("getDeviceInViewWithDistance",function(request,fn){
        var devicesInView = util.filterDevices(socket,{selection:['inView']});
        var listWithDistance = {};
        async.each(Object.keys(devicesInView),function(deviceKey,eachCallback){
            util.getDistanceOfTwoLocation(locator.devices[socket.id].location,locator.devices[deviceKey].location,function(callback){
                console.log(callback);
                listWithDistance[deviceKey] = locator.devices[deviceKey];
                listWithDistance[deviceKey]["distance"] = callback
                eachCallback();
            })
        },function(err){
            console.log("ALL done."+JSON.stringify(listWithDistance));
            if(fn!=undefined){
                console.log(fn);
                fn(listWithDistance);
            }
        })
    });

    /**
     *  "getDataPointsWithSelection" listener handles get all the dataPoints from server
     *  @event getDataPointsWithSelection
     *  @param {!object} request array of selections ["all"]
     *  @param {!requestCallback} fn return callback contains list of dataPoints
     *  @listens getDataPointsWithSelection
     *  @example
     *  // currently selection only supports ["all"]
     *  var selectionList = ["all"];
     *  socket.emit("getDataPointsWithSelection",{selection:selectionList},function(callback){
     *      console.log(callback);  // callback object contains list of dataPoints
     *  })
     * */
    socket.on('getDataPointsWithSelection', function (request, fn) {
        var selection = request.selection;
        if(fn!=undefined){
            switch (selection){
                case 'all':
                    fn(locator.dataPoints);
                default:
                    fn(locator.dataPoints);
            }
        }
    })

    /**
     *  "getSensorsFromServer" listener handles get all the sensors from server
     *  @event getSensorsFromServer
     *  @param {?object} request not being used
     *  @param {!requestCallback} fn return callback contains sensors
     *  @listens getSensorsFromServer
     *  @example
     *
     *
     *  socket.emit("getSensorsFromServer",function(callback){
     *      console.log(callback);  // callback object is the list of sensors from server
     *  })
     * */
    socket.on('getSensorsFromServer', function (request, fn) {
        if (fn != undefined) {
            fn((locator.sensors));
        }
    });

    /**
     *  "getRoomFromServer" listener handles get the room info from server
     *  @event getRoomFromServer
     *  @param {?object} request is nuable
     *  @param {!requestCallback} fn return callback contains room setup
     *  @listens getRoomFromServer
     *  @example
     *
     *
     *  socket.emit("getRoomFromServer",function(callback){
     *      console.log(callback);  // callback object is the room info
     *      callback = {
     *                  location = {X:0,Y:0,Z:0},
     *                  length = 6,
     *                  depth = 8,
     *                  height = 4
     *              }//callback looks like this.
     *
     *
     *  })
     * */
    socket.on("getRoomFromServer",function(request,callback){
        //console.log("Get Room request received with "+JSON.stringify(request));
        if(callback!=null){
            callback(locator.room);
        }else{
            console.log("Callback function is null for return locator room information");
        }
    })


    socket.on('getCalibrationFrames', function (request, fn) {
        // error checking see if the sensor is not defined
        if (frontend.clients[request.referenceSensorID] != undefined && frontend.clients[request.uncalibratedSensorID] != undefined) {
            frontend.clients[request.referenceSensorID].emit('getFrameFromSensor', socket.id);
            frontend.clients[request.uncalibratedSensorID].emit('getFrameFromSensor', socket.id);
        } else {
            console.log('reference sensor or calibrate sensor could be undefined.');
        }
    });

    /**
     *  "getDistanceToDevice" listener handles get Distance to a specific device
     *  @event getDistanceToDevice
     *  @param {!object} request contains a dictioanry with key of "ID" point to a value of ID number
     *  @param {!requestCallback} fn return callback contains the distance towards device ID=0
     *  @listens getDistanceToDevice
     *  @example
     *  var request = {ID:0};
     *  socket.emit("getDistanceToDevice",request,function(callback){
     *      console.log(callback);  // callback object contains the distance towards device ID=0
     *  })
     * */
    socket.on('getDistanceToDevice', function (request, fn) {
        if (util.getDeviceSocketIDByID(request.ID) != undefined) {
            //target device found, return distance
            try {
                fn(util.distanceBetweenPoints(locator.devices[socket.id].location, locator.devices[util.getDeviceSocketIDByID(request.ID)].location));
            }
            catch (err) {
                console.log("Error calculating distance between devices: " + err);
            }
        }
        else {
            //target device not found
            fn(-1);
        }
    });

    /**
     *  "getDistanceBetweenDevices" listener handles get Distance between two devices
     *  @event getDistanceBetweenDevices
     *  @param {!object} request contains a dictionary with key of "ID1"&"ID2" points value of ID number
     *  @param {!requestCallback} fn return callback contains the distance towards device ID=0
     *  @listens getDistanceBetweenDevices
     *  @example
     *  var request = {ID1:0,ID2:1};
     *  socket.emit("getDistanceBetweenDevices",request,function(callback){
     *      console.log(callback);  // callback object contains the distance between device ID1=0 and device ID2=1
     *  })
     * */
    socket.on('getDistanceBetweenDevices', function (request, fn) {
        if (util.getDeviceSocketIDByID(request.ID1) != undefined && util.getDeviceSocketIDByID(request.ID2) != undefined) {
            //target devices found, return distance
            try {
                fn(util.distanceBetweenPoints(locator.devices[util.getDeviceSocketIDByID(request.ID1)].location, locator.devices[util.getDeviceSocketIDByID(request.ID2)].location));
            }
            catch (err) {
                console.log("Error calculating distance between devices: " + err);
                fn(-1);
            }
        }
        else {
            //one or both target devices not found
            fn(-1);
        }
    });

    /**
     *  "getDistanceBetweenPersonAndDevice" listener handles get Distance between a device and a person
     *  @event getDistanceBetweenDevices
     *  @param {!object} request contains a dictionary with key of "ID1" is the person ID &"ID2" is the device ID
     *  @param {!requestCallback} fn return callback contains the distance between the device and the person
     *  @listens getDistanceBetweenDevices
     *  @example
     *  var request = {ID1:0,ID2:1};
     *  socket.emit("getDistanceBetweenPersonAndDevice",request,function(callback){
     *      console.log(callback);  // callback object contains the distance between person ID1=0 and device ID2=1
     *  })
     * */
    socket.on('getDistanceBetweenPersonAndDevice', function (request, fn) {
        if (locator.persons[request.ID1] != undefined && util.getDeviceSocketIDByID(request.ID2)!=undefined){
            try{
                fn(util.distanceBetweenPoints(locator.persons[request.ID1].location, locator.devices[util.getDeviceSocketIDByID(request.ID2)].location));
            }
            catch(err){
                console.log("Error calculating distance between person and device: " + err);
                fn(-1);
            }
        }
        else{
            fn(-1);
        }
    });

    /**
     *  "getDistanceBetweenPeople" listener handles get Distance between two people
     *  @event getDistanceBetweenPeople
     *  @param {!object} request contains a dictionary with key of "ID1" is the person ID &"ID2" is another person ID
     *  @param {!requestCallback} fn return callback contains the distance between the device and the person
     *  @listens getDistanceBetweenPeople
     *  @example
     *  var request = {ID1:0,ID2:1};
     *  socket.emit("getDistanceBetweenPeople",request,function(callback){
     *      console.log(callback);  // callback object contains the distance between person ID1=0 and person ID2=1
     *  })
     * */
    socket.on('getDistanceBetweenPeople', function(request, fn){
        if(locator.persons[request.ID1] != undefined && locator.persons[request.ID2]){
            try{
                fn(util.distanceBetweenPoints(locator.persons[request.ID1].location, locator.persons[request.ID2].location));
            }
            catch(err){
                console.log("Error calculating distance between people: " + err);
                fn(-1);
            }
        }
    })
    //END LOCATOR SERVICES///////////////////////////////////////////////////////////////////////////////////////////

    //START SENDING SERVICES/////////////////////////////////////////////////////////////////////////////////////////



    /**
     *  "sendEventToDevicesWithSelectionIncludingSelf" listener send playload to devices with selection including self.
     *  @event sendEventToDevicesWithSelectionIncludingSelf
     *  @param {!object} request contains a nullable eventName, a array of selections such as the arrays of selection such as ["all", "inView", "inRange","allExclusive", "paired", "nearest", "single<ID number>"]
     *  @param {?requestCallback} fn return callback contains status
     *  @listens sendEventToDevicesWithSelectionIncludingSelf
     *  @example
     *  var request = {
     *      selection:["all", "inView", "inRange","allExclusive", "paired", "nearest", "single<ID number>"]
     *      eventName:"anEventName" // if this is null, then the payload will be send to device directly without an eventname
     *      };
     *  socket.emit("sendEventToDevicesWithSelectionIncludingSelf",request,function(callback){
     *      console.log(callback);  // callback object contains the distance between person ID1=0 and person ID2=1
     *  })
     * */
    socket.on('sendEventToDevicesWithSelectionIncludingSelf', function(payload, fn){
        for (var key in util.filterDevices(socket, payload)) {
            if (locator.devices.hasOwnProperty(key)) {
                if(payload.eventName==undefined){
                    frontend.clients[key].send(payload)
                }
                else{
                    frontend.clients[key].emit(payload.eventName, payload)
                }
            }
        }
        if (fn != undefined) {
            fn({status: "server: content sent to devices with selection: " + payload.selection});
        }
    });

    /**
     *  "sendEventToDevicesWithSelection" listener send playload to devices with selection including self.
     *  @event sendEventToDevicesWithSelection
     *  @param {!object} request contains a nullable eventName, a array of selections such as the arrays of selection such as ["all", "inView", "inRange","allExclusive", "paired", "nearest", "single<ID number>"]
     *  @param {?requestCallback} fn return callback contains status
     *  @listens sendEventToDevicesWithSelection
     *  @example
     *  var request = {
     *      selection:["all", "inView", "inRange","allExclusive", "paired", "nearest", "single<ID number>"]
     *      eventName:"anEventName" // if this is null, then the payload will be send to device directly without an eventname
     *      };
     *  socket.emit("sendEventToDevicesWithSelection",request,function(callback){
     *      console.log(callback);  // callback object contains the distance between person ID1=0 and person ID2=1
     *  })
     * */
    socket.on('sendEventToDevicesWithSelection', function(payload, fn){
        //console.log(payload);
        for (var key in util.filterDevices(socket, payload)) {
            if (locator.devices.hasOwnProperty(key) && socket != frontend.clients[key]) {
                if(payload.eventName==undefined){
                    frontend.clients[key].send(payload.data)
                }
                else{
                    frontend.clients[key].emit(payload.eventName, payload.data)
                }
            }
        }
        if (fn != undefined) {
            fn({status: "server: content sent to devices with selection: " + payload.selection});
        }
    });


    socket.on('requestDataFromSelection', function (request, fn) {
        console.log("Got request: " + JSON.stringify(request));
        for (var key in util.filterDevices(socket, request)) {
            if (locator.devices.hasOwnProperty(key) && socket != frontend.clients[key]) {
                if(request.arguments==undefined) request.arguments = null;
                frontend.clients[key].emit("request",
                    {
                        dataRequested: request.data,
                        arguments: request.arguments
                    },
                    function (data)
                    {
                        console.log(data);
                        socket.emit(request.data, data);
                    })
            }
        }
        if (fn != undefined) {
            fn({status: "server: request sent to devices with selection: " + request.selection});
        }
    });

    /**
     *  "broadcast" listener send playload all the clients through socket.broadcast
     *  @event broadcast
     *  @param {!object} request contains payload of the data wanted to be send to all the devices
     *  @param {?requestCallback} fn nullable
     *  @listens broadcast
     *  @example
     *  var request = {
     *          payload:"anypayload" // if this is null, then the payload will be send to device directly without an eventname
     *      };
     *  socket.emit("broadcast",request)
     * */
    socket.on('broadcast', function (request, fn) {
        try {
            //console.log(JSON.stringify(request));
            console.log("Received Broadcast emit from "+ frontend.clients[socket.id].clientType);
            socket.broadcast.emit(request.listener, {payload: request.payload, sourceID: socket.id});
        }
        catch (err) {
            console.log(err + 'broadcasting failed.');
        }
    });

    //END SENDING SERVICES///////////////////////////////////////////////////////////////////////////////////////////

    socket.on('personUpdate', function (persons, fn) {
        //get persons from body, call update function for each person
        if (persons != null) {
            //console.log(Object.keys(persons).length);
            //console.log(persons);
			try{
                locator.removeIDsNoLongerTracked(socket, persons);
				locator.removeUntrackedPeople(0);
			}
			catch(err){
				console.log("error trying to remove untracked people: " + err);
			}
            persons.forEach(function (person) {
                if(person.gesture!=null){
                    console.log(person.gesture);
                }
                locator.updatePersons(person, socket);
            });
            /*if(fn!=undefined) {
                fn();
            }*/
        }
        else {
            console.log("request was null");
        }
        //locator.printPersons();
    });




    socket.on('handsUpdate',function(handdata,fn){
        console.log("Hand update with data: "+JSON.stringify(handdata));
        handdata.socketID = socket.id;
        handdata.sensorID = locator.sensors.leapMotions[socket.id].ID;
        for (var key in util.filterDevices(socket, handdata)) {
            if (locator.devices.hasOwnProperty(key) && socket != frontend.clients[key]) {


                if(handdata.gestureType=="TYPE_CIRCLE") {
                    frontend.clients[key].emit("check", handdata);
                    console.log("check");
                }


            }
        }

    });


    socket.on('error', function (err) {
        console.log("error: " + err);
    })

    socket.on('uncaughtException', function (err) {
        console.log("uncaughtException: " + err);
    });


    socket.on('calibrateSensors', function (request, fn) {
        var translateRule = locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints);
        frontend.clients[request.uncalibratedSensorID].emit('setTranslateRule', locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints))
        locator.sensors.kinects[request.uncalibratedSensorID].calibration =
        {Rotation: translateRule.degree, TransformX: translateRule.xDistance, TransformY: translateRule.zDistance, xSpaceTransition: translateRule.xSpaceTransition, ySpaceTransition: translateRule.zSpaceTransition, StartingLocation: translateRule.startingLocation};
        locator.sensors.kinects[request.uncalibratedSensorID].isCalibrated = true;

        fn(locator.calibrateSensors(request.sensorOnePoints, request.sensorTwoPoints));
        //take two sensorIDs from request, call locator.calibrateSensors(sid1, sid2)
        //return calibration for client? nah....... maybe....
    });




};