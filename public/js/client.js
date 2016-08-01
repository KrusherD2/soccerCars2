//window.lzma = require('../../node_modules/lzma');

window.localforage = require('./libs/localforage');
//localforage.clear();
//var io = require('socket.io');
window.$ = require('jquery');
require('./libs/jquery.color')
window.THREE = require('three');
require('./libs/orbitControls');
require('./libs/projector');
require('./libs/canvasRenderer');
require('./libs/blendCharacter');
var Stats = require('./libs/stats.min');
require('./libs/cannonDebugRenderer');
require('./libs/skyShader');
window.CANNON = require('cannon');
var SPE = require('shader-particle-engine');
var hamsters = require('./libs/hamsters.min');
require('./libs/sweetalert.min');
//var mobileConsole = require('./libs/mobile-console');
var VirtualJoystick = require('./libs/virtualjoystick');
var randomColor = require('./libs/randomColor');
var phys = require('../../server/phys');


var fn = require('./functions');
for (var i in fn) {
	window[i] = fn[i];
}

//super global variables (testing)
var onRenderFunctions;
window.input;
window.world1;
window.logReset = -10;
window.sky1;
var socket;
var sound1;
var preferences;

function log(text) {
	if (logReset === 0) {
		console.log(text);
	}
}

document.exitPointerLock = document.exitPointerLock ||
         document.mozExitPointerLock;

$(function() {
	//(function(){var script=document.createElement('script');script.type='text/javascript';script.src='https://cdn.rawgit.com/zz85/zz85-bookmarklets/master/js/ThreeInspector.js';document.body.appendChild(script);})()
	THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
	//mobileConsole.show();

	preferences = {};
	preferences.keyboard = {};
	preferences.sound = {};
	preferences.video = {};


	input = {};
	// touch input
	input.touches = [];
	input.currentTouches = [];
	
	// mouse input
	input.mouse = {};
	//input.mouse.x = 0;
	//input.mouse.y = 0;
	input.mouse.ray = new THREE.Vector2();
	input.mouse.HUDRay = new THREE.Vector2();
	
	input.mouse.lclick = {};
	input.mouse.lclick.held = false;
	input.mouse.lclick.initialCoords = new THREE.Vector2();
	input.mouse.lclick.releaseCoords = new THREE.Vector2();
	
	input.mouse.mclick = {};
	input.mouse.mclick.held = false;
	input.mouse.mclick.initialCoords = new THREE.Vector2();
	input.mouse.mclick.releaseCoords = new THREE.Vector2();
	
	input.mouse.rclick = {};
	input.mouse.rclick.held = false;
	input.mouse.rclick.initialCoords = new THREE.Vector2();
	input.mouse.rclick.releaseCoords = new THREE.Vector2();
	
	input.mouse.scrollLevel = 10;

	input.data = {};

	input.controls = {};
	input.controls.rotation = new THREE.Vector3();


	// Set default keyboard layout
	preferences.keyboard.layout = {};
	preferences.keyboard.layout.moveForward = 87;
	preferences.keyboard.layout.moveBackward = 83;
	preferences.keyboard.layout.moveLeft = 65;
	preferences.keyboard.layout.moveRight = 68;
	preferences.keyboard.layout.jump = 32;
	//preferences.keyboard.layout.castFireball = 49;

	/*preferences.keyboard.layout.activateSpellSlot1 = 49;
	preferences.keyboard.layout.activateSpellSlot2 = 50;
	preferences.keyboard.layout.activateSpellSlot3 = 51;
	preferences.keyboard.layout.activateSpellSlot4 = 52;

	preferences.keyboard.layout.toggleInventory = 73;*/
	preferences.keyboard.layout.toggleSettingsWindow = 79;
	preferences.keyboard.layout.toggleMap = 77;


	input.action = {};
	for (var i in preferences.keyboard.layout) {
		input.action[i] = false;
	}


	// Get stored preferences
	localforage.getItem('preferences').then(function(value) {
		// If they exist, write them
		if (value) {
			preferences = value;
		}
		// Store the preferences (so that the default values get stored)
		localforage.setItem('preferences', preferences);


		// Update the keyboard layout settings window to reflect the stored settings, not the default ones
		for (var i = 0; i < $(".buttonConfig").length; i++) {
			var div = $(".buttonConfig")[i];
			var assignedKey = preferences.keyboard.layout[div.id];
			$("#" + div.id).html(String.fromCharCode(assignedKey).toLowerCase());
		}
	});

	//change document to #keyboardLayoutConfig using <tabindex="0">
	$(".buttonConfig").on('click', function(e) {
		$(document).off("keydown");
		window.addEventListener("keydown", handleKey, false);
		$(document).on("keydown", function(e2) {
			console.log(e2.which);
			var values = [];
			for (var i in preferences.keyboard.layout) {
				values.push(preferences.keyboard.layout[i]);
			}
			//var values = Object.values(preferences.keyboard.layout);
			if (values.indexOf(e2.which) == -1) {
				$("#" + e.target.id).html(String.fromCharCode(e2.which));
				preferences.keyboard.layout[e.target.id] = e2.which;
				localforage.setItem('preferences', preferences);

				$(document).off("keydown");
				window.addEventListener("keydown", handleKey, false);
			} else {
				$("#" + e.target.id).animate({
					backgroundColor: "#AC3333"
				}, 'fast');
				setTimeout(function() {
					$("#" + e.target.id).animate({
						backgroundColor: "#888"
					}, 'slow');
				}, 100);
			}
		});
	});
	$("#keyboardLayoutConfig").on('click', function(e) {
		//console.log(e.target);
		var isButton = e.target.classList[0] == "buttonConfig";
		if (!isButton) {
			$(document).off("keydown");
			window.addEventListener("keydown", handleKey, false);
		}
	});

	document.oncontextmenu = function() {
		return false;
	};


	$(document).on('mousedown', function(event) {
		input.mouse.x = event.clientX;
		input.mouse.y = event.clientY;
		
		switch (event.which) {
			case 1:
				input.mouse.lclick.held = true;
				input.mouse.lclick.initialCoords.x = event.clientX;
				input.mouse.lclick.initialCoords.y = event.clientY;
				break;
			case 2:
				input.mouse.mclick.held = true;
				input.mouse.mclick.initialCoords.x = event.clientX;
				input.mouse.mclick.initialCoords.y = event.clientY;
				break;
			case 3:
				input.mouse.rclick.held = true;
				input.mouse.rclick.initialCoords.x = event.clientX;
				input.mouse.rclick.initialCoords.y = event.clientY;
				break;
		}
	});

	$(document).on('mouseup', function(event) {
		input.mouse.x = event.clientX;
		input.mouse.y = event.clientY;
		switch (event.which) {
			case 1:
				input.mouse.lclick.held = false;
				input.mouse.lclick.releaseCoords.x = event.clientX;
				input.mouse.lclick.releaseCoords.y = event.clientY;
				break;
			case 2:
				input.mouse.mclick.held = false;
				input.mouse.mclick.releaseCoords.x = event.clientX;
				input.mouse.mclick.releaseCoords.y = event.clientY;
				break;
			case 3:
				input.mouse.rclick.held = false;
				input.mouse.rclick.releaseCoords.x = event.clientX;
				input.mouse.rclick.releaseCoords.y = event.clientY;
				break;
		}
	});


	$(document).on('mousemove', function(e) {
		e.preventDefault();
		
		event = e.originalEvent;
		
		var movementX = event.movementX || event.mozMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || 0;

		input.mouse.x = event.clientX;
		input.mouse.y = event.clientY;
		
		input.mouse.deltaX = movementX;
		input.mouse.deltaY = movementY;
		

		input.mouse.HUDRay.x = (event.clientX / world1.width) * 2 - 1;
		input.mouse.HUDRay.y = -(event.clientY / world1.height) * 2 + 1;

		input.mouse.ray.x = (event.clientX / world1.width) * 2 - 1;
		input.mouse.ray.y = -(event.clientY / world1.height) * 2 + 1;

		var xminmax = 0.5;
		var yminmax = 0.5;
		
		var deltaX = limit(-1 * xminmax, xminmax, input.mouse.deltaX)*-0.1;
		var deltaY = limit(-1 * yminmax, yminmax, input.mouse.deltaY)*0.1;


		if (input.mouse.rclick.held || input.mouse.lclick.held) {
			input.controls.rotation.x += deltaX;
			input.controls.rotation.y += deltaY;
			
			input.controls.rotation.x = limit(0, Math.PI * 2, input.controls.rotation.x, true, true);
			input.controls.rotation.y = limit((-Math.PI / 2) + 0.02, (Math.PI / 2) - 0.02, input.controls.rotation.y, false);
		}
	});




	$(document).on('wheel', function(event) {
		var delta = event.originalEvent.deltaY;
		if (delta < 0) {
			input.mouse.scrollLevel -= 0.5 * input.mouse.scrollLevel;
		} else if (delta > 0) {
			input.mouse.scrollLevel += 0.5 * input.mouse.scrollLevel;
		}
		input.mouse.scrollLevel = limit(0.1, 10000, input.mouse.scrollLevel, false);
	});




	// HANDLE TOUCH EVENTS

	//var ongoingTouches = [];







	function handleStart(evt) {
		evt.preventDefault();
		console.log("touchstart.");
		var touches = evt.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			input.currentTouches.push(copyTouch(touches[i]));
			console.log("touchstart:" + i + ".");
		}
	}





	function handleMove(evt) {
		evt.preventDefault();
		var el = document.getElementsByTagName("canvas")[0];
		var ctx = el.getContext("2d");
		var touches = evt.changedTouches;

		for (var i = 0; i < touches.length; i++) {
			var color = colorForTouch(touches[i]);
			var idx = findCurrentTouchIndexById(touches[i].identifier);

			if (idx >= 0) {
				console.log("continuing touch " + idx);
				console.log("ctx.moveTo(" + input.currentTouches[idx].pageX + ", " + input.currentTouches[idx].pageY + ");");

				console.log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");

				input.currentTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
				console.log(".");
			} else {
				console.log("can't figure out which touch to continue");
			}
		}
	}







	function handleEnd(evt) {
		evt.preventDefault();
		console.log("touchend");
		var touches = evt.changedTouches;
		for (var i = 0; i < touches.length; i++) {
			var idx = findCurrentTouchIndexById(touches[i].identifier);
			if (idx >= 0) {
				//ctx.moveTo(input.currentTouches[idx].pageX, input.currentTouches[idx].pageY);
				input.currentTouches.splice(idx, 1); // remove it; we're done
			} else {
				console.log("can't figure out which touch to end");
			}
		}
	}




	function handleCancel(evt) {
		evt.preventDefault();
		console.log("touchcancel.");
		var touches = evt.changedTouches;
		for (var i = 0; i < touches.length; i++) {
			input.currentTouches.splice(i, 1); // remove it; we're done
		}
	}




	function copyTouch(newTouch, oldTouch) {
		if (oldTouch) {
			return {
				identifier: newTouch.identifier,
				screenX: newTouch.screenX,
				screenY: newTouch.screenY,
				clientX: newTouch.clientX,
				clientY: newTouch.clientY,
				pageX: newTouch.pageX,
				pageY: newTouch.pageY,
				// movement
				deltaScreenX: oldTouch.screenX - newTouch.screenX,
				deltaScreenY: oldTouch.screenY - newTouch.screenY,
				deltaClientX: oldTouch.clientX - newTouch.clientX,
				deltaClientY: oldTouch.clientY - newTouch.clientY,
				deltaPageX: oldTouch.pageX - newTouch.pageX,
				deltaPageY: oldTouch.pageY - newTouch.pageY,
			};
		} else {
			return {
				identifier: newTouch.identifier,
				screenX: newTouch.screenX,
				screenY: newTouch.screenY,
				clientX: newTouch.clientX,
				clientY: newTouch.clientY,
				pageX: newTouch.pageX,
				pageY: newTouch.pageY,
			};
		}
	}



	function findCurrentTouchIndexById(idToFind) {
		for (var i = 0; i < input.currentTouches.length; i++) {
			var id = input.currentTouches[i].identifier;
			if (id == idToFind) {
				return i;
			}
		}
		return -1; // not found
	}



	$(document).on("touchstart", handleStart, false);
	$(document).on("touchend", handleEnd, false);
	$(document).on("touchcancel", handleCancel, false);
	$(document).on("touchmove", handleMove, false);

	// END OF HANDLE TOUCH EVENTS



















	function handleKey(event) {
		// Set state variable
		var state;
		// Switch between keyup and keydown
		switch (event.type) {
			case "keydown":
				state = true;
				break;
			case "keyup":
				state = false;
				break;
		}

		// Check which key was pressed using the current keyboard layout
		// This is just for short(ish) hand notation
		var keyboardLayout = preferences.keyboard.layout;

		switch (event.keyCode) {
			case keyboardLayout.jump:
				input.action.jump = state;
				break;
			case keyboardLayout.moveForward:
				input.action.moveForward = state;
				break;
			case keyboardLayout.moveBackward:
				input.action.moveBackward = state;
				break;
			case keyboardLayout.moveLeft: //a
				input.action.moveLeft = state;
				break;
			case keyboardLayout.moveRight: //d
				input.action.moveRight = state;
				break;
			case keyboardLayout.up: //up
				input.action.up = state;
				break;
			case keyboardLayout.down: //down
				input.action.down = state;
				break;
			case keyboardLayout.left: //left
				input.action.left = state;
				break;
			case keyboardLayout.right: //right
				input.action.right = state;
				break;
			case keyboardLayout.toggleSettingsWindow:
				if (state) {
					input.action.toggleSettingsWindow = !input.action.toggleSettingsWindow;
				}
				if (input.action.toggleSettingsWindow) {
					$('#settingsWindow').modal();
				} else {
					$('#settingsWindow').modal("hide");
				}
				break;
		}
	}

	window.addEventListener("keydown", handleKey, false);
	window.addEventListener("keyup", handleKey, false);










	// Connect to the server
	socket = io('http://fosse.co', {
		path: '/8100/socket.io'
	});
	// When the server is connected to:
	socket.on('connection', function(data) {
		console.log(data);
	});

	function login(characterName, team, type) {
		if (window.signedIn) {

			socket.emit('joinWorld', {
				characterName: characterName,
			});

		} else {
			console.log('joining');
			socket.emit('joinWorld', {
				characterName: characterName,
				class: team,
				type: "teamCar"// or human
			});
		}

		// Hide the title screen
		$('#titleScreen').modal('hide');
		$('#loadScreen').modal({
			backdrop: "static",
			keyboard: false,
		});

		$(".progress-bar").animate({
			width: "0%"
		}, 10);



		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			//world1.t.camera.aspect = (window.innerWidth/2)/(window.innerHeight/2);
			//world1.t.camera.aspect = (window.innerWidth/2)/(window.innerHeight/2);
			//world1.t.camera.updateProjectionMatrix();
			//world1.t.renderer.setSize(window.innerWidth/2, window.innerHeight/2);
			//world1.t.renderer.setSize(1024, 1024);
			/*input.joystick = new VirtualJoystick({
				mouseSupport: true,
				limitStickTravel: true,
				stickRadius: 50,
				strokeStyle: randomColor()
			});*/
		}
	}

	// on change of render settings
	/*$("#renderSetter").on('change', function(event) {
		var newRenderer = $("#renderSetter").val();
		if (typeof world1.t !== "undefined") {
			var wt = world1.t;
			if (wt.renderer && wt.renderer.domElement) {
				wt.renderer.domElement.parentNode.removeChild(wt.renderer.domElement);
			}
			wt.renderer = new THREE[newRenderer]();
			wt.renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(wt.renderer.domElement);
		}
	});*/


	$("#playBtn").on('click', function(event) {
		event.preventDefault();

		var character = $("#characterSelector").find(':input:checked')[0].value;
		if (typeof getCookie('username') != "undefined") {
			login(false, character);
		} else {
			login(true, character, character);
		}
	});


	/*socket.on('returnLatency', function(data) {
		var currentTime = new Date().getTime();
		var previousTime = data.latency;
		var latency = (currentTime - previousTime) / 2;
		//console.log(latency);
	});

	setInterval(function() {
		socket.emit('getLatency', {
			latency: new Date().getTime()
		});
	}, 1000);*/




	// On confirmed connection
	socket.on('initData', function(data) {
		console.log("joined");
		//world1.game.player.id = socket.id;


		world1.t.AH.onloadFuncs.push(function() {
			world1.game.player = new teamCar();
			//world1.game.player = new playerConstructor();
			//world1.game.player.setClass("wizard");
			world1.game.accountName = data.accountName;
			world1.game.player.characterName = data.characterName;
			world1.game.player.uniqueId = data.uniqueId;

			world1.game.connected = true;
			$("#loadScreen").modal('hide');
		});

		var fileList = [
			"assets/models/objects/vehicles/car.json",
			//"assets/models/characters/players/wizard/final/wizard.json",
			//"assets/models/environment/trees/animated-tree/final/treeBark.json",
			//"assets/models/environment/trees/animated-tree/final/treeLeaves.json",
		];
		world1.t.AH.loadAssets(fileList);

	});

	socket.on('notLoggedIn', function() {
		swal("Not logged in!");
	});

	socket.on('playersOnline', function(data) {
		$("#numOfPlayers").text(data);
	});
	socket.emit('getNumOfPlayersOnline');

	window.gainXP = function() {
		socket.emit('gainXP');
	};



	socket.on('visibleNodes', function(data) {
		
		world1.game.visiblePlayersData = data.vn;// moved here 7-31-16
		
		var vp = world1.game.visiblePlayers;
		var vpd = world1.game.visiblePlayersData;
		//CHECK FOR DELETED PLAYERS
		var currentNodes = [];
		var newNodes = [];
		for (var i = 0; i < vpd.length; i++) {
			currentNodes.push(vpd[i].uniqueId);
		}
		for (var i = 0; i < data.vn.length; i++) {
			newNodes.push(data.vn[i].uniqueId);
		}
		for (var i = 0; i < currentNodes.length; i++) {
			if (newNodes.indexOf(currentNodes[i]) == -1) {
				// replace this with:
				//vp[currentNodes[i]].removeSelf(world1)
				world1.c.pw.removeBody(vp[currentNodes[i]].phys);
				world1.t.scene.remove(vp[currentNodes[i]].mesh);
				//world1.t.scene.remove(vp[currentNames[i] + "_label"].label);
			}
		}
		//END OF CHECK

		//world1.game.visiblePlayersData = data.vn;// moved up

		// loop through nodes
		for (var i = 0; i < vpd.length; i++) {
			if (!world1.game.connected) {
				continue;
			}
			// called player regaurdless of client's type
			if (vpd[i].uniqueId == world1.game.player.uniqueId) {
				var player = world1.game.player;
				player.updateData(vpd[i]);
				continue;
			}
			
			// if its a player type
			if (vpd[i].type == "player") {
				// if the player doesn't exist in the local copy, create it
				if (typeof vp[vpd[i].uniqueId] == "undefined") {
					vp[vpd[i].uniqueId] = new playerConstructor(vpd[i]);
				// if it does exist, update its properties
				} else if (typeof vp[vpd[i].uniqueId] != "undefined") {
					// update the copy with the latest data
					vp[vpd[i].uniqueId].updateData(vpd[i]);
				}
			}
		
			// if its a teamCar
			if (vpd[i].type == "teamCar") {
				// if the teamCar doesn't exist in the local copy, create it
				if (typeof vp[vpd[i].uniqueId] == "undefined") {
					vp[vpd[i].uniqueId] = new teamCar(vpd[i]);
				// if it does exist, update its properties
				} else if (typeof vp[vpd[i].uniqueId] != "undefined") {
					// update the copy with the latest data
					vp[vpd[i].uniqueId].updateData(vpd[i]);
				}
			}
		}
	});











	function world() {
		this.createCanvas = function(location, id, width, height) {
			this.width = width || window.innerWidth;
			this.height = height || window.innerHeight;
			this.canvas = document.createElement('canvas');
			this.ctx = this.canvas.getContext("2d");
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.bgColor = '#EEEEEE';
			$(this.canvas)
				.attr('id', id)
				.text('unsupported browser');
			
			// three.js
			this.t = {};
			this.t.scene = new THREE.Scene();
			this.t.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 200000); //2000000//1500
			this.t.camera.up.set(0, 0, 1);
			//this.t.audioListener = new THREE.AudioListener();
			//this.t.camera.add(this.t.audioListener);
			this.t.raycaster = new THREE.Raycaster();

			this.t.HUD = {};
			this.t.HUD.items = {};
			this.t.HUD.scene = new THREE.Scene();
			this.t.HUD.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 1, 1000);
			this.t.HUD.camera.up.set(0, 0, 1);
			this.t.HUD.camera.position.set(0, 0, 10);
			this.t.HUD.raycaster = new THREE.Raycaster();

			this.t.AH = new assetHolder();

			if (webglAvailable()) {
				this.t.renderer = new THREE.WebGLRenderer();
			} else {
				this.t.renderer = new THREE.CanvasRenderer();
			}
			this.t.renderer.setPixelRatio(window.devicePixelRatio);
			this.t.renderer.setSize(this.width, this.height);
			this.t.renderer.autoClear = false;
			// do shadow stuff here
			/*this.t.renderer.shadowMap.enabled = true;
			this.t.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			this.t.renderer.gammaInput = true;
			this.t.renderer.gammaOutput = true;
			this.t.renderer.antialias = true;*/

			document.body.appendChild(this.t.renderer.domElement);

			// cannon.js
			this.c = {};
			this.c.pw = new CANNON.World();
			this.c.objects = [];
			this.c.pw.gravity.set(0, 0, -10);
			this.c.pw.broadphase = new CANNON.SAPBroadphase(this.c.pw);
			this.c.pw.solver.iterations = 10;
			this.c.pw.defaultContactMaterial.friction = 0.1; //1
			this.c.pw.defaultContactMaterial.restitution = 0; //unset
			//this.c.pw.defaultContactMaterial.contactEquationStiffness = 1000000;//unset
			//this.c.pw.defaultContactMaterial.frictionEquationStiffness = 100000;//unset
			this.c.debug = true;
			this.c.debugRenderer = new THREE.CannonDebugRenderer(this.t.scene, this.c.pw);

			// shader particle engine
			this.spe = {};
			this.spe.groups = {};


			// stats.js
			this.stats = new Stats();
			this.stats.setMode(0); // 0: fps, 1: ms, 2: mb
			// align top-left
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.left = '0px';
			this.stats.domElement.style.top = '0px';
			document.body.appendChild(this.stats.domElement);
		};
		this.game = {};
		this.game.connected = false;
		this.game.worldMap = new fn.worldMap(this);
		this.game.player = {};
		this.game.visiblePlayersData = [];
		this.game.visiblePlayersNames = [];
		this.game.visiblePlayers = {};
	}

	world1 = new world();
	world1.createCanvas('body', 'canvas');

	var ambientLight = new THREE.AmbientLight(0x404040, 5);
	//var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
	world1.t.scene.add(ambientLight);


	/*window.sky1 = new worldSky();
	world1.t.scene.add(sky1.sunSphere);
	world1.t.scene.add(sky1.light);
	world1.t.scene.add(sky1.mesh);

	setInterval(function() {
		//world1.t.sky.effectController.inclination += 0.0005;
		//world1.t.sky.effectController.azimuth += 0.00005;
		sky1.effectController.azimuth += 0.005;
		var d = new Date();
		var n = d.getTime();
		//world1.t.sky.effectController.azimuth = 0.00005*n;
		sky1.update();
	}, 100);
	*/








	world1.t.AH.onloadFuncs.push(function() {

		for(var i = 0; i < 1; i++) {
			for(var j = 0; j < 1; j++) {
				world1.game.worldMap.setZoneByCoord(new THREE.Vector2(i, j));
			}
		}
		world1.game.worldMap.setZoneByCoord(new THREE.Vector2(0, 0));

		//world1.t.HUD.items.healthBar = new createHealthBar();
		//world1.t.HUD.items.XPBar = new createXPBar2();
		//world1.t.HUD.items.levelText = new createLevelText(0);
		//world1.t.HUD.items.inventory = new createHUDInventory();
		//world1.t.HUD.items.spellBar = new createSpellBar();

	});







	function followObject(world, obj, cam, options) {
		var targetSet = {
			object: obj,
			//camPos: new THREE.Vector3(10, 10, 5),
			translateOffset: new THREE.Vector3(0, 0, 3.5),
			//rotateOffset: new THREE.Vector3(0, 0, 0),
			fixed: false,
			stiffness: 0.4,
			rotationalStiffness: null,
			translationalStiffness: null,
			matchRotation: true,
			lookAt: false
		};

		var ideal = new THREE.Object3D();
		ideal.up.set(0, 0, 1);
		ideal.position.copy(targetSet.object.position);
		ideal.quaternion.copy(targetSet.object.quaternion);

		var targetPosition = targetSet.object.position;
		var targetRotation = new THREE.Vector3();

		var angle1 = input.controls.rotation.x;
		var angle2 = input.controls.rotation.y;



		ideal.position.x = targetPosition.x + (Math.cos(angle1) * Math.cos(angle2) * input.mouse.scrollLevel);
		ideal.position.y = targetPosition.y + (Math.sin(angle1) * Math.cos(angle2) * input.mouse.scrollLevel);
		ideal.position.z = targetPosition.z + Math.sin(angle2) * input.mouse.scrollLevel;

		ideal.position.add(targetSet.translateOffset);

		var translationalStiffness = targetSet.translationalStiffness || targetSet.stiffness;
		var rotationalStiffness = targetSet.rotationalStiffness || targetSet.stiffness;

		/*var camVec1 = new CANNON.Vec3().copy(cam.position);
		var camVec2 = camVec1.vsub(new CANNON.Vec3(0, 0, 600));
		var result = new CANNON.RaycastResult();
		camVec2 = camVec2.negate();
		world1.c.pw.raycastAny(camVec1, camVec2, {}, result);
		
		if (result.hasHit) {
			//ideal.position.z += result.distance;
		}*/

		cam.position.lerp(ideal.position, translationalStiffness);
		//cam.position.copy(ideal.position);
		//cam.quaternion.slerp(ideal.quaternion, rstiff);
		var tempv = new THREE.Vector3().copy(targetSet.object.position).add(targetSet.translateOffset);
		cam.lookAt(tempv);
	}




	window.addEventListener('resize', function() {
		world1.width = window.innerWidth;
		world1.height = window.innerHeight;
		world1.canvas.width = window.innerWidth;
		world1.canvas.height = window.innerHeight;

		world1.t.camera.aspect = window.innerWidth / window.innerHeight;
		world1.t.camera.updateProjectionMatrix();

		world1.t.HUD.camera.aspect = window.innerWidth / window.innerHeight;
		world1.t.HUD.camera.left = -window.innerWidth / 2;
		world1.t.HUD.camera.right = window.innerWidth / 2;
		world1.t.HUD.camera.top = window.innerHeight / 2;
		world1.t.HUD.camera.bottom = -window.innerHeight / 2;


		world1.t.HUD.camera.updateProjectionMatrix();

		for (var i in world1.t.HUD.items) {
			if (typeof world1.t.HUD.items[i].recalc != "undefined") {
				world1.t.HUD.items[i].recalc();
			}
		}

		world1.t.renderer.setSize(window.innerWidth, window.innerHeight);
	}, true);








	var temp = {
		isGrounded: true,
		isJumping: false,
		isCasting: false,
		inputVelocity: new THREE.Vector3(),
	};

	function gameLoop(world) {
		if (world.game.connected) {

			input.data.rotation = input.controls.rotation;
			input.data.targetId = world1.game.player.targetId;

			socket.emit('input', {
				actions: input.action,
				data: input.data,
			});

			if (typeof input.joystick !== "undefined") {
				if (input.joystick.up()) {
					input.action.moveForward = true;
				} else if (input.action.moveForward && !input.joystick.up()) {
					input.action.moveForward = false;
				}


				if (input.joystick.down()) {
					input.action.moveBackward = true;
				} else if (input.action.moveBackward && !input.joystick.down()) {
					input.action.moveBackward = false;
				}

				if (input.joystick.left()) {
					input.action.moveLeft = true;
				} else if (input.action.moveLeft && !input.joystick.left()) {
					input.action.moveLeft = false;
				}

				if (input.joystick.right()) {
					input.action.moveRight = true;
				} else if (input.action.moveRight && !input.joystick.right()) {
					input.action.moveRight = false;
				}
			}
			

			var pMesh = world1.game.player.mesh;
			var pPhys = world1.game.player.phys;

			var rotation = input.controls.rotation;

			temp.inputVelocity.set(0, 0, 0);

			if (input.action.moveForward) {
				temp.inputVelocity.x = -20;
			}
			if (input.action.moveBackward) {
				temp.inputVelocity.x = 20;
			}
			if (input.action.moveLeft) {
				temp.inputVelocity.y = -20;
			}
			if (input.action.moveRight) {
				temp.inputVelocity.y = 20;
			}

			temp.inputVelocity.setLength(20);

			if (!input.action.moveForward && !input.action.moveBackward && temp.isGrounded == true) {
				var rotatedV = new THREE.Vector3().copy(pPhys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x).multiplyScalar(0.1);
				temp.inputVelocity.x = -rotatedV.x;
			}
			if (!input.action.moveLeft && !input.action.moveRight && temp.isGrounded == true) {
				var rotatedV = new THREE.Vector3().copy(pPhys.velocity).applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.x).multiplyScalar(0.1);
				temp.inputVelocity.y = -rotatedV.y;
			}

			/*temp.inputVelocity.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotation.x);
			if (temp.isGrounded === true) {
				pPhys.velocity.x = temp.inputVelocity.x;
				pPhys.velocity.y = temp.inputVelocity.y;
				//pPhys.applyLocalForce(new CANNON.Vec3(0, 0, 10), new CANNON.Vec3(0, 0, 0));
			}*/

			/*var pVec1 = new CANNON.Vec3().copy(pPhys.position).vadd(new CANNON.Vec3(0, 0, -2.7));
			var pVec2 = pVec1.vsub(new CANNON.Vec3(0, 0, 800));
			var result = new CANNON.RaycastResult();
			world1.c.pw.raycastAny(pVec1, pVec2, {}, result);
			if (result.hasHit) {
				var hitPoint1 = new THREE.Vector3().copy(result.hitPointWorld);
				if (result.distance < 1 && temp.isJumping === false) {
					pPhys.position.z += 0.01 - result.distance;
				}
				if (result.distance < 0.1) {
					temp.isGrounded = true;
				} else {
					temp.isGrounded = false;
				}
			} else {
				pPhys.position.z += 0.1;
			}

			if (input.action.jump && temp.isGrounded === true && temp.isJumping === false) {
				temp.isJumping = true;
				pPhys.applyLocalImpulse(new CANNON.Vec3(0, 0, 10), new CANNON.Vec3(0, 0, 0));
			}

			if (!input.action.jump && temp.isGrounded === true) {
				temp.isJumping = false;
			}*/


			// fix this later
			if (!input.mouse.lclick) {
				pMesh.rotation.y += Math.PI / 2;
				input.controls.rotation.x = limit(0, (Math.PI * 2), input.controls.rotation.x, true, true);
				pMesh.rotation.y = limit(0, (Math.PI * 2), pMesh.rotation.y, true, true);

				var diff = input.controls.rotation.x - pMesh.rotation.y;
				if (diff >= Math.PI) {
					pMesh.rotation.y -= 0.09 * Math.abs(diff - Math.PI); //0.05;
				} else if (diff < -Math.PI) {
					pMesh.rotation.y += 0.09 * Math.abs(diff + Math.PI); //0.05;
				} else if (diff > 0) {
					pMesh.rotation.y += 0.09 * Math.abs(diff); //0.05;
				} else if (diff < 0) {
					pMesh.rotation.y -= 0.09 * Math.abs(diff); //0.05;
				}
				pMesh.rotation.y -= Math.PI / 2;
			}









			/*if (!input.mouse.rclick && input.mouse.rclickInitial.x != 9999) {
				var dx = Math.pow(input.mouse.x - input.mouse.rclickInitial.x, 2);
				var dy = Math.pow(input.mouse.y - input.mouse.rclickInitial.y, 2);
				var distance = Math.sqrt(dx + dy);
				input.mouse.rclickInitial.x = 9999;
				input.mouse.rclickInitial.y = 9999;
				if (distance < 2) {
					world1.t.raycaster.setFromCamera(input.mouse.ray, world1.t.camera);
					var intersects = world1.t.raycaster.intersectObjects(world1.t.scene.children);
					for (var i = 0; i < intersects.length; i++) {
						var intersect = intersects[i].object;
						if(typeof intersect.nodeObject != "undefined") {
							world1.game.player.targetObject(intersect.nodeObject);
						}
					}
				}
			}
			
			
			
			
			if (!input.mouse.lclick && input.mouse.lclickInitial.x != 9999) {
				var dx = Math.pow(input.mouse.x - input.mouse.rclickInitial.x, 2);
				var dy = Math.pow(input.mouse.y - input.mouse.rclickInitial.y, 2);
				var distance = Math.sqrt(dx + dy);
				input.mouse.lclickInitial.x = 9999;
				input.mouse.lclickInitial.y = 9999;
				if (distance < 2) {
					input.mouse.lclicked = true;
				}
			}


			world1.t.HUD.raycaster.setFromCamera(input.mouse.HUDRay, world1.t.HUD.camera);
			var intersects = world1.t.HUD.raycaster.intersectObjects(world1.t.HUD.scene.children);
			for (var i = 0; i < intersects.length; i++) {
				var obj = intersects[i].object;
				if (typeof obj.mouseOver != "undefined") {
					obj.mouseOver();
				}
				if(input.mouse.lclicked && typeof obj.lclick != "undefined") {
					obj.lclick();
				}
			}
			input.mouse.lclicked = false;*/

			//log(world1.game.visiblePlayersData[0].position);



			followObject(world, world1.game.player.phys, world.t.camera);
			if (typeof world.t.renderer.clear != "undefined") {
				world.t.renderer.clear();
			}
			world.t.renderer.render(world.t.scene, world.t.camera);
			if (typeof world.t.renderer.clearDepth != "undefined") {
				world.t.renderer.clearDepth();
			}
			world.t.renderer.render(world.t.HUD.scene, world.t.HUD.camera);
		}
	}



	function updatePhysics(world) {
		world.c.pw.step(1 / 60);
		for (var i = 0; i < world.c.objects.length; i++) {
			world.c.objects[i].update();
		}
		if (world.c.debug) {
			world.c.debugRenderer.update();
		}
	}










	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
	})();

	function loop() {
		window.requestAnimFrame(loop);

		world1.stats.begin();

		if (logReset <= 100) {
			logReset += 1;
		} else if (logReset > 100) {
			logReset = 0;
		}

		updatePhysics(world1);
		gameLoop(world1);

		world1.stats.end();
	}
	loop();

});