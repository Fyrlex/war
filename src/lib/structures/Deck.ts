import { CardID, ranks, suits } from '../../typings/index.js';
import { Card } from './Card.js';
import { default_random_engine } from 'better-random.js/build/engines/default_random_engine.js';
import { uniform_real_map } from 'better-random.js/build/maps/index.js';
import { Collection } from '@discordjs/collection';

const rng = new default_random_engine();

export class Deck {
  public readonly cards: Collection<CardID, Card> = new Collection();

  constructor(options?: { shuffle: boolean }) {
    this.cards = this.generate(options?.shuffle);
  }

  private generate(shuffle?: boolean): Collection<CardID, Card> {
    for (const suit of suits) for (const rank of ranks) {
      const card = new Card(rank, suit);
      this.cards.set(card.id, card);
    }

    if (shuffle) return this.shuffle();

    return this.cards;
  }

  public shuffle(): Collection<CardID, Card> {
    for (let i = 0; i < 7; i++) this.cards.sort(() => 0.5 - uniform_real_map(rng, 0, 1));

    return this.cards;
  }
}