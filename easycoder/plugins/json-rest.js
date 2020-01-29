const EasyCoder_Json = {

	Json: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = compiler.nextToken();
			switch (request) {
			case `set`:
				compiler.next();
				if (compiler.isSymbol()) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						if (compiler.nextTokenIs(`to`)) {
							const type = compiler.nextToken();
							if (`["array","object"]`.includes(type)) {
								compiler.next();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request: `setVariable`,
									target: targetRecord.name,
									type
								});
								return true;
							}
						}
					} else if (targetRecord.keyword === `select`) {
						if (compiler.nextTokenIs(`from`)) {
							compiler.next();
							if (compiler.isSymbol()) {
								const sourceRecord = compiler.getSymbolRecord();
								if (sourceRecord.keyword === `variable`) {
									var display = null;
									if (compiler.nextTokenIs(`as`)) {
										display = compiler.getNextValue();
									}
									compiler.addCommand({
										domain: `json`,
										keyword: `json`,
										lino,
										request: `setList`,
										target: targetRecord.name,
										source: sourceRecord.name,
										display
									});
									return true;
								}
							}
						}
					}
					break;
				}
				break;
			case `sort`:
			case `shuffle`:
			case `format`:
				if (compiler.nextIsSymbol()) {
					const targetRecord = compiler.getSymbolRecord();
					if (targetRecord.keyword === `variable`) {
						compiler.next();
						compiler.addCommand({
							domain: `json`,
							keyword: `json`,
							lino,
							request,
							target: targetRecord.name
						});
						return true;
					}
				}
				break;
			case `parse`:
				if (compiler.nextTokenIs(`url`)) {
					const source = compiler.getNextValue();
					if (compiler.tokenIs(`as`)) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								compiler.next();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request,
									source,
									target: targetRecord.name
								});
								return true;
							}
						}
					}
				}
				break;
			case `delete`:
				const name = compiler.getNextValue();
				if (compiler.tokenIs(`from`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							compiler.next();
							compiler.addCommand({
								domain: `json`,
								keyword: `json`,
								lino,
								request,
								name,
								target: targetRecord.name
							});
							return true;
						}
					}
				}
				break;
			case `rename`:
				const oldName = compiler.getNextValue();
				if (compiler.tokenIs(`to`)) {
					const newName = compiler.getNextValue();
					if (compiler.tokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								compiler.next();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request,
									oldName,
									newName,
									target: targetRecord.name
								});
								return true;
							}
						}
					}
				}
				break;
			case `add`:
				const item = compiler.getNextValue();
				if (compiler.tokenIs(`to`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							compiler.next();
							compiler.addCommand({
								domain: `json`,
								keyword: `json`,
								lino,
								request,
								item,
								target: targetRecord.name
							});
							return true;
						}
					}
				}
				break;
			}
			compiler.addWarning(`Unrecognised syntax in json`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let sourceRecord;
			let targetRecord;
			let record;
			let content;
			let array;
			switch (command.request) {
			case `setVariable`:
				targetRecord = program.getSymbolRecord(command.target);
				content = (command.type === `array`) ? `[]` : `{}`;
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content
				};
				break;
			case `setList`:
				// The source is assumed to be a JSON array
				sourceRecord = program.getSymbolRecord(command.source);
				const sourceData = program.getValue(sourceRecord.value[sourceRecord.index]);
				var itemArray = ``;
				try {
					itemArray = JSON.parse(sourceData);
				} catch (err) {
					program.runtimeError(command.lino, `Can't parse JSON`);
					return 0;
				}
				// The target is assumed to be a SELECT
				targetRecord = program.getSymbolRecord(command.target);
				const target = targetRecord.element[targetRecord.index];
				target.options.length = 0;
				// Get the name of the display field
				const display = program.getValue(command.display);
				// For each item, set the title and inner HTML
				itemArray.forEach(function (item) {
					const title = display ? program.decode(item[display]) : null;
					const opt = document.createElement(`option`);
					const innerHTML = title ? title : item;
					opt.innerHTML = innerHTML;
					const value = title ? JSON.stringify(item) : item;
					opt.value = value;
					target.appendChild(opt);
				});
				target.selectedIndex = -1;
				break;
			case `sort`:
				targetRecord = program.getSymbolRecord(command.target);
				let a = JSON.parse(program.getValue(targetRecord.value[targetRecord.index])).sort();
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(a)
				};
				break;
			case `shuffle`:
				targetRecord = program.getSymbolRecord(command.target);
				array = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
				for (let i = array.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[array[i], array[j]] = [array[j], array[i]];
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(array)
				};
				break;
			case `format`:
				targetRecord = program.getSymbolRecord(command.target);
				const val = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(val, null, 2)
				};
				break;
			case `parse`:
				var source = program.getValue(command.source);
				targetRecord = program.getSymbolRecord(command.target);
				content = {
					url: source
				};
				var n = source.indexOf(`://`);
				if (n >= 0) {
					n += 3;
					content.protocol = source.substr(0, n);
					source = source.substr(n);
				}
				n = source.indexOf(`?`);
				if (n > 0) {
					content.domain = source.substr(0, n);
					content.arg = source.substr(n + 1);
				} else {
					content.domain = source;
				}
				if (content.domain.endsWith(`/`)) {
					content.domain = content.domain.substr(0, content.domain.length - 1);
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(content, null, 2)
				};
				break;
			case `delete`:
				const name = program.getValue(command.name);
				targetRecord = program.getSymbolRecord(command.target);
				record = JSON.parse(targetRecord.value[targetRecord.index].content);
				delete record[name];
				targetRecord.value[targetRecord.index].content = JSON.stringify(record);
				break;
			case `rename`:
				const oldName = program.getValue(command.oldName);
				const newName = program.getValue(command.newName);
				targetRecord = program.getSymbolRecord(command.target);
				record = JSON.parse(targetRecord.value[targetRecord.index].content);
				content = record[oldName];
				delete record[oldName];
				record[newName] = content;
				targetRecord.value[targetRecord.index].content = JSON.stringify(record);
				break;
			case `add`:
				content = program.getValue(command.item);
				targetRecord = program.getSymbolRecord(command.target);
				record = JSON.parse(targetRecord.value[targetRecord.index].content);
				record.push(content);
				targetRecord.value[targetRecord.index].content = JSON.stringify(record);
				break;
			}
			return command.pc + 1;
		}
	},

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
								domain: `json`,
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
				onError = null;
				if (compiler.tokenIs(`or`)) {
					compiler.next();
					onError = compiler.getPc() + 1;
					compiler.completeHandler();
				}
				compiler.addCommand({
					domain: `json`,
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

		run: (program) => {
			const command = program[program.pc];
			const url = program.getValue(command.url);
			const ajax = new XMLHttpRequest();
			ajax.command = command;
			ajax.onreadystatechange = function () {
				//        console.log(`readyState:${ajax.readyState}, status:${ajax.status}`);
				if (ajax.readyState === 4) {
					const command = ajax.command;
					switch (this.status) {
					case 200:
					case 201:
						//						console.log(`${loaded - program.EasyCoder.timestamp} ms: Request completed.`);
						var content = this.responseText;
						if (content.length > 0 && ![`[`, `{`].includes(content.charAt(0))) {
							content = program.decode(content);
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
						break;
					case 0:
						break;
					default:
						if (command.onError) {
							program.errorMessage = this.responseText;
							program.run(command.onError);
						} else {
							const error = this.responseText;
							program.runtimeError(command.lino, error);
						}
						break;
					}
				}
			};
			if (!url) {
				program.runtimeError(command.lino, `No URL present`);
			}
			const path = url.startsWith(`http`) ? url :
				`${window.location.origin}/wp-content/plugins/easycoder/rest.php/${url}`;
			switch (command.request) {
			case `get`:
				// console.log(`GET from ${path}`);
				ajax.open(`GET`, path);
				ajax.send();
				break;
			case `post`:
				const value = program.getValue(command.value);
				console.log(`POST to ${path}`);
				ajax.open(`POST`, path);
				if (value.charAt(0) === `{` || !isNaN(value)) {
					ajax.setRequestHeader(`Content-Type`, `application/json; charset=UTF-8`);
					//            console.log(`value=${value}`);
					ajax.send(value.charAt(0) === `{` ? value : value.toString());
				} else {
					ajax.setRequestHeader(`Content-Type`, `application/text; charset=UTF-8`);
					// console.log(`value=${program.encode(value)}`);
					ajax.send(program.encode(value));
				}
				break;
			}
			return 0;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `json`:
			return EasyCoder_Json.Json;
		case `rest`:
			return EasyCoder_Json.Rest;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_Json.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'json' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			if (compiler.tokenIs(`json`)) {
				const type = compiler.nextToken();
				if ([`size`, `count`, `keys`].includes(type)) {
					compiler.skip(`of`);
					if (compiler.isSymbol()) {
						const target = compiler.getSymbolRecord();
						compiler.next();
						if (target.isVHolder) {
							return {
								domain: `json`,
								type,
								name: target.name
							};
						}
					}
				} else if (type === `index`) {
					if (compiler.nextTokenIs(`of`)) {
						const item = compiler.getNextValue();
						if (compiler.tokenIs(`in`)) {
							const list = compiler.getNextValue();
							return {
								domain: `json`,
								type,
								item,
								list
							};
						}
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			let symbolRecord;
			let data;
			let content;
			switch (value.type) {
			case `size`:
			case `count`:
				symbolRecord = program.getSymbolRecord(value.name);
				data = program.getValue(symbolRecord.value[symbolRecord.index]);
				let array;
				try {
					array = JSON.parse(data);
				} catch (err) {
					array = [];
				}
				return {
					type: `constant`,
					numeric: true,
					content: array.length
				};
			case `keys`:
				symbolRecord = program.getSymbolRecord(value.name);
				data = program.getValue(symbolRecord.value[symbolRecord.index]);
				content = data ? JSON.stringify(Object.keys(JSON.parse(data)).sort()) : `[]`;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `index`:
				const item = program.getValue(value.item);
				const list = JSON.parse(program.getValue(value.list));
				content = list.findIndex(function (value) {
					return value === item;
				});
				return {
					type: `constant`,
					numeric: true,
					content
				};
			}
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};