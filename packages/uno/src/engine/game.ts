import { Card, cardsSupplier, CardsSupplier, Color } from "./cards";
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
				const ctx = this.gameContext;
				return ctx!.playedCards[ctx!.playedCards.length - 1]!;
			},
			deck,
			currentPlayerIndex: 0,
			advancePlayer: () =>
				(this.gameContext!.currentPlayerIndex +=
					this.gameContext!.direction),
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

				ctx.advancePlayer();

				break;
			}
			case "call_uno": {
				break;
			}
		}
	}
}

export default function createGame(): UnoGame {
	return new UnoGameImpl(cardsSupplier, new StandardUnoRuleEngine());
}
