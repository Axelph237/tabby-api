import { OAuth2Tokens } from 'arctic'

export interface ParsedOAuth2Tokens {
	access_token: string;
	access_token_expires_at: Date,
	scope: string | null,
	token_type: string,
	id_token: string,
	refresh_token: string | null,
}

export default function parseOAuth2Tokens(tokens: OAuth2Tokens): ParsedOAuth2Tokens {
	return {
		access_token: tokens.accessToken(),
		access_token_expires_at: tokens.accessTokenExpiresAt(),
		scope: tokens.hasScopes() ? tokens.scopes().join(" ") : null,
		token_type: tokens.tokenType(),
		id_token: tokens.idToken(),
		refresh_token: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
	}
}