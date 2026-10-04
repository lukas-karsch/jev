import { Card } from "./cards";

export interface Player {
	/**
	 * Called by the game when it's this player's turn.
	 *
	 * @param ownCards cards the player has in his hand
	 * @param currentCard the card that is currently on top of the discard pile
	 */
	onTurn(ownCards: Card[], currentCard: Card): void;
}

export type PlayerAction =
	| {
			name: "draw_card";
	  }
	| {
			name: "play_card";
			card: Card;
	  }
	| { name: "call_uno" };
