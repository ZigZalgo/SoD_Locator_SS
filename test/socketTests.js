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

    it('should be able to register sensor', function(done){
        var client1 = io.connect(socketURL,options);
        var sampleSensor = {sensorType:'sampleType',FOV:10,rangeInMM:1,frameHeight:10,frameWidth:10,translateRule:{
            changeInOrientation:10,dX:10,dZ:10,xSpace:10,zSpace:10,startingLocation:{X:0,Y:0,Z:0}}};
        client1.on('connect',function(data){
            // register sensor
            client1.emit('registerSensor',sampleSensor,function(data){
                data.sensorNumber.should.equal(1);
            });
            client1.disconnect();
        })
        var client2 = io.connect(socketURL,options);
        client2.on('connect',function(data){
            client2.emit('registerSensor',sampleSensor,function(data){
                data.sensorNumber.should.equal(2);
            client2.disconnect();
        })
        })

        done();
            //        recursiveDisconnect([client1,client2,client3],done);
    })

    it('should be able to register device', function(done){
        var client1 = io.connect(socketURL,options);
        client1.on('connect',function(data){
            // register sensor
            client1.emit('registerDevice',{},function(data){
                data.status.should.equal('server: your device has been registered)')
            });
            client1.disconnect();
        })

        var client2 = io.connect(socketURL,options);
        client2.on('connect',function(data){
            client2.emit('registerDevice',{});
            client2.disconnect();
        })



        //recursiveDisconnect([client1,client2,client3],done);
        done();
    })
});


//testing send data
describe("send data", function () {
    it('should send String To Devices With Selection)', function(done){
        var client1 = io.connect(socketURL,options);
        client1.on('connect',function(data){
            client1.emit('registerDevice',{deviceType:'testDevice'},function(data){
                //    data.currentDeviceNumber.should.equal(1);
            })
        });

        client1.on('string',function(request,fn){
            console.log(JSON.stringify(request.data));
            request.data.should.be.equal('life is hard');
            client1.disconnect();

        })


        var client2 = io.connect(socketURL,options);
        client2.on('connect',function(data){
            client2.emit('registerDevice',{deviceType:'testDevice'},function(data){
                //data.currentDeviceNumber.should.equal(2);
                client2.emit('string',{data:'life is hard'},function(){
                    console.log('test client 2 disconnected.');
                    client2.disconnect();
                });
            })



        });



        done();
    })
});

