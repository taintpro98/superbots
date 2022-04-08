import DiscordJS, { Intents } from 'discord.js';
import path from 'path';
import axios from 'axios';
import XLSX from 'xlsx';

export default class SuperBot {
    private client;
    private guildId: string = '';
    private guild: DiscordJS.Guild | undefined;
    private LeaderBoardUnbelievaBoatAPI: string = '';
    private OUTPUT_DIR: string = path.resolve(__dirname, '../excels');

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
                this.guildId = message.guild?.id ?? '';
                this.LeaderBoardUnbelievaBoatAPI = `https://unbelievaboat.com/api/v1/guilds/${this.guildId}/leaderboard`;
                this.guild = this.client.guilds.cache.get(this.guildId);

                const excelPath: string = await this.dumpAllBalancesInExcelFile();
                message.reply({
                    content: 'done'
                })
                message.channel.send({
                    files: [
                        excelPath
                    ]
                })
            }
        })
    }

    getUserInfoById = async (userid: string): Promise<string> => {
        const force = true;
        const user = await this.client.users.fetch(userid, { force });
        // const role = await this.client.users.
        return user?.username;
    }

    getBalancesByPage = async (api: string, limit: number, page: number) => {
        try {
            const response = await axios.get(api, {
                params: {
                    limit: limit,
                    page: page
                },
                headers: { "Authorization": `${process.env.AUTHORIZED_TOKEN}` }
            });
            const balances = response.data.balances;
            const users = response.data.users;
            const pageNumber = response.data.page;
            const totalPages = response.data.total_pages;
            return {
                balances: balances,
                users: users,
                pageNumber: pageNumber,
                totalPages: totalPages
            }
        } catch (err: any) {
            console.error(`${err}`);
        }
    }

    dumpExcel = (savepath: string, data: any[]): void => {
        const workbook = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, "main");
        XLSX.writeFile(workbook, savepath);
    }

    dumpAllBalancesInExcelFile = async (): Promise<string> => {
        const filterPromise = async (user: any): Promise<boolean | undefined> => {
            try {
                let member = await this.guild?.members.fetch(user.id);
                return member?.roles.cache.has("929711349699838023") || member?.roles.cache.has("950067727157047377");
            } catch (err: any) {
                console.error(`${err}`);
            }
        }
        console.log("start");

        let balances: { [key: string]: number } = {};
        let users: any[] = [];
        let currentPage = 0;
        let totalPages = 100;

        while (currentPage !== totalPages) {
            let data = await this.getBalancesByPage(this.LeaderBoardUnbelievaBoatAPI, 25, currentPage + 1);
            for (let balance of data?.balances) {
                balances[balance.user_id] = balance.total;
            }

            const userPromises: any[] = [];
            for (let u of data?.users) {
                userPromises.push(filterPromise(u));
            }
            const results = await Promise.all(userPromises);
            const filtered_members = data?.users.filter((user: any, idx: number) => {
                return results[idx]
            });

            users = users.concat(filtered_members.map((user: any) => {
                return {
                    UserId: user.id,
                    Username: user.username,
                    Tag: user.discriminator
                }
            }))
            currentPage = data?.pageNumber;
            totalPages = data?.totalPages;
            console.log(currentPage);
        }
        users = users.map((user) => {
            return {
                ...user,
                Balance: balances[user.UserId]
            }
        })
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const savepath = path.resolve(this.OUTPUT_DIR, filename);
        try {
            this.dumpExcel(savepath, users);
            console.log("done");
            return savepath;
        } catch (err: any) {
            console.error(`${err}`);
            return '';
        }
    }
}