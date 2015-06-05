/**
 * Created by Yuxibro on 15-04-06.
 */
$(document).ready(function(){
    var sections = document.getElementsByTagName("section");
    var setting_changes = {
        pulse:{},
        room:{}
    };
    //console.log(sections);
    function showSection(id){
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
    function updateChangesOnLayout(){
        $('div#settingChangesMade').text("Modified: "+JSON.stringify(setting_changes));
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
    });
    $('#setting_menu').on('change', '.onoffswitch-checkbox', function() {
        //do something
        console.log($(this).is(":checked"));
        if($(this).is(":checked")) {
            setting_changes['pulse'][this.id] = true;
            //$(this.parentNode.parentNode).addClass('blinking blueIt')
            updateChangesOnLayout();
        }else{
            setting_changes['pulse'][this.id] = false;
            //console.log(setting_changes);
            /*if($(this.parentNode.parentNode).hasClass('blueIt'))
            {
                $(this.parentNode.parentNode).removeClass('blueIt');
            }*/
            updateChangesOnLayout();
        }
    });
    $('#setting_menu').on('change', 'input[type=number]', function() {
        //do something
        console.log($(this).attr('name')); // locationX/Y/Z
            });
    $('div#submitChanges').on('click',function(e){
        io.emit('updateServerSettings',setting_changes,function(response){
            console.log(response);
            if(response==true){
                showGreenStatus("Setting changes has been applied.");
            }else{
                showRedStatus("Failed change settings")
            }
        });

    })
    $('div#saveCurrentState').on('click',function(e){
        io.emit('saveCurrentState',{},function(callback){

        });
    })
    $('div#loadFromFlashBack').on('click',function(e){
        io.emit('loadFromConfig',{},function(callback){

        });
    })
    $('#settings_flip').on('click',function(){
        //console.log('settings flip!');
        $.get("setting",function(settingField){
            //console.log(settingField);
            $("div#setting_menu").empty();
            for(var key in settingField){
                //console.log(key);
                var makeFieldset = "<fieldset>" + "<legend>"+key.toUpperCase()+"</legend>";
                // use append use class = "calibration_step"
                var propertiesWithValueList = settingField[key];
                //console.log(propertiesWithValueList);
                //var valueList = $.parseJSON(propertiesWithValueList);
                function renderProperty(settingType,property,value,htmlString,callback){
                    //console.log("type: "+ key);
                    var html = "";
                    switch(settingType){
                        case "room":
                            if(property=="location"){
                            /*    html+= '<div class="properties"><h3>Location:</h3> X:' +
                                '<input type="number" style="max-width: 40px;"name="locationX" max="9" value="'+value.X+'" > ';
                                html+= 'Y:<input style="max-width: 40px;" type="number" name="locationY" max="9" value="'+value.Y+'" > ';
                                html+= 'Z:<input style="max-width: 40px;" type="number" name="locationZ" max="9" value="'+value.Z+'" > </div>';
                            */
                                return html;
                            }else if(property== "height"){
                                return html;
                            }else{
                                return html;
                            }
                            break;
                        case "pulse":
                            if(value == true) {
                               // console.log(property +" - " + value);
                                html = '<div class="properties"><h3>' + property + '</h3><div class="onoffswitch"> ' +
                                '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + property + '" checked="checked"> ' +
                                '<label class="onoffswitch-label" for="' + property + '"> ' +
                                '<span class="onoffswitch-inner"></span> ' +
                                '<span class="onoffswitch-switch"></span> ' +
                                '</label> ' +
                                '</div></div><br/>';
                                return html;
                                break;
                            }else{
                               // console.log(property +" - " + value);
                                html = '<div class="properties"><h3>' + property + '</h3><div class="onoffswitch"> ' +
                                '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + property + '" unchecked> ' +
                                '<label class="onoffswitch-label" for="' + property + '"> ' +
                                '<span class="onoffswitch-inner"></span> ' +
                                '<span class="onoffswitch-switch"></span> ' +
                                '</label> ' +
                                '</div></div><br/>';
                                return html;
                                break;
                            }

                        default:
                            console.log("Unknown Type "+ typeof(value));

                    }

                    //return html
                }
                for(var property in propertiesWithValueList){
                    //makeFieldset += property+" -- "+JSON.stringify(propertiesWithValueList[property]) + "<br/>";
                    makeFieldset += renderProperty(key,property,propertiesWithValueList[property]);
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
