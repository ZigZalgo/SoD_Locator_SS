var util = require('../util');
var locator = require('../locator');
var factory = require('../factory');
var chai = require('chai');
var assert = chai.assert;

// makePerson
describe("factory.makePerson()", function(){
    // regular make case
    it("should return 'Person' if passed 'Person.ID' and 'Person.Location'", function(){
        var Person = {ID: 5,
            Location: {X: 10, Y: 20, Z: 30},
            Orientation: null,
            OwnedDeviceID: null,
            TrackedBy: []
        };
        assert.deepEqual(factory.makePerson(Person.ID, Person.Location), Person)
    });

    // null id case
    it("should return 'Person' if passed 'null' and 'Person.Location'", function(){
        var Person = {ID: null,
            Location: {X: 10, Y: 20, Z: 30},
            Orientation: null,
            OwnedDeviceID: null,
            TrackedBy: []
        };
        assert.deepEqual(factory.makePerson(Person.ID, Person.Location), Person)
    });

    // null location case 1
    it("should return 'false' if passed 'Person.ID' and 'null'", function(){
        var Person = {ID: 5,
            Location: null,
            Orientation: null,
            OwnedDeviceID: null,
            TrackedBy: []
        };
        assert.deepEqual(factory.makePerson(Person.ID, Person.Location), false)
    });

    // null location case 2
    it("should return 'false' if passed 'Person.ID' and '{X: 10, Y: null, Z: 30}'", function(){
        var Person = {ID: 5,
            Location: {X: 10, Y: null, Z: 30},
            Orientation: null,
            OwnedDeviceID: null,
            TrackedBy: []
        };
        assert.equal(factory.makePerson(Person.ID, {X: 10, Y: null, Z: 30}), false)
    });
});

// makeDevice
describe("factory.makeDevice()", function(){
    // redundant test case... just checks to see it actually makes an object with the properties of a Device
    it("should return 'Device' if passed ''", function(){
        var Device = {ID: null,
                    Location: {X: null, Y: null, Z: null},
                    Orientation: null,
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
            yIntercept: 2,
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
            yIntercept: -1,
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
            yIntercept: null,
            isVerticalLine: true,
            x: 4,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 4, Y: 5, Z: 7}, {X: 4, Y: 2, Z: 3}), Line)
    });

    // horizontal line case
    it("should return 'Line' if passed '{X: 2, Y: 5, Z: 7} and '{X: 4, Y: 5, Z: 3}'", function(){
        var Line = 	{startPoint: {X: 2, Y: 5, Z: 7},
            endPoint: {X: 4, Y: 5, Z: 3},
            slope: -2,
            yIntercept: 5, //11?????
            isVerticalLine: false,
            x: null,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 2, Y: 5, Z: 7}, {X: 4, Y: 5, Z: 3}), Line)
    });

    // same start and end points case
    it("should return 'Line' if passed '{X: 1, Y: 2, Z: 3} and '{X: 1, Y: 2, Z: 3}'", function(){
        var Line = 	{startPoint: {X: 1, Y: 2, Z: 3},
            endPoint: {X: 1, Y: 2, Z: 3},
            slope: null,
            yIntercept: null,
            isVerticalLine: true,
            x: 1,
            isLineSegment: true};

        assert.deepEqual(factory.makeLineUsingPoints({X: 1, Y: 2, Z: 3}, {X: 1, Y: 2, Z: 3}), Line)
    });
});

// makeLineUsingOrientation
describe("factory.makeLineUsingOrientation()", function(){

})