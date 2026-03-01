(() => {
  // ----- Elements
  const modeSel = document.getElementById("mode");
  const cpuSel = document.getElementById("cpu");
  const cpuField = document.getElementById("cpuField");
  const winToSel = document.getElementById("winTo");

  const resetBtn = document.getElementById("resetBtn");
  const fightBtn = document.getElementById("fightBtn");

  const pScoreEl = document.getElementById("pScore");
  const cScoreEl = document.getElementById("cScore");
  const roundsEl = document.getElementById("rounds");

  const statusEl = document.getElementById("status");
  const logEl = document.getElementById("log");
  const tipEl = document.getElementById("tip");

  const youPickEl = document.getElementById("youPick");
  const cpuPickEl = document.getElementById("cpuPick");

  const leftLabel = document.getElementById("leftLabel");
  const rightLabel = document.getElementById("rightLabel");

  const p1Name = document.getElementById("p1Name");
  const p2Name = document.getElementById("p2Name");

  const moveButtons = [...document.querySelectorAll("[data-move]")];

  // ----- Rules (RPS + Water + Fire)
  // Each move BEATS these moves:
  const beats = {
    rock: ["scissors", "fire"],
    paper: ["rock", "water"],
    scissors: ["paper", "water"],
    water: ["rock", "fire"],
    fire: ["paper", "scissors"],
  };

  // ----- State
  let mode = "cpu"; // "cpu" | "pvp"
  let cpuDifficulty = "normal";
  let winTo = 5;

  let pScore = 0;
  let cScore = 0;
  let rounds = 0;

  let p1Pick = null;
  let p2Pick = null;

  let pvpTurn = 1;
  let lastMoves = [];

  // ✅ Names (stored here so UI never overwrites them)
  let player1Name = "Player";
  let player2Name = "CPU";

  // ----- Helpers
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function setStatus(text, fx = "") {
    statusEl.textContent = `Status: ${text}`;
    statusEl.classList.remove("pulse", "shake");
    if (fx) statusEl.classList.add(fx);
  }

  function setLog(text, fx = "") {
    logEl.firstChild.textContent = text; // keeps tip div intact
    logEl.classList.remove("pulse", "shake");
    if (fx) logEl.classList.add(fx);
  }

  function updateHUD() {
    pScoreEl.textContent = String(pScore);
    cScoreEl.textContent = String(cScore);
    roundsEl.textContent = String(rounds);
  }

  function clearSelectedButtons() {
    moveButtons.forEach((b) => b.classList.remove("selected"));
  }

  // ✅ Apply stored names to UI
  function applyNamesToUI() {
    if (mode === "cpu") {
      leftLabel.textContent = player1Name;
      rightLabel.textContent = "CPU";
      p1Name.textContent = player1Name;
      p2Name.textContent = "CPU";
      return;
    }

    leftLabel.textContent = player1Name;
    rightLabel.textContent = player2Name;
    p1Name.textContent = player1Name;
    p2Name.textContent = player2Name;
  }

  function setPickUI() {
    applyNamesToUI();

    if (mode === "cpu") {
      youPickEl.textContent = p1Pick ? cap(p1Pick) : "—";
      cpuPickEl.textContent = p2Pick ? cap(p2Pick) : "—";
      return;
    }

    // PvP Mode: hide entries before fight
    if (!p2Pick) {
      youPickEl.textContent = p1Pick ? "✓ Locked" : "—";
      cpuPickEl.textContent = "—";
    } else {
      youPickEl.textContent = cap(p1Pick);
      cpuPickEl.textContent = cap(p2Pick);
    }
  }

  function setModeUI() {
    mode = modeSel.value;

    cpuField.style.display = mode === "cpu" ? "" : "none";
    tipEl.style.display = mode === "pvp" ? "" : "none";

    // reset picks & turns
    p1Pick = null;
    p2Pick = null;
    pvpTurn = 1;

    fightBtn.disabled = true;
    clearSelectedButtons();
    setPickUI();

    setStatus(
      mode === "cpu"
        ? `${player1Name}: choose your move`
        : `${player1Name}: choose your move`,
      "pulse"
    );
  }

  function setWinToUI() {
    winTo = Number(winToSel.value) || 5;
    setLog(`Battle results will appear here…`, "pulse");
  }

  function resetMatch() {
    pScore = 0;
    cScore = 0;
    rounds = 0;
    p1Pick = null;
    p2Pick = null;
    pvpTurn = 1;
    lastMoves = [];

    clearSelectedButtons();
    updateHUD();
    setPickUI();

    fightBtn.disabled = true;
    setStatus(
      mode === "cpu"
        ? `${player1Name}: choose your move`
        : `${player1Name}: choose your move`,
      "pulse"
    );
    setLog("Battle results will appear here…", "pulse");
  }

  // ----- CPU picking
  function cpuPickMove() {
    const moves = Object.keys(beats);

    if (cpuDifficulty === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const recent = lastMoves.slice(-3);
    if (recent.length === 0) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const freq = new Map();
    for (const m of recent) freq.set(m, (freq.get(m) || 0) + 1);

    let predicted = recent[recent.length - 1];
    let bestCount = -1;
    for (const [m, c] of freq.entries()) {
      if (c > bestCount) {
        bestCount = c;
        predicted = m;
      }
    }

    const counters = moves.filter((m) => beats[m].includes(predicted));

    if (cpuDifficulty === "normal") {
      if (Math.random() < 0.65 && counters.length) {
        return counters[Math.floor(Math.random() * counters.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (Math.random() < 0.85 && counters.length) {
      return counters[Math.floor(Math.random() * counters.length)];
    }

    const last = recent[recent.length - 1];
    const countersLast = moves.filter((m) => beats[m].includes(last));
    if (countersLast.length) return countersLast[Math.floor(Math.random() * countersLast.length)];

    return moves[Math.floor(Math.random() * moves.length)];
  }

  // ----- Battle resolution
  function resolve(p1, p2) {
    if (p1 === p2) return "draw";
    if (beats[p1].includes(p2)) return "p1";
    return "p2";
  }

  function doFight() {
    if (!p1Pick) {
      setStatus("Pick a move first", "shake");
      return;
    }

    if (mode === "pvp") {
      if (!p2Pick) {
        setStatus(`${player2Name} must pick a move`, "shake");
        return;
      }
    } else {
      p2Pick = cpuPickMove();
    }

    rounds += 1;
    updateHUD();
    setPickUI();

    const winner = resolve(p1Pick, p2Pick);

    if (winner === "draw") {
      setStatus("Draw!", "pulse");
      setLog(
        `${player1Name}: ${cap(p1Pick)}\n${mode === "cpu" ? "CPU" : player2Name}: ${cap(
          p2Pick
        )}\n\nResult: Draw.`,
        "pulse"
      );
    } else if (winner === "p1") {
      pScore += 1;
      updateHUD();
      setStatus(`${player1Name} wins the round!`, "pulse");
      setLog(
        `${player1Name}: ${cap(p1Pick)}\n${mode === "cpu" ? "CPU" : player2Name}: ${cap(
          p2Pick
        )}\n\nResult: ${player1Name} wins.`,
        "pulse"
      );
    } else {
      cScore += 1;
      updateHUD();
      const p2Display = mode === "cpu" ? "CPU" : player2Name;
      setStatus(`${p2Display} wins the round!`, "shake");
      setLog(
        `${player1Name}: ${cap(p1Pick)}\n${p2Display}: ${cap(p2Pick)}\n\nResult: ${p2Display} wins.`,
        "shake"
      );
    }

    // match win check
    if (pScore >= winTo || cScore >= winTo) {
      const champ =
        pScore >= winTo ? player1Name : mode === "cpu" ? "CPU" : player2Name;

      setStatus(`${champ} wins the MATCH!`, "pulse");
      setLog(
        `🏁 Match over!\nWinner: ${champ}\nFinal: ${pScore} - ${cScore}\n\nPress Reset to play again.`,
        "pulse"
      );
      fightBtn.disabled = true;
      return;
    }

    // reset round picks
    p1Pick = null;
    p2Pick = null;
    pvpTurn = 1;
    clearSelectedButtons();
    setPickUI();

    fightBtn.disabled = true;
    setStatus(
      mode === "cpu"
        ? `${player1Name}: choose your move`
        : `${player1Name}: choose your move`,
      "pulse"
    );
  }

  // ----- Move selection
  function handleMoveClick(move, btn) {
    clearSelectedButtons();
    btn.classList.add("selected");

    if (mode === "cpu") {
      p1Pick = move;
      lastMoves.push(move);
      p2Pick = null;
      setPickUI();
      fightBtn.disabled = false;
      setStatus("Ready. Press Fight!", "pulse");
      return;
    }

    // PvP flow:
    if (pvpTurn === 1) {
      p1Pick = move;
      p2Pick = null;
      pvpTurn = 2;
      setPickUI();
      fightBtn.disabled = true;
      setStatus(`${player2Name}: choose your move`, "pulse");
      return;
    }

    // player 2 turn
    p2Pick = move;
    pvpTurn = 1;
    setPickUI();
    fightBtn.disabled = false;
    setStatus("Ready. Press Fight!", "pulse");
  }

  // ----- Mouse glow
  window.addEventListener(
    "mousemove",
    (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--mx", `${x}%`);
      document.documentElement.style.setProperty("--my", `${y}%`);
    },
    { passive: true }
  );

  // ✅ Name prompt (runs once on load + when mode changes)
  function promptForNames() {
    let name1 = prompt("Enter Player 1 name:", player1Name || "Player 1");
    if (!name1 || !name1.trim()) name1 = "Player 1";
    player1Name = name1.trim();

    if (mode === "cpu") {
      player2Name = "CPU";
    } else {
      let name2 = prompt("Enter Player 2 name:", player2Name || "Player 2");
      if (!name2 || !name2.trim()) name2 = "Player 2";
      player2Name = name2.trim();
    }

    setPickUI(); // refresh labels
    setStatus(
      mode === "cpu"
        ? `${player1Name}: choose your move`
        : `${player1Name}: choose your move`,
      "pulse"
    );
  }

  // ----- Wire up events
  modeSel.addEventListener("change", () => {
    setModeUI();
    promptForNames();
  });

  cpuSel.addEventListener("change", () => {
    cpuDifficulty = cpuSel.value;
    setStatus("CPU updated", "pulse");
  });

  winToSel.addEventListener("change", () => {
    setWinToUI();
  });

  resetBtn.addEventListener("click", resetMatch);
  fightBtn.addEventListener("click", doFight);

  moveButtons.forEach((btn) => {
    btn.addEventListener("click", () => handleMoveClick(btn.dataset.move, btn));
  });

  // ----- Init
  cpuDifficulty = cpuSel.value;
  setModeUI();
  promptForNames();
  setWinToUI();
  updateHUD();
})();