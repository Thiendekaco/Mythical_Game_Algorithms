import {BaseMiddleware, ResponseMiddleware} from "../../../types";
import {createPromiseHandler} from "../../../utils";



export const playGameMiddleware: BaseMiddleware =  async (gameService, cardStore, responseOfPreMiddleware) : Promise<ResponseMiddleware>=> {

    let response: ResponseMiddleware = {...responseOfPreMiddleware};
    const roundGames = response.game.rounds;
    const middlewaresOfEachRoundGame: BaseMiddleware[] = [selectCardPlayerToPlayRoundMiddleware, compareCardPlayerWithOpponentMiddleware, submitNextRoundMiddleware];
    const middlewares:  BaseMiddleware[] = [...roundGames.map(() => middlewaresOfEachRoundGame).flat()];

    for (const middleware of middlewares) {
        response = await middleware(gameService, cardStore, response);
    }

    return response
}




export const selectCardPlayerToPlayRoundMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game, currentRound } = responseOfPreMiddleware;
    const { player, cardOpponent, rounds } = game;
    const { cardsPlayGame } = player;
    const { promise, resolve } = createPromiseHandler<ResponseMiddleware>();


    game.event?.on('onSelectedCard', (card) => {
        if (!player.cardsPlayGame.includes(card)) {
            throw new Error('Card already selected');
        }

        rounds[currentRound].cardPlayer = card;

        if (rounds[currentRound].state === 'ready') {
            rounds[currentRound].state = 'active';
            resolve({
                ...responseOfPreMiddleware,
                game: {...game, rounds }
            })
        }

    });

    return promise;
}

export const compareCardPlayerWithOpponentMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game, currentRound } = responseOfPreMiddleware;
    const { rounds } = game;
    const { promise, resolve, reject } = createPromiseHandler<ResponseMiddleware>();
    const round = rounds[currentRound];
    if (round.state === 'active' && round.cardPlayer && round.cardOpponent) {
        const statPlayer = round.stats.reduce((acc, stat) => round.cardPlayer ? acc + round.cardPlayer[stat] : acc, 0);
        const statOpponent = round.stats.reduce((acc, stat) => round.cardOpponent ? acc + round.cardOpponent[stat] : acc, 0);

        if (statPlayer > statOpponent) {
            round.isWin = true;
            game.event?.emit('onRoundWind', game);
        } else {
            round.isWin = false;
            reject(new Error('Player lose'));
            game.event?.emit('onRoundLose', game);
        }
    }

    resolve({
        ...responseOfPreMiddleware,
        game: {...game, rounds}
    });

    return promise;
}

export const submitNextRoundMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game, currentRound } = responseOfPreMiddleware;
    const { rounds } = game;
    const { promise, resolve } = createPromiseHandler<ResponseMiddleware>();
    const round = rounds[currentRound];

    if (round.state === 'active') {
        round.state = 'finished';
        if (currentRound === rounds.length - 1) {
            game.state = 'finished';
        } else {
            game.player.cardsPlayGame.filter((card) => card !== round.cardPlayer);
            game.currentRound += 1;
            game.rounds[game.currentRound].state = 'ready';
            game.event?.emit('onReadyRound', game);
        }
    }

    resolve({
        ...responseOfPreMiddleware,
        game: {...game, rounds}
    });

    return promise;
}