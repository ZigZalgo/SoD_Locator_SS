var factory = require('./factory');
var locator = require('./locator');
var util = require('./util');
var Q = require('q');
var async = require('async');

exports.DEFAULT_FIELD_OF_VIEW = 25.0;
exports.KINECT_VIEW_RANGE = 28.5;               // not being used yet
exports.ROUND_RATIO         = 150;         // the round ratio for dealing with not accurate calculation

var RADIANS_TO_DEGREES = 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
exports.RADIANS_TO_DEGREES = RADIANS_TO_DEGREES;
exports.DEGREES_TO_RADIANS = DEGREES_TO_RADIANS;
var tolerance = 0.1;


/*
 take a location from sub-kinect and translate to the location to the MASTER kinect
 @param:
 location        -- the location of a point from the sub-kinect
 translateRules  -- the rules each sub-kinect has for translate the points in its plane to the MASTER-kinect
 @return:
 rotatedPoint    -- the translated location of point in the subKinect to the MASTER kinect
 */
exports.translateToCoordinateSpace = function (location, translateRules) {
    var vectorToStartingPoint = this.getVector(translateRules.startingLocation, location);
    var rotatedPoint = this.matrixTransformation(vectorToStartingPoint, translateRules.degree);
    rotatedPoint.X += translateRules.xDistance + translateRules.startingLocation.X;
    rotatedPoint.Z += translateRules.zDistance + translateRules.startingLocation.Z;
    return rotatedPoint;
};


/*
 Get translation rule for a sensor which is not from the master Kinect when doing calibration
 Since we are only considering 2D situation, Use dot product to get the angle between two sensor
 @param:
 startingLocation1   -- The location of the starting point observed by the MASTER kinect
 endingLocation1     -- The location of the ending point observed by the MASTER kinect
 startingLocation2   -- The location of the starting point observed by the sub-kinect
 endingLocation2     -- The location of the ending point observed by the sub-kinect
 @return:
 translationRules    -- returns an object contains:
 * angle           -- the angle between two sensors ("+" as clockwise, "-" as counter-clockwise)
 * x.Distance      -- the x distance between the point from sub-kinect to MASTER-kinect
 * z.Distance      -- the z distance between the point from sub-kinect to MASTER-kinect
 * startingLocation-- contains the location of the startingPoint of the sub-kinect
 */
exports.getTranslationRule = function (startingLocation1, endingLocation1, startingLocation2, endingLocation2) {
    //console.log("S1P1: " + JSON.stringify(startingLocation1) + "     S1P2: " + JSON.stringify(endingLocation1) + "    S2P1: " + JSON.stringify(startingLocation2) + "     S2P2: " + JSON.stringify(endingLocation2));
    return(setVariables(fixSign));

    function setVariables(cb) {
        var degreeBetweenVectors = util.getDegreeOfTwoVectors(util.getVector(startingLocation1, endingLocation1), util.getVector(startingLocation2, endingLocation2)); // using dot product
        var rotatedVector2 = util.matrixTransformation(util.getVector(startingLocation2, endingLocation2), degreeBetweenVectors);               // clockwise
        var counterRotatedVector2 = util.matrixTransformation(util.getVector(startingLocation2, endingLocation2), -degreeBetweenVectors);
        var rotatedVectorEndingLocation2 = util.matrixTransformation(endingLocation2, degreeBetweenVectors);
        //console.log("CALLING fixSign with degreeBetweenVectors = " + degreeBetweenVectors)
        return(cb(degreeBetweenVectors, rotatedVector2, counterRotatedVector2, rotatedVectorEndingLocation2));
    }

    function fixSign(degreeBetweenVectors, rotatedVector2, counterRotatedVector2, rotatedVectorEndingLocation2) {
        var spaceTransitionX;
        var spaceTransitionZ;
        if (Math.abs(rotatedVector2.X - util.getVector(startingLocation1, endingLocation1).X) < util.ROUND_RATIO && Math.abs(rotatedVector2.Z - util.getVector(startingLocation1, endingLocation1).Z) < util.ROUND_RATIO) {
            spaceTransitionX = (endingLocation1.X - rotatedVectorEndingLocation2.X);
            spaceTransitionZ = (endingLocation1.Z - rotatedVectorEndingLocation2.Z);
            return {
                degree: degreeBetweenVectors,
                xDistance: startingLocation1.X - startingLocation2.X,
                zDistance: startingLocation1.Z - startingLocation2.Z,
                xSpaceTransition: spaceTransitionX,
                zSpaceTransition: spaceTransitionZ,
                startingLocation: startingLocation2
            };
        }
        else if (Math.abs(counterRotatedVector2.X - util.getVector(startingLocation1, endingLocation1).X) < util.ROUND_RATIO && Math.abs(counterRotatedVector2.Z - util.getVector(startingLocation1, endingLocation1).Z) < util.ROUND_RATIO) {
            var counterRotatedVectorEndingLocation2 = util.matrixTransformation(endingLocation2, -degreeBetweenVectors);
            spaceTransitionX = (endingLocation1.X - counterRotatedVectorEndingLocation2.X);
            spaceTransitionZ = (endingLocation1.Z - counterRotatedVectorEndingLocation2.Z);
            return {
                degree: -degreeBetweenVectors,
                xDistance: startingLocation1.X - startingLocation2.X,
                zDistance: startingLocation1.Z - startingLocation2.Z,
                xSpaceTransition: spaceTransitionX,
                zSpaceTransition: spaceTransitionZ,
                startingLocation: startingLocation2
            };
        } else {
            console.log('Couldnot get rotation degree... Reselect Points.');
            return {
                degree: NaN,
                xDistance: startingLocation1.X - startingLocation2.X,
                zDistance: startingLocation1.Z - startingLocation2.Z,
                xSpaceTransition: spaceTransitionX,
                zSpaceTransition: spaceTransitionZ,
                startingLocation: startingLocation2
            };
        }
    }

};


//
exports.getSpaceTransitionRule = function (startingLocation1, endingLocation1, startingLocation2, endingLocation2, angle) {
    //var vectorBetweenSpace = {X:0,Y:0,Z:0};
// Using ending location points.
    //console.log("endingLocation1: "+ JSON.stringify(endingLocation1));
    var rotatedVectorEndingLocation2 = this.matrixTransformation(endingLocation2, angle);
    //console.log("rotated: " + JSON.stringify(rotatedVectorEndingLocation2));
    return testCallback(endingLocation1, rotatedVectorEndingLocation2);
    function testCallback(endingLocation1, rotatedVectorEndingLocation2) {
        var x = endingLocation1.X - rotatedVectorEndingLocation2.X;
        var z = endingLocation1.Z - rotatedVectorEndingLocation2.Z;
        //console.log('Z:'+JSON.stringify(z));
        var transition = {X: x, Y: 0, Z: z};
        return transition;
    }
};
/*exports.cb = function(stuffReturn){
    return stuffReturn;
}*/
/*
 get the vector from two points, since we are dealing with 2D space we only care about X and Z value of a location
 @param:
 locationA         -- the location of the starting point
 locationB         -- the location of the ending point
 @return:
 returnVector      -- return the vector of the two points
 */
exports.getVector = function (locationA, locationB) {
    return {X: locationB.X - locationA.X, Y: 0, Z: locationB.Z - locationA.Z};
    //typeof callback === 'function' && callback();
};


/*
 use dot product to calculate the degree between two vectors
 @param:
 vector1             -- first vector
 vector2             -- second vector
 @return:
 returnDegrees       -- The degree between two vectors
 */
exports.getDegreeOfTwoVectors = function (vector1, vector2) {
    var vector1length = Math.sqrt(Math.pow(vector1.X, 2) + Math.pow(vector1.Z, 2));
    var vector2length = Math.sqrt(Math.pow(vector2.X, 2) + Math.pow(vector2.Z, 2));
    var v1MulV2 = vector1.X * vector2.X + vector1.Z * vector2.Z;
    //var returnDegree = Math.atan2(vector1length,vector2length) * RADIANS_TO_DEGREES;;

    return Math.acos(v1MulV2 / (vector1length * vector2length)) * RADIANS_TO_DEGREES; // Dot product
};

/*
 Matrix CLOCKWISE transformation ,
 given point(x,y) and rotation angle A, return (x',y') after transformation.
 @param:
 personLocation   -- location contains x,y,z value of a point, we are going to use x,z since
 we are dealing with 2D-dimension
 angle            -- Rotation angle
 @return:
 returnLocation   -- location after transformation
 */
exports.matrixTransformation = function (personLocation, angle, callback) {
    var returnLocation = {X: 0, Y: 0, Z: 0};
    var returnX = personLocation.X * Math.cos(angle * DEGREES_TO_RADIANS) + personLocation.Z * Math.sin(angle * DEGREES_TO_RADIANS);
    var returnZ = personLocation.Z * Math.cos(angle * DEGREES_TO_RADIANS) - (personLocation.X * Math.sin(angle * DEGREES_TO_RADIANS));
    returnLocation.X = Math.round(returnX * this.ROUND_RATIO) / this.ROUND_RATIO;
    returnLocation.Z = Math.round(returnZ * this.ROUND_RATIO) / this.ROUND_RATIO;
    if(callback != undefined){
        try{
            callback(returnLocation);
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }
    return returnLocation; // for testing
};

// Tested!
exports.normalizeAngle = function (value) {
    if (value >= 0) {
        return value % 360;
    }
    else {
        return (360 - Math.abs(value % 360)) % 360;
    }
};

// Tested!
exports.distanceBetweenPoints = function (a, b) {
    // We implemented this to handle the 2D case
    // In the Kinect coordinate space, the Y is the height axis so we are
    // only considering X and Z coordinates when finding the distance.

    // We are still passing a 3D point, however, as it will make migrating
    // to 3D easier.

    // We check whether the points are in 2D or 3D and do the
    // calculations accordingly
    //console.log('request: ' + JSON.stringify(a) + ' b: '+ JSON.stringify(b));
    if (a.Z == null) {
        return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Y - b.Y, 2));
    }
    else {
        return Math.sqrt(Math.pow(a.X - b.X, 2) + Math.pow(a.Z - b.Z, 2));
    }
};

// Tested!
exports.angleBetweenPoints = function (start, end) {
    // We implemented this to handle the 2D case
    // In the Kinect coordinate space, the Y is the height axis so we are
    // only considering X and Z coordinates when finding the distance.

    // We are still passing a 3D point, however, as it will make migrating
    // to 3D easier.
    var unnormalizedDegrees = Math.atan2(end.Z - start.Z, end.X - start.X) * RADIANS_TO_DEGREES;
    return this.normalizeAngle(unnormalizedDegrees);
};

// function that check if a point is in inside of an rectangle

exports.isInRect = function(objectLocation,observerLocation,width,height,fn){
    if(objectLocation.X<=(observerLocation.X - width/2)||(objectLocation.X >=observerLocation.X+width/2)||
        (objectLocation.Z<=(observerLocation.Z - height/2)) || objectLocation.Z >= (observerLocation.Z + height/2)){
        if(fn!=undefined){
            fn(false)
        }
        return false;

    }else{
        //console.log("object:"+JSON.stringify(objectLocation)+" observer: "+JSON.stringify(observerLocation) + " width: "+width+" height: "+JSON.stringify(height));
        if(fn!=undefined){
            fn(true)
        }
        return true;
    }
};


// get the intersection point from four walls, value passed into callback
exports.getIntersectedWall = function(observer,callback){
    // get translation rule
    util.translateOrientationToReference(observer,
        function(orientationToReference){
            //console.log("To reference: "+ orientationToReference);
        var room = locator.room;
        var observerSight = factory.makeLineUsingOrientation(observer.location, orientationToReference);
        var top = factory.makeLineUsingPoints(locator.room.walls.top.startingPoint,locator.room.walls.top.endingPoint);
        var left = factory.makeLineUsingPoints(locator.room.walls.left.startingPoint,locator.room.walls.left.endingPoint);
        var right = factory.makeLineUsingPoints(locator.room.walls.right.startingPoint,locator.room.walls.right.endingPoint);
        var bottom = factory.makeLineUsingPoints(locator.room.walls.bottom.startingPoint,locator.room.walls.bottom.endingPoint);
        // process all fource walls, try to get intersection in XZ space
        async.parallel([
            function(paCallback){
                util.getIntersectionPoint(observerSight,top).then(function(data){
                    //console.log("haha"+JSON.stringify(data));
                    //console.log("TOP: "+ JSON.stringify(top));
                    paCallback(null,{intersectedPoint:data,side:'top'});
                })
            },function(paCallback){
                util.getIntersectionPoint(observerSight,left).then(function(data){
                    paCallback(null,{intersectedPoint:data,side:'left'});
                })
            },function(paCallback){
                util.getIntersectionPoint(observerSight,right).then(function(data){
                    paCallback(null,{intersectedPoint:data,side:'right'});
                })
            },function(paCallback){
                util.getIntersectionPoint(observerSight,bottom).then(function(data){
                    paCallback(null,{intersectedPoint:data,side:'bottom'});
                })
            }
        ],function(err,results){
            //console.log("*****");
            if(callback!=undefined){
                var intersectedPoints=[];
                results.forEach(function(result){
                    if(result.intersectedPoint!=null){
                        intersectedPoints.push(result);
                    }
                })
                //console.log("intersectedPoints YO: "+JSON.stringify(intersectedPoints));
                // if there are multiple intersection point, due to there are four walls and in line
                if(intersectedPoints.length>1){
                    // check if the intersection point is in the view of the device orientation
                    //console.log("2 int with observer:" + JSON.stringify(observer));

                    // start water fall to get the proper intersection points
                    async.waterfall([
                        function(WFCallback){

                            /*   There has to be one that is in the FOV of device orientation
                             *
                             *   callbackLock - This variable lock the waterfall callback. Since we may get two intersection point from the
                             *          From the corner of the room. And both of the intersection points will be in the view the device.
                             *          So we use this variable to lock the callback for current process.
                             * */
                            var callbackLock = false;

                            intersectedPoints.forEach(function(intPoint){
                                //console.log("intPoint:" + JSON.stringify(intPoint));
                                //console.log("observer:" + JSON.stringify(observer));

                                util.isPointInView(intPoint.intersectedPoint,observer,function(isInView){
                                    //console.log(isInView);
                                    if(isInView&&callbackLock==false){
                                        callbackLock=true;  // lock the callback to prevent multiple callback being invoked
                                        WFCallback(null,intPoint)
                                    }
                                    //if the point location is inView
                                })
                            })
                        },
                        function(intPoint,WFCallback){
                            //console.log("intPoint:" + JSON.stringify(intPoint));
                            // once we get the intersectionPoint in FOV, we get the Y intersection value from pitch
                            if(intPoint!=null) {
                                util.getDistanceOfTwoLocation(observer.location, intPoint.intersectedPoint, function (XZProjection) {
                                    var intersectionY = Math.tan(observer.orientation.pitch * DEGREES_TO_RADIANS) * XZProjection + parseFloat(observer.location.Y);
                                    //console.log("Y: "+intersectionY + "room.location.Y"+room.location.Y+"room.height"+room.height);
                                    if (intersectionY > (room.location.Y + room.height) ||
                                        intersectionY < (room.location.Y)) {
                                        WFCallback(null, null);
                                    } else {
                                        intPoint.intersectedPoint.Y = intersectionY;
                                        WFCallback(null, intPoint)
                                    }
                                })
                            }else {
                                WFCallback(null,null);
                            }
                        }

                    ],function(err,result){
                        //console.log("result: " , JSON.stringify(result))
                        //console.log("callback1");
                        callback(result);
                    })
                }else{
                    // if there is only one intersection point , we double check if the point is in view
                    util.isPointInView(intersectedPoints[0].intersectedPoint,observer,function(isInView){
                        if(isInView){
                            // if the point is inView we callback with the Y interesection value of data
                            util.getDistanceOfTwoLocation(observer.location,intersectedPoints[0].intersectedPoint,function(XZProjection){
                                var intersectionY = Math.tan(observer.orientation.pitch*DEGREES_TO_RADIANS)*XZProjection+observer.location.Y;
                                if(intersectionY>(room.location.Y+room.height)||
                                    intersectionY<(room.location.Y)){
                                    //console.log("callback2");
                                    callback(null);
                                }else{
                                    intersectedPoints[0].intersectedPoint.Y = intersectionY;
                                    //console.log("callback3");
                                    callback(intersectedPoints)
                                }
                            })
                        }else{
                            //console.log("callback");
                            callback(null);
                        }
                    })
                    // if we get one intersection points from the walls, check if it's in front
                }
            }
        })
    })

}
// in 2D
exports.pointMoveToDirection = function(locationOfPoint, moveDirectionVector, distance,callback){
    util.getDistanceOfTwoLocation({X:0,Y:0,Z:0},moveDirectionVector,function(result){
        //console.log("vector distance: "+result+"\t direction: "+JSON.stringify(moveDirectionVector));

        var ratioToDistance = distance/result;

        // handles the case when the location is not a number
        var xMovedTo = parseFloat(locationOfPoint.X)+parseFloat(ratioToDistance*moveDirectionVector.X);
        var zMovedTo = parseFloat(locationOfPoint.Z)+parseFloat(ratioToDistance*moveDirectionVector.Z);
        //console.log(xMovedTo+" type: "+typeof(xMovedTo));
        callback({
            X:xMovedTo,
            Y:Number(locationOfPoint.Y),
            Z:zMovedTo
        });
    })
}


// check if objectLocation is in the room
exports.inRoom = function(objectLocation,callback){
    var room = locator.room;
    //since room is a rect we use inRect to check if the object is on the roof or ceiling
    if(objectLocation.Y > room.height||objectLocation.Y<0){
        callback(false);
    }else{
        util.isInRect(objectLocation,room.location,room.length,room.depth,function(bool){
            callback(bool);
        });
    }
}


// Tested!
exports.getIntersectionPoint = function (line1, line2) {
    //if lines are parallel
    var isGreater = util.isGreater;
    var isLess = util.isLess;
    return calculatePossibleInt(line1,line2).then(
        function(IntersectionPoint){
            if (line1.isLineSegement) {
                if (((IntersectionPoint.X > line1.startPoint.X+tolerance) && (IntersectionPoint.X > line1.endPoint.X+tolerance)) ||
                    ((IntersectionPoint.X < line1.startPoint.X-tolerance) && (IntersectionPoint.X < line1.endPoint.X-tolerance)) ||
                    ((IntersectionPoint.Z > line1.startPoint.Z+tolerance) && (IntersectionPoint.Z > line1.endPoint.Z+tolerance)) ||
                    ((IntersectionPoint.Z < line1.startPoint.Z-tolerance) && (IntersectionPoint.Z < line1.endPoint.Z-tolerance)))
                {return Q(null)}else{return Q(IntersectionPoint)};
            }else{return Q(IntersectionPoint)}
        },function(error){console.log(error)}).
        then(function(IntersectionPoint){
            if (line2.isLineSegment) {
                if (((IntersectionPoint.X > line2.startPoint.X+tolerance) && (IntersectionPoint.X > line2.endPoint.X+tolerance)) ||
                    ((IntersectionPoint.X < line2.startPoint.X-tolerance) && (IntersectionPoint.X < line2.endPoint.X-tolerance)) ||
                    ((IntersectionPoint.Z > line2.startPoint.Z+tolerance) && (IntersectionPoint.Z > line2.endPoint.Z+tolerance)) ||
                    ((IntersectionPoint.Z < line2.startPoint.Z-tolerance) && (IntersectionPoint.Z < line2.endPoint.Z-tolerance)))
                {return Q(null)}else {return Q(IntersectionPoint)}}
            else {return Q(IntersectionPoint)}
        },function(error){console.log(error)})

};

function calculatePossibleInt(line1,line2){
    var IntersectionPoint = null;
    //console.log("\n->\t"+JSON.stringify(line1)+"\n"+JSON.stringify(line2)+"\n\n");
   if (line1.isVerticalLine && line2.isVerticalLine || line1.slope == line2.slope)
        return null;
    else if (line1.isVerticalLine) {
        var yValue = line2.slope * line1.x + line2.zIntercept;
        IntersectionPoint = factory.make2DPoint(line1.x, yValue);
       return Q(IntersectionPoint);
    }
   else if (line2.isVerticalLine) {
       var yValue = line1.slope * line2.x + line1.zIntercept;
       IntersectionPoint = factory.make2DPoint(line2.x, yValue);
       return Q(IntersectionPoint);
   }
   else {
       var xValue = (line2.zIntercept - line1.zIntercept) / (line1.slope - line2.slope);
       var yValue = 0;
       //console.log(line2.zIntercept + " - " + line1.zIntercept + ' / ' + line1.slope + ' - ' + line2.slope );
       var zValue = line1.slope * xValue + line1.zIntercept;
       //console.log(" Y: " + zValue + " X:" +xValue);
       IntersectionPoint = {X:xValue,Y: yValue,Z:zValue};
   }
    return Q(IntersectionPoint);


    /*
    * var IntersectionPoint = null;
     if (line1.isVerticalLine && line2.isVerticalLine || line1.slope == line2.slope)
     return null;
     else if (line1.isVerticalLine) {
     var yValue = line2.slope * line1.x + line2.zIntercept;
     IntersectionPoint = factory.make2DPoint(line1.x, yValue);
     }
     else if (line2.isVerticalLine) {
     var yValue = line1.slope * line2.x + line1.zIntercept;
     IntersectionPoint = factory.make2DPoint(line2.x, yValue);
     }
     else {
     var xValue = (line2.zIntercept - line1.zIntercept) / (line1.slope - line2.slope);
     var yValue = 0;
     //console.log(line2.zIntercept + " - " + line1.zIntercept + ' / ' + line1.slope + ' - ' + line2.slope );
     //console.log(" Y: " + yValue + "pitch: "+ );
     var zValue = line1.slope * xValue + line1.zIntercept;
     IntersectionPoint = {X:xValue,Y: yValue,Z:zValue};
     }
     return Q(IntersectionPoint);
     */
}
// Tested!
exports.isGreater = function (num1, num2) {
    var answer = num1 - num2;
    answer = Math.round(answer * 1000) / 1000;
    //console.log("answer:  " + answer);
    if (answer > 0) {
        return true;
    }
    return false;
};

// Tested!
exports.isLess = function (num1, num2) {
    var answer = num1 - num2;
    answer = Math.round(answer * 1000) / 1000;
    if (answer < 0) {
        return true;
    }
    return false;
};

// Tested!
exports.getLinesOfShape = function (device) {
    var returnLines = [];
    var corners = this.getCornersOfShape(device);
    //onsole.log("corners -> "+ JSON.stringify(corners));
    try {
        var topSide = factory.makeLineUsingPoints(corners[0], corners[1]);
        var rightSide = factory.makeLineUsingPoints(corners[1], corners[2]);
        var bottomSide = factory.makeLineUsingPoints(corners[2], corners[3]);
        var leftSide = factory.makeLineUsingPoints(corners[3], corners[0]);
        returnLines.push(topSide);
        returnLines.push(rightSide);
        returnLines.push(bottomSide);
        returnLines.push(leftSide);
        //console.log(returnLines[0].startPoint);
        return returnLines;
    }

    catch (err) {
        // Device does not have a location
        // This will return an empty list
        // console.log('Device must have a location');
        return returnLines;
    }


};

/*
    get the orientation of a person based on X value of the person
    @param:
            personX         -- X position of the person
            personZ         -- Z position of the person
    @return:
            returnDegree    -- degree value of orientation (+/- KINECT_VIEW_RANGE)
*/
exports.getObjectOrientationToSensor = function (personX, personZ,callback) {
    var angleTowardsKinect = Math.atan2(personX, personZ);
    var returnDegree = angleTowardsKinect * RADIANS_TO_DEGREES;
    if(callback != undefined){
        try{
            callback(returnDegree);
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }
    return returnDegree;
};

/*
*   Translate Orientation of a device to a reference space
* */
exports.translateOrientationToReference = function(device,callback){
    if(device!=undefined && device.location!=undefined) {
        this.getObjectOrientationToSensor(device.location.X,device.location.Z,function(orientationToSensor){
            //console.log('Get orientation to Kinect: '+ (orientationToSensor+device.orientation));
            if(callback != undefined){
                try{
                    callback(-(90+(orientationToSensor+device.orientation.yaw)));
                }catch(e){
                    console.log(' error in callback: '+ e);
                }
            }else{
                //callback is empty
            }
        });
    }else{
        console.log('device is not defined in translateOrietationToReference: '+JSON.stringify(device));
    }
};
/*
 get Distance from person to kinect
 @param:
        personX         -- X position of the person
        personZ         -- Z position of the person
 @return:
        returnDistance    -- Distance value of orientation
 */
exports.getDistanceToKinect = function (personX, personZ) {
    var returnDistance = Math.sqrt(personX * personX + personZ * personZ);
    return returnDistance;
};

/*
* Get a observerLocation of a object with orientation and observer (such as device objects)
* */
exports.getObserverLocation = function(objectWithObserver){
    var actualOrientation = 360 - (objectWithObserver.orientation.yaw + util.getObjectOrientationToSensor(objectWithObserver.location.X,objectWithObserver.location.Z) + 90+ objectWithObserver.FOV/2);
    var rotatedDirection = util.matrixTransformation({X:objectWithObserver.observer.observerDistance,Y:0,Z:0},-(actualOrientation+objectWithObserver.FOV/2));
    var observerLocation = {X:rotatedDirection.X+objectWithObserver.location.X,Y:rotatedDirection.Y+objectWithObserver.location.Y,Z:rotatedDirection.Z+objectWithObserver.location.Z};
    return observerLocation;
}


// Tested!
exports.getCornersOfShape = function (device,callback) {
    var returnPoints = [];
    var intPoints = [];
    try {
        var deviceLocation = device.location;

        intPoints.push(factory.make2DPoint(deviceLocation.X + device.width / 2, deviceLocation.Z + device.depth / 2));
        intPoints.push(factory.make2DPoint(deviceLocation.X + device.width / 2, deviceLocation.Z - device.depth / 2));
        intPoints.push(factory.make2DPoint(deviceLocation.X - device.width / 2, deviceLocation.Z - device.depth / 2));
        intPoints.push(factory.make2DPoint(deviceLocation.X - device.width / 2, deviceLocation.Z + device.depth / 2));
    }
    catch (err) {
        // Device does not have a location
        // This will return an empty list
        // console.log('Error: Device must have a location!');
        return returnPoints;
    }

    var angle = 0;

    if (device.orientation != null) {
        // This will help when we consider sending to moving devices that change its
        // orientation dynamically. The choice of 270 is for consistency with the
        // current code that handles the special case of a tabletop facing away
        // from the kinect
        angle = device.orientation - 90;
        angle = angle * DEGREES_TO_RADIANS;
    }

    else {
        // No changes necessary
        return intPoints;
    }

    /*intPoints.forEach(function (point) {
        var xValue = (point.X - deviceLocation.X) * Math.cos(angle) - (point.Y - deviceLocation.Z) * Math.sin(angle) + deviceLocation.X;
        var yValue = (point.Y - deviceLocation.Z) * Math.cos(angle) + (point.X - deviceLocation.X) * Math.sin(angle) + deviceLocation.Z;
        var newPoint = factory.make2DPoint(xValue, yValue);
        returnPoints.push(newPoint);
    });*/
    returnPoints = intPoints;
    //console.log("points -> "+ JSON.stringify(intPoints));

    if(callback != undefined){
        try{
            callback(returnPoints);
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }

    return returnPoints;
};

/**/
exports.intersectionOnDevice = function(intersection,corners){
    return Q(corners);
}

// Tested!
exports.GetRatioPositionOnScreen = function (target, intersection,callback) {
    var cornersOfShape = this.getCornersOfShape(locator.devices[target]);
    if (cornersOfShape.length < 1) {
        // Device does not have a location
        return factory.make2DPoint(-1, -1);
    }
    //console.log(intersection)
    var distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[0]);
    var distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[1]);
    var distance3 = this.distanceBetweenPoints(cornersOfShape[0], cornersOfShape[1]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var xRatio = 1;
        var yRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }

    distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[2]);
    distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[1]);
    distance3 = this.distanceBetweenPoints(cornersOfShape[1], cornersOfShape[2]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var yRatio = 1;
        var xRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }

    distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[3]);
    distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[2]);
    distance3 = this.distanceBetweenPoints(cornersOfShape[2], cornersOfShape[3]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var xRatio = 0;
        var yRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }

    distance1 = this.distanceBetweenPoints(intersection, cornersOfShape[3]);
    distance2 = this.distanceBetweenPoints(intersection, cornersOfShape[0]);
    distance3 = this.distanceBetweenPoints(cornersOfShape[3], cornersOfShape[0]);
    if (Math.abs(distance3 - (distance1 + distance2)) < 0.01) {
        var yRatio = 0;
        var xRatio = distance1 / distance3;
        return factory.make2DPoint(xRatio, yRatio);
    }
    return factory.make2DPoint(-1, -1);
};

// TODO: implement!
// TODO: test!
exports.translateFromCoordinateSpace = function () {
    // TODO: implement!
    // Leave until we have multiple Kinects. Otherwise, use the Kinect coordinate space
    // We will probably need this but we might need to re-implement it in a different way
};

exports.findWithAttr = function (array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
};

exports.findWithAttrWeak = function (array, attr, query) {
    for (var i = 0; i < array.length; i += 1) {
        if (JSON.stringify(array[i][attr]).indexOf(JSON.stringify(query)) != -1) {
            return i;
            //console.log("returned: ");
        }
    }
};

exports.findKeyByValue = function(JSONObject, value){
    var found = false;
    if(typeof(JSONObject) == "object"){
        async.each(Object.keys(JSONObject),function(objKey,itrCallback){
            if(JSONObject[objKey] == value){
                found = objKey;
                itrCallback();
            }else{
                itrCallback();
            }
        },function(err){
            return found;
        })
    }else{
        console.log("can not search through non JSON");
        return found;
    }
}

exports.findKeyWithAttr = function(obj,value){
	if(typeof(obj) == "object"){
		for(var key in obj){
			//console.log('actually finding the key!!!!!!!!!!!!');
			if(obj[key] == value){
				return key;
			}
		}
		return null;
	}else{
		console.log("can not search through non object");
		return null;
	}
}
exports.getDeviceSocketIDByID = function (ID) {
    var counter = Object.keys(locator.devices).length;

    for (var key in locator.devices) {
        counter--;
        if (locator.devices.hasOwnProperty(key)) {
            if (ID == locator.devices[key].uniqueDeviceID) {
                return key;
            }
            else {
                if (counter == 0) {
                    return undefined;
                }
            }
        }
    }
};

exports.filterDevices = function(socket, request){
    //console.log('request-> '+ JSON.stringify(request) );
    if(request.selection == undefined || request.selection == null || request.selection[0] == undefined || request.selection[0] == null){
        return(locator.devices)
    }
    else{
        var filterSelection = function (i, listDevices) {
            //console.log(i);
            if (i <= (request.selection.length - 1)) {
                var regex = /([a-zA-Z ]+)([0-9\.]*).*?$/
                var result = request.selection[i].match(regex);
                var selectionType = result[1];
                var selectionParam = result[2];
                //console.log("filter #" + i + ": " + request.selection[i])
                //console.log(listDevices);
                switch (selectionType) {
                    case "all":
                        return filterSelection(i + 1, (listDevices)); //just in case
                        break;
                    case "allExclusive":
                        return filterSelection(i + 1, (locator.getAllDevicesExceptSelf(socket, listDevices)));
                        break;
                    case "inView":
                        return filterSelection(i + 1, locator.getDevicesInView(socket.id, listDevices));// locator.calcIntersectionPointsForDevices(socket.id, locator.getDevicesInFront(socket.id, listDevices)));
                        break;
                    case "paired":
                        return filterSelection(i + 1, locator.getPairedDevice(listDevices));
                        break;
                    case "inRange":
                        //return filterSelection(i+1, locator.getDevicesWithinRange(locator.devices[socket.id], listDevices));
                        return filterSelection(i + 1, locator.getDevicesWithinRange(locator.devices[socket.id], selectionParam, listDevices));
                        break;
                    case "nearest":
                        return filterSelection(i + 1, locator.getNearestDevice(locator.devices[socket.id], listDevices));
                        break;
                    case "single":
                        return filterSelection(i + 1, locator.getDeviceByID(selectionParam));
                        break;
                    default:
                        return filterSelection(i + 1, (listDevices)); //just in case
                }
            }
            else {
                return(listDevices);
            }
        }
        return (filterSelection(0, locator.devices));
    }
}

//delete related key item in a list and its sublist
exports.recursiveDeleteKey = function(list,keyForDelete){
    //console.log("Looking for "+keyForDelete + "");
    for(var key in list){
        //console.log(key);
        for(var subListKey in list[key]){
            if(subListKey == keyForDelete){
                console.log("deleted -> "+subListKey+" from "+key +" list");
                delete list[key][subListKey];
                return Q(key);
            }
        }
    }
}


/*
*   Handles the callbacks of SOD
* */
exports.callbackHandler= function(callback){
    if(callback != undefined){
        try{
            callback();
        }catch(e){
            console.log(' error in callback: '+ e);
        }
    }else{
        //callback is empty
    }
}

exports.getNearest = function(subject,objectList,functionCallback){
    var nearestDistance = 1000,nearestObject = null;
    // use async.each handle callback after everything is done.
    async.eachSeries(Object.keys(objectList),function(index,itrCallback){
        //console.log(index);
        //console.log("\t"+JSON.stringify(subject)+"\n\t"+ JSON.stringify(objectList[index]));
        util.getDistanceOfTwoLocation(subject.location,objectList[index].location,function(distance){
            if(distance<nearestDistance){
                nearestDistance = distance;
                nearestObject = objectList[index];
                itrCallback();
            }else{
                itrCallback();
            }

        })
    },function(err){
        // if any of the file processing produced an error, err would equal that error
        if( err ) {
            // One of the iterations produced an error.
            // All processing will now stop.
            console.log('A person failed to process');
        } else {
            console.log('All persons were processed successfully');
            functionCallback({nearestObject: nearestObject,distance:nearestDistance});
        }
    })
}

// Round up with decimal value
exports.mathRoundWithDecimal = function(input, decimal){
    return Math.round(input*Math.pow(10,decimal))/Math.pow(10,decimal);
}
exports.getDistanceOfTwoLocation = function(location1,location2,fn){
    if(location1.X!=undefined && location2.Z!= undefined) {
        fn(Math.sqrt(
                (location1.X - location2.X) * (location1.X - location2.X)
                +
                (location1.Z - location2.Z) * (location1.Z - location2.Z))
        );
    }else{
        console.log("   *Distance is not defined");
        fn(null);
    }
}


exports.isPointInView = function(pointLocation,observer,callback){
    // List<Device> returnDevices = new List<Device>();
    var returnDevices = {};
    //console.log("Observer: "+ JSON.stringify(observer));
    //console.log(observerSocketID + ' - ' + JSON.stringify(deviceList));
    //(CB - Should we throw an exception here? Rather then just returning an empty list?)
    if(observer!=undefined) {
        if (observer.orientation != undefined) { // check if observer orientation is null
            function filterFOV(observer, deviceList) {
                try {
                    if (observer.location == null || observer.orientation.yaw == null)
                        return returnDevices;
                    if (observer.FOV == 0.0)
                        return returnDevices;
                    if (observer.FOV == 360.0) {
                        return Object.keys(deviceList).filter(function (key) {
                            if (deviceList[key] != observer && deviceList[key].location != undefined) {
                                return true;
                            }
                        })
                    }
                }
                catch (err) {
                    console.log("Error getting devices in front of device FOV/Location" + ": " + err);
                }

            }
            // // We imagine the field of view as two vectors, pointing away from the observing device. Targets between the vectors are in view.
            // // We will use angles to represent these vectors.
            try {
                //console.log("FOV: "+observer.FOV);
                if(observer.FOV==undefined){
                    console.log("Observer FOV undefined");
                    callback(false);
                }
                //get the angle to sens
                var angleToSensor = util.getObjectOrientationToSensor(observer.location.X, observer.location.Z);
                var leftFieldOfView = util.normalizeAngle(360 - observer.orientation.yaw - 90 - angleToSensor + (observer.FOV / 2));
                var rightFieldOfView = util.normalizeAngle(360 - observer.orientation.yaw - 90 - angleToSensor - (observer.FOV / 2));

                //console.log("Left FOV = " + leftFieldOfView)
                //console.log("Right FOV = " + rightFieldOfView)
                //console.log("Point of interest: "+JSON.stringify(pointLocation));

                if (pointLocation!=undefined) {
                    if (leftFieldOfView > rightFieldOfView){
                        if(((util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView) &&
                            ((util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView))
                        {
                            //console.log("YES1");
                            callback(true)
                            return true;
                        }else{
                            //console.log("NO1");
                            callback(false);
                        }
                    }
                    else if (leftFieldOfView < rightFieldOfView) {
                        if ((util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView ||
                            (util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView) {
                            //console.log("YES2");
                            callback(true)
                            return true;
                        }else{
                            //console.log("NO2");
                            callback(false);
                        }
                    }
                }
                /*return function(){
                    //var angle = util.normalizeAngle(Math.atan2(devices[key].location.Y - observer.location.Y, devices[key].location.X - observer.location.X) * 180 / Math.PI);
                    if (pointLocation!=undefined) {
                        if (leftFieldOfView > rightFieldOfView &&
                            (util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView &&
                            (util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView) {
                            return true;
                        }
                        else if (leftFieldOfView < rightFieldOfView) {
                            if ((util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) < leftFieldOfView ||
                                (util.normalizeAngle(Math.atan2(pointLocation.Z - observer.location.Z, pointLocation.X - observer.location.X) * 180 / Math.PI)) > rightFieldOfView) {
                                return true;
                            }
                        }
                    }
                }();*/
            }
            catch (err) {
                console.log("Error getting devices in front of device " + ": " + err);
            }
        } else { // end of checking observer orientation
            console.log("observer " + JSON.stringify(observer)+ " orientation is null.");
        }
    }else{
        console.log("Observer is undefined in get Devices in front");
    }
}