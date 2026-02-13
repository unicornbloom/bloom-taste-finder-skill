/**
 * Bloom Mission Skill - CLI Entry Point
 *
 * OpenClaw skill wrapper for bloom-mission-skill
 */

import 'dotenv/config';
import { Command } from 'commander';
import { BloomMissionSkill } from './bloom-mission-skill';

const program = new Command();

program
  .name('bloom-missions')
  .description('Discover and track Bloom Protocol missions')
  .version('1.0.0')
  .requiredOption('--wallet <address>', 'Agent wallet address for heartbeat')
  .option('--context <text>', 'Conversation context for personalization')
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    const skill = new BloomMissionSkill();
    const result = await skill.execute(options.wallet, options.context);

    console.log(result.formattedOutput);

    if (!result.success) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
