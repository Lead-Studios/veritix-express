const sessions = new Map(); // In-memory store, replace with DB if needed

function createSession(sessionId, data) {
    sessions.set(sessionId, { ...data, createdAt: Date.now() });
}

function getSession(sessionId) {
    return sessions.get(sessionId);
}

function updateSession(sessionId, updates) {
    if (sessions.has(sessionId)) {
        sessions.set(sessionId, { ...sessions.get(sessionId), ...updates });
    }
}

function deleteSession(sessionId) {
    sessions.delete(sessionId);
}

module.exports = { createSession, getSession, updateSession, deleteSession };