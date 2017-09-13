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
		console.error("jenkins module loaded but url doesn't have the needed params, aborting");
		return;
	}

	const url = `${ params.get("protocol") || "http" }://${ params.get("host") }:${ params.get("port") }`;

	fugazi.components.modules.descriptor.loaded({
		"name": "jenkins",
		"title": "Jenkins",
		"remote": {
			"origin": url
		},
		"commands": {
			"jobs": {
				"returns": "map",
				"syntax": ["list jobs"],
				"handler": {
					"method": "GET",
					"endpoint": "/api/json?pretty=true&tree=jobs[name]"
				}
			},
			"lastBuildResult": {
				"returns": "map",
				"syntax": ["status of last build in (jobName string)"],
				"handler": {
					"method": "GET",
					"endpoint": "/job/{ jobName }/job/{ jobName }/lastBuild/api/json?pretty=true&tree=result"
				}
			},
			"buildResult": {
				"returns": "map",
				"syntax": ["status of build (buildNumber number) in (jobName string)"],
				"handler": {
					"method": "GET",
					"endpoint": "/job/{ jobName }/job/{ jobName }/{ buildNumber }/api/json?pretty=true&tree=result"
				}
			},
			"gitCommitHashOfLastBuild": {
				"returns": "map",
				"syntax": ["commit hash of last build in (jobName string)"],
				"handler": {
					"method": "GET",
					"endpoint": "/job/{ jobName }/job/{ jobName }/lastBuild/git/api/json?pretty=true&tree=lastBuiltRevision[branch[SHA1]]"
				}
			},
			"gitCommitHashOfBuild": {
				"returns": "map",
				"syntax": ["commit hash of build (buildNumber number) in (jobName string)"],
				"handler": {
					"method": "GET",
					"endpoint": "/job/{ jobName }/job/{ jobName }/{ buildNumber }/git/api/json?pretty=true&tree=lastBuiltRevision[branch[SHA1]]"
				}
			},
			"crumb": {
				"returns": "map",
				"syntax": ["get crumb"],
				"handler": {
					"method": "GET",
					"endpoint": "crumbIssuer/api/json?tree=crumb"
				}
			},
			"buildJob": {
				"returns": "map",
				"syntax": ["build (jobName string) now using "],
				"handler": {
					"method": "POST",
					"endpoint": "/job/{ jobName }/job/{ jobName }/build?delay=0sec"
				}
			},
			"buildJobDelayed": {
				"returns": "map",
				"syntax": ["build (jobName string) in (delay number)"],
				"handler": {
					"method": "POST",
					"endpoint": "/job/{ jobName }/job/{ jobName }/build?delay={ delay }sec"
				}
			}
		}
	});
})();