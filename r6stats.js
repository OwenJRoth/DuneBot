import axios from 'axios';
import * as cheerio from 'cheerio';

export const getR6Stats = async (username) => {
  const url = `https://r6.tracker.network/r6siege/profile/ubi/${username}`;
  
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Max Rank: Use precise class targeting and order
    const maxRankText = $('.rank-points.text-20').eq(1).text().trim(); // 2nd instance is likely max rank

    // Locate current KD
    const currentKDText = $('.v3-card.season-card') // Target the "Current Season" card
        .find('div.stat-table__td') // Find all table cells in the stats table
        .eq(1) // Select the second cell (index 1 corresponds to KD in your structure)
        .find('span.stat-value span') // Find the nested spans under stat-value
        .first() // Get the first span, which contains the KD value
        .text().trim(); // Extract and clean the text
    // Locate lifetime KD
    const lifetimeKDSection = $('div')
      .filter((i, el) => $(el).text().includes('Ranked')) // Locate "Ranked" context
      .closest('.v3-grid'); // Adjust selector to the container for the section

    const lifetimeKDText = lifetimeKDSection
      .find('div')
      .filter((i, el) => $(el).text().includes('KD'))
      .text()
      .match(/KD(\d+\.\d+)/)?.[1]; // Correct the regex for extracting KD value

    // Current Rank: Unchanged
    const currentRankText = $('.text-32.font-bold.font-industry.leading-3\\/4').text().trim();
    const currentRank = currentRankText.replace(/[^\d]/g, ''); // Remove non-numeric characters

    return {
      maxRank: maxRankText.replace(/[^\d]/g, ''),
      lifetimeKD: lifetimeKDText || 'N/A',
      currentKD: currentKDText || 'N/A',
      currentRank,
    };
  } catch (error) {
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }
};
