import {BaseMiddleware, ResponseMiddleware} from "../../../types";
import {createPromiseHandler} from "../../../utils";



export const playGameMiddleware: BaseMiddleware =  async (gameService, cardStore, responseOfPreMiddleware) : Promise<ResponseMiddleware>=> {

    let response: ResponseMiddleware = {...responseOfPreMiddleware};
    const roundGames = response.game.rounds;
    const middlewaresOfEachRoundGame: BaseMiddleware[] = [selectCardPlayerToPlayRoundMiddleware, compareCardPlayerWithOpponentMiddleware, submitNextRoundMiddleware];
    const middlewares:  BaseMiddleware[] = [...roundGames.map(() => middlewaresOfEachRoundGame).flat()];
    console.log('LOG: Play Game Middleware', responseOfPreMiddleware);
    for (const middleware of middlewares) {
        response = await middleware(gameService, cardStore, response);
    }
    console.log('LOG: Finish Play Game Middleware');
    return response
}




export const selectCardPlayerToPlayRoundMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game, currentRound } = responseOfPreMiddleware;
    const { player, cardOpponent, rounds } = game;
    const { cardsPlayGame } = player;
    const { promise, resolve } = createPromiseHandler<ResponseMiddleware>();
    console.log('LOG: Waiting for player to select a card', 'Round', currentRound, 'Please select a card', cardsPlayGame);

    game.event?.on('onSelectedCard', (card) => {
        if (!player.cardsPlayGame.includes(card)) {
            throw new Error('Card already selected');
        }

        rounds[currentRound].cardPlayer = card;
        console.log('LOG: Player selected card', card);

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

        console.log('LOG: Compare card player with opponent', 'Player: ', statPlayer, 'Opponent: ', statOpponent);

        if (statPlayer > statOpponent) {
            console.log('LOG: Player win');
            round.isWin = true;
            game.event?.emit('onRoundWind', game);
        } else {
            console.log('LOG: Player lose');
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
            console.log('LOG: Game finished');
            game.state = 'finished';
        } else {
            console.log('LOG: Ready next round');
            console.log('LOG: Round', currentRound, 'Please select a card', game.player.cardsPlayGame);
            game.player.cardsPlayGame.filter((card) => card !== round.cardPlayerCanBeat);
            console.log('LOG: Card Player Can Beat was removed', game.player.cardsPlayGame, '_', round.cardPlayerCanBeat);
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