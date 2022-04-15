import { handleNekoCSV, saveFileFromURL } from './utils';
import DiscordJS, { Intents } from 'discord.js';
import path from "path";

import UnbelievaBoatAPIBot from './bots/UnbelievaBoatAPIBot';
export default class SuperBot {
    private client;
    private guildId: string = '';
    private guild: DiscordJS.Guild | undefined;
    private OUTPUT_DIR: string = path.resolve(__dirname, '../excels');

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
            if (message.content === '!ping') {
                message.reply({
                    content: 'pong'
                })
            } else if (message.content === '!server') {
                message.reply({
                    content: message.guild?.id
                })
            } else if (message.content === '!run') {
                message.reply({
                    content: 'Our Superbot is processing your requirement. Please wait a litle longer. About 8-10 hours for filtering users by their roles'
                })

                if (message.attachments.size) {
                    const attach = Array.from(message.attachments.values())[0];
                    const csvUrl = attach.url;
                    if (attach.name?.split(".").pop() !== "csv") {
                        message.channel.send({
                            content: "Your attached file doesn't include any csv files"
                        })
                    } else {
                        const filename: string = attach.name ?? "data.csv";
                        const filepath: string = path.resolve(this.OUTPUT_DIR, filename);
                        await saveFileFromURL(csvUrl, filepath);

                        this.guildId = message.guild?.id ?? '';
                        this.unbelievaBoatAPIBot.setLeaderBoardUnbelievaBoatAPI(`https://unbelievaboat.com/api/v1/guilds/${this.guildId}/leaderboard`);
                        this.guild = this.client.guilds.cache.get(this.guildId);

                        const discord2AddressFilePath: string = filepath;
                        const discord2AddressData: { [key: string]: string } = handleNekoCSV(discord2AddressFilePath);
                        const result: any = await this.unbelievaBoatAPIBot.dumpAllBalancesInExcelFile(this.guild, discord2AddressData);
                        const errorPages: number[] = result.errorPages;
                        const currentUsersCount: number = result.currentUsersCount;
                        console.log(`There are some error pages when getting data including: ${errorPages.join(",")}`);
                        message.reply({
                            content: `We have completed the excel file you need with ${currentUsersCount}. Contact the bot owner to get the file.`
                        })
                    }
                } else {
                    message.channel.send({
                        content: "You should give us a csv file"
                    })
                }
            } else if (message.content === 'test') {
                // message.channel.send({
                //     files: [
                //         'excels/test.xlsx'
                //     ]
                // })
            }
        })
    }

    getUsernameById = async (userid: string): Promise<string> => {
        const force = true;
        const user = await this.client.users.fetch(userid, { force });
        return user?.username;
    }
}