import {CardJson, PlayerJoinGame, StatCard} from '../../../types';
import {randomInt} from 'crypto';
import {CARD_OPPONENT_LENGTH, INITIAL_TOLERANCE_RANGE} from "../../../constant";
import {getOpponentCardRandomList, rangeStatGamePlay} from "../../../utils";
import {EventJson, GameJson, RoundJson} from "../../../types/game";
import {GameService} from "../index";
import {CardStore} from "../../../stores";


export const preGameMiddleware = (gameService: GameService, cardStore: CardStore, player: PlayerJoinGame, eventGame: EventJson) : GameJson => {
    console.log('LOG: Pre Game Middleware');
    const creatAt = new Date().toISOString();
    const idGame = createIDGameMiddleware(eventGame.seedGame, player.cardsPlayGame, creatAt, gameService);
    const cardOpponents = getOpponentCardMiddleware(cardStore.cards, player.cardsPlayGame, eventGame.opponentTeam);
    const roundGames = createRoundsOfGameMiddleware(player, cardOpponents, eventGame);

    const game: GameJson = {
        id: idGame,
        player,
        cardOpponents,
        rounds: roundGames,
        currentRound: 0,
        creatAt,
        state: 'ready',
        bonusPoints: eventGame.bonusPoints,
    }

    console.log('LOG: Finish Pre Game Middleware', game.rounds);

    return game;
}

export const createIDGameMiddleware =  (seedEventId: string, cardsPlaySelected: CardJson[], creatAt: string, gameService: GameService ): string => {

    const def_id_cards = cardsPlaySelected.map(card => card.def_id).sort();
    const idGame = gameService.createSeedGame(seedEventId, def_id_cards);

    console.log('LOG: '+ idGame + ' ID GAME');

    return idGame;
}

export const getOpponentCardMiddleware =  (cardsStore: CardJson[],  cardsPlaySelected: CardJson[], opponentTeam?: string): CardJson[] => {

    const cardsPlayerRecord = cardsPlaySelected.reduce<Record<string, CardJson>>((record, card) => {
        record[card.def_id] = card;
        return record;
    }, {});

    const cardOpponent  = [...cardsStore.filter(card => !cardsPlayerRecord[card.def_id] &&(!opponentTeam || card.team === opponentTeam))];

    console.log('LOG: Card Opponent created successfully', cardOpponent.splice(0, 4));

    return cardOpponent;
}

export const createRoundsOfGameMiddleware =  ( player: PlayerJoinGame, cardOpponents: CardJson[], eventGame: EventJson): RoundJson[] => {
    const { stats: statsOfEvent, baseDifficulty, round: roundEvent } = eventGame;
    const cardsPlayer = [...player.cardsPlayGame];
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
        const difficulty = baseDifficulty + (roundEvent - round) * 0.5;
        const rangeStat = rangeStatGamePlay(randomStats, cardsPlayer);
        const idealStat = calculateIdealStat(randomStats, difficulty, rangeStat);
        const cardOpponent = selectCardOpponentForEachRound(cardOpponents, randomStats, idealStat, rangeStat);
        const cardPlayerCanBeat = selectCardPlayerCanBeat(cardsPlayer, cardOpponent, randomStats);
        if (cardPlayerCanBeat) {
            cardsPlayer.splice(cardsPlayer.indexOf(cardPlayerCanBeat), 1);
        }

        rounds.push({
            id: round,
            stats: randomStats,
            state: 'idle',
            difficulty,
            idealStat,
            score: 0,
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

const selectCardOpponentForEachRound = (cardOpponents: CardJson[], stats: StatCard[], idealStat: Record<string, number>, rangeStat: Record<string, number[]>) => {
    const cardOpponentSelected: CardJson[] = [];
    let toleranceRange = INITIAL_TOLERANCE_RANGE;

    while (cardOpponentSelected.length < CARD_OPPONENT_LENGTH) {
        getOpponentCardRandomList(cardOpponents, stats, idealStat, toleranceRange, cardOpponentSelected, rangeStat);
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

    console.log('LOG: ', cardPlayerCanBeats ,'Card Player Can Beat ', cardOpponent, 'with stats: ', stats, 'remaining cards: ', cardsPlayGame);
    if (cardPlayerCanBeats.length !== 0) {
        return cardPlayerCanBeats[randomInt(0, cardPlayerCanBeats.length)];
    }



    return undefined;
}
