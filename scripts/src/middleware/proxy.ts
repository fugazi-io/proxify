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

	proxy.on('proxyReq', function (err, req, res) {
		console.log("about to send request: ");
	});

	return function handler(request: express.Request, response: express.Response) {
		console.log("sending proxy request: ", request.query);
		request.url += `?access_token=${ request.query.access_token }`;
		proxy.web(request, response);
	};
}
