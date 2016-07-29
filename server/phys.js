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


module.exports = fn;