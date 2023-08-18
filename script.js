// import * as Tone from '../node_modules/tone/build/Tone.js';;

window.addEventListener("load", function () {
	
	const collectSound = new Audio();
	collectSound.src = './assets/collect.mp3';
	
	const backgroundSound = new Audio();
	backgroundSound.src = './assets/gameMusic.mp3';

	const throwFlag = new Audio();
	throwFlag.src = './assets/throw.mp3';

	const hit = new Audio();
	hit.src = './assets/hit.mp3';

	// const backgroundSound = new Audio();
	// backgroundSound.src = '/.assets/gameMusic.mp3';

	// const backgroundSound = new Audio();
	// backgroundSound.src = '/.assets/gameMusic.mp3';


	const canvas = document.getElementById("canvas1");
	const context = canvas.getContext("2d");
	
	let canvasPosition = canvas.getBoundingClientRect();
	canvas.width = canvasPosition.width;
	canvas.height = canvasPosition.height;
	let cellSize = 100;
	let cellGap = 3;

	if (window.innerWidth < 700) {
		cellSize = 75;
		cellGap = 0.2;
	}

	// global variables
	let numberOfResources = 300;
	let enemiesInterval = 600;
	let enemySpeed = 0.2;
	let frame = 0;
	let gameOver = false;
	let gameStarted = false;
	let score = 0;
	const winningScore = 300;
	// let selectedDefender = false;
	let gameGrid = [];
	let defenders = [];
	let enemies = [];
	let enemyPositions = [];
	let projectiles = [];
	let resources = [];
	// ____________________________________
	// mouse
	const mouse = {
		x: 10,
		y: 10,
		width: 0.1,
		height: 0.1,
		clicked: false,
	};

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
	// ________________________________________________
	$(document).ready(function () {
		$("#exampleModalToggle").modal("show");
	});
	document.querySelector("#restart-button").addEventListener("click", restartGame);
	document.querySelector("#start-button1").addEventListener("click", restartGame);
	document.querySelector("#start-button2").addEventListener("click", restartGame);
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
		backgroundSound.play();
		animate();
	}

	// game board
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

	const mapTypes = [];
	const road = new Image();
	road.src = "./assets/road2.png";
	mapTypes.push(road);

	class Cell {
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
	const projectileTypes = [];
	const israelFlag = new Image();
	israelFlag.src = "./assets/israelFlag1.png";
	projectileTypes.push(israelFlag);

	class Projectile {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.width = cellSize;
			this.height = cellSize;
			this.power = 20;
			this.speed = 4;
			this.projectileType = projectileTypes[0];
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
			// splice the projectile 50px before it reaches the top of the canvas (which is y = 0)
			if (projectiles[i] && projectiles[i].y < canvas.height - canvas.height + cellSize - 50) {
				projectiles.splice(i, 1);
				i--;
			}
		}
	}
	// ____________________________________________________

	// defenders
	const defender1 = new Image();
	defender1.src = "./assets/defender3.png";

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
		// TODO: check fire rate option
		// fireRate() {
		//   if (this.fireRate >= 40) this.fireRate -= 10;
		// }
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
	const powerUpIcon = new Image();
	powerUpIcon.src = "./assets/powerUpIcon.png";

	const speedUpIcon = new Image();
	speedUpIcon.src = "./assets/speedUpIcon.png";

	// const powerUp = {
	//   x: 10,
	//   y: canvas.height - cellSize + 10,
	//   width: cellSize - 20,
	//   height: cellSize - 20,
	// };

	// const speedUp = {
	//   x: cellSize + 10,
	//   y: canvas.height - cellSize + 10,
	//   width: cellSize - 20,
	//   height: cellSize - 20,
	// };

	const warrior = {
		x: 10,
		y: canvas.height - cellSize + 10,
		width: cellSize - 20,
		height: cellSize - 20,
	};

	function chooseAction() {
		// defender selection
		// let strokeColor = 'black';
		// if (collision(mouse, warrior) && mouse.clicked){
		//   strokeColor = 'gold';
		//   selectedDefender = true;
		// }
		// if (selectedDefender) strokeColor = 'gold';
		// powerUp activate
		// if (collision(mouse, powerUp) && mouse.clicked) {
		//   Projectile.powerUp();
		// }
		// context.lineWidth = 1;
		// context.fillStyle = "rgba(0,0,0,0.5)";
		// context.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
		// context.drawImage(
		//   powerUpIcon,
		//   0,
		//   0,
		//   230,
		//   230,
		//   powerUp.x + 10,
		//   powerUp.y + 10,
		//   powerUp.width - 20,
		//   powerUp.height - 20
		// );
		// context.fillRect(speedUp.x, speedUp.y, speedUp.width, speedUp.height);
		// context.drawImage(
		//   speedUpIcon,
		//   0,
		//   0,
		//   230,
		//   230,
		//   speedUp.x + 10,
		//   speedUp.y + 10,
		//   speedUp.width - 20,
		//   speedUp.height - 20
		// );
		// context.fillRect(warrior.x, warrior.y, warrior.width, warrior.height);
		// // context.strokeStyle = strokeColor;
		// context.strokeRect(warrior.x, warrior.y, warrior.width, warrior.height);
		// context.drawImage(defender1, 0, 0, 628, 628, warrior.x, warrior.y, cellSize - 20, cellSize - 20);
	}

	// floating messages
	const floatingMessages = [];
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
	let enemyTypes = [];
	const lawScroll = new Image();
	lawScroll.src = "./assets/scroll.png";
	enemyTypes.push(lawScroll);

	let rules = ["נבצרות", "מתנות", "יועמ״שים", "ההתגברות", "משטרה", "רחצה", "דרעי", "לא ברוב", "עבריין כרה״מ", `פטור מגיוס`];

	class Enemy {
		constructor(horizontalPosition, speed) {
			this.x = horizontalPosition;
			this.y = cellSize;
			this.width = cellSize - cellGap * 2;
			this.height = cellSize - cellGap * 2;
			this.speed = Math.random() * 0.2 + speed;
			// this.speed = Math.random() * 0.3 + 0.4;
			this.movement = this.speed;
			this.health = 100;
			this.maxHealth = this.health;
			this.enemyType = enemyTypes[0];
			this.rule = Math.floor(Math.random() * 10);
		}
		update() {
			this.y += this.movement;
		}

		draw() {
			context.drawImage(this.enemyType, 0, 0, 495, 643, this.x, this.y, this.width, this.height);
			context.fillStyle = "black";
			context.font = "20px Arial";
			context.fillText(Math.floor(this.health), this.x + 35, this.y);
			context.font = "15px Arial";
			context.fillText(rules[this.rule], this.x + this.width - cellGap * 4, this.y + this.height - 50);
		}
	}
	function handleEnemies() {
		for (let i = 0; i < enemies.length; i++) {
			enemies[i].update();
			enemies[i].draw();

			if (enemies[i].y >= canvas.height - cellSize * 2) {
				gameOver = true;
				document.getElementById("modal-header").innerHTML = "אוי לא ! החוק הצליח לעבור";
			}
			if (enemies[i].health <= 0) {
				let gainedResources = enemies[i].maxHealth / 10;
				floatingMessages.push(new FloatingMessage("+" + gainedResources, enemies[i].x, enemies[i].y, 25, "white"));
				// for the ניקוד
				// floatingMessages.push(
				//   new FloatingMessage(
				//     "+" + gainedResources,
				//     enemies[i].x,
				//     enemies[i].y,
				//     25,
				//     "white"
				//   )
				// );
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
	const resourceTypes = [];
	const megaPhone = new Image();
	megaPhone.src = "./assets/mega-phone.png";
	resourceTypes.push(megaPhone);

	const amounts = [20, 30, 40];
	class Resource {
		constructor() {
			this.x = (Math.floor(Math.random() * 5) + 1) * cellSize - cellSize;
			this.y = cellSize + (Math.floor(Math.random() * 6 + 1) * cellSize - cellSize);
			this.width = cellSize;
			this.height = cellSize;
			this.amount = amounts[Math.floor(Math.random() * amounts.length)];
			this.spriteWidth = 3000;
			this.spriteHeight = 2400;
			this.resourceType = resourceTypes[0];
		}
		draw() {
			context.drawImage(this.resourceType, 0, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
		}
	}

	function handleResources() {
		if (frame % 500 === 0 && score < winningScore) {
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
			// 	// for the resource itself
			// 	floatingMessages.push(new FloatingMessage("+" + resources[i].amount, resources[i].x, resources[i].y, 25, "white"));
			// 	// for the משאבים
			// 	// floatingMessages.push(
			// 	//   new FloatingMessage(
			// 	//     "+" + resources[i].amount,
			// 	//     mouse.x,
			// 	//     mouse.y,
			// 	//     15,
			// 	//     "white"
			// 	//   )
			// 	// );
			// 	resources.splice(i, 1);
			// 	i--;
			// }
		}
	}
	// _____________________________________________

	// utilities
	function handleGameStatus() {
		context.fillStyle = "black";
		context.font = "30px Arial";
		context.fillText(`${numberOfResources} משאבים`, canvas.width - 10, canvas.height - cellSize + 30);
		context.fillText(`${score} חוקים שהושמדו`, canvas.width - 10, canvas.height - 20);
		if (score >= winningScore && enemies.length === 0) {
			document.getElementById("modal-header").innerHTML = "מעולה הצלחת לחסום את כל החוקים !!!";
			gameOver = true;
			gameStarted = false;
			setTimeout(toggleModal(), 1000);
		}
		if (gameOver) {
			backgroundSound.pause();
			setTimeout(toggleModal(), 1000);
		}
	}

	var modal = new bootstrap.Modal(document.getElementById("staticBackdrop"));

	function toggleModal() {
		// Toggle Modal
		modal.toggle();
	}

	const bibi = new Image();
	bibi.src = "./assets/bibi.png";

	const Ten = new Image();
	Ten.src = "./assets/Ten.png";

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
				// for the resource itself
				floatingMessages.push(new FloatingMessage("+" + resources[i].amount, resources[i].x, resources[i].y, 25, "white"));
				// for the משאבים
				// floatingMessages.push(
				//   new FloatingMessage(
				//     "+" + resources[i].amount,
				//     mouse.x,
				//     mouse.y,
				//     15,
				//     "white"
				//   )
				// );
				resources.splice(i, 1);
				i--;
				resourceCollisionDetected = true;
				break;
			}
		}
		console.log(resourceCollisionDetected);

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

	// main function
	function animate() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		handleGameGrid();
		context.fillStyle = "grey";

		context.fillRect(enemyBar.x, enemyBar.y, enemyBar.width, enemyBar.height);
		context.drawImage(bibi, 50, 0, 100, 160, 0, 0, cellSize, cellSize);
		context.drawImage(Ten, 0, 0, 3636, 2745, cellSize, 0, cellSize * 4, cellSize);

		context.fillStyle = "grey";
		context.fillRect(controlsBar.x, controlsBar.y, controlsBar.width, controlsBar.height);

		handleResources();
		handleDefenders();
		handleProjectiles();
		handleEnemies();
		chooseAction();
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

	window.addEventListener("resize", function () {
		canvasPosition = canvas.getBoundingClientRect();
	});
});
