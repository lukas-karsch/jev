import { shuffle } from "./random";

export type NumericCardValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Color = "red" | "yellow" | "green" | "blue";

export type RegularCard = {
	type: "regular";
	color: Color;
	value: NumericCardValue | "skip" | "reverse" | "draw_two";
};

export type WildCard = {
	type: "wild";
	color: "black";
	value: "wild" | "wild_draw_four";
};

export type Card = RegularCard | WildCard;

export function generateDeck(): Card[] {
	const deck: Card[] = [];
	const colors = ["red", "yellow", "green", "blue"] as const;
	const values = [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		"skip",
		"reverse",
		"draw_two",
	] as const;
	// create regular cards
	// each value twice, except for 0, which is only once per color
	for (const color of colors) {
		for (const value of values) {
			deck.push({ color, value, type: "regular" });
			if (value !== 0) {
				deck.push({ color, value, type: "regular" });
			}
		}
	}

	// create wild cards
	for (let i = 0; i < 4; i++) {
		deck.push({
			color: "black",
			value: "wild",
			type: "wild",
		});
		deck.push({
			color: "black",
			value: "wild_draw_four",
			type: "wild",
		});
	}

	return deck;
}

export interface CardsSupplier {
	getDeck(): Card[];
	shuffleDeck(deck: Card[]): Card[];
}

export const cardsSupplier: CardsSupplier = {
	getDeck: () => shuffle(generateDeck()),
	shuffleDeck: (deck) => shuffle(deck),
};
