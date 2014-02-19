var util = require('../util');
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
    // Print empty Persons[] case
    it("should return 'false', if passed ''", function(){
        assert.equal(locator.printPersons(), false);
    });

    // Print something case
    it("should return 'true', if passed ''", function(){
        var person = factory.makePerson("001", {X: 1, Y: 2, Z: 3});
        locator.updatePersons(person);
        assert.equal(locator.printPersons(), true);
    });
});