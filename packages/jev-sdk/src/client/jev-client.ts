import type { JevResponse } from "./responses";
import type { Question } from "./questions";

export interface JevClient {
	send(
		state: string,
		questions: Record<string, Question>,
	): Promise<JevResponse>;
}

class JevClientImpl implements JevClient {
	private static readonly apiEndpoint =
		"https://api.typesafe.ai/v1/systemone";

	constructor(private config: JevClientConfig) {
		this.config = config;
	}

	async send(
		state: string,
		questions: Record<string, Question>,
	): Promise<JevResponse> {
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

		return body as JevResponse;
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
