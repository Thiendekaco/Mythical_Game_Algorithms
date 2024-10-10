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

export const getOpponentCardRandomList = (cardOpponent: CardJson[], stats: StatCard[], idealStat: Record<string, number>, toleranceRange: number, cardsSelected: CardJson[], rangeStat: Record<string, number[]>): CardJson[] => {

    for (const card of cardOpponent) {

        if (cardsSelected.includes(card)) {
            continue;
        }

        const isCardOpponentSuitable = stats.every((stat) => {
            const diff = Math.abs(card[stat] - idealStat[stat]);
            return diff <= toleranceRange && card[stat] <= rangeStat[stat][0];
        })

        if (isCardOpponentSuitable) {
            cardsSelected.push(card);
        }

        if (cardsSelected.length === CARD_OPPONENT_LENGTH) {
            break;
        }
    }


    return cardsSelected;
}

export function createPromiseHandler<T> () {
    let _resolve: (value: T) => void = () => {
        console.warn('This promise handler is not implemented');
    };

    let _reject: (reason?: unknown) => void = () => {
        console.warn('This promise handler is not implemented');
    };

    const promise = new Promise<T>((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    });

    return {
        resolve: _resolve,
        reject: _reject,
        promise
    };
}

export type PromiseHandler<T> = ReturnType<typeof createPromiseHandler<T>>;


export function isSameString(arr1: any | string, arr2: string): boolean {
    return arr2.toLowerCase().includes((arr1 as string).toLowerCase());
}