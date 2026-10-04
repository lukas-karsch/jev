import { describe, expect, it } from "vitest";
import { generateDeck } from "../../src/engine/cards";

describe("generateDeck", () => {
	it("should generate a deck of 108 cards", () => {
		const deck = generateDeck();
		expect(deck.length).toBe(108);
	});
});
