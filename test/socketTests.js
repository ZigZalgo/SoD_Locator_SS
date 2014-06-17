/**
 * Created by yuxiw_000 on 6/16/14.
 */
/* We mainly test everything related to socket.io with mocha & chai
 *To runt the test: "mocha"
 . */


var should = require('should');
var frontend = require('../frontend');
//var io = frontend.io;
//var clients = frontend.clients;
var io = require('socket.io');
io = io.connect();
describe("tryTesting",function(){
    /* Test 1 - A Single User */
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
});
