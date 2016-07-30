function makeVehicle(world, chassisMesh, wheelMesh, physicsMesh) {
	this.parts = {};
	this.parts.chassis = {};
	//this.parts.chassis.phys;
	//this.parts.chassis.mesh;
	this.parts.wheels = {};
	this.parts.wheels.bodies = [];
	this.parts.wheels.meshes = [];
	this.parts.chassis.body = new CANNON.Body({mass:1500.0});
	//var chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
	var chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.85, 0.4));
	this.parts.chassis.body.addShape(chassisShape, new CANNON.Vec3(0, 0, 0));
	
	/*var cabShape = new CANNON.Box(new CANNON.Vec3(0.8, 0.85, 0.25));
	this.parts.chassis.body.addShape(cabShape, new CANNON.Vec3(0, 0, 0.4+0.25));*/
	

	
	/*var cpm = physicsMesh;
	var cpmBody = new CANNON.Body({mass: 150});
	for(var i = 0; i < cpm.length; i++){
		var rawVerts = cpm[i].verts;
		var rawFaces = cpm[i].faces;
		var rawOffset = cpm[i].offset;
		var verts=[], faces=[], offset;
		for(var j = 0; j < rawVerts.length; j += 3) {
			verts.push(new CANNON.Vec3(rawVerts[j],
			rawVerts[j+1],
			rawVerts[j+2]));
		}
		for(j = 0; j < rawFaces.length; j += 3) {
			faces.push([rawFaces[j], rawFaces[j+1], rawFaces[j+2]]);
		}
		offset = new CANNON.Vec3(rawOffset[0],rawOffset[1],rawOffset[2]);
		var cpmPart = new CANNON.ConvexPolyhedron(verts, faces);
		cpmBody.addShape(cpmPart, offset);
	}
	this.parts.chassis.body = cpmBody;
	this.parts.chassis.body.position.set(10, 4, 3);*/
	//chassisBody.angularVelocity.set(-0.75, 0, 0);

	var options = {
		radius: 0.385,//0.5
		directionLocal: new CANNON.Vec3(0, 0, -1),
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
	
	
	
	
	for(var i = 0; i < this.vehicle.wheelInfos.length; i++) {
		var wheel = this.vehicle.wheelInfos[i];
		var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, 0.35, 16);//wheel.radius/2 for width 20 for last parameter
		var wheelBody = new CANNON.Body({mass: 1}); //, material:this.cMatWheel});
		wheelBody.type = CANNON.Body.KINEMATIC;
		wheelBody.collisionFilterGroup = 0; // turn off collisions
		var q = new CANNON.Quaternion();
		q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/2);
		//cylinderShape.transformAllPoints(new CANNON.Vec3(), q);
		wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
		this.parts.wheels.bodies.push(wheelBody);
		
		var cylinderGeo = new THREE.CylinderGeometry(0.385, 0.385, 0.5, 8, 1);
		var wmesh = new THREE.Mesh(
			cylinderGeo, new THREE.MeshLambertMaterial({
			shading:THREE.SmoothShading, color:0x888888
		}));
		//wmesh.rotation.z += Math.PI/2;
		//this.parts.wheels.meshes.push(wmesh);
		if(wheelMesh) {
			this.parts.wheels.meshes.push(wheelMesh);
		} else {
			this.parts.wheels.meshes.push(wmesh);
		}
	}
	this.vehicle.setBrake(0, 0);
	this.vehicle.setBrake(0, 1);
	this.vehicle.setBrake(0, 2);
	this.vehicle.setBrake(0, 3);
	
	if(chassisMesh) {
		this.parts.chassis.mesh = chassisMesh;
	} else {
		var boxGeo = new THREE.BoxGeometry(2, 1, 0.5);
		this.parts.chassis.mesh = new THREE.Mesh(
			boxGeo, new THREE.MeshLambertMaterial({
			shading:THREE.SmoothShading, color:0xFFFFEE
		}));
	}
	
	this.update = function() {
		this.parts.chassis.mesh.position.copy(this.parts.chassis.body.position);
		this.parts.chassis.mesh.quaternion.copy(this.parts.chassis.body.quaternion);
		//car1.parts.chassis.mesh.position.copy(car1.vehicle.chassisBody.position);
		//car1.parts.chassis.mesh.quaternion.copy(car1.vehicle.chassisBody.quaternion);
		for (var i = 0; i < this.vehicle.wheelInfos.length; i++) {
			this.vehicle.updateWheelTransform(i);
			var t = this.vehicle.wheelInfos[i].worldTransform;
			this.parts.wheels.bodies[i].position.copy(t.position);
			this.parts.wheels.bodies[i].quaternion.copy(t.quaternion);
			this.parts.wheels.meshes[i].position.copy(t.position);
			this.parts.wheels.meshes[i].quaternion.copy(t.quaternion);
		}
	};
	
	
	world.t.scene.add(this.parts.chassis.mesh);
	world.c.pw.addBody(this.parts.chassis.body);
	
	for(var i = 0; i < 4; i++) {
		world.t.scene.add(this.parts.wheels.meshes[i]);
		world.c.pw.addBody(this.parts.wheels.bodies[i]);
	}
	this.vehicle.addToWorld(world.c.pw);
	world.c.objects.push(this);
	return this;
}


















	

var testShape = new CANNON.Sphere(2);
var testBody = new CANNON.Body({
	mass: 1
});
testBody.addShape(testShape);
//testBody.angularVelocity.set(1,1,0);
testBody.angularDamping = 0.5;
testBody.position.set(0, 2, 5);

var testGeometry = new THREE.SphereGeometry(2);
var testMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00, wireframe: false});
var testMesh = new THREE.Mesh(testGeometry, testMaterial);
createPhysicsObject(testMesh, testBody, world1);
	
	
	
	


	
//ADD BOX
/*testGeometry = new THREE.BoxGeometry(2, 2, 2);
testMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00, wireframe: false });
testMesh = new THREE.Mesh(testGeometry, testMaterial);
testShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
testBody = new CANNON.Body({
	mass: 1
});
testBody.addShape(testShape);
testBody.angularVelocity.set(5, 20, 0);
testBody.angularDamping = 0.5;
testBody.position.set(0, 2, 0);

createPhysicsObject(testMesh, testBody, world1);*/














	
var loader = new THREE.JSONLoader();
loader.load('models/car.json',
	function (geometry, materials) {
		var tex = new THREE.TextureLoader().load('img/car.png');
			//tex.wrapS = THREE.RepeatWrapping;
			//tex.wrapT = THREE.RepeatWrapping;
			//tex.repeat.set(3, 3);
			//tex.needsUpdate = true;
		var material = new THREE.MeshPhongMaterial({
			//map: new THREE.TextureLoader().load('img/car.png'),
      map: tex,
			//color: randomColor({hue: 'blue', luminosity: 'dark'}),
			//colorAmbient: [1, 0.480000026226044, 0.480000026226044],
			//colorDiffuse: [0.480000026226044, 0.480000026226044, 0.480000026226044],
			//colorSpecular: [1, 0.8999999761581421, 0.8999999761581421],
			shading: THREE.FlatShading
		});
	
		//var materials = new THREE.MeshFaceMaterial(material);
		//materials.shading = THREE.FlatShading;
	
		//materials[0].shading = THREE.FlatShading;
		//var faceMaterial = new THREE.MeshFaceMaterial(materials);
		//faceMaterial.shading = THREE.FlatShading;
		//materials[0].shading = THREE.FlatShading;
	
		
		//var texLoader = new THREE.TextureLoader();
		//var materials = new THREE.MeshFaceMaterial(material);
		//materials[0].shading = THREE.FlatShading;
		/*var material = new THREE.MeshLambertMaterial({
			//color: randomColor({hue: 'blue', luminosity: 'dark'}),
			//map: THREE.ImageUtils.loadTexture('img/sky.png'),  // specify and load the texture
			//map: texLoader.load('img/sky.png')
			//map: new THREE.TextureLoader('img/sky.png')
		//shading: THREE.FlatShading
		//colorAmbient: [1, 0.480000026226044, 0.480000026226044],
		//colorDiffuse: [0.480000026226044, 0.480000026226044, 0.480000026226044],
		//colorSpecular: [1, 0.8999999761581421, 0.8999999761581421]
		});*/
		//geometry.materials[0].shading = THREE.FlatShading;
		//material.shading = THREE.FlatShading;

		//var material = new THREE.MeshFaceMaterial(materials);
		car = new THREE.Mesh(geometry, material);
		
		//car.material.shading = THREE.FlatShading;
		//car.scale.set(0.5, 0.5, 0.5);
		car.scale.set(0.5, 0.5, 0.5);

		var newCar = car.clone();
		var newVehicle = makeVehicle(world1, newCar, null, carPhysicsMesh);

		world1.game.player.tObject = newVehicle;
		//createPhysicsObject(world1.game.player.tObject, testBody, world1);
		//world1.t.scene.add(world1.game.player.tObject);
	}
);