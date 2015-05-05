var minorGridLineWidth;
var majorGridLineWidth;
var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
var pixelsPerMeter;
var ROUND_RATIO  = 10;
var unpaired_people = {};
var uniqueDeviceIDToSocketID = {}

io = io.connect();


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



        //console.log('screenwidth : ' +window.innerWidth);
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
        if(window.innerWidth==1920){
            showGreenStatus('Welcome to SoD! \t Drawing grid for window width: '+window.innerWidth+'px');
        }else{
            showGreenStatus('Welcome to SoD! \t Drawing grid for window width: '+window.innerWidth+'px\n' + '\n1920*1080' +
                ' is the optimal screen width for SOD');
        }


        minorGridLineWidth = 800/80;//document.getElementById("cnv").width/80;
        majorGridLineWidth = 800/16;//document.getElementById("cnv").width/16;
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


    var color = '#1e1e1e';
    drawCoordinate(cnv,color,majorGridLineWidth,majorGridLineWidth,majorGridLineWidth*3);
    return;
}

$(window).resize(function(){
    console.log('resize is hard with new width:' + window.innerWidth);
    //resizeCanvas();

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
    var context =   cnv.getContext('2d');
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
    //console.log(orientation);
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

//function takes room information and stage&layer from kineticJS
function drawRoom(roomInfo,stage,layer,callback){
    //console.log("Drawing room: "+JSON.stringify(roomInfo));
    // make a room as a group of lines
    var roomGroup = new Kinetic.Group({
        x: shiftXToGridOrigin(roomInfo.location.X*pixelsPerMeter),
        y: shiftXToGridOrigin(roomInfo.location.Z*pixelsPerMeter),
        rotation: 0,
        draggable:false,
        name: 'roomGroup'
    });
    var topLine = new Kinetic.Line({
        points:[roomInfo.walls.top.startingPoint.X*pixelsPerMeter,
            roomInfo.walls.top.startingPoint.Z*pixelsPerMeter,
            roomInfo.walls.top.endingPoint.X*pixelsPerMeter,
            roomInfo.walls.top.endingPoint.Z*pixelsPerMeter],
        stroke: 'black',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [33, 10],
        opacity:0.4
    })
    var leftLine = new Kinetic.Line({
        points:[roomInfo.walls.left.startingPoint.X*pixelsPerMeter,
            roomInfo.walls.left.startingPoint.Z*pixelsPerMeter,
            roomInfo.walls.left.endingPoint.X*pixelsPerMeter,
            roomInfo.walls.left.endingPoint.Z*pixelsPerMeter],
        stroke: 'black',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [33, 10],
        opacity:0.4
    })
    var rightLine = new Kinetic.Line({
        points:[roomInfo.walls.right.startingPoint.X*pixelsPerMeter,
            roomInfo.walls.right.startingPoint.Z*pixelsPerMeter,
            roomInfo.walls.right.endingPoint.X*pixelsPerMeter,
            roomInfo.walls.right.endingPoint.Z*pixelsPerMeter],
        stroke: 'black',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [33, 10],
        opacity:0.4
    })

    var bottomLine = new Kinetic.Line({
        points:[roomInfo.walls.bottom.startingPoint.X*pixelsPerMeter,
            roomInfo.walls.bottom.startingPoint.Z*pixelsPerMeter,
            roomInfo.walls.bottom.endingPoint.X*pixelsPerMeter,
            roomInfo.walls.bottom.endingPoint.Z*pixelsPerMeter],
        stroke: 'black',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [33, 10],
        opacity:0.4
    })

    roomGroup.add(topLine);
    roomGroup.add(rightLine);
    roomGroup.add(bottomLine);
    roomGroup.add(leftLine);
    layer.add(roomGroup);
    stage.add(layer);
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
function radians (degrees) {return degrees * (Math.PI/180)}
function degrees (radians) {return radians * (180/Math.PI)}
// Calculate the angle between two points.
// cf. http://stackoverflow.com/a/12221474/257568
function angle (cx, cy, px, py) {var x = cx - px; var y = cy - py; return Math.atan2 (-y, -x)}
function distance (p1x, p1y, p2x, p2y) {return Math.sqrt (Math.pow ((p2x - p1x), 2) + Math.pow ((p2y - p1y), 2))}

 function drawStationaryDevice(ID,originLocation,X, Z, width, height, orientation, FOV,observer,layer,stage){
     //console.log('width: '+ width + ' && height: ' + height);
     var width = width*pixelsPerMeter;
     var height = height*pixelsPerMeter;


    var stationaryDevice = new Kinetic.Group({
        x: shiftXToGridOrigin(X*pixelsPerMeter),
        y: shiftXToGridOrigin(Z*pixelsPerMeter),
        rotation: 0,
        draggable:true
    });

    function getDeviceOrientation(deviceX,deviceZ){
        var angleTowardsKinect = Math.atan2(deviceX,deviceZ);
        var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
        return returnDegree;
    }

   // var actualOrientation = 360 - (orientation + getDeviceOrientation(X,Z) + 90+ FOV/2);
    //var startAngle = (actualOrientation+(FOV/2))*Math.PI/180;
    //var endAngle = (actualOrientation-(FOV/2))*Math.PI/180;
     var actualOrientation = (360 - (orientation + getDeviceOrientation(X,Z) + 90+ FOV/2));
     if(FOV != undefined){
         //console.log('getDeviceOrientation:'+getDeviceOrientation(X,Z) + '   FOV/2:'+FOV/2 + '\torientation:'+orientation);
         var deviceView = new Kinetic.Arc({
             innerRadius: 0,
             outerRadius: 2*pixelsPerMeter,
             angle:FOV,
             rotationDeg:actualOrientation,
             fill: 'rgba(0, 255, 0, 1.0)',
             opacity:0.3
         });
         deviceView.clockwise(false);
         stationaryDevice.add(deviceView);
     }

    var deviceBody = new Kinetic.Rect({
        x: -(width/2),
        y: -(height/2),
        width: width,
        height: height,
        fill: 'green',
        stroke: 'black',
        strokeWidth:2
    });
    stationaryDevice.add(deviceBody);

    var deviceID = new Kinetic.Text({
        x: width/2,
        y: -height,
        text: ID,
        fontSize: 15,
        fontFamily: 'Calibri',
        fill: 'black'
    });
    stationaryDevice.add(deviceID);

     //console.log('Observer:' + JSON.stringify(observer));
     if(observer.observerType == 'radial') {
         var observeRangeVisual = new Kinetic.Circle({
             x: 0,
             y: 0,
             radius: observer.observeRange * pixelsPerMeter,
             fill: '',
             stroke: 'green',
             strokeWidth: 1,
             opacity: 0.8,
             blurRadius: 50
         });
         stationaryDevice.add(observeRangeVisual);
     }else if(observer.observerType == 'rectangular'){
         var width = observer.observeWidth*pixelsPerMeter;
         var height = observer.observeHeight*pixelsPerMeter;
         //console.log('deviceView rotation: '+(deviceView.getRotationDeg()-FOV/2) + '\t actually orientation: '+actualOrientation);
         //console.log(width+'-'+height);
         var rotatedDirection = matrixTransformation({X:observer.observerDistance*pixelsPerMeter,Y:0,Z:0},-(deviceView.getRotationDeg()+FOV/2));
         var observeRangeVisual = new Kinetic.Rect({
             x: rotatedDirection.X-(width/2),
             y: rotatedDirection.Z-(height/2),
             width: width,
             height: height,
             fill:'',
             stroke: 'green',
             strokeWidth:1,
             opacity:1
         });
         stationaryDevice.add(observeRangeVisual);
     }
    // mouse events
    stationaryDevice.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
        this.children[1].fill('#31CC00');
        this.children[1].stroke('');
        this.children[1].strokeWidth('0');
        //this.children[3].stroke('#31CC00');
        layer.draw();
    });

    stationaryDevice.on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.children[1].fill('green');
        this.children[1].stroke('black');
        this.children[1].strokeWidth('2');
        //this.children[3].stroke('green');

        //this.fill('rgba(0, 255, 0, 1.0)');
        ////this.stroke('');
       // this.strokeWidth('0');
        //this.opacity('0.3');
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
            console.log("original location: "+JSON.stringify(originLocation));
            io.emit('updateObjectLocation',{ID:ID,newLocation:{X:originLocation.X+directionVector.X,Y:originLocation.Y,Z:originLocation.Z+directionVector.Z},objectType:'device'});
            refreshStationaryLayer();
        }
    });

     layer.add(stationaryDevice);
     ///TODO: add FOVGroupController
    if(FOV!=undefined){
        var rotatedDirection = matrixTransformation({X:stationaryDevice.children[0].outerRadius(),Y:0,Z:0},-(stationaryDevice.children[0].getRotationDeg()+FOV/2));
        var controlGroup = new Kinetic.Group ({
            x: stationaryDevice.getPosition().x,
            y: stationaryDevice.getPosition().y,
            opacity: 0.8, draggable: true
        }); layer.add (controlGroup);
        var originalArc = stationaryDevice.children[0];

        var sign = new Kinetic.Path({
            x: rotatedDirection.X-0.25*pixelsPerMeter, y: rotatedDirection.Z-0.25*pixelsPerMeter,
            // Path from http://www.html5canvastutorials.com/kineticjs/html5-canvas-kineticjs-path-tutorial/
            data: 'M12.582,9.551C3.251,16.237,0.921,29.021,7.08,38.564l-2.36,1.689l4.893,2.262l4.893,2.262l-0.568-5.36l-0.567-5.359l-2.365,1.694c-4.657-7.375-2.83-17.185,4.352-22.33c7.451-5.338,17.817-3.625,23.156,3.824c5.337,7.449,3.625,17.813-3.821,23.152l2.857,3.988c9.617-6.893,11.827-20.277,4.935-29.896C35.591,4.87,22.204,2.658,12.582,9.551z',
            scale: { x:0.5, y:0.5 }, fill: 'black'
        }); controlGroup.add (sign);

        var originalDegree = originalArc.getRotationDeg();
        var control = new Kinetic.Circle ({
            x: rotatedDirection.X, y: rotatedDirection.Z, fill: 'yellow', opacity: 0, radius: 0.3*pixelsPerMeter
        }); controlGroup.add (control);
        var deviceBody = stationaryDevice.children[1];

        // ANIMATIONS
        var signOpacity = 0; var animationTick = 0
        var signOpacityAnimation = new Kinetic.Animation (function (frame) {
            var opacity = controlGroup.getOpacity()
            //status.setText ('animationTick: ' + animationTick++)
            //status.setText ('signOpacity: ' + signOpacity + '; opacity: ' + opacity)
            if (opacity == signOpacity) {signOpacityAnimation.stop(); return}
            if (opacity < signOpacity) opacity += frame.timeDiff / 200; else opacity -= frame.timeDiff / 200
            if (opacity < 0) opacity = 0; if (opacity > 1) opacity = 1
            controlGroup.setOpacity (opacity)
            //line.setOpacity (opacity / 2)
        }, layer); signOpacityAnimation.start()

        controlGroup.setDragBoundFunc (function (pos,event) {
            var groupPos = stationaryDevice.getPosition();
           //console.log('pos: ' + JSON.stringify(pos));
            var rotation = degrees (angle (groupPos.x, groupPos.y, pos.x + control.getPosition().x, pos.y+control.getPosition().y));
            var dis = distance (groupPos.x, groupPos.y, pos.x + control.getPosition().x, pos.y+control.getPosition().y);
            stationaryDevice.children[0].setRotationDeg (rotation-(FOV/2));
            //console.log("rotation: "+stationaryDevice.children[0].getRotationDeg());
            //console.log('counter translation: '+ (-(rotation+90))); //360 - (orientation + getDeviceOrientation(X,Z) + 90+ FOV.degree/2)

            if(observer.observerType=='rectangular'){
                var width = observer.observeWidth*pixelsPerMeter;
                var height = observer.observeHeight*pixelsPerMeter;
                var rotatedDirection = matrixTransformation({X:observer.observerDistance*pixelsPerMeter,Y:0,Z:0},-(stationaryDevice.children[0].getRotationDeg()+FOV/2));
                //console.log(stationaryDevice.children[3].getX());
                stationaryDevice.children[3].setX(rotatedDirection.X-(width/2));
                stationaryDevice.children[3].setY(rotatedDirection.Z-(height/2));
                //layer.draw();
            }

            return pos;
        });

        function calcSignOpacity() {
            var mousePos = stage.getPointerPosition();
            if (mousePos) {
                var controlPos = controlGroup.getPosition(), groupPos = stationaryDevice.getPosition()
                var dis = Math.min (
                    distance (mousePos.x, mousePos.y, controlPos.x, controlPos.y),
                    distance (mousePos.x, mousePos.y, groupPos.x, groupPos.y))
                //status.setText ('distance: ' + dis)
                signOpacity = dis <= 2.5*pixelsPerMeter ? 1 : 0
            } else signOpacity = 0
            if (controlGroup.getOpacity() != signOpacity && !signOpacityAnimation.isRunning()) signOpacityAnimation.start()
        }
        stage.getContainer().addEventListener ('mousemove', calcSignOpacity, false);




        controlGroup.on ('dragend', function() {
            var dragendArc = stationaryDevice.children[0];
            //console.log("stationaryDevice"+ JSON.stringify(stationaryDevice.getPosition()));

            var rotatedDirection = matrixTransformation({X:stationaryDevice.children[0].outerRadius(),Y:0,Z:0},-(stationaryDevice.children[0].getRotationDeg()+FOV/2));

            //console.log("controlgroup: " + JSON.stringify(controlGroup.getPosition()));

            //console.log('degreeChange:' + (-(actualOrientation-(360+dragendArc.getRotationDeg()))));//
            //console.log('udpate orientation request')
            $.ajaxSetup({
                type: 'POST',
                headers: { "cache-control": "no-cache" }
            });


            // update and reposition orientation
            function updateOrientationAndRefresh(){
                controlGroup.setPosition({
                    x: rotatedDirection.X,//-dragendArc.outerRadius()*Math.sin((dragendArc.getRotationDeg()+ FOV.degree)*(Math.PI/180)),
                    y: rotatedDirection.Z//-dragendArc.outerRadius()*Math.cos((dragendArc.getRotationDeg()+ FOV.degree)*(Math.PI/180))
                });
                refreshStationaryLayer();
            }
            var timer;
            timer = window.setTimeout(function(){
                updateOrientationAndRefresh();
            },1500);
            function ajaxError(jqXHR, textStatus, errorThrown) {
                window.clearTimeout(timer);
                console.log('$.post error: ' + textStatus +  ':'+ jqXHR.status + ' : ' + errorThrown);
                updateOrientationAndRefresh();
            };
            var newOrientation = (orientation+(actualOrientation-(360+dragendArc.getRotationDeg())));
            $.post('/devices/updateOrientation'+'/' + deviceID.getText()+'/'+ newOrientation, function(data,status){
                //console.log("success? " + status);
                if(status == 'success') {
                    window.clearTimeout(timer);
                    updateOrientationAndRefresh();
                }

            }).fail(ajaxError);


        //};

            // https://github.com/ericdrowell/KineticJS/issues/123
            //line.transitionTo ({points: linePoints (57), duration: 1})

        })


    }//END of radial FOV

    ///END reading.

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

    if(data.observer.observerType=='radial'){
        var observeRangeVisual = new Kinetic.Circle({
            x: 0,
            y: 0,
            radius:data.observer.observeRange*pixelsPerMeter,
            fill:'#C9BC61',
            stroke: 'black',
            strokeWidth:1,
            opacity:0.3,
            blurRadius:50
        });
        dataPointGroup.add(observeRangeVisual);
    }else if(data.observer.observerType=='rectangular'){
        var width = data.observer.observeWidth*pixelsPerMeter;
        var height = data.observer.observeHeight*pixelsPerMeter;
        var observeRangeVisual = new Kinetic.Rect({
            x: -(width/2),
            y: -(height/2),
            width: width,
            height: height,
            fill:'#C9BC61',
            stroke: 'black',
            strokeWidth:1,
            opacity:0.3
        });
        dataPointGroup.add(observeRangeVisual);
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

    var dropCircle = new Kinetic.Circle({
        x: 0,
        y: 0,
        radius:data.dropRange*pixelsPerMeter,
        fill: '#C9C9C9',
        opacity:0.6
    });
    dataPointGroup.add(dropCircle);

    // data in the for the dataPoints
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

    dataPointGroup.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
        this.children[0].strokeWidth('4');
        //this.children[1].fontSize('24');
       layer.draw();
    });
    dataPointGroup.on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.children[0].strokeWidth('1');
        //this.children[1].fontSize('15');
        layer.draw();
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

    layer.add(dataPointGroup);
}
/**
 * Stationary Only updates position when this is called
 *
 * */
// expose stationary layer and stage
var stationaryStage = null;
var stationaryLayer = null;
function refreshStationaryLayer() {
    //console.log('Stationary layer refreshed');

    var stage = new Kinetic.Stage({
        container: 'cnvStationary',
        width: 800,
        height: 800
    });
    var layer = new Kinetic.Layer();

    stationaryStage = stage;
    stationaryLayer = layer;
    io.emit('getDevicesWithSelection', {selection: ["all"]}, function (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key].stationary == true && data[key].location.X != null && data[key].location.Y != null && data[key].location.Z != null && data[key].observer != undefined) {
                    //console.log("X:" + data[key].location.X)
                    //console.log("Y:" + data[key].location.Y)
                    //console.log("Z:" + data[key].location.Z)
                    drawStationaryDevice(data[key].uniqueDeviceID,data[key].location,
                        data[key].location.X, data[key].location.Z, data[key].width,
                            data[key].depth, data[key].orientation.yaw, data[key].FOV,data[key].observer,layer,stage)
                }
            }
        }
        stage.add(layer);
    });
    // Paint room on stationary layer
    io.emit("getRoomFromServer",{},function(room){
        // Got room from server drawing room with kineticjs
        drawRoom(room,stage,layer);
    })
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
}

function getDeviceInfoByID(deviceID,ctx,xInMeters,zInMeters,personLocation){
    var deviceNameString;
    //console.log("device ID:"+deviceID);
    io.emit('getDevicesWithSelection',{selection:['all']},function(data){
        if(data.hasOwnProperty(deviceID)){
            //console.log('got device: '+data[Object.keys(data)].name.length);
            if(data[Object.keys(data)[0]].name.length>=5){
                deviceNameString = data[deviceID].name.substring(0, 4)+'...';
            }else{
                deviceNameString = data[deviceID].name;
            }
            //console.log(JSON.stringify(data[Object.keys(data)[0]].observeRange));

            ctx.fillStyle = "black"; //green
            ctx.font = "12px Arial";
            ctx.fillText(deviceNameString,shiftXToGridOrigin(xInMeters)+minorGridLineWidth,shiftYToGridOrigin(zInMeters)+1);

            //console.log("Paired Device Observer: "+JSON.stringify(data[deviceID].observer));
            if(data[deviceID].observer!=undefined) {
                switch (data[deviceID].observer.observerType) {
                    case "radial":
                        /*console.log("radial device person location:"+JSON.stringify(personLocation));
                         ctx.beginPath();
                         ctx.arc(shiftXToGridOrigin(personLocation.X*pixelsPerMeter),shiftYToGridOrigin(personLocation.Y*pixelsPerMeter), data[deviceID].observer.observeRange*pixelsPerMeter, 0, 2 * Math.PI, false);
                         ctx.strokeStyle = '#003300';
                         ctx.stroke();
                         ctx.lineWidth = 1;*/
                        break;
                    case "rectangular":
                        break;
                    default:
                        console.log("Unknown Observer type");
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
     * Update everything about sensor
     * */
    io.emit('getSensorsFromServer', {}, function(sensorList){
        var htmlString = ""
        var cSensors = document.getElementById("cnvSensors");
        var ctxSensors = cSensors.getContext("2d");
        ctxSensors.clearRect(0, 0, cSensors.width, cSensors.height);
        var kinectList = sensorList.kinects;
        for(var key in kinectList){
            if(kinectList.hasOwnProperty(key)){
                //console.log("SensorKey: "+key+"\tcalibration: "+JSON.stringify(data[key].calibration));
                //console.log("ySpaceTransition: "+JSON.stringify(data[key].calibration.ySpaceTransition));
                var sensorX = 0; //get this from sensor list later on
                var sensorY=  0;
                var angle = 270;
                if(kinectList[key].calibration["Rotation"]!=0&&kinectList[key].calibration["Rotation"]!=null){
                    sensorX += (kinectList[key].calibration["xSpaceTransition"]*pixelsPerMeter/1000); //changed from += to -= probably because sensor see mirror image?
                    sensorY += (kinectList[key].calibration["ySpaceTransition"]*pixelsPerMeter/1000);
                    angle += kinectList[key].calibration["Rotation"];
                }
                //console.log("X: "+sensorX+"  Y: "+sensorY+"  Angle: "+angle);
                //console.log("angleAfterCalibration: "+ data[key].calibration["Rotation"]);
                //console.log("TransformX : "+ sensorX+data[key].calibration["TransformX"]);
                //console.log("sensorYAfterCalibration: "+ data[key].calibration["Rotation"]);
                drawSensor(ctxSensors,sensorX,sensorY,kinectList[key].ID,angle, kinectList[key].FOV);
                var gradientVector = {X:0,Z:kinectList[key].rangeInMM};
                // get the vector from sensor point to the end point ot gradient
                var rotatedGradientVector = matrixTransformation(gradientVector,kinectList[key].calibration["Rotation"]);
                //console.log('rotated: ' + JSON.stringify(rotatedGradientVector));
                //console.log('sensorX: ' + sensorX + '\tsensorY: ' + sensorY);
                // get the end point of the gradient
                var endPointOfGradient = {X:shiftXToGridOrigin((rotatedGradientVector.X)/1000*pixelsPerMeter+sensorX),Z:shiftYToGridOrigin((rotatedGradientVector.Z)/1000*pixelsPerMeter+sensorY)}          // move the point to where it belongs in the canvas
                //console.log('end point : ' + JSON.stringify(endPointOfGradient));
                //console.log('->'  +shiftXToGridOrigin(sensorX)+'\t'+ shiftYToGridOrigin(sensorY)+'\t'+ endPointOfGradient.X+'\t'+endPointOfGradient.Z);
                var grd = ctxSensors.createLinearGradient(shiftXToGridOrigin(sensorX), shiftYToGridOrigin(sensorY), endPointOfGradient.X,endPointOfGradient.Z)//shiftXToGridOrigin(sensorX), shiftYToGridOrigin(sensorY) + (data[key].rangeInMM)/1000*pixelsPerMeter);
                grd.addColorStop(0, 'rgba(51, 112, 212, 0.8)');
                grd.addColorStop(1, 'rgba(51, 112, 212, 0.0)');
                drawView(ctxSensors, sensorX, sensorY, kinectList[key].rangeInMM, grd,angle, kinectList[key].FOV);

                var convertCalibrationToButton = function(isCalibrated, key){
                    if(isCalibrated) return "<button type=\"button\" class=\"resetButtonOn\" onclick=\"sendResetRequest(\'" + key + "\')\">Reset</button>";
                    else return "<button type=\"button\" class=\"resetButtonOff\" onclick=\"sendResetRequest(\'" + key + "\')\">N/A</button>";
                }

                htmlString += ('<tr>' +
                    '<td>' + kinectList[key].ID + '</td>' +
                    '<td>' + kinectList[key].sensorType + '</td>' +
                    '<td>' + kinectList[key].socketID + '</td>' +
                    '<td>' + kinectList[key].FOV + '</td>' +
                    '<td>' + convertCalibrationToButton(kinectList[key].isCalibrated, key) + '</td>' +
                    '</tr>')
            }
        };
        var leapList = sensorList.leapMotions;
        for(var key in leapList){
            if(leapList.hasOwnProperty(key)){
                //console.log(key);
                htmlString += ('<tr>' +
                    '<td>' + leapList[key].ID + '</td>' +
                    '<td>' + leapList[key].sensorType + '</td>' +
                    '<td>' + leapList[key].socketID + '</td>' +
                    '<td>' + "Life is?" + '</td>' +
                    '<td>' + "..HARD" + '</td>' +
                    '</tr>')
            }
        }

        var iBeaconList = sensorList.iBeacons;
        for(var key in iBeaconList){
            if(iBeaconList.hasOwnProperty(key)){
                //console.log(key);
                htmlString += ('<tr>' +
                    '<td>' + iBeaconList[key].ID + '</td>' +
                    '<td>' + iBeaconList[key].sensorType + '</td>' +
                    '<td>' + iBeaconList[key].socketID + '</td>' +
                    '<td>' + "Life is?" + '</td>' +
                    '<td>' + "..HARD" + '</td>' +
                    '</tr>')
            }
        }

        $('#sensors').html('<legend>Sensors</legend><table style="width:100%"><tr>' +  '<th>ID</th>' +
            '<th>Type</th>' +
            '<th>socketID</th>' +
            '<th>FOV</th>' +
            '<th>Calibrated</th>' +
            '</tr>' + htmlString + '</table>')
    });

    /**
     *  Update everything about the person
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
                    //ctx.rect(shiftXToGridOrigin(xInMeters)-minorGridLineWidth,shiftYToGridOrigin(zInMeters)-minorGridLineWidth,minorGridLineWidth*2,minorGridLineWidth*2);
                    ctx.stroke();
                    getDeviceInfoByID(data[key].ownedDeviceID,ctx,xInMeters,zInMeters,data[key].location,c);
                }

                if(data[key].orientation != null){
                    var orientationToSensor = getPersonOrientation(data[key].location.X,data[key].location.Z);
                    //console.log(" personOrientationToSensor: " + orientationToSensor);
                    //console.log("device orientation: "+data[key].orientation+" personOrientationToSensor: " + orientationToSensor + " Sum up: " + (data[key].orientation+orientationToSensor+90));
                    drawView(ctx, xInMeters, zInMeters, 1000, "#2cd72A",(data[key].orientation.yaw+orientationToSensor+90), 30);
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
            //'<th style="width:100px">orientation to Kinect</th>' +
            //'<th style="width:100px">Distance to Kinect</th>' +
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
                    htmlString+='<tr><td>' +data[key].uniqueDeviceID+'</td>'+ '<td>' +data[key].name +'</td>'+'<td>' +data[key].deviceType +'</td>'+
                        '<td>('+data[key].location.X+', '+data[key].location.Y+', '+data[key].location.Z+')</td>'+
                        '<td>'+Math.round(data[key].orientation.yaw*ROUND_RATIO)/ROUND_RATIO+'</td>' +'<td>'+pairingInfo(data[key].pairingState)+'</td>'+
                        '<td>'+data[key].ownerID+'</td>'+
                        '</tr>'
                }
                else{
                    htmlString+='<tr><td>' +data[key].uniqueDeviceID+'</td>'+ '<td>' +data[key].name +'</td>'+'<td>' +data[key].deviceType +'</td>'+
                        '<td>('+data[key].location.X.toFixed(3)+', '+data[key].location.Y+', '+data[key].location.Z.toFixed(3)+')</td>'+
                        '<td>'+Math.round(data[key].orientation.yaw*ROUND_RATIO)/ROUND_RATIO+'</td>' +'<td>disabled</td>'+
                        '<td>'+data[key].ownerID+'</td>'+
                        '</tr>'
                }
            }
        }

        $('#devices').html('<legend>Devices</legend>' +
            '<table id = "device_table">' +
            '<tr><th>ID</th><th>Name</th><th>Type</th><th>location</th> <th>orientation</th>'+
            '<th>Pairing State</th>'+
            '<th>Owner</th>'+
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


io.on("intersectedOnWall",function(intersectionInfo){
    //console.log(intersectionInfo);
    highlightIntersectionPoint(intersectionInfo);
});
function highlightIntersectionPoint(intersectionInfo,callback) {
    //console.log(foundRoomGroup);
    //console.log(intersectionInfo.intersectionPoint[0]);
    //console.log(intersectionInfo);
    var intersectedPoint = intersectionInfo.intersectionPoint.intersectedPoint;
    var foundRoomGroup = stationaryLayer.find('.roomGroup')[0];
    //console.log(foundRoomGroup);
    var foundIntPointByID = stationaryLayer.find("#"+intersectionInfo.observer.id);
    if(foundIntPointByID.length==0){
        // if there is no intersectionPoint displayed on canvas, create a new one
        var intersectionPointOnCanvas = new Kinetic.Circle({
            x: intersectedPoint.X * pixelsPerMeter,
            y: intersectedPoint.Z * pixelsPerMeter,
            radius: 5,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 1,
            name:"intersectionPointInRoom",
            id: ''+intersectionInfo.observer.id
        });
        if(intersectionInfo.intersectionPoint.side == "floor"){
            intersectionPointOnCanvas.opacity(0.2);
        }
        foundRoomGroup.add(intersectionPointOnCanvas);
        //console.log(intersectionPointOnCanvas.id());
        stationaryLayer.draw();

    }else{
        //console.log(foundIntPointByID[0].id());
        //console.log(intersectionInfo.observer.id);
        // if point belong to this ID found, update the point
        if(foundIntPointByID[0].id()==intersectionInfo.observer.id) {
            //console.log("happiness found?");
            foundIntPointByID[0].setPosition({
                x: intersectedPoint.X * pixelsPerMeter,
                y: intersectedPoint.Z * pixelsPerMeter
            });
            stationaryLayer.draw();
        }
    }
    //console.log(foundRoomGroup);
    // Highlight intersection if on wall
    if(foundRoomGroup!=null&&foundRoomGroup!=undefined) {
        switch (intersectionInfo.intersectionPoint.side) {
            case "top":
                //foundRoomGroup.children[0].stroke("yellow");
                stationaryLayer.draw();
                break;
            case "left":
                //foundRoomGroup.children[3].stroke("yellow");
                stationaryLayer.draw();
                break;
            case "right":
                //foundRoomGroup.children[1].stroke("yellow");
                stationaryLayer.draw();
                break;
            case "bottom":
                //foundRoomGroup.children[2].stroke("yellow");
                stationaryLayer.draw();
                break;
            case "ceiling":
                //foundRoomGroup.children[2].stroke("yellow");

                //stationaryLayer.draw();
                break;
            case "floor":
                //foundRoomGroup.children[2].stroke("yellow");
                //stationaryLayer.draw();
                break;
            default:
                console.log("Unknown side in intersectionPoint: " + intersectionInfo.intersectionPoint.side);
        }
    }
}


io.on("connect", function(){
    io.emit("registerWebClient", {});
    refreshStationaryLayer();
});

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
    setInterval(function() {updateContentWithObjects(); }, 1000); //poll server for people list and display on canvas
})

var sendResetRequest = function(socketID){
    console.log('reset request')
    $.ajaxSetup({
        type: 'POST',
        headers: { "cache-control": "no-cache" }
    });
    $.post('/sensors/' + socketID + '/uncalibrate', '')
}