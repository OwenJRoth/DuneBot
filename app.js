import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import axios from 'axios';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';

// Utility function moved from r6stats.js
const getR6Stats = async (username) => {
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
  } catch (error) catch (err) {
  if (err.response) {
    switch (err.response.status) {
      case 404:
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Username not found. Please check username.' },
        });
      case 429:
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Rate limited by the server. Please wait a moment.' },
        });
    }
  }

  // Default fallback error
  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: `Unexpected error: ${err.message}` },
  });
}

};

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

const ATTACKERS = [
  'Striker', 'Deimos', 'Ram', 'Brava', 'Grim', 'Sens', 'Osa', 'Flores', 'Zero', 'Ace', 'Iana', 'Kali', 'Amaru', 'Nøkk', 'Gridlock', 'Nomad', 'Maverick', 'Lion', 'Finka', 'Dokkaebi', 'Zofia', 'Ying', 'Jackal', 'Hibana', 'Capitão', 'Blackbeard', 'Buck', 'Sledge', 'Thatcher', 'Ash', 'Thermite', 'Montagne', 'Twitch', 'Blitz', 'IQ', 'Fuze', 'Glaz'
];

const DEFENDERS = [
  'Skopos', 'Sentry', 'Tubarao', 'Fenrir', 'Solis', 'Azami', 'Thorn', 'Thunderbird', 'Aruni', 'Melusi', 'Oryx', 'Wamai', 'Goyo', 'Warden', 'Mozzie', 'Kaid', 'Clash', 'Maestro', 'Alibi', 'Vigil', 'Ela', 'Lesion', 'Mira', 'Echo', 'Caveira', 'Valkyrie', 'Frost', 'Mute', 'Smoke', 'Castle', 'Pluse', 'Doc', 'Rook', 'Jager', 'Bandit', 'Tachanka', 'Kapkan'
];

// New challenges list
const CHALLENGES = [
  'Pistols Only',
  'No Sprinting or Leaning',
  '1/2 Your Sense',
  'Iron Sights Only',
  'No Gadgets',
  'Only The Most Obscure Weapon',
  'No Headset/Audio',
  'Use a Full Auto Gun, but Tap-Fire',
  '2x Your Sense',
  'You Dodged a Challenge This Round'
];

const NORMALZOOM = [
  'Iron Sights',
  'Holo A',
  'Holo B',
  'Holo C',
  'Holo D',
  'Red Dot A',
  'Red Dot B',
  'Red Dot C',
  'Reflex A',
  'Reflex B'
]

const ACOGZOOM = [
  'Iron Sights',
  'Holo A',
  'Holo B',
  'Holo C',
  'Holo D',
  'Red Dot A',
  'Red Dot B',
  'Red Dot C',
  'Reflex A',
  'Reflex B',
  '2.5x A',
  '2.5x B',
  '2.5x C'
]

const DMRZOOM = [
  'Iron Sights',
  'Holo A',
  'Holo B',
  'Holo C',
  'Holo D',
  'Red Dot A',
  'Red Dot B',
  'Red Dot C',
  'Reflex A',
  'Reflex B',
  '2.5x A',
  '2.5x B',
  '2.5x C',
  'Telescopic A',
  'Telescopic B'
]

// New pickchallenge command
const getRandomChallenge = () => {
  const randomChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  return randomChallenge;
};

const get1v1Winner = async (username1, username2) => {
  try {
    // Fetch stats for both players
    const stats1 = await getR6Stats(username1);
    const stats2 = await getR6Stats(username2);
    let points1 = 1;
    let points2 = 1;

    // Calculate KD point difference
    const kdDifference = Math.abs(parseFloat(stats1.currentKD) - parseFloat(stats2.currentKD));
    const kdPoints = Math.floor(kdDifference * 20); // 1 point per 0.05 KD difference
    if(parseInt(stats1.currentKD) > parseInt(stats2.currentKD)){
      points1 += kdPoints
    }
    if(parseInt(stats1.currentKD) < parseInt(stats2.currentKD)){
      points2 += kdPoints
    }

    // Calculate rank point difference
    const rankDifference = Math.abs(parseInt(stats1.maxRank) - parseInt(stats2.maxRank));
    const rankPoints = Math.floor(rankDifference / 250); // 1 point per 100 rank points difference
    if(parseInt(stats1.maxRank) > parseInt(stats2.maxRank)){
      points1 += rankPoints
    }
    if(parseInt(stats1.maxRank) < parseInt(stats2.maxRank)){
      points2 += rankPoints
    }
    



    // Normalize the points to add up to 100
    const totalPoints = points1 + points2;
    const normalizedPoints1 = (points1 / totalPoints) * 100;
    const normalizedPoints2 = (points2 / totalPoints) * 100;

    // Generate a random number between 1 and 100
    const randomNum = Math.random() * 100;

    // Determine the winner based on the random number
    let winner, winnerChance;
    if (randomNum <= normalizedPoints1) {
      winner = username1;
      winnerChance = normalizedPoints1.toFixed(2);
    } else {
      winner = username2;
      winnerChance = normalizedPoints2.toFixed(2);
    }

    // Format the response
    const response = `
      **Winner:** ${winner}\n
      **1v1 Match Result:**\n
      **${username1} K/D:** ${stats1.currentKD} | **Max Rank:** ${stats1.maxRank}\n
      **${username2} K/D:** ${stats2.currentKD} | **Max Rank:** ${stats2.maxRank}\n
      **Chance of Winning:**\n
      ${username1}: ${normalizedPoints1.toFixed(2)}%\n
      ${username2}: ${normalizedPoints2.toFixed(2)}%\n
      The random number was: ${randomNum.toFixed(2)}
    `.trim();

    return response;

  } catch (err) {
    if(err.response){
      switch(err.response.status){
        case 404:
          return 'Username not found. Please check username';
        case 429:
          return 'Server blocked request. Please wait before trying again'
      }
    }
    return `Error fetching stats: ${err.message}`;
  }
};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `bye world ${getRandomEmoji()}`,
        },
      });
    }

    if (name === 'pickchallenge') {
      // Pick a random challenge from the list
      const challenge = getRandomChallenge();
      
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Your challenge is: **${challenge}**`,
        },
      });
    }

    if (name === 'randomsight') {
      const option = data.options.find((opt) => opt.name === 'type')?.value;
    
      let zoomList;
      if (option === 'normal') {
        zoomList = NORMALZOOM;
      } else if (option === 'acog') {
        zoomList = ACOGZOOM;
      } else if (option === 'dmr') {
        zoomList = DMRZOOM;
      } else {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Invalid type. Please choose between "normal", "acog", or "dmr".' },
        });
      }
    
      const randomSight = zoomList[Math.floor(Math.random() * zoomList.length)];
    
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Your random sight for ${option.toUpperCase()} is: **${randomSight}**`,
        },
      });
    }

    if (name === 'r6stats') {
      console.log("Trying to get r6 Stats")
      const username = data.options.find((opt) => opt.name === 'username')?.value;
      if (!username) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Please provide a valid username.' },
        });
      }

      try {
        const stats = await getR6Stats(username);
        const responseContent = `
        **R6 Stats for ${username}:**\n
        **Lifetime K/D:** ${stats.lifetimeKD}\n
        **Current K/D:** ${stats.currentKD}\n
        **Max Rank Points:** ${stats.maxRank}\n
        **Current Rank Points:** ${stats.currentRank}
        `.trim();

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: responseContent },
        });
      } catch (err) {
        if(err.response){
          switch (err.response.status) {
      case 404:
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Username not found. Please check the username.' },
        });
      case 429:
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Rate limited. Please wait before trying again.' },
        });
    }
        }
      }
    }

    if (name === 'pickoperator') {
      const category = data.options.find((opt) => opt.name === 'category')?.value;
    
      let operatorList;
      if (category === 'attack') {
        operatorList = ATTACKERS;
      } else if (category === 'defense') {
        operatorList = DEFENDERS;
      } else {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Invalid category. Please choose either "attack" or "defense".' },
        });
      }
    
      // Pick a random operator from the selected list
      const randomOperator = operatorList[Math.floor(Math.random() * operatorList.length)];
    
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You picked **${randomOperator}** from the ${category} category!`,
        },
      });
    }

    if (name === 'r6statcompare') {
      const username1 = data.options.find((opt) => opt.name === 'username1')?.value;
      const username2 = data.options.find((opt) => opt.name === 'username2')?.value;
    
      if (!username1 || !username2) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Please provide two valid usernames.' },
        });
      }
    
      try {
        const stats1 = await getR6Stats(username1);
        const stats2 = await getR6Stats(username2);
    
        const compareStat = (stat1, stat2, statName) => {
          const isRankStat = statName === 'Max Rank' || statName === 'Current Rank'; // Identify if it's a rank stat

        // If it's a rank stat, convert to integer (no decimal places)
        const stat1Value = isRankStat ? Math.round(stat1) : parseFloat(stat1).toFixed(2);
        const stat2Value = isRankStat ? Math.round(stat2) : parseFloat(stat2).toFixed(2);

        // Handle the comparison and return the formatted result
        if (stat1Value > stat2Value) {
          return `${username1} has higher ${statName} by ${Math.abs(stat1Value - stat2Value).toFixed(isRankStat ? 0 : 2)}`;
        } else if (stat2Value > stat1Value) {
          return `${username2} has higher ${statName} by ${Math.abs(stat2Value - stat1Value).toFixed(isRankStat ? 0 : 2)}`;
        } else {
          return `Both players have the same ${statName}`;
        }
        };
    
        const compareResults = `
        **Comparison of ${username1} vs ${username2}:**\n
        **Lifetime K/D:** ${compareStat(stats1.lifetimeKD, stats2.lifetimeKD, 'Lifetime K/D')}\n
        **Current K/D:** ${compareStat(stats1.currentKD, stats2.currentKD, 'Current K/D')}\n
        **Max Rank Points:** ${compareStat(stats1.maxRank, stats2.maxRank, 'Max Rank')}\n
        **Current Rank Points:** ${compareStat(stats1.currentRank, stats2.currentRank, 'Current Rank')}
        `.trim();
    
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: compareResults },
        });
      } catch (err) {
        if(err.response){
          switch(err.response.status){
            case 404:
              return 'Username not found. Please check username';
            case 429:
              return 'Server blocked request. Please wait before trying again'
          }
        }
      }
    }

    if (name === '1v1') {
      const username1 = data.options.find((opt) => opt.name === 'username1')?.value;
      const username2 = data.options.find((opt) => opt.name === 'username2')?.value;

      if (!username1 || !username2) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Please provide two valid usernames.' },
        });
      }

      try {
        const result = await get1v1Winner(username1, username2);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: result },
        });
      } catch (err) {
        if(err.response){
          switch(err.response.status){
            case 404:
              return 'Username not found. Please check username';
            case 429:
              return 'Server blocked request. Please wait before trying again'
          }
        }
      }
    }





    // "challenge" command
    if (name === 'challenge' && id) {
      // Interaction context
      const context = req.body.context;
      // User ID is in user field for (G)DMs, and member for servers
      const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
      // User's object choice
      const objectName = req.body.data.options[0].value;

      // Create active game using message ID as the game ID
      activeGames[id] = {
        id: userId,
        objectName,
      };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `Rock papers scissors challenge from <@${userId}>`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: 'Accept',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  /**
   * Handle requests from interactive components
   * See https://discord.com/developers/docs/interactions/message-components#responding-to-a-component-interaction
   */
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith('accept_button_')) {
      // get the associated game ID
      const gameId = componentId.replace('accept_button_', '');
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'What is your object of choice?',
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: 'DELETE' });
      } catch (err) {
        console.error('Error sending message:', err);
      }
    } else if (componentId.startsWith('select_choice_')) {
      // get the associated game ID
      const gameId = componentId.replace('select_choice_', '');

      if (activeGames[gameId]) {
        // Interaction context
        const context = req.body.context;
        // Get user ID and object choice for responding user
        // User ID is in user field for (G)DMs, and member for servers
        const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
        const objectName = data.values[0];
        // Calculate result from helper function
        const resultStr = getResult(activeGames[gameId], {
          id: userId,
          objectName,
        });

        // Remove game from storage
        delete activeGames[gameId];
        // Update message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: resultStr },
          });
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: 'PATCH',
            body: {
              content: 'Nice choice ' + getRandomEmoji(),
              components: [],
            },
          });
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
    }
    
    return;
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
