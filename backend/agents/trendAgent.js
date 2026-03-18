const { getTrendingTopics } = require('../services/googleTrends');
const { getRedditTrends } = require('../services/redditService');
const { getNewsHeadlines } = require('../services/newsService');

const aggregateTrends = async (query = '') => {
  try {
    const [googleTrends, redditTrends, newsTrends] = await Promise.all([
      query ? [] : getTrendingTopics(),
      getRedditTrends(query),
      getNewsHeadlines(query)
    ]);

    // Flatten all results into a single array
    const allSignals = [
      ...googleTrends,
      ...redditTrends,
      ...newsTrends
    ];

    // Deduplicate by title
    const seen = new Set();
    const uniqueTrends = allSignals.filter(t => {
      const title = t.title?.trim().toLowerCase();
      if (!title || title.length < 3 || seen.has(title)) return false;
      seen.add(title);
      return true;
    }).slice(0, 15);

    return uniqueTrends;
  } catch (error) {
    console.error('Trend Aggregator Agent Error:', error);
    return [];
  }
};

module.exports = {
  aggregateTrends,
};
