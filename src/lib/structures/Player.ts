import { CardID } from '../../typings/index.js';
import { Card } from './Card.js';
import Collection from '@discordjs/collection';

export class Player {
  public readonly name: string;

  public hand = new Collection<CardID, Card>();

  constructor(name: string) {
    this.name = name;
  }

  get cardCount(): number {
    return this.hand.size;
  }

  get cardToPlay(): Card | undefined {
    return this.hand.first();
  }

  public addCards(...cards: Card[]): void {
    for (const card of cards) this.hand.set(card.id, card);
  }

  public clearCards(): void {
    this.hand.clear();
  }

  public removeCards(...cards: CardID[]): void {
    for (const cardID of cards) this.hand.delete(cardID);
  }
}