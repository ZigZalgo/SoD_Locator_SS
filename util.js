var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;


exports.normalizeAngle(value){
	if(value >= 0){
		return value % 360;
	}
	else{
		return (360 - Math.Abs(doublevalue % 360)) % 360;
	}
}

exports.translateFromCoordinateSpace(){
	// TODO: implement!
	// We will probably need this but we might need to re-implement it in a different way
}

exports.distanceBetweenPoints(a,b){
	return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Y - b.Y, 2) + Math.pow(a.Z - b.Z, 2));
}

exports.angleBetweenPoints(start, end){
	// TODO: implement!
	// We will probably need this but we might need to re-implement it in a different way
}

exports.getLinesOfDevice(device){

}