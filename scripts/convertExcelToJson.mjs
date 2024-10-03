import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Function to convert Excel file to JSON
const convertExcelToJson = (inputFilePath, outputFilePath) => {
    const workbook = xlsx.readFile(inputFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
};

// Define file paths
const startingPlayerCardsPath = path.join(__dirname, '..', 'static', 'raw_data', 'Starting Player Cards.xlsx');
const telegramBotCardsPath = path.join(__dirname, '..', 'static', 'raw_data', 'Telegram Bot Cards.xlsx');
const dataDir = path.join(__dirname, '..', 'static' , 'data');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Convert and save JSON files
convertExcelToJson(startingPlayerCardsPath, path.join(dataDir, 'startingPlayerCards.json'));
convertExcelToJson(telegramBotCardsPath, path.join(dataDir, 'telegramBotCards.json'));

console.log('Conversion completed successfully.');