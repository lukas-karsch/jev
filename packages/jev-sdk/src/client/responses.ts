import type { Question, QuestionType } from "./questions";

export type QuestionMap = Record<string, Question>;

export type ResponseForQuestion<Q extends Question> = Q extends {
	type: "choice";
}
	? Choice
	: Q extends { type: "score" }
		? Score
		: Q extends { type: "noul" }
			? Noul
			: never;

export type AnswersForQuestions<Q extends QuestionMap> = {
	[K in keyof Q]: ResponseForQuestion<Q[K]>;
};

type QuestionIdsOfType<Q extends QuestionMap, T extends QuestionType> = {
	[K in keyof Q]: Q[K] extends { type: T } ? K : never;
}[keyof Q] &
	string;

/**
 * The type returned by Jev's API.
 */
export type JevApiResponse<Q extends QuestionMap = QuestionMap> = {
	model: string;
	answers: AnswersForQuestions<Q>;
	usage: {
		input_tokens: number;
		output_tokens: number;
	};
};

export class JevResponse<Q extends QuestionMap = QuestionMap> {
	readonly answers: AnswersForQuestions<Q>;
	readonly usage: { inputTokens: number; outputTokens: number };
	readonly model: string;

	constructor(apiResponse: JevApiResponse<Q>) {
		this.answers = apiResponse.answers;
		this.usage = {
			inputTokens: apiResponse.usage.input_tokens,
			outputTokens: apiResponse.usage.output_tokens,
		};
		this.model = apiResponse.model;
	}

	choiceResponse<K extends QuestionIdsOfType<Q, "choice">>(
		questionId: K,
	): Choice {
		const response = this.answers[questionId];
		if (response && "choice" in response) {
			return response;
		}
		throw new Error(`Question ${questionId} is not of type "choice"`);
	}

	// TODO add methods somewhere like "likeliestChoice" etc
	scoreResponse<K extends QuestionIdsOfType<Q, "score">>(
		questionId: K,
	): Score {
		const response = this.answers[questionId];
		if (response && "score" in response) {
			return response;
		}
		throw new Error(`Question ${questionId} is not of type "score"`);
	}

	noulResponse<K extends QuestionIdsOfType<Q, "noul">>(questionId: K): Noul {
		const response = this.answers[questionId];
		if (response && "noul" in response) {
			return response;
		}
		throw new Error(`Question ${questionId} is not of type "noul"`);
	}
}

export type Confidence = number;

export type QuestionResponse = Choice | Score | Noul;

export type Choice = {
	type: "choice";
	confidence: Confidence;
	probabilities: number[];
	choice: string;
};

export type Score = {
	type: "score";
	score: number;
	legend: Record<string, string>;
	probabilities: Record<string, number>;
	confidence: Confidence;
};

export type Noul = {
	type: "noul";
	noul: number;
};
