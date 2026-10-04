import { Card } from "./cards";
import { Player, PlayerAction } from "./player";

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
