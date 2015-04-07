/**
 * Created by Yuxibro on 15-04-06.
 */
$(document).ready(function(){
    var sections = document.getElementsByTagName("section");
    //console.log(sections);
    function showSection(id){
        console.log(id);
        for(var key in sections) {
            //console.log(isNaN(Number(key)))
            if(!isNaN(Number(key))) {
                var section = $(sections[key])
                //console.log(sections[key].id);
                //var section = $("section#" + sections[key].id);
                if (sections[key].id == id) {
                    section.fadeIn("fast");
                } else {
                    section.hide();
                }

            }
        }
    }
    $("#calibration_flip").click(function(){
        showSection('calibration_section')
        refreshSensors();
        showNormalStatus('Navigate to Calibration Page!');
    });
    $('#overview_flip').on('click',function(){
        showSection("canvas")
        showNormalStatus('Navigate to Overview page')
    });
    $('#dataManage_flip').on('click',function(){
        showSection("dataManage");
        showNormalStatus('Navigate to data mangement page');
    })
    $('#settings_flip').on('click',function(){
        console.log('settings flip!');
        $.get("setting",function(settingField){
            //console.log(settingField);
            $("div#setting_menu").empty();
            for(var key in settingField){
                //console.log(key);
                var makeFieldset = "<fieldset>" + "<legend>"+key.toUpperCase()+"</legend>";
                // use append use class = "calibration_step"
                var propertiesWithValueList = settingField[key];
                for(var property in propertiesWithValueList){
                    makeFieldset += property+" -- "+JSON.stringify(propertiesWithValueList[property]) + "<br/>";

                }

                makeFieldset += "</fieldset>";
                //console.log(makeFieldset);
                $('div#setting_menu').append(makeFieldset);
            }

            showSection("setting")
        });


    })

    $('#refreshSensors').on('click',function(){
        refreshSensors();
    })


    $('#sampleClients_flip').on('mouseover',function(){
        $('#sampleClients_list').fadeIn('100');
    });
    $('#sampleClients_flip').on('mouseleave',function(){
        $('#sampleClients_list').fadeOut('100');
    });


    // clear the points for sensor one
    $('#clear_master_points').click(function(){
        $('input[name=master_point1X]').val('');
        $('input[name=master_point1Y]').val('');
        $('input[name=master_point2X]').val('');
        $('input[name=master_point2Y]').val('');
        sensorOnePoints.splice(0,sensorOnePoints.length); // clear all the points for sensor one
        showGreenStatus('Reference Sensor Points Cleared!');
    });

    // clear the points for sensor one
    $('#clear_sensorTwo_points').click(function(){
        $('input[name=sensor_point1X]').val('');
        $('input[name=sensor_point1Y]').val('');
        $('input[name=sensor_point2X]').val('');
        $('input[name=sensor_point2Y]').val('');
        sensorTwoPoints.splice(0,sensorTwoPoints.length); // clear all the points for sensor one
        showGreenStatus("Sensor Two Points Cleared!");
    });

    $('body').on('click','.get_unpaired_people',function(){
        var deviceID = uniqueDeviceIDToSocketID[$("td:first",$(this).parents('tr')).text()];
        console.log("Selected Device: " + deviceID + "\tuniquePersonID: "+ $(this).text());
        io.emit("pairDeviceWithPerson",{deviceSocketID:deviceID, uniquePersonID: $(this).text()},function(callback){
            console.log(JSON.stringify(callback));
        });
    })

    $('#dumpData_BTN').on('click',function(){
        console.log('asking: ' + Number($('#dumpDataPersonID').val()) + ' to dump data in range '+ Number($('#dumpDataRange').val()));
        io.emit('dropData',{ID:Number($('#dumpDataPersonID').val()), range:Number($('#dumpDataRange').val())},function(data){
            console.log(data);
            showGreenStatus(data);
        });
    })

    $('#calibrate_instruction_flip').on('click',function(){
        $('#calibration_instruction').slideToggle('200');
        $(this).toggleClass('button');
    });

})