// Audio - music & sound effects
const backgroundSound = new Audio();
backgroundSound.src = "./assets/audio/gameMusic.mp3";

const collectSound = new Audio();
collectSound.src = "./assets/audio/collect.mp3";

const throwFlag = new Audio();
throwFlag.src = "./assets/audio/throw.mp3";

const hit = new Audio();
hit.src = "./assets/audio/hit.mp3";

const crowd = new Audio();
crowd.src = "./assets/audio/crowd.mp3";

const fail = new Audio();
fail.src = "./assets/audio/fail.mp3";

const victory = new Audio();
victory.src = "./assets/audio/victory.mp3";
// --------------------------------------------
// Media - images & vectors
const road = new Image();
road.src = "./assets/road2.png";

const israelFlag = new Image();
israelFlag.src = "./assets/israelFlag1.png";

const defender1 = new Image();
defender1.src = "./assets/defender3.png";

const lawScroll = new Image();
lawScroll.src = "./assets/scroll.png";

const megaPhone = new Image();
megaPhone.src = "./assets/mega-phone.png";

const bibi = new Image();
bibi.src = "./assets/bibi1.png";

const Ten = new Image();
Ten.src = "./assets/Ten1.png";
// --------------------------------------------

window.addEventListener("load", function () {
	const modal = new bootstrap.Modal(document.getElementById("staticBackdrop"));

	const canvas = document.getElementById("canvas1");
	const context = canvas.getContext("2d");
	let canvasPosition = canvas.getBoundingClientRect();

	canvas.width = canvasPosition.width;
	canvas.height = canvasPosition.height;
	let cellSize = 100;
	let cellGap = 3;

	if (window.innerWidth < 700) {
		cellSize = 75;
		cellGap = 2.25;
	}

	function toggleModal() {
		modal.toggle();
	}

	// Global variables
	let numberOfResources = 300;
	let enemiesInterval = 600;
	let enemySpeed = 0.2;
	let frame = 0;
	let gameOver = false;
	let gameStarted = false;
	let score = 0;
	const winningScore = 300;
	const floatingMessages = [];
	const amounts = [20, 30, 40];
	let gameGrid = [];
	let defenders = [];
	let enemies = [];
	let enemyPositions = [];
	let projectiles = [];
	let resources = [];
	let rules = ["   נבצרות   ", "   מתנות    ", "  יוע״משים  ", "  ההתגברות  ", "   משטרה    ", "    רחצה    ", "    דרעי    ", "   לא ברוב  ", "עבריין כרה״מ", ` פטור מגיוס `];
	// -------------------------------
	// Game board & Utils
	const controlsBar = {
		width: canvas.width,
		height: cellSize,
		x: 0,
		y: canvas.height - cellSize,
	};
	const enemyBar = {
		width: canvas.width,
		height: cellSize,
		x: 0,
		y: 0,
	};
	const mouse = {
		x: 10,
		y: 10,
		width: 0.1,
		height: 0.1,
		clicked: false,
	};

	window.addEventListener("resize", function () {
		canvasPosition = canvas.getBoundingClientRect();
	});

	canvas.addEventListener("mousedown", function () {
		mouse.clicked = true;
	});

	canvas.addEventListener("mouseup", function () {
		mouse.clicked = false;
	});

	canvas.addEventListener("mousemove", function (e) {
		mouse.x = e.x - canvasPosition.left;
		mouse.y = e.y - canvasPosition.top;
	});

	canvas.addEventListener("mouseleave", function () {
		mouse.x = undefined;
		mouse.y = undefined;
	});
	// --------------------------------------------------
	// Modal & restart game
	$(document).ready(function () {
		$("#exampleModalToggle").modal("show");
	});
	document.querySelector("#restart-button").addEventListener("click", restartGame);
	document.querySelector("#start-button1").addEventListener("click", restartGame);
	document.querySelector("#start-button2").addEventListener("click", restartGame);
	document.querySelector("#rules-button").addEventListener("click", () => (gameStarted = false));

	function restartGame() {
		gameOver = false;
		gameStarted = true;
		numberOfResources = 300;
		enemiesInterval = 600;
		frame = 0;
		score = 0;
		defenders = [];
		enemies = [];
		enemyPositions = [];
		projectiles = [];
		resources = [];
		crowd.play();
		backgroundSound.play();
		animate();
	}

	// Game structure
	class Cell {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.width = cellSize;
			this.height = cellSize;
			this.map = road;
		}
		draw() {
			context.drawImage(this.map, this.x, this.y, this.width, this.height);
			if (mouse.x && mouse.y && collision(this, mouse)) {
				context.strokeStyle = "blue";
				context.strokeRect(this.x, this.y, this.width, this.height);
			}
		}
	}
	function createGrid() {
		for (let y = cellSize; y < canvas.height - cellSize; y += cellSize) {
			for (let x = 0; x < canvas.width; x += cellSize) {
				gameGrid.push(new Cell(x, y));
			}
		}
	}
	createGrid();

	function handleGameGrid() {
		for (let i = 0; i < gameGrid.length; i++) {
			gameGrid[i].draw();
		}
	}
	// ____________________________________________
	// projectiles
	class Projectile {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.width = cellSize;
			this.height = cellSize;
			this.power = 20;
			this.speed = 4;
			this.projectileType = israelFlag;
			this.frameX = 0;
			this.frameY = 0;
			this.minFrame = 0;
			this.maxFrame = 3;
			this.spriteWidth = 200;
			this.spriteHeight = 200;
		}
		update() {
			this.y -= this.speed;
			if (frame % 5 === 0) {
				if (this.frameY < this.maxFrame) this.frameY++;
				else this.frameY = this.minFrame;
			}
		}
		powerUp() {
			if (this.power <= 50) this.power += 5;
		}
		draw() {
			context.fillStyle = "white";
			context.drawImage(this.projectileType, 0, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
		}
	}

	function handleProjectiles() {
		for (let i = 0; i < projectiles.length; i++) {
			projectiles[i].update();
			projectiles[i].draw();

			for (let j = 0; j < enemies.length; j++) {
				if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
					enemies[j].health -= projectiles[i].power;
					hit.play();
					projectiles.splice(i, 1);
					i--;
				}
			}
			// splice the projectile before it reaches the top of the canvas
			if (projectiles[i] && projectiles[i].y <= cellSize / 2 + cellGap) {
				projectiles.splice(i, 1);
				i--;
			}
		}
	}
	// -------------------------------------------
	// defenders
	class Defender {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.width = cellSize - cellGap * 2;
			this.height = cellSize - cellGap * 2;
			this.shooting = false;
			this.health = 100;
			this.projectiles = [];
			this.timer = 2;
			this.fireRate = 100;
			this.spriteWidth = 180;
			this.spriteHeight = 180;
		}
		draw() {
			context.fillStyle = "gold";
			context.font = "20px Arial";
			context.fillText(Math.floor(this.health), this.x + 30, this.y + this.height - cellGap);
			context.drawImage(defender1, 0, 0, 200, 200, this.x, this.y, this.width, this.height);
		}
		update() {
			if (this.shooting) {
				this.timer += 2;
				if (this.timer % this.fireRate === 0) {
					projectiles.push(new Projectile(this.x, this.y));
					throwFlag.play();
				}
			} else {
				this.timer = 0;
			}
		}
	}

	function handleDefenders() {
		for (let i = 0; i < defenders.length; i++) {
			defenders[i].draw();
			defenders[i].update();
			// check if there is a defender on the same column of an enemy
			if (enemyPositions && enemyPositions.includes(defenders[i].x)) {
				defenders[i].shooting = true;
			} else {
				defenders[i].shooting = false;
			}
			// enemy - defender in-counter
			for (let j = 0; j < enemies.length; j++) {
				if (defenders[i] && collision(defenders[i], enemies[j])) {
					enemies[j].movement = 0;
					defenders[i].health -= 1;
				}
				if (defenders[i] && defenders[i].health <= 0) {
					defenders.splice(i, 1);
					i--;
					enemies[j].movement = enemies[j].speed;
				}
			}
		}
	}

	// floating messages
	class FloatingMessage {
		constructor(value, x, y, size, color) {
			this.value = value;
			this.x = x + cellSize;
			this.y = y + cellSize / 2;
			this.size = size;
			this.color = color;
			this.lifeSpan = 0;
			this.opacity = 1;
		}
		update() {
			this.y -= 0.3;
			this.lifeSpan += 1;
			if (this.opacity > 0.01) this.opacity -= 0.01;
		}
		draw() {
			context.globalAlpha = this.opacity;
			context.fillStyle = this.color;
			context.font = this.size + "px Arial";
			context.fillText(this.value, this.x, this.y);
			context.globalAlpha = 1;
		}
	}

	function handleFloatingMessages() {
		for (let i = 0; i < floatingMessages.length; i++) {
			floatingMessages[i].update();
			floatingMessages[i].draw();
			if (floatingMessages[i].lifeSpan >= 50) {
				floatingMessages.splice(i, 1);
				i--;
			}
		}
	}
	// __________________________________________________
	// enemies
	class Enemy {
		constructor(horizontalPosition, speed) {
			this.x = horizontalPosition;
			this.y = cellSize;
			this.width = cellSize - cellGap * 2;
			this.height = cellSize - cellGap * 8;
			this.speed = Math.random() * 0.2 + speed;
			this.movement = this.speed;
			this.health = 100;
			this.maxHealth = this.health;
			this.enemyType = lawScroll;
			this.rule = Math.floor(Math.random() * 10);
		}
		update() {
			this.y += this.movement;
		}

		draw() {
			context.drawImage(this.enemyType, 0, 0, 495, 643, this.x - cellGap * 3, this.y, this.width + cellGap * 6, this.height);
			context.fillStyle = "black";
			context.font = "20px Comfortaa";
			context.fillText(Math.floor(this.health), this.x + 35, this.y);
			context.font = "14px Comfortaa";
			context.fillText(rules[this.rule], this.x + this.width - cellGap, this.y + this.height / 2);
		}
	}
	function handleEnemies() {
		for (let i = 0; i < enemies.length; i++) {
			enemies[i].update();
			enemies[i].draw();

			if (enemies[i].y + enemies[i].height >= canvas.height - cellSize) {
				console.log(enemies[i].y);
				gameOver = true;
				document.getElementById("modal-header").innerHTML = "אוי לא ! החוק הצליח לעבור";
			}
			if (enemies[i].health <= 0) {
				let gainedResources = enemies[i].maxHealth / 10;
				floatingMessages.push(new FloatingMessage("+" + gainedResources, enemies[i].x, enemies[i].y, 25, "white"));

				numberOfResources += gainedResources;
				score += gainedResources;
				collectSound.play();

				const findThisIndex = enemyPositions.indexOf(enemies[i].x);
				enemyPositions.splice(findThisIndex, 1);
				enemies.splice(i, 1);
				i--;
			}
		}

		if (frame % enemiesInterval === 0 && score < winningScore) {
			let horizontalPosition = Math.floor(Math.random() * 5 + 1) * cellSize - cellSize + cellGap;

			enemies.push(new Enemy(horizontalPosition, enemySpeed));
			enemyPositions.push(horizontalPosition);

			if (enemySpeed < 0.7) enemySpeed += 0.02;
			console.log(enemySpeed);

			if (enemiesInterval > 120) {
				enemiesInterval -= 100;
			}
		}
	}
	// _______________________________________________
	// resources
	class Resource {
		constructor() {
			this.x = (Math.floor(Math.random() * 5) + 1) * cellSize - cellSize;
			this.y = cellSize + (Math.floor(Math.random() * 6 + 1) * cellSize - cellSize);
			this.width = cellSize;
			this.height = cellSize;
			this.amount = amounts[Math.floor(Math.random() * amounts.length)];
			this.spriteWidth = 3000;
			this.spriteHeight = 2400;
			this.resourceType = megaPhone;
		}
		draw() {
			context.drawImage(this.resourceType, 0, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
		}
	}

	function handleResources() {
		if (frame % 500 === 0 && score < winningScore && defenders.length > 0) {
			resources.push(new Resource());
		}
		for (let i = 0; i < resources.length; i++) {
			for (let j = 0; j < defenders.length; j++) {
				if (collision(resources[i], defenders[j])) {
					resources.splice(i, 1);
					i--;
					break;
				} else {
					resources[i].draw();
				}
			}
		}
	}
	// --------------------------------------------------
	function handleGameStatus() {
		context.fillStyle = "black";
		context.font = "30px Comfortaa";
		context.fillText(`${numberOfResources} משאבים`, canvas.width - 10, canvas.height - cellSize + 30);
		context.fillText(`${score} חוקים שהושמדו`, canvas.width - 10, canvas.height - 20);
		if (score >= winningScore && enemies.length === 0) {
			backgroundSound.pause();
			victory.play();
			crowd.play();
			crowd.loop = true;
			setTimeout(() => (crowd.loop = false), 3000);
			document.getElementById("modal-header").innerHTML = "מעולה הצלחת לחסום את כל החוקים !!!";
			gameOver = true;
			gameStarted = false;
			toggleModal();
		}
		if (gameOver) {
			backgroundSound.pause();
			fail.play();
			toggleModal();
		}
	}

	canvas.addEventListener("click", function () {
		const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
		const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
		// placement higher than controls bar
		if (gridPositionY > controlsBar.y || gridPositionY < enemyBar.height) return;
		// cancel placement on top of each other
		for (let i = 0; i < defenders.length; i++) {
			if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
		}

		let resourceCollisionDetected = false;
		for (let i = 0; i < resources.length; i++) {
			if (collision(resources[i], mouse)) {
				numberOfResources += resources[i].amount;
				collectSound.play();
				floatingMessages.push(new FloatingMessage("+" + resources[i].amount, resources[i].x, resources[i].y, 25, "white"));
				resources.splice(i, 1);
				i--;
				resourceCollisionDetected = true;
				break;
			}
		}

		let defenderCost = 100;

		if (!resourceCollisionDetected) {
			if (numberOfResources >= defenderCost) {
				defenders.push(new Defender(gridPositionX, gridPositionY));
				numberOfResources -= defenderCost;
			} else {
				floatingMessages.push(new FloatingMessage("אין מספיק משאבים", mouse.x, mouse.y, 25, "white"));
			}
		}
	});

	// Main function
	function animate() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		handleGameGrid();

		context.fillStyle = "grey";
		context.fillRect(enemyBar.x, enemyBar.y, enemyBar.width, enemyBar.height);
		context.drawImage(bibi, 0, 0, 672, 854, 0, 0, cellSize, cellSize);
		context.drawImage(Ten, 75, 0, 3636, 2745, cellSize, 0, cellSize * 4, cellSize);
		context.fillRect(controlsBar.x, controlsBar.y, controlsBar.width, controlsBar.height);

		handleResources();
		handleDefenders();
		handleProjectiles();
		handleEnemies();
		handleGameStatus();
		handleFloatingMessages();
		frame++;
		if (!gameOver && gameStarted) {
			requestAnimationFrame(animate);
		}
	}
	animate();

	function collision(first, second) {
		if (!(first.x > second.x + second.width || first.x + first.width <= second.x || first.y > second.y + second.height || first.y + first.height < second.y)) {
			return true;
		}
	}
});
