import Collection from '@discordjs/collection';
import { EventEmitter } from 'events';
import { CardID, Rank } from '../../typings/index.js';
import { Card } from './Card.js';
import { Deck } from './Deck.js';
import { Player } from './Player.js';

export class WarClient extends EventEmitter {
  public readonly deck: Deck;
  public readonly players: Player[];
  public readonly verbose?: boolean;

  public nextPlayer: Player | null;
  public turns: number;
  public rankToPlay: Rank;
  public pile: Collection<CardID, Card>;
  public startedAt: number;
  public playerIndex: number;
  public dealt: boolean;
  public winner: Player | null;

  constructor(deck: Deck, verbose?: boolean) {
    super();
    this.deck = deck;
    this.players = [];
    this.startedAt = 0;
    this.rankToPlay = 'A';
    this.pile = new Collection();
    this.turns = 0;
    this.playerIndex = 0;
    this.dealt = false;
    this.nextPlayer = null;
    this.winner = null;
    this.verbose = verbose;

    this.on('go', async (playerOne: Player, playerTwo: Player) => {
      this.turns++;

      this.play(playerOne, playerTwo);
    });
  }

  get duration(): number {
    return Date.now() - this.startedAt;
  }

  private play(playerOne: Player, playerTwo: Player, ...duelCards: Card[]): 0 | 1 | 2 {
    const playerOneCard = playerOne.cardToPlay;
    const playerTwoCard = playerTwo.cardToPlay;

    playerOne.removeCards(playerOneCard.id);
    playerTwo.removeCards(playerTwoCard.id);

    if (this.verbose) console.log(`${playerOneCard.rank} vs ${playerTwoCard.rank}`);

    if (playerOneCard.rankValue > playerTwoCard.rankValue) {
      const cards = [playerOneCard, playerTwoCard];
      cards.concat(...duelCards);
      playerOne.addCards(...cards);

      if (this.verbose) {
        console.log(`${playerOne.name} wins with ${playerOneCard.id} against ${playerTwo.name} with ${playerTwoCard.id}`);
        console.log(`${playerOne.name} has ${playerOne.hand.size} cards`);
        console.log(`${playerTwo.name} has ${playerTwo.hand.size} cards`);
      }

      if (playerOne.hand.size === 52) {
        console.log(`${playerOne.name} won!`);
        this.winner = playerOne;
      }

      return 1;
    }

    if (playerOneCard.rankValue < playerTwoCard.rankValue) {
      const cards = [playerOneCard, playerTwoCard];
      cards.concat(...duelCards);
      playerOne.addCards(...cards);

      if (this.verbose) {
        console.log(`${playerTwo.name} wins with ${playerTwoCard.id} against ${playerOne.name} with ${playerOneCard.id}`);
        console.log(`${playerOne.name} has ${playerOne.hand.size} cards`);
        console.log(`${playerTwo.name} has ${playerTwo.hand.size} cards`);
      }

      if (playerTwo.hand.size === 52) {
        console.log(`${playerTwo.name} won!`);
        this.winner = playerTwo;
      }

      return 2;
    }

    this.duel(playerOne, playerTwo);

    return 0;
  }

  private duel(playerOne: Player, playerTwo: Player): void {
    const playerOneCards = playerOne.hand.first(3);
    const playerTwoCards = playerTwo.hand.first(3);

    playerOne.removeCards(...playerOneCards.map(c => c.id));
    playerTwo.removeCards(...playerTwoCards.map(c => c.id));

    const cards = playerTwoCards.concat(playerTwoCards);

    if (!this.play(playerOne, playerTwo, ...cards)) this.duel(playerOne, playerTwo);
  }

  public setPlayers(playersOne: Player, playerTwo: Player) {
    this.players.push(playersOne);
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
    while (!this.winner) this.emit('go', this.players[0], this.players[1]);
  }
}