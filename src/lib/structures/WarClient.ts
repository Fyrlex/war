import { EventEmitter } from 'events';
import { Card } from './Card.js';
import { Deck } from './Deck.js';
import { Player } from './Player.js';

export class WarClient extends EventEmitter {
  public readonly deck: Deck;
  public readonly players: Player[];
  public readonly duelAmount: number;
  public readonly verbose?: boolean;

  public nextPlayer: Player | null;
  public rounds: number;
  public startedAt: number;
  public dealt: boolean;
  public winner: Player | null;

  constructor(deck: Deck, options: { duelAmount?: number, verbose?: boolean }) {
    super();
    this.deck = deck;
    this.players = [];
    this.startedAt = 0;
    this.rounds = 0;
    this.dealt = false;
    this.nextPlayer = null;
    this.winner = null;
    this.duelAmount = options.duelAmount ?? 3;
    this.verbose = options.verbose;

    this.on('go', async (playerOne: Player, playerTwo: Player) => {
      if (!this.dealt) throw new Error('Cards have not been dealt.');

      this.rounds++;

      this.play(playerOne, playerTwo);
    });
  }

  get duration(): number {
    return Date.now() - this.startedAt;
  }

  private play(playerOne: Player, playerTwo: Player, ...duelCards: Card[]): 0 | 1 | 2 | void {
    const playerOneCard = playerOne.cardToPlay;
    const playerTwoCard = playerTwo.cardToPlay;

    playerOne.removeCards(playerOneCard.id);
    playerTwo.removeCards(playerTwoCard.id);

    const winner = this.checkWinner(playerOne, playerTwo);
    if (winner) return console.log(`${winner.name} won on play after ${this.rounds} rounds!`);

    if (this.verbose) console.log(`${playerOneCard.id} \u001b[32mvs\u001b[0m ${playerTwoCard.id}`);

    if (playerOneCard.rankValue > playerTwoCard.rankValue) {
      const cards = [playerOneCard, playerTwoCard];
      cards.push(...duelCards);
      playerOne.addCards(...cards);

      if (this.verbose) {
        console.log(`${playerOne.name} wins ${duelCards.length ? 'duel' : 'play'} with ${playerOneCard.id} against ${playerTwo.name} with ${playerTwoCard.id}`);
        console.log(`${playerOne.name} has ${playerOne.hand.size} cards`);
        console.log(`${playerTwo.name} has ${playerTwo.hand.size} cards`);
      }

      return 1;
    }

    if (playerOneCard.rankValue < playerTwoCard.rankValue) {
      const cards = [playerOneCard, playerTwoCard];
      cards.push(...duelCards);
      playerTwo.addCards(...cards);

      if (this.verbose) {
        console.log(`${playerTwo.name} wins ${duelCards.length ? 'duel' : 'play'} with ${playerTwoCard.id} against ${playerOne.name} with ${playerOneCard.id}`);
        console.log(`${playerOne.name} now has ${playerOne.hand.size} cards`);
        console.log(`${playerTwo.name} now has ${playerTwo.hand.size} cards`);
      }

      return 2;
    }

    this.duel(playerOne, playerTwo, playerOneCard, playerTwoCard, ...duelCards);

    return 0;
  }

  private checkWinner(playerOne: Player, playerTwo: Player): Player | null {
    switch (0) {
      case playerOne.hand.size:
        return this.winner = playerOne;

      case playerTwo.hand.size:
        return this.winner = playerTwo;

      default:
        return null;
    }
  }

  private duel(playerOne: Player, playerTwo: Player, ...originalCards: Card[]): void {

    const playerOneCards = playerOne.hand.first(playerOne.hand.size > this.duelAmount ? this.duelAmount : (playerOne.hand.size - 1 ? playerOne.hand.size - 1 : 1));
    const playerTwoCards = playerTwo.hand.first(playerTwo.hand.size > this.duelAmount ? this.duelAmount : (playerTwo.hand.size - 1 ? playerTwo.hand.size - 1 : 1));

    playerOne.removeCards(...playerOneCards.map(c => c.id));
    playerTwo.removeCards(...playerTwoCards.map(c => c.id));

    const cards = playerOneCards.concat(playerTwoCards).concat(originalCards);
    if (!this.play(playerOne, playerTwo, ...cards) && !this.winner) this.duel(playerOne, playerTwo, ...cards);
  }

  public setPlayers(playerOne: Player, playerTwo: Player) {
    this.players.push(playerOne);
    this.players.push(playerTwo);
  }

  public deal(): void {
    let playerIndex = 0;

    for (const [, card] of this.deck.cards) {
      if (playerIndex > this.players.length - 1) playerIndex = 0;
      const player = this.players[playerIndex++]!;
      player.addCards(card);
    }

    this.dealt = true;
  }

  public finish() {
    while (true) {
      if (this.winner) break;
      this.emit('go', this.players[0], this.players[1]);
    }
  }
}