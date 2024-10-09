import {BaseMiddleware, ResponseMiddleware} from "../../../types";
import {createPromiseHandler} from "../../../utils";



export const playGameMiddleware: BaseMiddleware =  async (gameService, cardStore, responseOfPreMiddleware) : Promise<ResponseMiddleware>=> {

    let response: ResponseMiddleware = {...responseOfPreMiddleware};
    const roundGames = response.game.rounds;
    const middlewaresOfEachRoundGame: BaseMiddleware[] = [selectCardPlayerToPlayRoundMiddleware, compareCardPlayerWithOpponentMiddleware, submitNextRoundMiddleware];
    const middlewares:  BaseMiddleware[] = [...roundGames.map(() => middlewaresOfEachRoundGame).flat()];
    console.log('LOG: Play Game Middleware')

        for (const middleware of middlewares) {
            try {
                response = await middleware(gameService, cardStore, response);
            } catch (e) {
                break;
            }

        }

    console.log('LOG: Finish Play Game Middleware');
    return response
}




export const selectCardPlayerToPlayRoundMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game } = responseOfPreMiddleware;
    const { player, cardOpponent, rounds, currentRound } = game;
    const { cardsPlayGame } = player;
    const { promise, resolve } = createPromiseHandler<ResponseMiddleware>();
    console.log('LOG: Waiting for player to select a card', 'Round', currentRound + 1);

    game.event?.on('onSelectedCard', (card) => {
        if (!player.cardsPlayGame.find((cardPlayer) => cardPlayer.def_id === card.def_id)) {
            throw new Error('Card already selected');
        }

        rounds[currentRound].cardPlayer = card;
        console.log('LOG: Player selected card', card, rounds[currentRound].state);

        if (rounds[currentRound].state === 'ready') {
            rounds[currentRound].state = 'active';
            resolve({
                ...responseOfPreMiddleware,
                game: {...game, rounds }
            })
        }

    });


    game.event?.emit('onReadyRound', game);

    return promise;
}

export const compareCardPlayerWithOpponentMiddleware: BaseMiddleware =  (gameService, cardStore, responseOfPreMiddleware): Promise<ResponseMiddleware> => {
    const { game } = responseOfPreMiddleware;
    const { rounds, currentRound } = game;
    const { promise, resolve, reject } = createPromiseHandler<ResponseMiddleware>();
    const round = rounds[currentRound];
    if (round.state === 'active' && round.cardPlayer && round.cardOpponent) {
        const statPlayer = round.stats.reduce((acc, stat) => round.cardPlayer ? acc + round.cardPlayer[stat] : acc, 0);
        const statOpponent = round.stats.reduce((acc, stat) => round.cardOpponent ? acc + round.cardOpponent[stat] : acc, 0);

        console.log('LOG: Compare card player with opponent', 'Player: ', statPlayer, ' vs Opponent: ', statOpponent);

        if (statPlayer > statOpponent) {
            console.log('LOG: Player win round ',currentRound + 1 );
            round.isWin = true;
            game.event?.emit('onRoundWind', game);
        } else {
            console.log('LOG: Player lose');
            round.isWin = false;
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
    const { game} = responseOfPreMiddleware;
    const { rounds, currentRound } = game;
    const { promise, resolve, reject } = createPromiseHandler<ResponseMiddleware>();
    const round = rounds[currentRound];

    if (round.state === 'active') {
        round.state = 'finished';
        if (currentRound === rounds.length - 1) {
            console.log('LOG: Game finished');
            game.state = 'finished';
            game.event?.emit('onGameFinished', game);
        } else if (!game.rounds[currentRound].isWin){
            game.state = 'finished';
            game.event?.emit('onGameFinished', game);
            reject('Player lose');
        } else {
            console.log('LOG: Ready next round');
            game.player.cardsPlayGame = game.player.cardsPlayGame.filter((card) => card !== round.cardPlayerCanBeat);
            console.log('LOG: Card Player Can Beat was removed', game.player.cardsPlayGame, '_', round.cardPlayerCanBeat);
            game.currentRound += 1;
            game.rounds[game.currentRound].state = 'ready';
        }
    }

    resolve({
        ...responseOfPreMiddleware,
        game: {...game, rounds}
    });

    return promise;
}