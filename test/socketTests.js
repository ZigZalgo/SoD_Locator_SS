/**
 * Created by yuxiw_000 on 6/16/14.
 */
/* We mainly test everything related to socket.io with mocha & chai
 *To run the test:
 *      1, Fire up the server
 *          - through command: "node frontend.js
 *      2, run command : "mocha"
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


describe("register", function () {
    it('Should be able to register clients', function(done){

        var client = io.connect(socketURL,options);
        client.on('connect',function(data){
            client.emit('registerWebClient',{},function(data){

                console.log(data.status);
                data.status.should.equal('server: you registered as a "webClient"');
                client.disconnect();
                done();
            });
        })
    });
    /*var client1, client2, client3;
     var message = 'Hello World';
     var messages = 0;

     var checkMessage = function(client){
     client.on('message', function(msg){
     message.should.equal(msg);
     client.disconnect();
     messages++;
     if(messages === 3){
     done();
     };
     });
     };

     client1 = io.connect(socketURL, options);
     checkMessage(client1);

     client1.on('connect', function(data){
     client2 = io.connect(socketURL, options);
     checkMessage(client2);

     client2.on('connect', function(data){
     client3 = io.connect(socketURL, options);
     checkMessage(client3);

     client3.on('connect', function(data){
     client2.send(message);
     });
     });
     });*/



});
