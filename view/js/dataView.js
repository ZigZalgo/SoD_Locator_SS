/**
 * Created by ASE Lab on 15/07/14.
 */
var fileList = function () {
    $.getJSON("/filesList", function (response) {
        var filesList = document.getElementById("filesList");
        response.forEach(function(file){
                var option = document.createElement("option");
                option.text = file;
                $('select[name=filesList] option:eq(0)').attr('selected', 'selected');
            if(filesList!=null && filesList!=undefined){
                filesList.add(option);
            }
        })
    });
};