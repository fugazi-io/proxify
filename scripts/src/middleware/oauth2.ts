/**
 * Created by ehoggeg on 14/07/2017.
 */

import * as express from "express";
import * as oAuth2 from "simple-oauth2";

import * as connector from "@fugazi/connector";

const REDIRECT_URI_PATH = "/oauth2/authorization-callback";
let BASE_URL: string;

export type OAuthConfig = {
    client: {
        id: string;
        secret: string;
    },
    auth: {
        tokenHost: string;
        tokenPath?: string;
        revokePath?: string;
        authorizeHost?: string;
        authorizePath?: string;
    },
    scope: string | string[];
}

export function middleware(baseUrl: string, config: OAuthConfig) {
    BASE_URL = baseUrl;

    const oauthClient = createOAuthClient(config);
    let isAuthenticated = false;

    return function handler(request: express.Request, response: express.Response, next: express.NextFunction) {
        if (request.method === "GET" && request.path === "REDIRECT_URI_PATH") {
            obtainToken();
        } else if (isAuthenticated) {
            continueWithRequest();
        } else {
            startAuthenticationFlow(baseUrl, oauthClient, getScope(config));
        }
    };
}

function createOAuthClient(config: OAuthConfig): oAuth2.OAuthClient {
    const options = Object.assign({}, config, { scope: undefined }) as oAuth2.ModuleOptions;
    return oAuth2.create(options);
}

function obtainToken(request: express.Request, response: express.Response, oauthClient: oAuth2.OAuthClient) {
    const code = request.query.code as string;
    const options = {
        code,
        redirect_uri: redirectUri()
    };

    oauthClient.authorizationCode.getToken(options, (error, result) => {
        if (error) {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end({

            } as connector.components.);
        }
    });
}

function continueWithRequest() {

}

function startAuthenticationFlow(oauthClient: oAuth2.OAuthClient, scope: string) {
    const authorizationUri = oauthClient.authorizationCode.authorizeURL({
        redirect_uri: redirectUri(),
        scope
    });

    // response with oauth request
}

function redirectUri() {
    return (BASE_URL + REDIRECT_URI_PATH).replace(/\/\//g, "/");
}

function getScope(config: OAuthConfig): string {
    if (typeof config.scope === "string") {
        return config.scope;
    }

    return config.scope.join(",");
}

function normalizeError(error: any): string {
    if (typeof error === "string") {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return error.toString();
}
