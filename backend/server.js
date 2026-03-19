const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');

const trendsRouter = require('./routes/trends');
const strategyRouter = require('./routes/strategy');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trends', trendsRouter);
app.use('/api/strategy', strategyRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling fallback
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

let server = null;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Agentro Backend running on port ${PORT}`);
  });
}

module.exports = { app, server };
