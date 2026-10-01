export type JevApiResponse = {
	model: string;
	answers: Record<string, QuestionResponse>;
	usage: {
		input_tokens: number;
		output_tokens: number;
	};
};

export class JevResponse {
	private readonly answers: Record<string, QuestionResponse>;
	private readonly usage: { inputTokens: number; outputTokens: number };
	private readonly model: string;

	constructor(apiResponse: JevApiResponse) {
		this.answers = apiResponse.answers;
		this.usage = {
			inputTokens: apiResponse.usage.input_tokens,
			outputTokens: apiResponse.usage.output_tokens,
		};
		this.model = apiResponse.model;
	}

	choiceResponse(questionId: string): Choice | undefined {
		const response = this.answers[questionId];
		if (response && "choice" in response) {
			return response;
		}
		return undefined;
	}

	scoreResponse(questionId: string): Score | undefined {
		const response = this.answers[questionId];
		if (response && "score" in response) {
			return response;
		}
		return undefined;
	}

	noulResponse(questionId: string): Noul | undefined {
		const response = this.answers[questionId];
		if (response && "noul" in response) {
			return response;
		}
		return undefined;
	}

	getAnswers(): Record<string, QuestionResponse> {
		return this.answers;
	}

	getModel() {
		return this.model;
	}

	getUsage() {
		return this.usage;
	}
}

export type Confidence = number;

export type QuestionResponse = Choice | Score | Noul;

export type Choice = {
	confidence: Confidence;
	probabilities: number[];
	choice: string;
};

export type Score = {
	score: number;
	legend: string;
	probabilities: number[];
	confidence: Confidence;
};

export type Noul = {
	noul: number;
};
