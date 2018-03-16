document.getElementById("buttondiv").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
document.getElementById("shopdiv").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
setInterval(function() {
  document.getElementById("buttondiv").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
  document.getElementById("shopdiv").style.width = (window.innerWidth - (window.innerHeight * 0.476)) / 2 + "px";
}, 10);

/*
  TETRIS
*/

const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("scoretext");
const screenText = document.getElementById("screentext");
const screenText2 = document.getElementById("screentext2")
const arenaSize = 10;
ctx.scale(canvas.height / ((arenaSize * 2.1 | 0) | 0), canvas.width / arenaSize);
const colors = ["rgb(14, 0, 88)", /* dark blue */
                "rgb(255, 0, 0)", /* red, L tetro */
                "rgb(0, 255, 0)", /* green, J tetro */
                "rgb(255, 127, 0)", /* orange, T tetro */
                "rgb(0, 0, 255)", /* blue, S tetro */
                "rgb(255, 0, 255)", /* pink, Z tetro */
                "rgb(255, 255, 0)", /* yellow, I tetro */
                "rgb(127, 0, 255)", /* purple, O tetro */
                "rgba(109, 124, 173, 0.4)"]; /* ghost, ghost tetro */
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
const playerTetrominoArrayLength = 5;

var startingSpeed = 800;
var dropCounter = 0;
var dropInterval = 0;
var maxSpeed = 80;
var lastTime = 0;
var score = 0;
var paused = false;
var player = {
  x: 0,
  y: 0,
  tetrominos: getRandomTetrominos(playerTetrominoArrayLength)
};
var downScale = 5;
var style = 0; /* draw style for blocks (0 or 1) */
var contrast = 1; /* contrast for shading on blocks (0-5) */
var gameOverAnimation;
var dropCounterHasReset;

function drawBlock(x, y, color, contrast) {
  /* draw a stylized tetris block */
  if (contrast in window) contrast = 1;
  ctx.fillStyle = colors[color];
  ctx.fillRect(x, y, 1, 1)
  ctx.scale(1 / downScale, 1 / downScale);
  ctx.fillStyle = "rgba(0, 0, 0, " + contrast / 2 + ")";
  ctx.fillRect(x * downScale + downScale - 1, y * downScale + 1, 1, downScale - (1 + style));
  ctx.fillRect(x * downScale + 1, y * downScale + downScale - 1, downScale - 1, 1);
  ctx.fillStyle = "rgba(255, 255, 255, " + contrast * (Math.abs(style-1)) / 1.4286 + ")";
  ctx.fillRect(x * downScale, y * downScale, downScale - 1, 1);
  ctx.fillRect(x * downScale, y * downScale, 1, downScale - 1);
  ctx.fillStyle = "rgba(0, 0, 0, " + (contrast + (style * 5000)) / 5 + ")";
  ctx.fillRect(x * downScale + downScale - 1, y * downScale, 1, 1);
  ctx.fillRect(x * downScale, y * downScale + downScale - 1, 1, 1);
  ctx.scale(downScale, downScale);
}

function drawMatrix(matrix, x, y) {
  /* draw a matrix using drawBlock() */
  for (var row = 0; row < matrix.length; row++) {
    for (var i = 0; i < matrix[row].length; i++) {
      if (matrix[row][i] != 0) {
        drawBlock(i + x, row + y, matrix[row][i], contrast);
      }
    }
  }
}

function createMatrix(width, height) {
  var matrix = [];
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
}

var arena = createMatrix(arenaSize, (arenaSize * 2.1 | 0)); /* set up arena */
arena.push(new Array(arenaSize).fill(9));
var gameLost = true; /* game won't start as soon as the page loads */

function getRandomTetrominos(length) {
  /* returns array of tetrominos of given length */
  let arr = new Array(length).fill(0);
  arr.forEach(function(element, index, arr) {
    arr[index] = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  });
  return arr;
}

function rotate(tetromino) {
  /* returns tetromino rotated 90 degrees counter clockwise */
  var arr = new Array;
  for (var i = 0; i < tetromino.length; i++) {
    arr.push([]);
  }
  for (var y = 0; y < tetromino.length; y++) {
    for (var x = 0; x < tetromino[y].length; x++) {
      arr[y].push(tetromino[x][y]);
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

function moveDown() {
  /* moves player down unless there is a collision */
  player.y++;
  dropCounter = 0;
  if (checkCollision(arena, player.tetrominos[0])) {
    player.y--;
    placeTetro(arena, player);
    if (!gameOver()) newTetro();
  }
}

function sendDown() {
  /* moves player as far down as possible instantly */
  while (!checkCollision(arena, player.tetrominos[0])) {
    player.y++;
    if (!dropCounterHasReset && !gameLost) {
      dropCounter = dropInterval - 80;
      dropCounterHasReset = true;
    }
  }
  player.y--;
}

function move(direction) {
  /* move player's tetromino left (direction = -1) or right (direction = 1) */
  player.x += direction;
  if (checkCollision(arena, player.tetrominos[0])) {
    player.x -= direction;
  }
}

function checkCollision(matrix1, matrix2) {
  /* returns true if matrix1 and matrix2 overlaps (at player's position) */
  for (var y = 0; y < matrix2.length; y++) {
    for (var x = 0; x < matrix2[y].length; x++) {
      if (matrix2[y][x] != 0 && (matrix1[player.y + y] && matrix1[y + player.y][x + player.x] != 0)) {
        return true;
      }
    }
  }
  return false;
}

function checkCollisionAtPosition(matrix1, matrix2, x2, y2) {
  /* returns true if matrix1 and matrix2 overlaps at (x2, y2) */
  for (var y = 0; y < matrix2.length; y++) {
    for (var x = 0; x < matrix2[y].length; x++) {
      if (matrix2[y][x] != 0 && (matrix1[y2 + y] && matrix1[y + y2][x + x2] != 0)) {
        return true;
      }
    }
  }
  return false;
}

function placeTetro(arena, player) {
  /* adds player's tetromino to arena at player's current position */
  var color;
  player.tetrominos[0][0].forEach(function(element) {
    if (element != 0) color = element;
  })
  for (var y = 0; y < player.tetrominos[0].length; y++) {
    for (var x = 0; x < player.tetrominos[0][y].length; x++) {
      if (player.tetrominos[0][y][x] != 0) {
        try {
          arena[player.y + y][player.x + x] = color;
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
}

function newTetro() {
  /* removes player's current tetromino, gives player a new tetromino, and resets position */
  player.tetrominos.splice(0, 1);
  player.tetrominos.push(getRandomTetrominos(1)[0]);
  player.x = Math.floor(arena[0].length / 2) - Math.floor(player.tetrominos[0][0].length / 2);
  player.y = 0;
  if (!upgrades[0].bought) {
    blockAmount -= 4;
  } else {
    blockAmount--;
  }
  if (blockAmount >= 0) blockAmountText.textContent = blockText + blockAmount;
  dropCounterHasReset = false;
}

function rowFull(arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == 0) return false;
  }
  return true;
}

function clearRows(arena) {
  /* clears any full rows and returns amount of cleared rows */
  var rows = 0;
  arena.forEach(function(element, index) {
    if (rowFull(element) && element[0] != 9) {
      arena.splice(index, 1);
      arena.splice(0, 0, new Array(arenaSize).fill(0));
      rows++;
    }
  });
  return rows;
}

function gameOver() {
  /* return true if blocks are touching top of arena */
  for (var i = 0; i < arena[0].length; i++) {
    if (arena[0][i] != 0 || blockAmount < 0) {
      return true;
    }
  }
  return false;
}

function startGame() {
  if (blockAmount >= startingBlocks) {
    gameLost = false;
    paused = false;
    dropInterval = startingSpeed;
    arena = createMatrix(10, 21); /* reset arena */
    arena.push(new Array(arenaSize).fill(9));
    player.tetrominos = getRandomTetrominos(playerTetrominoArrayLength); /* reset player's tetromino array */
    player.x = Math.floor(arena[0].length / 2) - Math.floor(player.tetrominos[0][0].length / 2);
    player.y = 0;
    if (!upgrades[0].bought) {
      blockAmount -= 4;
    } else {
      blockAmount--;
    }
    blockAmountText.textContent = blockText + blockAmount;
    document.getElementById("buttonlock").style.display = "block";
    button.style.pointerEvents = "none";
    clearInterval(gameOverAnimation);
    score = 0;
    update();
  } else if(!upgrades[0].bought) {
    screenText.textContent = "NEED AT LEAST 12 BLOCKS TO PLAY";
  } else {
    screenText.textContent = "NEED AT LEAST 3 TETROMINOS TO PLAY"
  }
}

function endGame() {
  totalScore += score;
  totalScoreText.textContent = "TOTAL SCORE: " + totalScore;
  if (blockAmount < 0) {
    blockAmount += startingBlocks / 3;
    blockAmountText.textContent = blockText + blockAmount;
  }
  if (!upgrades[0].bought) {
    if (blockAmount < 4) {
      screenText.textContent = "NO MORE BLOCKS!";
    } else {
      screenText.textContent = "GAME OVER";
    }
  }
  screenText2.textContent = "SCORE: " + score;
  setTimeout(function () {
    screenText.textContent = "PRESS SPACE TO PLAY AGAIN";
  }, 5000);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 10, 2);
  document.getElementById("buttonlock").style.display = "none";
  button.style.pointerEvents = "auto";
  var index = 0;
  gameOverAnimation = setInterval(function () {
    if (index < arena.length * arena[0].length) {
      let x = index % arena[0].length;
      let y = (index - x) / arena[0].length;
      if (arena[y][x] != 0) {
        drawBlock(x, y, 0, 1.2);
      }
      index++;
    } else {
      clearInterval(gameOverAnimation);
    }
  }, 30);
}

function update(time = 0) {
  gameLost = gameOver();
  if (!paused) {
    var deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      moveDown();
    }
    let clearedRows = clearRows(arena);
    score += clearedRows;
    dropInterval -= 20 * clearedRows;
    if (dropInterval < maxSpeed) dropInterval = maxSpeed;
    clearedRows = 0;
    scoreText.textContent = score;
    screenText.textContent = "";
    screenText2.textContent = "";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.height / ((arenaSize * 2.1 | 0) | 0), canvas.width / arenaSize);
    drawMatrix(arena, 0, 0);
    drawMatrix(player.tetrominos[0], player.x, player.y);
    if (upgrades[1].bought) {
      let y = 0;
      while (!checkCollisionAtPosition(arena, player.tetrominos[0], player.x, y)) {
        y++;
      }
      y--;
      for (var row = 0; row < player.tetrominos[0].length; row++) {
        for (var i = 0; i < player.tetrominos[0][row].length; i++) {
          if (player.tetrominos[0][row][i] != 0) {
            drawBlock(i + player.x, row + y, 8, 0.5);
          }
        }
      }
    }
  } else {
    screenText.textContent = "PAUSED";
    screenText2.textContent = "PRESS SPACE TO RESUME";
  }
  if (!gameLost) {
    requestAnimationFrame(update);
  } else {
    endGame();
  }
}

document.addEventListener("keydown", function (key) {
  if (gameLost && key.keyCode == 32) {
    startGame();
  } else if (key.keyCode == 32) {
    paused = false;
  }
});

document.body.addEventListener("click", function (e) {
  if (!gameLost && !paused) {
    paused = true;
  }
});

window.onblur = function() {
  paused = true;
}

document.body.addEventListener("keydown", function (key) {
  /* key listener for controls */
  if (!paused) {
    if (key.keyCode == 37) move(-1);
    if (key.keyCode == 39) move(1);
    if (key.keyCode == 38) {
      player.tetrominos[0] = rotate(player.tetrominos[0]);
      if (checkCollision(arena, player.tetrominos[0])) {
        for (var i = 0; i < 3; i++) {
          player.tetrominos[0] = rotate(player.tetrominos[0]);
        }
      }
    }
    if (key.keyCode == 40) moveDown();
    if (key.keyCode == 32) sendDown();
  }
});

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.height / ((arenaSize * 2.1 | 0) | 0), canvas.width / arenaSize);

/*
  CLICKER
*/

const button = document.getElementById("clickerbutton");
const blockAmountText = document.getElementById("blockamounttext");
const totalScoreText = document.getElementById("totalscore");
var blockAmount = 20;
var blockText = "BLOCKS: ";
var startingBlocks = 12;
var totalScore = 0;
var upgrades = [{name: "tetrominoUpgrade", cost: 10, bought: false}, {name: "ghostUpgrade", cost: 100, bought: false}];
var buildings = [];

button.style.background = randomColor();

button.addEventListener("click", function() {
  if (gameLost) {
    blockAmountText.textContent = blockText + ++blockAmount;
    button.style.background = randomColor();
  }
})

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

function addUpgradeToShop(upgrade) {
  let div = document.createElement("div");
  let img = document.createElement("img");
  let cost = document.createElement("p");
  div.className = "upgrade";
  img.src = "resources/" + upgrade.name + ".png";
  img.className = "upgrade";
  cost.className = "upgrade";
  cost.textContent = upgrade.cost;
  div.appendChild(img);
  div.appendChild(cost);
  div.id = upgrade.name;
  document.getElementById("upgradeshop").appendChild(div);
  div.addEventListener("click", function() {
    if (totalScore >= upgrade.cost) {
      totalScore -= upgrade.cost;
      totalScoreText.textContent = "TOTAL SCORE: " + totalScore;
      upgrade.bought = true;
      document.getElementById("upgradeshop").removeChild(div);
      if (upgrade.name == "tetrominoUpgrade") {
        blockText = "TETROMINOS: ";
        blockAmountText.textContent = blockText + blockAmount;
        startingBlocks = 3;
      }
    }
  })
}

function addBuildingToShop(building) {
  let div = document.createElement("div");
  let img = document.createElement("img");
  div.className = "building";
  img.src = "resources/" + building.name + ".png";
  img.className = "building";
  div.appendChild(img);
  document.getElementById("buildingshop").appendChild(div);
}

upgrades.forEach(function (element) {
  if (!element.bought) addUpgradeToShop(element);
});
buildings.forEach(function (element) {
  addBuildingToShop(element);
})

/* TEST ITEMS */
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addUpgradeToShop({name: "item", cost: 0, bought: false});
addBuildingToShop({name: "item"});
addBuildingToShop({name: "item"});
addBuildingToShop({name: "item"});
addBuildingToShop({name: "item"});
addBuildingToShop({name: "item"});


/*
  SAVE GAME


function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

if(readCookie("isSaved")) {
  blockAmount = parseInt(readCookie("blockAmount"));
  blockAmountText.textContent = blockText + blockAmount;
  totalScore = parseInt(readCookie("totalScore"));
  totalScoreText.textContent = "TOTAL SCORE: " + totalScore;
  for (var i = 0; i < upgrades.length; i++) {
    upgrades[i].bought = readCookie(upgrades[i].name + "Bought");
    debugger;
  }
}

setInterval(function () {
  createCookie("blockAmount", blockAmount);
  createCookie("totalScore", totalScore);
  for (var i = 0; i < upgrades.length; i++) {
    debugger;
    createCookie(upgrades[i].name + "Bought", upgrades[i].bought);
  }
  createCookie("isSaved", true);
}, 1000);

if (upgrades[0].bought == true) {
  blockText = "TETROMINOS: ";
  blockAmountText.textContent = blockText + blockAmount;
  startingBlocks = 3;
}

upgrades.forEach(function(element, index, arr) {
  if (element.bought == true) {
    console.log(document.getElementById("upgradeshop").removeChild(document.getElementById(element.name)));
  }
});


document.getElementById("reset").addEventListener("click", function() {
  eraseCookie("blockAmount");
  eraseCookie("totalScore");
  eraseCookie("ghostUpgradeBought");
  eraseCookie("tetrominoUpgradeBought");
  eraseCookie("isSaved");
  totalScore = 0;
  blockAmount = 20;
  upgrades = [{name: "tetrominoUpgrade", cost: 10, bought: false}, {name: "ghostUpgrade", cost: 100, bought: false}];
  startingBlocks = 12;
  blockText = "BLOCKS: ";
  blockAmountText.textContent = blockText + blockAmount;
  totalScoreText.textContent = "TOTAL SCORE: " + totalScore;
});
*/