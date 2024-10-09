import {BaseMiddleware, CardJson, ResponseMiddleware, StatCard} from '../../../types';
import { randomInt } from 'crypto';
import {CARD_OPPONENT_LENGTH, INITIAL_TOLERANCE_RANGE} from "../../../constant";
import {getOpponentCardRandomList, rangeStatGamePlay} from "../../../utils";



export const preGameMiddleware: BaseMiddleware =  async (gameService, cardStore, responseOfPreMiddleware) : Promise<ResponseMiddleware> => {

    const middlewares: BaseMiddleware[] = [
        createIDGameMiddleware,
        getOpponentCardMiddleware,
        addStatEachRoundMiddleware,
        calculateIdealStatMiddleware,
        selectCardOpponentMiddleware,
        selectCardPlayerCanBeatMiddleware
    ];
    let response: ResponseMiddleware = {...responseOfPreMiddleware};

    console.log('LOG: Pre Game Middleware', responseOfPreMiddleware);

    for (const middleware of middlewares) {
        response = await middleware(gameService, cardStore, response);
    }

    console.log('LOG: Finish Pre Game Middleware');
    return response;
}

export const createIDGameMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game } = responseOfPreMiddleware;
    const { player } = game;

    const def_id_cards = player.cardsPlayGame.map(card => card.def_id).sort();
    game.id = gameService.createSeedGame(game.id, def_id_cards);

    console.log('LOG: '+ game.id + 'ID GAME');

    return Promise.resolve({
    ...responseOfPreMiddleware,
            game: {...game}
    });
}

export const getOpponentCardMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game } = responseOfPreMiddleware;
    const { player, cardOpponent  } = game;
    const cards = cardStore.cards;

    const cardsPlayerRecord = player.cardsPlayGame.reduce<Record<string, CardJson>>((record, card) => {
        record[card.def_id] = card;
        return record;
    }, {});

    game.cardOpponent  = [...cards.filter(card => !cardsPlayerRecord[card.def_id])];

    console.log('LOG: Card Opponent created successfully', game.cardOpponent.splice(0, 4));

    return Promise.resolve({
        ...responseOfPreMiddleware,
        game: {...game}
    });
}

export const addStatEachRoundMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware):  Promise<ResponseMiddleware> => {
    const { game, statsOfEvent, baseDifficulty, roundEvent } = responseOfPreMiddleware;
    const { rounds } = game;

    console.log('LOG: Creat stat of each round,  Rounds');
    if (rounds.length > 0) {
        return Promise.resolve(responseOfPreMiddleware);
    } else {
        if (statsOfEvent.length === 0) {
            throw new Error('Stats of event is empty');
        }

        for(let round = 1; round <= roundEvent; round++){
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

            console.log('LOG: ', randomStats ,' Random Stats' + ', Remaining Stats to show: ', remainingStatsToShow,' Round: ', round);
            game.rounds.push({
                stats: randomStats,
                state: 'idle',
                difficulty: baseDifficulty + (5 - round) * 0.5,
                idealStat: 0,
                remainingStats: remainingStatsToShow,
            });
        }

        console.log('LOG: Add successful', game.rounds.toString() ,' _ Rounds');

        return  Promise.resolve({
            ...responseOfPreMiddleware,
            game: {...game}
        });
    }

}


export const calculateIdealStatMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware):  Promise<ResponseMiddleware> => {
    const {game, statsOfEvent, currentRound} = responseOfPreMiddleware;
    const {rounds, player: { cardsPlayGame}} = game;
    const rangeStat = rangeStatGamePlay(statsOfEvent, cardsPlayGame);
    let newRounds = [...rounds];
    newRounds = rounds.map((round, index) => {

        const idealStat = round.stats.reduce((idealStat, stat) => {
            const [maxStat, minStat] = rangeStat[stat];
            const idealOfSingleStat = minStat + (maxStat - minStat) * (round.difficulty / 10);

            return idealStat + idealOfSingleStat;
        }, 0) / round.stats.length;

        console.log('LOG: '+ idealStat + ' Ideal Stat Of Each Round _ Round ', round);


        return {
            ...round,
            idealStat
        }
    });

    console.log('LOG: ', newRounds ,' Ideal Stat Of Each Round');

    return Promise.resolve({
        ...responseOfPreMiddleware,
        game: {
            ...game,
            rounds: newRounds
        }
    });

}



export const selectCardOpponentMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware):  Promise<ResponseMiddleware> => {
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

        console.log('LOG: ', cardOpponentSelected , 'List Card Opponent Selected');
        newRounds[index].cardOpponent = cardOpponentSelected[randomInt(0, CARD_OPPONENT_LENGTH)];
        console.log('LOG: ', newRounds[index].cardOpponent , 'Card Opponent Selected');
    });

    return Promise.resolve({
        ...responseOfPreMiddleware,
        game: {
            ...game,
            rounds: newRounds
        }
    });
}

export const selectCardPlayerCanBeatMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware):  Promise<ResponseMiddleware> => {
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

        console.log('LOG: ', cardPlayerCanBeat ,'Card Player Can Beat');

        if (cardPlayerCanBeat.length === 0) {
            break;
        }


        round.cardPlayerCanBeat = cardPlayerCanBeat[randomInt(0, cardPlayerCanBeat.length)];

        console.log('LOG: ', round.cardPlayerCanBeat ,'Card Player Can Beat was selected to remove after round win');
    }

    return Promise.resolve({
        ...responseOfPreMiddleware,
        game: {
            ...game,
            rounds: [...rounds]
        }
    });
}
