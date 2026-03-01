(() => {
  // =========================
  // Word Banks (with hints)
  // =========================
  const BANK = {
    media: [
      { w: "one piece", h: "Pirate-themed anime with Luffy." },
      { w: "attack on titan", h: "Anime with giant Titans." },
      { w: "death note", h: "Notebook that can kill." },
      { w: "breaking bad", h: "Chemistry teacher becomes a drug kingpin." },
      { w: "stranger things", h: "Kids face supernatural in Hawkins." },
      { w: "the dark knight", h: "Batman faces the Joker." },
      { w: "inception", h: "Dreams within dreams." },
      { w: "toy story", h: "Pixar’s talking toys." },
    ],
    tech: [
      { w: "playstation", h: "A popular Sony gaming console." },
      { w: "nintendo", h: "Gaming giant known for Mario." },
      { w: "discord", h: "Gaming-focused chat platform." },
      { w: "motherboard", h: "Main circuit board of a computer." },
      { w: "bluetooth", h: "Short-range wireless technology." },
      { w: "windows", h: "Microsoft’s operating system." },
      { w: "linux", h: "Open-source operating system." },
    ],
    biblical: [
      { w: "genesis", h: "The first book of the Bible." },
      { w: "exodus", h: "Moses leads Israel out of Egypt." },
      { w: "good samaritan", h: "Parable about loving your neighbor." },
      { w: "water into wine", h: "Jesus’ first miracle at Cana." },
      { w: "resurrection", h: "Jesus rose from the dead." },
    ],
  };

  // =========================
  // Elements
  // =========================
  const modeSel = document.getElementById("mode");
  const diffSel = document.getElementById("difficulty");
  const catSel  = document.getElementById("category");

  const newGameBtn = document.getElementById("newGameBtn");
  const resetHistoryBtn = document.getElementById("resetHistoryBtn");

  const hintBtn = document.getElementById("hintBtn");
  const hintEl = document.getElementById("hint");

  const p1Label = document.getElementById("p1Label");
  const p2Label = document.getElementById("p2Label");
  const p1ScoreEl = document.getElementById("p1Score");
  const p2ScoreEl = document.getElementById("p2Score");
  const livesEl = document.getElementById("lives");

  const statusEl = document.getElementById("status");
  const wordEl = document.getElementById("word");
  const usedEl = document.getElementById("usedLetters");
  const logEl = document.getElementById("log");

  const guessInput = document.getElementById("guessInput");
  const guessBtn = document.getElementById("guessBtn");
  const skipBtn = document.getElementById("skipBtn");

  const canvas = document.getElementById("hangCanvas");
  const ctx = canvas.getContext("2d");

  const flash = document.getElementById("flash");
  const historyEl = document.getElementById("history");

  // =========================
  // State
  // =========================
  const DIFF_LIVES = { easy: 10, normal: 8, hard: 6 };

  let mode = "pvp"; // pvp | cpu
  let maxLives = 8;
  let lives = 8;

  let p1 = { name: "Player 1", score: 0 };
  let p2 = { name: "Player 2", score: 0 };

  let turn = 1; // 1 or 2
  let secret = "";
  let hint = "";
  let used = []; // letters guessed (can repeat in your new rule, but we still show used history)
  let revealed = []; // array of booleans per char in secret (true = revealed)
  let gameOver = false;

  // “one letter at a time” rule:
  // - if secret has letter multiple times
  // - a correct guess reveals ONLY ONE position per guess
  // - you can guess the same letter again to reveal the next occurrence
  function revealOne(letter){
    letter = letter.toLowerCase();
    // find first unrevealed matching position
    for (let i = 0; i < secret.length; i++){
      if (!revealed[i] && secret[i] === letter){
        revealed[i] = true;
        return true; // revealed one
      }
    }
    return false; // no more of that letter left hidden
  }

  function wordSolved(){
    for (let i = 0; i < secret.length; i++){
      if (secret[i] === " ") continue;
      if (!revealed[i]) return false;
    }
    return true;
  }

  function currentMasked(){
    let out = "";
    for (let i = 0; i < secret.length; i++){
      const ch = secret[i];
      if (ch === " ") out += "   ";
      else out += (revealed[i] ? ch.toUpperCase() : "_") + " ";
    }
    return out.trimEnd();
  }

  function setStatus(s){ statusEl.textContent = `Status: ${s}`; }

  function flashFX(type){
    flash.classList.remove("good","bad");
    flash.classList.add(type === "good" ? "good" : "bad");
    setTimeout(() => flash.classList.remove("good","bad"), 180);
  }

  function setHUD(){
    p1Label.textContent = p1.name;
    p2Label.textContent = mode === "cpu" ? "CPU" : p2.name;

    p1ScoreEl.textContent = String(p1.score);
    p2ScoreEl.textContent = String(p2.score);

    livesEl.textContent = String(lives);

    wordEl.textContent = currentMasked();
    usedEl.textContent = used.length ? used.join(" ") : "—";
  }

  // =========================
  // Canvas Hangman (nicer)
  // =========================
  function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function drawBase(){
    // soft grid glow background
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#ffffff";
    for (let x=0; x<canvas.width; x+=24){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
    }
    for (let y=0; y<canvas.height; y+=24){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
    }
    ctx.restore();

    // gallows
    ctx.save();
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.beginPath(); ctx.moveTo(90,320); ctx.lineTo(270,320); ctx.stroke();      // base
    ctx.beginPath(); ctx.moveTo(140,320); ctx.lineTo(140,70); ctx.stroke();      // pole
    ctx.beginPath(); ctx.moveTo(140,70);  ctx.lineTo(320,70); ctx.stroke();      // top
    ctx.beginPath(); ctx.moveTo(320,70);  ctx.lineTo(320,110); ctx.stroke();     // rope
    ctx.restore();
  }

  function drawHangmanParts(wrong){
    // wrong goes 0..(maxLives - lives)
    // scale parts count based on difficulty lives:
    // We'll map wrong guesses into 6 classic parts:
    const parts = 6;
    const progress = Math.min(parts, Math.round((wrong / maxLives) * parts));

    ctx.save();
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,.78)";

    // head
    if (progress >= 1){
      ctx.beginPath();
      ctx.arc(320,145,32,0,Math.PI*2);
      ctx.stroke();
    }
    // body
    if (progress >= 2){
      ctx.beginPath(); ctx.moveTo(320,178); ctx.lineTo(320,255); ctx.stroke();
    }
    // left arm
    if (progress >= 3){
      ctx.beginPath(); ctx.moveTo(320,200); ctx.lineTo(285,228); ctx.stroke();
    }
    // right arm
    if (progress >= 4){
      ctx.beginPath(); ctx.moveTo(320,200); ctx.lineTo(355,228); ctx.stroke();
    }
    // left leg
    if (progress >= 5){
      ctx.beginPath(); ctx.moveTo(320,255); ctx.lineTo(290,300); ctx.stroke();
    }
    // right leg
    if (progress >= 6){
      ctx.beginPath(); ctx.moveTo(320,255); ctx.lineTo(350,300); ctx.stroke();
    }

    ctx.restore();
  }

  function redrawCanvas(){
    clearCanvas();
    drawBase();
    const wrong = maxLives - lives;
    drawHangmanParts(wrong);
  }

  // =========================
  // History (localStorage)
  // =========================
  const HISTORY_KEY = "hangman_history_v1";

  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  }
  function saveHistory(items){
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
  }
  function addHistory(result){
    const items = loadHistory();
    items.unshift(result);
    saveHistory(items);
    renderHistory();
  }
  function renderHistory(){
    const items = loadHistory();
    historyEl.innerHTML = items.length ? "" : `<div class="history-item">No matches yet.</div>`;
    for (const it of items){
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
        <div><strong>${it.winner}</strong> won • <span class="small">${it.mode} • ${it.diff} • ${it.category}</span></div>
        <div class="small">Word: <span style="opacity:.9">${it.word}</span> • Score: ${it.p1} - ${it.p2}</div>
      `;
      historyEl.appendChild(div);
    }
  }

  // =========================
  // New Game / Setup
  // =========================
  function pickWord(category){
    const arr = BANK[category] || BANK.media;
    const pick = arr[Math.floor(Math.random() * arr.length)];
    return { word: pick.w.toLowerCase(), hint: pick.h };
  }

  function promptNames(){
    const name1 = (prompt("Enter Player 1 name:", p1.name) || "").trim() || "Player 1";
    p1.name = name1;

    if (modeSel.value === "cpu"){
      p2.name = "CPU";
      return;
    }
    const name2 = (prompt("Enter Player 2 name:", p2.name) || "").trim() || "Player 2";
    p2.name = name2;
  }

  function startNewGame(){
    mode = modeSel.value;
    maxLives = DIFF_LIVES[diffSel.value] ?? 8;
    lives = maxLives;

    // scores reset per match
    p1.score = 0;
    p2.score = 0;

    turn = 1;
    used = [];
    gameOver = false;

    hintEl.hidden = true;
    hintEl.textContent = "";

    const { word, hint: h } = pickWord(catSel.value);
    secret = word;
    hint = h;

    revealed = new Array(secret.length).fill(false);
    // reveal spaces automatically
    for (let i=0; i<secret.length; i++){
      if (secret[i] === " ") revealed[i] = true;
    }

    logEl.textContent = "Battle log will appear here…";
    setStatus(`${p1.name}'s turn — guess a letter`);
    setHUD();
    redrawCanvas();

    // focus input
    guessInput.value = "";
    guessInput.focus();

    // prompt names after selecting mode
    promptNames();
    setHUD();
    setStatus(`${p1.name}'s turn — guess a letter`);
  }

  // =========================
  // Turn handling + scoring
  // =========================
  function currentPlayer(){
    if (turn === 1) return p1;
    return p2;
  }

  function otherPlayer(){
    if (turn === 1) return p2;
    return p1;
  }

  function switchTurn(){
    if (mode === "cpu"){
      turn = 1; // always back to player after CPU finishes
      return;
    }
    turn = (turn === 1 ? 2 : 1);
  }

  function endGame(winnerName){
    gameOver = true;
    setStatus(`Game Over — Winner: ${winnerName}`);
    addHistory({
      winner: winnerName,
      mode: mode === "cpu" ? "PvCPU" : "PvP",
      diff: diffSel.value,
      category: catSel.value,
      word: secret,
      p1: p1.score,
      p2: p2.score
    });
  }

  function scoreCorrect(pl){
    pl.score += 10;
  }
  function scoreWrong(pl){
    pl.score -= 2;
  }
  function scoreWinWord(pl){
    pl.score += 50;
  }

  // =========================
  // CPU move (simple)
  // =========================
  const FREQ = "etaoinshrdlcumwfgypbvkjxqz".split("");

  function cpuGuess(){
    // choose letter not over-used recently (we still allow repeating to reveal multiple occurrences,
    // but CPU should not spam the same if none left)
    const available = FREQ.filter(ch => true);

    // HARD: tries to pick an actually-revealable letter sometimes
    if (diffSel.value === "hard"){
      const candidates = [];
      for (const ch of FREQ){
        if (secret.includes(ch)){
          // still has hidden occurrence?
          if (revealWouldWork(ch)) candidates.push(ch);
        }
      }
      if (candidates.length && Math.random() < 0.75){
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // NORMAL: frequency-based random
    if (diffSel.value === "normal"){
      return available[Math.floor(Math.random() * Math.min(10, available.length))];
    }

    // EASY: pure random a-z
    const a = "abcdefghijklmnopqrstuvwxyz";
    return a[Math.floor(Math.random()*a.length)];
  }

  function revealWouldWork(letter){
    letter = letter.toLowerCase();
    for (let i = 0; i < secret.length; i++){
      if (!revealed[i] && secret[i] === letter) return true;
    }
    return false;
  }

  // =========================
  // Main guess logic
  // =========================
  function applyGuess(letter, byCPU = false){
    if (gameOver) return;

    letter = (letter || "").toLowerCase();
    if (!/^[a-z]$/.test(letter)){
      if (!byCPU) setStatus("Type ONE letter (A-Z) فقط");
      return;
    }

    const pl = currentPlayer();

    // record used (we still allow re-guessing same letter, because your rule needs it)
    used.push(letter.toUpperCase());

    // Try reveal ONE occurrence
    const revealedOne = revealOne(letter);

    if (revealedOne){
      flashFX("good");
      scoreCorrect(pl);
      logEl.textContent =
        `${pl.name} guessed: ${letter.toUpperCase()} ✅\n` +
        `Revealed ONE letter.\n\n` +
        logEl.textContent;

      setStatus(`${pl.name} got it! (+10)`);
    } else {
      flashFX("bad");
      scoreWrong(pl);
      lives -= 1;

      logEl.textContent =
        `${pl.name} guessed: ${letter.toUpperCase()} ❌\n` +
        `No hidden '${letter.toUpperCase()}' left (or not in word).\n` +
        `Lives -1\n\n` +
        logEl.textContent;

      setStatus(`${pl.name} missed. (-2) Turn passes`);
    }

    setHUD();
    redrawCanvas();

    // Win condition
    if (wordSolved()){
      scoreWinWord(pl);
      setHUD();
      setStatus(`${pl.name} completed the word! (+50)`);
      logEl.textContent = `🏁 WORD COMPLETE!\nWinner: ${pl.name}\nWord: ${secret}\n\n` + logEl.textContent;
      endGame(pl.name);
      return;
    }

    // Lose condition
    if (lives <= 0){
      const winner = (p1.score === p2.score)
        ? "Draw"
        : (p1.score > p2.score ? p1.name : (mode === "cpu" ? "CPU" : p2.name));

      setStatus(`Out of lives! Word was: ${secret}`);
      logEl.textContent = `💀 OUT OF LIVES!\nWord: ${secret}\nWinner (by score): ${winner}\n\n` + logEl.textContent;
      endGame(winner);
      return;
    }

    // Turn switch logic:
    // PvP: always switch after each guess (like your C# Game loop)
    // CPU: after player guess, CPU plays automatically
    if (mode === "cpu"){
      // player just played:
      if (!byCPU){
        // CPU turn
        turn = 2;
        setHUD();
        setStatus("CPU is thinking…");
        setTimeout(() => {
          const cpuLetter = cpuGuess();
          applyGuess(cpuLetter, true);
          // back to player
          turn = 1;
          setHUD();
          if (!gameOver) setStatus(`${p1.name}'s turn — guess a letter`);
        }, 450);
      }
      return;
    }

    // PvP
    switchTurn();
    setHUD();
    if (!gameOver) setStatus(`${currentPlayer().name}'s turn — guess a letter`);
  }

  function skipTurn(){
    if (gameOver) return;

    if (mode === "cpu"){
      setStatus("Skipping is disabled in CPU mode (player only).");
      return;
    }
    switchTurn();
    setHUD();
    setStatus(`${currentPlayer().name}'s turn — guess a letter`);
    logEl.textContent = `⏭ Turn skipped. Now: ${currentPlayer().name}\n\n` + logEl.textContent;
  }

  // =========================
  // Hint button
  // =========================
  function showHint(){
    if (gameOver) return;
    const pl = currentPlayer();
    pl.score -= 3;
    hintEl.hidden = false;
    hintEl.textContent = `HINT: ${hint}`;
    setHUD();
    setStatus(`${pl.name} used a hint (-3)`);
  }

  // =========================
  // Glow
  // =========================
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty("--mx", `${x}%`);
    document.documentElement.style.setProperty("--my", `${y}%`);
  }, { passive: true });

  // =========================
  // Events
  // =========================
  newGameBtn.addEventListener("click", startNewGame);
  hintBtn.addEventListener("click", showHint);
  resetHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });

  modeSel.addEventListener("change", () => {
    mode = modeSel.value;
    // keep labels nice
    if (mode === "cpu") p2.name = "CPU";
    setHUD();
  });

  guessBtn.addEventListener("click", () => {
    const v = guessInput.value.trim();
    guessInput.value = "";
    guessInput.focus();
    applyGuess(v);
  });

  guessInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){
      e.preventDefault();
      guessBtn.click();
    }
  });

  skipBtn.addEventListener("click", skipTurn);

  // Init
  renderHistory();
  redrawCanvas();
  setHUD();
})();