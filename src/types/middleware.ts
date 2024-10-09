import {GameService} from "../services/gameService";
import {GameJson} from "./game";
import {PlayerJoinGame} from "./player";
import {CardJson, StatCard} from "./card";
import {CardStore} from "../stores";


export interface ResponseMiddleware {
    game: GameJson;
    statsOfEvent: StatCard[];
    baseDifficulty: number;
    roundEvent: number;
}



export type BaseMiddleware = (game: GameService, cardStore: CardStore, ResponseMiddleware: ResponseMiddleware ) => Promise<ResponseMiddleware>;