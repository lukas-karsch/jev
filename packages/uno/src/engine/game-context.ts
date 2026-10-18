import { Card, Color, CardsSupplier } from "./cards";
import { Player } from "./player";

export interface GameContext {
	players: { player: Player; cards: Card[] }[];
	currentCard: () => Card;
	/**
	 * The playedCards can be seen as a stack - like in real life. The first element of the array is the card that was played first - it is at the bottom of the stack. The last element of the array is the topmost card.
	 */
	playedCards: Card[];
	deck: Card[];
	currentPlayerIndex: number;
	advancePlayer: () => void;
	direction: 1 | -1;
	currentActiveColor?: Color | undefined;
}

/**
 * currently unused, TODO
 */
class GameContextImpl implements GameContext {
	players: { player: Player; cards: any[] }[];
	playedCards: Card[];
	deck: Card[];
	currentPlayerIndex = 0;
	direction: 1 | -1 = 1;
	currentActiveColor?: Color | undefined = undefined;

	constructor(
		players: Player[],
		private readonly cardsSupplier: CardsSupplier,
	) {
		this.deck = cardsSupplier.getDeck();

		this.players = players.map((player) => ({
			player,
			cards: Array.from({ length: 7 }, () => this.deck.pop()!),
		}));

		const firstCard = this.deck.shift()!;
		this.playedCards = [firstCard];
	}

	currentCard(): Card {
		return this.playedCards[this.playedCards.length - 1]!;
	}

	advancePlayer(): void {
		this.currentPlayerIndex =
			(this.currentPlayerIndex + this.direction + this.players.length) %
			this.players.length;
	}

	drawCard(): Card {
		// TODO add to interface
		if (this.deck.length === 0) {
			const topmostCard = this.playedCards.pop()!;
			this.deck = this.cardsSupplier.shuffleDeck(this.playedCards);
			this.playedCards = [topmostCard];
		}

		return this.deck.pop()!;
	}
}
