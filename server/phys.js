var CANNON = require('cannon');
var fn = {};

fn.createPhysBody = function createPhysBody(shape, mass) {
	var createCollider;
	switch (shape) {
		case "capsule":
			createCollider = function(mass, radius, height, isRotated) {
				var cylinderShape = new CANNON.Cylinder(radius, radius, height, 16);
				var sphereShape = new CANNON.Sphere(radius);
				var tempBody = new CANNON.Body({
					mass: mass
				});

				// CHANGE LATER
				if (!isRotated || isRotated) {
					tempBody.addShape(cylinderShape);
					tempBody.addShape(sphereShape, new CANNON.Vec3(0, 0, height / 2));
					tempBody.addShape(sphereShape, new CANNON.Vec3(0, 0, -height / 2));
				} else if (isRotated) {
					// TODO
				}

				tempBody.angularDamping = 1;
				return tempBody;
			};
			break;
		case "box":

			break;

		case "sphere":

			break;
			
		default:
			createCollider = function() {
				var sphereShape = new CANNON.Sphere(0.001);
				var tempBody = new CANNON.Body({
					mass: 0
				});
				tempBody.addShape(sphereShape, new CANNON.Vec3());
				tempBody.angularDamping = 1;
				return tempBody;
			};
			break;
	}
	return createCollider;
};






fn.createPhysBody2 = function createPhysBody(shape) {
	var createCollider;
	switch (shape) {
		case "capsule":
			createCollider = function(body, mass, radius, height, isRotated) {
				var cylinderShape = new CANNON.Cylinder(radius, radius, height, 16);
				var sphereShape = new CANNON.Sphere(radius);
				
				body.mass = mass;
				body.updateMassProperties();

				// CHANGE LATER
				if (!isRotated || isRotated) {
					body.addShape(cylinderShape);
					body.addShape(sphereShape, new CANNON.Vec3(0, 0, height / 2));
					body.addShape(sphereShape, new CANNON.Vec3(0, 0, -height / 2));
					body.updateBoundingRadius();
				} else if (isRotated) {
					// TODO
				}

				body.angularDamping = 1;
				//return tempBody;
			};
			break;
		case "box":

			break;

		case "sphere":

			break;
			
		default:
			createCollider = function() {
				var tempBody = new CANNON.Body({
					mass: 0
				});
				//tempBody.angularDamping = 1;
				return tempBody;
			};
			break;
	}
	return createCollider;
};



fn.createVehicleBody = function() {
	
};


fn.vehicle = function() {
	this.parts = {};
	this.parts.chassis = {};
	this.parts.wheels = {};
	this.parts.wheels.bodies = [];
	this.parts.wheels.meshes = [];
	this.parts.chassis.body = new CANNON.Body({mass:1500.0});
	//var chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
	
	// length width height
	var chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.85, 0.4));
	var chassisOffsetLoc = new CANNON.Vec3(0, 0, 0);
	
	this.parts.chassis.body.addShape(chassisShape, chassisOffsetLoc);
	
	
	
	
	
	// add wheels
	
	var options = {
		radius: 0.385,//0.5
		directionLocal: new CANNON.Vec3(0, 0, 1),
		suspensionStiffness: 40,//40
		suspensionRestLength: 0.475,//0.3
		frictionSlip: 3,//100
		dampingRelaxation: 2.3,//2.3
		dampingCompression: 2.5,//4.4
		maxSuspensionForce: 100000,//100000
		rollInfluence: 0.1,//0.01
		axleLocal: new CANNON.Vec3(0, 1, 0),//0,1,0
		//axleWorld: new CANNON.Vec3(1, 0, 0),
		chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),//1,1,0
		maxSuspensionTravel: 0.3,//0.3
		customSlidingRotationalSpeed: -30,//-30
		useCustomSlidingRotationalSpeed: true//true
	};
	
	this.vehicle = new CANNON.RaycastVehicle({
		chassisBody: this.parts.chassis.body,
	});
	
	/*options.chassisConnectionPointLocal.set(-1, 1, 0);// \_
	options.isFrontWheel = true;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(-1, -1, 0);// _/
	options.isFrontWheel = true;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(1, 1, 0);// /-
	options.isFrontWheel = false;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(1, -1, 0);// -\
	options.isFrontWheel = false;
	this.vehicle.addWheel(options);*/
	
	var cWheelOpts = {};
	cWheelOpts.axleFront = 1.4;//1.4
	cWheelOpts.axleRear = 1.1;//1.1
	cWheelOpts.axleWidth = 0.75;//0.75
	cWheelOpts.axleHeight = -0.1;//0
	
	options.chassisConnectionPointLocal.set(-cWheelOpts.axleRear, cWheelOpts.axleWidth, cWheelOpts.axleHeight);
	//options.isFrontWheel = true;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(-cWheelOpts.axleRear, -cWheelOpts.axleWidth, cWheelOpts.axleHeight);
	//options.isFrontWheel = true;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(cWheelOpts.axleRear, cWheelOpts.axleWidth, cWheelOpts.axleHeight);
	//options.isFrontWheel = false;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(cWheelOpts.axleRear, -cWheelOpts.axleWidth, cWheelOpts.axleHeight);
	//options.isFrontWheel = false;
	this.vehicle.addWheel(options);
	
	
	
	
};











module.exports = fn;