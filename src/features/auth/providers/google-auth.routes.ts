import { Elysia } from "elysia";
import { jwtPlugin } from '@config/jwt'
import parseOAuth2Tokens from '@utils/parseOAuthTokens'
import { oauthPlugin } from '@config/oauth'
import { authSetup } from "../auth.setup";

export const GoogleAuthRoutes = new Elysia({ prefix: "/google" })
    .use(jwtPlugin)
    .use(oauthPlugin)
    .use(authSetup)
    // handlers
    .get("/", async ({ oauth2, redirect }) => {
        const url = oauth2.createURL("Google", ["email"]);
        url.searchParams.set("access_type", "offline");

        return redirect(url.href);
    })
    .get("/callback", async ({ oauth2, jwt, cookie: { auth }, redirect, error, accountRepo, loginCallback }) => {
        // console.log("Callback called.");
        const tokens = await oauth2.authorize("Google");
        const parsedTokens = parseOAuth2Tokens(tokens);

        // get user data
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${parsedTokens.accessToken}`,
            { method: "GET" }
        );
        if (!response.ok)
            return error(500, "Failed to fetch user data from google api`.");

        // create user object
        const { email, email_verified, picture } = await response.json();
        const user = {
            name: "New Name",
            image: picture ?? null,
            emailVerified: email_verified, // breh
            email
        };

        // store user account
        const userId = await accountRepo.$createOAuthAccount("Google", parsedTokens, user);

        // create jwt
        const value = await jwt.sign({
            sub: userId,
            "email": user.email,
            "user_image": user.image,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(parsedTokens.accessTokenExpiresAt.getTime() / 1000)
        });
        console.log("Generated JWT:", value);

        // set http-only cookie
        auth.set({
            value,
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 // 1 day
        });

        return redirect(loginCallback);
    })