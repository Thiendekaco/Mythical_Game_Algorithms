import {BaseMiddleware, CardJson, ResponseMiddleware, StatCard} from '../../../types';
import { randomInt } from 'crypto';
import {CARD_OPPONENT_LENGTH, INITIAL_TOLERANCE_RANGE} from "../../../constant";
import {getOpponentCardRandomList, rangeStatGamePlay} from "../../../utils";



export const preGameMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware) : ResponseMiddleware=> {

    const middlewares = [
        createIDGameMiddleware,
        getOpponentCardMiddleware,
        addStatEachRoundMiddleware,
        calculateIdealStatMiddleware,
        selectCardOpponentMiddleware,
        selectCardPlayerCanBeatMiddleware
    ];
    let response: ResponseMiddleware = {...responseOfPreMiddleware};

    for (const middleware of middlewares) {
        response = middleware(gameService, cardStore, response);
    }

    return response
}

export const createIDGameMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {
    const { game } = responseOfPreMiddleware;
    const { player } = game;

    const def_id_cards = player.cardsPlayGame.map(card => card.def_id).sort();
    game.id = gameService.createSeedGame(game.id, def_id_cards);

    console.log('LOG: '+ game.id + 'ID GAME');

    return {
        ...responseOfPreMiddleware,
        game: {...game}
    }
}

export const getOpponentCardMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {
    const { game } = responseOfPreMiddleware;
    const { player, cardOpponent  } = game;
    const cards = cardStore.cards;

    const cardsPlayerRecord = player.cardsPlayGame.reduce<Record<string, CardJson>>((record, card) => {
        record[card.def_id] = card;
        return record;
    }, {});

    game.cardOpponent  = [...cardOpponent.filter(card => !cardsPlayerRecord[card.def_id])];


    return {
        ...responseOfPreMiddleware,
        game: {...game}
    }
}

export const addStatEachRoundMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {
    const { game, statsOfEvent, baseDifficulty } = responseOfPreMiddleware;
    const { rounds } = game;

    console.log('LOG: Creat stat of each round, '+ rounds.length + 'Rounds');
    if (rounds.length > 0) {
        return responseOfPreMiddleware;
    } else {
        if (statsOfEvent.length === 0) {
            throw new Error('Stats of event is empty');
        }

        for(let round = 1; round <= game.rounds.length; round++){
            const randomStats: StatCard[] = [];
            if (round <= 2) {
                randomStats.push(statsOfEvent[randomInt(0, statsOfEvent.length)]);
            } else {
                while (randomStats.length < 2) {
                    const randomStat = statsOfEvent[randomInt(0, statsOfEvent.length)];
                    if (!randomStats.includes(randomStat)) {
                        randomStats.push(randomStat);
                    }
                }
            }

            const remainingStats = statsOfEvent.filter(stat => !randomStats.includes(stat));
            const remainingStatsToShow: StatCard[] = [];
            while (remainingStatsToShow.length < randomStats.length) {
                const randomStat = remainingStats[randomInt(0, remainingStats.length)];
                if (!remainingStatsToShow.includes(randomStat)) {
                    remainingStatsToShow.push(randomStat);
                }
            }

            console.log('LOG: '+ randomStats + 'Random Stats' + ', Remaining Stats to show' + remainingStatsToShow);
            game.rounds.push({
                stats: randomStats,
                state: 'idle',
                difficulty: baseDifficulty + (5 - round) * 0.5,
                idealStat: 0,
                remainingStats: remainingStatsToShow,
            });
        }



        return {
            ...responseOfPreMiddleware,
            game: {...game}
        };
    }

}


export const calculateIdealStatMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {
    const {game, statsOfEvent, currentRound} = responseOfPreMiddleware;
    const {rounds, player: { cardsPlayGame}} = game;
    const rangeStat = rangeStatGamePlay(statsOfEvent, cardsPlayGame);
    let newRounds = [...rounds];
    newRounds = rounds.map((round) => {

        const idealStat = round.stats.reduce((idealStat, stat) => {
            const [maxStat, minStat] = rangeStat[stat];
            const idealOfSingleStat = minStat + (maxStat - minStat) * (round.difficulty / 10);

            return idealStat + idealOfSingleStat;
        }, 0) / round.stats.length;

        console.log('LOG: '+ idealStat + 'Ideal Stat');


        return {
            ...round,
            idealStat
        }
    });


    return {
        ...responseOfPreMiddleware,
        game: {
            ...game,
            rounds: newRounds
        }
    }

}



export const selectCardOpponentMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {
    const {game, currentRound} = responseOfPreMiddleware;
    const {rounds, cardOpponent} = game;
    const newRounds = [...rounds];
    rounds.forEach(({ stats, idealStat}, index) => {
        let toleranceRange = INITIAL_TOLERANCE_RANGE;

        const cardOpponentSelected: CardJson[] = [];

        while (cardOpponentSelected.length < CARD_OPPONENT_LENGTH) {
            getOpponentCardRandomList(cardOpponent, stats, idealStat, toleranceRange, cardOpponentSelected);
            toleranceRange += 1;
        }

        newRounds[index].cardOpponent = cardOpponentSelected[randomInt(0, CARD_OPPONENT_LENGTH)];
    });

    return {
        ...responseOfPreMiddleware,
        game: {
            ...game,
            rounds: newRounds
        }
    }
}

export const selectCardPlayerCanBeatMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {
    const {game} = responseOfPreMiddleware;
    const {rounds, player: {cardsPlayGame}} = game;

    for (const round of rounds) {
        const { cardOpponent } = round;

        if (!cardOpponent) {
            throw new Error('Card opponent is not found');
        }
        const combineOpponentStat = round.stats.reduce((sumStat, stat) => sumStat + cardOpponent[stat], 0);

        const cardPlayerCanBeat = cardsPlayGame.filter((card) => {
           const combinePlayerStat = round.stats.reduce((sumStat, stat) => sumStat + card[stat], 0);

              return combinePlayerStat > combineOpponentStat
        });

        if (cardPlayerCanBeat.length === 0) {
            break;
        }


        round.cardPlayerCanBeat = cardPlayerCanBeat[randomInt(0, cardPlayerCanBeat.length)];
    }

    return {
        ...responseOfPreMiddleware,
        game: {
            ...game,
            rounds: [...rounds]
        }
    }
}
