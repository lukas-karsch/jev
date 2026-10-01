import type { JevApiResponse, QuestionMap } from "./responses";
import { JevResponse } from "./responses";

export interface JevClient {
	send<Q extends QuestionMap>(
		state: string,
		questions: Q,
	): Promise<JevResponse<Q>>;
}

class JevClientImpl implements JevClient {
	private static readonly apiEndpoint =
		"https://api.typesafe.ai/v1/systemone";

	constructor(private config: JevClientConfig) {
		this.config = config;
	}

	async send<Q extends QuestionMap>(
		state: string,
		questions: Q,
	): Promise<JevResponse<Q>> {
		const requestBody = {
			state,
			model: this.config.model || "jev-latest",
			questions,
		};
		const response = await fetch(JevClientImpl.apiEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.config.apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (response.status !== 200) {
			throw new Error(`Failed to send question: ${response.statusText}`);
		}

		const body = await response.json();

		return new JevResponse(body as JevApiResponse<Q>);
	}
}

export type JevClientConfig = {
	apiKey: string;
	url?: string;
	model?: string;
};

export function buildJevClient(config: JevClientConfig): JevClient {
	return new JevClientImpl(config);
}
