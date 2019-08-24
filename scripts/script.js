// var simplex = new SimplexNoise(),
//     value2d = simplex.noise2D(x, y),
//     value3d = simplex.noise3D(x, y, z),
//     value4d = simplex.noise4D(x, y, z, w);

const WIDTH = 500;
const HEIGHT = 300;
const CANVAS_WIDTH = 250;
const CANVAS_HEIGHT = 250;
const AREA = 300*500;

const R = 125;
const R2 = 125*125;

var canvas;
var planet;

var simplex = new SimplexNoise();

function Main() {

	canvas = new CanvasContext(document.getElementById("canvas"));

	planet = new Planet();

	planet.GeneratePlanet(
		[
			new PerlinNoiseLayer(),
			new VerticalNoiseLayer()
			//new ContinentNoiseLayer()
		],
		[
			new HeightColorMapPair(-100, new Color(34, 17, 170)),
			new HeightColorMapPair(-2, new Color(119, 221, 0)),
			new HeightColorMapPair(-1, new Color(17, 153, 51)),
			new HeightColorMapPair(3, new Color(170, 85, 34)),
			new HeightColorMapPair(5, new Color(170, 170, 170)),
			// new HeightColorMapPair(1, "#d99"),
			new HeightColorMapPair(7, new Color(255, 255, 255))
			// new HeightColorMapPair(5, "#fdd")
		]
	);

	setInterval(function() {

		DisplayPlanet();

		planet.rotationOffset = planet.rotationOffset + 10;

	}, 30);

	//DisplayPlanet();

}

function DisplayPlanet() {

	canvas.Clear();

	var nodesToDisplay = planet.GetDisplayNodes();

	for(var i = 0; i < nodesToDisplay.length; i++) {

		var color = nodesToDisplay[i].color.GetCopy();

		var r = Math.pow((nodesToDisplay[i].displayX - CANVAS_WIDTH/2),2) +
			Math.pow((nodesToDisplay[i].displayY - CANVAS_HEIGHT/2),2);

		var ra = Math.pow((nodesToDisplay[i].displayX - CANVAS_WIDTH/2),2)/2 +
			Math.pow((nodesToDisplay[i].displayY - CANVAS_HEIGHT/2),2);

		if(R2 < r) {
			color = new Color(0, 0, 0);
		}
		else {
			// var shade = r/R2 * 255;
			var shade = r/R2
			// if(i % 105 === 0) {
			// 	console.log(color.r);//color.r + " " + (color.r - color.r * shade));
			// };
			color.r = color.r - color.r * shade;
			color.g = color.g - color.g * shade;
			color.b = color.b - color.b * shade;
		}

		// if(!(i % 75)) {
		// 	//console.log(nodesToDisplay[i].height);
		// }

		canvas.DrawPixel(
			nodesToDisplay[i].displayX,
			nodesToDisplay[i].displayY,
			color.color
		);
	}
}

class CanvasContext {

	constructor(canvas)
	{
		//this.canvas = canvas;
		this.context = canvas.getContext("2d");

	}

	Clear() {
		this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	}

	DrawPixel(x, y, color = "#000") {

		this.context.fillStyle = color;

		this.context.fillRect(x, y, 1, 1);
	}
}

class Planet {

	constructor()
	{
		this.planetMap = [];

		for(var x = 0; x < WIDTH; x++) {
			for(var y = 0; y < HEIGHT;y++) {
				this.planetMap[Planet.GetIndex(x, y)] = new Node(x, y);
			}
		}
	}

	#offset = 0;

	get rotationOffset() {
		return this.#offset;
	}

	set rotationOffset(newOffset) {
		if(newOffset >= WIDTH) {
			this.#offset = 0;
		}
		else {
			this.#offset = newOffset;
		}
	}

	GetNeighbors(node) {
		var neighbors = [];
		neighbors.push(this.GetNeighborRight(node));
		neighbors.push(this.GetNeighborLeft(node));
		neighbors.push(this.GetNeighborUp(node));
		neighbors.push(this.GetNeighborDown(node));
		return neighbors;
	}

	GetNeighborRight(node) {

		if(node.x === WIDTH - 1) {
			return this.planetMap[node.index - WIDTH + 1];
		}
		return this.planetMap[node.index + 1];
	}

	GetNeighborLeft(node) {

		if(node.x === 0) {
			return this.planetMap[node.index + WIDTH - 1];
		}
		return this.planetMap[node.index - 1];
	}

	GetNeighborUp(node) {

		var index;

		if(node.y === HEIGHT - 1) {
			index = Planet.GetIndex(node.x, node.y - HEIGHT + 1);
		}
		else {
			index = Planet.GetIndex(node.x, node.y + 1);
		}

		return this.planetMap[index];

	}

	GetNeighborDown(node) {

		var index;

		if(node.y === 0) {
			index = Planet.GetIndex(node.x, node.y + HEIGHT - 1);
		}
		else {
			index = Planet.GetIndex(node.x, node.y - 1);
		}

		return this.planetMap[index];
	}

	static GetIndex(x, y) {
		var newx = x;
		if(x >= WIDTH) {
			newx = x - WIDTH;
		}
		return y * WIDTH + newx;
	}

	ColorFromHeightColorMap(height, heightColorMap) {

		let i = 0;
		for(i = heightColorMap.length - 1; i >= 0; i--) {
			if(height > heightColorMap[i].height) {
				return heightColorMap[i].color.GetCopy();
			}
		}

		return heightColorMap[heightColorMap.length - 1].color.GetCopy();

	}

	GeneratePlanet(noiseLayers, heightColorMap) {

		for(var i = 0; i < noiseLayers.length; i++) {
			this.ApplyNoiseLayer(noiseLayers[i]);
		}

		//console.log(heightColorMap);

		for(var g = 0; g < AREA ; g++) {
			this.planetMap[g].color = this.ColorFromHeightColorMap(this.planetMap[g].height, heightColorMap);
			// if(g % 199 === 0) {
			// 	console.log("G : " + this.planetMap[g].color.red);
			// }
		}
	}

	ApplyNoiseLayer(noiseLayer) {
		noiseLayer.Init(this);
		// for(var i = 0; i < AREA; i++) {
		// 	this.planetMap[i].height = noiseLayer[i];
		// }
	}

	GetDisplayNodes() {

		let offset = this.rotationOffset

		let nodesToDisplay = [];

		for(var y = 25; y < HEIGHT - 25; y++) {
			for(var x = 0; x < WIDTH / 2; x++) {
				var node = this.planetMap[Planet.GetIndex(x + offset, y)];
				node.displayX = x;
				nodesToDisplay.push(node);
			}
		}

		//console.log(nodesToDisplay.length);

		//console.log("LAST " + nodesToDisplay[nodesToDisplay.length - 1].x + " " + nodesToDisplay[nodesToDisplay.length - 1].height);

		return nodesToDisplay;

	}
}

class HeightColorMapPair {

	constructor(height, color) {
		this.height = height;
		this.color = color;
	}
}

class NoiseLayer {

	constructor() { //planetMap) {

		//this.referenceMap = planetMap;

		this.heightMap = [];
		this.planet;

		//this.CalculateLayer();
	}

	Init(planet) {

		this.referenceMap = planet.planetMap;
		this.planet = planet;

		for(var i = 0; i < AREA; i++) {
			this.heightMap[i] = planet.planetMap[i].height;
		}

		this.CalculateLayer();

		for(var i = 0; i < AREA; i++) {
			// if(i % 95 == 0) {
			// 	console.log("Height: " + this.heightMap[i]);
			// }
			planet.planetMap[i].height = this.heightMap[i];
		}
	}

	CalculateLayer() {
		for(var i = 0; i < AREA; i++) {
			var x = i % WIDTH;
			var y = Math.floor(i / WIDTH);
			this.CalculateNode(
				i,
				x,
				y,
				this.referenceMap[i]
			);
		}
	}

	CalculateNode(index, x, y, referenceNode) {
		this.heightMap[index] = 0;
	}
}

class PerlinNoiseLayer extends NoiseLayer {

	constructor() {
		super();
	}

	CalculateNode(index, x, y, referenceNode) {
		this.heightMap[index] = simplex.noise2D(x / 50, y / 35) * 10;
	}
}

function RandomRange(max) {
	return Math.floor(Math.random() * (max + 1));
}

class ContinentNoiseLayer extends NoiseLayer {

	constructor() {
		super();
	}

	CalculateLayer() {

		var openNodes = [];
		var closedNodes = [];

		var initNodes = Math.max(5, RandomRange(12));

		for(var i = 0; i < AREA; i++) {
			// var x = i % WIDTH;
			// var y = Math.floor(i / WIDTH);
			// this.CalculateNode(
			// 	i,
			// 	x,
			// 	y,
			// 	this.referenceMap[i]
			// );

			this.heightMap[i] = this.referenceMap[i].height;
		}

		for(var h = 0; h < initNodes; h++) {
			var n = this.referenceMap[RandomRange(AREA)];
			if(!openNodes.includes(n)) {
				openNodes.push(n);
			}
		}

		for(var g = 0; g < 50000; g++) {

			var n;
			if(Math.random > .3) {
				n = openNodes[0];
			}
			else {
				n = openNodes[RandomRange(openNodes.length - 1)];
			}
			openNodes.splice(n.index, 1);
			closedNodes.push(n);

			this.heightMap[n.index] = n.height + 5;

			var neighbors = this.planet.GetNeighbors(n);
			for(var k = 0; k < 4; k++) {

				if(!closedNodes.includes(neighbors[k]) && !openNodes.includes(neighbors[k])) {
					openNodes.push(neighbors[k]);
				}

				if(openNodes.includes(neighbors[k])) {
					if(openNodes.indexOf(neighbors[k] < openNodes.length/4)) {
						this.heightMap[neighbors[k].index] = n.height - 8;
						openNodes.splice(neighbors[k].index, 1);
						closedNodes.push(neighbors[k]);
					}
				}
			}
		}
	}

	CalculateNode(index, x, y, referenceNode) {
		this.heightMap[index] = simplex.noise2D(x / 35, referenceNode.latitude) * 10;
	}
}

class VerticalNoiseLayer extends NoiseLayer {

	constructor() {
		super();
	}

	CalculateNode(index, x, y, referenceNode) {
		this.heightMap[index] = referenceNode.height - 15 * referenceNode.latitude;
	}
}

function Cap(value, min, max) {
	if(value < min) {
		return min;
	}
	else if(value > max) {
		return max;
	}
	return value;
}

class Color {

	constructor(r, g, b, a = 1) {
		this.#r_val = r;
		this.#g_val = g;
		this.#b_val = b;
		this.#a_val = a;
	}

	#r_val = 0;
	#g_val = 0;
	#b_val = 0;
	#a_val = 1;

	get r() {
		return this.#r_val;
	}

	set r(value) {
		this.#r_val = Cap(value, 0, 255)
	}

	get g() {
		return this.#g_val;
	}

	set g(value) {
		this.#g_val = Cap(value, 0, 255);
	}

	get b() {
		return this.#b_val;
	}

	set b(value) {
		this.#b_val = Cap(value, 0, 255);
	}

	get a() {
		return this.#a_val;
	}

	set a(value) {
		this.#a_val = Cap(value, 0, 1);
	}

	get color() {
		return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
	}

	GetCopy() {

		return new Color(this.r, this.g, this.b, this.a);
	}
}

class Node {

	constructor(x, y) {
		this.height = 5;
		this.color = new Color(255, 255, 255);
		this.x = x;
		this.displayX = 0;
		this.y = y;
		this.displayY = y - 15;
		this.index = y * WIDTH + x;

		this.latitude = Math.abs(150 - this.y) / 150;
	}
}
