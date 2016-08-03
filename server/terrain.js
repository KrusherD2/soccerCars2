var fs = require('fs');
var THREE = require('three');
THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
var CANNON = require('cannon');
var Canvas = require('canvas');
var Image = Canvas.Image;

exports.toArray2D = function(vertices, options) {
	//var tgt = new Array(options.xSegments),
	var tgt = [],
		xl = options.xSegments + 1,
		yl = options.ySegments + 1,
		i, j;
	for (i = 0; i < xl; i++) {
		//tgt[i] = new Float64Array(options.ySegments);
		tgt[i] = [];
		for (j = 0; j < yl; j++) {
			tgt[i][j] = vertices[j * xl + i].z;
		}
	}
	return tgt;
};


exports.fromHeightmap2 = function(heightmap, options) {
	var zValues = [];
	options.xSegments = options.xSegments ? options.xSegments : 128;
	options.ySegments = options.ySegments ? options.ySegments : 128;
	options.xSize = options.xSize ? options.xSize : 1024;
	options.ySize = options.ySize ? options.ySize : 1024;
	options.minHeight = options.minHeight ? options.minHeight : 0;
	options.maxHeight = options.maxHeight ? options.maxHeight : 100;
	var rows = options.ySegments + 1;
	var cols = options.xSegments + 1;
	var spread = options.maxHeight - options.minHeight;
	var canvas = new Canvas(cols, rows);
	var context = canvas.getContext('2d');
	canvas.width = cols;
	canvas.height = rows;
	context.drawImage(heightmap, 0, 0, canvas.width, canvas.height);
	var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {
			var i = row * cols + col;
			var idx = i * 4;
			zValues[i] = (data[idx] + data[idx + 1] + data[idx + 2]) / 765 * spread + options.minHeight;
		}
	}
	return zValues;
}




/*exports.fromHeightmap3 = function(src, options, callback) {
	fs.readFile(options.src, function(err, loadedImage) {
		
		var img = new Image;
		img.src = loadedImage;
		var zValues = [];
		
		options.xSegments = options.xSegments ? options.xSegments : 128;
		options.ySegments = options.ySegments ? options.ySegments : 128;
		
		options.xSize = options.xSize ? options.xSize : 1024;
		options.ySize = options.ySize ? options.ySize : 1024;
		
		options.minHeight = options.minHeight ? options.minHeight : 0;
		options.maxHeight = options.maxHeight ? options.maxHeight : 100;
		
		var rows = options.ySegments + 1;
		var cols = options.xSegments + 1;
		var spread = options.maxHeight - options.minHeight;
		var canvas = new Canvas(cols, rows);
		var context = canvas.getContext('2d');
		canvas.width = cols;
		canvas.height = rows;
		context.drawImage(img, 0, 0, canvas.width, canvas.height);
		var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
		for (var row = 0; row < rows; row++) {
			for (var col = 0; col < cols; col++) {
				var i = row * cols + col;
				var idx = i * 4;
				zValues[i] = (data[idx] + data[idx + 1] + data[idx + 2]) / 765 * spread + options.minHeight;
			}
		}
		callback(zValues);
	});
}*/



exports.physicsFromHeightmap = function(src, callback) {
	var options = {};
	options.xSegments = 128;
	options.ySegments = 128;
	options.xSize = 1024;
	options.ySize = 1024;
	options.minHeight = 0;
	options.maxHeight = 100;
	options.src = src;
	
	fs.readFile(options.src, function(err, loadedImage) {
		var img = new Image;
		img.src = loadedImage;
		var rows = options.ySegments + 1;
		var cols = options.xSegments + 1;
		var spread = options.maxHeight - options.minHeight;
		var zValues = exports.fromHeightmap2(img, options);
		var geometry1 = new THREE.PlaneGeometry(options.xSize, options.ySize, options.xSegments, options.ySegments);
		for (var i = 0; i < geometry1.vertices.length; i++) {
			geometry1.vertices[i].z = zValues[i];
		}
		var vertices = exports.toArray2D(geometry1.vertices, options);
		vertices.reverse();
		var hfShape = new CANNON.Heightfield(vertices, {
			elementSize: options.xSize / options.xSegments,
		});
		var hfBody = new CANNON.Body({
			mass: 0,
		});
		hfBody.addShape(hfShape);
		hfBody.shapeOffsets[0].x = -options.xSegments * hfShape.elementSize / 2;
		hfBody.shapeOffsets[0].y = -options.ySegments * hfShape.elementSize / 2;
		hfBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI);
		callback(hfBody);
	});
};








exports.zone = function(worldMap, column, row) {//fill in paramater for heightmap url or define url scheme, also paramater for position
	var scope = this;
	this.worldMap = worldMap;
	
	this.width = this.worldMap.zoneWidth;
	this.height = this.worldMap.zoneHeight;
	// position from the bottom left? top left? bottom left for now
	this.mapPosition = new THREE.Vector2((column*this.width), (row*this.height));
	this.coordPosition = new THREE.Vector2(column, row);
	this.surroundingZoneCoords = [
		new THREE.Vector2(column+1, row),//right
		new THREE.Vector2(column+1, row+1),//right, up
		new THREE.Vector2(column, row+1),//up
		new THREE.Vector2(column-1, row+1),//left, up
		new THREE.Vector2(column-1, row),//left
		new THREE.Vector2(column-1, row-1),//left, down
		new THREE.Vector2(column, row-1),//down
		new THREE.Vector2(column+1, row-1),//right, down
	];
	
	this.calculateCoordPosition = function() {
		
	};
	
	this.heightmap = 0;//probably just store url
	
	
	/*		var tempZone = scope.findZoneByAbsoluteCoordinates(position);
		// add /public/ to front
		var coords = new THREE.Vector2(9-position.y, position.x);
		var heightmapURL = "assets/worldMap/world1/heightmap/heightmap"+coords.x+coords.y+".png";
		var textureURL = "assets/worldMap/world1/texture/texture"+coords.x+coords.y+".png";
		tempZone.setMeshPhysTex(heightmapURL, textureURL);*/
	
	this.setPhys = function(url) {
		
		scope.heightmap = url;
		exports.physicsFromHeightmap(url, function(phys) {
			phys.position.set(scope.mapPosition.x+(scope.width/2), scope.mapPosition.y+(scope.height/2), 0);
			scope.phys = phys;
			scope.worldMap.gameServer.c.pw.addBody(scope.phys);
			//var terrain2 = gs.createPhysicsObject(phys);
		});
	};
	
	// implement this
	this.getNodeViewObject = function() {
		for(var i = 0; i < this.nodes.length; i++) {
			
		}
	};
	
	this.nodeViewObjects = [];
	
	this.nodes = [];
}




exports.worldMap = function(gameServer) {
	//var scope = this;
	this.gameServer = gameServer;
	
	this.rows = 10;
	this.columns = 10;
	this.zoneWidth = 1024;
	this.zoneHeight = 1024;
	
	this.zones = [];
	this.allZones = [];
	for(var i = 0; i < this.columns; i++) {
		this.zones[i] = [];
	}
	
	for(i = 0; i < this.columns; i++) {
		for(var j = 0; j < this.rows; j++) {
			this.zones[i][j] = new exports.zone(this, i, j);
			this.allZones.push(this.zones[i][j]);
		}
	}
	
	this.updateZones = function() {
		for(var i = 0; i < this.zones.length; i++) {
			this.zones[i].update();
		}
	}
	
	this.findZoneByAbsoluteCoordinates = function(position) {
		var pos = new THREE.Vector3().copy(position);
		var column = Math.floor(pos.x/this.zoneWidth);
		var row = Math.floor(pos.y/this.zoneHeight);
		pos.set(column, row);
		//return position;
		if(pos.x < 0) {
			pos.x = 0;
		}
		if(pos.y < 0) {
			pos.y = 0;
		}
		return this.zones[pos.x][pos.y];
	}
	
	this.setZoneByAbsolute = function(position) {
		var tempZone = scope.findZoneByAbsoluteCoordinates(position);
		var pos = tempZone.coordPosition;
		var coords = new THREE.Vector2(9-pos.y, pos.x);
		var heightmapURL = "public/assets/worldMap/world1/heightmap/heightmap"+coords.x+coords.y+".png";
		tempZone.setPhys(heightmapURL);
	}
	
	this.setZoneByCoord = function(position) {
		//var tempZone = scope.findZoneByAbsoluteCoordinates(position);
		//var pos = tempZone.coordPosition;
		var tempZone = this.zones[position.x][position.y];
		var coords = new THREE.Vector2(9-position.y, position.x);
		var heightmapURL = "public/assets/worldMap/world1/heightmap/heightmap"+coords.x+coords.y+".png";
		tempZone.setPhys(heightmapURL);
	}
	
	
}

