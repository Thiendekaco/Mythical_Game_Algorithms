import {BehaviorSubject} from "rxjs";
import {EventJson, GameEventEmitter, GameJson} from "../../types/game";
import {GameService} from "../gameService";
import {CardPlayerStore} from "../../stores";
import {CardJson, PlayerJoinGame} from "../../types";
import {EventEmitter} from "eventemitter3";


type EventRecord = Record<string, EventJson>

export class EventService {
    private gameService: GameService;
    private cardPlayerStore: CardPlayerStore;
    private events = new BehaviorSubject<EventRecord>({});


    constructor(gameService: GameService) {
        this.gameService = gameService;
        this.cardPlayerStore = new CardPlayerStore();
    }

    public createNewEvent(event: EventJson) {
        const eventRecord = this.events.getValue();
        this.events.next( {
            ...eventRecord,
            [event.seedGame]: event
        });
    }

    public get eventRecord(): EventRecord {
        return {...this.events.getValue()};
    }


    public async startEvent(seedEvent: string, cardsSelected: CardJson[], player: PlayerJoinGame) {
        console.log('LOG: Event record', this.eventRecord);
        const event = this.eventRecord[seedEvent];
        if (!event) {
            throw new Error('Event not found');
        }

        player.cardsPlayGame = this.selectedCardsPlayerValidate(event, cardsSelected);
        return await this.createGameOfEvent(event, player);
    }

    public playEvent(seedEvent: string, game: GameJson): EventEmitter<GameEventEmitter> {

        const event = this.eventRecord[seedEvent];
        if (!event) {
            throw new Error('Event not found');
        }

        if (!event.gameRecord[game.id]) {
            throw new Error('Game not found');
        }

        if (game.state === 'finished') {
            throw new Error('Game is finished');
        }

        if (game.state === 'active') {
            throw new Error('Game is active');
        }

        if (game.currentRound === event.round) {
            throw new Error('Game is in the last round');
        }

        if(!game.event) {
            game.event = new EventEmitter<GameEventEmitter>();
        }

        this.gameService.playGame(game).then(() => console.log('Game is finished'));

        return game.event;
    }

    private selectedCardsPlayerValidate(event: EventJson, cardsSelected: CardJson[]): CardJson[] {
        const roundNumber = event.round;

        if (cardsSelected.length !== roundNumber + 1){
            throw new Error('You can not select more cards');
        }

        return cardsSelected;


    }

    private async createGameOfEvent(event: EventJson, player: PlayerJoinGame): Promise<GameJson> {
       const game = await this.gameService.readyStartGame(event, player);

       event.gameRecord[game.id] = game;

       this.eventRecord[event.seedGame] = event;
       this.events.next(this.eventRecord);

       return game;
    }

    public subscribeEvents(callback: (events: EventRecord) => void): void {
         this.events.subscribe(callback);
    }


}