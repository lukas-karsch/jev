/**
 * @returns a shuffled version of the original deck. The original deck is not modified.
 */
export function shuffle<T>(deck: readonly T[]): T[] {
	const result = [...deck]; // Clone to avoid mutating the original deck

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = result[i]!;
		result[i] = result[j]!;
		result[j] = tmp;
	}

	return result;
}
