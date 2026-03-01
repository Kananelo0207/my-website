function play(playerMove) {
  const moves = ["rock", "paper", "scissors", "water", "fire"];
  const cpuMove = moves[Math.floor(Math.random() * moves.length)];

  let result = "";

  if (playerMove === cpuMove) {
    result = "It's a draw!";
  } else {
    result = `${playerMove.toUpperCase()} vs ${cpuMove.toUpperCase()} — You fight!`;
  }

  document.getElementById("result").innerText = result;
}