const Groq = require('groq-sdk');

let groqClient = null;

const getGroqClient = () => {
  if (groqClient) return groqClient;
  
  const { GROQ_API_KEY } = require('../config/env');
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }
  
  groqClient = new Groq({ apiKey: GROQ_API_KEY });
  return groqClient;
};

/**
 * Reusable AI client utility for Groq inference.
 * @param {string} prompt - The prompt to send to the AI.
 * @param {boolean} jsonResponse - Whether to expect a JSON response.
 * @returns {Promise<Object|string>} - The AI response.
 */
async function generateResponse(prompt, jsonResponse = true) {
  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: jsonResponse ? { type: 'json_object' } : undefined,
    });

    const content = chatCompletion.choices[0].message.content;
    
    if (jsonResponse) {
      try {
        // Remove potential markdown code blocks
        const cleaned = content.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.error('JSON Parse Error in AI Client:', parseError, 'Content:', content);
        throw parseError;
      }
    }
    return content;
  } catch (error) {
    console.error('Groq AI Client Error:', error);
    if (error.response) console.error('Groq API Error Details:', error.response.data);
    throw error;
  }
}

module.exports = {
  generateResponse,
};
