//var util = require('../locatorServices/util');
var locator = require('../locatorServices/locator');
var factory = require('../locatorServices/factory');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


describe("factory.Room()", function(){
    var location = {X:0,Y:0,Z:0};
    var length = 6;
    var depth = 8;
    var height = 4;

    it("create room with {X:0,Y:0,Z:0} l:6 d:8 h:4", function(){
        var testRoom = new factory.Room(location,length,depth,height);
        //console.log(testRoom);
        expect(testRoom.location).to.eql(location);
        expect(testRoom.length).to.eql(length);
        expect(testRoom.depth).to.eql(depth);
        expect(testRoom.height).to.eql(height);
        expect(testRoom.walls).to.eql(
            {
                top:{
                    startingPoint:{X:-3,Y:4,Z:4},
                    endingPoint:{X:3,Y:4,Z:4}
                },
                left:{
                    startingPoint:{X:-3,Y:4,Z:4},
                    endingPoint:{X:-3,Y:4,Z:-4}
                },
                right:{
                    startingPoint:{X:3,Y:4,Z:4},
                    endingPoint:{X:3,Y:4,Z:-4}
                },
                bottom:{
                    startingPoint:{X:-3,Y:4,Z:-4},
                    endingPoint:{X:3,Y:4,Z:-4}
                }
            }
        )
        expect(testRoom.ceiling).to.eql({length:length,height:height,depth:depth})
    });
});

// makePerson
/*describe("factory.makePerson()", function(){
    // regular make case
    it("should return 'Person' if passed 'Person.ID' and 'Person.location'", function(){
        var Person = {ID: 5,
            location: {X: 10, Y: 20, Z: 30},
            orientation: null,
            ownedDeviceID: null,
            trackedBy: []
        };
        assert.deepEqual(factory.makePerson(Person.ID, Person.location), Person)
    });

    // null id case
    it("should return 'Person' if passed 'null' and 'Person.location'", function(){
        var Person = {ID: null,
            location: {X: 10, Y: 20, Z: 30},
            orientation: null,
            ownedDeviceID: null,
            trackedBy: []
        };
        assert.deepEqual(factory.makePerson(Person.ID, Person.location), Person)
    });

    // null location case 1
    it("should return 'false' if passed 'Person.ID' and 'null'", function(){
        var Person = {ID: 5,
            location: null,
            orientation: null,
            ownedDeviceID: null,
            trackedBy: []
        };
        assert.deepEqual(factory.makePerson(Person.ID, Person.location), false)
    });

    // null location case 2
    it("should return 'false' if passed 'Person.ID' and '{X: 10, Y: null, Z: 30}'", function(){
        var Person = {ID: 5,
            location: {X: 10, Y: null, Z: 30},
            orientation: null,
            ownedDeviceID: null,
            trackedBy: []
        };
        assert.equal(factory.makePerson(Person.ID, {X: 10, Y: null, Z: 30}), false)
    });
});

// makeDevice
describe("factory.makeDevice()", function(){
    // redundant test case... just checks to see it actually makes an object with the properties of a Device
    it("should return 'Device' if passed ''", function(){
        var Device = {ID: null,
                    location: {X: null, Y: null, Z: null},
                    orientation: null,
                    FOV: util.DEFAULT_FIELD_OF_VIEW,
                    Height: null,
                    Width: null,
                    OwnerID: null,
                    IntersectionPoint: {X: 0, Y: 0}
        }
        assert.deepEqual(factory.makeDevice(), Device);
    });
});

// make2DPoint
describe("factory.make2DPoint()", function(){
    // regular case
    it("should return '{X: 5, Y: 10}' if passed '5' and '10'", function(){
        assert.deepEqual(factory.make2DPoint(5, 10), {X: 5, Y: 10})
    });

    // negative values case
    it("should return '{X: -5, Y: -10}' if passed '-5' and '-10'", function(){
        assert.deepEqual(factory.make2DPoint(-5, -10), {X: -5, Y: -10})
    });

    // zero values case
    it("should return '{X: 0, Y: 0}' if passed '0' and '0'", function(){
        assert.deepEqual(factory.make2DPoint(0, 0), {X: 0, Y: 0})
    });

    // null values case
    it("should return '{X: null, Y: null}' if passed 'null' and 'null'", function(){
        assert.deepEqual(factory.make2DPoint(null, null), {X: null, Y: null})
    });
});

// makeLineUsingPoints
describe("factory.makeLineUsingPoints()", function(){
    // arbitrary points case
    it("should return 'Line' if passed '{X: 1, Y: 2, Z: 3} and '{X: 4, Y: 5, Z: 6}'", function(){
        var Line = 	{startPoint: {X: 1, Y: 2, Z: 3},
            endPoint: {X: 4, Y: 5, Z: 6},
            slope: 1,
            zIntercept: 2,
            isVerticalLine: false,
            x: null,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 1, Y: 2, Z: 3}, {X: 4, Y: 5, Z: 6}), Line)
    });

    // negative points case
    it("should return 'Line' if passed '{X: 4, Y: 5, Z: 7} and '{X: -1, Y: -2, Z: -3}'", function(){
        var Line = 	{startPoint: {X: 4, Y: 5, Z: 7},
            endPoint: {X: -1, Y: -2, Z: -3},
            slope: 2,
            zIntercept: -1,
            isVerticalLine: false,
            x: null,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 4, Y: 5, Z: 7}, {X: -1, Y: -2, Z: -3}), Line)
    });

    // vertical line case
    it("should return 'Line' if passed '{X: 4, Y: 5, Z: 7} and '{X: 4, Y: 2, Z: 3}'", function(){
        var Line = 	{startPoint: {X: 4, Y: 5, Z: 7},
            endPoint: {X: 4, Y: 2, Z: 3},
            slope: null,
            zIntercept: null,
            isVerticalLine: true,
            x: 4,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 4, Y: 5, Z: 7}, {X: 4, Y: 2, Z: 3}), Line)
    });

    // same start and end points case
    it("should return 'Line' if passed '{X: 1, Y: 2, Z: 3} and '{X: 1, Y: 2, Z: 3}'", function(){
        var Line = 	{startPoint: {X: 1, Y: 2, Z: 3},
            endPoint: {X: 1, Y: 2, Z: 3},
            slope: null,
            zIntercept: null,
            isVerticalLine: true,
            x: 1,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 1, Y: 2, Z: 3}, {X: 1, Y: 2, Z: 3}), Line)
    });
});

// makeLineUsingOrientation
describe("factory.makeLineUsingOrientation()", function(){

})*/