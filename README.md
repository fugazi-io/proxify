# fugazi proxify

A node package for serving remote APIs as [fugazi modules](https://github.com/fugazi-io/webclient/blob/master/docs/components/modules.md).  
It does so by:
 * Serving the module descriptor
 * Proxying all of the requests to the original server and adding [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) for the responses

## Motivation
The fugazi terminal is restricted by the browser security, and more precisely the [Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), 
and so every request made must be served from the same host as the one that fugazi was loaded from.  
That can be bypassed using CORS, or by hosting the [fugazi proxy-frame](https://github.com/fugazi-io/webclient/blob/master/html/proxyframe.html), but in some cases changing the configuration 
of the server which exposes the API isn't easy, or against policies.

By running proxify on the local machine, all the API is "proxyed" with CORS headers and can be loaded into 
the fugazi terminal.

## Installation
```npm
npm install @fugazi/proxify
```

## Build
```bash
npm run compile
// or
node_modules/typescript/bin/tsc -p scripts
```

## Running
```bash
npm start [OPTIONS] descriptor
// OR
node scripts/bin/index.js [OPTIONS] descriptor
```

If you want to pass arguments then:
```bash
npm run start -- --listen-host 3232
// or
node scripts/bin/index.js --listen-host 3232
```

#### descriptor
Either a url or a path to a file to a [root module descriptor](https://github.com/fugazi-io/webclient/blob/master/docs/components/modules.md#root-module).

#### Options
 * **--listen-host**: The host to which proxify will bind to, default is localhost
 * **--listen-port**: The port to which proxify will bind to, default is 33334
 
## Contact
Feel free to [create issues](https://github.com/fugazi-io/proxify/issues) if you're running into trouble, 
and welcome to ask any question in [our gitter](https://gitter.im/fugazi-io/Lobby).

## Example
Let's take an example of a (very) simple http based API for a music database with the following endpoints:
 * GET /labels - returns a list of all record labels
 * GET /artists - returns a list of all artists
 * GET /genres - returns a list of all genres
 
 * GET /label/{ id } - returns the record label for the given id
 * GET /artist/{ id } - returns the artist for the given id
 * GET /genre/{ id } - returns the genre for the given id
 
Let's also say that the API is served from `http://db.music.com/api`.

To use this api from the fugazi client all we need to do is:
We create a descriptor file:
```json
{
	"name": "music.db",
	"title": "The music database API",
	"remote": {
		"origin": "http://db.music.com",
		"base": "/api"
	},
	"commands": {
		"allLabels": {
			"returns": "list",
			"syntax": [
				"get all labels",
				"labels"
			],
			"handler": {
				"endpoint": "/labels"
			}
		},
		"allArtists": {
			"returns": "list",
			"syntax": [
				"get all artists",
				"artists"
			],
			"handler": {
				"endpoint": "/artists"
			}
		},
		"allGenres": {
			"returns": "list",
			"syntax": [
				"get all genres",
				"genres"
			],
			"handler": {
				"endpoint": "/genres"
			}
		},
		"getLabel": {
			"returns": "map",
			"syntax": "label (id string)",
			"handler": {
				"endpoint": "/label/{ id }"
			}
		},
		"getArtist": {
			"returns": "map",
			"syntax": "artist (id string)",
			"handler": {
				"endpoint": "/artist/{ id }"
			}
		},
		"getGenre": {
			"returns": "map",
			"syntax": "genre (id string)",
			"handler": {
				"endpoint": "/genre/{ id }"
			}
		}
	}
}
```

And save it in the directory where we installed the `proxify` package, let's say `~/fugazi/proxify/music.db.json`.  
Now we run it:
```npm
~/fugazi/proxify> npm start music.db.json
```
The output should be something like:
```bash
server started, listening to localhost:33334
load module descriptor from: http://localhost:33334/music.db.json
```

Now, inside the [fugazi terminal](http://fugazi.io) we simply load the module:
```
load module from "http://localhost:33334/music.db.json"
```

And then we can just execute the commands:
```
get all artists
genre 1243tg
etc
```