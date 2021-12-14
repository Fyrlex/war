import { CardID, Rank, ranks, Suit, suits } from '../../typings/index.js';

export class Card {
  public readonly id: CardID;
  public readonly rank: Rank;
  public readonly suit: Suit;
  public readonly rankValue: number;
  public readonly suitValue: number;

  constructor(rank: Rank, suit: Suit) {
    this.rank = rank;
    this.suit = suit;
    this.id = `${this.rank}-${this.suit}`;
    this.rankValue = ranks.indexOf(this.rank);
    this.suitValue = suits.indexOf(this.suit);
  }
}
