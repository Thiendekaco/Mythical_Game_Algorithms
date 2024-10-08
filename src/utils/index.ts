import {CardJson, StatCard} from "../types";
import {CARD_OPPONENT_LENGTH} from "../constant";

export const rangeStatGamePlay = (stats: StatCard[], card: CardJson[]): Record<string, number[]> => {

    return stats.reduce<Record<string, number[]>>((record, stat) => {
        let maxState = card[0][stat];
        let minState = card[0][stat];
        card.forEach((card) => {
            maxState = Math.max(maxState, card[stat]);
            minState = Math.min(minState, card[stat]);
        })


        record[stat] = [maxState, minState];

        return record;
    }, {});
}

export const getOpponentCardRandomList = (cardOpponent: CardJson[], stats: StatCard[], idealStat: number, toleranceRange: number, cardsSelected: CardJson[]): CardJson[] => {

    for (const card of cardOpponent) {
        const sumStat = stats.reduce((sumStat, stat) => sumStat + card[stat], 0);
        const diff = Math.abs(sumStat - idealStat);

        if (diff <= toleranceRange && !cardsSelected.includes(card)) {
            cardsSelected.push(card);
        }

        if (cardsSelected.length === CARD_OPPONENT_LENGTH) {
            break;
        }
    }


    return cardsSelected;
}