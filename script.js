const canvas = document.getElementById("canvas1");
const context = canvas.getContext("2d");

let canvasPosition = canvas.getBoundingClientRect();
canvas.width = canvasPosition.width;
canvas.height = canvasPosition.height;

// global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 200;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];
// mouse
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
};
// console.log(canvas);

canvas.addEventListener("mousemove", function (e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
  // console.log(mouse, canvasPosition);
});

canvas.addEventListener("mouseleave", function () {
  mouse.x = undefined;
  mouse.y = undefined;
});

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
road.src = "road1.png";
mapTypes.push(road);

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.map = mapTypes[0]
  }
  draw() {
    context.drawImage(
      this.map,
      this.x,
      this.y,
      this.width,
      this.height,
    );
    if (mouse.x && mouse.y && collision(this, mouse)) {
      context.strokeStyle = "black";
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
// projectiles
const projectileTypes = [];
const israelFlag = new Image();
israelFlag.src = "israelFlag1.png";
projectileTypes.push(israelFlag);

class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 100;
    this.power = 50;
    this.speed = 7;
    this.projectileType = projectileTypes[0];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 4;
    this.spriteWidth = 200;
    this.spriteHeight = 200;
  }
  update() {
    this.y -= this.speed;
    if (frame % 10 === 0) {
      if (this.frameY < this.maxFrame) this.frameY++;
      else this.frameY = this.minFrame;
    }
  }
  draw() {
    context.fillStyle = "white";
    // context.beginPath();
    context.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    // context.fill();
    // context.fillRect(this.x, this.y, this.width, this.height);
    // context.fillStyle = 'red'
    context.drawImage(
      this.projectileType,
      0,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j] &&
        projectiles[i] &&
        collision(projectiles[i], enemies[j])
      ) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }
    // splice the projectile 50px before it reaches the top of the canvas (which is y = 0)
    if (
      projectiles[i] &&
      projectiles[i].y < canvas.height - canvas.height + cellSize - 50
    ) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}
// defenders
const defender1 = new Image();
// TODO: change kaplan defender name from work
defender1.src = "work.png";
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shooting = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
    // this.frameX = 0;
    // this.frameY = 0;
    this.spriteWidth = 180;
    this.spriteHeight = 180;
    // this.minFrame = 0;
    // this.maxFrame = 16;
  }
  draw() {
    // context.fillStyle = "blue";
    // context.fillRect(this.x, this.y, this.width, this.height);
    context.fillStyle = "gold";
    context.font = "20px Arial";
    context.fillText(Math.floor(this.health), this.x + 5, this.y + 90);
    context.drawImage(
      defender1,
      this.x - 50,
      this.y - 50,
      this.spriteWidth,
      this.spriteHeight
      // this.x,
      // this.y,
      // this.width,
      // this.height
    );
  }
  update() {
    if (this.shooting) {
      this.timer++;
      if (this.timer % 100 === 0) {
        projectiles.push(new Projectile(this.x, this.y));
      }
    } else {
      this.timer = 0;
    }
  }
}
canvas.addEventListener("click", function () {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  // placement higher than controls bar
  if (gridPositionY > controlsBar.y) return;
  // cancel placement on top of each other
  for (let i = 0; i < defenders.length; i++) {
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
      return;
  }
  let defenderCost = 100;
  if (numberOfResources >= defenderCost) {
    console.log("create defender:", new Date().toLocaleTimeString());
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
    console.log(defenders);
  }
});

function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    defenders[i].update();
    if (enemyPositions && enemyPositions.includes(defenders[i].x)) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    }
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

// enemies

class Enemy {
  constructor(horizontalPosition) {
    this.x = horizontalPosition;
    this.y = cellSize;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.0001 + 0.04;
    // this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
  }
  update() {
    this.y += this.movement;
  }
  draw() {
    context.fillStyle = "red";
    context.fillRect(this.x, this.y, this.width, this.height);
    context.fillStyle = "black";
    context.font = "30px Arial";
    context.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
  }
}
function handleEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();

    if (enemies[i].y >= canvas.height - cellSize * 2) {
      gameOver = true;
    }
    if (enemies[i].health <= 0) {
      let gainedResources = enemies[i].maxHealth / 10;
      numberOfResources += gainedResources;
      score += gainedResources;

      const findThisIndex = enemyPositions.indexOf(enemies[i].x);
      enemyPositions.splice(findThisIndex, 1);
      enemies.splice(i, 1);
      i--;
    }
  }

  if (frame % enemiesInterval === 0 && score < winningScore) {
    let horizontalPosition =
      Math.floor(Math.random() * 5 + 1) * cellSize - 100 + cellGap;
    console.log(horizontalPosition);
    enemies.push(new Enemy(horizontalPosition));
    enemyPositions.push(horizontalPosition);
    console.log("Enemies ", [...enemies], "enemies position", enemyPositions);
    if (enemiesInterval > 120) enemiesInterval -= 100;
  }
}

// resources
const resourceTypes = [];
const megaPhone = new Image();
megaPhone.src = "megaPhone.png";
resourceTypes.push(megaPhone);

const amounts = [20, 30, 40];
class Resource {
  constructor() {
    this.x = (Math.floor(Math.random() * 5) + 1) * cellSize - 100;
    this.y = 100 + (Math.random() * (canvas.height - (cellSize * 2.5)));
    // this.y = Math.random() * (cellSize);
    this.width = cellSize * 0.4;
    this.height = cellSize * 0.4;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    this.spriteWidth = 150;
    this.spriteHeight = 120;
    this.resourceType = resourceTypes[0];

  }
  draw() {
    // context.fillStyle = "yellow";
    // context.fillRect(this.x, this.y, this.width, this.height);
    // context.fillStyle = "black";
    // context.font = "20px Arial";
    // context.fillText(this.amount, this.x + 15, this.y + 25);
    context.drawImage(
      megaPhone,
      this.x - 55,
      this.y - 45,
      this.spriteWidth,
      this.spriteHeight
    );
  }
}

function handleResources() {
  if (frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  }
  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();
    if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      numberOfResources += resources[i].amount;
      resources.splice(i, 1);
      i--;
    }
  }
}
// utilities
function handleGameStatus() {
  fillStyle = "black";
  context.font = "30px Arial";
  context.fillText("Score: " + score, 20, canvas.height - 25);
  context.fillText("Resources: " + numberOfResources, 20, canvas.height - 65);
  if (gameOver) {
    context.fillStyle = "black";
    context.font = "60px Arial";
    context.fillText("GAME OVER", 135, 330);
  }
  if (score >= winningScore && enemies.length === 0) {
    context.fillStyle = "black";
    context.font = "60px Arial";
    context.fillText("VICTORY !", 0, 300);
    context.font = "30px Arial";
    context.fillText("You win with " + score + " points!", 0, 340);
  }
}
const bibi = new Image();
bibi.src = "bibi.png";

function animate() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "orange";
  
  context.fillRect(
    enemyBar.x,
    enemyBar.y,
    enemyBar.width,
    enemyBar.height
    );
  context.drawImage(
    bibi,
    0,
    0,
    152,
    100
  )
    
  context.fillStyle = "blue";
  context.fillRect(
    controlsBar.x,
    controlsBar.y,
    controlsBar.width,
    controlsBar.height
  );

  handleGameGrid();
  handleResources();
  handleDefenders();
  handleProjectiles();
  handleEnemies();
  handleGameStatus();
  frame++;
  if (!gameOver) requestAnimationFrame(animate);
}
animate();

function collision(first, second) {
  if (
    !(
      first.x > second.x + second.width ||
      first.x + first.width <= second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  ) {
    return true;
  }
}

window.addEventListener("resize", function () {
  canvasPosition = canvas.getBoundingClientRect();
});
