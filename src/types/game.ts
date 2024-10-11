import { PlayerJoinGame } from "./player";
import { CardJson, StatCard } from "./card";
import EventEmitter from "eventemitter3";



export interface GameJson {
    id: string,
    player: PlayerJoinGame,
    cardOpponents: CardJson[],
    rounds: RoundJson[],
    currentRound: number,
    creatAt: string,
    state: GameState,
    isWin?: boolean,
    event?: EventEmitter<GameEventEmitter>,
    bonusPoints?: BonusPoint[],
}

export interface BonusPoint {
    point: number,
    conditions: Record<string, string>
}

export interface GameEventEmitter {
    onRoundWin: (round: RoundJson, cardPlayerRemaining: CardJson[]) => void;
    onRoundLose: (round: RoundJson, cardPlayerRemaining: CardJson[]) => void;
    onReadyRound: (round: RoundJson) => void;
    onSelectedCard: (card: CardJson) => void;
    onGameFinished: (game: GameJson) => void;
}


export type GameState = 'finished' | 'active' | 'idle' | 'ready';
export type RoundState = 'finished' | 'active' | 'idle'| 'ready';

export interface RoundJson {
    id: number,
    stats: StatCard[],
    remainingStats: StatCard[],
    state: RoundState,
    difficulty: number,
    idealStat: Record<string, number>,
    cardOpponentPool?: CardJson[],
    timeEnd?: string,
    cardOpponent?: CardJson,
    cardOpponentStatPoint?: number,
    cardPlayerCanBeat?: CardJson,
    isWin?: boolean,
    score: number,
    cardPlayer?: CardJson,
    cardPlayerStatPoint?: number,
    cardPlayerPool?: CardJson[]
}

export interface EventJson {
    seedGame: string,
    round: number,
    baseDifficulty: number,
    dateEnd?: string,
    dateStart?: string,
    stats: StatCard[],
    gameRecord: Record<string, GameJson>
    bonusPoints?: BonusPoint[],
    opponentTeam?: string
}