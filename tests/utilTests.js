var util = require('../util');
var factory = require('../factory');
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
		device.Location = {X: 0, Y: 0, Z:0};
		
		var expected = [{X: 1, Y: 1},{X: 1, Y: -1},{X: -1, Y: -1},{X: -1, Y: 1}];
		
		assert.deepEqual(util.getCornersOfShape(device), expected);		
	});
	
	// moving device with orientation 90 case
	it("should return 'expected', if passed 'device'", function(){	
		var device = factory.makeDevice();
		device.Width = 1;
		device.Height = 2;
		device.Location = {X: 3, Y: 0, Z:4};
		device.Orientation = 90;
		
		var expected = [{X: 3.5, Y: 5},{X: 3.5, Y: 3},{X: 2.5, Y: 3},{X: 2.5, Y: 5}];
		
		assert.deepEqual(util.getCornersOfShape(device), expected);		
	});	
	
	// moving device with orientation 0 case
	it("should return 'expected', if passed 'device'", function(){	
		var device = factory.makeDevice();
		device.Width = 1;
		device.Height = 2;
		device.Location = {X: 3, Y: 0, Z:4};
		device.Orientation = 0;
		
		var expected = [{X: 4, Y: 3.5},{X: 2, Y: 3.5},{X: 2, Y: 4.5},{X: 4, Y: 4.5}];
		
		assert.deepEqual(util.getCornersOfShape(device), expected);		
	});	
	
	// device without location case
	it("should return 'expected', if passed 'device'", function(){	
		var device = factory.makeDevice();
		device.Location = null;		
		var expected = [];		
		assert.deepEqual(util.getCornersOfShape(device), expected);		
	});	
	
	// width & height not specified case
	it("should return 'expected', if passed 'device'", function(){	
		var device = factory.makeDevice();
		device.Location = {X: 3, Y: 0, Z:4};		
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
		device.Location = {X: 0, Y: 0, Z:0};
		
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
		device.Location = null;		
		var expected = [];		
		assert.deepEqual(util.getLinesOfShape(device), expected);		
	});
	
	// width & height not specified case
	it("should return 'expected', if passed 'device'", function(){	
		var device = factory.makeDevice();
		device.Location = {X: 3, Y: 0, Z:4};		
		
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
		device.Location = {X: 3, Y: 0, Z:4};
		device.Orientation = 0;
		
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
		device.Location = {X: 0, Y: 0, Z:0};
						
		assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: 0.5, Y: 0});		
	});
	
	// location null case
	it("should return '{X: -1, Y: -1}', if passed 'device' and 'intersection'", function(){	
		var intersection = {X: 0, Y: 1};
		var device = factory.makeDevice();
		device.Width = 2;
		device.Height = 2;
		device.Location = null;
						
		assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: -1, Y: -1});		
	});	
	
	// intersection at one of the corners case
	it("should return '{X: 1, Y: 0}', if passed 'device' and 'intersection'", function(){	
		var intersection = {X: 1, Y: 1};
		var device = factory.makeDevice();
		device.Width = 2;
		device.Height = 2;
		device.Location = {X: 0, Y: 0, Z:0};
						
		assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: 1, Y: 0});		
	});

	// no intersection case
	it("should return '{X: -1, Y: -1}', if passed 'device' and 'intersection'", function(){	
		var intersection = {X: 6, Y: 1};
		var device = factory.makeDevice();
		device.Width = 2;
		device.Height = 2;
		device.Location = {X: 0, Y: 0, Z:0};
						
		assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: -1, Y: -1});		
	});	
	
	// intersection in middle of line case
	it("should return '{X: 0.5, Y: 0}', if passed 'device' and 'intersection'", function(){	
		var intersection = {X: -1, Y: 0.8};
		var device = factory.makeDevice();
		device.Width = 2;
		device.Height = 2;
		device.Location = {X: 0, Y: 0, Z:0};				
		
		assert.deepEqual(util.GetRatioPositionOnScreen(device, intersection), {X: 0, Y: 0.09999999999999998});		
	});
});