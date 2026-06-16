const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await require('./api/scores').getScores();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const { name, score } = req.body;
    const result = await require('./api/scores').addScore(name, score);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;