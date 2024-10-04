import {CardJson, PlayerJoinGame, PlayerJson} from "../../types";
import {BehaviorSubject, Subject} from "rxjs";
import { CardStore } from "../../stores/CardStore";
import {EventJson, GameJson} from "../../types/game";

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


    }

}