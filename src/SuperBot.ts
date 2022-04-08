import DiscordJS, { Intents } from 'discord.js';

import UnbelievaBoatAPIBot from './bots/UnbelievaBoatAPIBot';
export default class SuperBot {
    private client;
    private guildId: string = '';
    private guild: DiscordJS.Guild | undefined;

    private unbelievaBoatAPIBot: UnbelievaBoatAPIBot = new UnbelievaBoatAPIBot();

    constructor() {
        this.client = new DiscordJS.Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES
            ]
        })
    }

    async login(): Promise<void> {
        await this.client.login(process.env.TOKEN);
    }

    onMessage() {
        this.client.on('ready', () => {
            console.log('The bot is ready');
        })

        this.client.on('messageCreate', async (message) => {
            if (message.content === 'ping') {
                message.reply({
                    content: 'pong'
                })
            } else if (message.content === 'server') {
                message.reply({
                    content: message.guild?.id
                })
            } else if (message.content === 'run') {
                message.reply({
                    content: 'Our Superbot is processing your requirement. Please wait a litle longer. About 8-10 hours for filtering users by their roles'
                })

                this.guildId = message.guild?.id ?? '';
                this.unbelievaBoatAPIBot.setLeaderBoardUnbelievaBoatAPI(`https://unbelievaboat.com/api/v1/guilds/${this.guildId}/leaderboard`);
                this.guild = this.client.guilds.cache.get(this.guildId);

                const excelPath: string = await this.unbelievaBoatAPIBot.dumpAllBalancesInExcelFile(this.guild);
                // message.channel.send({
                //     files: [
                //         excelPath
                //     ]
                // })
                message.reply({
                    content: 'We have completed the excel file you need. Contact the bot owner to get the file'
                })
            } else if (message.content === 'test') {
                message.channel.send({
                    files: [
                        'excels/test.xlsx'
                    ]
                })
            }
        })
    }

    getUsernameById = async (userid: string): Promise<string> => {
        const force = true;
        const user = await this.client.users.fetch(userid, { force });
        return user?.username;
    }
}