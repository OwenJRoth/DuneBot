import axios from 'axios';

export const getR6Stats = async (username) => {
  const url = `https://api.tracker.gg/api/v2/r6siege/standard/profile/ubi/${username}`;

  try {
    const { data } = await axios.get(url);

    const segments = data.data?.segments || [];
    const overview = segments.find((segment) => segment.type === 'overview');
    const stats = overview?.stats || {};

    return {
      maxRank: stats.rankedRating?.value || 'N/A',
      lifetimeKD: stats.kd?.displayValue || 'N/A',
      currentKD: stats.seasonalKd?.displayValue || 'N/A',
      currentRank: stats.seasonalRank?.value || 'N/A',
    };
  } catch (error) {
    if (error.response) {
      throw error; // Let app.js handle 404 or 429, as you're already doing
    }
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }
};
