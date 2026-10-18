import { describe, expect, it, vi } from "vitest";
import { Card } from "../../src";
import {
	DrawCardsSideEffect,
	ReverseSideEffect,
	SkipPlayerSideEffect,
	StackDrawCardsSideEffect,
	StandardUnoRuleEngine,
	WishColorSideEffect,
} from "../../src/engine/rules";
import type { GameContext } from "../../src/engine/game-context";

describe("StandardUnoRuleEngine", () => {
	describe("Standard Moves", () => {
		it("should allow the same number to be played; with no side effects", () => {
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: 1,
			};
			const card: Card = {
				type: "regular",
				color: "red",
				value: 1,
			};

			const underTest = new StandardUnoRuleEngine();

			expect(
				underTest.decide({ currentCard }, { name: "play_card", card }),
			).toEqual({
				decision: "accepted",
				sideEffects: [],
			});
		});

		it("should allow the same color to be played; with no side effects", () => {
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: 1,
			};
			const card: Card = {
				type: "regular",
				color: "blue",
				value: 2,
			};

			const underTest = new StandardUnoRuleEngine();

			expect(
				underTest.decide({ currentCard }, { name: "play_card", card }),
			).toEqual({
				decision: "accepted",
				sideEffects: [],
			});
		});

		it("should return the matching side effect for reverse and draw two cards", () => {
			const underTest = new StandardUnoRuleEngine();
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: 1,
			};
			const reverseResult = underTest.decide(
				{ currentCard },
				{
					name: "play_card",
					card: { type: "regular", color: "blue", value: "reverse" },
				},
			);
			const drawTwoResult = underTest.decide(
				{ currentCard },
				{
					name: "play_card",
					card: { type: "regular", color: "blue", value: "draw_two" },
				},
			);

			expect(reverseResult.decision).toBe("accepted");
			expect(drawTwoResult.decision).toBe("accepted");
			if (
				reverseResult.decision === "accepted" &&
				drawTwoResult.decision === "accepted"
			) {
				expect(reverseResult.sideEffects[0]).toBeInstanceOf(
					ReverseSideEffect,
				);
				expect(drawTwoResult.sideEffects[0]).toBeInstanceOf(
					StackDrawCardsSideEffect,
				);
			}
		});

		it("should allow a a different color with matching symbol to be played; with side effects", () => {
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: "skip",
			};
			const card: Card = {
				type: "regular",
				color: "red",
				value: "skip",
			};

			const underTest = new StandardUnoRuleEngine();

			const result = underTest.decide(
				{ currentCard },
				{ name: "play_card", card },
			);
			expect(result.decision).toBe("accepted");
			if ("sideEffects" in result) {
				expect(result.sideEffects).toEqual([
					expect.any(SkipPlayerSideEffect),
				]);
			} else {
				throw new Error("Expected sideEffects to exist on result");
			}
		});

		it("should reject when both color and value differ", () => {
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: 1,
			};
			const card: Card = {
				type: "regular",
				color: "red",
				value: 2,
			};

			const underTest = new StandardUnoRuleEngine();

			expect(
				underTest.decide({ currentCard }, { name: "play_card", card }),
			).toEqual({
				decision: "rejected",
			});
		});
	});

	describe("Wild Cards", () => {
		it("should allow a wild card on any other card", () => {
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: "skip",
			};
			const card: Card = {
				type: "wild",
				color: "black",
				value: "wild",
			};

			const underTest = new StandardUnoRuleEngine();

			const result = underTest.decide(
				{ currentCard },
				{ name: "play_card", card, chosenColor: "red" },
			);
			expect(result.decision).toBe("accepted");
			if ("sideEffects" in result) {
				expect(result.sideEffects).toEqual([
					expect.any(WishColorSideEffect),
				]);
			} else {
				throw new Error(
					"Expected sideEffects to exist when a wild card is played",
				);
			}
		});

		it("should allow a +4 wild card on any other card", () => {
			const currentCard: Card = {
				type: "regular",
				color: "blue",
				value: "skip",
			};
			const card: Card = {
				type: "wild",
				color: "black",
				value: "wild_draw_four",
			};

			const underTest = new StandardUnoRuleEngine();

			const result = underTest.decide(
				{ currentCard },
				{ name: "play_card", card, chosenColor: "red" },
			);
			expect(result.decision).toBe("accepted");
			if ("sideEffects" in result) {
				expect(result.sideEffects).toEqual([
					expect.any(WishColorSideEffect),
					expect.any(DrawCardsSideEffect),
				]);
			} else {
				throw new Error(
					"Expected 2 sideEffects to exist when a draw_four wild card is played",
				);
			}
		});

		it("should allow a blue card on top of a wild card that wished blue", () => {
			const currentCard: Card = {
				type: "wild",
				color: "black",
				value: "wild_draw_four",
			};
			const card: Card = {
				type: "regular",
				color: "blue",
				value: 3,
			};

			const underTest = new StandardUnoRuleEngine();

			const result = underTest.decide(
				{ currentCard, modifiers: { currentActiveColor: "blue" } },
				{ name: "play_card", card },
			);
			expect(result.decision).toBe("accepted");
			if ("sideEffects" in result) {
				expect(result.sideEffects).toHaveLength(0);
			} else {
				throw new Error(
					"Expected 0 sideEffects to exist when a draw_four wild card is played",
				);
			}
		});

		it("should reject a wrong color on top of a wild card", () => {
			const currentCard: Card = {
				type: "wild",
				color: "black",
				value: "wild_draw_four",
			};
			const card: Card = {
				type: "regular",
				color: "red",
				value: 3,
			};

			const underTest = new StandardUnoRuleEngine();

			const result = underTest.decide(
				{ currentCard, modifiers: { currentActiveColor: "blue" } },
				{ name: "play_card", card },
			);
			expect(result.decision).toBe("rejected");
		});
	});
});

describe("SideEffect", () => {
	const createGameContext = (deck: Card[] = []): GameContext => ({
		players: Array.from({ length: 4 }, () => ({
			player: { onTurn: () => {} },
			cards: [],
		})),
		currentCard: () => ({ type: "regular", color: "blue", value: 1 }),
		playedCards: [],
		deck,
		currentPlayerIndex: 0,
		advancePlayer: vi.fn(),
		direction: 1,
		pendingDrawCount: 0,
		dealCardsToPlayer: vi.fn(),
	});

	it("reverses the play direction", () => {
		const context = createGameContext();
		const effect = new ReverseSideEffect();

		effect.apply(context);

		expect(context.direction).toBe(-1);
	});

	it("sets the chosen color for a wild card", () => {
		const context = createGameContext();
		const effect = new WishColorSideEffect("red");

		effect.apply(context);

		expect(context.currentActiveColor).toBe("red");
	});

	it("advances the player for a skip card", () => {
		const context = createGameContext();
		const effect = new SkipPlayerSideEffect();

		effect.apply(context);

		expect(context.advancePlayer).toHaveBeenCalledOnce();
	});

	it("draws two cards for the next player", () => {
		const cards = [
			{ type: "regular", color: "red", value: 2 },
			{ type: "regular", color: "green", value: 3 },
		] satisfies Card[];
		const context = createGameContext(cards);
		const effect = new DrawCardsSideEffect(2);

		effect.apply(context);
		expect(context.currentPlayerIndex).toBe(0);
		expect(vi.mocked(context.dealCardsToPlayer)).toHaveBeenCalledWith(1, 2);
	});

	it("stacks a draw-two penalty without drawing immediately", () => {
		const context = createGameContext();
		const effect = new StackDrawCardsSideEffect(2);

		effect.apply(context);

		expect(context.pendingDrawCount).toBe(2);
		expect(context.players[1]!.cards).toEqual([]);
	});

	it("sets the chosen color and draws four cards for a wild draw four", () => {
		const cards = [
			{ type: "regular", color: "red", value: 2 },
			{ type: "regular", color: "green", value: 3 },
			{ type: "regular", color: "yellow", value: 4 },
			{ type: "regular", color: "blue", value: 5 },
		] satisfies Card[];
		const context = createGameContext(cards);
		const colorEffect = new WishColorSideEffect("green");
		const drawEffect = new DrawCardsSideEffect(4);

		colorEffect.apply(context);
		drawEffect.apply(context);
		expect(context.currentActiveColor).toBe("green");
		expect(context.currentPlayerIndex).toBe(0);
		expect(vi.mocked(context.dealCardsToPlayer)).toHaveBeenCalledWith(1, 4);
	});
});
