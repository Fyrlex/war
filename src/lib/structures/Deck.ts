import { CardID, ranks, suits } from '../../typings/index.js';
import { Card } from './Card.js';
import { RandomEngine } from 'better-random.js';
import { Collection } from '@discordjs/collection';

const rng = new RandomEngine();

export class Deck {
	public readonly cards: Collection<CardID, Card> = new Collection();

	constructor(options?: { shuffle: boolean; }) {
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
		for (let i = 0; i < 7; i++) {
			this.cards.sort(() => 0.5 - rng.uniform_real(0, 1));
		}

		return this.cards;
	}
}