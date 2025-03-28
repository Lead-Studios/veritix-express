const { createSession, getSession, updateSession, deleteSession } = require("./gameSessionModel");
const { v4: uuidv4 } = require("uuid");

function startGame() {
    const sessionId = uuidv4();
    createSession(sessionId, { guessedWords: [], remainingAttempts: 5 });
    return sessionId;
}

function fetchProgress(sessionId) {
    return getSession(sessionId);
}

function submitGuess(sessionId, word) {
    const session = getSession(sessionId);
    if (!session) throw new Error("Session not found");
    session.guessedWords.push(word);
    session.remainingAttempts -= 1;
    updateSession(sessionId, session);
    return session;
}

function endGame(sessionId) {
    deleteSession(sessionId);
}

function checkExpiration() {
    const now = Date.now();
    sessions.forEach((session, sessionId) => {
        if (now - session.createdAt > 3600000) deleteSession(sessionId); // 1-hour expiration
    });
}
setInterval(checkExpiration, 60000); // Run every minute

module.exports = { startGame, fetchProgress, submitGuess, endGame };