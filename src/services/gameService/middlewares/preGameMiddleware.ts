import {BaseMiddleware, CardJson, PlayerJoinGame, PlayerJson, ResponseMiddleware, StatCard} from '../../../types';
import {randomInt} from 'crypto';
import {CARD_OPPONENT_LENGTH, INITIAL_TOLERANCE_RANGE} from "../../../constant";
import {getOpponentCardRandomList, rangeStatGamePlay} from "../../../utils";
import {EventJson, GameEventEmitter, GameJson, GameState, RoundJson} from "../../../types/game";
import {GameService} from "../index";
import {CardStore} from "../../../stores";


export const preGameMiddleware = (gameService: GameService, cardStore: CardStore, player: PlayerJoinGame, eventGame: EventJson) : GameJson => {
    console.log('LOG: Pre Game Middleware');
    const idGame = createIDGameMiddleware(eventGame.seedGame, player.cardsPlayGame, gameService);
    const cardOpponents = getOpponentCardMiddleware(cardStore.cards, player.cardsPlayGame);
    const roundGames = createRoundsOfGameMiddleware(player, cardOpponents, eventGame);

    const game: GameJson = {
        id: idGame,
        player,
        cardOpponents,
        rounds: roundGames,
        currentRound: 0,
        creatAt: new Date().toISOString(),
        state: 'ready',
    }

    console.log('LOG: Finish Pre Game Middleware', game.rounds);

    return game;
}

export const createIDGameMiddleware =  (seedEventId: string, cardsPlaySelected: CardJson[], gameService: GameService ): string => {

    const def_id_cards = cardsPlaySelected.map(card => card.def_id).sort();
    const idGame = gameService.createSeedGame(seedEventId, def_id_cards);

    console.log('LOG: '+ idGame + ' ID GAME');

    return idGame;
}

export const getOpponentCardMiddleware =  (cardsStore: CardJson[],  cardsPlaySelected: CardJson[]): CardJson[] => {

    const cardsPlayerRecord = cardsPlaySelected.reduce<Record<string, CardJson>>((record, card) => {
        record[card.def_id] = card;
        return record;
    }, {});

    const cardOpponent  = [...cardsStore.filter(card => !cardsPlayerRecord[card.def_id])];

    console.log('LOG: Card Opponent created successfully', cardOpponent.splice(0, 4));

    return cardOpponent;
}

export const createRoundsOfGameMiddleware =  ( player: PlayerJoinGame, cardOpponents: CardJson[], eventGame: EventJson): RoundJson[] => {
    const { stats: statsOfEvent, baseDifficulty, round: roundEvent } = eventGame;
    const rangeStat = rangeStatGamePlay(statsOfEvent, player.cardsPlayGame);
    const cardWasRemoved: string[] = [];
    const rounds: RoundJson[] = [];
    console.log('LOG: Creat stat of each round,  Rounds');

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
        const difficulty = baseDifficulty + (5 - round) * 0.5;
        const idealStat = calculateIdealStat(randomStats, difficulty, rangeStat);
        const cardOpponent = selectCardOpponentForEachRound(cardOpponents, randomStats, idealStat);
        const cardPlayerCanBeat = selectCardPlayerCanBeat(player.cardsPlayGame, cardOpponent, randomStats);



        rounds.push({
            id: round,
            stats: randomStats,
            state: 'idle',
            difficulty,
            idealStat,
            remainingStats: remainingStatsToShow,
            cardOpponent,
            cardPlayerCanBeat
        });
    }

        console.log('LOG: Add successful', rounds ,' _ Rounds');

        return  rounds;

}

export const calculateIdealStat = (stats: StatCard[], difficulty: number, rangeStat: Record<string, number[]>): Record<string, number> => {

    return stats.reduce<Record<string, number>>((record, stat) => {
        const [maxStat, minStat] = rangeStat[stat];
        record[stat] = minStat + (maxStat - minStat) * (difficulty / 10);
        return record;
    }, {});
}

const selectCardOpponentForEachRound = (cardOpponent: CardJson[], stats: StatCard[], idealStat: Record<string, number>) => {
    const cardOpponentSelected: CardJson[] = [];
    let toleranceRange = INITIAL_TOLERANCE_RANGE;

    while (cardOpponentSelected.length < CARD_OPPONENT_LENGTH) {
        getOpponentCardRandomList(cardOpponent, stats, idealStat, toleranceRange, cardOpponentSelected);
        toleranceRange += 1;
    }

    return cardOpponentSelected[randomInt(0, CARD_OPPONENT_LENGTH)];
}


const selectCardPlayerCanBeat =  (cardsPlayGame: CardJson[], cardOpponent: CardJson, stats: StatCard[]): CardJson| undefined => {
    const combineOpponentStat = stats.reduce((sumStat, stat) => sumStat + cardOpponent[stat] , 0);
    const cardPlayerCanBeats = cardsPlayGame.filter((card) => {
        const combinePlayerStat = stats.reduce((sumStat, stat) => sumStat + card[stat], 0);

        return combinePlayerStat > combineOpponentStat;
    });

    console.log('LOG: ', cardPlayerCanBeats ,'Card Player Can Beat ', cardOpponent, 'with stats: ', stats);
    let cardPlayerCanBeat = undefined;
    if (cardPlayerCanBeats.length !== 0) {
        console.log('LOG: Card Player Can Beat', cardPlayerCanBeat);
        return cardPlayerCanBeats[randomInt(0, cardPlayerCanBeats.length)];
    }



    return undefined;
}
