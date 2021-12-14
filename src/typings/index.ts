export type CardID = `${Rank}-${Suit}`;

export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = typeof ranks[number];

export const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'] as const;
export type Suit = typeof suits[number];