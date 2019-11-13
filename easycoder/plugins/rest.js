const EasyCoder_Rest = {

	name: `EasyCoder_Rest`,

	Rest: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = compiler.nextToken();
			switch (request) {
			case `get`:
				if (compiler.nextIsSymbol(true)) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						if (compiler.nextTokenIs(`from`)) {
							const url = compiler.getNextValue();
							var onError = null;
							if (compiler.tokenIs(`or`)) {
								compiler.next();
								onError = compiler.getPc() + 1;
								compiler.completeHandler();
							}
							compiler.addCommand({
								domain: `rest`,
								keyword: `rest`,
								lino,
								request: `get`,
								target: targetRecord.name,
								url,
								onError
							});
							return true;
						}
					}
				}
				break;
			case `post`:
				let value = null;
				if (compiler.nextTokenIs(`to`)) {
					compiler.next();
				} else {
					value = compiler.getValue();
					if (compiler.tokenIs(`to`)) {
						compiler.next();
					} else {
						break;
					}
				}
				const url = compiler.getValue();
				if (!url) {
					throw new Error(command.lino, `No URL present`);
				}
				let target = null;
				if (compiler.tokenIs(`giving`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.isValueHolder) {
							target = targetRecord.name;
							compiler.next();
						} else {
							throw new Error(`'${targetRecord.name}' cannot hold a value`);
						}
					}
				}
				onError = null;
				if (compiler.tokenIs(`or`)) {
					compiler.next();
					onError = compiler.getPc() + 1;
					compiler.completeHandler();
				}
				compiler.addCommand({
					domain: `rest`,
					keyword: `rest`,
					lino,
					request: `post`,
					value,
					url,
					target,
					onError
				});
				return true;
			}
			return false;
		},

		createCORSRequest: (method, url) => {
			var xhr = new XMLHttpRequest();
			if (`withCredentials` in xhr) {
		
				// Check if the XMLHttpRequest object has a "withCredentials" property.
				// "withCredentials" only exists on XMLHTTPRequest2 objects.
				xhr.open(method, url, true);
		
			} else if (typeof XDomainRequest != `undefined`) {
		
				// Otherwise, check if XDomainRequest.
				// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
				xhr = new XDomainRequest();
				xhr.open(method, url);
		
			} else {
		
				// Otherwise, CORS is not supported by the browser.
				xhr = null;
		
			}
			return xhr;
		},		

		run: (program) => {
			const command = program[program.pc];
			const url = program.getValue(command.url);
			const rest = EasyCoder_Plugins.rest();
			const path = url.startsWith(`http`) ? url
				: url[0] === `/` ? url.substr(1)
					: `${window.location.origin}${rest ? `/${rest}` : ``}/${url}`;

			const request = EasyCoder_Rest.Rest.createCORSRequest(command.request, path);
			if (!request) {
				program.runtimeError(command.lino, `CORS not supported`);
				return;
			}
			// request.command = command;

			request.onload = function () {
				if (200 <= request.status && request.status < 300) {
					var content = request.responseText.trim();
					if (command.target) {
						const targetRecord = program.getSymbolRecord(command.target);
						targetRecord.value[targetRecord.index] = {
							type: `constant`,
							numeric: false,
							content
						};
						targetRecord.used = true;
					}
				} else {
					const error = `Error ${request.status}: ${request.statusText}`;
					if (command.onError) {
						program.errorMessage = error;
						program.run(command.onError);
					} else {
						program.runtimeError(command.lino, error);
					}
				}
				program.run(command.pc + 1);
			};

			request.onerror = function () {
				if (command.onError) {
					program.errorMessage = this.responseText;
					program.run(command.onError);
				} else {
					const error = this.responseText;
					program.runtimeError(command.lino, error);
				}
			};

			switch (command.request) {
			case `get`:
				// alert(`GET from ${path}`);
				// console.log(`GET from ${path}`);
				// request.open(`GET`, path);
				request.send();
				break;
			case `post`:
				const value = program.getValue(command.value);
				console.log(`POST to ${path}`);
				// request.open(`POST`, path);
				if (value.charAt(0) === `{` || !isNaN(value)) {
					request.setRequestHeader(`Content-Type`, `application/json; charset=UTF-8`);
					//            console.log(`value=${value}`);
					request.send(value.charAt(0) === `{` ? value : value.toString());
				} else {
					request.setRequestHeader(`Content-Type`, `application/text; charset=UTF-8`);
					request.send(value);
				}
				break;
			}
			return 0;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `rest`:
			return EasyCoder_Rest.Rest;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_Rest.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'rest' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: () => {
			return null;
		},

		get: () => {
			return null;
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};
