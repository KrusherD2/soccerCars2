var util = require('util');
var THREE = require('three');
var CANNON = require('cannon');
//var goblin = require('goblinphysics');
var http = require('http');
var express = require('express');
var session = require('express-session');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var shortid = require('shortid');

var terrain = require('./server/terrain');
var AM = require('./server/account-manager');
var EM = require('./server/email-dispatcher');
var phys = require('./server/phys');

THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);


var router = express.Router();
router.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT, GET,POST");
	next();
});

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

//url: 'mongodb://localhost/character-login:27017'
//mongoose.connect('mongodb://localhost/character-login');
app.set('port', 8100);
//app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
require('./server/routes')(app);

server.listen(8100);
console.log("Multiplayer app listening on port 8100");
var logReset = 0;





function gameServer() {
	// Foward: Y increases, Right: X increases, Up: Z increases
	//    Z |  / Y
	//      |/______    outside of corner of cube
	//            X   
	//this.filter = new filter();
	this.clients = [];
	
	this.nodes = [];
	this.locations = {};
	this.playersOnline = 0;
	this.map = [];

	this.worldMap = new terrain.worldMap(this, "pokemon");

	this.c = {};
	this.c.pw = new CANNON.World();
	this.c.objects = [];
	this.c.pw.gravity.set(0, 0, -10);
	this.c.pw.broadphase = new CANNON.SAPBroadphase(this.c.pw);
	this.c.pw.solver.iterations = 10;
	//this.c.pw.defaultContactMaterial.friction = 0.1;
	//this.c.pw.defaultContactMaterial.restitution = 0;
	
	
	this.valorPoints = 0;
	this.instinctPoints = 0;
	this.mysticPoints = 0;
}

gameServer.prototype.createPhysicsObject = function(phys) {
	this.c.pw.addBody(phys);
};


gameServer.prototype.initScene = function() {


	//
	/*
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			this.worldMap.setZoneByCoord(new THREE.Vector2(i, j));
		}
	}
	*/
	
	this.worldMap.setZoneByCoord(new THREE.Vector2(0, 0));
	
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
	gs.c.pw.add(groundBody);
	
	
	/*for(var k = 0; k < 10; k++) {
		newBall = new ball();
		newBall.phys.position.set(Math.random()*100, Math.random()*100, 100);
		gs.nodes.push(newBall);
	}*/
	
	for(var k = 0; k < 10; k++) {
		newBall = new teamBall();
		var rx = Math.random()*10;
		var ry = Math.random()*10;
		newBall.phys.position.set(500+rx, 500+ry, 100);
		gs.nodes.push(newBall);
	}


	//for(var i = 0; i < this.worldMap.allZones.length; i++) {
	//var zone = this.worldMap.allZones[i];
	//zone.setPhys(__dirname + "/public/assets/models/environment/terrain/area1/heightmap.png");
	//}


	//var randName = "blob"+Math.floor(Math.random()*5000);
	//var newCharacter = new abababe(10, 1000, randName);
	//newCharacter.position.set(0, 0, 0);
	//gs.characters.push(newCharacter);

};

gameServer.prototype.updatePhysics = function() {
	this.c.pw.step(1 / 40);
	for (var i = 0; i < this.c.objects.length; i++) {
		this.c.object[i].update()
	}
};


gameServer.prototype.findPlayerByName = function(username) {
	for (var i = 0; i < this.characters.length; i++) {
		if (this.characters[i].username == username) {
			return this.characters[i];
		}
	}
	return null;
};

gameServer.prototype.findNodeById = function(uniqueId) {
	for (var i = 0; i < this.nodes.length; i++) {
		if (this.nodes[i].uniqueId == uniqueId) {
			return this.nodes[i];
		}
	}
	return null;
};










// in memory account
function client(id) {

	this.socketId = id;
	this.signedIn = false;

	this.username = "";
	this.onlineCharacter = "";

	this.friends = [];

	this.characterNames = [];
	this.characters = [];
	this.nodes = [];

	this.newData = {};



	this.getCharacter = function(num) {
		return this.characters[this.characterNames[num]];
	};

	this.getOnlineCharacter = function() {
		var onlineCharacter;
		for (var i = 0; i < this.characterNames.length; i++) {
			if (this.characters[this.characterNames[i]].online === true) {
				onlineCharacter = this.characters[this.characterNames[i]];
				//continue;
				return onlineCharacter;
			}
		}
		return null;
	}

	this.actions = {};
	this.data = {};

	this.mouseX = 0;
	this.mouseY = 0;
}

client.prototype.update = function() {

	var onlineCharacter = this.getOnlineCharacter();
	if (!onlineCharacter) {
		return;
	}

	onlineCharacter.previouslyVisibleNodes = onlineCharacter.visibleNodes;
	onlineCharacter.calcVisibleNodes();

	io.to(this.socketId).emit('visibleNodes', {
		vn: onlineCharacter.visibleNodes
	});
};












function node(static) {
	this.uniqueId = shortid.generate();
	this.online = false;
	this.static = static;

	this.phys = new phys.createPhysBody2()();

	//this.currentZoneCoords = new THREE.Vector2();
	this.surroundingZone = gs.worldMap.findZoneByAbsoluteCoordinates(this.phys.position);
	this.surroundingZone.nodes.push(this);

	this.visibleNodes = [];

	this.setZone = function() {
		//remove this node from old zone and add to new one IF they changed zones
		var oldZone = this.surroundingZone;
		var oldCoords = oldZone.coordPosition;
		var newZone = gs.worldMap.findZoneByAbsoluteCoordinates(this.phys.position);
		var newCoords = newZone.coordPosition;

		if (oldCoords.x == newCoords.x && oldCoords.y == newCoords.y) {
			return;
		} else {
			var index = this.surroundingZone.nodes.indexOf(this);
			this.surroundingZone.nodes.splice(index, 1);

			this.surroundingZone = gs.worldMap.findZoneByAbsoluteCoordinates(new THREE.Vector3());
			this.surroundingZone.nodes.push(this);
		}
	}

	this.calcVisibleNodes = function() {
		//if(!this.static) {
		this.setZone();
		//}
		// fix this
		//this.visibleNodes = this.surroundingZone.nodes;

		this.visibleNodes = [];

		for (var i = 0; i < this.surroundingZone.nodes.length; i++) {
			var tempNode = this.surroundingZone.nodes[i];
			this.visibleNodes.push(tempNode.viewObj());
		}
		//console.log(this.phys.position);

		/*for(var i = 0; i < this.surroundingZone.nodes.length; i++) {
			this.visibleNodes.push(this.surroundingZone.nodes[i]);
		}
		
		for(var i = 0; i < 8; i++) {
			var zoneCoords = this.surroundingZone.surroundingZoneCoords[i];
			if(typeof gs.worldMap.zones[zoneCoords.x][zoneCoords.y] == "undefined") {
				continue;	
			}
			console.log("test");
			
			var zone = gs.worldMap.zones[zoneCoords.x][zoneCoords.y];
			for(var i = 0; i < zone.nodes.length; i++) {
				this.visibleNodes.push(zone.nodes[i]);
			}
			
		}*/

	};
}



node.prototype.update = function() {

};








function character() {
	node.call(this);
}
character.prototype = Object.create(node.prototype);
character.prototype.constructor = character;







function clientControllable(owner) {
	node.call(this);
	this.owner = owner;
	this.socketId = this.owner.socketId;
	this.data = this.owner.data;

}
clientControllable.prototype.constructor = clientControllable;







function player(owner, characterName, classType) {
	clientControllable.call(this, owner);

	this.online = false;

	this.type = "player";

	this.characterName = characterName;
	if (this.owner.characterNames.indexOf(this.characterName) == -1) {
		this.owner.characterNames.push(this.characterName);
	}


	this.temp = {
		inputVelocity: new THREE.Vector3(),
		isJumping: false,
		isGrounded: false
	};
	//this.phys = phys.createPhysBody("capsule")(5, 1, 3.2);
	phys.createPhysBody2("capsule")(this.phys, 5, 1, 3.2);
	gs.c.pw.addBody(this.phys);
	this.phys.position.set(1, 1, 100);


	this.position = this.phys.position;
	this.quaternion = this.phys.quaternion;
	this.velocity = this.phys.velocity;
	this.rotation2 = function() {
		return this.owner.data.rotation || {
			x: 0,
			y: 0,
			z: 0
		};
	};
	this.health = 100;
	this.level = 0;
	this.experience = 0;

	this.targetId = 0;
	//this.casting = false;
	this.casting = "none";
	this.castStart = 0;
	this.learnedSpells = [];
	this.spells = {};

	this.autoAttacking = false;


	//this.cooldowns = {};
	//this.cooldowns.globalCooldown = 0;

	this.animTo = "idle";
	this.animSpeed = 0.02;
	this.warpTime = 0.2;


	//this.setClass(classType);

	this.load = function(savedCharacter) {
		var sc = savedCharacter;
		//this.uniqueId = sn.uniqueId;
		this.characterName = sc.characterName;
		if (typeof sc.position != "undefined") {
			this.position.set(sc.position.x, sc.position.y, sc.position.z + 10);
		}
		if (typeof sc.velocity != "undefined") {
			this.velocity.set(sc.velocity.x, sc.velocity.y, sc.velocity.z);
		}
		this.score = sc.score;
		this.health = sc.health;
		this.level = sc.level;
		this.experience = sc.experience;
		this.setClass(sc.class);
	}
}
player.prototype = Object.create(character.prototype);
player.prototype.constructor = player;


player.prototype.viewObj = function() {
	return {
		uniqueId: this.uniqueId,
		type: this.type,
		class: this.class,
		position: this.position,
		velocity: this.velocity,
		quaternion: this.quaternion,
		rotation2: this.rotation2(),
		characterName: this.characterName,
		health: this.health,
		level: this.level,
		spells: this.spells,
		learnedSpells: this.learnedSpells,
		experience: this.experience,
		cooldowns: this.cooldowns,
		animTo: this.animTo,
		animSpeed: this.animSpeed,
		warpTime: this.warpTime,
	};
};

player.prototype.saveObj = function() {
	return {
		// should I save unique Id?
		type: this.type,
		class: this.class,
		position: this.position,
		velocity: this.velocity,
		quaternion: this.quaternion,
		//rotation2: this.rotation2,
		characterName: this.characterName,
		health: this.health,
		level: this.level,
		experience: this.experience
	};
};






player.prototype.takeDamage = function(amount, shooter) {
	if (shooter) {
		shooter.gainXP(1);
	}
	this.health -= amount;
	if (this.health < 0) {
		if (shooter) {
			shooter.gainXP(9);
		}
		this.phys.position.set(0, 0, 0);
		this.health = 100;
	}
};

player.prototype.levelUp = function() {
	this.experience = 0;
	this.level += 1;
	this.health = 100;
	this.checkSpells();
};


player.prototype.gainXP = function(amount) {
	this.experience += amount;
	if (this.experience > 100 * this.level) {
		this.levelUp();
	}
};


player.prototype.cast = function(spellName) {
	if (typeof this.learnedSpells[spellName] != "undefined") {

		if (!this.spells[spellName].enabled) {
			return;
		}

		switch (spellName) {
			case "fireball":


				break;

			case "melee":
				if (!this.targetId) {
					break;
				}
				var character = gs.findNodeById(this.targetId);
				character.takeDamage(10);
				this.spells[spellName].use();


				break;
		}
		//this.spells[spellName]
	}
};


player.prototype.learnSpell = function(spellName) {
	this.learnedSpells.push(spellName);
	this.spells[spellName] = new spell(spellName, 3000);
};


player.prototype.processInput = function() {
	var data = this.owner.data;
	var actions = this.owner.actions;
	var rotation = this.owner.data.rotation || new THREE.Vector3();

	//this.checkCooldowns();

	this.temp.inputVelocity.set(0, 0, 0);


	if (actions.moveForward && this.temp.isGrounded == true) {
		this.animTo = "walking_inPlace";
		var rotatedV = new THREE.Vector3().copy(this.phys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x);
		if (rotatedV.x > 0) {
			this.temp.inputVelocity.x = -rotatedV.x;
		} else {
			this.temp.inputVelocity.x = -20;
		}
	}

	if (actions.moveBackward && this.temp.isGrounded == true) {
		this.animTo = "walking_inPlace";
		var rotatedV = new THREE.Vector3().copy(this.phys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x);
		if (rotatedV.x < 0) {
			this.temp.inputVelocity.x = -rotatedV.x;
		} else {
			this.temp.inputVelocity.x = 20;
		}
	}
	if (actions.moveLeft && this.temp.isGrounded == true) {
		this.animTo = "left_strafe_walking_inPlace";
		var rotatedV = new THREE.Vector3().copy(this.phys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x);
		if (rotatedV.y > 0) {
			this.temp.inputVelocity.y = -rotatedV.y;
		} else {
			this.temp.inputVelocity.y = -20;
		}
	}
	if (actions.moveRight && this.temp.isGrounded == true) {
		this.animTo = "right_strafe_walking_inPlace";
		var rotatedV = new THREE.Vector3().copy(this.phys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x);
		if (rotatedV.y < 0) {
			this.temp.inputVelocity.y = -rotatedV.y;
		} else {
			this.temp.inputVelocity.y = 20;
		}
	}

	//this.temp.inputVelocity.normalize();
	this.temp.inputVelocity.setLength(20);

	if (!actions.moveForward && !actions.moveBackward && this.temp.isGrounded == true) {
		var rotatedV = new THREE.Vector3().copy(this.phys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x).multiplyScalar(0.1);
		this.temp.inputVelocity.x = -rotatedV.x;
	}
	if (!actions.moveLeft && !actions.moveRight && this.temp.isGrounded == true) {
		var rotatedV = new THREE.Vector3().copy(this.phys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x).multiplyScalar(0.1);
		this.temp.inputVelocity.y = -rotatedV.y;
	}



	this.temp.inputVelocity.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotation.x);
	if (this.temp.isGrounded === true) {
		this.phys.velocity.x = this.temp.inputVelocity.x;
		this.phys.velocity.y = this.temp.inputVelocity.y;
		this.phys.velocity.z = 0;
		this.phys.applyLocalForce(new CANNON.Vec3(0, 0, 10), new CANNON.Vec3(0, 0, 0));
	}



	var px = Math.pow(this.phys.velocity.x, 2);
	var py = Math.pow(this.phys.velocity.y, 2);
	var pz = Math.sqrt(px + py);
	if (pz < 0.3 && (this.animTo == "walking_inPlace" || this.animTo == "left_strafe_walking_inPlace" || this.animTo == "right_strafe_walking_inPlace")) {
		this.animTo = "idle";
	}

	var pVec1 = new CANNON.Vec3().copy(this.phys.position).vadd(new CANNON.Vec3(0, 0, -2.7));

	var pVec2 = pVec1.vsub(new CANNON.Vec3(0, 0, 800));
	var result = new CANNON.RaycastResult();
	gs.c.pw.raycastAny(pVec1, pVec2, {}, result);
	if (result.hasHit) {
		//var hitPoint1 = new THREE.Vector3().copy(result.hitPointWorld);

		if (result.distance < 1) {
			this.temp.isGrounded = true;
		} else if (result.distance > 2) {
			this.temp.isGrounded = false;
		}

		if (result.distance < 4) {
			this.phys.position.z += 0.01 - result.distance;
		}


		/*if(result.distance < 1 && this.temp.isJumping === false) {
			this.phys.position.z += 0.01 - result.distance;
		}
		if (result.distance < 0.05) {
			if(this.animTo == "jump") {
				this.animTo = "idle";
				this.animSpeed = 0.02;
			}
			this.temp.isGrounded = true;
		} else {
			this.temp.isGrounded = false;
		}
	} else {
		this.phys.position.z += 0.1;*/
	}

	/*if (actions.jump && this.temp.isGrounded === true && this.temp.isJumping === false) {
		this.animTo = "jump";
		this.animSpeed = 0.2;
		//setTimeout(function() {
			//scope.animTo = "idle";
		//}, 500);
		this.gainXP(10);
		//this.score += 1;
		this.temp.isJumping = true;
		this.phys.applyLocalImpulse(new CANNON.Vec3(0, 0, 30), new CANNON.Vec3(0, 0, 0));
		//this.phys.position.z += 0.5;
	}
	
	if (!actions.jump && this.temp.isGrounded === true) {
		this.temp.isJumping = false;
	}*/


	//if(data.target) {

	//}

	if (data.casting && this.casting == "none") {
		this.cast(data.casting);
	}

};



player.prototype.updateOwner = function() {
	io.to(this.socketId).emit('visibleNodes', {
		vn: this.visibleNodes
	});
};

player.prototype.update = function() {
	// rename to process input?
	this.processInput();

	// last thing in this function
	this.calcVisibleNodes();
	this.updateOwner();
};



function cooldown(cooldownTime) {
	this.enabled = true;
	this.cooldownTime = cooldownTime;
	return this;
}

















function teamCar(owner, characterName, team) {
	clientControllable.call(this, owner);

	this.team = team;
	this.type = "teamCar"

	this.ph = new phys.createVehicleBody();

	// set references to chassis body
	this.phys.position = this.ph.vehicle.chassisBody.position;
	this.phys.quaternion = this.ph.vehicle.chassisBody.quaternion;
	this.phys.velocity = this.ph.vehicle.chassisBody.velocity;

	this.ph.addVehicleToWorld(gs.c.pw);

	this.phys.position.set(500, 500, 100);


	this.characterName = characterName;
	if (this.owner.characterNames.indexOf(this.characterName) == -1) {
		this.owner.characterNames.push(this.characterName);
	}

	this.temp = {};
	this.temp.inputVelocity = new THREE.Vector3(0, 0, 0);
	this.temp.currentEngineForce = 0;
	this.temp.currentSteeringValue = 0;
	this.temp.steerMinMax = 0.6;
	this.temp.engineForceMinMax = 5000;
	
	this.removeSelf = function(physicsWorld) {
		this.ph.removeVehicleFromWorld(physicsWorld);
	}

}
teamCar.prototype = Object.create(clientControllable.prototype);
teamCar.prototype.constructor = teamCar;

teamCar.prototype.updateOwner = function() {
	io.to(this.socketId).emit('visibleNodes', {
		vn: this.visibleNodes,
		scores: [gs.instinctPoints, gs.mysticPoints, gs.valorPoints]
	});
};

teamCar.prototype.update = function() {
	this.processInput();

	// last thing in this function
	this.calcVisibleNodes();
	this.updateOwner();
};




teamCar.prototype.viewObj = function() {
	return {
		uniqueId: this.uniqueId,
		type: this.type,
		team: this.team,
		position: this.phys.position,
		velocity: this.phys.velocity,
		quaternion: this.phys.quaternion,
		//rotation2: this.rotation2(),
		characterName: this.characterName,
		animTo: this.animTo,
		animSpeed: this.animSpeed,
		warpTime: this.warpTime,
	};
};



teamCar.prototype.processInput = function() {

	var data = this.owner.data;
	var actions = this.owner.actions;
	//var rotation = this.owner.data.rotation || new THREE.Vector3();

	this.temp.inputVelocity.set(0, 0, 0);


	if (actions.moveForward) {
		if (this.temp.currentEngineForce < this.temp.engineForceMinMax) {
			this.temp.currentEngineForce += 100;
		}
		this.ph.vehicle.applyEngineForce(this.temp.currentEngineForce, 2);
		this.ph.vehicle.applyEngineForce(this.temp.currentEngineForce, 3);
	}

	if (actions.moveBackward) {
		if (this.temp.currentEngineForce > -this.temp.engineForceMinMax) {
			this.temp.currentEngineForce -= 100;
		} else {
			this.temp.currentEngineForce = -this.temp.engineForceMinMax;
		}
		this.ph.vehicle.applyEngineForce(this.temp.currentEngineForce, 2);
		this.ph.vehicle.applyEngineForce(this.temp.currentEngineForce, 3);
	}


	if (actions.moveLeft) {
		if (this.temp.currentSteeringValue < this.temp.steerMinMax) {
			this.temp.currentSteeringValue += 0.05;
		} else {
			this.temp.currentSteeringValue = this.temp.steerMinMax;
		}
		this.ph.vehicle.setSteeringValue(this.temp.currentSteeringValue, 0);
		this.ph.vehicle.setSteeringValue(this.temp.currentSteeringValue, 1);
	}

	if (actions.moveRight) {
		if (this.temp.currentSteeringValue > -this.temp.steerMinMax) {
			this.temp.currentSteeringValue -= 0.05;
		} else {
			this.temp.currentSteeringValue = -this.temp.steerMinMax;
		}
		this.ph.vehicle.setSteeringValue(this.temp.currentSteeringValue, 0);
		this.ph.vehicle.setSteeringValue(this.temp.currentSteeringValue, 1);
	}


	if (!actions.moveLeft && !actions.moveRight) {
		this.temp.currentSteeringValue *= 0.5;
		this.ph.vehicle.setSteeringValue(this.temp.currentSteeringValue, 0);
		this.ph.vehicle.setSteeringValue(this.temp.currentSteeringValue, 1);
	}

	if (!actions.moveForward && !actions.moveBackward) {
		this.temp.currentEngineForce *= 0.5;
		this.ph.vehicle.applyEngineForce(this.temp.currentEngineForce, 2);
		this.ph.vehicle.applyEngineForce(this.temp.currentEngineForce, 3);
	}
	
	if(actions.flip) {
		this.ph.vehicle.chassisBody.applyLocalImpulse(new CANNON.Vec3(0, 0, -55), new CANNON.Vec3(0, 10, -10));
	}
	
	if(actions.boost) {
		this.ph.vehicle.chassisBody.applyLocalImpulse(new CANNON.Vec3(100, 0, 0), new CANNON.Vec3(0, 0, 0));
	}
};





function ball() {
	node.call(this);
	this.type = "ball";
	//this.radius = 10;// replace with .phys property?
	
	phys.createPhysBody2("sphere")(this.phys, 500, 2.75);
	
	gs.c.pw.addBody(this.phys);
	

}

ball.prototype.viewObj = function() {
	return {
		uniqueId: this.uniqueId,
		type: this.type,
		position: this.phys.position,
		velocity: this.phys.velocity,
		quaternion: this.phys.quaternion,
		//radius: this.radius,
	};
};

ball.prototype.update = function() {
	this.setZone();
};




function teamBall() {
	ball.call(this);
	
	
	
}

teamBall.prototype.respawn = function() {
	var rx = Math.floor(Math.random() * 21) - 10;
	var ry = Math.floor(Math.random() * 21) - 10;
	this.phys.position.set(500+rx, 500+ry, 100)
};

teamBall.prototype.checkForGoal = function() {
	var goalLocations = {};
	goalLocations.valor = new THREE.Vector3(858, 314, 56);
	goalLocations.mystic = new THREE.Vector3(164, 309, 56);
	goalLocations.instinct = new THREE.Vector3(858, 314, 56);
	
	var position = new THREE.Vector3().copy(this.phys.position);
	var dist = 10;
	if(position.distanceTo(goalLocations.instinct) < dist) {
		gs.instinctPoints += 1;
		this.respawn();
	}
	
	if(position.distanceTo(goalLocations.mystic) < dist) {
		gs.mysticPoints += 1;
		this.respawn();
	}
	
	if(position.distanceTo(goalLocations.valor) < dist) {
		gs.valorPoints += 1;
		this.respawn();
	}
	
	
};


teamBall.prototype.update = function() {
	this.setZone();
	this.checkForGoal();
};


teamBall.prototype.viewObj = function() {
	return {
		uniqueId: this.uniqueId,
		type: this.type,
		position: this.phys.position,
		velocity: this.phys.velocity,
		quaternion: this.phys.quaternion,
		//radius: this.radius,
	};
};





























var gameServer1 = new gameServer();
var gs = gameServer1;
gs.initScene();

io.on('connection', function(socket) {
	gs.playersOnline += 1;
	io.emit('playersOnline', gs.playersOnline);

	var newClient = new client(socket.id);

	gs.clients[socket.id] = newClient;
	gs.map.push(socket.id);
	//console.log("connected id: " + socket.id);
	console.log("gs.map.length: " + gs.map.length);



	socket.on('autoLogin', function(data) {




	});

	socket.on('joinWorld', function(data) {
		if (gs.clients[socket.id].signedIn === true) {

		} else {
			var guestName = "guest" + Math.floor(Math.random() * 1000000);
			gs.clients[socket.id].username = guestName;
			gs.clients[socket.id].characterNames.push(guestName);

			var newCharacter;
			if (data.type == "teamCar") {
				newCharacter = new teamCar(gs.clients[socket.id], guestName, data.class);
			} else if (data.type == "human") {
				newCharacter = new player(gs.clients[socket.id], guestName, data.class);
			}

			newCharacter.online = true;
			gs.clients[socket.id].characters[guestName] = newCharacter;
			gs.nodes.push(gs.clients[socket.id].characters[guestName]);

			socket.emit('initData', {
				accountName: guestName,
				characterName: guestName,
				uniqueId: newCharacter.uniqueId,
			});

		}
	});

	socket.on('getLatency', function(data) {
		io.to(socket.id).emit('returnLatency', {
			latency: data.latency,
		});
	});


	socket.on('disconnect', function() {
		gs.playersOnline -= 1;
		io.emit('playersOnline', gs.playersOnline);

		var tempClient = gs.clients[socket.id];

		var onlineCharacter = tempClient.getOnlineCharacter();
		if (!onlineCharacter) {
			return;
		}

		// remove online character
		var zone = onlineCharacter.surroundingZone;
		var index = zone.nodes.indexOf(onlineCharacter);
		zone.nodes.splice(index, 1);
		
		
		index = gs.nodes.indexOf(onlineCharacter);
		gs.nodes.splice(index, 1);
		
		onlineCharacter.removeSelf(gs.c.pw);
		//gs.c.pw.removeBody(onlineCharacter.phys);
		// end of remove online character

		var path = 'characters.' + onlineCharacter.characterName;
		var data = {};
		data.username = gs.clients[socket.id].username;
		data.$set = {};
		data.$set[path] = onlineCharacter;

		AM.updateAccount(data, function(err, tempAccount) {
			if (tempAccount) {
				console.log("character saved");
			}
		});

		delete gs.clients[socket.id];
		gs.map.splice(gs.map.indexOf(socket.id), 1);

		console.log("gs.map.length: " + gs.map.length);
	});


	socket.on('input', function(data) {
		gs.clients[socket.id].actions = data.actions || {};
		gs.clients[socket.id].data = data.data || {};
	});

	socket.on('getNumOfPlayersOnline', function(data) {
		socket.emit('playersOnline', gs.playersOnline);
	});
});


function loop() {
	/*for (var i = 0; i < gs.nodes.length; i++) {
		if(gs.nodes[i].type == "player" && typeof gs.clients[gs.nodes[i].socketId] == "undefined") {
			gs.nodes.splice(i, 1);
			console.log("node deleted");
			continue;
		}
		
		var tempNode = gs.nodes[i];
		tempNode.move();
	}*/




	/*for (var i = 0; i < gs.nodes.length; i++) {
		if(gs.nodes[i].type == "player") {
			var tempNode = gs.nodes[i];
			tempNode.updateOwner();
		}
	}*/

	/*for (var j = 0; j < gs.map.length; j++) {
		gs.clients[gs.map[j]].update();
	}*/

	// DO THIS
	//for(var i = 0; i < gs.worldMap.AllZones.length; i++) {

	//}

	for (var i = 0; i < gs.nodes.length; i++) {
		gs.nodes[i].update();
	}



	gs.updatePhysics();

	if (logReset <= 200) {
		logReset += 1;
	} else if (logReset > 200) {
		logReset = 0;
	}
	setTimeout(loop, 1000 / 40);
}
setTimeout(loop, 100);