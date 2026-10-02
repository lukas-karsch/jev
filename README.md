# Jev

> Jev is TypeSafe’s flagship model and the first System One model. Send state and typed questions; get structured answers your code can use directly.

This repository is for experimenting with Typesafe's Jev model. The first goal is to build a clear, type-safe TypeScript SDK. The apps in `/apps` then use that SDK to explore different Jev use cases.

## Repository Structure

This is a monorepo scaffolded with pnpm and turborepo. 

- `packages/jev-sdk/` contains the reusable Jev client, question builders, and typed responses.
- `apps/demo/` is the first example app. Future experiments are added as separate apps here; all of them will depend on the SDK.
- The root configures pnpm workspaces, shared TypeScript settings, and Turbo commands.

## SDK

The SDK supports `choice`, `score`, and `noul` questions. `send()` infers answer types from the questions object, including its question IDs:

```ts
const state = {
	userMessage: "I have never received my product even though I paid!", 
	systemContext: {
		stripeLogs: "no payment found for user_123",
	}
}

const response = await client.send(state, {
	user_complaint: QuestionBuilder.noul("Is the user correct?"),
});

response.answers.user_complaint.noul; // number
response.noulResponse("user_complaint"); // Noul
response.choiceResponse("user_complaint"); // TS Error! 
```

Answer properties are typed for the question submitted under each key. The response accessors also accept only IDs for questions of the matching kind, so using a choice ID with `noulResponse()` is a type error. The SDK builds ESM and CommonJS packages with TypeScript declarations.

## Commands

- `pnpm install` installs dependencies.
- `pnpm build` builds the workspace packages.
- `pnpm typecheck` checks the packages and apps.
- `pnpm dev` runs the demo app and automatically builds all packages in `watch` mode. Set `TYPESAFE_API_KEY` in the environment first.

## Further Links 

- [TypeSafe Docs](https://docs.typesafe.ai/introduction)
