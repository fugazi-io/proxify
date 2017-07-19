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
	requestHeaderName?: string;
	requestParamName?: string;
}

export function middleware(baseUrl: string, config: OAuthConfig) {
	BASE_URL = baseUrl;

	const oauthClient = createOAuthClient(config);
	let accessToken: oAuth2.AccessToken | null = null;

	return function handler(request: express.Request, response: express.Response, next: express.NextFunction) {
		if (request.method === "GET" && request.path === "REDIRECT_URI_PATH") {
			obtainToken(request, response, oauthClient).then(token => {
				accessToken = token;
				continueWithRequest(config, accessToken, request, next);
			});
		} else if (accessToken != null) {
			continueWithRequest(config, accessToken, request, next);
		} else {
			startAuthenticationFlow(response, oauthClient, getScope(config));
		}
	};
}

function createOAuthClient(config: OAuthConfig): oAuth2.OAuthClient {
	const options = Object.assign({}, config, { scope: undefined }) as oAuth2.ModuleOptions;
	return oAuth2.create(options);
}

function obtainToken(request: express.Request, response: express.Response, oauthClient: oAuth2.OAuthClient): PromiseLike<oAuth2.AccessToken> {
	const code = request.query.code as string;
	const tokenConfig = {
		code,
		redirect_uri: redirectUri()
	};

	return oauthClient.authorizationCode.getToken(tokenConfig)
		.then(result => oauthClient.accessToken.create(result))
		.catch(error => response.status(200).json({
				status: connector.clientTypes.ResultStatus.Failure,
				error: normalizeError(error)
			} as connector.clientTypes.FailResult));
}

function continueWithRequest(config: OAuthConfig, accessToken: oAuth2.AccessToken, request: express.Request, next: express.NextFunction) {
	if (config.requestHeaderName) {
		request.headers[config.requestHeaderName] = accessToken.toString();
	} else if (config.requestParamName) {
		switch (request.method) {
			case "GET":
				request.query[config.requestParamName] = accessToken.toString();
				break;

			case "POST":
				request.body[config.requestParamName] = accessToken.toString();
		}
	}

	return next();
}

function startAuthenticationFlow(response: express.Response, oauthClient: oAuth2.OAuthClient, scope: string) {
	const authorizationUri = oauthClient.authorizationCode.authorizeURL({
		redirect_uri: redirectUri(),
		scope
	});
	return response.status(200).json({
			status: connector.clientTypes.ResultStatus.OAuth2,
			authorizationUri: authorizationUri
		} as connector.clientTypes.OAuth2Result);
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
