import path from 'path';
import axios from 'axios';
import XLSX from 'xlsx';
import DiscordJS from 'discord.js';

export default class UnbelievaBoatAPIBot {
    private LeaderBoardUnbelievaBoatAPI: string = '';
    private OUTPUT_DIR: string = path.resolve(__dirname, '../../excels');

    constructor() { }

    setLeaderBoardUnbelievaBoatAPI(api: string) {
        this.LeaderBoardUnbelievaBoatAPI = api;
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

    appendExcel = (savepath: string, data: any[], fields: string[], column: number, row: number) => {
        const workbook = XLSX.readFile(savepath);
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        const cellRef = XLSX.utils.encode_cell({ c: column, r: row });
        const appendData = data.map((user: any) => {
            return fields.map(f => user[f])
        })
        XLSX.utils.sheet_add_aoa(sheet, appendData, { origin: cellRef });
        XLSX.writeFile(workbook, savepath);
    }

    dumpAllBalancesInExcelFile = async (guild: DiscordJS.Guild | undefined): Promise<string> => {
        const filterPromise = async (user: any): Promise<boolean | undefined> => {
            try {
                let member = await guild?.members.fetch(user.id);
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

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.xlsx';
        const savepath = path.resolve(this.OUTPUT_DIR, filename);

        while (currentPage !== totalPages) {
            let currentUsersCount = users.length;
            let data = await this.getBalancesByPage(this.LeaderBoardUnbelievaBoatAPI, 25, currentPage + 1);
            if (data) {
                for (let balance of data.balances) {
                    balances[balance.user_id] = balance.total;
                }
                const userPromises: any[] = [];
                for (let u of data.users) {
                    userPromises.push(filterPromise(u));
                }
                const results = await Promise.all(userPromises);
                const filtered_members = data?.users.filter((user: any, idx: number) => {
                    return results[idx]
                });

                let newUsers: any[] = filtered_members.map((user: any) => {
                    return {
                        UserId: user.id,
                        Username: user.username,
                        Tag: user.discriminator
                    }
                })

                users = users.concat(newUsers);
                currentPage = data?.pageNumber;
                totalPages = data?.totalPages;

                try {
                    if (currentPage === 1) this.dumpExcel(savepath, users);
                    else this.appendExcel(savepath, newUsers, ["UserId", "Username", "Tag"], 0, currentUsersCount + 1);
                } catch (err: any) {
                    console.error(`${err}`);
                    return '';
                }
                console.log(currentPage);
            } else {
                console.log(`Page ${currentPage} has errors when getting data`);
            }
        }
        users = users.map((user) => {
            return {
                ...user,
                Balance: balances[user.UserId]
            }
        })
        this.appendExcel(savepath, users, ["Balance"], 3, 1);
        console.log("done");
        return savepath;
    }
}