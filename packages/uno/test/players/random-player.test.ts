import { describe, expect, it } from "vitest";
import { Card } from "../../src/engine/cards";
import { PlayerAction } from "../../src/engine/player";
import { RandomPlayer } from "../../src/players/random-player";

describe("RandomPlayer", () => {
	it("chooses the most frequent color in hand when playing a wild card", () => {
		const ownCards: Card[] = [
			{ type: "regular", color: "red", value: 1 },
			{ type: "regular", color: "red", value: 2 },
			{ type: "regular", color: "green", value: 3 },
			{ type: "regular", color: "yellow", value: 4 },
			{ type: "wild", color: "black", value: "wild" },
		];
		const actions: PlayerAction[][] = [];

		new RandomPlayer().onTurn(
			ownCards,
			{ type: "regular", color: "blue", value: 9 },
			(action) => actions.push(action),
		);

		expect(actions).toEqual([
			[
				{
					card: { type: "wild", color: "black", value: "wild" },
					name: "play_card",
					chosenColor: "red",
				},
			],
		]);
	});

	it("calls UNO after playing a regular card when one card remains", () => {
		const ownCards: Card[] = [
			{ type: "regular", color: "blue", value: 1 },
			{ type: "regular", color: "red", value: 2 },
		];
		const actions: PlayerAction[][] = [];

		new RandomPlayer().onTurn(
			ownCards,
			{ type: "regular", color: "blue", value: 9 },
			(action) => actions.push(action),
		);

		expect(actions).toEqual([
			[
				{
					card: { type: "regular", color: "blue", value: 1 },
					name: "play_card",
				},
				{ name: "call_uno" },
			],
		]);
	});

	it("calls UNO after playing a wild card when one card remains", () => {
		const ownCards: Card[] = [
			{ type: "wild", color: "black", value: "wild" },
			{ type: "regular", color: "red", value: 2 },
		];
		const actions: PlayerAction[][] = [];

		new RandomPlayer().onTurn(
			ownCards,
			{ type: "regular", color: "blue", value: 9 },
			(action) => actions.push(action),
		);

		expect(actions).toEqual([
			[
				{
					card: { type: "wild", color: "black", value: "wild" },
					name: "play_card",
					chosenColor: "red",
				},
				{ name: "call_uno" },
			],
		]);
	});
});
