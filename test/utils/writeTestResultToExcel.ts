import * as XLSX from 'xlsx';
import * as fs from 'fs';
import {RoundJson, RoundState} from "../../src/types/game";
import {CardJson, StatCard} from "../../src/types";


interface RoundJsonToTest {
    index?: number,
    idGame: string,
    round: number,
    stats: string,
    remainingStats: string,
    difficultyEachRound: number,
    idealStat: string,
    cardOpponent?: string,
    cardOpponentStatPoint?: number,
    cardOpponentPool?: string,
    cardPlayerCanBeat?: string,
    cardPlayerStatPoint?: number,
    isWin?: boolean,
    score: number,
    totalScore?: string,
    cardPlayer?: string,
    cardPlayerPool?: string
}


export const writeTestResultToExcel = (filePath: string, newData: any[], sheetName: string, interval: number) => {
    let workBook;
    let workSheet;

    // Insert empty rows at the specified intervals
    const dataWithSpaces = [];
    for (let i = 0; i < newData.length; i++) {
        dataWithSpaces.push(newData[i]);
        if ((i + 1) % interval === 0) {
            dataWithSpaces.push({
                idGame: '',
                round: '',
                stats: '',
                remainingStats: '',
                idealStat: '',
                cardOpponentPool: '',
                cardOpponent: '',
                cardOpponentStatPoint: '',
                cardPlayer: '',
                cardPlayerStatPoint: '',
                cardPlayerCanBeat: ''
           });
        }
    }

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the existing workbook
        workBook = XLSX.readFile(filePath);

        // Check if the sheet exists
        if (workBook.Sheets[sheetName]) {
            // Get the existing worksheet
            workSheet = workBook.Sheets[sheetName];

            // Convert the existing worksheet to JSON
            const existingData = XLSX.utils.sheet_to_json(workSheet);

            // Append the new data
            const updatedData = existingData.concat(dataWithSpaces);

            // Update the existing worksheet with the updated data
            workSheet = XLSX.utils.json_to_sheet(updatedData);
            workBook.Sheets[sheetName] = workSheet;
        } else {
            // Create a new worksheet with the new data
            workSheet = XLSX.utils.json_to_sheet(dataWithSpaces);

            // Append the new worksheet to the workbook
            XLSX.utils.book_append_sheet(workBook, workSheet, sheetName);
        }
    } else {
        // Create a new workbook and worksheet if the file does not exist
        workBook = XLSX.utils.book_new();
        workSheet = XLSX.utils.json_to_sheet(dataWithSpaces);

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workBook, workSheet, sheetName);
    }

    // Write the workbook to the file
    XLSX.writeFile(workBook, filePath);
};

export const convertRoundDataToExcelData = (rounds: RoundJson[], idGame: string, cardPlayerPool: CardJson[], gameCount: number): (RoundJsonToTest | Record<string, string>)[] => {
    let totalScore = 0;

    return rounds.reduce<(RoundJsonToTest | Record<string, string>)[]>((arr, round, index) => {
        totalScore += round.score;

        let roundRs: RoundJsonToTest = {
            idGame: idGame + Date.now(),
            round: round.id,
            stats: JSON.stringify(round.stats),
            remainingStats: JSON.stringify(round.remainingStats),
            idealStat: JSON.stringify(round.idealStat),
            cardOpponentPool: JSON.stringify(round.cardOpponentPool?.map(({def_id, level}) => def_id + 'lvl' + level) || 'undefined'),
            cardOpponent: round.cardOpponent?.def_id + 'lvl' + round.cardOpponent?.level,
            cardOpponentStatPoint: round.cardOpponentStatPoint,
            cardPlayer: round.cardPlayer?.def_id &&round.cardPlayer?.def_id + 'lvl' + round.cardPlayer?.level,
            cardPlayerStatPoint: round.cardPlayerStatPoint,
            cardPlayerCanBeat: round.cardPlayerCanBeat?.def_id + 'lvl' + round.cardPlayerCanBeat?.level,
            difficultyEachRound: round.difficulty,
            isWin: round.isWin,
            score: round.score,
            totalScore: '',
            cardPlayerPool: ''
        }

        if(index === rounds.length - 1) {
            roundRs = {
                ...roundRs,
                totalScore: totalScore.toString()
            };
        }

        if(index === 0){
            roundRs = {
                index: gameCount,
                ...roundRs,
                cardPlayerPool: JSON.stringify(cardPlayerPool.map(({def_id, level}) => def_id + 'lvl' + level))
            }
        }

        arr.push(roundRs);

        return arr


    }, [])


}