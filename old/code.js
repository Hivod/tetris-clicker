const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const button = document.getElementById("clickerbutton");
const buttonLock = document.getElementById("buttonlock");
const arenaSize = 10;
const scale = [canvas.height / ((arenaSize * 2.1 | 0) | 0),
               canvas.width / arenaSize];
console.log(scale[0] + ", " + scale[1])
const colors = ["rgb(0, 0, 0)", //black @index 0
                "rgb(255, 0, 0)", //red @index 1, L tetro
                "rgb(0, 255, 0)", //green @index 2, J tetro
                "rgb(255, 127, 0)", //orange @index 3, T tetro
                "rgb(0, 0, 255)", //blue @index 4, S tetro
                "rgb(255, 0, 255)", //pink @index 5, Z tetro
                "rgb(255, 255, 0)", //yellow @index 6, I tetro
                "rgb(127, 0, 255)"]; //purple @index 7, O tetro
/* constants for text elements */
const scoreText = document.getElementById("score");
const totalScoreText = document.getElementById("totalscore");
const screenText1 = document.getElementById("screentext");
const screenText2 = document.getElementById("screentexttwo");
const blockAmountText = document.getElementById("blockamount");
var downScale = 5;
var score = 0;
var totalScore = 0;
ctx.scale(scale[0], scale[1]);
ctx.fillStyle = "black"
ctx.fillRect(0, 0, canvas.width / scale[0], canvas.height / scale[1]);

document.getElementById("rightsidebar").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
document.getElementById("leftsidebar").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
setInterval(function() {
  document.getElementById("leftsidebar").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
  document.getElementById("rightsidebar").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
}, 1000);


const tetrominos = [
  //L tetro
 [[1, 1, 1],
  [1, 0, 0],
  [0, 0, 0]],
  // J tetro
 [[2, 2, 2],
  [0, 0, 2],
  [0, 0, 0]],
  // T tetro
 [[3, 3, 3],
  [0, 3, 0],
  [0, 0, 0]],
  // S tetro
 [[0, 4, 4],
  [4, 4, 0],
  [0, 0, 0]],
  // Z tetro
 [[5, 5, 0],
  [0, 5, 5],
  [0, 0, 0]],
  // Line (I) tetro
 [[6, 6, 6, 6],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]],
  // Square (O) tetro
 [[7, 7],
  [7, 7]]
];

var rand = Math.floor(Math.random() * tetrominos.length);
var player = {
  x: 0,
  y: 0,
  tetro: tetrominos[rand],
  color: tetrominos[rand][0][1]
}

/* set up arena */
function createMatrix(width, height) {
  var matrix = [];
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  matrix.push(new Array(width).fill(1));
  return matrix;
}

var arena = createMatrix(arenaSize, (arenaSize * 2.1 | 0));

function drawBlock(x, y, color) {
  ctx.fillStyle = colors[color];
  ctx.fillRect(x, y, 1, 1)
  ctx.scale(1 / downScale, 1 / downScale);
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x * downScale + downScale - 1, y * downScale + 1, 1, downScale - 1);
  ctx.fillRect(x * downScale + 1, y * downScale + downScale - 1, downScale - 1, 1);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(x * downScale, y * downScale, downScale - 1, 1);
  ctx.fillRect(x * downScale, y * downScale, 1, downScale - 1);
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(x * downScale + downScale - 1, y * downScale, 1, 1);
  ctx.fillRect(x * downScale, y * downScale + downScale - 1, 1, 1);
  ctx.scale(downScale, downScale);
}

function drawSprite(sprite, x, y) {
  for (var row = 0; row < sprite.length; row++) {
    for (var i = 0; i < sprite[row].length; i++) {
      if (sprite[row][i] != 0) {
        drawBlock(i + x, row + y, sprite[row][i]);
      }
    }
  }
}

/* draws player's tetromino and all tetrominos on arena */
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawSprite(player.tetro, player.x, player.y);
  drawSprite(arena, 0, 0);
}

/* returns tetromino rotated 90deg left */
function rotate() {
  var arr = new Array;
  for (var i = 0; i < player.tetro.length; i++) {
    arr.push([]);
  }
  for (var y = 0; y < player.tetro.length; y++) {
    for (var x = 0; x < player.tetro[y].length; x++) {
      arr[y].push(player.tetro[x][y]);
    }
  }
  arr.reverse();
  while (arr[0].every(function (val) {
      return val == 0;
    })) {
    arr.splice(0, 1);
    arr.push(new Array(arr[0].length).fill(0));
  }
  return arr;
}

/* move player's tetromino left (direction = -1) or right (direction = 1) */
function move(direction) {
  player.x += direction;
  if (checkCollision(arena, player)) {
    player.x -= direction;
  }
}

/* key listener for controls */
document.body.addEventListener("keydown", function (key) {
  if (key.keyCode == 37) move(-1);
  if (key.keyCode == 39) move(1);
  if (key.keyCode == 38) {
    player.tetro = rotate(player.tetro);
    if (checkCollision(arena, player)) {
      for (var i = 0; i < 3; i++) {
        player.tetro = rotate(player.tetro);
      }
    }
  }
  if (key.keyCode == 40) moveDown();
  if (key.keyCode == 32) sendDown();
});

/* adds player's tetro to current position in arena */
function placeTetro(arena, player) {
  for (var y = 0; y < player.tetro.length; y++) {
    for (var x = 0; x < player.tetro[y].length; x++) {
      if (player.tetro[y][x] != 0) {
        try {
          arena[player.y + y][player.x + x] = player.color;
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
}

/* returns true if player's tetromino overlaps with a placed tetromino */
function checkCollision(arena, player) {
  for (var y = 0; y < player.tetro.length; y++) {
    for (var x = 0; x < player.tetro[y].length; x++) {
      if (player.tetro[y][x] != 0 && (arena[player.y + y] && arena[y + player.y][x + player.x] != 0)) {
        return true;
      }
    }
  }
  return false;
}

function moveDown() {
  player.y++;
  dropCounter = 0;
  if (checkCollision(arena, player)) {
    player.y--;
    placeTetro(arena, player);
    player.y = 0;
    player.tetro = tetrominos[rand];
    player.color = rand + 1;
    player.x = Math.floor(arena[0].length / 2) - Math.floor(player.tetro[0].length / 2);
    if (blockAmount < 4) {
      gameLost = true;
    } else {
      blockAmount -= 4;
    }
    blockAmountText.textContent = "BLOCKS: " + blockAmount;
    rand = Math.floor(Math.random() * tetrominos.length);
  }
}

function sendDown() {
  while (!checkCollision(arena, player)) {
    player.y++;
    dropCounter = 1000;
  }
  player.y--;
}

function clearLine(arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == 0) return false;
  }
  return true;
}

var gameLost = true;

function gameOver() {
  for (var i = 0; i < arena[0].length; i++) {
    if (arena[0][i] != 0) {
      return true;
    }
  }
  /*if (blockAmount < 4) {
    return true;
  }*/
  return false;
}

function endGame() {
  if (blockAmount < 4) {
    screenText1.textContent = "NO BLOCKS LEFT";
  } else {
    screenText1.textContent = "GAME OVER";
  }
  screenText2.textContent = "click to play again";
  buttonLock.style.display = "none";
  totalScore += score;
  totalScoreText.textContent = "TOTAL SCORE: " + totalScore;
}

function startGame() {
  gameLost = false;
  player.x = Math.floor(arena[0].length / 2) - Math.floor(player.tetro[0].length / 2);
  player.y = 0;
  player.tetro = tetrominos[rand];
  dropInterval = 800;
  blockAmount -= 4;
  blockAmountText.textContent = "BLOCKS: " + blockAmount;
  screenText1.textContent = "";
  screenText2.textContent = "";
  buttonLock.style.display = "block";
  score = 0;
  scoreText.textContent = "SCORE: " + score;
  arena = createMatrix(arenaSize, (arenaSize * 2.1 | 0));
  update();
}

screenText1.textContent = "CLICK TO PLAY";

/* start new game when canvas is clicked */
canvas.addEventListener("click", function () {
  if (gameLost && blockAmount >= 12) {
    startGame();
  } else if (gameLost && blockAmount < 12) {
    screenText2.textContent = "need at least 12 blocks to play";
  }
});

var dropCounter = 0;
var dropInterval = 800;
var lastTime = 0;

/* heartbeat */
function update(time = 0) {
  var deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    moveDown();
  }
  for (var i = 0; i < arena.length - 1; i++) {
    if (clearLine(arena[i])) {
      arena.splice(i, 1);
      arena.splice(0, 0, new Array(arenaSize).fill(0));
      document.getElementById("score").textContent = "SCORE: " + ++score;
      dropInterval -= 10;
    }
  }
  draw();
  if (gameOver()) gameLost = gameOver();
  if (!gameLost) {
    requestAnimationFrame(update);
  } else {
    endGame();
  }
}

/* CLICKER BUTTON */

var blockAmount = 12;
var blocksPerClick = 1;

/* returns a "random" rgb color */
function randomColor() {
  var val = 255 + 64;
  var red = Math.floor(Math.random() * 255);
  val -= red;
  if (val > 255) {
    var green = Math.floor(Math.random() * 255);
    val -= green;
  } else {
    var green = Math.floor(Math.random() * val);
    val -= green;
  }
  var blue = val;
  return "rgb(" + red + "," + green + "," + blue + ")";
}

function clickAnimation() {
  let div = document.createElement("div");
  div.className = "animationdiv";
  button.appendChild(div);
  let f = document.createElement("img");
  f.className = "animate";
  f.src = "particle.png";
  div.appendChild(f);
  f.style.left = -25 + Math.random() * 150 + "px";
  div.style.top = -50 - Math.random() * 120 + "px";
  setTimeout(function() {
    button.removeChild(div);
  }, 1000);
}
button.style.background = randomColor();

button.addEventListener("click", function () {
  if (gameLost) {
    blockAmountText.textContent = "BLOCKS: " + ++blockAmount;
    button.style.background = randomColor();
    clickAnimation();
  }
});