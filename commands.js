import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

const PICK_CHALLENGE_COMMAND = {
  name: 'pickchallenge',
  description: 'Pick a random challenge from a list.',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const ONE_VS_ONE_COMMAND = {
  name: '1v1',
  description: 'Compare stats between two players and determine the winner based on their KD and rank',
  options: [
    {
      type: 3,  // Type 3 indicates a STRING input
      name: 'username1',
      description: 'The first username of the player',
      required: true,
    },
    {
      type: 3,  // Type 3 indicates a STRING input
      name: 'username2',
      description: 'The second username of the player',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Add the new /r6stats command
const R6STATS_COMMAND = {
  name: 'r6stats',
  description: 'Get Rainbow Six Siege stats for a player',
  options: [
    {
      type: 3,  // Type 3 indicates a STRING input
      name: 'username',
      description: 'The username of the player',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const R6STATCOMPARE_COMMAND = {
  name: 'r6statcompare',
  description: 'Compare Rainbow Six Siege stats between two players',
  options: [
    {
      type: 3,  // Type 3 indicates a STRING input
      name: 'username1',
      description: 'The first username of the player',
      required: true,
    },
    {
      type: 3,  // Type 3 indicates a STRING input
      name: 'username2',
      description: 'The second username of the player',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const PICK_OPERATOR_COMMAND = {
  name: 'pickoperator',
  description: 'Pick a random operator from either attack or defense.',
  options: [
    {
      type: 3,  // Type 3 indicates a STRING input
      name: 'category',
      description: 'Choose between Attack or Defense',
      required: true,
      choices: [
        {
          name: 'Attack',
          value: 'attack',
        },
        {
          name: 'Defense',
          value: 'defense',
        },
      ],
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, R6STATS_COMMAND, R6STATCOMPARE_COMMAND,ONE_VS_ONE_COMMAND, PICK_OPERATOR_COMMAND, PICK_CHALLENGE_COMMAND];

// Register all commands
InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);

