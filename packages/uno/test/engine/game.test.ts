import { afterEach, describe, expect, it, vi } from "vitest";
import { cardsSupplier, type Card } from "../../src/engine/cards";
import createGame from "../../src/engine/game";
import type { Player } from "../../src/engine/player";

describe("startGame", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("rejects fewer than two players", () => {
		const getDeck = vi.spyOn(cardsSupplier, "getDeck");
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const player: Player = { onTurn: vi.fn() };

		createGame().startGame([player]);

		expect(error).toHaveBeenCalled();
		expect(getDeck).not.toHaveBeenCalled();
		expect(player.onTurn).not.toHaveBeenCalled();
	});

	it("deals seven cards to each player before the first turn", () => {
		const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
		const deck: Card[] = Array.from({ length: 15 }, (_, index) => ({
			type: "regular",
			color: "red",
			value: values[index % values.length]!,
		}));
		const originalDeck = [...deck];
		vi.spyOn(cardsSupplier, "getDeck").mockReturnValue(deck);
		const firstPlayer: Player = { onTurn: vi.fn() };
		const secondPlayer: Player = { onTurn: vi.fn() };

		createGame().startGame([firstPlayer, secondPlayer]);

		expect(firstPlayer.onTurn).toHaveBeenCalledExactlyOnceWith(
			originalDeck.slice(8).reverse(),
			originalDeck[0],
		);
		expect(secondPlayer.onTurn).not.toHaveBeenCalled();
		expect(deck).toHaveLength(0);
	});
});
