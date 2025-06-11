import { OAuth2Tokens } from 'arctic'

export interface ParsedOAuth2Tokens {
	accessToken: string;
	accessTokenExpiresAt: Date,
	scope: string | null,
	tokenType: string,
	idToken: string,
	refreshToken: string | null,
}

export default function parseOAuth2Tokens(tokens: OAuth2Tokens): ParsedOAuth2Tokens {
	return {
		accessToken: tokens.accessToken(),
		accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
		scope: tokens.hasScopes() ? tokens.scopes().join(" ") : null,
		tokenType: tokens.tokenType(),
		idToken: tokens.idToken(),
		refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
	}
}