var cameraHeightInPixels = 320;
var cameraWidthInPixels = 480;
var cameraFOV = 57;
var minorGridLineWidth = 10;
var majorGridLineWidth = 50;
var pixelsPerMeter = majorGridLineWidth;
var ROUND_RATIO  = 10;
var unpaired_people = {};
var uniqueDeviceIDToSocketID = {}


function drawGrid() {
    var cnv = document.getElementById("cnvBG");

    var gridOptions = {
        minorLines: {
            separation: minorGridLineWidth,
            color: '#EEEEEE'
        },
        majorLines: {
            separation: majorGridLineWidth,
            color: '#BBBBBB'
        }
    };

    drawGridLines(cnv, gridOptions.minorLines);
    drawGridLines(cnv, gridOptions.majorLines);

    return;
}

function drawGridLines(cnv, lineOptions) {
    var iWidth = cnv.width;
    var iHeight = cnv.height;
    var ctx = cnv.getContext('2d');

    ctx.strokeStyle = lineOptions.color;
    ctx.strokeWidth = 1;

    ctx.beginPath();

    var iCount = null;
    var i = null;
    var x = null;
    var y = null;

    iCount = Math.floor(iWidth / lineOptions.separation);

    for (i = 1; i <= iCount; i++) {
        x = (i * lineOptions.separation);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, iHeight);
        ctx.stroke();
    }

    iCount = Math.floor(iHeight / lineOptions.separation);

    for (i = 1; i <= iCount; i++) {
        y = (i * lineOptions.separation);
        ctx.moveTo(0, y);
        ctx.lineTo(iWidth, y);
        ctx.stroke();
    }

    ctx.closePath();
    return;
}

function shiftXToGridOrigin(x){
    return (x + ((document.getElementById("cnv").width)/2));
}

function shiftYToGridOrigin(z){
    return (z + ((document.getElementById("cnv").height)/2));
}

io = io.connect()

function updateCanvasWithSensors(){
    var cSensors = document.getElementById("cnvSensors");
    var ctxSensors = cSensors.getContext("2d");
    ctxSensors.clearRect(0, 0, cSensors.width, cSensors.height);
    io.emit('getSensorsFromServer', {}, function(data){
        for(var key in data){
            if(data.hasOwnProperty(key)){
                var sensorX = 0; //get this from sensor list later on
                var sensorY = 0; //get this from sensor list later on
                var sensorRotationAngle = 0; //get this from sensor list later on
                var sensorFOV = data[key].FOV; //get this from sensor list later on

                //// radius value should be taken from sensor
                var radius = data[key].rangeInMM/1000*pixelsPerMeter; //how long are the view lines? in pixels...


                var positionX = shiftXToGridOrigin(sensorX);
                var positionY = shiftXToGridOrigin(sensorY);
                var startAngle = (90-(sensorFOV/2))*Math.PI/180;//0.75;    // 90 as the Z orientation of sensor
                var endAngle = (90+(sensorFOV/2))*Math.PI/180;
                var antiClockwise = false;
                ctxSensors.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctxSensors.beginPath();
                ctxSensors.arc(positionX, positionY, radius, startAngle, endAngle, antiClockwise);
                ctxSensors.lineTo(positionX, positionY);
                ctxSensors.closePath();

                ctxSensors.fill();

                //draw circle for sensor on visualizer
                ctxSensors.beginPath();

                ctxSensors.arc(shiftXToGridOrigin(sensorX), shiftYToGridOrigin(sensorY),30,Math.PI,false);
                ctxSensors.closePath();
                ctxSensors.lineWidth = 1;
                ctxSensors.fillStyle = '#3370d4';
                ctxSensors.fill();
                ctxSensors.strokeStyle = '#292929';
                ctxSensors.stroke();

                ctxSensors.font = "20px Arial";
                ctxSensors.fillStyle = '#ffffff';
                ctxSensors.fillText('K'+Object.keys(data).indexOf(key),shiftXToGridOrigin(sensorX)-12,shiftYToGridOrigin(sensorY)-5);
            }
        }
    });
}

function updateCanvasWithPeople(){
    io.emit('getPeopleFromServer', {}, function(data){
        //draw kinect position (0,0) for single kinect
        var c = document.getElementById("cnv");
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        for(var key in data){
            if(data.hasOwnProperty(key)){
                var xInMeters = data[key].Location.X*majorGridLineWidth;
                var yInMeters = data[key].Location.Y*majorGridLineWidth;
                var zInMeters = data[key].Location.Z*majorGridLineWidth;
                ctx.fillStyle = "#c82124"; //red
                ctx.beginPath();
                ctx.arc(shiftXToGridOrigin(xInMeters),shiftYToGridOrigin(zInMeters),10,0,2*Math.PI);
                ctx.strokeStyle = "rgba(200, 0, 0, 0.8)";
                ctx.fill();
                ctx.fillStyle = "#ffffff"; //white
                ctx.font = "20px Arial";
                ctx.fillText(data[key].uniquePersonID,shiftXToGridOrigin(xInMeters)-5,shiftYToGridOrigin(zInMeters)+7);
            }
        }
    });
}

function printPersonID(ID)
{
    var htmlString= "";
    htmlString += '<table>';
    for(var key in ID){
        if(ID.hasOwnProperty(key)){
            htmlString += '<tr><td>' + key + '</td><td>'+ID[key] +'</td></tr>';
        }
    }
    htmlString += '</table>';
    return htmlString;
}
function updateContentWithObjects(){

    io.emit('getClientsFromServer', {}, function(data){
        var htmlString = ""
        for(var key in data){
            if(data.hasOwnProperty(key)){
                htmlString += ('<tr>' +
                    '<td>' + data[key].clientType + '</td>' +
                    '<td>' + data[key].socketID + '</td>' +
                    '</tr>')
            }
        }
        $('#clients').html('<legend>Clients</legend><table id="client_table"><tr>' +
            '<th>Type</td>' +
            '<th>socketID</td>' +
            '</tr>' + htmlString + '</table>')
    });

    io.emit('getSensorsFromServer', {}, function(data){
        var htmlString = ""
        for(var key in data){
            if(data.hasOwnProperty(key)){
                htmlString += ('<tr>' +
                    '<td>' + data[key].sensorType + '</td>' +
                    '<td>' + data[key].socketID + '</td>' +
                    '<td>' + data[key].FOV + '</td>' +
                    '<td>' + data[key].isCalibrated + '</td>' +
                    '</tr>')
            }
        };
        $('#sensors').html('<legend>Sensors</legend><table style="width:100%"><tr>' +
            '<th>Type</th>' +
            '<th>socketID</th>' +
            '<th>FOV</th>' +
            '<th>Calibrated</th>' +
            '</tr>' + htmlString + '</table>')
    });

    io.emit('getPeopleFromServer', {}, function(data){
        var htmlString = ""
        for(var key in data){
            if(data.hasOwnProperty(key)){
                if(!jQuery.isEmptyObject(data[key].ID)){
                    htmlString += ('<tr>' +
                        '<td>'+data[key].uniquePersonID//JSON.stringify(person.ID)
                        +'</td>' +
                        '<td>' +
                        '('+Math.round(data[key].Location.X*ROUND_RATIO)/ROUND_RATIO+', '
                        +Math.round(data[key].Location.Y*ROUND_RATIO)/ROUND_RATIO+', '
                        +Math.round(data[key].Location.Z*ROUND_RATIO)/ROUND_RATIO+')'
                        + //JSON.stringify(person.Location)
                        '<td>' + data[key].PairingState + '</td>' +
                        '<td>' + data[key].OwnedDeviceID + '</td>' +
                        '<td>' + data[key].Orientation + '</td>' +
                        '<td>' + Math.round(data[key].orientationToKinect*ROUND_RATIO)/ROUND_RATIO + '</td>' +
                        '<td>' + Math.round(data[key].distanceToKinect*ROUND_RATIO)/ROUND_RATIO + '</td>' +
                        '</tr>')
                }
            }
        }

        $('#people').html('<legend>People</legend><table style="width:100%"><tr>' +
            '<th style="width:100px">uniquePersonID</th>' +
            '<th>Location</th>' +
            '<th style="width:100px">Pairing State</th>' +
            '<th style="width:100px">Paired Device</th>' +
            '<th style="width:100px">Orientation</th>' +
            //'<th style="width:100px">Orientation to Sensor</th>' +
            //'<th style="width:100px">Distance to Sensor</th>' +
            '</tr>' + htmlString + '</table>')
    });


    function firstKey(obj) {
        var first;

        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                //console.log(i);
                return i;
                break;
            }
        }
        //return first;
    }

    io.emit('getPeopleFromServer',{},function(data){
        unpaired_people = {};
        for(var key in data){
            if(data[key].PairingState == 'unpaired'){
                unpaired_people[key] = data[key];
                //unpaired_people.push({index:key,personID:firstKey(data[key].ID)});//data[key].ID);
            }
        }
    });

    io.emit('getDevicesWithSelection', {additionalInfo:{selection: "all"}}, function(data){
        var htmlString= "";

        function pairingInfo(state){
            var return_html ="";
            if(state == 'unpaired'){

                for(var key in unpaired_people){
                    if(unpaired_people.hasOwnProperty(key)){
                        return_html+= '<span class="get_unpaired_people">'+ unpaired_people[key].uniquePersonID + '</span>';
                    }
                }
                return return_html;
            }else{
                return state;
            }
        }

        for(var key in data){
            uniqueDeviceIDToSocketID[data[key].uniqueDeviceID] = key;
            if(data.hasOwnProperty(key)){
                htmlString+='<tr><td>' +data[key].uniqueDeviceID+'</td>'+
                    '<td>('+data[key].Location.X+', '+data[key].Location.Y+', '+data[key].Location.Z+')</td>'+
                    '<td>'+Math.round(data[key].Orientation*ROUND_RATIO)/ROUND_RATIO+'</td>' +'<td>'+pairingInfo(data[key].PairingState)+'</td>'+
                    '<td>'+data[key].OwnerID+'</td>'+
                    '</tr>'
            }
        }

        $('#devices').html('<legend>Devices</legend>' +
            '<table id = "device_table">' +
            '<tr><th>uniqueDeviceID</th><th>Location</th> <th>Orientation</th>'+
            '<th>Pairing State</th>'+
            '<th>OwnerID</th>'+
            '</tr>'+
            '' +htmlString+
            '</table>'); /*appending the data on the page using Jquery */

    });
}

io.on("webMessageEvent",function(message){
    $('.status').html('GOT MESSAGE');
    $('.status').append('<div >'+JSON.stringify(message)+'</div>'); /*appending the data on the page using Jquery */
});
io.on("connect", function(){
    io.emit("registerWebClient", {});
});

io.on("refreshWebClientSensors", function(){
    updateCanvasWithSensors();
});

$(function(){
    $('#getPoints').click(function(){ /*listening to the button click using Jquery listener*/
        io.emit('calibrateSensors', {}, function(){
            //$('#status').html('');
            //$('#status').append('<div >'+data+'</div>'); /*appending the data on the page using Jquery */
        });
    });
});
io.emit("registerWebClient", {});
setInterval(function() {updateCanvasWithPeople(); }, 200); //poll server for people list and display on canvas
setInterval(function() {updateContentWithObjects(); }, 1000); //poll server for sensors, people, and devices and display to the side




