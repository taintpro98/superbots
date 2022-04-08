import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import reader from 'xlsx';
import SuperBot from './SuperBot';

dotenv.config();

const TESTUnbelievaBoatAPI = 'https://unbelievaboat.com/api/v1/guilds/915859304299511818/leaderboard';
const MAINUnbelievaBoatAPI = 'https://unbelievaboat.com/api/v1/guilds/891973317781757952/leaderboard';
const OUTPUT_DIR = path.resolve(__dirname, '../excels');

const areSameItems = (myArray: any[]): boolean => {
    let mySet = new Set();
    myArray.forEach((item) => {
        mySet.add(item.user_id);
    })
    console.log(mySet.size);
    return myArray.length > mySet.size;
}

const check = (balances: any[], users: any[]) => {
    let onlineUsers = 0;
    let offUsers: any[] = [];
    balances.forEach(bal => {
        let isInServer = false;
        users.forEach(u => {
            if (u.id === bal.user_id) isInServer = true;
        })
        if (!isInServer) {
            offUsers.push(bal);

        }
    })
    console.log("off users", offUsers);

}

const getAllInfoUsers = async (): Promise<any[]> => {
    try {
        let response = await axios.get(MAINUnbelievaBoatAPI, { headers: { "Authorization": `${process.env.AUTHORIZED_TOKEN}` } });
        const balances = response.data.balances;
        const users = response.data.users;
        console.log(response.data.total_pages);
        console.log(balances.length);
    } catch (err: any) {
        console.error(`${err}`);
    }
    return [];
}

const getBalancesByPage = async (api: string, limit: number, page: number) => {
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




const dumpAllBalancesInExcelFile = async (superbot: any): Promise<void> => {
    console.log("start");
    const filename = 'test.xlsx' ///Date.now() + '-' + Math.round(Math.random() * 1E9);
    const savepath = path.resolve(OUTPUT_DIR, filename);
    const file = reader.readFile(savepath);

    let balances: any[] = [];
    let users: any[] = [];
    let currentPage = 0;
    let totalPages = 100;

    while (currentPage !== totalPages && currentPage < 3) {
        let data = await getBalancesByPage(MAINUnbelievaBoatAPI, 25, currentPage + 1);
        for (let balance of data?.balances) {
            const username = await superbot.getUserInfoById(balance.user_id);
            balances.push({
                UserId: balance.user_id,
                Cash: balance.cash,
                Username: username
            })
        }
        users = users.concat(data?.users.map((user: any) => {
            return {
                id: user.id,
                username: user.username,
                tag: user.discriminator
            }
        }))
        currentPage = data?.pageNumber;
        totalPages = data?.totalPages;
        console.log(currentPage);
    }
    console.log(balances);
    const ws = reader.utils.json_to_sheet(balances);

    reader.utils.book_append_sheet(file, ws, "7");
    reader.writeFile(file, savepath);
    console.log("done");
}

(async () => {
    const superbot = new SuperBot();
    await superbot.login();
    await dumpAllBalancesInExcelFile(superbot);
})()
