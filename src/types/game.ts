import { PlayerJoinGame, PlayerJson } from "./player";
import { CardJson, StatCard } from "./card";



export interface GameJson {
    id: string,
    player: PlayerJoinGame,
    cardOpponent: CardJson[],
    rounds: RoundJson[],
    creatAt: string,
    state: GameState,
    isWin?: boolean,
}

export type GameState = 'finished' | 'active' | 'idle' | 'ready';
export type RoundState = 'finished' | 'active' | 'idle';

export interface RoundJson {
    stats: StatCard[],
    remainingStats: StatCard[],
    state: RoundState,
    difficulty: number,
    idealStat: number,
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