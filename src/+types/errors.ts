/**
 * Error class for providing service error details, and passing other errors along.
 */
export class ServiceError extends Error {
	offender: unknown

	constructor(message: string, offender?: unknown) {
		super(message)
		this.offender = offender
	}

	toString = () => this.message + " | Offending error: " + this.offender;
}
