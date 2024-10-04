import {BaseMiddleware, CardJson, ResponseMiddleware, StatCard} from '../../../types';
import { randomInt } from 'crypto';



export const preGameMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware) : ResponseMiddleware=> {

    const middlewares = [ createIDGameMiddleware, getOpponentCardMiddleware];
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

            console.log('LOG: '+ randomStats + 'Random Stats');
            game.rounds.push({
                stats: randomStats,
                state: 'idle',
                difficulty: baseDifficulty
            });
        }



        return {
            ...responseOfPreMiddleware,
            game: {...game}
        };
    }

}


export const calculateMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): ResponseMiddleware => {

}