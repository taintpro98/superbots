import DiscordJS, { Intents } from 'discord.js';
import dotenv from 'dotenv';

import SuperBot from './SuperBot';

dotenv.config();

const superbot = new SuperBot();
superbot.onMessage();
superbot.login();