// ---------------------------------------------------------
// storage.js — Handles all LocalStorage read/write utilities
// ---------------------------------------------------------

// Load all saved bank accounts
function loadAccounts() {
  const stored = localStorage.getItem('bankAccounts');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing bankAccounts from localStorage', e);
      return [];
    }
  }
  return [];
}

// Save the full accounts list back to localStorage
function saveAccounts(accounts) {
  localStorage.setItem('bankAccounts', JSON.stringify(accounts));
}

// Retrieve the localStorage key for a specific account’s transactions
function getTransactionsStorageKey(accountId) {
  return 'transactions_' + accountId;
}

// Load all transactions for a given account
function loadTransactionsForAccount(accountId) {
  const key = getTransactionsStorageKey(accountId);
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {
      account_id: accountId,
      currency: null,
      transactions: []
    };
  }

  try {
    const obj = JSON.parse(raw);
    if (!obj.transactions) obj.transactions = [];
    return obj;
  } catch (e) {
    console.error('Error parsing transactions for account', accountId, e);
    return {
      account_id: accountId,
      currency: null,
      transactions: []
    };
  }
}

// Save a complete transaction object back to localStorage
function saveTransactionsObject(accountId, obj) {
  const key = getTransactionsStorageKey(accountId);
  localStorage.setItem(key, JSON.stringify(obj));
}

// Remove all transactions for a given account
function clearTransactionsForAccount(accountId) {
  const key = getTransactionsStorageKey(accountId);
  localStorage.removeItem(key);
}

// Helper: remove every transaction entry (used on full app reset)
function clearAllTransactions() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('transactions_')) localStorage.removeItem(k);
  });
}