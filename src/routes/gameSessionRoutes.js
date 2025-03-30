const express = require("express");
const router = express.Router();
const { startGame, fetchProgress, submitGuess, endGame } = require("./gameSessionService");

router.post("/game/start", (req, res) => {
    const sessionId = startGame();
    res.json({ sessionId });
});

router.get("/game/:sessionId", (req, res) => {
    const session = fetchProgress(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
});

router.post("/game/:sessionId/guess", (req, res) => {
    try {
        const session = submitGuess(req.params.sessionId, req.body.word);
        res.json(session);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/game/:sessionId/end", (req, res) => {
    endGame(req.params.sessionId);
    res.json({ message: "Game session ended" });
});

module.exports = router;
