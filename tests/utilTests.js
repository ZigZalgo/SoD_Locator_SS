var util = require('../util');
var chai = require('chai');
var assert = chai.assert;

// isGreater
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