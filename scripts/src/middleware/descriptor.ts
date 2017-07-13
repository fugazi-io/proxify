/**
 * Created by nitzan on 12/07/2017.
 */

import * as express from "express";
import * as connector from "@fugazi/connector";

export function middleware(descriptorFileName: string, descriptor: connector.descriptors.RootModule) {
	return function handler(request: express.Request, response: express.Response, next: express.NextFunction) {
		if (request.url === "/" + descriptorFileName) {
			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(descriptor));
		} else {
			next();
		}
	};
}
