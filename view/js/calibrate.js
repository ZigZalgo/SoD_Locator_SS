

var calibrationFrames = {};
var sensorOnePoints = [];
var sensorTwoPoints = [];
var sensors = {};
var depthArrays = {};


function getPosition(canvasID, sid, event)
{
    var rect = document.getElementById(canvasID).getBoundingClientRect();
    var xInPixels = event.x - rect.left;
    var y = event.y - rect.top;

    var z = depthArrays[sid][Math.round(xInPixels+(y*sensors[sid].frameWidth))];//depthArrays[sid][xInPixels+(y*sensors[sid].frameWidth)];

    console.log(event.x);

    if(sensors[sid].sensorType == "Kinect2"){
        z = z*10;
    }

    var xInMM = 2*(event.x - rect.left-(sensors[sid].frameWidth/2))/(sensors[sid].frameWidth)*(z>>>3)*(Math.tan(sensors[sid].FOV/2))
    /*
     console.log("bunch of stuff output: " + ( rect.left-(sensors[sid].frameWidth/2))/(sensors[sid].frameWidth)*(z>>>3)*(Math.tan(sensors[sid].FOV/2)));
     console.log("less bunch of stuffs output: "+ (sensors[sid].frameWidth)*(z>>>3)*(Math.tan(sensors[sid].FOV/2)));
     console.log("Even less bunch of stuffs output: "+ (sensors[sid].frameWidth)*(z>>>3));
     console.log("Even less bunch of stuffs output narrow -> "+ (sensors[sid].frameWidth));
     console.log("Even less bunch of stuffs output narrow -> "+ ((z>>>3)));
     console.log("Even less bunch of stuffs output narrow -> -> "+ ((z)));
     console.log("Even less bunch of stuffs output narrow -> -> Explore => "+ (depthArrays[sid][Math.round(xInPixels+(y*sensors[sid].frameWidth))]));
     //console.log("Even less bunch of stuffs output narrow -> -> Explore => "+ (depthArrays[sid])); Too much data for display
     console.log("Even less bunch of stuffs output narrow -> -> Explore => Index: "+ (xInPixels+(y*sensors[sid].frameWidth)));
     console.log("Even less bunch of stuffs output narrow -> -> Explore => xInPixels: "+ (xInPixels));
     console.log("Even less bunch of stuffs output narrow -> -> Explore => y: "+ (y));
     console.log("Even less bunch of stuffs output narrow -> -> Explore => sensors[sid].frameWidth: "+ (sensors[sid].frameWidth));
     console.log("Even even less bunch of stuffs output: "+ (Math.tan(sensors[sid].FOV/2)));
     console.log("rect.left: "+rect.left);
     console.log("xInMM: "+xInMM);
     */
    if(canvasID == "cnvSensorOne"){
        if(sensorOnePoints.length < 2 && z > 0){
            sensorOnePoints.push({X: xInMM, Y: y, Z: z >>> 3});
            $('.status').html("<span class='green_status'>Point saved!</span>");
            $('.green_status').fadeIn(600);
        }else if(sensorOnePoints.length >= 2){
            $('.status').html("<span class='red_status'>Enough Points.</span>");
            $('.red_status').fadeIn(600);
        }else if(z<=0){
            $('.status').html("<span class='red_status'>Depth is out of range, please choose another point!</span>");
            $('.red_status').fadeIn(600);
        }
        //$('#sensorOneStatus').html(JSON.stringify(sensorOnePoints));
        $( 'input[name=master_point1X]' ).val(JSON.stringify(Math.round(sensorOnePoints[0].X*ROUND_RATIO)/ROUND_RATIO));
        $( 'input[name=master_point1Y]' ).val(JSON.stringify(Math.round(sensorOnePoints[0].Y*ROUND_RATIO)/ROUND_RATIO));
        $( 'input[name=master_point2X]' ).val(JSON.stringify(Math.round(sensorOnePoints[1].X*ROUND_RATIO)/ROUND_RATIO));
        $( 'input[name=master_point2Y]' ).val(JSON.stringify(Math.round(sensorOnePoints[1].Y*ROUND_RATIO)/ROUND_RATIO));
    }
    else if(canvasID == "cnvSensorTwo"){
        if(sensorTwoPoints.length < 2 && z > 0){
            sensorTwoPoints.push({X: xInMM, Y: y, Z: z >>> 3});
            $('.status').html("<span class='green_status'>Point saved!</span>");
            $('.green_status').fadeIn(600);
        }else if(sensorTwoPoints.length >= 2){
            $('.status').html("<span class='red_status'>Enough Points.</span>");
            $('.red_status').fadeIn(600);
        }else if(z<=0){
            $('.status').html("<span class='red_status'>Depth is out of range, please choose another point!</span>");
            $('.red_status').fadeIn(600);
        }
        //$('#sensorTwoStatus').html(JSON.stringify(sensorTwoPoints));
        $( 'input[name=sensor_point1X]' ).val(JSON.stringify(Math.round(sensorTwoPoints[0].X*ROUND_RATIO)/ROUND_RATIO));
        $( 'input[name=sensor_point1Y]' ).val(JSON.stringify(Math.round(sensorTwoPoints[0].Y*ROUND_RATIO)/ROUND_RATIO));
        $( 'input[name=sensor_point2X]' ).val(JSON.stringify(Math.round(sensorTwoPoints[1].X*ROUND_RATIO)/ROUND_RATIO));
        $( 'input[name=sensor_point2Y]' ).val(JSON.stringify(Math.round(sensorTwoPoints[1].Y*ROUND_RATIO)/ROUND_RATIO));

    }


}

function setup(){
    //
}

function refreshSensors(){
    $("#referenceSensorList").empty();
    $("#uncalibratedSensorList").empty();
    io.emit('getSensorsFromServer', {}, function(data){
        sensors = {};
        var referenceSensorList = document.getElementById("referenceSensorList")
        var uncalibratedSensorList = document.getElementById("uncalibratedSensorList")
        for(var key in data){
            if(data.hasOwnProperty(key)){
                sensors[key] = data[key];
                var option = document.createElement("option");
                option.text = data[key].socketID;
                $('select[name=referenceSensorList] option:eq(0)').attr('selected', 'selected');
                if(data[key].isCalibrated == true){
                    var option2 = document.createElement("option");
                    option2.text = data[key].socketID;
                    referenceSensorList.add(option2);
                }
                uncalibratedSensorList.add(option);
            }

            $('select[name=uncalibratedSensorList] option:eq(1)').attr('selected', 'selected');
        }
    });
}

//io = io.connect()
io.on("connect", function(){
    io.emit("registerWebClient", {});
});

io.on("anything", function(data){
    $('.status').html("MESSAGE RECEIVED: " + data);
})

io.on("setCalibrationFrame", function(data){
    if(calibrationFrames["reference"] == data.sourceID || calibrationFrames["uncalibrated"] == data.sourceID){
        depthArrays[data.sourceID] = data.payload;
        if(sensors[data.sourceID].sensorType == "Kinect1"){
            var depthMultiplier = 7000;
        }
        else{
            var depthMultiplier = 5;
        }
        if(calibrationFrames["reference"] == data.sourceID){
            canvas = document.getElementById("cnvSensorOne");
            var ctx = canvas.getContext("2d");
            var bytearray = new Uint8Array(data.payload);
            var imgdata = ctx.getImageData(0,0, sensors[data.sourceID].frameWidth, sensors[data.sourceID].frameHeight);
            ctx.canvas.width = sensors[data.sourceID].frameWidth;
            ctx.canvas.height = sensors[data.sourceID].frameHeight;
            var imgdatalen = imgdata.data.length;
            for(var i=0;i<(imgdatalen/4);i++){
                var depth = (data.payload[i]>>>3)*255/depthMultiplier;

                imgdata.data[4*i] = depth;
                imgdata.data[4*i+1] = depth;
                imgdata.data[4*i+2] = depth;
                imgdata.data[4*i+3] = 255;
            }
            ctx.putImageData(imgdata,0,0)
            canvas.addEventListener("mousedown", function(event){
                getPosition("cnvSensorOne", data.sourceID, event);
            }, false);
            $('#sensorOneStatus').html(depthMultiplier);
        }
        else if(calibrationFrames["uncalibrated"] == data.sourceID){
            canvas = document.getElementById("cnvSensorTwo");
            var ctx = canvas.getContext("2d");
            var bytearray = new Uint8Array(data.payload);
            var imgdata = ctx.getImageData(0,0, sensors[data.sourceID].frameWidth, sensors[data.sourceID].frameHeight);
            ctx.canvas.width = sensors[data.sourceID].frameWidth;
            ctx.canvas.height = sensors[data.sourceID].frameHeight;
            var imgdatalen = imgdata.data.length;
            for(var i=0;i<(imgdatalen/4);i++){
                var depth = (data.payload[i]>>>3)*255/depthMultiplier;

                imgdata.data[4*i] = depth;
                imgdata.data[4*i+1] = depth;
                imgdata.data[4*i+2] = depth;
                imgdata.data[4*i+3] = 255;
            }
            ctx.putImageData(imgdata,0,0)
            canvas.addEventListener("mousedown", function(event){
                getPosition("cnvSensorTwo", data.sourceID, event);
            }, false);
            $('#sensorTwoStatus').html(depthMultiplier);
        }
    }

});

$(function(){
    $('#refreshSensors').click(function(){
        refreshSensors();
    })
    $('#getCalibrationFrames').click(function(){ /*listening to the button click using Jquery listener*/
        var e1 = document.getElementById("referenceSensorList");
        var e2 = document.getElementById("uncalibratedSensorList");
        while(calibrationFrames.length > 0){
            calibrationFrames.pop();
        }
        calibrationFrames["reference"] = e1.options[e1.selectedIndex].text;
        calibrationFrames["uncalibrated"] = e2.options[e2.selectedIndex].text;
        $('.status').html('<span class="normal_status">CLICKED BUTTON</span>');
        $(".normal_status").fadeIn(600);
        io.emit("getCalibrationFrames", {referenceSensorID: e1.options[e1.selectedIndex].text, uncalibratedSensorID: e2.options[e2.selectedIndex].text});
    });

    $('#resetPointsOne').click(function(){
        sensorOnePoints = [];
        $('#sensorOneStatus').html(JSON.stringify(sensorOnePoints));
    })

    $('#resetPointsTwo').click(function(){
        sensorTwoPoints = [];
        $('#sensorTwoStatus').html(JSON.stringify(sensorTwoPoints));
    })

    $('#calibrate').click(function(){
        if(sensorOnePoints.length == 2 && sensorTwoPoints.length == sensorOnePoints.length){
            io.emit("calibrateSensors", {referenceSensorID: calibrationFrames["reference"], uncalibratedSensorID: calibrationFrames["uncalibrated"],
                sensorOnePoints: sensorOnePoints, sensorTwoPoints: sensorTwoPoints}, function(data){
                if(data.degree!=null){
                    $('.status').html('<span class="green_status"> Calibration Success! Angle between sensors: '+JSON.stringify(Math.round(data.degree * ROUND_RATIO)/ROUND_RATIO)+'/<span>')
                    $('.green_status').fadeIn(800);
                }else{
                    $('.status').html('<span class="red_status"> Calibration Failed! Please reselect the points./<span>')
                    $('.red_status').fadeIn(800);
                }
            })
        }
        else{
            $('.status').html('<span class="red_status">Error: There are not enough points for calibration.</span>');
            $('.red_status').fadeIn(600);
        }
    })
});
io.emit("registerWebClient", {});
