const { generateResponse } = require('../utils/aiClient');

const generateIdea = async (topic) => {
  const prompt = `
    As a high-end AI intelligence analyst, generate a sophisticated content strategy idea based on the following trend: "${topic}".
    
    Guidelines:
    - Avoid low-effort meme content.
    - Focus on "Community Intelligence": What does this trend mean for the broader community?
    - Provide deep-dive concepts, educational hooks, or investigative angles.
    - If for Instagram, focus on "Visual Storytelling Intelligence" and broad community impact.
    
    Output format (JSON):
    {
      "idea": "A detailed, community-impact focused content concept",
      "rationale": "The strategic intelligence behind why this resonates globally"
    }
  `;

  try {
    return await generateResponse(prompt);
  } catch (error) {
    console.error('Idea Agent Error:', error);
    return { idea: `Content about ${topic}`, rationale: 'Trending topic' };
  }
};

module.exports = {
  generateIdea,
};
