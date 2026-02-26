// ======== Core model (from your C#) ========

const GridValue = Object.freeze({
  Empty: 0,
  Snake: 1,
  Food: 2,
  Outside: 3,
  DeadSnake: 4,
  Obstacle: 5
});

class Direction {
  constructor(r, c) { this.r = r; this.c = c; }
}
Direction.Left  = new Direction(0, -1);
Direction.Right = new Direction(0,  1);
Direction.Up    = new Direction(-1, 0);
Direction.Down  = new Direction(1,  0);

class Position {
  constructor(row, col) { this.row = row; this.col = col; }
  translate(dir) { return new Position(this.row + dir.r, this.col + dir.c); }
}

class SnakePlayer {
  constructor(name, startOnLeft) {
    this.playerName = name;
    this.positions = []; // head at [0]
    this.currentDirection = startOnLeft ? Direction.Right : Direction.Left;
    this.isAlive = true;
    this.score = 0;

    // web “Images” equivalent
    this.bodyColor = startOnLeft ? "#10ff6f" : "#4aa3ff";
    this.headColor = startOnLeft ? "#caffdf" : "#d9efff";
    this.deadBodyColor = "#6f6f6f";
    this.deadHeadColor = "#9a9a9a";
  }

  changeDirection(newDir) {
    // same “no reverse” rule
    const cd = this.currentDirection;
    if ((cd === Direction.Up && newDir === Direction.Down) ||
        (cd === Direction.Down && newDir === Direction.Up) ||
        (cd === Direction.Left && newDir === Direction.Right) ||
        (cd === Direction.Right && newDir === Direction.Left)) return;
    this.currentDirection = newDir;
  }
}

class GameState {
  constructor(rows, cols, playerName, startOnLeft) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(GridValue.Empty));
    this.snakes = [];

    const player = new SnakePlayer(playerName, startOnLeft);
    const startCol = startOnLeft ? 2 : cols - 5;

    this.addSnake(player, Math.floor(rows / 2), startCol);
    this.snakes.push(player);

    this.addFood();
    this.addFixedObstacles();
  }

  addFixedObstacles() {
    const midCol = Math.floor(this.cols / 2);

    for (let r = 5; r < this.rows - 5; r++) {
      this.grid[r][midCol] = GridValue.Obstacle;
    }
    for (let c = 5; c < this.cols - 5; c++) {
      this.grid[Math.floor(this.rows / 4)][c] = GridValue.Obstacle;
    }
    for (let c = 3; c < this.cols - 3; c++) {
      this.grid[Math.floor((3 * this.rows) / 4)][c] = GridValue.Obstacle;
    }
  }

  addSnake(snake, row, startCol) {
    for (let i = 0; i < 3; i++) {
      const col = (snake.currentDirection === Direction.Right) ? startCol + i : startCol - i;
      const pos = new Position(row, col);
      this.grid[pos.row][pos.col] = GridValue.Snake;
      this.snakeAddFirst(snake, pos);
    }
  }

  snakeAddFirst(snake, pos) { snake.positions.unshift(pos); }
  snakeRemoveLast(snake) { snake.positions.pop(); }

  addFood() {
    for (let i = 0; i < this.rows * this.cols; i++) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (this.grid[r][c] === GridValue.Empty) {
        this.grid[r][c] = GridValue.Food;
        return new Position(r, c);
      }
    }
    return null;
  }

  outsideGrid(pos) {
    return pos.row < 0 || pos.row >= this.rows || pos.col < 0 || pos.col >= this.cols;
  }

  willHit(pos) {
    return this.outsideGrid(pos) ? GridValue.Outside : this.grid[pos.row][pos.col];
  }

  addHead(snake, pos) {
    this.snakeAddFirst(snake, pos);
    this.grid[pos.row][pos.col] = GridValue.Snake;
  }

  removeTail(snake) {
    const tail = snake.positions[snake.positions.length - 1];
    this.grid[tail.row][tail.col] = GridValue.Empty;
    this.snakeRemoveLast(snake);
  }

  markDeadSnake(snake) {
    for (const p of snake.positions) this.grid[p.row][p.col] = GridValue.DeadSnake;
  }

  moveSingle(snake) {
    if (!snake.isAlive || snake.positions.length === 0) return;

    const newHead = snake.positions[0].translate(snake.currentDirection);
    const hit = this.willHit(newHead);

    if (hit === GridValue.Outside || hit === GridValue.Snake || hit === GridValue.Obstacle || hit === GridValue.DeadSnake) {
      snake.isAlive = false;
      this.markDeadSnake(snake);
      return;
    }

    if (hit === GridValue.Empty) {
      this.removeTail(snake);
      this.addHead(snake, newHead);
      return;
    }

    if (hit === GridValue.Food) {
      this.addHead(snake, newHead);
      snake.score++;
      this.addFood();
      return;
    }
  }
}

// ======== Leaderboard (Top 5) ========
const LB_KEY = "snake_lb_top5";

function loadLB() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || "[]"); }
  catch { return []; }
}
function saveLB(list) {
  localStorage.setItem(LB_KEY, JSON.stringify(list));
}
function updateLB(name, score) {
  let lb = loadLB().filter(e => e.name !== name);
  lb.push({ name, score });
  lb.sort((a,b) => b.score - a.score);
  lb = lb.slice(0, 5);
  saveLB(lb);
}
function lbText() {
  const lb = loadLB();
  if (!lb.length) return "No scores yet.";
  let out = "Leaderboard:\n";
  lb.forEach((e,i) => out += `${i+1}. ${e.name} - ${e.score}\n`);
  return out.trimEnd();
}
function getPlayerScore(name) {
  const e = loadLB().find(x => x.name === name);
  return e ? e.score : 0;
}

// ======== UI / Game flow (matches your WPF) ========
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlayText");
const currentPlayerEl = document.getElementById("currentPlayer");
const scoreLineEl = document.getElementById("scoreLine");
const leaderboardEl = document.getElementById("leaderboard");
const restartBtn = document.getElementById("restartBtn");

const rows = 25;
const cols = 25;
const cell = canvas.width / cols;

let gameRunning = false;
let phase = "idle"; // idle | countdown | playing | gameover | results
let names = ["Player 1", "Player 2"];
let scores = [0, 0];

let gameState = null;
let snake = null;

let nextMoveAt = 0;

function showOverlay(text) {
  overlay.style.display = "grid";
  overlayText.textContent = text;
}
function hideOverlay() {
  overlay.style.display = "none";
}

function resetAll() {
  gameRunning = false;
  phase = "idle";
  scores = [0, 0];
  gameState = null;
  snake = null;

  currentPlayerEl.textContent = "Current Player: —";
  scoreLineEl.textContent = "Press Any Key To Start";
  leaderboardEl.textContent = lbText();
  showOverlay("PRESS ANY KEY TO START");
  drawEmpty();
}

function drawEmpty() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGridLines();
}

function drawGridLines() {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cell);
    ctx.lineTo(canvas.width, r * cell);
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cell, 0);
    ctx.lineTo(c * cell, canvas.height);
    ctx.stroke();
  }
  ctx.restore();
}

function fillCell(r, c, color) {
  ctx.fillStyle = color;
  ctx.fillRect(c * cell, r * cell, cell, cell);
}

function drawState(timeMs) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // obstacles + food + dead snake cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = gameState.grid[r][c];
      if (v === GridValue.Obstacle) fillCell(r, c, "rgba(200,200,200,.55)");
      if (v === GridValue.DeadSnake) fillCell(r, c, "rgba(140,140,140,.70)");

      // Food pulse like WPF AnimateFood()
      if (v === GridValue.Food) {
        const t = timeMs / 400;
        const scale = 1 + 0.3 * Math.abs(Math.sin(t * Math.PI));
        const size = cell * scale;
        const x = c * cell + (cell - size) / 2;
        const y = r * cell + (cell - size) / 2;
        ctx.fillStyle = "rgba(255,70,70,.95)";
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  // snake body + head
  const s = snake;
  const body = s.isAlive ? s.bodyColor : s.deadBodyColor;
  const head = s.isAlive ? s.headColor : s.deadHeadColor;

  s.positions.forEach((p, i) => fillCell(p.row, p.col, i === 0 ? head : body));

  // head eyes rotated to direction
  if (s.positions.length) {
    const h = s.positions[0];
    const cx = h.col * cell + cell / 2;
    const cy = h.row * cell + cell / 2;

    ctx.save();
    ctx.translate(cx, cy);

    let ang = 0;
    if (s.currentDirection === Direction.Up) ang = 0;
    if (s.currentDirection === Direction.Right) ang = Math.PI / 2;
    if (s.currentDirection === Direction.Down) ang = Math.PI;
    if (s.currentDirection === Direction.Left) ang = -Math.PI / 2;
    ctx.rotate(ang);

    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-cell * 0.18, -cell * 0.18, cell * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cell * 0.18, -cell * 0.18, cell * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(-cell * 0.18, -cell * 0.18, cell * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cell * 0.18, -cell * 0.18, cell * 0.05, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  drawGridLines();
  scoreLineEl.textContent = `${snake.playerName}: ${snake.score}`;
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function waitForAnyKey() {
  return new Promise(res => {
    const handler = () => {
      window.removeEventListener("keydown", handler);
      res();
    };
    window.addEventListener("keydown", handler);
  });
}

async function showCountDown() {
  phase = "countdown";
  showOverlay("3"); await delay(500);
  showOverlay("2"); await delay(500);
  showOverlay("1"); await delay(500);
  showOverlay("GO!"); await delay(500);
  hideOverlay();
}

function wpfDelayForScore(score) {
  const baseDelay = 150;
  const speedUp = Math.floor(score / 5) * 10;
  return Math.max(50, baseDelay - speedUp);
}

function loop(t) {
  if (phase !== "playing") return;

  if (t >= nextMoveAt) {
    gameState.moveSingle(snake);
    nextMoveAt = t + wpfDelayForScore(snake.score);
  }

  drawState(t);

  if (!snake.isAlive) {
    drawState(t);
    return;
  }

  requestAnimationFrame(loop);
}

async function runTurn(name, startOnLeft) {
  gameState = new GameState(rows, cols, name, startOnLeft);
  snake = gameState.snakes[0];

  currentPlayerEl.textContent = `Current Player: ${name}`;

  await showCountDown();

  phase = "playing";
  nextMoveAt = 0;
  requestAnimationFrame(loop);

  while (snake.isAlive) await delay(50);

  phase = "gameover";
  await delay(800);
  showOverlay("PRESS ANY KEY TO START");

  updateLB(name, snake.score);
  leaderboardEl.textContent = lbText();

  await waitForAnyKey();
  hideOverlay();

  return snake.score;
}

function showResults(p1, p2) {
  phase = "results";
  const s1 = getPlayerScore(p1);
  const s2 = getPlayerScore(p2);

  const result =
    s1 > s2 ? `${p1} wins with ${s1}!`
    : s2 > s1 ? `${p2} wins with ${s2}!`
    : `It's a tie! Both scored ${s1}.`;

  showOverlay(`${result}\n\n${lbText()}\n\nPRESS ANY KEY TO START`);

  waitForAnyKey().then(() => {
    hideOverlay();
    resetAll();
  });
}

async function runGame() {
  if (gameRunning) return;
  gameRunning = true;

  const p1 = (prompt("Enter name for Player 1:", "Player 1") || "Player 1").trim() || "Player 1";
  const p2 = (prompt("Enter name for Player 2:", "Player 2") || "Player 2").trim() || "Player 2";
  names = [p1, p2];

  await runTurn(p1, true);
  await runTurn(p2, false);

  showResults(p1, p2);

  gameRunning = false;
}

// Controls: Arrow keys only (like your WPF Window_KeyDown)
window.addEventListener("keydown", (e) => {
  if (!gameRunning && phase === "idle") {
    runGame();
    return;
  }

  if (!snake || phase !== "playing") return;

  if (e.key === "ArrowLeft") snake.changeDirection(Direction.Left);
  if (e.key === "ArrowRight") snake.changeDirection(Direction.Right);
  if (e.key === "ArrowUp") snake.changeDirection(Direction.Up);
  if (e.key === "ArrowDown") snake.changeDirection(Direction.Down);
});

restartBtn.addEventListener("click", () => resetAll());

// init
leaderboardEl.textContent = lbText();
resetAll();