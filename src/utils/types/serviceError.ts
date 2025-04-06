/**
 * Error class for providing service error details, and passing other errors along.
 */
export class ServiceError extends Error {
	offender: unknown

	constructor(message: string, offender?: unknown) {
		super(message);
		this.name = "ServiceError";
		this.offender = offender;

		Object.setPrototypeOf(this, ServiceError.prototype);
	}

	toString = () => this.message + " | Offending error: " + this.offender;
}
