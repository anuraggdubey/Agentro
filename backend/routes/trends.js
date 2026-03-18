const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const { aggregateTrends } = require('../agents/trendAgent');

const trendCache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache

/**
 * GET /api/trends
 * Returns aggregated trends from Google, Reddit, and News.
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query) {
      const cachedTrends = trendCache.get('aggregated_trends');
      if (cachedTrends) {
        return res.json({ trends: cachedTrends, cached: true });
      }
    }

    const trends = await aggregateTrends(query);
    
    if (!query) {
      trendCache.set('aggregated_trends', trends);
    }
    
    res.json({ trends, cached: false });
  } catch (error) {
    console.error('Trends Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch trends', trends: [] });
  }
});

module.exports = router;
