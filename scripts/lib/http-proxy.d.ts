// import * as http from "http";

declare module "http-proxy" {
	type EventType = "error" | "proxyReq" | "proxyRes" | "open" | "close";
	type EventHandler = (proxyRes: any, req: http.IncomingMessage, res: http.ServerResponse) => void;

	declare class ProxyServer {
		web(request: http.IncomingMessage, response: http.ServerResponse): void;
		on(type: EventType, handler: EventHandler): void;
	}

	interface Options {
		target: string;
	}

	declare function createProxyServer(options: Options): ProxyServer;
}