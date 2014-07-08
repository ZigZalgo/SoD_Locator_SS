var minorGridLineWidth = 10;
var majorGridLineWidth = 50;
var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
var pixelsPerMeter = majorGridLineWidth;
var ROUND_RATIO  = 10;
var unpaired_people = {};
var uniqueDeviceIDToSocketID = {}

io = io.connect()


 /*
 * Show status on the status log
 *
* */
function showRedStatus(status){
    $('.status').html("<span class='red_status'>"+status+"</span>");
    $('.red_status').fadeIn(600);
}

function showGreenStatus(status){
    $('.status').html("<span class='green_status'>"+status+"</span>");
    $('.green_status').fadeIn(600);
}

function showNormalStatus(status){
    $('.status').html("<span class='normal_status'>"+status+"</span>");
    $('.normal_status').fadeIn(600);
}

/*
* Visualization
*
* */
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


     var color = '1e1e1e';
    drawCoordinate(cnv,color,50,50,150);

    return;
}


/*
 * Draw Coordinates.
 *
 * */
function drawCoordinate(cnv,color,startingX,startingY,length){
    var gridWidth = cnv.width;
    var gridHeight = cnv.height;
    var context =   cnv.getContext('2d');;
    context.beginPath();
    context.lineWidth="2";
    context.strokeStyle = color;
    context.fillstyle= color;
    context.moveTo(startingX,startingY);
    context.lineTo(startingX+length,startingY);
    context.lineTo(startingX+length-15,startingY-5);
    //context.arcTo(gridWidth-175,25,gridWidth-175+15,35,);
    context.lineTo(startingX+length,startingY);
    context.lineTo(startingX+length-15,startingY+5);
    //context.lineTo(gridWidth-175+15,20);
    context.stroke();

    context.fillStyle = color;
    context.font = "bold 15px Arial";
    context.fillText("+X", startingX+length-10,startingY+20);


    context.fillRect(startingX+pixelsPerMeter-2,startingY-5,3,10);
    context.fillStyle = color;
    context.font = "bold 12px Arial";
    context.fillText('1m', startingX+50,startingY+20);


    context.beginPath();
    context.lineWidth="2";
    context.strokeStyle = color;
    context.fillstyle= color;
    context.moveTo(startingX,startingY);
    context.lineTo(startingX,startingY+length);
    context.lineTo(startingX-5,startingY+length-10);
    context.lineTo(startingX,startingY+length);
    context.lineTo(startingX+5,startingY+length-10);
    context.stroke();



    context.fillRect(startingX-5,startingY+pixelsPerMeter-2,10,3);
    context.fillStyle = color;
    context.font = "bold 12px Arial";
    context.fillText('1m', startingX+10,startingY+50);

    context.fillStyle = color;
    context.font = "bold 15px Arial";
    context.fillText("+Z", startingX+10,startingY+length-10);
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

/*
* Draw view for sensor
* */
function drawView(context, X, Y, rangeInMM, fillStyle,orientation, FOV){
    var radius = rangeInMM/1000*pixelsPerMeter; //how long are the view lines? in pixels...
    var positionX = shiftXToGridOrigin(X);
    var positionY = shiftXToGridOrigin(Y);
    var actualOrientation = 360 - orientation;
    var startAngle = (actualOrientation+(FOV/2))*Math.PI/180;
    var endAngle = (actualOrientation-(FOV/2))*Math.PI/180;
    var antiClockwise = true;
    context.fillStyle = fillStyle;
    context.beginPath();
    context.arc(positionX, positionY, radius, startAngle, endAngle, antiClockwise);
    context.lineTo(positionX, positionY);
    context.closePath();
    context.fill();
}
// draw the sensor on the screen
function drawSensor(context,X,Y,index,angle,FOV){
    var sensorX = X; //get this from sensor list later on
    var sensorY = Y; //get this from sensor list later on
    //console.log("X : "+sensorX+"Y: "+sensorY)
    //draw circle for sensor on visualizer
    var angleForDrawing = 270 - angle;
    context.beginPath();
    context.arc(shiftXToGridOrigin(sensorX), shiftYToGridOrigin(sensorY),248/1000*pixelsPerMeter,angleForDrawing*DEGREES_TO_RADIANS,angleForDrawing*DEGREES_TO_RADIANS+Math.PI,true);
    context.closePath();
    context.lineWidth = 1;
    context.fillStyle = '#3370d4';
    context.fill();
    context.strokeStyle = '#292929';
    context.stroke();
    context.font = "14px Arial";
    context.fillStyle = '#3370d4';
    context.fillText('K'+index,shiftXToGridOrigin(sensorX)+10,shiftYToGridOrigin(sensorY)-15);
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


/**
 * Draw Stationary Device
 *
 * */
function drawStationaryDevice(context, X, Z, width, height, ID, orientation, FOV){
    var xInMeters = X*pixelsPerMeter;
    var zInMeters = Z*pixelsPerMeter;
    context.beginPath();
    context.rect(shiftXToGridOrigin(xInMeters) - (width/2), shiftYToGridOrigin(zInMeters) - (height/2), width, height);
    context.fillStyle = "rgba(0, 255, 0, 0.7)";
    context.fill();

    function getDeviceOrientation(deviceX,deviceZ){
        var angleTowardsKinect = Math.atan2(deviceX,deviceZ);
        var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
        return returnDegree;
    }

    if(orientation != undefined)
    {
        drawView(context, xInMeters, zInMeters, 2000, "rgba(0, 200, 0, 0.4)",orientation + getDeviceOrientation(X,Z) + 90, FOV);
    }

    context.fillStyle = "rgba(0, 255, 0, 1.0)"; //
    context.font = "18px Arial";
    context.fillText(ID,shiftXToGridOrigin(xInMeters)+(width/2),shiftYToGridOrigin(zInMeters)-(height/2));
}




/**
 * Stationary Only updates position when this is called
 *
 * */
function refreshStationaryLayer(){
    var c = document.getElementById("cnvStationary");
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    io.emit('getDevicesWithSelection', {selection: ["all"]}, function(data){
        for(var key in data){
            if(data.hasOwnProperty(key)){
                if(data[key].stationary == true && data[key].location.X != null && data[key].location.Y != null && data[key].location.Z != null){
                    //console.log("X:" + data[key].location.X)
                    //console.log("Y:" + data[key].location.Y)
                    //console.log("Z:" + data[key].location.Z)
                    drawStationaryDevice(document.getElementById('cnvStationary').getContext('2d'),
                        data[key].location.X, data[key].location.Z, data[key].width/1000*pixelsPerMeter,
                        data[key].height/1000*pixelsPerMeter, data[key].uniqueDeviceID, data[key].orientation, data[key].FOV);
                }
            }
        }
    });
}


/**
 *  Update the contents in the canvas and overview section.
 * */
function updateContentWithObjects(){
    /*
    * Update the clients
    *
    * */
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




   /**
    *
    * Update everything about sensor
    * */
    io.emit('getSensorsFromServer', {}, function(data){
        var htmlString = ""
        var cSensors = document.getElementById("cnvSensors");
        var ctxSensors = cSensors.getContext("2d");
        ctxSensors.clearRect(0, 0, cSensors.width, cSensors.height);
        for(var key in data){
            if(data.hasOwnProperty(key)){
                //console.log("SensorKey: "+key+"\tcalibration: "+JSON.stringify(data[key].calibration));
                //console.log("ySpaceTransition: "+JSON.stringify(data[key].calibration.ySpaceTransition));
                var sensorX = 0; //get this from sensor list later on
                var sensorY=  0;
                var angle = 270;
                if(data[key].calibration["Rotation"]!=0&&data[key].calibration["Rotation"]!=null){
                    sensorX += (data[key].calibration["xSpaceTransition"]*pixelsPerMeter/1000); //changed from += to -= probably because sensor see mirror image?
                    sensorY += (data[key].calibration["ySpaceTransition"]*pixelsPerMeter/1000);
                    angle += data[key].calibration["Rotation"];
                }
                //console.log("X: "+sensorX+"  Y: "+sensorY+"  Angle: "+angle);
                //console.log("angleAfterCalibration: "+ data[key].calibration["Rotation"]);
                //console.log("TransformX : "+ sensorX+data[key].calibration["TransformX"]);
                //console.log("sensorYAfterCalibration: "+ data[key].calibration["Rotation"]);
                drawSensor(ctxSensors,sensorX,sensorY,Object.keys(data).indexOf(key),angle, data[key].FOV);
                var gradientVector = {X:0,Z:data[key].rangeInMM};
                // get the vector from sensor point to the end point ot gradient
                var rotatedGradientVector = matrixTransformation(gradientVector,data[key].calibration["Rotation"]);
                //console.log('rotated: ' + JSON.stringify(rotatedGradientVector));
                //console.log('sensorX: ' + sensorX + '\tsensorY: ' + sensorY);
                // get the end point of the gradient
                var endPointOfGradient = {X:shiftXToGridOrigin((rotatedGradientVector.X)/1000*pixelsPerMeter+sensorX),Z:shiftYToGridOrigin((rotatedGradientVector.Z)/1000*pixelsPerMeter+sensorY)}          // move the point to where it belongs in the canvas
                //console.log('end point : ' + JSON.stringify(endPointOfGradient));
                var grd = ctxSensors.createLinearGradient(shiftXToGridOrigin(sensorX), shiftYToGridOrigin(sensorY), endPointOfGradient.X,endPointOfGradient.Z)//shiftXToGridOrigin(sensorX), shiftYToGridOrigin(sensorY) + (data[key].rangeInMM)/1000*pixelsPerMeter);
                grd.addColorStop(0, 'rgba(51, 112, 212, 0.8)');
                grd.addColorStop(1, 'rgba(51, 112, 212, 0.0)');
                drawView(ctxSensors, sensorX, sensorY, data[key].rangeInMM, grd,angle, data[key].FOV);
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


    /**
     *  Update everything about the person
     *
     * */
    function getPersonOrientation(personX,personZ){
        var angleTowardsKinect = Math.atan2(personX,personZ);
        var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
        return returnDegree;
    }
    io.emit('getPeopleFromServer', {}, function(data){
        var htmlString = ""
        var c = document.getElementById("cnv");
        var ctx = c.getContext("2d");
        var ctx1 = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        for(var key in data){
            if(data.hasOwnProperty(key)){
                var xInMeters = data[key].location.X*majorGridLineWidth;
                    var yInMeters = data[key].location.Y*majorGridLineWidth;
                    var zInMeters = data[key].location.Z*majorGridLineWidth;
                    ctx.beginPath();
                    ctx.fillStyle = "#c82124"; //red
                    ctx.arc(shiftXToGridOrigin(xInMeters),shiftYToGridOrigin(zInMeters),10,0,2*Math.PI);
                    ctx.strokeStyle = "rgba(200, 0, 0, 0.8)";
                    ctx.fill();
                    if(data[key].pairingState == 'paired'){
                        ctx.strokeStyle = "#2cd72A";
                        ctx.rect(shiftXToGridOrigin(xInMeters)-10,shiftYToGridOrigin(zInMeters)-10,20,20);
                        ctx.stroke();
                    }

                if(data[key].orientation != null){
                    var orientationToSensor = getPersonOrientation(data[key].location.X,data[key].location.Z);
                    //console.log(" personOrientationToSensor: " + orientationToSensor);
                    //console.log("device orientation: "+data[key].orientation+" personOrientationToSensor: " + orientationToSensor + " Sum up: " + (data[key].orientation+orientationToSensor+90));
                    drawView(ctx, xInMeters, zInMeters, 1000, "#2cd72A",(data[key].orientation+orientationToSensor+90), 30);
                }
                    ctx.fillStyle = "#c82124"; //red
                    ctx.font = "18px Arial";
                    ctx.fillText(data[key].uniquePersonID,shiftXToGridOrigin(xInMeters)+5,shiftYToGridOrigin(zInMeters)-5);

                    if(!jQuery.isEmptyObject(data[key].ID)){
                        htmlString += ('<tr>' +
                            '<td>'+data[key].uniquePersonID//JSON.stringify(person.ID)
                            +'</td>' +
                            '<td>' +
                            '('+Math.round(data[key].location.X*ROUND_RATIO)/ROUND_RATIO+', '
                            +Math.round(data[key].location.Y*ROUND_RATIO)/ROUND_RATIO+', '
                            +data[key].location.Z+')'//Math.round(data[key].location.Z*ROUND_RATIO)/ROUND_RATIO+')'
                            + //JSON.stringify(person.location)
                            '<td>' + data[key].pairingState + '</td>' +
                            '<td>' + data[key].ownedDeviceID + '</td>' +
                            '<td>' + data[key].orientation + '</td>' +
                            '</tr>')
                }
            }
        }

        $('#people').html('<legend>People</legend><table style="width:100%"><tr>' +
            '<th style="width:100px">uniquePersonID</th>' +
            '<th>location</th>' +
            '<th style="width:100px">Pairing State</th>' +
            '<th style="width:100px">Paired Device</th>' +
            '<th style="width:100px">orientation</th>' +
            //'<th style="width:100px">orientation to Sensor</th>' +
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
    }

    io.emit('getPeopleFromServer',{},function(data){
        unpaired_people = {};
        for(var key in data){
            if(data[key].pairingState == 'unpaired'){
                unpaired_people[key] = data[key];
                //unpaired_people.push({index:key,personID:firstKey(data[key].ID)});//data[key].ID);
            }
        }
    });

    io.emit('getDevicesWithSelection', {selection: ["all"]}, function(data){
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
                //console.log('device ID '+data[key].uniqueDeviceID+'IP: '+data[key].deviceIP);
                if(!data[key].stationary){
                    htmlString+='<tr><td>' +data[key].uniqueDeviceID+'</td>'+ '<td>' +data[key].name +'</td>'+
                        '<td>('+data[key].location.X+', '+data[key].location.Y+', '+data[key].location.Z+')</td>'+
                        '<td>'+Math.round(data[key].orientation*ROUND_RATIO)/ROUND_RATIO+'</td>' +'<td>'+pairingInfo(data[key].pairingState)+'</td>'+
                        '<td>'+data[key].ownerID+'</td>'+
                        '</tr>'
                }
                else{
                    htmlString+='<tr><td>' +data[key].uniqueDeviceID+'</td>'+ '<td>' +data[key].name +'</td>'+
                        '<td>('+data[key].location.X+', '+data[key].location.Y+', '+data[key].location.Z+')</td>'+
                        '<td>'+Math.round(data[key].orientation*ROUND_RATIO)/ROUND_RATIO+'</td>' +'<td>disabled</td>'+
                        '<td>'+data[key].ownerID+'</td>'+
                        '</tr>'
                }


            }
        }

        $('#devices').html('<legend>Devices</legend>' +
            '<table id = "device_table">' +
            '<tr><th>uniqueDeviceID</th><th>Name</th><th>location</th> <th>orientation</th>'+
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

io.on("refreshStationaryLayer",function(){
    refreshStationaryLayer();
});

io.on("connect", function(){
    io.emit("registerWebClient", {});
    refreshStationaryLayer();
});
/*
io.on("refreshWebClientSensors", function(){
    updateCanvasWithSensors();
});
*/

$(function(){
    $('#getPoints').click(function(){ /*listening to the button click using Jquery listener*/
        io.emit('calibrateSensors', {}, function(){
            //$('#status').html('');
            //$('#status').append('<div >'+data+'</div>'); /*appending the data on the page using Jquery */
        });
    });
});

/*
* Matrix CLOCKWISE transformation ,
* given point(x,y) and rotation angle A, return (x',y') after transformation.
* @param:
* personLocation   -- location contains x,y,z value of a point, we are going to use x,z since
* we are dealing with 2D-dimension
* angle            -- Rotation angle
* @return:
* returnLocation   -- location after transformation
* */
var matrixTransformation = function(personLocation,angle){
    var returnLocation = {X:0,Y:0,Z:0};
    var returnX = personLocation.X * Math.cos(angle * DEGREES_TO_RADIANS) + personLocation.Z * Math.sin(angle * DEGREES_TO_RADIANS);
    var returnZ = personLocation.Z * Math.cos(angle * DEGREES_TO_RADIANS) - (personLocation.X * Math.sin(angle * DEGREES_TO_RADIANS));
    returnLocation.X = Math.round(returnX*this.ROUND_RATIO)/this.ROUND_RATIO;
    returnLocation.Z = Math.round(returnZ*this.ROUND_RATIO)/this.ROUND_RATIO;
    return returnLocation; // for testing
}


io.emit("registerWebClient", {});
//setInterval(function() {updateCanvasWithPeople(); }, 200); //poll server for people list and display on canvas
setInterval(function() {updateContentWithObjects(); }, 200); //poll server for sensors, people, and devices and display to the side