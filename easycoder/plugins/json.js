const EasyCoder_Json = {

	name: `EasyCoder_JSON`,

	Json: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = compiler.nextToken();
			let item;
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
				const what = compiler.nextToken();
				if ([`property`, `element`].includes(what)) {
					const value = compiler.getNextValue();
					if ([`from`, `of`].includes(compiler.getToken())) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								compiler.next();
								compiler.addCommand({
									domain: `json`,
									keyword: `json`,
									lino,
									request,
									what,
									value,
									target: targetRecord.name
								});
								return true;
							}
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
				item = compiler.getNextValue();
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
			case `split`:
				item = compiler.getNextValue();
				let on = `\n`;
				if (compiler.tokenIs(`on`)) {
					on = compiler.getNextValue();
				}
				if ([`giving`, `into`].includes(compiler.getToken())) {
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
								on,
								target: targetRecord.name
							});
							return true;
						}
					}
				}
				break;
			case `replace`:
				if (compiler.nextTokenIs(`element`)) {
					const index = compiler.getNextValue();
					if (compiler.tokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const targetRecord = compiler.getSymbolRecord();
							if (targetRecord.keyword === `variable`) {
								if ([`by`, `with`].includes(compiler.nextToken())) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `json`,
										keyword: `json`,
										lino,
										request,
										target: targetRecord.name,
										index,
										value
									});
									return true;
								}
							}
						}
					}
				}
				break;
			}
			compiler.addWarning(`Unrecognised json command syntax`);
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
				const list = program.getValue(targetRecord.value[targetRecord.index]);
				content = list ? JSON.stringify(JSON.parse(list).sort()) : null;
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content
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
				switch (command.what) {
				case `property`:
					const name = program.getValue(command.value);
					targetRecord = program.getSymbolRecord(command.target);
					record = JSON.parse(targetRecord.value[targetRecord.index].content);
					delete record[name];
					targetRecord.value[targetRecord.index].content = JSON.stringify(record);
					break;
				case `element`:
					const element = program.getValue(command.value);
					targetRecord = program.getSymbolRecord(command.target);
					record = JSON.parse(targetRecord.value[targetRecord.index].content);
					record.splice(element, 1);
					targetRecord.value[targetRecord.index].content = JSON.stringify(record);
					break;
				}
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
				const existing = targetRecord.value[targetRecord.index].content;
				record = existing ? JSON.parse(existing) : [];
				record.push((`[`, `{`).includes(content[0]) ? JSON.parse(content) :content);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(record)
				};
				break;
			case `split`:
				content = program.getValue(command.item);
				const on = program.getValue(command.on);
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(content.split(on))
				};
				break;
			case `replace`:
				targetRecord = program.getSymbolRecord(command.target);
				const index = program.getValue(command.index);
				const value = program.getValue(command.value);
				const current = targetRecord.value[targetRecord.index].content;
				record = current ? JSON.parse(current) : [];
				if (index > record.length - 1) {
					program.runtimeError(command.lino, `Index out of range`);
				}
				record[index] = value;
				targetRecord.value[targetRecord.index].content = JSON.stringify(record);
				break;
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `json`:
			return EasyCoder_Json.Json;
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
						if (target.isValueHolder) {
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
