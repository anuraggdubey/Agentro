const { generateResponse } = require('../utils/aiClient');

const generateHookAndTitle = async (topic, idea) => {
  const prompt = `
    Based on this high-level intelligence concept: "${idea}" for the trend: "${topic}", craft a powerful narrative hook and a compelling title.
    
    Guidelines:
    - Avoid "clickbait" or meme-style hooks.
    - Focus on "Intellectual Curiosity": Hook the user with a profound insight or a community-wide question.
    - Title should feel like an intelligence briefing or a high-end editorial piece.
    
    Output format (JSON):
    {
      "hook": "A thought-provoking narrative opening",
      "title": "A sophisticated, high-impact title"
    }
  `;

  try {
    return await generateResponse(prompt);
  } catch (error) {
    console.error('Hook Agent Error:', error);
    return { hook: `Check this out: ${topic}`, title: topic };
  }
};

module.exports = {
  generateHookAndTitle,
};
