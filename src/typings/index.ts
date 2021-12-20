import { Player } from '../lib/structures/Player.js';

export type CardID = `${Rank}-${Suit}`;

export interface WarClientOptions {
  database?: boolean,
  duelAmount?: 1 | 2 | 3,
  timeout?: number,
  storeTimeouts?: boolean,
  logger?: boolean
}

export type Game = {
  players: [Player, Player],
  duration: number,
  duels: number,
  rounds: number,
  winner: Player | null | 'none'
}

export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = typeof ranks[number];

export const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'] as const;
export type Suit = typeof suits[number];

export const dbCreateStatement = 'CREATE TABLE "war" ("id" INTEGER NOT NULL, "player_one" TEXT NOT NULL,"player_two" TEXT NOT NULL, "winner" INTEGER NOT NULL,"duration" INTEGER NOT NULL, "duels" INTEGER NOT NULL, "rounds" INTEGER NOT NULL, "timed_out" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT))';