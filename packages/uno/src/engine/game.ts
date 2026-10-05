import { Card, cardsSupplier, CardsSupplier, generateDeck } from "./cards";
import { Player, PlayerAction } from "./player";
import { shuffle } from "./random";

export interface UnoGame {
	startGame(players: Player[]): void;

	/**
	 * Called by the game when a player has made a turn. The game validates the player, their action and updates the game state accordingly.
	 * @param player
	 * @param action an array with one action, unless the player calls UNO, in which case the array should contain two actions: the action to play a card and the action to call UNO.
	 */
	turnMade(player: Player, action: PlayerAction[]): void;
}

export interface GameContext {
	players: { player: Player; cards: Card[] }[];
	currentCard: Card;
	deck: Card[];
	currentPlayerIndex: number;
	direction: 1 | -1;
}

class UnoGameImpl implements UnoGame {
	private gameContext: GameContext | null = null;

	constructor(private cardsSupplier: CardsSupplier) {}

	startGame(players: Player[]): void {
		if (players.length < 2) {
			console.error("At least 2 players are required to start the game.");
			return;
		}

		const deck = this.cardsSupplier.getDeck();

		this.gameContext = {
			players: players.map((player) => ({
				player,
				cards: Array.from({ length: 7 }, () => deck.pop()!),
			})),
			currentCard: deck.pop()!,
			deck,
			currentPlayerIndex: 0,
			direction: 1,
		};

		const ctx = this.gameContext;
		const currentTurn = ctx.players[ctx.currentPlayerIndex]!;

		currentTurn.player.onTurn(currentTurn.cards, ctx.currentCard);
	}

	turnMade(player: Player, action: PlayerAction[]): void {
		throw new Error("Method not implemented.");
	}
}

export default function createGame(): UnoGame {
	return new UnoGameImpl(cardsSupplier);
}
