window.onload = function () {
	const createCORSRequest = function (method, url) {
		let xhr = new XMLHttpRequest();
		if (`withCredentials` in xhr) {
			// Most browsers.
			xhr.open(method, url, true);
		} else if (typeof XDomainRequest != `undefined`) {
			// IE8 & IE9
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			// CORS not supported.
			xhr = null;
		}
		return xhr;
	};

	const method = `POST`;
	const url = `https://k84msuyg7a.execute-api.eu-west-2.amazonaws.com/prod`;
	const ajax = createCORSRequest(method, url);
	ajax.command = command;
	ajax.withCredentials = true;
	const value = `{table":"easycoder-script","key":"name","value":"Some test data"}`;
	ajax.setRequestHeader(`Content-Type`, `application/json; charset=UTF-8`);
	ajax.send(value);

	ajax.onload = function () {
		var content = ajax.responseText;
		console.log(content);
	};

	ajax.onerror = function () {
		const error = ajax.responseText;
		console.log(error);
	};
};