
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {EventJson, GameJson} from "../../types/game";
import {GameService} from "../gameService";
import {CardPlayerStore} from "../../stores";
import {CardJson, PlayerJoinGame, PlayerJson} from "../../types";


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


    public startEvent(seedEvent: string, cardsSelected: CardJson[]) {
        const event = this.eventRecord[seedEvent];
        if (!event) {
            throw new Error('Event not found');
        }

        const player: PlayerJoinGame = {
            cards: this.cardPlayerStore.cards,
            cardsPlayGame: [],
            name: 'Something',
            score: 0,
        }
        player.cardsPlayGame = this.selectedCardsPlayerValidate(event, cardsSelected);
        this.createGameOfEvent(event, player);

    }

    private selectedCardsPlayerValidate(event: EventJson, cardsSelected: CardJson[]): CardJson[] {
        const roundNumber = event.round;

        if (cardsSelected.length === roundNumber + 1){
            throw new Error('You can not select more cards');
        }

        return cardsSelected;


    }

    private async createGameOfEvent(event: EventJson, player: PlayerJoinGame): Promise<EventJson> {
       const game = await this.gameService.readyStartGame(event, player);

       event.gameRecord[game.id] = game;

       this.eventRecord[event.seedGame] = event;
       this.events.next(this.eventRecord);

       return event;
    }

    public subscribeEvents(callback: (events: EventRecord) => void): void {
         this.events.subscribe(callback);
    }


}