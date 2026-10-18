/**
 * The tests in this file simulate real user interactions and verify the entire game state and flow.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	cardsSupplier,
	type Card,
	type Color,
	type NumericCardValue,
} from "../../src/engine/cards";
import createGame from "../../src/engine/game";
import type { Player, PlayerAction } from "../../src/engine/player";

interface RecordedTurn {
	hand: Card[];
	handAtStart: Card[];
	currentCard: Card;
	complete: (actions: PlayerAction[]) => void;
}

function createRecordingPlayer() {
	const turns: RecordedTurn[] = [];
	const player: Player = {
		onTurn: (hand, currentCard, complete) => {
			turns.push({
				hand,
				handAtStart: [...hand],
				currentCard,
				complete,
			});
		},
	};

	return { player, turns };
}

function regular(
	color: Color,
	value: NumericCardValue | "skip" | "reverse" | "draw_two",
): Card {
	return { type: "regular", color, value };
}

function handWith(...cards: Card[]): Card[] {
	const fillerValues: NumericCardValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	return [
		...cards,
		...Array.from({ length: 7 - cards.length }, (_, index) =>
			regular("green", fillerValues[index % fillerValues.length]!),
		),
	];
}

function createDeck(
	firstCard: Card,
	hands: Card[][],
	drawSequence: Card[] = [],
): Card[] {
	return [
		firstCard,
		...drawSequence.slice().reverse(),
		...hands
			.slice()
			.reverse()
			.flatMap((hand) => hand.slice().reverse()),
	];
}

function startGame(
	firstCard: Card,
	hands: Card[][],
	drawSequence: Card[] = [],
) {
	vi.spyOn(cardsSupplier, "getDeck").mockReturnValue(
		createDeck(firstCard, hands, drawSequence),
	);
	const players = hands.map(() => createRecordingPlayer());
	const game = createGame();
	game.startGame(players.map(({ player }) => player));

	return { game, players };
}

function play(card: Card, chosenColor: Color = "blue"): PlayerAction {
	if (card.type === "wild") {
		return { name: "play_card", card, chosenColor };
	}
	return { name: "play_card", card };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("UNO gameplay scenarios", () => {
	it("plays a card that matches the current color and passes the new top card to the next player", () => {
		const matchingCard = regular("red", 8);
		const { players } = startGame(regular("red", 1), [
			handWith(matchingCard),
			handWith(),
		]);

		players[0]!.turns[0]!.complete([play(matchingCard)]);

		expect(players[0]!.turns[0]!.hand).not.toContain(matchingCard);
		expect(players[1]!.turns[0]!.currentCard).toBe(matchingCard);
	});

	it("plays a card with a matching number even when its color differs", () => {
		const matchingNumberCard = regular("blue", 5);
		const { players } = startGame(regular("red", 5), [
			handWith(matchingNumberCard),
			handWith(),
		]);

		players[0]!.turns[0]!.complete([play(matchingNumberCard)]);

		expect(players[0]!.turns[0]!.hand).not.toContain(matchingNumberCard);
		expect(players[1]!.turns[0]!.currentCard).toBe(matchingNumberCard);
	});

	it("rejects a card that matches neither color nor value and leaves the turn available", () => {
		const illegalCard = regular("blue", 2);
		const legalCard = regular("red", 3);
		const { players } = startGame(regular("red", 1), [
			handWith(illegalCard, legalCard),
			handWith(),
		]);
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		players[0]!.turns[0]!.complete([play(illegalCard)]);

		expect(consoleError).toHaveBeenCalledWith("Move rejected");
		expect(players[0]!.turns[0]!.hand).toContain(illegalCard);
		expect(players[1]!.turns).toHaveLength(0);

		players[0]!.turns[0]!.complete([play(legalCard)]);

		expect(players[1]!.turns[0]!.currentCard).toBe(legalCard);
	});

	it("uses the chosen color after a wild card and rejects a mismatching color", () => {
		const wildCard: Card = { type: "wild", color: "black", value: "wild" };
		const wrongColorCard = regular("red", 3);
		const chosenColorCard = regular("blue", 3);
		const { players } = startGame(regular("yellow", 1), [
			handWith(wildCard),
			handWith(wrongColorCard, chosenColorCard),
			handWith(),
		]);
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		players[0]!.turns[0]!.complete([play(wildCard, "blue")]);
		players[1]!.turns[0]!.complete([play(wrongColorCard)]);

		expect(consoleError).toHaveBeenCalledWith("Move rejected");
		expect(players[1]!.turns[0]!.hand).toContain(wrongColorCard);
		expect(players[2]!.turns).toHaveLength(0);

		players[1]!.turns[0]!.complete([play(chosenColorCard)]);

		expect(players[2]!.turns[0]!.currentCard).toBe(chosenColorCard);
	});

	it("makes the next player draw two cards after a draw-two card", () => {
		const drawTwoCard = regular("red", "draw_two");
		const drawnCards = [regular("yellow", 4), regular("blue", 6)];
		const { players } = startGame(
			regular("red", 1),
			[handWith(drawTwoCard), handWith()],
			drawnCards,
		);

		players[0]!.turns[0]!.complete([play(drawTwoCard)]);
		expect(players[1]!.turns[0]!.hand).toHaveLength(7);
		players[1]!.turns[0]!.complete([{ name: "draw_card" }]);

		expect(players[1]!.turns[0]!.hand).toHaveLength(9);
		expect(players[1]!.turns[0]!.hand.slice(-2)).toEqual(drawnCards);
	});

	it("makes the first player draw four cards when the second player stacks another +2", () => {
		const firstDrawTwo = regular("red", "draw_two");
		const counterDrawTwo = regular("red", "draw_two");
		const nonStackingCard = regular("red", 3);
		const drawnCards = [
			regular("yellow", 4),
			regular("blue", 6),
			regular("green", 8),
			regular("yellow", 9),
		];
		const { players } = startGame(
			regular("red", 1),
			[
				handWith(firstDrawTwo, nonStackingCard),
				handWith(counterDrawTwo),
			],
			drawnCards,
		);
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		players[0]!.turns[0]!.complete([play(firstDrawTwo)]);
		expect(players[1]!.turns[0]!.hand).toHaveLength(7);
		players[1]!.turns[0]!.complete([play(counterDrawTwo)]);

		expect(players[0]!.turns[1]!.hand).toHaveLength(6);
		players[0]!.turns[1]!.complete([{ name: "call_uno" }]);
		expect(players[1]!.turns).toHaveLength(1);

		players[0]!.turns[1]!.complete([play(nonStackingCard)]);
		expect(consoleError).toHaveBeenCalledWith("Move rejected");
		expect(players[0]!.turns[1]!.hand).toContain(nonStackingCard);

		players[0]!.turns[1]!.complete([{ name: "draw_card" }]);

		expect(players[0]!.turns[1]!.hand).toHaveLength(10);
		expect(players[0]!.turns[1]!.hand.slice(-4)).toEqual(drawnCards);
	});

	it("skips the next player when a skip card is played", () => {
		const skipCard = regular("red", "skip");
		const { players } = startGame(regular("red", 1), [
			handWith(skipCard),
			handWith(),
			handWith(),
		]);

		players[0]!.turns[0]!.complete([play(skipCard)]);

		expect(players[1]!.turns).toHaveLength(0);
		expect(players[2]!.turns[0]!.currentCard).toBe(skipCard);
	});

	it("reverses direction so play returns to the previous player", () => {
		const reverseCard = regular("red", "reverse");
		const { players } = startGame(regular("red", 1), [
			handWith(reverseCard),
			handWith(),
			handWith(),
		]);

		players[0]!.turns[0]!.complete([play(reverseCard)]);

		expect(players[1]!.turns).toHaveLength(0);
		expect(players[2]!.turns[0]!.currentCard).toBe(reverseCard);
	});

	it("makes the next player draw four cards after a wild draw-four and applies its chosen color", () => {
		const wildDrawFour: Card = {
			type: "wild",
			color: "black",
			value: "wild_draw_four",
		};
		const wrongColorCard = regular("red", 3);
		const chosenColorCard = regular("blue", 7);
		const drawnCards = [
			regular("yellow", 2),
			regular("green", 4),
			regular("red", 6),
			regular("yellow", 8),
		];
		const { players } = startGame(
			regular("green", 1),
			[
				handWith(wildDrawFour),
				handWith(wrongColorCard, chosenColorCard),
				handWith(),
			],
			drawnCards,
		);
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		players[0]!.turns[0]!.complete([play(wildDrawFour, "blue")]);

		expect(players[1]!.turns[0]!.handAtStart).toHaveLength(11);
		expect(players[1]!.turns[0]!.handAtStart.slice(-4)).toEqual(drawnCards);

		players[1]!.turns[0]!.complete([play(wrongColorCard)]);
		expect(consoleError).toHaveBeenCalledWith("Move rejected");
		expect(players[2]!.turns).toHaveLength(0);

		players[1]!.turns[0]!.complete([play(chosenColorCard)]);
		expect(players[2]!.turns[0]!.currentCard).toBe(chosenColorCard);
	});

	it("accepts an UNO call when the player plays down to one card", () => {
		const playableCards = [
			regular("red", 1),
			regular("red", 2),
			regular("red", 3),
			regular("red", 4),
			regular("red", 5),
			regular("red", 6),
		];
		const drawSequence = Array.from({ length: 6 }, (_, index) =>
			regular("blue", (index + 1) as NumericCardValue),
		);
		const { players } = startGame(
			regular("red", 0),
			[handWith(...playableCards), handWith()],
			drawSequence,
		);

		for (const [index, card] of playableCards.entries()) {
			const actions: PlayerAction[] = [play(card)];
			if (index === playableCards.length - 1) {
				actions.push({ name: "call_uno" });
			}
			players[0]!.turns[index]!.complete(actions);

			if (index < playableCards.length - 1) {
				players[1]!.turns[index]!.complete([{ name: "draw_card" }]);
			}
		}

		expect(players[0]!.turns[5]!.hand).toHaveLength(1);
		expect(players[1]!.turns).toHaveLength(6);
	});

	it("draws two punishment cards when a player reaches one card without calling UNO", () => {
		const playableCards = [
			regular("red", 1),
			regular("red", 2),
			regular("red", 3),
			regular("red", 4),
			regular("red", 5),
			regular("red", 6),
		];
		const drawSequence = Array.from({ length: 8 }, (_, index) =>
			regular("blue", (index + 1) as NumericCardValue),
		);
		const { players } = startGame(
			regular("red", 0),
			[handWith(...playableCards), handWith()],
			drawSequence,
		);
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		for (let index = 0; index < playableCards.length; index++) {
			players[0]!.turns[index]!.complete([play(playableCards[index]!)]);

			if (index < playableCards.length - 1) {
				players[1]!.turns[index]!.complete([{ name: "draw_card" }]);
			}
		}

		expect(consoleError).toHaveBeenCalledWith(
			"Player did not call UNO, even though he only has one card left in his hand. Dealing two punishment cards",
		);
		expect(players[0]!.turns[5]!.hand).toHaveLength(3);
		expect(players[0]!.turns[5]!.hand.slice(-2)).toEqual(
			drawSequence.slice(5, 7),
		);
	});
});
