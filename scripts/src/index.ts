/**
 * Created by nitzan on 16/06/2017.
 */

import * as request from "request";
import { readFile, readFileSync, existsSync } from "fs";

import * as connector from "@fugazi/connector";

import program = require("commander");
declare module "commander" {
	interface ICommand {
		oauth?: string;
		listenHost?: string;
		listenPort?: number | string;
	}
}

import cors = require("cors");
import express = require("express");
import bodyParser = require("body-parser");

import { middleware as proxyMiddleware } from "./middleware/proxy";
import { middleware as oAuth2Middleware } from "./middleware/oauth2";
import { middleware as descriptorMiddleware } from "./middleware/descriptor";

const pjson = require("../../package.json");
const VERSION = pjson.version as string,
	DEFAULT_HOST = "localhost",
	DEFAULT_PORT = 33334;

program
	.version(VERSION)
	.usage("[options] descriptor-url-or-file")
	.option("--listen-host host", "Host on which the service will listen on")
	.option("--listen-port port", "Port on which the service will listen on")
	.option("--oauth oauth-file-path", "OAuth data file (see ...)")
	.parse(process.argv);

if (program.args.length !== 1) {
	program.help();
}

const listenHost = program.listenHost || DEFAULT_HOST;
const listenPort = Number(program.listenPort) || DEFAULT_PORT;
const listenUrl = `http://${ listenHost }:${ listenPort }`;

let app: express.Express;

if (program.args[0].startsWith("http")) {
	getDescriptor(getDescriptorFromUrl);
} else if (existsSync(program.args[0])) {
	getDescriptor(getDescriptorFromFile);
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

	if (program.oauth) {
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));

		const oAuth2Config = JSON.parse(readFileSync(program.oauth, "utf-8"));
		app.use(oAuth2Middleware(`http://${ listenHost }:${ listenPort }/`, oAuth2Config));
	}

	const remoteOrigin = descriptor.remote!.origin;
	descriptor.remote!.origin = listenUrl;
	app.use(proxyMiddleware(remoteOrigin));

	app.listen(listenPort, listenHost, () => {
		console.log(`server started, listening to ${ listenHost }:${ listenPort }`);
		console.log(`load module descriptor from: ${ listenUrl }/${ descriptorFileName }`);
	});
}

function getDescriptor(method: (str: string) => Promise<connector.descriptors.RootModule>) {
	const path = program.args[0];
	const descriptorFileName = path.substring(path.lastIndexOf("/") + 1);

	method(path)
		.then(init.bind(null, descriptorFileName))
		.catch(error => {
			console.log("failed to load descriptor from: " + path);
			console.log("request error:");
			console.log(error);
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
