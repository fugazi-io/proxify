/**
 * Created by nitzan on 12/07/2017.
 */

import * as express from "express";
import * as httpProxy from "http-proxy";

let proxy: httpProxy.ProxyServer;

export function middleware(remoteOrigin: string) {
	proxy = httpProxy.createProxyServer({
		target: remoteOrigin,
		secure: false
	});

	const dummy = httpProxy.createProxyServer({
		target: "http://localhost:3211",
		secure: false
	});

	proxy.on('proxyReq', function (err, req, res) {
		console.log("about to send request: ");
	});

	return function handler(request: express.Request, response: express.Response) {
		/*if (request.query.access_token) {
			console.log("sending dummy request: ", request.query);
			request.url += `?access_token=${ request.query.access_token }`;
			dummy.web(request, response);
		} else {
			console.log("sending proxy request: ", request.query);
			proxy.web(request, response);
		}*/

		if (request.query.access_token && request.url.indexOf("access_token=") < 0) {
			request.url += (request.url.indexOf("?") < 0 ? "?" : "&") + `access_token=${ request.query.access_token }`;
		}

		console.log(`proxing: ${ request.protocol }://${ request.hostname }${ request.url }`);
		proxy.web(request, response);
	};
}
