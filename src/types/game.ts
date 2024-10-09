import { PlayerJoinGame, PlayerJson } from "./player";
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
}

export interface GameEventEmitter {
    onRoundWin: (round: RoundJson, cardPlayerRemaining: CardJson[]) => void;
    onRoundLose: (round: RoundJson) => void;
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
    timeEnd?: string,
    cardOpponent?: CardJson,
    cardPlayerCanBeat?: CardJson,
    isWin?: boolean,
    cardPlayer?: CardJson,
}

export interface EventJson {
    seedGame: string,
    round: number,
    baseDifficulty: number,
    dateEnd?: string,
    dateStart?: string,
    stats: StatCard[],
    gameRecord: Record<string, GameJson>
}