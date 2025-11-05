// ---------------------------------------------------------
// accounts.js — Manage bank accounts (add, update, delete)
// ---------------------------------------------------------

let accounts = [];
let activeAccountId = null;

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', () => {
  accounts = loadAccounts();
  const savedActive = localStorage.getItem('activeBankAccountId');
  if (savedActive) activeAccountId = savedActive;
  renderAccountsTables();
  updateSelectedAccountInfo();
  populateSettingsForm();
});

// ---------- Add New Account ----------
function addAccount(event) {
  event.preventDefault();

  const alias = document.getElementById('bankAlias').value.trim();
  const bank_name = document.getElementById('bankName').value.trim();
  const account_holder = document.getElementById('bankHolder').value.trim();
  const account_number = document.getElementById('bankNumber').value.trim();
  const currency = document.getElementById('bankCurrency').value.trim();
  const account_type = document.getElementById('bankType').value.trim();

  if (!bank_name || !account_holder || !account_number) {
    alert('Please fill in Bank Name, Holder Name and Account Number.');
    return;
  }

  const account = {
    id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    alias,
    bank_name,
    account_holder,
    account_number,
    currency,
    account_type
  };

  accounts.push(account);
  saveAccounts(accounts);

  activeAccountId = account.id;
  localStorage.setItem('activeBankAccountId', activeAccountId);

  document.getElementById('bankAlias').value = '';
  document.getElementById('bankName').value = '';
  document.getElementById('bankHolder').value = '';
  document.getElementById('bankNumber').value = '';
  document.getElementById('bankCurrency').value = '';
  document.getElementById('bankType').value = '';

  renderAccountsTables();
  updateSelectedAccountInfo();
  populateSettingsForm();
}

// ---------- Compute Per-Account Stats ----------
function getAccountStats(acc) {
  const store = loadTransactionsForAccount(acc.id);
  const txs = store.transactions || [];
  const count = txs.length;
  let oldest = '';
  let newest = '';

  if (count) {
    let minTs = null;
    let maxTs = null;
    txs.forEach(t => {
      if (!t.fecha_hora) return;
      const ts = Date.parse(t.fecha_hora);
      if (isNaN(ts)) return;
      if (minTs === null || ts < minTs) minTs = ts;
      if (maxTs === null || ts > maxTs) maxTs = ts;
    });
    if (minTs !== null) oldest = new Date(minTs).toISOString().substring(0, 10);
    if (maxTs !== null) newest = new Date(maxTs).toISOString().substring(0, 10);
  }

  return { count, oldest, newest };
}

// ---------- Render Tables ----------
function renderAccountsTables() {
  renderAccountsTable('accountsTableContainer');
  renderAccountsTable('accountsTableContainerTx');
  renderAccountsTable('accountsTableContainerSettings');
}

function renderAccountsTable(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!accounts.length) {
    container.innerHTML = '<p class="subtle-text">No bank accounts registered yet.</p>';
    return;
  }

  let html = '<table class="accounts-table"><thead><tr>' +
    '<th>#</th><th>Alias</th><th>Bank Name</th><th>Account Holder</th>' +
    '<th>Account Number</th><th>Currency</th><th>Type</th>' +
    '<th>Tx Count</th><th>Oldest</th><th>Newest</th></tr></thead><tbody>';

  accounts.forEach((acc, idx) => {
    const selectedClass = acc.id === activeAccountId ? ' selected-account-row' : '';
    const stats = getAccountStats(acc);
    const aliasDisplay = acc.alias && acc.alias.length ? acc.alias : '—';

    html += `<tr class="${selectedClass}" data-account-id="${acc.id}" onclick="selectAccount('${acc.id}')">
      <td>${idx + 1}</td>
      <td>${aliasDisplay}</td>
      <td>${acc.bank_name}</td>
      <td>${acc.account_holder}</td>
      <td><strong>${acc.account_number}</strong></td>
      <td>${acc.currency || ''}</td>
      <td>${acc.account_type || ''}</td>
      <td>${stats.count}</td>
      <td>${stats.oldest}</td>
      <td>${stats.newest}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// ---------- Select Account ----------
function selectAccount(accountId) {
  activeAccountId = accountId;
  localStorage.setItem('activeBankAccountId', activeAccountId);
  renderAccountsTables();
  updateSelectedAccountInfo();
  renderStoredTransactionsForActiveAccount();
  populateSettingsForm();
  resetDuplicatesSection();
}

// ---------- Display Selected Account Info ----------
function updateSelectedAccountInfo() {
  const div = document.getElementById('selectedAccountInfo');
  if (!div) return;

  if (!activeAccountId) {
    div.textContent = 'No bank account selected yet.';
    return;
  }

  const acc = accounts.find(a => a.id === activeAccountId);
  if (!acc) {
    div.textContent = 'Selected account not found.';
    return;
  }

  const aliasPart = acc.alias && acc.alias.length ? acc.alias + ' — ' : '';
  div.textContent =
    `Selected account: ${aliasPart}${acc.bank_name} | ${acc.account_holder} | ${acc.account_number} (${acc.currency || 'N/A'}, ${acc.account_type || 'N/A'})`;
}

// ---------- Settings: Populate Form ----------
function populateSettingsForm() {
  const acc = accounts.find(a => a.id === activeAccountId);
  const aliasInput = document.getElementById('settingsAlias');
  const bankInput = document.getElementById('settingsBankName');
  const holderInput = document.getElementById('settingsHolder');
  const numberInput = document.getElementById('settingsNumber');
  const currencyInput = document.getElementById('settingsCurrency');
  const typeInput = document.getElementById('settingsType');
  const updStatus = document.getElementById('settingsUpdateStatus');
  const delStatus = document.getElementById('settingsDeleteStatus');

  if (updStatus) updStatus.textContent = '';
  if (delStatus) delStatus.textContent = '';

  if (!aliasInput || !bankInput || !holderInput || !numberInput || !currencyInput || !typeInput) return;

  if (!acc) {
    aliasInput.value = '';
    bankInput.value = '';
    holderInput.value = '';
    numberInput.value = '';
    currencyInput.value = '';
    typeInput.value = '';
    return;
  }

  aliasInput.value = acc.alias || '';
  bankInput.value = acc.bank_name || '';
  holderInput.value = acc.account_holder || '';
  numberInput.value = acc.account_number || '';
  currencyInput.value = acc.currency || '';
  typeInput.value = acc.account_type || '';
}

// ---------- Settings: Update ----------
function saveAccountUpdates() {
  const acc = accounts.find(a => a.id === activeAccountId);
  const updStatus = document.getElementById('settingsUpdateStatus');
  if (!acc) {
    if (updStatus) updStatus.textContent = 'No account selected.';
    return;
  }

  const alias = document.getElementById('settingsAlias').value.trim();
  const bank_name = document.getElementById('settingsBankName').value.trim();
  const account_holder = document.getElementById('settingsHolder').value.trim();
  const currency = document.getElementById('settingsCurrency').value.trim();
  const account_type = document.getElementById('settingsType').value.trim();

  if (!bank_name || !account_holder) {
    if (updStatus) updStatus.textContent = 'Bank Name and Account Holder are required.';
    return;
  }

  acc.alias = alias;
  acc.bank_name = bank_name;
  acc.account_holder = account_holder;
  acc.currency = currency;
  acc.account_type = account_type;

  saveAccounts(accounts);
  renderAccountsTables();
  updateSelectedAccountInfo();
  if (updStatus) updStatus.textContent = '✅ Account updated successfully.';
}

// ---------- Settings: Delete ----------
function deleteSelectedAccount() {
  const delStatus = document.getElementById('settingsDeleteStatus');
  if (!activeAccountId) {
    if (delStatus) delStatus.textContent = 'No account selected.';
    return;
  }

  const acc = accounts.find(a => a.id === activeAccountId);
  if (!acc) {
    if (delStatus) delStatus.textContent = 'Selected account not found.';
    return;
  }

  const label = `${acc.alias ? acc.alias + ' — ' : ''}${acc.bank_name} ${acc.account_number}`;
  const ok = confirm(
    `Are you sure you want to delete account "${label}" and all its stored transactions?`
  );
  if (!ok) return;

  accounts = accounts.filter(a => a.id !== activeAccountId);
  saveAccounts(accounts);

  clearTransactionsForAccount(activeAccountId);

  activeAccountId = null;
  localStorage.removeItem('activeBankAccountId');

  renderAccountsTables();
  updateSelectedAccountInfo();
  renderStoredTransactionsForActiveAccount();
  populateSettingsForm();
  resetDuplicatesSection();

  if (delStatus) delStatus.textContent = '🗑️ Account and related transactions deleted.';
}