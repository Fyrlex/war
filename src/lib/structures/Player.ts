import { CardID } from '../../typings/index.js';
import { Card } from './Card.js';
import { WarClient } from './WarClient.js';
import Collection from '@discordjs/collection';

export class Player {
  public readonly client: WarClient;
  public readonly name: string;

  public hand: Collection<CardID, Card>;
  public first: boolean;
  public peanutButter: boolean;
  public played: CardID[] | null;

  constructor(client: WarClient, name: string) {
    this.client = client;
    this.name = name;

    this.hand = new Collection();
    this.first = false;
    this.peanutButter = false;
    this.played = null;
  }

  get cardCount(): number {
    return this.hand.size;
  }

  get cardToPlay(): Card {
    return this.hand.first()!;
  }

  public addCards(...cards: Card[]): void {
    console.log(`Added ${cards.length} cards to ${this.name}`);
    for (const card of cards) this.hand.set(card.id, card);
  }

  public clearCards(): void {
    this.hand.clear();
  }

  public removeCards(...cards: CardID[]): void {
    for (const cardID of cards) this.hand.delete(cardID);
  }
}