var util = require('../locatorServices/util');
var factory = require('../locatorServices/factory');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

describe("util.getSpaceTransitionRule()", function() {
    // starting and ending point for each kinect sensor sees the same project
    var startingLocation1 = {X:2*1000 ,Y:0 ,Z:3*1000};
    var endingLocation1   = {X:4*1000, Y:0, Z:1*1000};
    var startingLocation2 = {X:-(5/Math.sqrt(2))*1000 ,Y:0 ,Z:(5/Math.sqrt(2))*1000};
    var endingLocation2   = {X:-(1/Math.sqrt(2))*1000, Y:0, Z:(5/Math.sqrt(2))*1000};



    var expectedResult = {X:2*1000,Y:0,Z:-2*1000}
    var angle = 45;
    it("testing Final Result of getSpaceTransitionRule  X", function(){
        expect(util.getSpaceTransitionRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2,angle).X).to.be.closeTo(expectedResult.X,0.000001);
    });

    it("testing Final Result of getSpaceTransitionRule  Z", function(){
        expect(util.getSpaceTransitionRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2,angle).Z).to.be.closeTo(expectedResult.Z,0.000001);
    });

    /*it("testing Final Result of getTranslationRule", function(){
     expect(util.getTranslationRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2)).
     to.eql({degree:-29.133,xDistance:-186,
     zDistance:-156,startingLocation:startingLocation2}); // objects equal
     });*/
});

// Testing Sample From Kinect
/*describe("util.getTranslationRule()", function() {
    // starting and ending point for each kinect sensor sees the same project
    var startingLocation1 = {X:652.1 ,Y:0 ,Z:2056};
    var endingLocation1   = {X:494.2, Y:0, Z:3555};
    var startingLocation2 = {X:117.3 ,Y:0 ,Z:3873};
    var endingLocation2   = {X:-858.2, Y:0, Z:2994};

    it(" Byye testing Final Result of getTranslationRule", function(){
        expect(util.getTranslationRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2)).
            to.eql({degree:0,xDistance:0,
                zDistance:0,xSpaceTransition:0,zSpaceTransition: 1732.0533333333333,startingLocation:startingLocation2}); // objects equal
    });
*/
/*
    it("testing the calculation inside of getTranslationRule() for vector1)", function(){
        expect(util.getVector(startingLocation1,endingLocation1)).to.eql({X:Math.sqrt(3)*1000,Y:0,Z:1*1000}); // objects equal
    });
    var vector1 = util.getVector(startingLocation1,endingLocation1);

    it("testing the calculation inside of getTranslationRule() for vector2)", function(){
        expect(util.getVector(startingLocation2,endingLocation2)).to.eql({X:Math.sqrt(3)*1000,Y:0,Z:-1*1000}); // objects equal
    });
    var vector2 = util.getVector(startingLocation2,endingLocation2);

    it("testing the calculation inside of getTranslationRule() between degrees of vector1 & vector2)", function(){
        expect(util.getDegreeOfTwoVectors(vector1,vector2)).to.be.closeTo(60,0.00001); // objects equal
    });
    var degree = util.getDegreeOfTwoVectors(vector1,vector2);
    it("testing the matrixTransformation inside of getTranslationRule() )", function(){
        expect(util.matrixTransformation(vector2,degree).Z).to.eql(-2000); // objects equal
    });
*//*
    it("testing Final Result of getTranslationRule", function(){
        expect(util.getTranslationRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2)).
            to.eql({degree:-29.133,xDistance:-186,
                zDistance:-156,startingLocation:startingLocation2}); // objects equal
    });*/
//});


describe("util.getTranslationRule() standarded example", function() {
    // starting and ending point for each kinect sensor sees the same project
    var startingLocation1 = {X:1000 ,Y:0 ,Z:1000};
    var endingLocation1   = {X:(1+Math.sqrt(3))*1000, Y:0, Z:2000};
    var startingLocation2 = {X:-2000 ,Y:0 ,Z:2000};
    var endingLocation2   = {X:(-2+Math.sqrt(3))*1000, Y:0, Z:1000};

    it("testing the calculation inside of getTranslationRule() for vector1)", function(){
        expect(util.getVector(startingLocation1,endingLocation1)).to.eql({X:Math.sqrt(3)*1000,Y:0,Z:1*1000}); // objects equal
    });
    var vector1 = util.getVector(startingLocation1,endingLocation1);

    it("testing the calculation inside of getTranslationRule() for vector2)", function(){
        expect(util.getVector(startingLocation2,endingLocation2)).to.eql({X:Math.sqrt(3)*1000,Y:0,Z:-1*1000}); // objects equal
    });
    var vector2 = util.getVector(startingLocation2,endingLocation2);

    it("testing the calculation inside of getTranslationRule() between degrees of vector1 & vector2)", function(){
        expect(util.getDegreeOfTwoVectors(vector1,vector2)).to.be.closeTo(60,0.00001); // objects equal
    });
    var degree = util.getDegreeOfTwoVectors(vector1,vector2);
    it("testing the matrixTransformation inside of getTranslationRule() )", function(){
        expect(util.matrixTransformation(vector2,degree).Z).to.eql(-2000); // objects equal
    });

    it("testing Final Result of getTranslationRule in (1,1)-(1+sqt[3],2) (-2,2)-(-2+sqt[3],1)", function(){
        expect(util.getTranslationRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2)).
            to.eql({degree:-degree,xDistance:3000,
                zDistance:-1000,xSpaceTransition: 3732.050807568877,zSpaceTransition: 1732.0533333333333,startingLocation:startingLocation2}); // objects equal
    });
});

describe("util.translateToCoordinateSpace()", function() {
    var startingLocation1 = {X:1*1000 ,Y:0 ,Z:1*1000};
    var endingLocation1   = {X:(1+Math.sqrt(3))*1000, Y:0, Z:2*1000};
    var startingLocation2 = {X:-2*1000 ,Y:0 ,Z:2*1000};
    var endingLocation2   = {X:(-2+Math.sqrt(3))*1000, Y:0, Z:1*1000};

    var rule = util.getTranslationRule(startingLocation1,endingLocation1,startingLocation2,endingLocation2);

    it("testing input startingLocation2 if it will translate to the startingLocation1", function(){
        expect(util.translateToCoordinateSpace(startingLocation2,rule)).to.eql(startingLocation1); // objects equal
    });

    it("testing if input startingLocation2 if it will translate to the endingLocation1 in Z value", function(){
        expect(util.translateToCoordinateSpace(endingLocation2,rule).X).to.be.closeTo(endingLocation1.X,(1/util.ROUND_RATIO)); // objects equal
    });

    it("testing if in put endingLocation2 if it will translate to the endingLocation1 in Z value", function(){
        expect(util.translateToCoordinateSpace(endingLocation2,rule).Z).to.be.closeTo(endingLocation1.Z,(1/util.ROUND_RATIO)); // objects equal
    });

    // testing point1
    var point1 = {X:(-2+Math.sqrt(3))*1000,Y:0,Z:2*1000}

    it("testing point1 translate to MASTER KINECT", function(){
        expect(util.translateToCoordinateSpace(point1,rule).Z).to.be.closeTo(2.5*1000,util.ROUND_RATIO); // objects equal
    });
});

// Test function util.getPersonAngle()

describe("util.matrixTransformation()", function(){
    var testLocation={X:1*1000, Y:0.11, Z: 2*1000};
    var correctResult={X:1.8660254037844388*1000,Y:0.11,Z:1.2320508075688774*1000};

    it("given (1,2) rotate 30 degrees clockwise should output new location (1.8660254037844386,1.2320508075688774)", function(){
        expect(util.matrixTransformation(testLocation,30).Z).to.be.closeTo(1.2320508075688774*1000,util.ROUND_RATIO);//(util.matrixTransformation(testLocation,30), correctResult);
    });

    it("given (1,2) rotate 30 degrees clockwise should output new location (1.8660254037844386,1.2320508075688774)", function(){
        expect(util.matrixTransformation(testLocation,30).X).to.be.closeTo(1.8660254037844386*1000,util.ROUND_RATIO);//(util.matrixTransformation(testLocation,30), correctResult);
    });

});


//Test function util.getVector() with callback
/*
describe("util.getVector",function(){
    var vectorA={X:1, Y:0.11, Z: 2};
    var vectorB={X:2,Y:0.11,Z:1};
    //var vectorA={X:1, Y:0.11, Z: (Math.sqrt(3))};
    //var vectorB={X:Math.sqrt(3), Y:0.11, Z:1};
    var vector0 = {X:1,Y:0,Z:0}
    var vector4 = {X:1,Y:0,Z:-Math.sqrt(3)}

    //testing callback with util.getDegreeOfTwoVectors()
    describe("util.getDegreeOfTwoVectors",function(){
        it('should get angle without error', function(done){
            var vector1 = util.getVector(vectorA,vectorB);

        })
    });

});
*/
// Test function util.getVector()

describe("util.getVector()", function(){
    var vectorA={X:1, Y:0.11, Z: 2};
    var vectorB={X:2,Y:0.11,Z:1};

    it("given A = (1,2) B = (2,1) should return 30 degree)", function(){
        expect(util.getVector(vectorA,vectorB)).to.eql({X:1,Y:0,Z:-1}); // objects equal
    });
});


// Test function util.getDegreeOfTwoVectors()

describe("util.getDegreeOfTwoVectors()", function(){
    var vectorA={X:1, Y:0.11, Z: (Math.sqrt(3))};
    var vectorB={X:Math.sqrt(3), Y:0.11, Z:1};
    var vector0 = {X:1,Y:0,Z:0}
    var vector4 = {X:1,Y:0,Z:-Math.sqrt(3)}

    it("given V1 = (1,-sqrt(3)) V2 = (0,0) should output 150 degrees", function(){
        expect(util.getDegreeOfTwoVectors(vector4,vector0)).to.be.closeTo(60,0.00001);  //within 0.00001 is close enough
    });


    it("given V1 = (1,-sqrt(3)) V2 = (sqrt(3),1) should output 150 degrees", function(){
        expect(util.getDegreeOfTwoVectors(vector4,vectorB)).to.be.closeTo(90,0.00001);  //within 0.00001 is close enough
    });

    it("given V1 = (1,sqrt(3)) V2 = (0,0) should output 150 degrees", function(){
        expect(util.getDegreeOfTwoVectors(vectorA,vector0)).to.be.closeTo(60,0.00001);  //within 0.00001 is close enough
    });

    it("given V1 = (1,sqrt(3)) V2 = (sqrt(3),1) should output 30 degrees", function(){
        expect(util.getDegreeOfTwoVectors(vectorA,vectorB)).to.be.closeTo(30,0.00001);  //within 0.00001 is close enough
    });
});


// Test function util.getPersonAngle()
describe("util.getPersonAngle()", function(){
    // Get example when the angle of X=0.5,, should out put 14.292786284569123
    it("should output angle 18.43494882292201 when person is at X = 1,Z = 3", function(){
        assert.equal(util.getObjectOrientationToSensor(1,3), 18.43494882292201);
    });
    it("should return angle 27 when X = 1, Z = 0",function(){
        assert.equal(util.getObjectOrientationToSensor(0,1),0);
    });
});

// Test function util.getDistance()
describe("util.getDistanceToKinect()", function(){
    // Get example when the angle of X=0.5,, should out put 14.292786284569123
    it("should output angle 3.1622776601683795 when person is at X = 1, Z = 3", function(){
        assert.equal(util.getDistanceToKinect(1,3), 3.1622776601683795);
    });
});

// distanceBetweenPoints
describe("util.distanceBetweenPoints()", function(){
    // positive same point case
    it("should return '0', if passed '{X: 1, Y: 1, Z: 1}' and '{X: 1, Y: 1, Z: 1}'", function(){
        assert.equal(util.distanceBetweenPoints({X: 1, Y: 1, Z: 1}, {X: 1, Y: 1, Z: 1}), 0);
    });

    // positive same X (and Y) case
    it("should return '3', if passed '{X: 1, Y: 1, Z: 2}' and '{X: 1, Y: 1, Z: 5}'", function(){
        assert.equal(util.distanceBetweenPoints({X: 1, Y: 1, Z: 2}, {X: 1, Y: 1, Z: 5}), 3);
    });

    // positive same Z (and Y) case
    it("should return '3', if passed '{X: 2, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 1}'", function(){
        assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 1}), 3);
    });

    // positive decimal point case
    it("should return '5.830951894845301', if passed '{X: 2, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 6}'", function(){
        assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 6}), 5.830951894845301);
    });

    // positive integer case
    it("should return '5', if passed '{X: 2, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 5}'", function(){
        assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 5}), 5);
    });


    // negative same point case
    it("should return '0', if passed '{X: -1, Y: -1, Z: -1}' and '{X: -1, Y: -1, Z: -1}'", function(){
        assert.equal(util.distanceBetweenPoints({X: -1, Y: -1, Z: -1}, {X: -1, Y: -1, Z: -1}), 0);
    });

    // negative same X (and Y) case
    it("should return '7', if passed '{X: -1, Y: -1, Z: -2}' and '{X: -1, Y: -1, Z: 5}'", function(){
        assert.equal(util.distanceBetweenPoints({X: -1, Y: -1, Z: -2}, {X: -1, Y: -1, Z: 5}), 7);
    });

    // negative same Z (and Y) case
    it("should return '7', if passed '{X: -2, Y: -1, Z: -1}' and '{X: 5, Y: -1, Z: -1}'", function(){
        assert.equal(util.distanceBetweenPoints({X: -2, Y: -1, Z: -1}, {X: 5, Y: -1, Z: -1}), 7);
    });

    // negative decimal point case
    it("should return '5.830951894845301', if passed '{X: -2, Y: -1, Z: -1}' and '{X: -5, Y: -1, Z: -6}'", function(){
        assert.equal(util.distanceBetweenPoints({X: -2, Y: -1, Z: -1}, {X: -5, Y: -1, Z: -6}), 5.830951894845301);
    });

    // negative integer case
    it("should return '5', if passed '{X: 2, Y: 1, Z: 1}' and '{X: -1, Y: 1, Z: -3}'", function(){
        assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: -1, Y: 1, Z: -3}), 5);
    });
});

describe("util.getVector()", function(){
    var vectorA={X:1, Y:0.11, Z: 2};
    var vectorB={X:2,Y:0.11,Z:1};

    it("given A = (1,2) B = (2,1) should return 30 degree)", function(){
        expect(util.getVector(vectorA,vectorB)).to.eql({X:1,Y:0,Z:-1}); // objects equal
    });
});





// old test starts
// isGreater
/*
 describe("util.isGreater()", function(){
 // Difference of 0.001 case
 it("should return 'true', if passed '0.045' and '0.044'", function(){
 assert.equal(util.isGreater(0.045,0.044), true);
 });
 it("should return 'false', if passed '0.044' and '0.045'", function(){
 assert.equal(util.isGreater(0.044,0.045), false);
 });

 // Difference of 0.01 case
 it("should return 'true', if passed '0.045' and '0.035'", function(){
 assert.equal(util.isGreater(0.045,0.035), true);
 });
 it("should return 'false', if passed '0.035' and '0.045'", function(){
 assert.equal(util.isGreater(0.035,0.045), false);
 });

 // Difference of 1 case
 it("should return 'true', if passed '2.044' and '1.044'", function(){
 assert.equal(util.isGreater(2.044,1.044), true);
 });
 it("should return 'false', if passed '1.044' and '2.044'", function(){
 assert.equal(util.isGreater(1.044,2.044), false);
 });

 // Equal numbers case
 it("should return 'false', if passed '1.044' and '1.044'", function(){
 assert.equal(util.isGreater(1.044,1.044), false);
 });
 it("should return 'false', if passed '1.044' and '1.044'", function(){
 assert.equal(util.isGreater(1.044,1.044), false);
 });

 // Difference of less than 0.001 case
 it("should return 'false', if passed '1.00045' and '1.00044'", function(){
 assert.equal(util.isGreater(1.00045,1.00044), false);
 });
 it("should return 'false', if passed '1.044' and '1.00044'", function(){
 assert.equal(util.isGreater(1.00044,1.00045), false);
 });
 });

 // isLess
 describe("util.isLess()", function(){
 // Difference of 0.001 case
 it("should return 'false', if passed '0.045' and '0.044'", function(){
 assert.equal(util.isLess(0.045,0.044), false);
 });
 it("should return 'true', if passed '0.044' and '0.045'", function(){
 assert.equal(util.isLess(0.044,0.045), true);
 });

 // Difference of 0.01 case
 it("should return 'false', if passed '0.045' and '0.035'", function(){
 assert.equal(util.isLess(0.045,0.035), false);
 });
 it("should return 'true', if passed '0.035' and '0.045'", function(){
 assert.equal(util.isLess(0.035,0.045), true);
 });

 // Difference of 1 case
 it("should return 'false', if passed '2.044' and '1.044'", function(){
 assert.equal(util.isLess(2.044,1.044), false);
 });
 it("should return 'true', if passed '1.044' and '2.044'", function(){
 assert.equal(util.isLess(1.044,2.044), true);
 });

 // Equal numbers case
 it("should return 'false', if passed '1.044' and '1.044'", function(){
 assert.equal(util.isLess(1.044,1.044), false);
 });
 it("should return 'false', if passed '1.044' and '1.044'", function(){
 assert.equal(util.isLess(1.044,1.044), false);
 });

 // Difference of less than 0.001 case
 it("should return 'false', if passed '1.00045' and '1.00044'", function(){
 assert.equal(util.isLess(1.00045,1.00044), false);
 });
 it("should return 'false', if passed '1.044' and '1.00044'", function(){
 assert.equal(util.isLess(1.00044,1.00045), false);
 });
 });

 // normalizeAngle
 describe("util.normalizeAngle()", function(){
 // 0 case
 it("should return '0', if passed '0'", function(){
 assert.equal(util.normalizeAngle(0), 0);
 });

 // 360 case
 it("should return '0', if passed '360'", function(){
 assert.equal(util.normalizeAngle(360), 0);
 });

 // 180 case
 it("should return '180', if passed '180'", function(){
 assert.equal(util.normalizeAngle(180), 180);
 });

 // -360 case
 it("should return '0', if passed '-360'", function(){
 assert.equal(util.normalizeAngle(-360), 0);
 });

 // -180 case
 it("should return '180', if passed '-180'", function(){
 assert.equal(util.normalizeAngle(-180), 180);
 });

 // -270 case
 it("should return '90', if passed '-270'", function(){
 assert.equal(util.normalizeAngle(-270), 90);
 });

 // -90 case
 it("should return '270', if passed '-90'", function(){
 assert.equal(util.normalizeAngle(-90), 270);
 });

 // -0 case
 it("should return '0', if passed '-0'", function(){
 assert.equal(util.normalizeAngle(-0), 0);
 });

 // 500 case
 it("should return '140', if passed '500'", function(){
 assert.equal(util.normalizeAngle(500), 140);
 });

 // -500 case
 it("should return '220', if passed '-500'", function(){
 assert.equal(util.normalizeAngle(-500), 220);
 });
 });

 // distanceBetweenPoints
 describe("util.distanceBetweenPoints()", function(){
 // positive same point case
 it("should return '0', if passed '{X: 1, Y: 1, Z: 1}' and '{X: 1, Y: 1, Z: 1}'", function(){
 assert.equal(util.distanceBetweenPoints({X: 1, Y: 1, Z: 1}, {X: 1, Y: 1, Z: 1}), 0);
 });

 // positive same X (and Y) case
 it("should return '3', if passed '{X: 1, Y: 1, Z: 2}' and '{X: 1, Y: 1, Z: 5}'", function(){
 assert.equal(util.distanceBetweenPoints({X: 1, Y: 1, Z: 2}, {X: 1, Y: 1, Z: 5}), 3);
 });

 // positive same Z (and Y) case
 it("should return '3', if passed '{X: 2, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 1}'", function(){
 assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 1}), 3);
 });

 // positive decimal point case
 it("should return '5.830951894845301', if passed '{X: 2, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 6}'", function(){
 assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 6}), 5.830951894845301);
 });

 // positive integer case
 it("should return '5', if passed '{X: 2, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 5}'", function(){
 assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 5}), 5);
 });


 // negative same point case
 it("should return '0', if passed '{X: -1, Y: -1, Z: -1}' and '{X: -1, Y: -1, Z: -1}'", function(){
 assert.equal(util.distanceBetweenPoints({X: -1, Y: -1, Z: -1}, {X: -1, Y: -1, Z: -1}), 0);
 });

 // negative same X (and Y) case
 it("should return '7', if passed '{X: -1, Y: -1, Z: -2}' and '{X: -1, Y: -1, Z: 5}'", function(){
 assert.equal(util.distanceBetweenPoints({X: -1, Y: -1, Z: -2}, {X: -1, Y: -1, Z: 5}), 7);
 });

 // negative same Z (and Y) case
 it("should return '7', if passed '{X: -2, Y: -1, Z: -1}' and '{X: 5, Y: -1, Z: -1}'", function(){
 assert.equal(util.distanceBetweenPoints({X: -2, Y: -1, Z: -1}, {X: 5, Y: -1, Z: -1}), 7);
 });

 // negative decimal point case
 it("should return '5.830951894845301', if passed '{X: -2, Y: -1, Z: -1}' and '{X: -5, Y: -1, Z: -6}'", function(){
 assert.equal(util.distanceBetweenPoints({X: -2, Y: -1, Z: -1}, {X: -5, Y: -1, Z: -6}), 5.830951894845301);
 });

 // negative integer case
 it("should return '5', if passed '{X: 2, Y: 1, Z: 1}' and '{X: -1, Y: 1, Z: -3}'", function(){
 assert.equal(util.distanceBetweenPoints({X: 2, Y: 1, Z: 1}, {X: -1, Y: 1, Z: -3}), 5);
 });
 });

 // getIntersectionPoint
 describe("util.getIntersectionPoint()", function(){
 // same line case
 it("should return 'null', if passed 'line1' and 'line1'", function(){
 var line1 = factory.makeLineUsingPoints({X: 1, Y: 1, Z: 1},{X: 5, Y: 3, Z: 2});
 assert.deepEqual(util.getIntersectionPoint(line1, line1), null);
 });

 // parallel lines case
 it("should return 'null', if passed 'line1' and 'line2'", function(){
 var line1 = factory.makeLineUsingPoints({X: 1, Y: 1, Z: 1},{X: 5, Y: 3, Z: 2});
 var line2 = factory.makeLineUsingPoints({X: 5, Y: 5, Z: 5},{X: 9, Y: 7, Z: 6});
 assert.deepEqual(util.getIntersectionPoint(line1, line2), null);
 });

 // perpendicular lines case
 it("should return '{X: 1, Y: -2}', if passed 'line1' and 'line2'", function(){
 var line1 = factory.makeLineUsingPoints({X: 1, Y: 15, Z: 0},{X: 1, Y: 15, Z: -5});
 var line2 = factory.makeLineUsingPoints({X: 0, Y: 15, Z: -2},{X: 9, Y: 15, Z: -2});
 assert.deepEqual(util.getIntersectionPoint(line1, line2), {X: 1, Y: -2});
 });

 // intersecting lines case
 it("should return '{X: 2.5, Y: 0}', if passed 'line1' and 'line2'", function(){
 var line1 = factory.makeLineUsingPoints({X: 1, Y: 15, Z: -4},{X: 4, Y: 15, Z: 4});
 var line2 = factory.makeLineUsingPoints({X: 0, Y: 15, Z: 0},{X: 4, Y: 15, Z: 0});
 assert.deepEqual(util.getIntersectionPoint(line1, line2), {X: 2.5, Y: 0});
 });

 // intersecting extension of lines case
 it("should return '{X: 2.5, Y: 0}', if passed 'line1' and 'line2'", function(){
 var line1 = factory.makeLineUsingPoints({X: 1, Y: 15, Z: -4},{X: 4, Y: 15, Z: 4});
 var line2 = factory.makeLineUsingPoints({X: 0, Y: 15, Z: 0},{X: 1, Y: 15, Z: 0});
 assert.deepEqual(util.getIntersectionPoint(line1, line2), {X: 2.5, Y: 0});
 });
 });

 // angleBetweenPoints
 describe("util.angleBetweenPoints()", function(){
 // same point case
 it("should return '0', if passed '{X: 1, Y: 1, Z: 1}' and '{X: 1, Y: 1, Z: 1}'", function(){
 assert.deepEqual(util.angleBetweenPoints({X: 1, Y: 1, Z: 1}, {X: 1, Y: 1, Z: 1}), 0);
 });

 // point on a horizontal line case
 it("should return '0', if passed '{X: 1, Y: 1, Z: 1}' and '{X: 5, Y: 1, Z: 1}'", function(){
 assert.deepEqual(util.angleBetweenPoints({X: 1, Y: 1, Z: 1}, {X: 5, Y: 1, Z: 1}), 0);
 });

 // points on a vertical line case
 it("should return '90', if passed '{X: 5, Y: 1, Z: 0}' and '{X: 5, Y: 1, Z: 5}'", function(){
 assert.deepEqual(util.angleBetweenPoints({X: 0, Y: 1, Z: 0}, {X: 0, Y: 1, Z: 5}), 90);
 });

 // points on the x-axis case
 it("should return '0', if passed '{X: 1, Y: 1, Z: 0}' and '{X: 5, Y: 1, Z: 0}'", function(){
 assert.deepEqual(util.angleBetweenPoints({X: 1, Y: 1, Z: 0}, {X: 5, Y: 1, Z: 0}), 0);
 });

 // points on the z-axis case
 it("should return '180', if passed '{X: 5, Y: 1, Z: 1}' and '{X: 1, Y: 1, Z: 1}'", function(){
 assert.deepEqual(util.angleBetweenPoints({X: 5, Y: 1, Z: 1}, {X: 1, Y: 1, Z: 1}), 180);
 });

 // 135 degrees case
 it("should return '135', if passed '{X: 5, Y: 1, Z: 1}' and '{X: 1, Y: 1, Z: 5}'", function(){
 assert.deepEqual(util.angleBetweenPoints({X: 5, Y: 1, Z: 1}, {X: 1, Y: 1, Z: 5}), 135);
 });
 });

 // getCornersOfShape
 describe("util.getCornersOfShape()", function(){
 // stationary square device at origin case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = {X: 0, Y: 0, Z:0};

 var expected = [{X: 1, Y: 1},{X: 1, Y: -1},{X: -1, Y: -1},{X: -1, Y: 1}];

 assert.deepEqual(util.getCornersOfShape(device), expected);
 });

 // moving device with orientation 90 case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.Width = 1;
 device.Height = 2;
 device.location = {X: 3, Y: 0, Z:4};
 device.orientation = 90;

 var expected = [{X: 3.5, Y: 5},{X: 3.5, Y: 3},{X: 2.5, Y: 3},{X: 2.5, Y: 5}];

 assert.deepEqual(util.getCornersOfShape(device), expected);
 });

 // moving device with orientation 0 case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.Width = 1;
 device.Height = 2;
 device.location = {X: 3, Y: 0, Z:4};
 device.orientation = 0;

 var expected = [{X: 4, Y: 3.5},{X: 2, Y: 3.5},{X: 2, Y: 4.5},{X: 4, Y: 4.5}];

 assert.deepEqual(util.getCornersOfShape(device), expected);
 });

 // device without location case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.location = null;
 var expected = [];
 assert.deepEqual(util.getCornersOfShape(device), expected);
 });

 // width & height not specified case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.location = {X: 3, Y: 0, Z:4};
 var expected = [{X: 3, Y: 4},{X: 3, Y: 4},{X: 3, Y: 4},{X: 3, Y: 4}];
 assert.deepEqual(util.getCornersOfShape(device), expected);
 });
 });

 // getLinesOfShape
 describe("util.getLinesOfShape()", function(){
 // stationary square device at origin case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = {X: 0, Y: 0, Z:0};

 var expected = [];
 expected.push(factory.makeLineUsingPoints({X: 1, Y: 1},{X: 1, Y: -1}));
 expected.push(factory.makeLineUsingPoints({X: 1, Y: -1},{X: -1, Y: -1}));
 expected.push(factory.makeLineUsingPoints({X: -1, Y: -1},{X: -1, Y: 1}));
 expected.push(factory.makeLineUsingPoints({X: -1, Y: 1},{X: 1, Y: 1}));

 assert.deepEqual(util.getLinesOfShape(device), expected);
 });

 // device without location case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.location = null;
 var expected = [];
 assert.deepEqual(util.getLinesOfShape(device), expected);
 });

 // width & height not specified case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.location = {X: 3, Y: 0, Z:4};

 var expected = [];
 expected.push(factory.makeLineUsingPoints({X: 3, Y: 4},{X: 3, Y: 4}));
 expected.push(factory.makeLineUsingPoints({X: 3, Y: 4},{X: 3, Y: 4}));
 expected.push(factory.makeLineUsingPoints({X: 3, Y: 4},{X: 3, Y: 4}));
 expected.push(factory.makeLineUsingPoints({X: 3, Y: 4},{X: 3, Y: 4}));

 assert.deepEqual(util.getLinesOfShape(device), expected);
 });

 // moving device with orientation 0 case
 it("should return 'expected', if passed 'device'", function(){
 var device = factory.makeDevice();
 device.Width = 1;
 device.Height = 2;
 device.location = {X: 3, Y: 0, Z:4};
 device.orientation = 0;

 var expected = [];
 expected.push(factory.makeLineUsingPoints({X: 4, Y: 3.5}, {X: 2, Y: 3.5}));
 expected.push(factory.makeLineUsingPoints({X: 2, Y: 3.5}, {X: 2, Y: 4.5}));
 expected.push(factory.makeLineUsingPoints({X: 2, Y: 4.5}, {X: 4, Y: 4.5}));
 expected.push(factory.makeLineUsingPoints({X: 4, Y: 4.5}, {X: 4, Y: 3.5}));

 assert.deepEqual(util.getLinesOfShape(device), expected);
 });
 });

 // GetRatioPositionOnScreen
 describe("util.GetRatioPositionOnScreen()", function(){
 // intersection in middle of line case
 it("should return '{X: 0.5, Y: 0}', if passed 'device' and 'intersection'", function(){
 var intersection = {X: 0, Y: 1};
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = {X: 0, Y: 0, Z:0};

 assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: 0.5, Y: 0});
 });

 // location null case
 it("should return '{X: -1, Y: -1}', if passed 'device' and 'intersection'", function(){
 var intersection = {X: 0, Y: 1};
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = null;

 assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: -1, Y: -1});
 });

 // intersection at one of the corners case
 it("should return '{X: 1, Y: 0}', if passed 'device' and 'intersection'", function(){
 var intersection = {X: 1, Y: 1};
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = {X: 0, Y: 0, Z:0};

 assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: 1, Y: 0});
 });

 // no intersection case
 it("should return '{X: -1, Y: -1}', if passed 'device' and 'intersection'", function(){
 var intersection = {X: 6, Y: 1};
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = {X: 0, Y: 0, Z:0};

 assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: -1, Y: -1});
 });

 // intersection in middle of line case
 it("should return '{X: 0.5, Y: 0}', if passed 'device' and 'intersection'", function(){
 var intersection = {X: -1, Y: 0.8};
 var device = factory.makeDevice();
 device.Width = 2;
 device.Height = 2;
 device.location = {X: 0, Y: 0, Z:0};

 assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: 0, Y: 0.09999999999999998});
 });
 });
 */ // Old test ENDS.