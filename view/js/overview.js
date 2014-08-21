var minorGridLineWidth;
var majorGridLineWidth;
var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
var pixelsPerMeter;
var ROUND_RATIO  = 10;
var unpaired_people = {};
var uniqueDeviceIDToSocketID = {}

io = io.connect()


/*
 * Show status on the status log
 *
 * */
function showRedStatus(status){
    $('.status').empty();
    $('.status').html("<div class='red_status'>"+status+"</div>");
    $('.red_status').fadeIn('200');
}

function showGreenStatus(status){
    $('.status').empty();
    $('.status').html("<div class='green_status'>"+status+"</div>");
    $('.green_status').fadeIn('200');
}

function showNormalStatus(status){
    $('.status').empty();
    $('.status').html("<div class='normal_status'>"+status+"</div>");
    $('.normal_status').fadeIn('200');
}


/*
 * Visualization
 *
 * */
function drawGrid() {
    $(location).attr('href');
    //pure javascript
    var pathname = window.location.pathname;
    // if the url is at mobile page
    if(pathname.slice(-6)=='mobile'){
        //var screenWidth=Math.min($(window).height(),$(window).width()); // take the minimum of max value
        /*var canvasHTML = '<canvas id="cnv" width="'+screenWidth+'" height="'+screenWidth+'" ></canvas>'+
            '<canvas id="cnvStationary" width="'+screenWidth+'" height="'+screenWidth+'" ></canvas>'+
            '<canvas id="cnvSensors" width="'+screenWidth+'" height="'+screenWidth+'"></canvas>'+
            '<canvas id="cnvBG" width="'+screenWidth+'" height="'+screenWidth+'"></canvas>';*/



        console.log('screenwidth : ' +window.innerWidth);
       var  screenWidth = Math.min(window.innerWidth/2,800);
        var canvasHTML = '<canvas id="cnv" width="'+screenWidth+'" height="'+screenWidth+'" ></canvas>'+
            '<canvas id="cnvStationary" width="'+screenWidth+'" height="'+screenWidth+'" ></canvas>'+
            '<canvas id="cnvSensors" width="'+screenWidth+'" height="'+screenWidth+'"></canvas>'+
            '<canvas id="cnvBG" width="'+screenWidth+'" height="'+screenWidth+'"></canvas>';

        $('section#canvas').html(canvasHTML);
        minorGridLineWidth = document.getElementById("cnv").width/80;
        majorGridLineWidth = document.getElementById("cnv").width/16;
        pixelsPerMeter = majorGridLineWidth;
    }else{
        minorGridLineWidth = document.getElementById("cnv").width/80;
        majorGridLineWidth = document.getElementById("cnv").width/16;
        pixelsPerMeter = majorGridLineWidth;
    }
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
    drawCoordinate(cnv,color,majorGridLineWidth,majorGridLineWidth,majorGridLineWidth*3);
    return;
}

$(window).resize(function(){
    console.log('resize is hard with new width:' + window.innerWidth);
    resizeCanvas();

});

function resizeCanvas(){
    var canvas = $('#cnv,#cnvStationary,#cnvSensors,#cnvBG');
    var newWidth = Math.min(window.innerWidth/2,800);
    canvas.width(newWidth);
    canvas.height(newWidth);
    //resize the the math
    minorGridLineWidth = document.getElementById("cnv").width/80;
    majorGridLineWidth = document.getElementById("cnv").width/16;
    pixelsPerMeter = majorGridLineWidth;
    console.log('cnv new width:' + $('#cnv').width()+'\tcnvStationary width: '+$('#cnvStationary').width() );
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
//    /console.log("drawing sensor  ->  X : "+sensorX+"Y: "+sensorY)
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
    context.font = minorGridLineWidth*2+'px Arial';
    context.fillStyle = '#3370d4';
    context.fillText('K'+index,shiftXToGridOrigin(sensorX)+minorGridLineWidth,shiftYToGridOrigin(sensorY)-minorGridLineWidth*1.5);
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



/*
 * Function that check if a string is empty
 * */
function isEmpty(str) {
    return (!str || 0 === str.length);
}
/*
 * Pass in the object and return a link if it contains a data
 * */
function getDataPath(object) {
    var returnHTML = '';
    if(!jQuery.isEmptyObject(object.data)){
        for(var key in object.data){
            //console.log(JSON.stringify(object.data[key]));
            returnHTML += '<a class="dataButton"  target="_blank" href='+object.data[key].dataPath+'>data file</a>';
            //console.log(Object.keys(object.data).length);
        }
    }else{
        returnHTML = 'Empty';
    }
    return returnHTML;
}





/**
 * Draw Stationary Device
 *
 * */
function drawStationaryDevice(ID,originLocation,X, Z, width, height, ID, orientation, FOV,layer){

    console.log('width: '+ width + ' && height: ' + height);
   /* var stationaryDevice = new Kinetic.Rect({
        x: shiftXToGridOrigin(X*pixelsPerMeter) - (width/2),
        y: shiftXToGridOrigin(Z*pixelsPerMeter) - (height/2),
        width: width,
        height: height,
        fill: 'rgba(0, 255, 0, 0.7)',
        //stroke: 'black',
        //strokeWidth: 4,
        draggable: true
    });*/

    var stationaryDevice = new Kinetic.Shape({
        sceneFunc: function(context) {
            //context.fillStyle = "rgba(0, 255, 0, 0.7)";
            //context.fill();
            context.beginPath();

            function getDeviceOrientation(deviceX,deviceZ){
                var angleTowardsKinect = Math.atan2(deviceX,deviceZ);
                var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
                return returnDegree;
            }
            if(orientation != undefined)
            {
                drawView(context, X*pixelsPerMeter, Z*pixelsPerMeter, 2000, "#B8B8B8",orientation + getDeviceOrientation(X,Z) + 90, FOV);
                //drawView(context, X*pixelsPerMeter, Z*pixelsPerMeter, 2000, "rgba(0, 200, 0, 0.4)",orientation + getDeviceOrientation(X,Z) + 90, FOV);
            }

            context.rect(shiftXToGridOrigin(X*pixelsPerMeter) - (width/2), shiftYToGridOrigin(Z*pixelsPerMeter) - (height/2), width, height);
            context.fillStrokeShape(this);

            //context.fillStyle = "rgba(0, 255, 0, 1.0)"; //
            //context.font = "18px Arial";
            context.fillText(ID,shiftXToGridOrigin(X*pixelsPerMeter)+(width/2),shiftYToGridOrigin(Z*pixelsPerMeter)-(height/2));
            context.fillStrokeShape(this);
        },
        fill: 'rgba(0, 255, 0, 1.0)',
        opacity: 0.3,
        //stroke: 'black',
        //strokeWidth: 4,
        draggable: true
    });

    stationaryDevice.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
        this.fill('#31CC00');
        this.stroke('black');
        this.strokeWidth('2');
        layer.draw();
    });
    stationaryDevice.on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.fill('rgba(0, 255, 0, 1.0)');
        this.stroke('');

        this.strokeWidth('0');
        this.opacity('0.3');
        layer.draw();
    });

    var directionVector = {X:0,Y:0,Z:0};
    var movedVector={X:0,Y:0,Z:0};
                                                    stationaryDevice.on('dragstart',function(){
        console.log('dragged ' + ID+' -> '+ this.getPosition().x/pixelsPerMeter+','+this.getPosition().y/pixelsPerMeter);
        movedVector = {X:this.getPosition().x/pixelsPerMeter,Y:0,Z:this.getPosition().y/pixelsPerMeter};

    });
    stationaryDevice.on('dragend',function(){
        console.log('dropped ' + ID +' -> '+ this.getPosition().x/pixelsPerMeter+','+this.getPosition().y/pixelsPerMeter);
        movedVector.X -= this.getPosition().x/pixelsPerMeter;
        movedVector.Z -= this.getPosition().y/pixelsPerMeter;
        directionVector.X += -(movedVector.X);
        directionVector.Z += -(movedVector.Z);
        if(Math.abs(movedVector.X)>=0.1|| Math.abs(movedVector.Z)>=0.1){
            console.log('directionVector : ' + JSON.stringify(directionVector));
            io.emit('updateObjectLocation',{ID:ID,newLocation:{X:originLocation.X+directionVector.X,Y:0,Z:originLocation.Z+directionVector.Z},objectType:'device'});
        }
    });
    layer.add(stationaryDevice);
}



/* The function draws one data within a dataPoint*/
function drawData(ctx,x,z,data){
    console.log('drawing data point X: ' + x + ' Y: ' + z + ' radius: ' + data.range);
    var radius = data.range * pixelsPerMeter;
    ctx.fillStyle = "#2CCC72";
    ctx.beginPath();
    ctx.arc(x, z, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.fillStyle = "#4D4D4D";
    ctx.font = "bold 14px Consolas";
    ctx.fillText(data.ID, x + radius * 0.6, z - radius * 0.6);
}
/* */
function drawDataPoint(data,layer){
    var x = shiftXToGridOrigin(data.location.X * pixelsPerMeter);
    var z = shiftXToGridOrigin(data.location.Z * pixelsPerMeter);
    var dataPointGroup = new Kinetic.Group({
        x: x,
        y: z,
        rotation: 0,
        draggable:true
    });
    console.log(JSON.stringify(data));

    /*var circle = new Kinetic.Circle({
        x: x,
        y: z,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });*/

    //console.log('hello');
    var dropCircle = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius:data.dropRange*pixelsPerMeter,
        fill: '#C9C9C9',
        opacity:0.5
    });
    dataPointGroup.add(dropCircle);

    // datas in the for the dataPoints
    for(var key in data.data) {
        // anonymous function to induce scope
        (function() {
            var dataCircle = new Kinetic.Circle({
                x: 0,
                y: 0,
                radius:data.data[key].range*pixelsPerMeter,
                fill: '#8A8A8A',
                opacity:0.3
            });

            dataPointGroup.add(dataCircle);
        })();
    }

    var dataPointID = new Kinetic.Text({
        x: data.dropRange*pixelsPerMeter/2,
        y: -(data.dropRange*pixelsPerMeter/2),
        text: data.ID,
        fontSize: 15,
        fontFamily: 'Calibri',
        fill: 'black'
    });

    dataPointGroup.add(dataPointID);

    dataPointGroup.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
       //layer.draw();
    });
    dataPointGroup.on('mouseout', function() {
        document.body.style.cursor = 'default';
        //layer.draw();
    });

    var directionVector = {X:0,Y:0,Z:0};
    var movedVector={X:0,Y:0,Z:0};
    dataPointGroup.on('dragstart',function(){
        console.log('dragged ' + data.ID+' -> '+ this.getPosition().x/pixelsPerMeter+','+this.getPosition().y/pixelsPerMeter);
        movedVector = {X:this.getPosition().x/pixelsPerMeter,Y:0,Z:this.getPosition().y/pixelsPerMeter};

    });
    dataPointGroup.on('dragend',function(){
        console.log('dropped ' + data.ID +' -> '+ this.getPosition().x/pixelsPerMeter+','+this.getPosition().y/pixelsPerMeter);
        movedVector.X -= this.getPosition().x/pixelsPerMeter;
        movedVector.Z -= this.getPosition().y/pixelsPerMeter;
        directionVector.X += -(movedVector.X);
        directionVector.Z += -(movedVector.Z);
        if(Math.abs(movedVector.X)>=0.1|| Math.abs(movedVector.Z)>=0.1){
            console.log('directionVector : ' + JSON.stringify(directionVector));
            io.emit('updateObjectLocation',{ID:data.ID,newLocation:{X:data.location.X+directionVector.X,Y:0,Z:data.location.Z+directionVector.Z},objectType:'dataPoint'},function(){
                // refresh the layer after ev
                refreshStationaryLayer();
            });
        }
    });


    //dataPointGroup.add(circle);

   /* var dataDropRange = new Kinetic.Shape({
        sceneFunc: function(ctx){
            //console.log(ctx);
            ctx.beginPath();
            ctx.arc(x, z, data.dropRange * pixelsPerMeter, 0, 2 * Math.PI,false);
            ctx.fillStrokeShape(this);
        },
        fill: '#CCC',
        opacity: 0.5,
        draggable: true
    })
    dataPointGroup.add(dataDropRange);
    */
    /*dataPointGroup.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
        this.fill('#31CC00');
        this.stroke('black');
        this.strokeWidth('2');
        layer.draw();
    });
    dataPointGroup.on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.fill('rgba(0, 255, 0, 1.0)');
        this.stroke('');
        this.strokeWidth('0');
        //this.opacity('rgba(0, 255, 0, 1.0)');
        layer.draw();
    });
*/

    //radius = data[key].range * pixelsPerMeter
    //console.log('drawing: '+ data.ID);



    //ctx.globalAlpha = 0.3;
    /*for(var dataKey in data.data){
        if(data.data.hasOwnProperty(dataKey)) {
            //console.log(JSON.stringify(data[key].data[dataKey].range));
            drawData(ctx, x, z, data.data[dataKey])
        }
    }*/
    layer.add(dataPointGroup);
}
/**
 * Stationary Only updates position when this is called
 *
 * */
function refreshStationaryLayer() {
   // var c = document.getElementById("cnvStationary");

    console.log('-> Alright , lets do this!');

    var stage = new Kinetic.Stage({
        container: 'cnvStationary',
        width: 800,
        height: 800
    });
    var layer = new Kinetic.Layer();

    io.emit('getDevicesWithSelection', {selection: ["all"]}, function (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key].stationary == true && data[key].location.X != null && data[key].location.Y != null && data[key].location.Z != null) {
                    //console.log("X:" + data[key].location.X)
                    //console.log("Y:" + data[key].location.Y)
                    //console.log("Z:" + data[key].location.Z)
                    drawStationaryDevice(data[key].uniqueDeviceID,data[key].location,
                        data[key].location.X, data[key].location.Z, data[key].width / 1000 * pixelsPerMeter,
                            data[key].height / 1000 * pixelsPerMeter, data[key].uniqueDeviceID, data[key].orientation, data[key].FOV,layer)
                }
            }
        }
        stage.add(layer);
    });
    // drawing data points
    io.emit('getDataPointsWithSelection', {selection: 'all'}, function (data) {
        //var c = document.getElementById("cnv");
        //console.log(JSON.stringify(data));
        //var ctx = c.getContext("2d");
        var x, z, radius, htmlString = "";
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                drawDataPoint(data[key],layer);
                htmlString += '<tr ><td>' + data[key].ID + '</td><td>X:' + data[key].location.X.toFixed(3) + ' Y:' + data[key].location.Y + ' Z:' + data[key].location.Z.toFixed(3) + '</td>' +
                    '<td>' + getDataPath(data[key]) + '</td><td>' + data[key].dropRange + '</td>' + ' </tr>';
            }
        }
        stage.add(layer);

        //updateDataPointsInOverview(htmlString);
        $('#dataPoints').html('<legend>Data Points</legend><table style="width:100%"><tr>' +
            '<th style="">Data Point ID</th>' +
            '<th>location</th>' +
            '<th style="">dataPath</th>' +
            '<th style="">dropRange</th>' +
            '</tr>' + htmlString + '</table>')

    })




    /*
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    // Update dataPoitns on visualizer
    io.emit('getDataPointsWithSelection', {selection: 'all'}, function (data) {
        //var c = document.getElementById("cnv");
        //console.log(JSON.stringify(data));
        //var ctx = c.getContext("2d");
        var x, z, radius, htmlString = "";
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                x = shiftXToGridOrigin(data[key].location.X * pixelsPerMeter);
                z = shiftXToGridOrigin(data[key].location.Z * pixelsPerMeter);
                //radius = data[key].range * pixelsPerMeter
                console.log('drawing: '+ data[key].ID);
                radius = data[key].dropRange * pixelsPerMeter;
                console.log(radius);
                ctx.globalAlpha=0.4;
                ctx.fillStyle = "#CCC";
                ctx.beginPath();
                ctx.arc(x, z, radius, 0, 2 * Math.PI);
                ctx.fill();

                htmlString += '<tr ><td>' + data[key].ID + '</td><td>X:' + data[key].location.X + ' Y:' + data[key].location.Y + ' Z:' + data[key].location.Z + '</td>' +
                    '<td>' + getDataPath(data[key]) + '</td><td>' + data[key].dropRange + '</td>' + ' </tr>';
                //ctx.globalAlpha = 0.3;
                for(var dataKey in data[key].data){
                    if(data[key].data.hasOwnProperty(dataKey)) {
                        //console.log(JSON.stringify(data[key].data[dataKey].range));
                        drawDataPoint(ctx, x, z, data[key].data[dataKey])
                    }
                }
            }

        }
        //updateDataPointsInOverview(htmlString);
        $('#dataPoints').html('<legend>Data Points</legend><table style="width:100%"><tr>' +
            '<th style="">Data Point ID</th>' +
            '<th>location</th>' +
            '<th style="">dataPath</th>' +
            '<th style="">dropRange</th>' +
            '</tr>' + htmlString + '</table>')
    })
    */
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
                //console.log('->'  +shiftXToGridOrigin(sensorX)+'\t'+ shiftYToGridOrigin(sensorY)+'\t'+ endPointOfGradient.X+'\t'+endPointOfGradient.Z);
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

    function getDeviceNameByID(deviceID,ctx,xInMeters,zInMeters){
        var deviceNameString;
        io.emit('getDevicesWithSelection',{selection:['single'+deviceID]},function(data){
            if(Object.keys(data).length>=0){
                console.log('got device: '+data[Object.keys(data)].name.length);
                if(data[Object.keys(data)].name.length>=5){
                    deviceNameString = data[Object.keys(data)].name.substring(0, 4)+'...';
                }else{
                    deviceNameString = data[Object.keys(data)].name;
                }
                ctx.fillStyle = "#2cd72A"; //green
                ctx.font = "12px Arial";
                ctx.fillText(deviceNameString,shiftXToGridOrigin(xInMeters)+minorGridLineWidth,shiftYToGridOrigin(zInMeters)+1);
            }
        });

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
                ctx.arc(shiftXToGridOrigin(xInMeters),shiftYToGridOrigin(zInMeters),minorGridLineWidth,0,2*Math.PI);
                ctx.strokeStyle = "rgba(200, 0, 0, 0.8)";
                ctx.fill();
                if(data[key].pairingState == 'paired'){
                    ctx.strokeStyle = "#2cd72A";
                    ctx.rect(shiftXToGridOrigin(xInMeters)-minorGridLineWidth,shiftYToGridOrigin(zInMeters)-minorGridLineWidth,minorGridLineWidth*2,minorGridLineWidth*2);
                    ctx.stroke();
                    getDeviceNameByID(data[key].ownedDeviceID,ctx,xInMeters,zInMeters);
                }

                if(data[key].orientation != null){
                    var orientationToSensor = getPersonOrientation(data[key].location.X,data[key].location.Z);
                    //console.log(" personOrientationToSensor: " + orientationToSensor);
                    //console.log("device orientation: "+data[key].orientation+" personOrientationToSensor: " + orientationToSensor + " Sum up: " + (data[key].orientation+orientationToSensor+90));
                    drawView(ctx, xInMeters, zInMeters, 1000, "#2cd72A",(data[key].orientation+orientationToSensor+90), 30);
                    // Adding device name for paired person
                }
                ctx.fillStyle = "#c82124"; //red
                ctx.font = minorGridLineWidth*2+'px Arial';
                ctx.fillText(data[key].uniquePersonID,shiftXToGridOrigin(xInMeters)+minorGridLineWidth/2,shiftYToGridOrigin(zInMeters)-minorGridLineWidth/2);

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
                        '<td>'+getDataPath(data[key])+'</td>' +
                        '</tr>')
                }
            }
        }

        $('#people').html('<legend>People</legend><table style="width:100%"><tr>' +
            '<th >uniquePersonID</th>' +
            '<th>location</th>' +
            '<th >Pairing State</th>' +
            '<th >Paired Device</th>' +
            '<th >orientation</th>' +
            '<th >data</th>' +
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
                        '<td>('+data[key].location.X.toFixed(3)+', '+data[key].location.Y+', '+data[key].location.Z.toFixed(3)+')</td>'+
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
$(document).ready(function(){
    setInterval(function() {updateContentWithObjects(); }, 200); //poll server for people list and display on canvas
})
