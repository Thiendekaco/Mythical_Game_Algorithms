import {CardJson, PlayerJoinGame, PlayerJson, ResponseMiddleware, StatCard} from "../../types";
import {BehaviorSubject, Subject} from "rxjs";
import { CardStore } from "../../stores/CardStore";
import {EventJson, GameEventEmitter, GameJson} from "../../types/game";
import {preGameMiddleware} from "./middlewares/preGameMiddleware";
import EventEmitter from "eventemitter3";
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
        const { seedGame, round, baseDifficulty, stats } = event;

        const responseOfPreMiddleware: ResponseMiddleware = {
            game: {
                id: seedGame,
                player,
                cardOpponent: [],
                rounds: [],
                creatAt: new Date().toISOString(),
                state: 'ready',
                currentRound: 0,
            },
            statsOfEvent: stats,
            currentRound: 0,
            roundEvent: round,
            baseDifficulty
        }


        const { game} =  await preGameMiddleware(this, this.#cardStore, responseOfPreMiddleware);
        this.#gameHandlers.next({
            ...this.gameHandlers,
            [game.id]: game
        })

        return game;

    }

    public async playGame(idGame: string, eventGame: EventJson):  Promise<EventEmitter<GameEventEmitter>> {
        const game = this.gameHandlers[idGame];
        const { baseDifficulty, stats } = eventGame;

        if (!game) {
            throw new Error('Game not found');
        }

        const event = new EventEmitter<GameEventEmitter>();
        game.event = event;

        const responseOfPreMiddleware: ResponseMiddleware = {
            game: { ...game},
            statsOfEvent: stats,
            roundEvent: game.rounds.length,
            currentRound: 0,
            baseDifficulty
        }

        await playGameMiddleware(this, this.#cardStore, responseOfPreMiddleware)



        game.event?.on('onRoundWind', (game) => {
            const currentRound = game.currentRound;
            game.rounds[currentRound].isWin = true;
            game.rounds[currentRound].state = 'finished';

            if (currentRound === game.rounds.length - 1) {
                game.state = 'finished';
            }

            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        game.event?.on('onRoundLose', () => {
            const currentRound = game.currentRound;
            game.rounds[currentRound].isWin = false;
            game.rounds[currentRound].state = 'finished';

            this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
        });

        game.event?.on('onReadyRound', (game) => {
          this.#gameHandlers.next({...this.gameHandlers, [idGame]: {...game}});
          console.log('LOG: Ready round', 'Round', game.currentRound, 'Please select a card', game.player.cardsPlayGame);
        });

        this.#gameHandlers.next({...this.gameHandlers, [idGame]: game});


        return event;
    }

    public selectCardToPlayEachRound(game: GameJson, defId: string): GameJson {
        const round = game.rounds[game.currentRound];
        const cardPlayerSelected = this.#cardStore.getCardById(defId);

        if(!cardPlayerSelected) {
            throw new Error('Card not found');
        }

        round.cardPlayer = cardPlayerSelected;
        round.state = 'active';

        if(game.event){
            game.event.emit('onSelectedCard', cardPlayerSelected);
        }

        return game;
    }

}