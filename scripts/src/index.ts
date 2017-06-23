/**
 * Created by nitzan on 16/06/2017.
 */

import * as http from "http";
import * as request from "request";
import * as httpProxy from "http-proxy";

import * as connector from "@fugazi/connector";

import program = require("commander");

const pjson = require("../../package.json");
const VERSION = pjson.version as string,
	DEFAULT_HOST = "localhost",
	DEFAULT_PORT = 33334;

program
	.version(VERSION)
	.usage("[options] descriptor-url")
	.option("--listen-host [host]", "Host on which the service will listen on")
	.option("--listen-port [port]", "Port on which the service will listen on")
	.parse(process.argv);

if (program.args.length !== 1) {
	program.help();
}

const listenHost = program.listenHost || DEFAULT_HOST;
const listenPort = Number(program.listenPort) || DEFAULT_PORT;
const listenUrl = `http://${ listenHost }:${ listenPort }`;

const descriptorRemoteUrl = program.args[0];
const descriptorFileName = descriptorRemoteUrl.substring(descriptorRemoteUrl.lastIndexOf("/") + 1);

let remoteOrigin: string;
let server: http.Server;
let proxy: httpProxy.ProxyServer;
let descriptor: connector.descriptors.RootModule;
let descriptorLocalUrl: string;

function init(rootDescriptor: connector.descriptors.RootModule) {
	remoteOrigin = rootDescriptor.remote!.origin;

	descriptor = rootDescriptor;
	descriptorLocalUrl = `${ listenUrl }/${ descriptorFileName }`;
	descriptor.remote!.origin = listenUrl;

	createAndStartProxy();
	createAndStartHttpServer();
}

function writeCorsHeaders(response: http.ServerResponse) {
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Methods", "POST, PUT, DELETE, GET, OPTIONS");
	response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function createAndStartProxy() {
	proxy = httpProxy.createProxyServer({
		target: remoteOrigin
	});

	proxy.on("proxyRes", (proxyRes, request, response) => {
		writeCorsHeaders(response);
	});
}

function createAndStartHttpServer() {
	server = http.createServer((request, response) => {
		if (request.method === "OPTIONS") {
			writeCorsHeaders(response);
			response.writeHead(200);
			response.end();
		} else if (request.url === "/" + descriptorFileName) {
			writeCorsHeaders(response);
			response.writeHead(200, { "Content-Type": "application/json" });
			response.end(JSON.stringify(descriptor));
		} else {
			proxy.web(request, response);
		}
	});
	server.listen(listenPort, listenHost, () => {
		console.log(`server started, listening to ${ listenHost }:${ listenPort }`);
		console.log("load module descriptor from: " + descriptorLocalUrl);
	});
}

getDescriptor()
	.then(init)
	.catch(error => {
		console.log("failed to load descriptor from: " + descriptorRemoteUrl);
		console.log("request error:");
		console.log(error);
	});

function getDescriptor(): Promise<connector.descriptors.RootModule> {
	return new Promise<connector.descriptors.RootModule>((resolve, reject) => {
		request.get(descriptorRemoteUrl, (error, response, body) => {
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