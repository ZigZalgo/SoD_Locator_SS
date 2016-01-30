/**
 * Created by yuxiw_000 on 10/26/2015.
 */

var MapInfo = {};
exports.MapInfo = MapInfo;
exports.registerTangoHandler = function(socket,deviceInfo,callback){
    
}
exports.overrideMapInfo = function(mapInfo,callback){
    MapInfo = mapInfo;
    console.log("Overwriting Map info: "+JSON.stringify(MapInfo));
}