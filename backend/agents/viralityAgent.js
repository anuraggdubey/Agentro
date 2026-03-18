const { generateResponse } = require('../utils/aiClient');

const predictVirality = async (topic, idea, hook) => {
  const prompt = `
    Analyze the global impact and community resonance of this intelligence-led content strategy:
    Trend: "${topic}"
    Concept: "${idea}"
    Hook: "${hook}"
    
    Provide a deep strategic analysis including:
    1. "viralityScore": (0-100)
    2. "reachEstimate": A string representing potential reach (e.g., "1.2M+", "500k-800k").
    3. "retentionSignal": A percentage string for hook retention (e.g., "92.5%").
    4. "velocityIndex": A string describing the speed of trend growth (e.g., "Mach 2.4", "Exponential", "Rapid").
    5. "platformSuggestion": Optimized platform path.
    6. "reasoning": Strategic depth on why this will resonate.
    
    Output format (JSON ONLY):
    {
      "viralityScore": 85,
      "reachEstimate": "2.1M+",
      "retentionSignal": "94.2%",
      "velocityIndex": "Mach 2.1",
      "platformSuggestion": "Instagram Reels",
      "reasoning": "..."
    }
  `;

  try {
    return await generateResponse(prompt);
  } catch (error) {
    console.error('Virality Agent Error:', error);
    return { viralityScore: 50, platformSuggestion: 'All platforms', reasoning: 'Fallback' };
  }
};

module.exports = {
  predictVirality,
};
