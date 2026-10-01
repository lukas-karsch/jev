export interface JevErrorOptions {
	cause?: unknown;
	code?: string;
	operation?: string;
}

/** An error raised while using the JEV client or communicating with the JEV service. */
export class JevError extends Error {
	readonly code?: string | undefined;
	readonly operation?: string | undefined;

	constructor(message: string, options: JevErrorOptions = {}) {
		super(message, { cause: options.cause });
		this.name = "JevError";
		this.code = options.code;
		this.operation = options.operation;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
