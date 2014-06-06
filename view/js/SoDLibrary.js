/**
 * Created by ASE Lab on 06/06/14.
 */

function setup(){
    io = io.connect()

    //socket.connect("http://"+address+":"+port);
    io.on('connect', function () {
        text.html('connected');
        io.emit("registerWebClient", {});
    });
    io.on('message', function (msg) {
        text.html(msg);
    });
    io.on('disconnect', function () {
        text.html('disconnected');
    });
}