import { EventService } from "../src/services/eventGameService";
import { CardJson, PlayerJoinGame, StatCard } from '../src/types';
import { GameService } from "../src/services/gameService";
import { EventJson, GameEventEmitter, GameJson } from "../src/types/game";
import { CardPlayerStore } from "../src/stores";
import * as path from "node:path";
import { randomInt } from "crypto";
import { createPromiseHandler } from "../src/utils";
import { EventEmitter } from "eventemitter3";
import { convertRoundDataToExcelData, writeTestResultToExcel } from "./utils/writeTestResultToExcel"; // Adjust the import path as needed

const dir_path = path.join(__dirname, '..', 'static', 'raw_data', 'test-results.xlsx');

const cardPlayerDefault = new CardPlayerStore();
const statsOfEvent = [StatCard.POWER, StatCard.PRESENCE, StatCard.ENDURANCE, StatCard.STRENGTH];
const gameService = new GameService();
const eventService = new EventService(gameService);
const roundEvent = 5;
const player: PlayerJoinGame = {
  name: 'Player 1',
  score: 0,
  cards: cardPlayerDefault.cards,
  cardsPlayGame: []
};

describe('Testing game in case with fixed player card ', () => {


  for (let i = 0; i < 400; i++) {
    describe(`Run ${i + 1}`, () => {
      let game: GameJson;
      let cardPlayerSelectedToPlayGame= new Set<CardJson>();

      test('should create an event', () => {
        const event: EventJson = {
          seedGame: 'event_testing_beta_1',
          round: roundEvent,
          baseDifficulty: 1,
          stats: statsOfEvent,
          gameRecord: {}
        };

        while (cardPlayerSelectedToPlayGame.size < roundEvent + 1 ) {
          const cardFilter = cardPlayerDefault.cards.filter(card => !cardPlayerSelectedToPlayGame.has(card));
          if(cardFilter.length === 1) {
            cardPlayerSelectedToPlayGame.add(cardFilter[0]);
          } else {
            cardPlayerSelectedToPlayGame.add(cardFilter[randomInt(0, cardFilter.length - 1)]);
          }
        }
        eventService.createNewEvent(event);

        expect(eventService.eventRecord[event.seedGame]).toBeDefined();
        expect(eventService.eventRecord[event.seedGame]).toEqual(event);
      });

      test('should create a game of event', async () => {
        game = await eventService.startEvent('event_testing_beta_1', [...cardPlayerSelectedToPlayGame], player);

        gameService.subscribeGameHandlers((gameHandlers) => {
          game = gameHandlers[game.id];
        });

        expect(game).toBeDefined();
        expect(game.rounds).toHaveLength(roundEvent);
        expect(game.currentRound).toEqual(0);
        expect(game.state).toEqual('ready');
        expect(game.rounds.flatMap(round => round.stats).every(stat => statsOfEvent.includes(stat))).toBe(true);
      });

      test('should play game', async () => {
        game.event = new EventEmitter<GameEventEmitter>();
        const { promise, resolve } = createPromiseHandler<GameJson>();

        console.log('LOG: Game is ready to start_____________________________________');
        game.event.on('onReadyRound', (round) => {
          console.log('waiting for player to select a card....................');
          const cardPlayerToSelect = game.player.cardsPlayGame;
          const idealStatCombine = Object.values(round.idealStat).reduce((acc, stat) => acc + stat, 0);
          let cardToSelected: CardJson = cardPlayerToSelect[randomInt(0, cardPlayerToSelect.length - 1)];

          if(cardToSelected !== null) {
            // @ts-ignore
            gameService.selectCardToPlayEachRound(game, cardToSelected.def_id);
          } else {
            expect(1).toEqual(0);
          }
        });

        game.event.on('onGameFinished', (game) => {
          console.log('Game is finished at round ', game.currentRound);

          expect(game.currentRound).toEqual(roundEvent);
          expect(game.state).toEqual('finished');
          expect(game.rounds.every(round => round.state === 'finished')).toBe(true);
          expect(game.player.cardsPlayGame).toHaveLength(2);


          writeTestResultToExcel(dir_path, convertRoundDataToExcelData([...game.rounds], game.id, [...cardPlayerSelectedToPlayGame], i + 1), 'Test Case 5', roundEvent);

          resolve(game);
        });

        eventService.playEvent('event_testing_beta_1', game);

        await promise;
      });
    });
  }
});