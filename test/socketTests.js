/**
 * Created by yuxiw_000 on 6/16/14.
 */
/* We mainly test everything related to socket.io with mocha & chai
 *To run the test:
 *      1, Fire up the server
 *          - through command: "node frontend.js
 *      2, run command : "mocha -R -nyan"
 . */

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
    Client = Clients.pop();
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
    it('should be able to register everything(sensor,clients,devices)', function(done){
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
                Object.keys(data).length.should.be.above(0);
                client.disconnect();
                done();
            })

        })
    });

    it('should be able to register sensor', function(done){
        var client = io.connect(socketURL,options);
        client.on('connect',function(data){
            // register sensor
            client.emit('registerSensor',{},function(data){
                data.status.should.equal('server: you registered as a "sensor"');
                client.emit('registerSensor',{});
            });

            /*
             * Testing all the after effect for registering.
             * */
            client.emit('getSensorsFromServer',{},function(data){

                Object.keys(data).length.should.be.equal(2);
                client.disconnect();
                done();
            })
        })
    });

    it('should be able to register device', function(done){
        var client = io.connect(socketURL,options);
        client.on('connect',function(data){
            // register sensor
            client.emit('registerDevice',{},function(data){
                data.status.should.equal('server: your device has been registered');
                client.emit('registerDevice',{});
            });

            /*
             * Testing all the after effect for registering.
             * */
            client.emit('getDevicesFromServer',{},function(data){

                Object.keys(data).length.should.be.equal(2);
                client.disconnect();
                done();
            })
        });
    })
});


//testing send data
describe("send data", function () {
    it('should sendString To Devices With Selection)', function(done){
        var client = io.connect(socketURL,options);
        client.on('connect',function(data){
            client.emit('sendStringToDevicesWithSelection',{},function(data){
                data.status.should.be.equal('server: string sent');

                client.emit('sendStringToDevicesWithSelection',{selection:'all'},function(data){
                    data.status.should.be.equal('server: string sent to all');
                    client.disconnect();
                    done();
                });
            });
        })
    })
});

