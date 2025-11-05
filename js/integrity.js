// ---------------------------------------------------------
// integrity.js — Integrity Self-Check Module
// ---------------------------------------------------------

function runIntegritySelfCheck(rawText, parsedTransactions) {
  const statusEl = document.getElementById("integrityStatus");
  if (!statusEl) return { passed: true, counts: { detected: 0, parsed: 0 } };

  // Count how many currency amounts appear in the raw text
  const moneyPattern = /(?:S\/|USD|US\$|\$|€|¥)\s*[+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/gi;
  const matches = rawText.match(moneyPattern);
  const detectedCount = matches ? matches.length : 0;

  // Compare with parsed transactions count
  const parsedCount = parsedTransactions.length;
  const difference = detectedCount - parsedCount;

  let message = "";
  let passed = true;

  if (detectedCount === 0 && parsedCount === 0) {
    message = "⚪ No monetary amounts detected — nothing to check.";
  } else if (difference === 0) {
    message = `✅ Integrity check passed — ${parsedCount} transactions parsed (all amounts matched).`;
  } else if (difference > 0) {
    passed = false;
    message = `⚠️ Integrity check warning — Detected ${detectedCount} amounts, but only ${parsedCount} transactions were parsed. Missing ${difference}.`;
  } else {
    // theoretically should not happen, but just in case
    passed = false;
    message = `⚠️ Integrity mismatch — Parsed more transactions (${parsedCount}) than detected amounts (${detectedCount}).`;
  }

  statusEl.textContent = message;
  statusEl.style.color = passed ? "#007b00" : "#b30000";

  return { passed, counts: { detected: detectedCount, parsed: parsedCount } };
}