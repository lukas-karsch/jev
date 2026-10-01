import { buildJevClient, QuestionBuilder } from "@typesafe/jev-sdk";

const apiKey = process.env.TYPESAFE_API_KEY;

if (!apiKey) {
	throw new Error("Set TYPESAFE_API_KEY before running the Jev demo.");
}

const client = buildJevClient({ apiKey });

async function main(): Promise<void> {
	const state = {
		userMessage: "I have never received my product even though I paid!",
		systemContext: {
			stripeLogs: "no payment found for user_123",
		},
	};
	const noulQuestion = QuestionBuilder.noul("Is the user correct?"); // between 0 and 1

	const scoreQuestion = QuestionBuilder.score(
		"How likely will the user place another order?",
		["very unlikely", "unlikely", "neutral", "likely", "very likely"],
	);

	const response = await client.send(state, {
		user_complaint: noulQuestion,
		return_probability: scoreQuestion,
	});

	console.dir(response.answers, { depth: 3 });
}

main().catch(console.error);
