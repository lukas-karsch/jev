import {
	Card,
	Color,
	isRegularCard,
	RegularCard,
	WildCard,
} from "../engine/cards";
import {
	callUnoAction,
	drawCardAction,
	Player,
	PlayerAction,
} from "../engine/player";

/** Randomly plays a legal card when possible, and draws when none can be played. */
export class RandomPlayer implements Player {
	onTurn(
		ownCards: Card[],
		currentCard: Card,
		onTurnCompleted: (playerAction: PlayerAction[]) => void,
	): void {
		if (ownCards.length === 0) {
			// shouldn't happen
			onTurnCompleted([]);
			return;
		}

		const playableRegularCards: RegularCard[] = ownCards
			.filter(isRegularCard)
			.filter(
				(card) =>
					card.color === currentCard.color ||
					card.value === currentCard.value,
			);

		const playableWildCards: WildCard[] = ownCards.filter(
			(card) => card.type === "wild",
		);

		if (playableRegularCards.length === 0) {
			if (playableWildCards.length === 0) {
				onTurnCompleted([drawCardAction()]);
				return;
			} else {
				const counts: Record<Color, number> = {
					red: 0,
					yellow: 0,
					green: 0,
					blue: 0,
				};
				for (const card of ownCards) {
					if (isRegularCard(card)) {
						counts[card.color]++;
					}
				}

				let chosenColor: Color = "red";
				for (const color of ["yellow", "green", "blue"] as const) {
					if (counts[color] > counts[chosenColor]) {
						chosenColor = color;
					}
				}

				const actions: PlayerAction[] = [
					{
						card: playableWildCards[0]!,
						name: "play_card",
						chosenColor,
					},
				];
				if (ownCards.length === 2) {
					actions.push(callUnoAction());
				}
				onTurnCompleted(actions);
				return;
			}
		}

		const selectedRegularCard =
			playableRegularCards[
				Math.floor(Math.random() * playableRegularCards.length)
			]!;

		const actions: PlayerAction[] = [
			{
				card: selectedRegularCard,
				name: "play_card",
			},
		];
		if (ownCards.length === 2) {
			actions.push(callUnoAction());
		}
		onTurnCompleted(actions);
	}
}
