// test/game.test.ts
import { EventService } from "../src/services/eventGameService";
import {CardJson, PlayerJoinGame, StatCard} from '../src/types';
import {GameService} from "../src/services/gameService";
import {EventJson, GameEventEmitter, GameJson} from "../src/types/game";
import {CardPlayerStore} from "../src/stores";
import {randomInt} from "crypto";
import {createPromiseHandler} from "../src/utils";
import {EventEmitter} from "eventemitter3"; // Adjust the import path as needed

describe('Game Service', () => {
  let game: GameJson;
  const cardPlayerDefault = new CardPlayerStore();
  const statsOfEvent = [ StatCard.QUICKNESS, StatCard.JUMP, StatCard.POWER, StatCard.STRENGTH ];
  const gameService = new GameService();
  const eventService = new EventService(gameService);


  let cardPlayerSelectedToPlayGame: CardJson[]= [];
  const player: PlayerJoinGame = {
    name: 'Player 1',
    score: 0,
    cards: cardPlayerDefault.cards,
    cardsPlayGame: []
  }


  test('should create a event', () => {
    const event: EventJson = {
        seedGame: 'event_testing_beta_1',
        round: 3,
        baseDifficulty: 3,
        stats: statsOfEvent,
        gameRecord: {}
    }

    cardPlayerSelectedToPlayGame = cardPlayerDefault.cards.slice(0, 4)
    eventService.createNewEvent(event);

    expect(eventService.eventRecord[event.seedGame]).toBeDefined();
    expect(eventService.eventRecord[event.seedGame]).toEqual(event);
  });

  test('should create a game of event', async () => {
    game = await eventService.startEvent('event_testing_beta_1', cardPlayerSelectedToPlayGame, player);

    expect(game).toBeDefined();
    expect(game.rounds).toHaveLength(3);
    expect(game.currentRound).toEqual(0);
    expect(game.state).toEqual('ready');
    expect(game.rounds.flatMap(round => round.stats).every(stat => statsOfEvent.includes(stat))).toBe(true);
  });

  test('should play game', async() => {
    game.event = new EventEmitter<GameEventEmitter>();
    const { promise, resolve } = createPromiseHandler<GameJson>();

    console.log('LOG: Game is ready to start_____________________________________');
    game.event.on('onReadyRound', (game) => {
      console.log('waiting for player to select a card....................');
      const cardPlayerToSelect = game.player.cardsPlayGame;
      const cardToSelected = cardPlayerToSelect[randomInt(0, cardPlayerToSelect.length)]
      gameService.selectCardToPlayEachRound(game, cardToSelected.def_id);
    });

    game.event.on('onGameFinished', (game) => {
      console.log('Game is finished at round ', game.currentRound + 1);
      if (game.isWin) {
        expect(game.currentRound).toEqual(3);
        expect(game.state).toEqual('finished');
        expect(game.rounds.every(round => round.state === 'finished')).toBe(true);
        expect(game.player.cardsPlayGame).toHaveLength(1);
      } else {
        expect(game.state).toEqual('finished');
      }

      resolve(game);
    });

     eventService.playEvent('event_testing_beta_1', game);

     await promise;
  });
});