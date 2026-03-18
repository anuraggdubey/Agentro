const express = require('express');
const router = express.Router();
const { generateIdea } = require('../agents/ideaAgent');
const { generateHookAndTitle } = require('../agents/hookAgent');
const { predictVirality } = require('../agents/viralityAgent');

/**
 * POST /api/strategy
 * Input: { topic, platform }
 * Returns viral content strategy.
 */
router.post('/', async (req, res) => {
  const { topic, platform } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    // Pipeline execution
    const ideaResult = await generateIdea(topic);
    const hookResult = await generateHookAndTitle(topic, ideaResult.idea);
    const viralityResult = await predictVirality(topic, ideaResult.idea, hookResult.hook);

    const response = {
      topic,
      platform: platform || 'general',
      idea: ideaResult.idea,
      hook: hookResult.hook,
      title: hookResult.title,
      viralityScore: viralityResult.viralityScore,
      reachEstimate: viralityResult.reachEstimate,
      retentionSignal: viralityResult.retentionSignal,
      velocityIndex: viralityResult.velocityIndex,
      platformSuggestion: viralityResult.platformSuggestion,
      reasoning: viralityResult.reasoning
    };

    res.json(response);
  } catch (error) {
    console.error('Strategy Route Error:', error);
    res.status(500).json({ error: 'Failed to generate strategy' });
  }
});

module.exports = router;
