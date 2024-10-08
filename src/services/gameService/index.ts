import {CardJson, PlayerJoinGame, PlayerJson, ResponseMiddleware, StatCard} from "../../types";
import {BehaviorSubject, Subject} from "rxjs";
import { CardStore } from "../../stores/CardStore";
import {EventJson, GameJson} from "../../types/game";
import {preGameMiddleware} from "./middlewares/preGameMiddleware";

type GameRecord = Record<string, GameJson>
export class GameService {
    #cardStore: CardStore;
    #gameHandlers = new BehaviorSubject<GameRecord>({});

    constructor() {
        this.#cardStore = new CardStore();
    }

    subscribeGameHandlers(callback: (gameHandlers: GameRecord) => void) {
        this.#gameHandlers.subscribe(callback);
    }

    public createSeedGame( idGame: string, cardSelected: string[]) {
        return idGame + cardSelected.join('');

    }

    public startGame(event: EventJson, player: PlayerJoinGame): GameJson {
        const { seedGame, round, baseDifficulty, stats, gameRecord } = event;

        const responseOfPreMiddleware: ResponseMiddleware = {
            game: {
                id: seedGame,
                player,
                cardOpponent: [],
                rounds: [],
                creatAt: new Date().toISOString(),
                state: 'ready'
            },
            statsOfEvent: stats,
            currentRound: 0,
            baseDifficulty
        }


        const { game} = preGameMiddleware(this, this.#cardStore, responseOfPreMiddleware);

        return game;

    }

}