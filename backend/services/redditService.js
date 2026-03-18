const axios = require('axios');

const getRedditTrends = async (query = '') => {
  try {
    const url = query 
      ? `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&t=day&limit=10`
      : 'https://www.reddit.com/r/all/top.json?limit=10';
      
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'AgentroTrendBot/1.0'
      }
    });

    const posts = response.data.data.children;
    return posts.map(post => ({
      title: post.data.title,
      description: post.data.selftext?.substring(0, 150) || 'Reddit discussion thread.',
      url: `https://www.reddit.com${post.data.permalink}`
    }));
  } catch (error) {
    console.error('Reddit Service Error:', error);
    return [];
  }
};

module.exports = {
  getRedditTrends,
};
