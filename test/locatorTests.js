/*var util = require('../util');
var locator = require('../locator');
var factory = require('../factory');
var chai = require('chai');
var assert = chai.assert;

// updatePersons
describe("locator.updatePersons()", function(){
    // Person does not exist case
    it("should return 'false', if passed 'person'", function(){
        var person = factory.makePerson("001", {X: 1, Y: 2, Z: 3})
        assert.equal(locator.updatePersons(person), false);
    });

    // Person already exists and same location case
    it("should return 'true', if passed 'person'", function(){
        var person = factory.makePerson("001", {X: 1, Y: 2, Z: 3})
        locator.updatePersons(person);
        assert.equal(locator.updatePersons(person), true);
    });

    // Person already exists and different location case
    it("should return 'true', if passed 'person'", function(){
        var person = factory.makePerson("001", {X: 1, Y: 2, Z: 3})
        locator.updatePersons(person);
        person.X = 5, person.Y = 6, person.Z = 7;
        assert.equal(locator.updatePersons(person), true);
    });

    // Null passed as argument case
    it("should return 'false', if passed 'null'", function(){
        assert.equal(locator.updatePersons(null), false);
    });
});

//printPersons
describe("locator.printPersons()", function(){
    // Print empty persons[] case
    it("should return 'false', if passed ''", function(){
        assert.equal(locator.printPersons(), false);
    });

    // Print something case
    it("should return 'true', if passed ''", function(){
        var person = factory.makePerson("001", {X: 1, Y: 2, Z: 3});
        locator.updatePersons(person);
        assert.equal(locator.printPersons(), true);
    });
});*/
var util = require('../locatorServices/util');
var locator = require('../locatorServices/locator');
var factory = require('../locatorServices/factory');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var async = require("async");
var Q = require("q");
var should = chai.should();

describe("locator.getIntersectionPointInRoom()", function(){
    var location = {X:0,Y:0,Z:0};
    var length = 6;
    var depth = 8;
    var height = 4;
    var device = {ID:1, orientation:{pitch:-45,yaw:30},location:{X:0,Y:1,Z:1}};
    it(" should get the projection towards X-Z space ", function(okay){
        console.log();
        locator.getIntersectionPointInRoom(device,function(data){
            try{
                console.log("!:"+JSON.stringify(data));
                expect(data[0].intersected.X).to.be.closeTo(-0.5,0.05);
            }catch(e){
                console.log(e);
            }
            //data.X.should.equal(-0.66)
            okay()
        });
    });
});
