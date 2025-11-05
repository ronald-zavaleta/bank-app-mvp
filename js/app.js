// ---------------------------------------------------------
// app.js — Main orchestrator and navigation controller
// ---------------------------------------------------------

/**
 * Show the requested view (accounts, transactions, settings)
 * and update the active nav tab style.
 */
function showView(view) {
  const views = ["accounts", "transactions", "settings"];
  views.forEach(v => {
    const tab = document.getElementById(`tab${capitalize(v)}`);
    const viewDiv = document.getElementById(`${v}View`);
    if (!tab || !viewDiv) return;

    if (v === view) {
      tab.classList.add("active");
      viewDiv.style.display = "block";
    } else {
      tab.classList.remove("active");
      viewDiv.style.display = "none";
    }
  });

  // Refresh content when switching views
  if (view === "accounts") {
    renderAccountsTables();
  } else if (view === "transactions") {
    renderAccountsTables();
    updateSelectedAccountInfo();
    renderStoredTransactionsForActiveAccount();
  } else if (view === "settings") {
    renderAccountsTables();
    populateSettingsForm();
  }
}

/**
 * Helper to capitalize a string (used for tab ids)
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Initialize app once everything is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ App initialized");
  renderAccountsTables();
  updateSelectedAccountInfo();
  renderStoredTransactionsForActiveAccount();
  populateSettingsForm();
});