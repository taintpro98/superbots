import XLSX from 'xlsx';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { UBBOTdataExcel } from './types';
import UnbelievaBoatAPIBot from './bots/UnbelievaBoatAPIBot';

export const ref2range = (ref: string): number => {
    const cellRef = XLSX.utils.decode_range(ref);
    return (cellRef.e.r - cellRef.s.r + 1);
}

export const handleNekoCSV = (filepath: string): { [key: string]: string } => {
    let result: { [key: string]: string } = {};
    let workbook = XLSX.readFile(filepath);
    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let json_sheet = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    json_sheet.forEach((row: any) => {
        const rowValues: any = Object.values(row);
        result[rowValues[1].toString().trim()] = rowValues[3].toString().trim();
    })
    return result;
}

export const handleUBBotDataExcel = (filepath: string): UBBOTdataExcel[] => {
    let result: UBBOTdataExcel[] = [];
    let workbook = XLSX.readFile(filepath);
    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let json_sheet = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    json_sheet.forEach((row: any) => {
        const rowValues: any = Object.values(row);
        if (rowValues.length > 3)
            result.push({
                UserId: rowValues[0].toString().trim(),
                Username: rowValues[1].toString().trim(),
                Tag: rowValues[2].toString().trim(),
                Address: '',
                // ASG: rowValues[3].toString().trim()
                Balance: rowValues[rowValues.length - 1].toString().trim()
            })
    })
    return result;
}

export const saveFileFromURL = async (url: string, output_path: string) => {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });
    response.data.pipe(fs.createWriteStream(output_path))
}


export enum Test {
    Poison = "ES1",
}

(async () => {
    const UBBot = new UnbelievaBoatAPIBot();
    const OUTPUT_DIR: string = path.resolve(__dirname, '../excels');
    const UBBotPath: string = path.resolve(OUTPUT_DIR, 'xxx.xlsx');
    const addressPath: string = path.resolve(OUTPUT_DIR, 'ICCO_Wallet_Phase_2_lan_2.xlsx');

    UBBot.mergeDataAddress(UBBotPath, addressPath);
})()