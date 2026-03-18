const axios = require('axios');
const { NEWS_API_KEY } = require('../config/env');

const getNewsHeadlines = async (query = '') => {
  if (!NEWS_API_KEY) {
    console.warn('NewsAPI key missing, skipping news service.');
    return [];
  }

  try {
    const endpoint = query ? 'https://newsapi.org/v2/everything' : 'https://newsapi.org/v2/top-headlines';
    const params = query 
      ? { q: query, sortBy: 'relevancy', pageSize: 15, apiKey: NEWS_API_KEY }
      : { language: 'en', pageSize: 10, apiKey: NEWS_API_KEY };

    const response = await axios.get(endpoint, { params });

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description || article.content?.substring(0, 150) || 'No description available.',
      url: article.url
    }));
  } catch (error) {
    console.error('News Service Error:', error);
    return [];
  }
};

module.exports = {
  getNewsHeadlines,
};
