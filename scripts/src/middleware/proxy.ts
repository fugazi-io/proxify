/**
 * Created by nitzan on 12/07/2017.
 */

import * as express from "express";
import * as httpProxy from "http-proxy";

import { writeCorsHeaders } from "../utils";

let proxy: httpProxy.ProxyServer;

export function middleware(remoteOrigin: string) {
	proxy = httpProxy.createProxyServer({
		target: remoteOrigin
	});

	proxy.on("proxyRes", (proxyRes, request, response) => {
		writeCorsHeaders(response);
	});

	return function handler(request: express.Request, response: express.Response) {
		proxy.web(request, response);
	};
}
