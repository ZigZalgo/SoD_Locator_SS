/**
 * Created by yuxiw_000 on 6/16/14.
 */
/* We mainly test everything related to socket.io with mocha & chai
 *To run the test: "mocha"
 . */

var chai = require('chai');
var should = chai.should();
var mocha = require('mocha');
var frontend = require('../frontend');
//var io = frontend.io;
//var clients = frontend.clients;
var io = require('socket.io/node_modules/socket.io-client');
describe("tryTesting",function(){
    /* Test 1 - A Single User */
    /*
    it('try to test',function(done){
        //var client = io.connect(socketURL, options);
        console.log("am i here?");
        io.emit('registerWebClient',{},function(callback){
            console.log(JSON.stringify(callback));
        })
        io.on('getClientsFromServer',function(clients){
            clients.should.be.a.Object();
            io.disconnect();
            done();
        })

    });
*/
    it("echos message", function (done) {
        var client = io.connect();

        client.on("connect", function () {
            client.once("echo", function (message) {
                message.should.equal("Hello World");

                client.disconnect();
                done();
            });

            client.emit("echo", "Hello World");
        });
    });

});
