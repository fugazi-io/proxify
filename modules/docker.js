(function() {
	function parseParams() {
		let list = document.location.search;

		if (list.length > 0 && list.startsWith("?")) {
			list = list.substring(1);
		}

		list = list.split("&");

		const params = new Map();
		list.forEach(pair => {
			[key, value] = pair.split("=");
			params.set(key, value);
		});

		return params;
	}

	const params = parseParams();
	if (!params.has("host") || !params.has("port")) {
		console.error("docker module loaded but url doesn't have the needed params, aborting");
		return;
	}

	const url = `${ params.get("protocol") || "http" }://${ params.get("host") }:${ params.get("port") }`;

	fugazi.components.modules.descriptor.loaded({
		"name": "docker",
		"title": "Docker",
		"remote": {
			"origin": url
		},
		"commands": {
			"version": {
				"returns": "map",
				"syntax": ["which docker version"],
				"handler": {
					"method": "GET",
					"endpoint": "/version"
				}
			},
			"images": {
				"returns": "list",
				"syntax": ["list images", "images"],
				"handler": {
					"method": "GET",
					"endpoint": "/images/json"
				}
			},
			"containers": {
				"returns": "list",
				"syntax": ["list containers", "containers"],
				"handler": {
					"method": "GET",
					"endpoint": "/containers/json"
				}
			},
			"create": {
				"returns": "map",
				"syntax": ["create container (Image string)","create (Image string)"],
				"handler": {
					"method": "POST",
					"endpoint": "/containers/create"
				}
			},
			"inspect": {
				"returns": "map",
				"syntax": ["inspect container (idOrName string)", "inspect (idOrName string)"],
				"handler": {
					"method": "GET",
					"endpoint": "/containers/{ idOrName }/json"
				}
			},
			"start": {
				"returns": "void",
				"syntax": ["start container (idOrName string)", "start (idOrName string)"],
				"handler": {
					"method": "POST",
					"endpoint": "/containers/{ idOrName }/start"
				}
			},
			"stop": {
				"returns": "void",
				"syntax": ["stop container (idOrName string)", "stop (idOrName string)"],
				"handler": {
					"method": "POST",
					"endpoint": "/containers/{ idOrName }/stop"
				}
			},
			"pause": {
				"returns": "void",
				"syntax": ["pause container (idOrName string)", "pause (idOrName string)"],
				"handler": {
					"method": "POST",
					"endpoint": "/containers/{ idOrName }/pause"
				}
			},
			"unpause": {
				"returns": "void",
				"syntax": ["unpause container (idOrName string)", "unpause (idOrName string)"],
				"handler": {
					"method": "POST",
					"endpoint": "/containers/{ idOrName }/unpause"
				}
			},
			"kill": {
				"returns": "void",
				"syntax": ["kill container (idOrName string)", "kill (idOrName string)"],
				"handler": {
					"method": "POST",
					"endpoint": "/containers/{ idOrName }/kill"
				}
			},
			"delete": {
				"returns": "void",
				"syntax": ["delete container (idOrName string)", "delete (idOrName string)"],
				"handler": {
					"method": "DELETE",
					"endpoint": "/containers/{ idOrName }"
				}
			}
		}
	});
})();