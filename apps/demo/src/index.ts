import { buildJevClient, QuestionBuilder } from "@typesafe/jev-sdk";

const apiKey = process.env.TYPESAFE_API_KEY;

if (!apiKey) {
	throw new Error("Set TYPESAFE_API_KEY before running the Jev demo.");
}

const client = buildJevClient({ apiKey });

async function main(): Promise<void> {
	const question = QuestionBuilder.noul("Is the user correct?");

	const response = await client.send(
		"The user says he paid for the product but he never did, as shown by the Stripe logs",
		{
			user_complaint: question,
		},
	);
	console.log(response.noulResponse("user_complaint"));
}

main().catch(console.error);
