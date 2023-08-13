const canvas = document.getElementById("canvas1");
const context = canvas.getContext("2d");
const cellSize = 100;
const mapTypes = [];
const road = new Image();
road.src = "./assets/road2.png";
mapTypes.push(road);

export class Cell {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.width = cellSize;
		this.height = cellSize;
		this.map = mapTypes[0];
	}
	draw() {
		context.drawImage(this.map, this.x, this.y, this.width, this.height);
		if (mouse.x && mouse.y && collision(this, mouse)) {
			context.strokeStyle = "blue";
			context.strokeRect(this.x, this.y, this.width, this.height);
		}
	}
}
