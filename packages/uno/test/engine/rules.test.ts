import { describe, expect, it } from "vitest";
import { Card } from "../../src";
import { StandardUnoRuleEngine } from "../../src/engine/rules";

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
				expect(result.sideEffects).toHaveLength(1);
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
				expect(result.sideEffects).toHaveLength(1);
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
				expect(result.sideEffects).toHaveLength(2);
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
					"Expected 2 sideEffects to exist when a draw_four wild card is played",
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
