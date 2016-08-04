var CANNON = require('cannon');
var fn = {};

fn.createPhysBody = function createPhysBody(shape) {
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
			createCollider = function(mass, radius) {
				var tempBody = new CANNON.Body({
					mass: mass
				});
				var sphereShape = new CANNON.Sphere(radius);
				tempBody.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
				return tempBody;
			};
			break;
			
		default:
			createCollider = function() {
				//var sphereShape = new CANNON.Sphere(0.001);
				var tempBody = new CANNON.Body({
					mass: 0
				});
				//tempBody.addShape(sphereShape, new CANNON.Vec3());
				//tempBody.angularDamping = 1;
				return tempBody;
			};
			break;
	}
	return createCollider;
};





// for when the physics body already exists
// modifies existing body
fn.createPhysBody2 = function(shape) {
	var createCollider;
	switch (shape) {
		case "capsule":
			createCollider = function(body, mass, radius, height, isRotated) {
				var cylinderShape = new CANNON.Cylinder(radius, radius, height, 16);
				var sphereShape = new CANNON.Sphere(radius);
				
				body.mass = mass;
				body.updateMassProperties();
				body.type = 1;

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
			createCollider = function(body, mass, radius) {
				body.mass = mass;
				body.updateMassProperties();
				body.type = 1;
				
				var sphereShape = new CANNON.Sphere(radius);
				body.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
				
				//body.updateMassProperties();
				//body.updateBoundingRadius();
				//body.aabbNeedsUpdate = true;
				
			};
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
	this.parts = {};
	this.parts.chassis = {};
	this.parts.wheels = {};
	this.parts.wheels.bodies = [];
	this.parts.wheels.meshes = [];
	this.parts.chassis.body = new CANNON.Body({mass:1200.0});;
	var chassisShape = new CANNON.Box(new CANNON.Vec3(1, 2, 0.4));
	this.parts.chassis.body.addShape(chassisShape, new CANNON.Vec3(0, 0, 0));

	var options = {
		radius: 0.385,//0.5
		directionLocal: new CANNON.Vec3(0, 0, -1),
		//directionWorld: new CANNON.Vec3(0, 0, 0),
		axleLocal: new CANNON.Vec3(-1, 0, 0),//0,1,0
		//axleWorld: new CANNON.Vec3(1, 0, 0),
		suspensionStiffness: 40,//40
		suspensionRestLength: 0.475,//0.3
		frictionSlip: 3,//100
		dampingRelaxation: 2.3,//2.3
		dampingCompression: 2.5,//4.4
		maxSuspensionForce: 100000,//100000
		rollInfluence: 0.1,//0.01

		chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),//doesn't matter
		maxSuspensionTravel: 0.3,//0.3
		customSlidingRotationalSpeed: -30,//-30
		useCustomSlidingRotationalSpeed: true//true
	};
	
	this.vehicle = new CANNON.RaycastVehicle({
		chassisBody: this.parts.chassis.body,
		indexRightAxis: 0,// X
		indexForwardAxis: 1,// Y
		indexUpAxis: 2,// Z
	});
	
	var cWheelOpts = {};
	cWheelOpts.axleFront = 1.1;//1.4
	cWheelOpts.axleRear = 1;//1.1
	cWheelOpts.axleWidth = 1;//0.75
	cWheelOpts.axleHeight = 0;//0
	
	options.chassisConnectionPointLocal.set(cWheelOpts.axleWidth, cWheelOpts.axleFront, cWheelOpts.axleHeight);//top right
	//options.isFrontWheel = true;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(-cWheelOpts.axleWidth, cWheelOpts.axleFront, cWheelOpts.axleHeight);//top left
	//options.isFrontWheel = true;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(cWheelOpts.axleWidth, -cWheelOpts.axleRear, cWheelOpts.axleHeight);//back right
	//options.isFrontWheel = false;
	this.vehicle.addWheel(options);
	options.chassisConnectionPointLocal.set(-cWheelOpts.axleWidth, -cWheelOpts.axleRear, cWheelOpts.axleHeight);//back left
	//options.isFrontWheel = false;
	this.vehicle.addWheel(options);
	
	
	
	
	for(var i = 0; i < this.vehicle.wheelInfos.length; i++) {
		var wheel = this.vehicle.wheelInfos[i];
		var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, 0.35, 16);//wheel.radius/2 for width 20 for last parameter
		var wheelBody = new CANNON.Body({mass: 1}); //, material:this.cMatWheel});
		wheelBody.type = CANNON.Body.KINEMATIC;
		wheelBody.collisionFilterGroup = 0;//turn off collisions
		var q = new CANNON.Quaternion();
		q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI/2);
		wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
		this.parts.wheels.bodies.push(wheelBody);
		
		
	}
	this.vehicle.setBrake(0, 0);
	this.vehicle.setBrake(0, 1);
	this.vehicle.setBrake(0, 2);
	this.vehicle.setBrake(0, 3);
	
	
	this.addVehicleToWorld = function(physicsWorld) {
		this.vehicle.addToWorld(physicsWorld);
		for(var i = 0; i < 4; i++) {
			physicsWorld.addBody(this.parts.wheels.bodies[i]);
		}
	};
	
	this.removeVehicleFromWorld = function(physicsWorld) {
		this.vehicle.removeFromWorld(physicsWorld);
		for(var i = 0; i < 4; i++) {
			physicsWorld.removeBody(this.parts.wheels.bodies[i]);
		}
	};
	
	this.update = function() {
		for(var i = 0; i < 4; i++) {
			this.vehicle.updateWheelTransform(i);
			var transform = this.vehicle.wheelInfos[i].worldTransform;
			this.parts.wheels.bodies[i].position.copy(transform.position);
			this.parts.wheels.bodies[i].quaternion.copy(transform.quaternion);
		}
	}
	
	this.reset = function() {
		this.vehicle.chassisBody.velocity.set(0, 0, 0);
		this.vehicle.chassisBody.position.set(200, 100, 20);
	}
	
	this.bump = function() {
		this.vehicle.chassisBody.angularVelocity.set(20, 0, 0)
	}
	
	//world1.c.objects.push(this);
	return this;
};



































module.exports = fn;