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
    cardOpponentStatePoint?: number,
    cardOpponentPool?: string,
    cardPlayerCanBeat?: string,
    cardPlayerStatePoint?: number,
    isWin?: boolean,
    score: number,
    totalScore?: number,
    cardPlayer?: string,
}


export const writeTestResultToExcel = (filePath: string, newData: any[]) => {
    let workBook;
    let workSheet;

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the existing workbook
        workBook = XLSX.readFile(filePath);
        workSheet = workBook.Sheets['Test case 4'];

        // Convert the existing worksheet to JSON
        const existingData = XLSX.utils.sheet_to_json(workSheet);
        // Append the new data
        const updatedData = existingData.concat(newData);

        // Create a new worksheet with the updated data
        workSheet = XLSX.utils.json_to_sheet(updatedData);
        workBook.Sheets['Test case 4'] = workSheet;
    } else {
        // Create a new workbook and worksheet if the file does not exist
        workBook = XLSX.utils.book_new();
        workSheet = XLSX.utils.json_to_sheet(newData);
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workBook, workSheet, 'Test case 4');
    }

    // Write the workbook to the file
    XLSX.writeFile(workBook, filePath);
};

export const convertRoundDataToExcelData = (rounds: RoundJson[], idGame: string, gameCount: number): RoundJsonToTest[] => {
    let totalScore = 0;

    return rounds.map<RoundJsonToTest>((round, index) => {
        totalScore += round.score;

        let roundRs: RoundJsonToTest = {
            idGame: idGame + Date.now(),
            round: round.id,
            stats: JSON.stringify(round.stats),
            remainingStats: JSON.stringify(round.remainingStats),
            idealStat: JSON.stringify(round.idealStat),
            cardOpponentPool: JSON.stringify(round.cardOpponentPool?.map(({def_id, level}) => def_id + 'lvl' + level) || 'undefined'),
            cardOpponent: round.cardOpponent?.def_id + 'lvl' + round.cardOpponent?.level,
            cardOpponentStatePoint: round.cardOpponentStatePoint,
            cardPlayer: round.cardPlayer?.def_id &&round.cardPlayer?.def_id + 'lvl' + round.cardPlayer?.level,
            cardPlayerStatePoint: round.cardPlayerStatePoint,
            cardPlayerCanBeat: round.cardPlayerCanBeat?.def_id + 'lvl' + round.cardPlayerCanBeat?.level,
            difficultyEachRound: round.difficulty,
            isWin: round.isWin,
            score: round.score
        }

        if(index === 0){
            roundRs = {
                index: gameCount,
                ...roundRs
            }
        }

        if(index === rounds.length - 1) {
            roundRs.totalScore = totalScore;
        }


        return roundRs


    })


}