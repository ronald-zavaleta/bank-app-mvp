# **Bank-App MVP — Logic Map**

## 1. HTML Layer (UI Views)
```
index.html
│
├── <div id="accountsView">        → Register & list bank accounts
│   └── #accountsTableContainer    → Rendered dynamically
│
├── <div id="transactionsView">    → Parse, store & download transactions
│   ├── #accountsTableContainerTx  → Account selector table
│   ├── #inputText                 → Text area for pasted transaction lines
│   ├── #output, #outputSummary    → Results & summaries
│   ├── #duplicatesSection         → Duplicate display (hidden by default)
│   └── #debugPanel                → Developer diagnostics (toggle ⚙️)
│
└── <div id="settingsView">        → Account update/delete section

```

## 2. JavaScript Module Map
```
app.js (Controller)
│
├── showView(view)                → Toggles UI sections & active tab
├── capitalize(str)               → Helper for tab ID names
└── DOMContentLoaded → init()     → Loads stored data, renders all tables
│
│
├── accounts.js (Accounts Manager)
│   ├── addAccount()              → Creates & saves new account
│   ├── renderAccountsTables()    → Renders tables in all views
│   ├── getAccountStats()         → Counts transactions per account
│   ├── selectAccount(id)         → Sets active account
│   └── populateSettingsForm()    → Fills editable data in Settings
│
│
├── transactions.js (Transaction Parser)
│   ├── normalizeCurrency()       → “S/.” → PEN, “US$” → USD, etc.
│   ├── normalizeDateTime()       → “lun 23 oct 12:45” → ISO 2025-10-23T12:45:00
│   ├── parseText()               → Parses lines → tx objects
│   │    ├── runIntegritySelfCheck()  ← integrity.js
│   │    ├── loadTransactionsForAccount() ← storage.js
│   │    ├── saveTransactionsObject()     ← storage.js
│   │    ├── updateDebugPanel()           ← debug.js
│   │    └── renderStoredTransactionsForActiveAccount()
│   ├── Duplicate detection via UUID (acctNum + fecha)
│   └── Download/export helpers (JSON batch & full account)
│
│
├── storage.js (Persistence Layer)
│   ├── loadAccounts(), saveAccounts()
│   ├── loadTransactionsForAccount(id)
│   ├── saveTransactionsObject(id, obj)
│   ├── clearTransactionsForAccount(id)
│   └── clearAllTransactions()
│
│
├── integrity.js (Self-Check)
│   └── runIntegritySelfCheck(rawText, parsedTxs)
│        → Compares detected vs parsed currency amounts
│
│
└── debug.js (Developer Tools)
    ├── toggleDebugPanel()       → Show/hide #debugPanel
    └── updateDebugPanel()       → Print parsed sample & raw text


```
