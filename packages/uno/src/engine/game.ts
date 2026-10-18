import { cardsSupplier, CardsSupplier } from "./cards";
import { GameContext } from "./game-context";
import { Player, PlayerAction } from "./player";
import { RuleEngine, StandardUnoRuleEngine } from "./rules";

export interface UnoGame {
	startGame(players: Player[]): void;

	/**
	 * Called by the game when a player has made a turn. The game validates the player, their action and updates the game state accordingly.
	 * @param player
	 * @param actions an array with one action, unless the player calls UNO, in which case the array should contain two actions: the action to play a card and the action to call UNO.
	 */
	turnMade(player: Player, actions: PlayerAction[]): void;
}

class UnoGameImpl implements UnoGame {
	private gameContext: GameContext | null = null;

	constructor(
		private readonly cardsSupplier: CardsSupplier,
		private readonly ruleEngine: RuleEngine,
	) {}

	startGame(players: Player[]): void {
		if (players.length < 2) {
			console.error("At least 2 players are required to start the game.");
			return;
		}

		const deck = this.cardsSupplier.getDeck();
		const firstCard = deck.shift()!;

		this.gameContext = {
			players: players.map((player) => ({
				player,
				cards: Array.from({ length: 7 }, () => deck.pop()!),
			})),
			playedCards: [firstCard],
			currentCard: () => {
				const ctx = this.gameContext!;
				return ctx.playedCards[ctx.playedCards.length - 1]!;
			},
			deck,
			currentPlayerIndex: 0,
			advancePlayer: () => {
				const ctx = this.gameContext!;
				ctx.currentPlayerIndex =
					(ctx.currentPlayerIndex +
						ctx.direction +
						ctx.players.length) %
					ctx.players.length;
			},
			direction: 1,
		};

		const ctx = this.gameContext;
		const currentTurn = ctx.players[ctx.currentPlayerIndex]!;

		currentTurn.player.onTurn(
			currentTurn.cards,
			ctx.currentCard(),
			(actions) => {
				this.turnMade(currentTurn.player, actions);
			},
		);
	}

	turnMade(player: Player, actions: PlayerAction[]): void {
		const ctx = this.gameContext;

		if (!ctx) {
			throw new Error("Game has not started yet.");
		}

		const currentTurn = ctx.players[ctx.currentPlayerIndex]!;

		if (currentTurn.player !== player) {
			console.error("It's not your turn.");
			return;
		}

		if (actions.length === 0) {
			console.error("At least one action is required.");
			return;
		}

		const action = actions[0]!;
		switch (action.name) {
			case "draw_card": {
				if (ctx.deck.length === 0) {
					const topmostCard = ctx.playedCards.pop()!;
					ctx.deck = this.cardsSupplier.shuffleDeck(ctx.playedCards);
					ctx.playedCards = [topmostCard];
				}

				const drawnCard = ctx.deck.pop()!;
				currentTurn.cards.push(drawnCard);
				break;
			}
			case "play_card": {
				const playedCard = action.card;
				const index = currentTurn.cards.findIndex(
					(card) => card === playedCard,
				);
				if (index === -1) {
					console.error("You don't have that card.");
					return;
				}

				const decision = this.ruleEngine.decide(
					{
						currentCard: ctx.currentCard(),
						modifiers: {
							currentActiveColor: ctx.currentActiveColor,
						}, // TODO turn modifiers into a field on ctx
					},
					action,
				);

				if (decision.decision === "rejected") {
					console.error("Move rejected"); // TODO add explanation to the log
					return;
				}

				currentTurn.cards.splice(index, 1);
				ctx.playedCards.push(playedCard);

				ctx.currentActiveColor = undefined;

				for (const sideEffect of decision.sideEffects) {
					sideEffect.apply(ctx);
				}

				break;
			}
			case "call_uno": {
				break;
			}
		}

		if (currentTurn.cards.length === 1) {
			const secondAction = actions[1];
			if (!secondAction || secondAction.name !== "call_uno") {
				console.error(
					"Player did not call UNO, even though he only has one card left in his hand. Dealing two punishment cards",
				);
				for (let i = 0; i < 2; i++) {
					currentTurn.cards.push(ctx.deck.pop()!); // TODO fix - re-shuffling may be necessary
				}
			}
		}

		ctx.advancePlayer();

		const nextTurn = ctx.players[ctx.currentPlayerIndex]!;
		nextTurn.player.onTurn(nextTurn.cards, ctx.currentCard(), (action) =>
			this.turnMade(nextTurn.player, action),
		);
	}
}

export default function createGame(): UnoGame {
	return new UnoGameImpl(cardsSupplier, new StandardUnoRuleEngine());
}
