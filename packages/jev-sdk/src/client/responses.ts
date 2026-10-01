export type JevResponse = Record<string, QuestionResponse>;

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
