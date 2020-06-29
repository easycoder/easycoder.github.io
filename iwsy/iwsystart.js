window.onload = () => {
	const createCORSRequest = (url) => {
		let xhr = new XMLHttpRequest();
		if (`withCredentials` in xhr) {
    
			// Check if the XMLHttpRequest object has a "withCredentials" property.
			// "withCredentials" only exists on XMLHTTPRequest2 objects.
			xhr.open(`GET`, url, true);
    
		} else if (typeof XDomainRequest != `undefined`) {
    
			// Otherwise, check if XDomainRequest.
			// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
			xhr = new XDomainRequest();
			xhr.open(`GET`, url);
    
		} else {
    
			// Otherwise, CORS is not supported by the browser.
			xhr = null;
    
		}
		return xhr;
	};

	const start = mode => {
		const container = document.getElementById(`iwsy-container`);
		const scriptElement = document.getElementById(`iwsy-script`);
		const path = scriptElement.innerText;
		if (scriptElement) {
			const request = createCORSRequest(`${path}?v=${Math.floor(Date.now())}`);
			if (!request) {
				throw Error(`Unable to access the JSON script`);
			}

			request.onload = () => {
				if (200 <= request.status && request.status < 400) {
					const script = JSON.parse(request.responseText);
					const iwsy = IWSY(container, script);
					const slash = path.lastIndexOf(`/`);
					iwsy.setPath(path.slice(0, slash + 1));
					iwsy.onStep(() => {
					});
					iwsy.run(`fullscreen`, mode, () => {
						console.log(`All done`);
					});
				} else {
					throw Error(`Unable to access the JSON script`);
				}
			};

			request.onerror = () => {
				throw Error(`Unable to access the JSON script`);
			};

			request.send();
		}
	};

	// Wait for a click/tap or a keypress to start
	const listener = document.addEventListener(`click`, () => {
		document.removeEventListener(`click`, listener);
		start(`auto`);
	});
	document.onkeydown = event => {
		document.onkeydown = null;
		if (event.code === `Enter`) {
			start(`auto`);
		}
		else {
			start(`manual`);
		}
		return true;
	};
};
