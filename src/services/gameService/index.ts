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

    public async playGame(game: GameJson): Promise<void> {
        const { id: idGame } = game;

        if (!game) {
            throw new Error('Game not found');
        }



        game.event?.on('onRoundWin', (round, cardPlayerRemaining) => {
            game.rounds[round.id - 1] = round;
            game.player.cardsPlayGame = cardPlayerRemaining;
            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        game.event?.on('onRoundLose', (round) => {
            game.rounds[round.id - 1] = round;
            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        game.event?.on('onReadyRound', (round) => {
            game.rounds[round.id - 1] = round;
            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        await playGameMiddleware(game)

        this.#gameHandlers.next({...this.gameHandlers, [idGame]: game});
    }

    public selectCardToPlayEachRound(game: GameJson, defId: string): GameJson {
        const cardPlayerSelected = this.#cardStore.getCardById(defId);

        if(!cardPlayerSelected) {
            throw new Error('Card not found');
        }

        if(game.event){
            game.event.emit('onSelectedCard', cardPlayerSelected);
        }

        return game;
    }

}