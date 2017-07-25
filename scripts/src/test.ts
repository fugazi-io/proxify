//const http = require('http');
import * as http from "http";
var url = require('url');

const port = 3211;
const server = http.createServer((request, response) => {
	console.log(url.parse(request.url, true));
	response.end('Hello Node.js Server!');
});

server.listen(port, (err: any) => {
	if (err) {
		return console.log('something bad happened', err);
	}

	console.log(`server is listening on ${ port }`);
})