export type QuestionType = "choice" | "score" | "noul";

type CriteriaMap = {
	choice: Map<string, string>;
	score: string[];
	noul:
		| {
				true: string;
				false: string;
		  }
		| undefined;
};

type Criteria<T extends QuestionType> = CriteriaMap[T];

export type Question<T extends QuestionType = QuestionType> =
	T extends QuestionType
		? {
				type: T;
				instructions: string;
				criteria: Criteria<T>;
			}
		: never;

export class QuestionBuilder {
	static choice = (
		instructions: string,
		criteria: Criteria<"choice">,
	): Question<"choice"> => {
		return {
			type: "choice",
			instructions,
			criteria,
		};
	};

	static score = (
		instructions: string,
		criteria: Criteria<"score">,
	): Question<"score"> => {
		return {
			type: "score",
			instructions,
			criteria,
		};
	};

	static noul = (
		instructions: string,
		criteria?: Criteria<"noul">,
	): Question<"noul"> => {
		return {
			type: "noul",
			instructions,
			criteria,
		};
	};
}
