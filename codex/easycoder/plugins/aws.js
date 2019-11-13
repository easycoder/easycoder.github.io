const EasyCoder_AWS = {

	AWS: {

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
							let onError = null;
							if (compiler.tokenIs(`or`)) {
								compiler.next();
								onError = compiler.getPc() + 1;
								compiler.completeHandler();
							}
							compiler.addCommand({
								domain: `aws`,
								keyword: `aws`,
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
				const value = compiler.getNextValue();
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
					domain: `aws`,
					keyword: `aws`,
					lino,
					request: `post`,
					value,
					target,
					onError
				});
				return true;
			case `delete`:
				if (compiler.nextIsSymbol(true)) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						let onError = null;
						if (compiler.tokenIs(`or`)) {
							compiler.next();
							onError = compiler.getPc() + 1;
							compiler.completeHandler();
						}
						compiler.next();
						compiler.addCommand({
							domain: `aws`,
							keyword: `aws`,
							lino,
							request: `delete`,
							target: targetRecord.name,
							onError
						});
						return true;
					}
				}
				break;
			case `set`:
				if (compiler.nextTokenIs(`the`)) {
					compiler.next();
				}
				if (compiler.tokenIs(`url`)) {
					if (compiler.nextTokenIs(`to`)) {
						const url = compiler.getNextValue();
						compiler.addCommand({
							domain: `aws`,
							keyword: `aws`,
							lino,
							request: `setUrl`,
							url
						});
						return true;
					}
				}
				return false;
			}
			return false;
		},

		run: (program) => {
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

			const command = program[program.pc];
			if (command.request === `setUrl`) {
				EasyCoder_AWS.url = program.getValue(command.url);
				return command.pc + 1;
			} else if ([`get`, `post`, `delete`].includes(command.request)) {
				const method = command.request.toUpperCase();
				const url = `${EasyCoder_AWS.url}${program.getValue(command.url)}`;
				const request = createCORSRequest(method, url);
				if (!request) {
					program.runtimeError(command.lino, `CORS not supported`);
					return command.pc + 1;
				}
				request.setRequestHeader(`Content-Type`, `application/json; charset=UTF-8`);
				request.command = command;
				switch (command.request) {
				case `get`:
				case `delete`:
					request.send();
					break;
				case `post`:
					const value = program.getValue(command.value);
					console.log(`POST to ${EasyCoder_AWS.url}`);
					if ([`[`, `{`].includes(value.charAt(0))) {
						request.setRequestHeader(`Content-Type`, `application/json; charset=UTF-8`);
						//            console.log(`value=${value}`);
						request.send(value);
					} else {
						request.setRequestHeader(`Content-Type`, `text/plain; charset=UTF-8`);
						// console.log(`value=${program.encode(value)}`);
						request.send(program.encode(value));
					}
					break;
				}

				request.onload = function () {
					var content = request.responseText;
					if (content.length > 0 && ![`[`, `{`].includes(content.charAt(0))) {
						content = program.decode(content);
					// } else {
					// 	content = JSON.parse(content);
					}
					if (command.target) {
						const targetRecord = program.getSymbolRecord(command.target);
						targetRecord.value[targetRecord.index] = {
							type: `constant`,
							numeric: false,
							content
						};
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
				
				return 0;
			}
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `aws`:
			return EasyCoder_AWS.AWS;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_AWS.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'aws' package`);
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