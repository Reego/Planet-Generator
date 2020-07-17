// Below are an unnecessary amount of constants that
// cause a bit of clutter as well as possible dependency issues
// in future additions to the program

const WIDTH = 500;
const HEIGHT = 300;
const CANVAS_WIDTH = 250;
const CANVAS_HEIGHT = 250;
const AREA = 300*500;

const CYLINDER_RADIUS = WIDTH / 2 / Math.PI;
const CYLINDER_RADIUS_2 = CYLINDER_RADIUS * CYLINDER_RADIUS;

const R = 125;
const R2 = 125*125;

var canvas;
var planet;

var time = 0;

var simplex = new SimplexNoise();

// Called on window load

function Main() {

	// this block of code uses the background HTML canvas element
	// to draw in individual pixels at bright colors to create mimic
	// stars in space

	{

		bg_canvas = new CanvasContext(document.getElementById("bg"));

		bg_canvas.canvas.width = window.innerWidth;
		bg_canvas.canvas.height = window.innerHeight;

		// these are the possible star colors that are randomly picked
		// for each pixel

		var star_colors = [
			"#fff",
			"#f9d",
			"#afa",
			"#29d",
			"#dcd",
			"#bbb",
			"#ccc",
			"#aff",
			"#eee",
			"#f6a"
		];

		for(var i = 0; i < 300; i++) {

			// draws a pixel at a randomly-generated position on the background
			// canvas

			bg_canvas.DrawPixel(Math.random() * window.innerWidth, Math.random() * window.innerHeight, star_colors[Math.floor(Math.random() * star_colors.length)]);
		}
	}

	canvas = new CanvasContext(document.getElementById("canvas"));

	planet = new Planet();

	planet.GeneratePlanet(
		// array of layers that are stacked
		// on top of each other to generate the
		// terrain
		[
			new SimplexNoiseLayer(.02, 10, 7, .3),
			new VerticalGradientLayer(0, 10, -7.5)
		],
		// array that is looped through
		// to generate colors based on the node's
		// height
		[
			new HeightColorMapPair(-1, new Color(50, 100, 184)),
			new HeightColorMapPair(3, new Color(30, 130, 200)),
			new HeightColorMapPair(4, new Color(10, 150, 220)),
			new HeightColorMapPair(5, new Color(30, 200, 103)),
			new HeightColorMapPair(6, new Color(20, 180, 83)),
			new HeightColorMapPair(6.9, new Color(90, 100, 110)),
			new HeightColorMapPair(7.8, new Color(130, 150, 160)),
			new HeightColorMapPair(8.5, new Color(230, 201, 200))
			// new HeightColorMapPair(5, "#fdd")
		]
	);

	window.requestAnimationFrame(DisplayLoop);

	//DisplayPlanet();

}

// Display loop
function DisplayLoop() {
	DisplayPlanet();
	time++;
	planet.rotationOffset = planet.rotationOffset + 10;
	window.requestAnimationFrame(DisplayLoop);
}

// Displays the planet on the second canvas
function DisplayPlanet() {

	canvas.Clear();

	var nodesToDisplay = planet.GetDisplayNodes();

	for(var i = 0; i < nodesToDisplay.length; i++) {

		var color = nodesToDisplay[i].color.GetCopy();

		// distance of node from the center of the canvas
		var r = Math.pow((nodesToDisplay[i].displayX - CANVAS_WIDTH/2),2) +
			Math.pow((nodesToDisplay[i].displayY - CANVAS_HEIGHT/2),2);

		// checks if the distance of the node from the center is
		// greater than the radius of the planet display
		if(R2 < r) {

			// makes the node transparent
			color = new Color(0, 0, 0, 0);
		}
		else {

			var shade = r/R2;

			// var cloud = simplex.noise4D(Math.cos(rads) * CYLINDER_RADIUS * .01, nodesToDisplay[i].displayY * .01, Math.sin(rads) * CYLINDER_RADIUS * .01, time / 35);

			// Cloud generation - here, the time variable and the displayX
			// property of the node - which is the x position of the display
			// rect - are both used to generate smoother clouds

			// Notice how time is divided by 15 and the displayX by 100,
			// this is to make the clouds flow counter to the rotation of
			// the planet

			var noise_cloud = simplex.noise2D(((time / 15 + nodesToDisplay[i].displayX / 100)), nodesToDisplay[i].y / 35);

			// if the noise value from the call above is greater than .65
			// then the color of the node is overriden to white, to look
			// like clouds

			if(noise_cloud > .65) {
				color = new Color(255, 255, 255);
			}

			// Creates the illusion of depth by darkening
			// the color of the node based on the distance
			// from the center

			color.r = color.r - color.r * shade;
			color.g = color.g - color.g * shade;
			color.b = color.b - color.b * shade;
		}

		// Draws the pixel of the node

		canvas.DrawPixel(
			nodesToDisplay[i].displayX,
			nodesToDisplay[i].displayY,
			color.color
		);
	}
}

// Used to facilitate canvas interactions

class CanvasContext {

	constructor(canvas)
	{
		this.canvas = canvas;
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

// Stores the "planetary" info

class Planet {

	constructor()
	{
		// array of nodes
		this.planetMap = [];

		for(var x = 0; x < WIDTH; x++) {
			for(var y = 0; y < HEIGHT;y++) {
				this.planetMap[Planet.GetIndex(x, y)] = new Node(x, y);
			}
		}
	}

	// used for effect of planetary rotation

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

	// never utilized, but this could be used for implementing
	// more height layers to create different and interesting effects

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

	// Gets the color of the first height level below
	// the height of the node

	ColorFromHeightColorMap(height, heightColorMap) {

		let i = 0;
		for(i = heightColorMap.length - 1; i >= 0; i--) {
			if(height > heightColorMap[i].height) {
				return heightColorMap[i].color.GetCopy();
			}
		}

		return heightColorMap[heightColorMap.length - 1].color.GetCopy();

	}

	// Loops through noise / height layers and calculates
	// the node heights and then their colors

	GeneratePlanet(noiseLayers, heightColorMap) {

		for(var i = 0; i < noiseLayers.length; i++) {
			this.ApplyNoiseLayer(noiseLayers[i]);
		}

		for(var g = 0; g < AREA ; g++) {
			this.planetMap[g].color = this.ColorFromHeightColorMap(this.planetMap[g].height, heightColorMap);
		}
	}

	// In case a need arose to override this functionality
	// in sub classes

	ApplyNoiseLayer(noiseLayer) {
		noiseLayer.Init(this);
		// for(var i = 0; i < AREA; i++) {
		// 	this.planetMap[i].height = noiseLayer[i];
		// }
	}

	// Generates the area of nodes that will fit into
	// the secondary canvas, based on the #offset variable
	// of the planet

	GetDisplayNodes() {

		let offset = this.rotationOffset

		let nodesToDisplay = [];

		for(var y = 24; y < HEIGHT - 25; y++) {
			for(var x = 0; x < WIDTH / 2; x++) {
				var node = this.planetMap[Planet.GetIndex(x + offset, y)];
				node.displayX = x;
				nodesToDisplay.push(node);
			}
		}

		return nodesToDisplay;

	}
}

// A structure for storing height and color pairs

class HeightColorMapPair {

	constructor(height, color) {
		this.height = height;
		this.color = color;
	}
}

// NoiseLayer's are fed into Planet objects to create
// interesting height patterns to generate interesting
// terrain

// New NoiseLayer's only have to inherit from this base
// class

class NoiseLayer {

	constructor() {
		this.heightMap = [];
		this.planet;
	}

	// Entry point of the NoiseLayer

	Init(planet) {
		this.referenceMap = planet.planetMap;
		this.planet = planet;

		for(var i = 0; i < AREA; i++) {
			this.heightMap[i] = planet.planetMap[i].height;
		}

		this.CalculateLayer();

		for(var i = 0; i < AREA; i++) {
			planet.planetMap[i].height = this.heightMap[i];
		}
	}

	// Called once, can be overriden to create effects
	// that span the entire node map

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

	// Called for each node, can be overriden to create effects
	// that only span each node individually

	CalculateNode(index, x, y, referenceNode) {
		this.heightMap[index] = 0;
	}
}

// SimplexNoiseLayer basically just takes takes in the node
// and calculates the height based on a multi-octave simplex function

class SimplexNoiseLayer extends NoiseLayer {

	constructor(noise_scale = .02, max_height = 1, octaves = 1, persistence = 1) {
		super();
		this.noise_scale = noise_scale;
		this.max_height = max_height;
		this.octaves = Math.max(1, octaves);
		this.persistence = persistence;
	}

	CalculateNode(index, x, y, referenceNode) {

		// Generates an x and z value based on a rotation
		// about a cylinder with a height of HEIGHT and diameter of WIDTH,

		// this is essential for creating seamless and smooth terrain

		var rads = x / CYLINDER_RADIUS;

		var cX = Math.cos(rads) * CYLINDER_RADIUS;
		var z = Math.sin(rads) * CYLINDER_RADIUS;

		// Generates height based on multiple octaves of simplex noise
		// credit to

		var total = 0;
		var freq = 1;
		var height = 1;
		var max_value = 0;

		for(var i = 0; i < this.octaves; i++) {
			total += (simplex.noise3D(
				cX * this.noise_scale * freq,
				y * this.noise_scale * freq,
				z * this.noise_scale * freq
			) + 1) / 2 * height;

			max_value += height;

			height *= this.persistence;
			freq *= 2;
		}

		this.heightMap[index] = (total / max_value) * this.max_height;

	}
}

function RandomRange(max) {
	return Math.floor(Math.random() * (max + 1));
}

// It did not produce the results I wanted, but I'll leave this here

class ContinentNoiseLayer extends NoiseLayer {

	constructor() {
		super();
	}

	CalculateLayer() {

		var openNodes = [];
		var closedNodes = [];

		var initNodes = Math.max(5, RandomRange(12));

		for(var i = 0; i < AREA; i++) {
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

// Stacks a gradient-based layer based on the latitude of the node
// (as in the vertical distance from the center)

class VerticalGradientLayer extends NoiseLayer {

	constructor(min_height = 0, max_height = 1, max_diff = -1) {
		super();
		this.min_height = min_height;
		this.max_height = max_height;
		this.max_diff = max_diff;
	}

	CalculateNode(index, x, y, referenceNode) {
		this.heightMap[index] = Cap(referenceNode.height + this.max_diff * referenceNode.latitude, this.min_height, this.max_height);
	}
}

// Caps the value parameter between the min and max

function Cap(value, min, max) {
	if(value < min) {
		return min;
	}
	else if(value > max) {
		return max;
	}
	return value;
}

// Created to ease shade manipulation

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

	// Generates usable color string

	get color() {
		return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
	}

	// Makes an identical copy of the Color object

	GetCopy() {

		return new Color(this.r, this.g, this.b, this.a);
	}
}

// Stores nodes data

class Node {

	constructor(x, y) {

		this.height = 5;
		this.x = x;

		// the distance of the node from the left side of the canvas
		this.displayX = 0;
		this.y = y;
		this.displayY = y - 25;
		this.index = y * WIDTH + x;

		this.latitude = Math.abs(150 - this.y) / 150;
	}
}
