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
							let fixup = compiler.getPc();
							compiler.addCommand({
								domain: `rest`,
								keyword: `rest`,
								lino,
								request: `get`,
								target: targetRecord.name,
								url,
								onError: null
							});
							if (compiler.tokenIs(`or`)) {
								compiler.next();
								compiler.getCommandAt(fixup).onError = compiler.getPc() + 1;
								compiler.completeHandler();
							} 
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
						if (targetRecord.isVHolder) {
							target = targetRecord.name;
							compiler.next();
						} else {
							throw new Error(`'${targetRecord.name}' cannot hold a value`);
						}
					}
				}
				compiler.addCommand({
					domain: `rest`,
					keyword: `rest`,
					lino,
					request: `post`,
					value,
					url,
					target,
					onError: compiler.getPc() + 2
				});
				onError = null;
				if (compiler.tokenIs(`or`)) {
					compiler.next();
					// onError = compiler.getPc() + 1;
					compiler.completeHandler();
				}
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
			// Default is the path for a WordPress installation
			let rest = `/wp-content/plugins/easycoder/rest.php`
			const restDef = document.getElementById(`easycoder-rest`);
			if (restDef) {
				rest = restDef.innerText;
			}
			let path = url;
			if (!url.startsWith(`http`)) {
				if (url[0] == `/`) {
					path = url.substr(1);
				} else {
					path = `${window.location.origin}${rest}/${url}`;
				}
			}

			const request = EasyCoder_Rest.Rest.createCORSRequest(command.request, path);
			if (!request) {
				program.runtimeError(command.lino, `CORS not supported`);
				return;
			}
			request.script = program.script;
			request.pc = program.pc;

			request.onload = function () {
				let s = request.script;
				let p = EasyCoder.scripts[s];
				let pc = request.pc;
				let c = p[pc];
				if (200 <= request.status && request.status < 400) {
					var content = request.responseText.trim();
					if (c.target) {
						const targetRecord = program.getSymbolRecord(command.target);
						targetRecord.value[targetRecord.index] = {
							type: `constant`,
							numeric: false,
							content
						};
						targetRecord.used = true;
					}
					p.run(c.pc + 1);
				} else {
					const error = `${request.status} ${request.statusText}`;
					if (c.onError) {
						p.errorMessage = `Exception trapped: ${error}`;
						p.run(c.onError);
					} else {
						p.runtimeError(c.lino, `Error: ${error}`);
					}
				}
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
				// console.log(`GET from ${path}`);
				request.send();
				break;
			case `post`:
				const value = program.getValue(command.value);
				console.log(`POST to ${path}`);
				//console.log(`value=${value}`);
				request.setRequestHeader(`Content-type`, `application/json; charset=UTF-8`);
				request.send(value);
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
			return null;
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
