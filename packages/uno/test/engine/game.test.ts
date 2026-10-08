import { afterEach, describe, expect, it, vi } from "vitest";
import {
	cardsSupplier,
	NumericCardValue,
	type Card,
} from "../../src/engine/cards";
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
			expect.any(Function),
		);
		expect(secondPlayer.onTurn).not.toHaveBeenCalled();
		expect(deck).toHaveLength(0);
	});
});

describe("turnMade", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("early checks", () => {
		it("throws when the game has not started yet", () => {
			const game = createGame();
			const player: Player = { onTurn: vi.fn() };

			expect(() =>
				game.turnMade(player, [{ name: "draw_card" }]),
			).toThrow("Game has not started yet.");
		});

		it("ignores actions from players who are not currently active", () => {
			const deck = Array.from(
				{ length: 20 },
				(_, index) =>
					({
						type: "regular",
						color: index % 2 === 0 ? "red" : "blue",
						value: (index % 10) as NumericCardValue,
					}) as const,
			);
			vi.spyOn(cardsSupplier, "getDeck").mockReturnValue(deck);
			const consoleError = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const firstPlayer: Player = { onTurn: vi.fn() };
			const secondPlayer: Player = { onTurn: vi.fn() };
			const game = createGame();

			game.startGame([firstPlayer, secondPlayer]);
			game.turnMade(secondPlayer, [{ name: "draw_card" }]);

			expect(consoleError).toHaveBeenCalledWith("It's not your turn.");
		});
	});

	describe("draw_card", () => {
		it("reshuffles the discard pile when the deck is empty while keeping the current card on top", () => {
			const game = createGame() as any;
			const currentPlayer: Player = { onTurn: vi.fn() };
			const otherPlayer: Player = { onTurn: vi.fn() };

			const bottomCard: Card = {
				type: "regular",
				color: "yellow",
				value: 7,
			};
			const middleCard: Card = {
				type: "regular",
				color: "green",
				value: 4,
			};
			const topCard: Card = { type: "regular", color: "red", value: 9 };

			const reshuffledDeck = [middleCard, bottomCard];
			const shuffleSpy = vi
				.spyOn(cardsSupplier, "shuffleDeck")
				.mockReturnValue(reshuffledDeck);

			game.gameContext = {
				players: [
					{ player: currentPlayer, cards: [] },
					{ player: otherPlayer, cards: [] },
				],
				playedCards: [bottomCard, middleCard, topCard],
				currentCard: () =>
					game.gameContext.playedCards[
						game.gameContext.playedCards.length - 1
					],
				deck: [],
				currentPlayerIndex: 0,
				direction: 1,
			};

			game.turnMade(currentPlayer, [{ name: "draw_card" }]);

			expect(shuffleSpy).toHaveBeenCalledWith([bottomCard, middleCard]);
			expect(game.gameContext.playedCards).toEqual([topCard]);
			expect(game.gameContext.currentCard()).toEqual(topCard);
			expect(game.gameContext.deck).toEqual(reshuffledDeck);
		});

		it("adds the drawn card to the current player's hand and removes it from the deck", () => {
			const game = createGame() as any;
			const currentPlayer: Player = { onTurn: vi.fn() };
			const otherPlayer: Player = { onTurn: vi.fn() };
			const topCard: Card = { type: "regular", color: "red", value: 9 };
			const cardInDeck: Card = {
				type: "regular",
				color: "blue",
				value: 3,
			};
			const otherDeckCard: Card = {
				type: "regular",
				color: "green",
				value: 5,
			};

			game.gameContext = {
				players: [
					{
						player: currentPlayer,
						cards: [{ type: "regular", color: "yellow", value: 1 }],
					},
					{ player: otherPlayer, cards: [] },
				],
				playedCards: [topCard],
				currentCard: () =>
					game.gameContext.playedCards[
						game.gameContext.playedCards.length - 1
					],
				deck: [cardInDeck, otherDeckCard],
				currentPlayerIndex: 0,
				direction: 1,
			};

			game.turnMade(currentPlayer, [{ name: "draw_card" }]);

			expect(game.gameContext.players[0].cards).toEqual([
				{ type: "regular", color: "yellow", value: 1 },
				otherDeckCard,
			]);
			expect(game.gameContext.deck).toEqual([cardInDeck]);
		});
	});

	describe("call_uno", () => {
		it("accepts an UNO call without changing state", () => {
			const game = createGame() as any;
			const currentPlayer: Player = { onTurn: vi.fn() };
			const otherPlayer: Player = { onTurn: vi.fn() };
			const card: Card = { type: "regular", color: "red", value: 1 };

			game.gameContext = {
				players: [
					{ player: currentPlayer, cards: [card] },
					{ player: otherPlayer, cards: [] },
				],
				playedCards: [card],
				currentCard: () =>
					game.gameContext.playedCards[
						game.gameContext.playedCards.length - 1
					],
				deck: [],
				currentPlayerIndex: 0,
				direction: 1,
			};

			expect(() =>
				game.turnMade(currentPlayer, [{ name: "call_uno" }]),
			).not.toThrow();
			expect(game.gameContext.players[0].cards).toEqual([card]);
			expect(game.gameContext.playedCards).toEqual([card]);
		});
	});
});
