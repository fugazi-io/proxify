/**
 * Created by nitzan on 16/06/2017.
 */

import * as request from "request";
import { readFile, existsSync } from "fs";

import * as connector from "@fugazi/connector";

import program = require("commander");

import cors = require("cors");
import express = require("express");

import { middleware as proxyMiddleware } from "./middleware/proxy";
import { middleware as descriptorMiddleware } from "./middleware/descriptor";

const pjson = require("../../package.json");
const VERSION = pjson.version as string,
	DEFAULT_HOST = "localhost",
	DEFAULT_PORT = 33334;

program
	.version(VERSION)
	.usage("[options] descriptor-url-or-file")
	.option("--listen-host [host]", "Host on which the service will listen on")
	.option("--listen-port [port]", "Port on which the service will listen on")
	.parse(process.argv);

if (program.args.length !== 1) {
	program.help();
}

const listenHost = program.listenHost || DEFAULT_HOST;
const listenPort = Number(program.listenPort) || DEFAULT_PORT;
const listenUrl = `http://${ listenHost }:${ listenPort }`;

let app: express.Express;

if (program.args[0].startsWith("http")) {
	const url = program.args[0];
	const descriptorFileName = url.substring(url.lastIndexOf("/") + 1);

	getDescriptorFromUrl(url)
		.then(init.bind(null, descriptorFileName))
		.catch(error => {
			console.log("failed to load descriptor from: " + url);
			console.log("request error:");
			console.log(error);
		});
} else if (existsSync(program.args[0])) {
	const path = program.args[0];
	const descriptorFileName = path.substring(path.lastIndexOf("/") + 1);

	getDescriptorFromFile(path)
		.then(init.bind(null, descriptorFileName))
		.catch(error => {
			console.log("failed to load descriptor from: " + path);
			console.log("request error:");
			console.log(error);
		});
} else {
	console.log("argument isn't a url nor an existing file");
	program.help();
}

function init(descriptorFileName: string, descriptor: connector.descriptors.RootModule) {
	app = express();

	const corsMiddleware = cors();
	app.use(corsMiddleware);
	app.options("*", corsMiddleware);

	app.use(descriptorMiddleware(descriptorFileName, descriptor));

	const remoteOrigin = descriptor.remote!.origin;
	descriptor.remote!.origin = listenUrl;
	app.use(proxyMiddleware(remoteOrigin));

	app.listen(listenPort, listenHost, () => {
		console.log(`server started, listening to ${ listenHost }:${ listenPort }`);
		console.log(`load module descriptor from: ${ listenUrl }/${ descriptorFileName }`);
	});
}

function getDescriptorFromUrl(url: string): Promise<connector.descriptors.RootModule> {
	return new Promise<connector.descriptors.RootModule>((resolve, reject) => {
		request.get(url, (error, response, body) => {
			if (error) {
				reject(error);
			} else {
				try {
					resolve(JSON.parse(body));
				} catch (e) {
					reject("failed to parse descriptor");
				}
			}
		});
	});
}

function getDescriptorFromFile(path: string): Promise<connector.descriptors.RootModule> {
	return new Promise<connector.descriptors.RootModule>((resolve, reject) => {
		readFile(path, "utf-8", (error, content) => {
			if (error) {
				reject(error.message);
			} else {
				try {
					resolve(JSON.parse(content));
				} catch (e) {
					reject("failed to parse descriptor");
				}
			}
		});
	});
}
