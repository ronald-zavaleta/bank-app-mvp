// ---------------------------------------------------------
// transactions.js — Parse, validate, and manage transactions
// ---------------------------------------------------------

let parsedBatchData = [];
let sessionDuplicates = [];

// ---------- Currency Normalization ----------
function normalizeCurrency(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/\./g, '');

  if (s.includes('s/')) return 'PEN';
  if (s === 'pen' || s.includes('sol')) return 'PEN';

  if (s.includes('usd') || s.includes('us$')) return 'USD';
  if (s === '$' || s.includes('dollar')) return 'USD';

  if (s.includes('eur') || s.includes('euro') || s.includes('€')) return 'EUR';
  if (s.includes('jpy') || s.includes('yen') || s.includes('¥')) return 'JPY';

  return raw.toString().trim().toUpperCase();
}

// ---------- Date Normalization ----------
function normalizeDateTime(raw) {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 4) return null;

  const dayStr = parts[1];
  const monthStr = parts[2].toLowerCase();
  const timeStr = parts[3];

  const day = parseInt(dayStr, 10);
  const monthMap = {
    'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
  };
  const month = monthMap[monthStr];
  if (!day || !month) return null;

  const year = (new Date()).getFullYear();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  return `${year}-${mm}-${dd}T${timeStr}:00`;
}

// ---------- Status Indicator ----------
function updateSaveStatus(success, message) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  if (!message) {
    el.textContent = '';
    return;
  }
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  if (success) {
    el.textContent = `🟢 ${message} (${timeStr})`;
  } else {
    el.textContent = `⚠️ ${message}`;
  }
}

// ---------- Duplicate Section Helpers ----------
function resetDuplicatesSection() {
  sessionDuplicates = [];
  const section = document.getElementById('duplicatesSection');
  const tableDiv = document.getElementById('duplicatesTable');
  const btn = document.getElementById('downloadDuplicatesBtn');
  if (section) section.style.display = 'none';
  if (tableDiv) tableDiv.innerHTML = '';
  if (btn) btn.style.display = 'none';
}

function renderDuplicatesSection() {
  const section = document.getElementById('duplicatesSection');
  const tableDiv = document.getElementById('duplicatesTable');
  const btn = document.getElementById('downloadDuplicatesBtn');
  if (!section || !tableDiv || !btn) return;

  if (!sessionDuplicates.length) {
    section.style.display = 'none';
    tableDiv.innerHTML = '';
    btn.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  btn.style.display = 'inline-block';

  let html = "<table><tr><th>#</th><th>UUID</th><th>Descripción</th><th>Fecha / Hora</th><th>Monto</th><th>Currency</th></tr>";
  sessionDuplicates.forEach((t, idx) => {
    const dateStr = t.fecha_hora_raw || t.fecha_hora || '';
    const amountStr = typeof t.monto === 'number' ? t.monto.toFixed(2) : '';
    const color = t.monto < 0 ? 'red' : 'green';
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${t.uuid || ''}</td>
      <td>${t.descripcion || ''}</td>
      <td>${dateStr}</td>
      <td style="color:${color}">${amountStr}</td>
      <td>${t.currency || ''}</td>
    </tr>`;
  });
  html += "</table>";
  tableDiv.innerHTML = html;
}

// ---------- Parsing Core ----------
function parseText() {
  resetDuplicatesSection();

  const text = document.getElementById('inputText').value;
  const outputSummary = document.getElementById('outputSummary');
  const integrityStatus = document.getElementById('integrityStatus');
  if (integrityStatus) integrityStatus.textContent = '';

  if (!activeAccountId) {
    alert('Please select a bank account first.');
    updateSaveStatus(false, 'No bank account selected.');
    return;
  }

  const account = accounts.find(a => a.id === activeAccountId);
  if (!account) {
    alert('Selected account not found.');
    updateSaveStatus(false, 'Selected account not found.');
    return;
  }

  if (!text.trim()) {
    alert('Please paste some transaction text first.');
    updateSaveStatus(false, 'No text to parse.');
    return;
  }

  const accountNormCurrency = normalizeCurrency(account.currency || '');
  if (!accountNormCurrency) {
    alert('Account currency missing or invalid.');
    updateSaveStatus(false, 'Account currency invalid.');
    return;
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result = [];
  let detectedNormCurrency = null;
  let detectedRawCurrency = null;

  const dateRegex = /([\wáéíóúüñÁÉÍÓÚÜÑ]{3,4}\.? \d{1,2} [\wáéíóúüñÁÉÍÓÚÜÑ]{3} \d{2}:\d{2})\s*([A-Za-z$€¥\/\.\s]+)\s*([+-]?[0-9.,-]+)/i;

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    if (
      /cargo\s+realizado\s+por/i.test(line) ||
      /movimientos/i.test(line) ||
      /fecha\s+y\s+hora/i.test(line) ||
      /^monto$/i.test(line)
    ) continue;

    const desc = line;
    const next = lines[i + 1] || "";
    const match = next.match(dateRegex);
    if (match) {
      const fechaRaw = match[1];
      const currencyToken = match[2];
      let montoStr = match[3];

      const txNormCurrency = normalizeCurrency(currencyToken);
      if (!txNormCurrency) {
        alert(`Unrecognized currency "${currencyToken}"`);
        updateSaveStatus(false, 'Unrecognized currency.');
        return;
      }

      if (!detectedNormCurrency) {
        detectedNormCurrency = txNormCurrency;
        detectedRawCurrency = currencyToken;
      } else if (txNormCurrency !== detectedNormCurrency) {
        alert('Multiple currencies detected in same batch.');
        updateSaveStatus(false, 'Currency mismatch in batch.');
        return;
      }

      montoStr = montoStr.replace(/,/g, '');
      montoStr = montoStr.replace(/[^0-9.-]/g, '');
      const monto = parseFloat(montoStr);

      if (!isNaN(monto)) {
        const fechaIso = normalizeDateTime(fechaRaw);
        result.push({
          descripcion: desc,
          fecha_hora: fechaIso,
          fecha_hora_raw: fechaRaw,
          monto: monto,
          currency: txNormCurrency,
          currency_raw: currencyToken
        });
      }
    }
  }

  if (!result.length) {
    outputSummary.textContent = 'No transactions found.';
    document.getElementById('output').innerHTML = '';
    document.getElementById('downloadBatchBtn').style.display = 'none';
    updateSaveStatus(false, 'No transactions parsed.');
    updateDebugPanel(text, []);
    return;
  }

  if (detectedNormCurrency && detectedNormCurrency !== accountNormCurrency) {
    alert(`Currency mismatch: Account is "${account.currency}", data is "${detectedRawCurrency}".`);
    updateSaveStatus(false, 'Currency mismatch.');
    updateDebugPanel(text, result);
    return;
  }

  // Run integrity self-check
  const check = runIntegritySelfCheck(text, result);
  updateDebugPanel(text, result);

  const store = loadTransactionsForAccount(activeAccountId);
  store.account_id = activeAccountId;
  store.currency = accountNormCurrency;
  const existing = store.transactions || [];

  const existingUUIDs = new Set();
  const cleanAccNum = (account.account_number || '').replace(/[^0-9A-Za-z]/g, '');

  existing.forEach(t => {
    if (!t) return;
    let uuid = t.uuid;
    if (!uuid && t.fecha_hora) {
      uuid = cleanAccNum + '_' + t.fecha_hora;
      t.uuid = uuid;
    }
    if (uuid) existingUUIDs.add(uuid);
  });

  const newTransactions = [];
  sessionDuplicates = [];

  result.forEach(rt => {
    const uuid = cleanAccNum + '_' + rt.fecha_hora;
    rt.uuid = uuid;
    if (existingUUIDs.has(uuid)) {
      sessionDuplicates.push(rt);
    } else {
      existingUUIDs.add(uuid);
      newTransactions.push(rt);
    }
  });

  if (!newTransactions.length && !sessionDuplicates.length) {
    outputSummary.textContent = 'No new or duplicate transactions found.';
    document.getElementById('downloadBatchBtn').style.display = 'none';
    updateSaveStatus(false, 'Nothing to save.');
    return;
  }

  store.transactions = existing.concat(newTransactions);
  saveTransactionsObject(activeAccountId, store);
  parsedBatchData = newTransactions;

  const savedCount = newTransactions.length;
  const dupCount = sessionDuplicates.length;

  let summaryMsg = '';
  if (savedCount > 0) summaryMsg += `Parsed ${savedCount} new transaction(s). `;
  if (dupCount > 0) summaryMsg += `${dupCount} duplicate(s) skipped.`;
  if (!summaryMsg) summaryMsg = 'Parsing completed.';

  updateSaveStatus(true, summaryMsg);
  document.getElementById('inputText').value = '';
  renderStoredTransactionsForActiveAccount();
  renderAccountsTables();

  document.getElementById('downloadBatchBtn').style.display =
    savedCount > 0 ? 'inline-block' : 'none';
  renderDuplicatesSection();
}

// ---------- Render Stored Transactions ----------
function renderStoredTransactionsForActiveAccount() {
  const output = document.getElementById('output');
  const outputSummary = document.getElementById('outputSummary');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  if (!output || !outputSummary) return;

  if (!activeAccountId) {
    output.innerHTML = '';
    outputSummary.textContent = 'No account selected.';
    if (downloadAllBtn) downloadAllBtn.style.display = 'none';
    return;
  }

  const store = loadTransactionsForAccount(activeAccountId);
  const transactions = store.transactions || [];

  if (!transactions.length) {
    output.innerHTML = '';
    outputSummary.textContent = 'No stored transactions.';
    if (downloadAllBtn) downloadAllBtn.style.display = 'none';
    return;
  }

  const total = transactions.reduce((sum, t) => sum + (t.monto || 0), 0);
  outputSummary.textContent =
    `Stored transactions: ${transactions.length}. Net: ${total.toFixed(2)} (${store.currency || ''}).`;

  renderTransactionsTable(transactions);
  if (downloadAllBtn) downloadAllBtn.style.display = 'inline-block';
}

// ---------- Render Transactions Table ----------
function renderTransactionsTable(data) {
  const output = document.getElementById('output');
  if (!data || !data.length) {
    output.innerHTML = '';
    return;
  }

  let html = "<table><tr><th>#</th><th>Descripción</th><th>Fecha y Hora</th><th>Monto</th><th>Currency</th></tr>";
  data.forEach((t, idx) => {
    const dateStr = t.fecha_hora_raw || t.fecha_hora || '';
    const amountStr = typeof t.monto === 'number' ? t.monto.toFixed(2) : '';
    const color = t.monto < 0 ? 'red' : 'green';
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${t.descripcion || ''}</td>
      <td>${dateStr}</td>
      <td style="color:${color}">${amountStr}</td>
      <td>${t.currency || ''}</td>
    </tr>`;
  });
  html += "</table>";
  output.innerHTML = html;
}

// ---------- Clear Text Box ----------
function clearTextBox() {
  document.getElementById('inputText').value = '';
}

// ---------- Download JSON (Batch + All + Duplicates) ----------
function downloadBatchJSON() {
  if (!parsedBatchData.length) {
    alert('No new transactions in this batch.');
    return;
  }
  if (!activeAccountId) {
    alert('Please select a bank account first.');
    return;
  }

  const account = accounts.find(a => a.id === activeAccountId);
  if (!account) {
    alert('Account not found.');
    return;
  }

  const exportData = {
    bank_account: {
      alias: account.alias || '',
      bank_name: account.bank_name,
      account_holder: account.account_holder,
      account_number: account.account_number,
      currency: normalizeCurrency(account.currency || ''),
      account_type: account.account_type
    },
    transactions: parsedBatchData
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_batch_${account.bank_name}_${account.account_number}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllTransactionsForAccount() {
  if (!activeAccountId) {
    alert('Select a bank account first.');
    return;
  }

  const account = accounts.find(a => a.id === activeAccountId);
  if (!account) {
    alert('Account not found.');
    return;
  }

  const store = loadTransactionsForAccount(activeAccountId);
  const transactions = store.transactions || [];
  if (!transactions.length) {
    alert('No stored transactions to download.');
    return;
  }

  const exportData = {
    bank_account: {
      alias: account.alias || '',
      bank_name: account.bank_name,
      account_holder: account.account_holder,
      account_number: account.account_number,
      currency: normalizeCurrency(account.currency || ''),
      account_type: account.account_type
    },
    transactions: transactions
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_all_${account.bank_name}_${account.account_number}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadSkippedDuplicates() {
  if (!sessionDuplicates.length) {
    alert('No skipped duplicates this session.');
    return;
  }
  if (!activeAccountId) {
    alert('Select a bank account first.');
    return;
  }

  const account = accounts.find(a => a.id === activeAccountId);
  if (!account) {
    alert('Account not found.');
    return;
  }

  const exportData = {
    bank_account: {
      alias: account.alias || '',
      bank_name: account.bank_name,
      account_number: account.account_number,
      currency: normalizeCurrency(account.currency || '')
    },
    skipped_duplicates: sessionDuplicates
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `duplicates_${account.bank_name}_${account.account_number}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Clear Stored Transactions ----------
function clearAllTransactionsForAccount() {
  if (!activeAccountId) {
    alert('Select an account first.');
    return;
  }

  const store = loadTransactionsForAccount(activeAccountId);
  const count = (store.transactions || []).length;
  if (!count) {
    alert('No transactions to clear.');
    return;
  }

  const ok = confirm(`Delete all ${count} stored transactions?`);
  if (!ok) return;

  store.transactions = [];
  saveTransactionsObject(activeAccountId, store);
  renderStoredTransactionsForActiveAccount();
  renderAccountsTables();
  resetDuplicatesSection();
  updateSaveStatus(false, 'All transactions cleared.');
}

function clearTransactionsByDateRange() {
  if (!activeAccountId) {
    alert('Select an account first.');
    return;
  }

  const startVal = document.getElementById('clearStartDate').value;
  const endVal = document.getElementById('clearEndDate').value;

  if (!startVal && !endVal) {
    alert('Select at least one date.');
    return;
  }

  const store = loadTransactionsForAccount(activeAccountId);
  const txs = store.transactions || [];
  if (!txs.length) {
    alert('No transactions to filter.');
    return;
  }

  let startTs = startVal ? new Date(startVal + 'T00:00:00').getTime() : null;
  let endTs = endVal ? new Date(endVal + 'T23:59:59').getTime() : null;

  const kept = [];
  const removed = [];

  txs.forEach(t => {
    if (!t.fecha_hora) {
      kept.push(t);
      return;
    }
    const txTs = Date.parse(t.fecha_hora);
    if (isNaN(txTs)) {
      kept.push(t);
      return;
    }

    let inRange = true;
    if (startTs && txTs < startTs) inRange = false;
    if (endTs && txTs > endTs) inRange = false;

    if (inRange) removed.push(t);
    else kept.push(t);
  });

  if (!removed.length) {
    alert('No transactions matched the selected range.');
    return;
  }

  const ok = confirm(`Delete ${removed.length} transactions in selected range?`);
  if (!ok) return;

  store.transactions = kept;
  saveTransactionsObject(activeAccountId, store);
  renderStoredTransactionsForActiveAccount();
  renderAccountsTables();
  resetDuplicatesSection();
  updateSaveStatus(false, `${removed.length} transactions removed by date range.`);
}