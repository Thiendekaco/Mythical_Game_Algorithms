import {CardJson, PlayerJoinGame, PlayerJson, ResponseMiddleware, StatCard} from "../../types";
import {BehaviorSubject, Subject} from "rxjs";
import { CardStore } from "../../stores/CardStore";
import {EventJson, GameEventEmitter, GameJson} from "../../types/game";
import {preGameMiddleware} from "./middlewares/preGameMiddleware";
import {EventEmitter} from "eventemitter3";
import {playGameMiddleware} from "./middlewares/playGameMiddleware";

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

    public get gameHandlers(): GameRecord {
        return {...this.#gameHandlers.getValue()};
    }

    public async readyStartGame (event: EventJson, player: PlayerJoinGame): Promise<GameJson> {

        const game =  preGameMiddleware(this, this.#cardStore, player, event);
        this.#gameHandlers.next({
            ...this.gameHandlers,
            [game.id]: game
        })

        return game;

    }

    public async playGame(game: GameJson, eventGame: EventJson): Promise<void> {
        const { baseDifficulty, stats } = eventGame;
        const { id: idGame } = game;

        if (!game) {
            throw new Error('Game not found');
        }


        const responseOfPreMiddleware: ResponseMiddleware = {
            game,
            statsOfEvent: stats,
            roundEvent: game.rounds.length,
            baseDifficulty
        }


        game.event?.on('onRoundWind', (game) => {
            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        game.event?.on('onRoundLose', (game) => {
            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        game.event?.on('onReadyRound', (game) => {
          this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        await playGameMiddleware(this, this.#cardStore, responseOfPreMiddleware)

        this.#gameHandlers.next({...this.gameHandlers, [idGame]: game});
    }

    public selectCardToPlayEachRound(game: GameJson, defId: string): GameJson {
        const round = game.rounds[game.currentRound];
        const cardPlayerSelected = this.#cardStore.getCardById(defId);

        if(!cardPlayerSelected) {
            throw new Error('Card not found');
        }


        round.cardPlayer = cardPlayerSelected;
        round.state = 'ready';

        if(game.event){
            game.event.emit('onSelectedCard', cardPlayerSelected);
        }

        return game;
    }

}