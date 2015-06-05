/**
 * Created by yuxiw_000 on 6/16/14.
 */
/* We mainly test everything related to socket.io with mocha & chai
 *To run the test:
 *      1, Fire up the server
 *          - through command: "node frontend.js
 *      2, run command : "mocha -R -nyan"
 . */


//var Q = require('q');
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var mocha = require('mocha');
//var locator = require('../locator');
var frontend = require('../frontend');
//var io = frontend.io;
//var clients = frontend.clients;
var io = require('socket.io/node_modules/socket.io-client');
var socketURL = 'http://localhost:3000';
var options ={
    transports: ['websocket'],
    'force new connection': true
};

var device = {  ID : null,
    name : 'JSClient',
    socketID : null,
    deviceType : "JSClientDevice",
    location : {X: 1, Y: 2, Z:3},
    orientation : 2470,
    FOV : 12,
    height : 1,
    width :  1,
    depth: 1,
    ownerID : null,
    pairingState : "unpaired",
    lastUpdated : new Date(),
    stationary : true,
    deviceIP : '',
    observer:null
}

// Disconnect clients through array
function recursiveDisconnect(Clients, callback) {
    var Client = Clients.pop();
    Client.on('disconnect',function() {
        if(Clients.length > 0) recursiveDisconnect(Clients);
        else {
            callback();
        }
    });

    Client.disconnect();
}

// testing register functions
describe("register functions", function () {
    it('should be able to register everything web clients', function(done){
        var client = io.connect(socketURL,options);
        client.on('connect',function(data){
            /*
            * Testing registering functions
            * */
            client.emit('registerWebClient',{},function(data){
                data.status.should.equal('server: you registered as a "webClient"');
            });

            /*
            * Testing all the after effect for registering.
            * */
            client.emit('getClientsFromServer',{},function(data){
                //Object.keys(data).length.should.be.above(0);
                client.disconnect();
                done();
            })

        })
    });

    it('SoD should be able to allow register kinect', function(done){
        var client1 = io.connect(socketURL,options);
        var sampleKinectSensor = {sensorType:'kinect2',FOV:10,rangeInMM:1,frameHeight:10,frameWidth:10,translateRule:{
            changeInOrientation:10,dX:10,dZ:10,xSpace:10,zSpace:10,startingLocation:{X:0,Y:0,Z:0}}};
        client1.on('connect',function(data){
            // register sensor
            client1.emit('registerSensor',sampleKinectSensor,function(data){
                //console.log("register Kinect callback" + JSON.stringify(data));
                data.should.have.property('status','registered');
                //data['status'].should.equal('registered');
                data['entity'].sensorType.should.equal('kinect');
                client1.disconnect();
                done();
            });
        })
    });

    it('SoD should be able to allow register LeapMotion', function(done){
        var client = io.connect(socketURL,options);
        var sampleLeapSensor = {sensorType:'LeapMotion',location:{X:0,Y:0,Z:0}};
        client.on('connect',function(data){
            // register sensor
            client.emit('registerSensor',sampleLeapSensor,function(data){
                console.log("register Leap callback" + JSON.stringify(data));
                data.should.have.property('status','registered');
                //data['status'].should.equal('registered');
                data['entity'].sensorType.should.equal('LeapMotion');
                data['entity'].location.X.should.equal(0);
                client.disconnect();
                done();
            });
        })
        //        recursiveDisconnect([client1,client2,client3],done);
    })

    it('SoD should be able to allow register iBeacon', function(done){
        var client = io.connect(socketURL,options);
        var sampleLeapSensor = {sensorType:'iBeacon'};
        client.on('connect',function(data){
            // register sensor
            client.emit('registerSensor',sampleLeapSensor,function(data){
                console.log("register iBeacon callback" + JSON.stringify(data));
                data.should.have.property('status','registered');
                //data['status'].should.equal('registered');
                data['entity'].sensorType.should.equal('iBeacon');
                client.disconnect();
                done();
            });
        })
        //        recursiveDisconnect([client1,client2,client3],done);
    })

    it('should be able to register device', function(done){
        var client1 = io.connect(socketURL,options);
        client1.on('connect',function(data){
            console.log('haha');
            // register sensor
            try{
                client1.emit('registerDevice', device, function(data){
                    data.should.have.property('status','registered');
                    //console.log(data);
                    expect(data.entity.socketID).to.equal(client1.socket.transport.sessid);
                    expect(data.entity.orientation.yaw).to.equal(device.orientation%360);
                    expect(data.entity.depth).to.equal(device.depth);
                    expect(data.entity.height).to.equal(device.height);
                    expect(data.entity.width).to.equal(device.width);
                    client1.disconnect();
                    done();
                })
            }
            catch(err){
                console.log(err)
                console.log("Failed to register device.")
            }
        })
    })
});

/*
describe("Sensor functions -", function () {
    it('LeapMotion - \"handUpdate\" updateHand data should work: ', function(done){

        var client = io.connect(socketURL,options);
        var sampleLeapSensor = {sensorType:'LeapMotion',location:{X:0,Y:0,Z:0}};
        var updateLeftHandData = {whichHand:"left",ID:10,gesture:"Hold"};
        var updateRightHandData = {whichHand:"right",ID:11,gesture:"Swipe"};
        var person = {ID:'Test_'+ '0',location:{X:-0.3,Y:1,Z:1}, trackingState: 1};
        var people = [person];
        client.on('connect',function(data){

            client.emit('registerSensor',sampleLeapSensor,function(data){
                //Tesing hand update for left hand data.
                var client1 = io.connect(socketURL,options);
                var sampleKinectSensor = {sensorType:'kinect2',FOV:10,rangeInMM:1,frameHeight:10,frameWidth:10,translateRule:{
                    changeInOrientation:10,dX:10,dZ:10,xSpace:10,zSpace:10,startingLocation:{X:0,Y:0,Z:0}}};
                client1.on('connect',function(data){
                    // register sensor
                    client1.emit('registerSensor',sampleKinectSensor,function(data){
                        //console.log("register Kinect callback" + JSON.stringify(data));
                        data.should.have.property('status','registered');
                        //data['status'].should.equal('registered');
                        data['entity'].sensorType.should.equal('kinect');

                        // add a person to server.
                        client1.emit('personUpdate',people,function(){
                            // person gets updated
                            client.emit('handsUpdate',updateLeftHandData,function(data){
                                expect(data.entity.left.ID).to.equal(updateLeftHandData.ID);
                                expect(data.entity.left.gesture).to.equal(updateLeftHandData.gesture);

                                  //Tesing hand update for right hand data.

                                client.emit('handsUpdate',updateRightHandData,function(data){
                                    expect(data.entity.right.ID).to.equal(updateRightHandData.ID);
                                    expect(data.entity.right.gesture).to.equal(updateRightHandData.gesture);
                                    client.disconnect();
                                    client1.disconnect();
                                    done();
                                })
                            })
                        });
                    });
                })


            });

        })
    });
})*/

//testing send data
/*describe("send data", function () {

});*/

