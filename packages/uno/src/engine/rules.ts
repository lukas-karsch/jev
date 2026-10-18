import { Card, Color } from "./cards";
import { GameContext } from "./game-context";
import { PlayCardAction } from "./player";

type CurrentState = {
	currentCard: Card;
	modifiers?: { currentActiveColor?: Color | undefined };
	pendingDrawCount?: number;
};

export interface RuleEngine {
	/**
	 * Evaluate the played card against the current card on the playedCards stack. Return a decision with optional side effects
	 * @param currentCard The current topmost card of the playedCards stack
	 * @param playerAction The action executed by the current player
	 * @return a Decision with optional side effects
	 */
	decide(state: CurrentState, playerAction: PlayCardAction): Decision;
}

/**
 * Rule engine implementing the standard UNO rules as described by https://www.unorules.com/
 */
export class StandardUnoRuleEngine implements RuleEngine {
	decide(state: CurrentState, playerAction: PlayCardAction): Decision {
		if (
			state.pendingDrawCount &&
			(playerAction.card.type !== "regular" ||
				playerAction.card.value !== "draw_two")
		) {
			return { decision: "rejected" };
		}

		let decision: Decision["decision"] = "rejected";

		const colorToMatch =
			state.modifiers?.currentActiveColor ?? state.currentCard.color;
		if (playerAction.card.color === colorToMatch) {
			decision = "accepted";
		}
		if (playerAction.card.value === state.currentCard.value) {
			decision = "accepted";
		}
		if (playerAction.card.type === "wild") {
			decision = "accepted";
		}

		if (decision === "accepted") {
			return {
				decision,
				sideEffects: getSideEffects(playerAction),
			};
		}
		return { decision: "rejected" };
	}
}

function getSideEffects(playerAction: PlayCardAction): SideEffect[] {
	if (playerAction.card.type === "regular") {
		switch (playerAction.card.value) {
			case "draw_two":
				return [new StackDrawCardsSideEffect(2)];
			case "reverse":
				return [new ReverseSideEffect()];
			case "skip":
				return [new SkipPlayerSideEffect()];
		}
	}

	if (playerAction.card.type === "wild") {
		switch (playerAction.card.value) {
			case "wild":
				return [new WishColorSideEffect(playerAction.chosenColor!)];
			case "wild_draw_four":
				return [
					new WishColorSideEffect(playerAction.chosenColor!),
					new DrawCardsSideEffect(4),
				];
		}
	}

	return [];
}

type Decision =
	| {
			decision: "accepted";
			sideEffects: SideEffect[];
	  }
	| {
			decision: "rejected";
	  };

/**
 * Side effects describe actions taken on the gameContext through a simple `apply` function.
 * @see GameContext
 */
export interface SideEffect {
	apply(gameContext: GameContext): void;
}

/**
 * Reverses the playing direction
 */
export class ReverseSideEffect implements SideEffect {
	apply(gameContext: GameContext): void {
		gameContext.direction *= -1;
	}
}

/**
 * Modifies gameContext to override the currentActiveColor
 */
export class WishColorSideEffect implements SideEffect {
	constructor(private readonly color: Color) {}

	apply(gameContext: GameContext): void {
		gameContext.currentActiveColor = this.color;
	}
}

/**
 * Skip the next player
 */
export class SkipPlayerSideEffect implements SideEffect {
	apply(gameContext: GameContext): void {
		gameContext.advancePlayer();
	}
}

/**
 * Draws the specified amount of cards to the next player's hand
 */
export class DrawCardsSideEffect implements SideEffect {
	constructor(private readonly cardsToDraw: number) {}

	apply(gameContext: GameContext): void {
		const affectedPlayer =
			gameContext.currentPlayerIndex + gameContext.direction;

		for (let i = 0; i < this.cardsToDraw; i++) {
			gameContext.players[affectedPlayer]?.cards.push(
				gameContext.deck.pop()!,
			); // TODO handle shuffling! probably need to add an abstraction for the Deck and playedCards to automatically shuffle when the deck is empty
		}
	}
}

/**
 * Adds to the pending draw penalty so a later player can stack another draw-two.
 */
export class StackDrawCardsSideEffect implements SideEffect {
	constructor(private readonly cardsToDraw: number) {}

	apply(gameContext: GameContext): void {
		gameContext.pendingDrawCount += this.cardsToDraw;
	}
}
