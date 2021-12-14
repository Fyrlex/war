import { Deck } from './lib/structures/Deck.js';
import { Player } from './lib/structures/Player.js';
import { WarClient } from './lib/structures/WarClient.js';

const client = new WarClient(new Deck({ shuffle: true }), true);
const player1 = new Player(client, 'player1');
const player2 = new Player(client, 'player2');
client.setPlayers(player1, player2);
client.deal();
client.finish();