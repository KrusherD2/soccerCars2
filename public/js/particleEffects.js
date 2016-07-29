	var explosionSettings = {
		type: SPE.distributions.SPHERE,
		position: {
			spread: new THREE.Vector3(10),
			radius: 1,
		},
		velocity: {
			value: new THREE.Vector3(100)
		},
		size: {
			value: [30, 0]
		},
		opacity: {
			value: [1, 0]
		},
		color: {
			value: [new THREE.Color('yellow'), new THREE.Color('red')]
		},
		particleCount: 20,
		alive: true,
		duration: 0.05,
		maxAge: {
			value: 0.5
		}
	};


	function createFireball(pos1, rotation, isTarget) {
		var fireballSettings = {
			maxAge: {
				value: 1
			},
			position: {
				value: new THREE.Vector3(0, 0, 0),
				spread: new THREE.Vector3(0, 0, 0)
			},
			acceleration: {
				value: new THREE.Vector3(10, 0, 0),
				spread: new THREE.Vector3(5, 5, 0)
			},
			velocity: {
				value: new THREE.Vector3(0, 0, 0),
				spread: new THREE.Vector3(10, 10, 7.5)
			},
			color: {
				value: [new THREE.Color('white'), new THREE.Color('red')]
			},
			size: {
				value: 1
			},
			particleCount: 100,
		};

		var emitter1 = new SPE.Emitter(fireballSettings);
		if (pos1) {
			emitter1.pos1 = pos1;
			//emitter1.position.value = emitter1.position.value.set(emitter1.pos1.x, emitter1.pos1.y, emitter1.pos1.z);
		}

		if (isTarget) {
			emitter1.pos2 = rotation;
		} else {
			emitter1.rot1 = new THREE.Vector3(rotation.x, rotation.y, rotation.z);
		}
		emitter1.disable();
		//setTimeout(function() {
		//emitter1.position.value = emitter1.position.value.set(emitter1.pos1.x, emitter1.pos1.y, emitter1.pos1.z);
		//}, 100);
		emitter1.isNew = true;


		emitter1.update = function() {
			if (this.isNew === true) {
				this.isNew = false;
				this.enable();
				//console.log(this.pos1);
				this.position.value = this.position.value.set(this.pos1.x, this.pos1.y, this.pos1.z);
			}

			if (this.rot1) {
				var pos1 = new THREE.Vector3().copy(this.position.value);
				var pos2 = new THREE.Vector3(0, 2, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rot1.y);
				var pos = pos1.add(pos2);
				this.position.value = this.position.value.set(pos.x, pos.y, pos.z);
			}

			if (this.age > 2) {
				this.remove();
			}

			/*if(typeof world1.game.player.phys != "undefined") {
				var pPhys = world1.game.player.phys;
				var pos = pPhys.position;
				this.position.value = this.position.value.set(pos.x, pos.y, pos.z);
			}*/
		};

		return emitter1;
	}



	function createRain() {
		var rainSettings = {
			maxAge: {
				value: 2
			},
			position: {
				value: new THREE.Vector3(0, 0, 25),
				spread: new THREE.Vector3(100, 100, 0)
			},
			acceleration: {
				value: new THREE.Vector3(0, 0, -2),
				spread: new THREE.Vector3(0, 0, 0)
			},
			velocity: {
				value: new THREE.Vector3(0, 0, -10),
				spread: new THREE.Vector3(0, 0, 0)
			},
			color: {
				value: [new THREE.Color('blue')]
			},
			size: {
				value: 1
			},
			opacity: {
				value: 5
			},
			particleCount: 10000,
		};
		var emitter1 = new SPE.Emitter(rainSettings);
		emitter1.update = function() {
			if (typeof world1.game.player.phys != "undefined") {
				var pPhys = world1.game.player.phys;
				var pos = pPhys.position;
				this.position.value = this.position.value.set(pos.x, pos.y, pos.z + 20);
			}
		};
		return emitter1;
	}


/*world1.spe.groups.smoke = new SPE.Group({
		texture: {
			value: THREE.ImageUtils.loadTexture('./assets/models/icons/particles/particle1.png')
		},
		maxParticleCount: 10000,
	});
	world1.spe.groups.smoke.mesh.frustrumCulled = false;
	world1.spe.groups.smoke.mesh.frustumCulled = false;
	world1.t.scene.add(world1.spe.groups.smoke.mesh);*/



	/*world1.spe.groups.rain = new SPE.Group({
		texture: {
			value: THREE.ImageUtils.loadTexture('./assets/models/icons/particles/waterdrop.png')
		},
		hasPerspective: true,
		//transparent: true
		//depthTest: true,
		//depthWrite: true,
		maxParticleCount: 20000,
	});
	world1.spe.groups.rain.mesh.frustrumCulled = false;
	world1.spe.groups.rain.mesh.frustumCulled = false;
	world1.t.scene.add(world1.spe.groups.rain.mesh);*/


	//var pos = world1.game.player.phys.position;
	//var fireEmitter = new createFireball(pos);
	//world1.spe.groups.smoke.addEmitter(fireEmitter);

	//var rainEmitter = new createRain();
	//world1.spe.groups.rain.addEmitter(rainEmitter);



function particles() {
  
}