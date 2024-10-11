import {CardJson, PlayerJoinGame} from "../../../types";
import {createPromiseHandler, isSameString} from "../../../utils";
import {GameEventEmitter, GameJson, RoundJson} from "../../../types/game";
import EventEmitter from "eventemitter3";


export const playGameMiddleware =  async (game: GameJson) : Promise<void> => {
    const { player, rounds, event } = game;
    console.log('LOG: Play Game Middleware');

    game.currentRound = 1;
    while (game.currentRound <= rounds.length) {
        let round: RoundJson = {...rounds[game.currentRound - 1]};
        round.state = 'ready';
        round.cardPlayer =  await selectCardPlayerToPlayRoundMiddleware(player, round, event);
        round.state = 'active';
        round = await compareCardPlayerWithOpponentMiddleware(round);

        if(round.isWin && game.bonusPoints) {
            game.bonusPoints.forEach((bonus) => {
                const isBonusRound = Object.keys(bonus.conditions).every((stat) => round.cardPlayer ? isSameString(round.cardPlayer[stat as keyof CardJson], bonus.conditions[stat])  : false);
                if (isBonusRound) {
                    round.score += bonus.point * round.score;
                }
            })
        }

        console.log('LOG: Score reward', round.score, game.currentRound);
        if (round.state === 'active') {
            round.state = 'finished';
            game.player.score += round.score;
            game.rounds[game.currentRound - 1] = round;

            if (game.currentRound === rounds.length ) {
                console.log('LOG: Game finished');
                game.state = 'finished';
                if(round.isWin){
                    event?.emit('onRoundWin', round, player.cardsPlayGame);
                } else {
                    event?.emit('onRoundLose', round, player.cardsPlayGame);
                }
                event?.emit('onGameFinished', game);
                break;
            } else {
                console.log('LOG: Ready next round');
                player.cardsPlayGame = player.cardsPlayGame.filter((card) => card.def_id !== round.cardPlayer?.def_id);
                console.log('LOG: Card Player Can Beat was removed', game.player.cardsPlayGame, '_', round.cardPlayer?.def_id);
                if(round.isWin){
                    event?.emit('onRoundWin', round, player.cardsPlayGame);
                } else {
                    event?.emit('onRoundLose', round, player.cardsPlayGame);
                }
                ++game.currentRound;
            }

        }
    }

    console.log('LOG: Finish Play Game Middleware');
}




export const selectCardPlayerToPlayRoundMiddleware =  async (player: PlayerJoinGame, round: RoundJson, event?: EventEmitter<GameEventEmitter>): Promise<CardJson> => {
    const { promise, resolve } = createPromiseHandler<CardJson>();
    console.log('LOG: Waiting for player to select a card', 'Round', round.id);

    const cb = (card: CardJson) => {
        if (!player.cardsPlayGame.find((cardPlayer) => cardPlayer.def_id === card.def_id)) {
            throw new Error('Card already selected');
        }

        console.log('LOG: Player selected card', card, round.state);

        if (round.state === 'ready') {
            resolve(card);
        }
    }
    event?.on('onSelectedCard', cb);


    event?.emit('onReadyRound', round);

    return promise.then((card) => {
        event?.removeListener('onSelectedCard', cb);
        return card;
    });
}

export const compareCardPlayerWithOpponentMiddleware=  (round: RoundJson): Promise<RoundJson> => {
    const { promise, resolve, reject } = createPromiseHandler<RoundJson>();
    if (round.state === 'active' && round.cardPlayer && round.cardOpponent) {
        round.cardPlayerStatPoint = round.stats.reduce((acc, stat) => round.cardPlayer ? acc + round.cardPlayer[stat] : acc, 0);
        round.cardOpponentStatPoint = round.stats.reduce((acc, stat) => round.cardOpponent ? acc + round.cardOpponent[stat] : acc, 0);

        console.log('LOG: Compare card player with opponent', 'Player: ', round.cardPlayerStatPoint, ' vs Opponent: ', round.cardOpponentStatPoint);

        if ( round.cardPlayerStatPoint >= round.cardOpponentStatPoint) {
            console.log('LOG: Player win round ', round.id);
            round.isWin = true;
            round.score = round.cardPlayerStatPoint;
        } else {
            console.log('LOG: Player lose');
            round.isWin = false;
        }
    }

    resolve({...round});

    return promise;
}
