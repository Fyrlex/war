import db from 'better-sqlite3';
import log4js from 'log4js';
import { Card } from './Card.js';
import { Deck } from './Deck.js';
import { Player } from './Player.js';
import { Game, WarClientOptions } from '../../typings/index.js';

log4js.configure({
  appenders: { war: { type: 'file', filename: './data/game.log' } },
  categories: { default: { appenders: ['war'], level: 'all' } },
});

export class WarClient {
  private readonly _storeTimeouts: boolean;
  private readonly _logger?: log4js.Logger;
  private readonly _db?: db.Database;

  private _deck: Deck;
  private _duelCount: number;
  private _startedAt: number;
  private _roundCount: number;

  public readonly players: [Player, Player];
  public readonly duelAmount: 1 | 2 | 3;
  public readonly timeout: number;

  public winner: Player | null | 'none';

  constructor(deck: Deck, players: [Player, Player], options: WarClientOptions) {
    if (options.database) this._db = new db('./data/data.db');
    if (options.logger) this._logger = log4js.getLogger('war');
    this._storeTimeouts = options.storeTimeouts ?? false;

    this._deck = deck;
    this._startedAt = 0;
    this._roundCount = 0;
    this._duelCount = 0;

    this.players = players;
    this.duelAmount = options.duelAmount ?? 3;
    this.timeout = options.timeout ?? 2000;

    this.winner = null;
  }

  get duration(): number {
    return Date.now() - this._startedAt;
  }

  get duels(): number {
    return this._duelCount;
  }

  get game(): Game {
    return {
      players: this.players,
      duration: this.duration,
      duels: this._duelCount,
      rounds: this._roundCount,
      winner: this.winner
    };
  }

  get overTime(): boolean {
    return this.duration > this.timeout;
  }

  get rounds(): number {
    return this._roundCount;
  }

  private compareRanks(cardOne: Card, cardTwo: Card): -1 | 0 | 1 {
    if (cardOne.rankValue > cardTwo.rankValue) return 1;
    if (cardOne.rankValue < cardTwo.rankValue) return -1;
    else return 0;
  }

  private play(playerOne: Player, playerTwo: Player, ...duelCards: Card[]): void {
    this._roundCount++;

    const playerOneCard = playerOne.cardToPlay;
    const playerTwoCard = playerTwo.cardToPlay;

    if (!playerOneCard) {
      const winner = this.checkWinner(playerOne, true)!;
      this.logGame();
      if (this._logger) this._logger.info(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this._roundCount.toLocaleString('en')} rounds and ${this._duelCount.toLocaleString('en')} duels!`);

      return;
    }

    if (!playerTwoCard) {
      const winner = this.checkWinner(playerTwo, true)!;
      this.logGame();
      if (this._logger) this._logger.info(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this._roundCount.toLocaleString('en')} rounds and ${this._duelCount.toLocaleString('en')} duels!`);

      return;
    }

    playerOne.removeCards(playerOneCard.id);
    playerTwo.removeCards(playerTwoCard.id);

    if (this._logger) this._logger.info(`${!this.compareRanks(playerOneCard, playerTwoCard) ? 'DUEL ' : ''}${playerOneCard.id} vs ${playerTwoCard.id} - Gametime: ${this.duration / 1000}s`);

    switch (this.compareRanks(playerOneCard, playerTwoCard)) {
      case 1: {
        const cards = [playerOneCard, playerTwoCard];
        cards.push(...duelCards);
        playerOne.addCards(...cards);

        if (this._logger) {
          this._logger.info(`${playerOne.name} wins ${duelCards.length ? 'duel' : 'play'} #${this.rounds} with ${playerOneCard.id} against ${playerTwo.name} with ${playerTwoCard.id} `);
          this._logger.info(`${playerOne.name} has ${playerOne.cardCount.toLocaleString('en')} cards`);
          this._logger.info(`${playerTwo.name} has ${playerTwo.cardCount.toLocaleString('en')} cards`);
          this._logger.info('');
        }

        const winner = this.checkWinner(playerOne);
        if (winner) {
          this.logGame();
          if (this._logger) this._logger.info(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this._roundCount.toLocaleString('en')} rounds and ${this._duelCount.toLocaleString('en')} duels!`);

          return;
        }

        break;
      }

      case -1: {
        const cards = [playerOneCard, playerTwoCard];
        cards.push(...duelCards);
        playerTwo.addCards(...cards);

        if (this._logger) {
          this._logger.info(`${playerTwo.name} wins ${duelCards.length ? 'duel' : 'play'} #${this.rounds} with ${playerTwoCard.id} against ${playerOne.name} with ${playerOneCard.id} `);
          this._logger.info(`${playerOne.name} has ${playerOne.cardCount.toLocaleString('en')} cards`);
          this._logger.info(`${playerTwo.name} has ${playerTwo.cardCount.toLocaleString('en')} cards`);
          this._logger.info('');
        }
        const winner = this.checkWinner(playerOne);
        if (winner) {
          this.logGame();
          if (this._logger) this._logger.info(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this._roundCount.toLocaleString('en')} rounds and ${this._duelCount.toLocaleString('en')} duels!`);

          return;
        }

        break;
      }

      case 0: {
        this._duelCount++;

        const playerOneCards = playerOne.hand.first((playerOne.cardCount > this.duelAmount) ? this.duelAmount : (playerOne.cardCount - 1 ? playerOne.cardCount - 1 : 1));
        const playerTwoCards = playerTwo.hand.first((playerTwo.cardCount > this.duelAmount) ? this.duelAmount : (playerTwo.cardCount - 1 ? playerTwo.cardCount - 1 : 1));

        switch (0) {
          case playerOne.cardCount: {
            const winner = this.checkWinner(playerOne, true)!;
            this.logGame();
            if (this._logger) this._logger.info(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this._roundCount.toLocaleString('en')} rounds and ${this._duelCount.toLocaleString('en')} duels!`);

            return;
          }

          case playerTwo.cardCount: {
            const winner = this.checkWinner(playerTwo, true)!;
            this.logGame();
            if (this._logger) this._logger.info(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this._roundCount.toLocaleString('en')} rounds and ${this._duelCount.toLocaleString('en')} duels!`);

            return;
          }
        }

        if (playerOne.cardCount > 1) playerOne.removeCards(...playerOneCards.map(c => c.id));
        if (playerTwo.cardCount > 1) playerTwo.removeCards(...playerTwoCards.map(c => c.id));

        const cards = playerOneCards.concat(playerTwoCards).concat(duelCards).concat(playerOneCard, playerTwoCard);
        this.play(playerOne, playerTwo, ...cards);

        break;
      }
    }
  }

  private checkWinner(player: Player, zero?: boolean): Player | null {
    switch (zero ? 0 : 52) {
      case player.cardCount:
        return this.winner = zero ? this.players.find(p => p.name !== player.name)! : player;

      default:
        return null;
    }
  }

  private logGame(timeout?: boolean): void {
    if (this._db) this._db.prepare('INSERT INTO war (player_one, player_two, winner, duration, duels, rounds, timed_out) VALUES(?, ?, ?, ?, ?, ?, ?)').run(this.players[0].name, this.players[1].name, (this.winner === 'none' ? this.winner : this.players.indexOf(this.winner!)), this.duration, this._duelCount, this._roundCount, timeout ? 1 : 0);
  }

  public clearDB(): void {
    if (this._db) {
      this._db.prepare('DELETE FROM war').run();
      this._db.prepare('UPDATE sqlite_sequence SET seq=? WHERE name=?').run('0', 'war');
    }
  }

  public reset(): void {
    this._roundCount = 0;
    this._duelCount = 0;
    this.winner = null;
    this._startedAt = 0;
    this._deck = new Deck({ shuffle: true });
    for (const player of this.players) player.clearCards();
  }

  public run(): void {
    this.deal();

    this._startedAt = Date.now();
    if (this._logger) this._logger.info(`Game starting... Timeout: ${this.timeout / 1000}s`);

    while (!this.winner) {
      this.play(this.players[0], this.players[1]);

      if (this.overTime) {
        this.winner = 'none';
        if (this._storeTimeouts) this.logGame(true);
        if (this._logger) this._logger.error('Game taking too long... Try increasing timeout');
      }
    }

    this.reset();
  }

  public deal(): void {
    let playerIndex = 0;

    for (const [, card] of this._deck.cards) {
      if (playerIndex > this.players.length - 1) playerIndex = 0;
      const player = this.players[playerIndex++]!;
      player.addCards(card);
    }
  }
}