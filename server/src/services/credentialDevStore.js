const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEV_STORE_PATH = path.resolve(__dirname, '../../.credentialcheck_dev_store.json');

function readStore() {
  try {
    if (fs.existsSync(DEV_STORE_PATH)) {
      const data = fs.readFileSync(DEV_STORE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[CredentialDevStore] Error reading store, initializing fresh:', err.message);
  }
  return {};
}

function writeStore(store) {
  try {
    fs.writeFileSync(DEV_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[CredentialDevStore] Error writing store:', err.message);
  }
}

/**
 * Persist an investigation record for a specific user in development.
 */
function saveDevInvestigation(userId, record) {
  if (!userId) throw new Error('userId is required for dev store persistence');
  const store = readStore();
  if (!store[userId]) {
    store[userId] = [];
  }

  const caseId = 'CRED-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const persistedRecord = {
    id: caseId,
    userId,
    ...record,
    createdAt: record.createdAtIso || new Date().toISOString()
  };

  // Prepend to maintain reverse-chronological order
  store[userId].unshift(persistedRecord);
  writeStore(store);

  return persistedRecord;
}

/**
 * Retrieve investigation history for a specific user.
 */
function getDevHistory(userId) {
  if (!userId) return [];
  const store = readStore();
  const userRecords = store[userId] || [];
  return [...userRecords].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Retrieve single investigation by ID, ensuring user boundary enforcement.
 */
function getDevInvestigation(userId, id) {
  if (!userId || !id) return null;
  const store = readStore();
  const userRecords = store[userId] || [];
  return userRecords.find(item => item.id === id) || null;
}

/**
 * Delete an investigation by ID for a specific user.
 */
function deleteDevInvestigation(userId, id) {
  if (!userId || !id) return false;
  const store = readStore();
  if (!store[userId]) return false;

  const initialLength = store[userId].length;
  store[userId] = store[userId].filter(item => item.id !== id);
  if (store[userId].length !== initialLength) {
    writeStore(store);
    return true;
  }
  return false;
}

module.exports = {
  saveDevInvestigation,
  getDevHistory,
  getDevInvestigation,
  deleteDevInvestigation
};
