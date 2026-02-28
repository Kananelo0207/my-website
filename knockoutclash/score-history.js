const KC_HISTORY_KEY = "kc_score_history";

function kcLoadHistory() {
  try { return JSON.parse(localStorage.getItem(KC_HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function kcSaveHistory(list) {
  localStorage.setItem(KC_HISTORY_KEY, JSON.stringify(list.slice(-50)));
}

function kcAddHistory(entry) {
  const list = kcLoadHistory();
  list.push({ ...entry, time: new Date().toISOString() });
  kcSaveHistory(list);
}

function kcTryAutoLog() {
  // Try to find something that looks like a log container
  const log = document.querySelector("#log, .log, [data-log], ul, div");
  if (!log) return;

  const obs = new MutationObserver(() => {
    const text = log.innerText || "";
    // You can tweak these keywords to match your log messages
    if (text.includes("wins") || text.includes("Winner") || text.includes("Draw")) {
      kcAddHistory({ snapshot: text.slice(-220) });
    }
  });

  obs.observe(log, { childList: true, subtree: true, characterData: true });
}

window.addEventListener("load", () => {
  kcTryAutoLog();
});