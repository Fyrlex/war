import db from 'better-sqlite3';
import { Card } from './Card.js';
import { Deck } from './Deck.js';
import { Player } from './Player.js';
import { Game, WarClientOptions } from '../../typings/index.js';

export class WarClient {
	private readonly storeTimeouts: boolean;
	private readonly db?: db.Database;

	private deck: Deck;
	private duelCount: number;
	private startedAt: number;
	private roundCount: number;

	public readonly players: [Player, Player];
	public readonly duelAmount: 1 | 2 | 3;
	public readonly timeout: number;

	public winner: Player | null | 'none';

	constructor(deck: Deck, players: [Player, Player], options: WarClientOptions) {
		if (options.database) this.db = new db('./data/data.db');
		this.storeTimeouts = options.storeTimeouts ?? false;

		this.deck = deck;
		this.startedAt = 0;
		this.roundCount = 0;
		this.duelCount = 0;

		this.players = players;
		this.duelAmount = options.duelAmount ?? 3;
		this.timeout = options.timeout ?? 2000;

		this.winner = null;
	}

	get duration(): number {
		return Date.now() - this.startedAt;
	}

	get duels(): number {
		return this.duelCount;
	}

	get game(): Game {
		return {
			players: this.players,
			duration: this.duration,
			duels: this.duelCount,
			rounds: this.roundCount,
			winner: this.winner
		};
	}

	get overTime(): boolean {
		return this.duration > this.timeout;
	}

	get rounds(): number {
		return this.roundCount;
	}

	private compareRanks(cardOne: Card, cardTwo: Card): -1 | 0 | 1 {
		if (cardOne.rankValue > cardTwo.rankValue) {
			return 1;
		}

		if (cardOne.rankValue < cardTwo.rankValue) {
			return -1;
		}

		return 0;
	}

	private play(playerOne: Player, playerTwo: Player, ...duelCards: Card[]): void {
		this.roundCount++;

		const playerOneCard = playerOne.cardToPlay;
		const playerTwoCard = playerTwo.cardToPlay;

		if (!playerOneCard) {
			const winner = this.checkWinner(playerOne, true)!;

			this.logGame();

			console.log(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this.roundCount.toLocaleString('en')} rounds and ${this.duelCount.toLocaleString('en')} duels!`);

			return;
		}

		if (!playerTwoCard) {
			const winner = this.checkWinner(playerTwo, true)!;

			this.logGame();

			console.log(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this.roundCount.toLocaleString('en')} rounds and ${this.duelCount.toLocaleString('en')} duels!`);

			return;
		}

		playerOne.removeCards(playerOneCard.id);
		playerTwo.removeCards(playerTwoCard.id);

		console.log(`${!this.compareRanks(playerOneCard, playerTwoCard) ? 'DUEL ' : ''}${playerOneCard.id} vs ${playerTwoCard.id} - Gametime: ${this.duration / 1000}s`);

		switch (this.compareRanks(playerOneCard, playerTwoCard)) {
			case 1: {
				const cards = [playerOneCard, playerTwoCard];
				cards.push(...duelCards);
				playerOne.addCards(...cards);

				console.log(`${playerOne.name} wins ${duelCards.length ? 'duel' : 'play'} #${this.rounds} with ${playerOneCard.id} against ${playerTwo.name} with ${playerTwoCard.id} `);
				console.log(`${playerOne.name} has ${playerOne.cardCount.toLocaleString('en')} cards`);
				console.log(`${playerTwo.name} has ${playerTwo.cardCount.toLocaleString('en')} cards`);
				console.log('');

				const winner = this.checkWinner(playerOne);
				if (winner) {
					this.logGame();

					console.log(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this.roundCount.toLocaleString('en')} rounds and ${this.duelCount.toLocaleString('en')} duels!`);

					return;
				}

				break;
			}

			case -1: {
				const cards = [playerOneCard, playerTwoCard];
				cards.push(...duelCards);
				playerTwo.addCards(...cards);

				console.log(`${playerTwo.name} wins ${duelCards.length ? 'duel' : 'play'} #${this.rounds} with ${playerTwoCard.id} against ${playerOne.name} with ${playerOneCard.id} `);
				console.log(`${playerOne.name} has ${playerOne.cardCount.toLocaleString('en')} cards`);
				console.log(`${playerTwo.name} has ${playerTwo.cardCount.toLocaleString('en')} cards`);
				console.log('');

				const winner = this.checkWinner(playerOne);

				if (winner) {
					this.logGame();

					console.log(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this.roundCount.toLocaleString('en')} rounds and ${this.duelCount.toLocaleString('en')} duels!`);

					return;
				}

				break;
			}

			case 0: {
				this.duelCount++;

				const playerOneCards = playerOne.hand.first((playerOne.cardCount > this.duelAmount) ? this.duelAmount : (playerOne.cardCount - 1 ? playerOne.cardCount - 1 : 1));
				const playerTwoCards = playerTwo.hand.first((playerTwo.cardCount > this.duelAmount) ? this.duelAmount : (playerTwo.cardCount - 1 ? playerTwo.cardCount - 1 : 1));

				switch (0) {
					case playerOne.cardCount: {
						const winner = this.checkWinner(playerOne, true)!;
						this.logGame();

						console.log(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this.roundCount.toLocaleString('en')} rounds and ${this.duelCount.toLocaleString('en')} duels!`);

						return;
					}

					case playerTwo.cardCount: {
						const winner = this.checkWinner(playerTwo, true)!;
						this.logGame();

						console.log(`Game ended in ${this.duration / 1000}s! ${winner.name} won after ${this.roundCount.toLocaleString('en')} rounds and ${this.duelCount.toLocaleString('en')} duels!`);

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
		if (this.db) this.db.prepare('INSERT INTO war (player_one, player_two, winner, duration, duels, rounds, timed_out) VALUES(?, ?, ?, ?, ?, ?, ?)').run(this.players[0].name, this.players[1].name, (this.winner === 'none' ? this.winner : this.players.indexOf(this.winner!)), this.duration, this.duelCount, this.roundCount, timeout ? 1 : 0);
	}

	public clearDB(): void {
		if (this.db) {
			this.db.prepare('DELETE FROM war').run();
			this.db.prepare('UPDATE sqlite_sequence SET seq=? WHERE name=?').run('0', 'war');
		}
	}

	public reset(): void {
		this.roundCount = 0;
		this.duelCount = 0;
		this.winner = null;
		this.startedAt = 0;
		this.deck = new Deck({ shuffle: true });
		for (const player of this.players) player.clearCards();
	}

	public run(): void {
		this.deal();

		this.startedAt = Date.now();
		console.log(`Game starting... Timeout: ${this.timeout / 1000}s`);

		while (!this.winner) {
			this.play(this.players[0], this.players[1]);

			if (this.overTime) {
				this.winner = 'none';

				if (this.storeTimeouts) {
					this.logGame(true);
				}

				console.error('Game taking too long... Try increasing timeout');
			}
		}

		this.reset();
	}

	public deal(): void {
		let playerIndex = 0;

		for (const [, card] of this.deck.cards) {
			if (playerIndex > this.players.length - 1) playerIndex = 0;
			const player = this.players[playerIndex++]!;
			player.addCards(card);
		}
	}
}