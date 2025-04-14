import {Elysia, t} from "elysia";
// import {oauth2} from "elysia-oauth2";
// import {providersCredentials} from "../../plugins/oauth-config";
// import jwt from "@elysiajs/jwt";
// import {jwtConfig} from "../../plugins/jwt-config";
// import {TokensService as ts} from "../../services/tokens.service";
// import {AuthPgsqlService} from "../../services/auth-pgsql.service";
import { jwtPlugin } from '@config/jwt'
import parseOAuth2Tokens from '@utils/parseOAuthTokens'
import { oauthPlugin } from '@config/oauth'
import { authController } from '@features/auth/auth.controller'

export const GoogleAuthRoutes = new Elysia({ prefix: "/google" })
    .use(authController({
        name: "ac"
    }))
    .use(jwtPlugin)
    .use(oauthPlugin)
    // handlers
    .get("/", async ({ oauth2, redirect }) => {
        const url = oauth2.createURL("Google", ["email"]);
        url.searchParams.set("access_type", "offline");

        return redirect(url.href);
    })
    .get("/callback", async ({ oauth2, jwt, ac, cookie: { auth }, redirect, loginCallback }) => {
        // console.log("Callback called.");
        const tokens = await oauth2.authorize("Google");
        const parsedTokens = parseOAuth2Tokens(tokens);

        // get user data
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${parsedTokens.access_token}`,
            { method: "GET" }
        );
        if (!response.ok)
            throw new Error("Failed to get user data.");

        // create user object
        const { email, email_verified, picture } = await response.json();
        const user = {
            name: "New Name",
            image: picture ?? null,
            email, email_verified
        };

        // store user account
        const userId = await ac.storeOAuthAccount(parsedTokens, user, "Google");

        // create jwt
        const value = await jwt.sign({
            sub: userId,
            "email": user.email,
            "user_image": user.image,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(parsedTokens.access_token_expires_at.getTime() / 1000)
        });
        console.log("Generated JWT:", value);

        // set http-only cookie
        auth.set({
            value,
            httpOnly: true,
            path: "/",
            // domain: process.env.DOMAIN ?? "localhost",
            maxAge: 60 * 60 * 24 // 1 day
        });

        return redirect(loginCallback);
    })