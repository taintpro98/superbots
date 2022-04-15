import XLSX from 'xlsx';
import axios from 'axios';
import fs from 'fs';

export const ref2range = (ref: string): number => {
    const cellRef = XLSX.utils.decode_range(ref);
    return (cellRef.e.r - cellRef.s.r + 1);
}

export const handleNekoCSV = (filepath: string): { [key: string]: string } => {
    let result: { [key: string]: string } = {};
    let workbook = XLSX.readFile(filepath);
    let worksheet = workbook.Sheets['Sheet1'];
    let json_sheet = XLSX.utils.sheet_to_json(worksheet);
    json_sheet.forEach((row: any) => {
        const rowValues: any = Object.values(row);
        result[rowValues[0].toString()] = rowValues[1].toString();
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