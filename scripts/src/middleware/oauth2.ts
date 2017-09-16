/**
 * Created by ehoggeg on 14/07/2017.
 */

import { readFileSync } from "fs";
import * as express from "express";
import * as oAuth2 from "simple-oauth2";
import * as URL from "url";
import * as httpRequest from "request";

import * as connector from "@fugazi/connector";

const REDIRECT_URI_PATH = "/oauth2/authorization-callback";
const HTML_FILE = readFileSync("../../public/oAuth2ResponseDialog.html", "utf-8");
let LOCAL_URL: string,
	REMOTE_URL: string,
	CONFIG: OAuthConfig,
	TOKEN: oAuth2.AccessToken | undefined;

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

export function middleware(localUrl: string, remoteUrl: string, config: OAuthConfig) {
	LOCAL_URL = localUrl;
	REMOTE_URL = remoteUrl;
	CONFIG = config;

	const oauthClient = createOAuthClient(config);

	return function handler(request: express.Request, response: express.Response, next: express.NextFunction) {
		if (request.method === "GET" && request.path === REDIRECT_URI_PATH) {
			obtainToken(request, response, oauthClient).then(token => {
				TOKEN = token;
			});
		} else if (TOKEN) {
			continueWithRequest(request, response);
		} else {
			startAuthenticationFlow(response, oauthClient, getScope(config));
		}
	};
}

function createOAuthClient(config: OAuthConfig): oAuth2.OAuthClient {
	const options = Object.assign({}, config) as oAuth2.ModuleOptions;
	["scope", "requestHeaderName", "requestParamName"].forEach(key => {
		delete (options as any)[key];
	});
	return oAuth2.create(options);
}

function obtainToken(request: express.Request, response: express.Response, oauthClient: oAuth2.OAuthClient): PromiseLike<oAuth2.AccessToken> {
	console.log(request.url);
	const code = request.query.code as string;
	const tokenConfig = {
		code,
		redirect_uri: redirectUri()
	};

	return oauthClient.authorizationCode.getToken(tokenConfig)
		.then(result => {
			const token = oauthClient.accessToken.create(result);
			response.status(200).send(HTML_FILE);
			return token;
		})
		.catch(error => response.status(200).json({
				status: connector.clientTypes.ResultStatus.Failure,
				error: normalizeError(error)
			} as connector.clientTypes.FailResult));
}

function continueWithRequest(originalRequest: express.Request, originalResponse: express.Response) {
	const options = getOAuthRequestOptions(originalRequest);

	httpRequest(options, (error, response, body) => {
		let status: number;
		let errorMessage: string | undefined;

		if (error) {
			status = 400;
			errorMessage = normalizeError(error);
		} else {
			status = response.statusCode!;
			if (status.toString().charAt(0) !== "2") {
				errorMessage = normalizeError(body);
			}
		}

		if (errorMessage) {
			originalResponse.status(status).json({
				status: connector.clientTypes.ResultStatus.Failure,
				error: errorMessage
			});
		} else {
			let data: any = body;

			if (typeof body === "string") {
				try {
					data = JSON.parse(body);
				} catch (e) {}
			}

			originalResponse.status(200).json({
				status: connector.clientTypes.ResultStatus.Success,
				value: data
			});
		}
	});
}

function getOAuthRequestOptions(originalRequest: express.Request): httpRequest.CoreOptions & httpRequest.UrlOptions {
	const url = URL.parse(`${ originalRequest.protocol }://${ originalRequest.hostname }` + originalRequest.path);
	let path = url.pathname;
	let querystring = url.search;

	if (CONFIG.requestParamName) {
		if (!querystring || querystring === "") {
			querystring = "?";
		} else {
			querystring += "&";
		}

		querystring += `${ CONFIG.requestParamName }=${ (TOKEN!.token as any).access_token }`;
	}

	const options = {
		headers: {
			"User-Agent": "fugazi proxify"
		},
		url: REMOTE_URL,
		method: originalRequest.method
	} as httpRequest.CoreOptions & httpRequest.UrlOptions;

	if (!(options.url as string).endsWith("/")) {
		options.url += "/";
	}

	if (path!.startsWith("/")) {
		path = path!.substring(1);
	}

	options.url += path! + querystring;

	if (CONFIG.requestHeaderName) {
		options.headers![CONFIG.requestHeaderName] = (TOKEN!.token as any).access_token;
	}

	//TODO: handle POST data

	return options;
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
	let result = LOCAL_URL;

	if (!LOCAL_URL.endsWith("/")) {
		result += "/";
	}

	if (REDIRECT_URI_PATH.startsWith("/")) {
		result += REDIRECT_URI_PATH.substring(1);
	} else {
		result += REDIRECT_URI_PATH;
	}

	return result;
}

function getScope(config: OAuthConfig): string {
	if (!config.scope) {
		return "";
	}

	if (typeof config.scope === "string") {
		return config.scope;
	}

	return config.scope.join(",");
}

function normalizeError(error: any): string {
	if (!error) {
		return "unknown error";
	}

	if (typeof error === "string") {
		return error;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return error.toString();
}
