// ---------------------------------------------------------
// debug.js — Developer / diagnostic visibility tools
// ---------------------------------------------------------

let debugPanelVisible = false;

/**
 * Toggle the debug panel visibility
 */
function toggleDebugPanel() {
  debugPanelVisible = !debugPanelVisible;
  const panel = document.getElementById("debugPanel");
  if (!panel) return;
  panel.style.display = debugPanelVisible ? "block" : "none";

  if (debugPanelVisible) {
    // refresh contents if available
    updateDebugPanel();
  }
}

/**
 * Update the debug panel with the latest run details
 * @param {string} rawText - The raw pasted text
 * @param {Array} parsedTransactions - Array of parsed transaction objects
 */
function updateDebugPanel(rawText = "", parsedTransactions = []) {
  const panel = document.getElementById("debugPanel");
  if (!panel || !debugPanelVisible) return;

  const rawLen = rawText ? rawText.length : 0;
  const txCount = parsedTransactions ? parsedTransactions.length : 0;

  let html = `<strong>Debug Panel</strong><br>
  <div><em>Raw text length:</em> ${rawLen} characters</div>
  <div><em>Parsed transactions:</em> ${txCount}</div>`;

  if (txCount) {
    html += `<div style="margin-top:6px;"><em>Sample transactions:</em></div>
    <pre style="background:#fff;border:1px solid #ddd;padding:6px;max-height:150px;overflow:auto;">
${JSON.stringify(parsedTransactions.slice(0, 3), null, 2)}
    </pre>`;
  }

  if (rawText && rawText.length < 4000) {
    html += `<div style="margin-top:6px;"><em>Raw text sample:</em></div>
    <pre style="background:#fff;border:1px solid #ddd;padding:6px;max-height:150px;overflow:auto;">
${rawText.slice(0, 1000)}
    </pre>`;
  } else if (rawText) {
    html += `<div style="margin-top:6px;color:#777;">(Raw text too long to display)</div>`;
  }

  panel.innerHTML = html;
}