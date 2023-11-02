const EasyCoder_Core = {

	name: `EasyCoder_Core`,

	Add: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Get the (first) value
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.tokenIs(`to`)) {
				compiler.next();
				// Check if a value holder is next
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					const variable = compiler.getCommandAt(symbol.pc);
					if (variable.isVHolder) {
						if (compiler.peek() === `giving`) {
							// This variable must be treated as a second value
							const value2 = compiler.getValue();
							compiler.next();
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `add`,
								lino,
								value1,
								value2,
								target
							});
						} else {
							// Here the variable is the target.
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `add`,
								lino,
								value1,
								target
							});
						}
						return true;
					}
					compiler.warning(`core 'add': Expected value holder`);
				} else {
					// Here we have 2 values so 'giving' must come next
					const value2 = compiler.getValue();
					if (compiler.tokenIs(`giving`)) {
						compiler.next();
						const target = compiler.getToken();
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `add`,
							lino,
							value1,
							value2,
							target
						});
						return true;
					}
					compiler.warning(`core 'add'': Expected "giving"`);
				}
			}
			return false;
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value2) {
					const result = program.getValue(value2) +
						program.getValue(value1);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command.lino);
					}
					const result = parseInt(value.content) + parseInt(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Alias: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const alias = compiler.getToken();
				compiler.next();
				if (compiler.tokenIs(`to`)) {
					compiler.next();
					if (compiler.isSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						symbolRecord.used = true;
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `alias`,
							lino,
							alias,
							symbol: symbolRecord.name
						});
						return true;
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const aliasPc = program.symbols[command.alias].pc;
			const aliasRecord = program[aliasPc];
			const symbolRecord = program.getSymbolRecord(command.symbol);
			program[aliasPc] = {
				pc: aliasRecord.pc,
				domain: symbolRecord.domain,
				keyword: symbolRecord.keyword,
				lino: aliasRecord.lino,
				name: aliasRecord.name,
				alias: command.symbol
			};
			return command.pc + 1;
		}
	},

	Append: {

		compile: compiler => {
			const lino = compiler.getLino();
			const value = compiler.getNextValue();
			if (compiler.tokenIs(`to`)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.isVHolder) {
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `append`,
							lino,
							value,
							select: symbolRecord.name
						});
						return true;
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const array = program.getSymbolRecord(command.select);
			try {
				const v = program.getValue(command.value);
				const value = [`{`, `[`].includes(v[0]) ? JSON.parse(v) : v;
				const item = array.value[array.index];
				let a = item.content;
				if (a) {
					a = JSON.parse(a);
				} else {
					a = [];
				}
				a.push(value);
				item.content = JSON.stringify(a);
				return command.pc + 1;
			} catch (err) {
				program.runtimeError(command.lino, `JSON: Unable to parse value`);
				return false;
			}
		}
	},

	Begin: {

		compile: compiler => {
			compiler.next();
			compiler.compileFromHere([`end`]);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Callback: {

		compile: compiler => {
			compiler.compileVariable(`core`, `callback`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Clear: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.isVHolder) {
					const symbol = compiler.getToken();
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `clear`,
						lino,
						symbol
					});
					return true;
				}
				compiler.warning(`'Variable '${symbolRecord.name}' does not hold a value`);
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			if (symbol.isVHolder) {
				const handler = program.domain[symbol.domain];
				handler.value.put(symbol, {
					type: `boolean`,
					content: false
				});
				command.numeric = false;
			} else {
				program.variableDoesNotHoldAValueError(command.lino, symbol.name);
			}
			return command.pc + 1;
		}
	},

	Close: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const moduleRecord = compiler.getSymbolRecord();
				if (moduleRecord.keyword === `module`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `close`,
						lino,
						module: moduleRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const moduleRecord = program.getSymbolRecord(command.module);
			const p = EasyCoder.scripts[moduleRecord.program];
			p.run(p.onClose);
			return command.pc + 1;
		}
	},

	Continue: {

		compile: compiler => {
			compiler.next();
			compiler.continue = true;
			return true;
		}
	},

	Debug: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`program`)) {
				compiler.next();
				if ([`item`, `pc`].includes(compiler.getToken())) {
					const item = compiler.getNextValue();
					compiler.addCommand({
						domain: `core`,
						keyword: `debug`,
						lino,
						item
					});
					return true;
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `program`
				});
				return true;
			} else if (compiler.tokenIs(`symbols`)) {
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `symbols`
				});
				return true;
			} else if (compiler.tokenIs(`symbol`)) {
				const name = compiler.nextToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `symbol`,
					name
				});
				return true;
			} else {
				const item = compiler.getToken();
				if ([`step`, `stop`].includes(item)) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `debug`,
						lino,
						item
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const item = command.item;
			switch (item) {
			case `symbols`:
				console.log(`Symbols: ${JSON.stringify(program.symbols, null, 2)}`);
				break;
			case `symbol`:
				const record = program.getSymbolRecord(command.name);
				const exporter = record.exporter.script;
				delete record.exporter;
				console.log(`Symbol: ${JSON.stringify(record, null, 2)}`);
				record.exporter.script = exporter;
				break;
			case `step`:
				program.debugStep = true;
				break;
			case `stop`:
				program.debugStep = false;
				break;
			case `program`:
				console.log(`Debug program: ${JSON.stringify(program, null, 2)}`);
				break;
			default:
				if (item.content >= 0) {
					console.log(`Debug item ${item.content}: ${JSON.stringify(program[item.content], null, 2)}`);
				}
				break;
			}
			return command.pc + 1;
		}
	},

	Decode: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `decode`,
					lino,
					symbol
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.symbol);
			if (target.isVHolder) {
				const content = program.getValue(target.value[target.index]);
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					content: program.decode(content)
				};
				command.numeric = false;
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Divide: {

		compile: compiler => {
			const lino = compiler.getLino();
			let target;
			if (compiler.nextIsSymbol()) {
				// It may be the target
				const symbol = compiler.getSymbol();
				target = compiler.getCommandAt(symbol.pc).name;
			}
			// Get the value even if we have a target
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.tokenIs(`by`)) {
				compiler.next();
			}
			// The next item is always a value
			const value2 = compiler.getValue();
			// If we now have 'giving' then the target follows
			if (compiler.tokenIs(`giving`)) {
				compiler.next();
				// Get the target
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					target = compiler.getCommandAt(symbol.pc).name;
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `divide`,
						lino,
						value1,
						value2,
						target
					});
					return true;
				}
				compiler.warning(`core 'divide'': Expected value holder`);
			} else {
				// Here we should already have the target.
				if (typeof target === `undefined`) {
					compiler.warning(`core 'divide': No target variable given`);
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `divide`,
					lino,
					value2,
					target
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value1) {
					const result = program.getValue(value1) / program.getValue(value2);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: Math.trunc(result)
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command, lino);
					}
					const result = parseInt(value.content) / parseInt(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: Math.trunc(result)
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Dummy: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `dummy`,
				lino
			});
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Encode: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `encode`,
					lino,
					symbol
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.symbol);
			if (target.isVHolder) {
				const content = program.getValue(target.value[target.index]);
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					content: program.encode(content)
				};
				command.numeric = false;
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	End: {

		compile: compiler => {
			compiler.next();
			return true;
		},

		run: () => {
			return 0;
		}
	},

	Every: {
		compile: compiler => {
			const lino = compiler.getLino();
			const rate = compiler.getNextValue();
			const m = compiler.getToken();
			let multiplier = 1000;
			if ([`minute`,
				`minutes`,
				`second`,
				`seconds`,
				`tick`,
				`ticks`].includes(m)) {
					switch (m) {
						case `minute`:
						case `minutes`:
							multiplier = 60000;
							break;
						case `second`:
						case `seconds`:
							multiplier = 1000;
							break;
						case `tick`:
						case `ticks`:
							multiplier = 10;
							break;
					}
					compiler.next();
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `every`,
				lino,
				rate,
				multiplier
			});
			return compiler.completeHandler();
		},

		run: program => {
			const command = program[program.pc];
			const cb = command.pc + 2;
			const rate = program.getValue(command.rate) * command.multiplier;
			const theProgram = program;
			setInterval(function() {
				theProgram.run(cb);
			}, rate);
			return command.pc + 1;
		}
	},

	Exit: {

		compile: compiler => {
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `exit`
			});
			return true;
		},

		run: program => {
			let parent = EasyCoder.scripts[program.parent];
			let unblocked = program.unblocked;
			program.exit();
			if (!unblocked && parent) {
				parent.run(parent.nextPc);
				parent.nextPc = 0;
			}
			return 0;
		}
	},

	Filter: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const arrayRecord = compiler.getSymbolRecord();
				if (compiler.nextTokenIs(`with`)) {
					const func = compiler.nextToken();
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `filter`,
						lino,
						array: arrayRecord.name,
						func
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const variable = program.getSymbolRecord(command.array);
			const value = variable.value[variable.index].content;
			const func = program.getSymbolRecord(command.func).pc;
			try {
				const array = JSON.parse(value);
				const result = array.filter(function (a) {
					variable.a = a;
					program.run(func);
					return variable.v;
				});
				variable.value[variable.index].content = JSON.stringify(result);
			} catch (err) {
				program.runtimeError(command.lino, `Can't parse this array`);
			}
			return command.pc + 1;
		}
	},

	Fork: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.nextTokenIs(`to`)) {
				compiler.next();
			}
			const label = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `fork`,
				lino,
				label
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			try {
				program.run(program.symbols[command.label].pc);
			} catch (err) {
				console.log(err.message);
				alert(err.message);
			}
			return command.pc + 1;
		}
	},

	Go: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`to`)) {
				compiler.next();
			}
			const label = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `go`,
				lino,
				label
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			if (command.label) {
				if (program.verifySymbol(command.label)) {
					const pc = program.symbols[command.label];
					if (pc) {
						return pc.pc;
					}
				}
				program.runtimeError(command.lino, `Unknown symbol '${command.label}'`);
				return 0;
			}
			return command.goto;
		}
	},

	Gosub: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`to`)) {
				compiler.next();
			}
			const label = compiler.getToken();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `gosub`,
				lino,
				label
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			if (program.verifySymbol(command.label)) {
				program.programStack.push(program.pc + 1);
				return program.symbols[command.label].pc;
			}
			program.runtimeError(command.lino, `Unknown symbol '${command.label}'`);
			return 0;
		}
	},

	If: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const condition = compiler.condition.compile(compiler);
			const pc = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `if`,
				lino,
				condition
			});
			// Get the 'then' code
			compiler.compileOne();
			if (!compiler.getToken()) {
				compiler.getCommandAt(pc).else = compiler.getPc();
				return true;
			}
			if (compiler.tokenIs(`else`)) {
				const goto = compiler.getPc();
				// Add a 'goto' to skip the 'else'
				compiler.addCommand({
					domain: `core`,
					keyword: `goto`,
					lino,
					goto: 0
				});
				// Fixup the link to the 'else' branch
				compiler.getCommandAt(pc).else = compiler.getPc();
				// Process the 'else' branch
				compiler.next();
				// Add the 'else' branch
				compiler.compileOne(true);
				// Fixup the 'goto'
				compiler.getCommandAt(goto).goto = compiler.getPc();
			} else {
				// We're at the next command
				compiler.getCommandAt(pc).else = compiler.getPc();
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const condition = command.condition;
			const test = program.condition.test(program, condition);
			if (test) {
				return command.pc + 1;
			}
			return command.else;
		}
	},

	Import: {

		compile: compiler => {
			const imports = compiler.imports;
			let caller = EasyCoder.scripts[imports.caller];
			const program = compiler.getProgram();
			if (imports.length) {
				for (const name of imports) {
					let symbolRecord = caller.getSymbolRecord(name);
					const thisType = compiler.nextToken();
					const exportedType = symbolRecord.keyword;
					if (thisType === exportedType) {
						const command = compiler.compileVariable(symbolRecord.domain, exportedType, true);
						const newRecord = program[compiler.getSymbols()[command.name].pc];
						newRecord.element = symbolRecord.element;
						newRecord.exporter = symbolRecord.exporter ? symbolRecord.exporter : caller.script;
						newRecord.exportedName = symbolRecord.name;
						newRecord.extra = symbolRecord.extra;
						newRecord.isVHolder = symbolRecord.isVHolder;
						if (symbolRecord.program) {
							newRecord.program = symbolRecord.program.script;
						}
						newRecord.imported = true;
						if (!compiler.tokenIs(`and`)) {
							break;
						}
					} else {
						throw new Error(`Mismatched import variable type for '${symbolRecord.name}'`);
					}
				}
				if (compiler.tokenIs(`and`)) {
					throw new Error(`Imports do not match exports`);
				}
			} else {
				compiler.next();
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			return command.pc + 1;
		}
	},

	Index: {

		compile: compiler => {
			const lino = compiler.getLino();
			// get the variable
			if (compiler.nextIsSymbol(true)) {
				const symbol = compiler.getToken();
				if (compiler.nextTokenIs(`to`)) {
					// get the value
					const value = compiler.getNextValue();
					compiler.addCommand({
						domain: `core`,
						keyword: `index`,
						lino,
						symbol,
						value
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			const index = program.getValue(command.value);
			if (index >= symbol.elements) {
				program.runtimeError(command.lino,
					`Array index ${index} is out of range for '${symbol.name}'`);
			}
			symbol.index = index;
			if (symbol.imported) {
				const exporterRecord = EasyCoder.symbols[symbol.exporter].getSymbolRecord(symbol.exportedName);
				exporterRecord.index = index;
			}
			return command.pc + 1;
		}
	},

	Module: {

		compile: compiler => {
			compiler.compileVariable(`core`, `module`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Multiply: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			let target;
			if (compiler.isSymbol()) {
				// It may be the target
				const symbol = compiler.getSymbol();
				target = compiler.getCommandAt(symbol.pc).name;
			}
			// Get the value even if we have a target
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.tokenIs(`by`)) {
				compiler.next();
			}
			// The next item is always a value
			const value2 = compiler.getValue();
			// If we now have 'giving' then the target follows
			if (compiler.tokenIs(`giving`)) {
				compiler.next();
				// Get the target
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					target = compiler.getCommandAt(symbol.pc).name;
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `multiply`,
						lino,
						value1,
						value2,
						target
					});
					return true;
				}
				compiler.warning(`core multiply: Expected value holder`);
			} else {
				// Here we should already have the target.
				if (typeof target === `undefined`) {
					compiler.warning(`core multiply: No target variable given`);
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `multiply`,
					lino,
					value2,
					target
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value1) {
					const result = program.getValue(value1) *
						program.getValue(value2);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command, lino);
					}
					const result = parseInt(value.content) * parseInt(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Negate: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `negate`,
					lino,
					symbol
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			if (symbol.isVHolder) {
				symbol.value[symbol.index] = {
					type: `constant`,
					numeric: true,
					content: -symbol.value[symbol.index].content
				};
			} else {
				program.variableDoesNotHoldAValueError(command.lino, symbol.name);
			}
			return command.pc + 1;
		}
	},

	On: {

		compile: compiler => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `close`:
			case `message`:
			case `error`:
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			}
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `callback`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `on`,
						lino,
						action: symbolRecord.name
					});
					return compiler.completeHandler();
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const cb = command.pc + 2;
			switch (command.action) {
			case `close`:
				program.onClose = cb;
				break;
			case `message`:
				program.onMessage = cb;
				break;
			case `error`:
				program.onError = cb;
				break;
			default:
				const callbacklRecord = program.getSymbolRecord(command.action);
				if (callbacklRecord) {
					callbacklRecord.cb = cb;
				} else {
					program.runtimeError(command.lino, `Unknown action '${command.action}'`);
					return 0;
				}
			}
			return command.pc + 1;
		}
	},

	Pop: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const target = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `pop`,
					lino,
					target
				});
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.target);
			if (!target.isVHolder) {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			const value = program.dataStack.pop();
			target.value[target.index] = value;
			if (target.imported) {
				const exporterRecord = EasyCoder.scripts[target.exporter].getSymbolRecord(target.exportedName);
				exporterRecord.value[exporterRecord.index] = value;
			}
			return command.pc + 1;
		}
	},

	Print: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const value = compiler.getValue();
			compiler.addCommand({
				domain: `core`,
				keyword: `print`,
				lino,
				value
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const value = program.getFormattedValue(command.value);
			console.log(`-> ` + value);
			return command.pc + 1;
		}
	},

	Push: {

		compile: compiler => {
			const lino = compiler.getLino();
			const value = compiler.getNextValue();
			compiler.addCommand({
				domain: `core`,
				keyword: `push`,
				lino,
				value
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const value = program.getValue(command.value);
			program.dataStack.push({
				type: command.value.type,
				numeric: command.value.numeric,
				content: value
			});
			return command.pc + 1;
		}
	},

	Put: {

		compile: compiler => {
			const lino = compiler.getLino();
			// Get the value
			const value = compiler.getNextValue();
			if (compiler.tokenIs(`into`)) {
				if (compiler.nextIsSymbol()) {
					const target = compiler.getToken();
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `put`,
						lino,
						value,
						target
					});
					return true;
				}
				compiler.warning(`core:put: No such variable: '${compiler.getToken()}'`);
			}
			return false;
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			const target = program.getSymbolRecord(command.target);
			if (!target.isVHolder) {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			const value = program.evaluate(command.value);
			// target.value[target.index] = value;
			target.value[target.index] = {
				type: value.type,
				numeric: value.numeric,
				content: value.content
			};
			if (target.imported) {
				const exporterRecord = EasyCoder.scripts[target.exporter].getSymbolRecord(target.exportedName);
				exporterRecord.value[exporterRecord.index] = value;
			}
			return command.pc + 1;
		}
	},

	Replace: {

		compile: compiler => {
			const lino = compiler.getLino();
			const original = compiler.getNextValue();
			if (compiler.tokenIs(`with`)) {
				const replacement = compiler.getNextValue();
				if (compiler.tokenIs(`in`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.isVHolder) {
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `replace`,
								lino,
								original,
								replacement,
								target: targetRecord.name
							});
							return true;
						} else {
							throw new Error(`'${targetRecord.name}' does not hold a value`);
						}
					}
				}
			}
			return false;
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			const original = program.getValue(command.original);
			const replacement = program.getValue(command.replacement);
			const target = program.getSymbolRecord(command.target);
			const value = program.getValue(target.value[target.index]);
			let content = ``;
			try {
				content = value.split(original).join(replacement);
			// eslint-disable-next-line no-empty
			} catch (err) {}
			target.value[target.index] = {
				type: `constant`,
				numeric: false,
				content
			};
			return command.pc + 1;
		}
	},

	Require: {

		compile: compiler => {
			const lino = compiler.getLino();
			const type = compiler.nextToken();
			if ([`css`, `js`].includes(type)) {
				const url = compiler.getNextValue();
				compiler.addCommand({
					domain: `core`,
					keyword: `require`,
					lino,
					type,
					url
				});
				return true;
			}
			throw new Error(`File type must be 'css' or 'js'`);
		},

		// runtime

		run: program => {
			const command = program[program.pc];
			program.require(command.type, program.getValue(command.url),
				function () {
					program.run(command.pc + 1);
				});
			return 0;
		}
	},

	Return: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			compiler.addCommand({
				domain: `core`,
				keyword: `return`,
				lino
			});
			return true;
		},

		// runtime

		run: program => {
			return program.programStack.pop();
		}
	},

	Run: {

		compile: compiler => {
			const lino = compiler.getLino();
			const script = compiler.getNextValue();
			const imports = [];
			if (compiler.tokenIs(`with`)) {
				while (true) {
					if (compiler.nextIsSymbol(true)) {
						const symbolRecord = compiler.getSymbolRecord();
						imports.push(symbolRecord.name);
						compiler.next();
						if (!compiler.tokenIs(`and`)) {
							break;
						}
					}
				}
			}
			let module;
			if (compiler.tokenIs(`as`)) {
				if (compiler.nextIsSymbol(true)) {
					const moduleRecord = compiler.getSymbolRecord();
					// moduleRecord.program = program.script;
					compiler.next();
					if (moduleRecord.keyword !== `module`) {
						throw new Error(`'${moduleRecord.name}' is not a module`);
					}
					module = moduleRecord.name;
				}
			}
			let nowait = false;
			if (compiler.tokenIs(`nowait`)) {
				compiler.next();
				nowait = true;
			}
			const pc = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `run`,
				lino,
				script,
				imports,
				module,
				nowait,
				then: 0
			});
			// Get the 'then' code, if any
			if (compiler.tokenIs(`then`)) {
				const goto = compiler.getPc();
				// Add a 'goto' to skip the 'then'
				compiler.addCommand({
					domain: `core`,
					keyword: `goto`,
					goto: 0
				});
				// Fixup the link to the 'then' branch
				compiler.getCommandAt(pc).then = compiler.getPc();
				// Process the 'then' branch
				compiler.next();
				compiler.compileOne(true);
				compiler.addCommand({
					domain: `core`,
					keyword: `stop`
				});
				// Fixup the 'goto'
				compiler.getCommandAt(goto).goto = compiler.getPc();
			}
			return true;
		},

		// runtime

		run: program => {
			program.nextPc = program.pc + 1;
			program.runScript(program);
			return 0;
		}
	},

	Sanitize: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const name = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `sanitize`,
					lino,
					name
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			const value = symbolRecord.value[symbolRecord.index];
			value.content = JSON.stringify(JSON.parse(value.content));
			return command.pc + 1;
		}
	},

	Script: {

		compile: compiler => {
			const program = compiler.getProgram();
			program.script = compiler.nextToken();
			compiler.script = program.script;
			if (EasyCoder.scripts[program.script]) {
				delete compiler.script;
				throw new Error(`Script '${program.script}' is already running.`);
			}
			EasyCoder.scripts[program.script] = program;
			compiler.next();
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Send: {

		compile: compiler => {
			const lino = compiler.getLino();
			let message = ``;
			if (!compiler.nextTokenIs(`to`)) {
				message = compiler.getValue();
			}
			if (compiler.tokenIs(`to`)) {
				var recipient;
				if (compiler.nextTokenIs(`parent`)) {
					recipient = `parent`;
				} else if (compiler.isSymbol) {
					const moduleRecord = compiler.getSymbolRecord();
					if (moduleRecord.keyword !== `module`) {
						throw new Error(`'${moduleRecord.name}' is not a module`);
					}
					recipient = moduleRecord.name;
				}
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `send`,
					lino,
					message,
					recipient
				});
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const message = program.getValue(command.message);
			if (command.recipient === `parent`) {
				if (program.parent) {
					const parent = EasyCoder.scripts[program.parent];
					const onMessage = parent.onMessage;
					if (onMessage) {
						parent.message = message;
						parent.run(parent.onMessage);
					}
				}
			} else {
				const recipient = program.getSymbolRecord(command.recipient);
				if (recipient.program) {
					let rprog = EasyCoder.scripts[recipient.program];
					rprog.message = message;
					rprog.run(rprog.onMessage);
				}
			}
			return command.pc + 1;
		}
	},

	Set: {

		compile: compiler => {
			let name;
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (!targetRecord.isVHolder) {
					return false;
				}
				if (compiler.nextTokenIs(`to`)) {
					const token = compiler.nextToken();
					if ([`array`, `object`].includes(token)) {
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `set`,
							lino,
							request: `setVarTo`,
							target: targetRecord.name,
							type: token
						});
						return true;
					}
					const value = [];
					while (true) {
						const mark = compiler.getIndex();
						try {
							value.push(compiler.getValue());
						} catch (err) {
							compiler.rewindTo(mark);
							break;
						}
					}
					compiler.addCommand({
						domain: `core`,
						keyword: `set`,
						lino,
						request: `setArray`,
						target: targetRecord.name,
						value
					});
					return true;
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `set`,
					lino,
					request: `setBoolean`,
					target: targetRecord.name
				});
				return true;
			}
			switch (compiler.getToken()) {
			case `ready`:
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `set`,
					lino,
					request: `setReady`
				});
				return true;
			case `element`:
				const index = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							if (compiler.nextTokenIs(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `core`,
									keyword: `set`,
									lino,
									request: `setElement`,
									target: targetRecord.name,
									index,
									value
								});
								return true;
							}
						}
					}
				}
				break;
			case `property`:
				name = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.keyword === `variable`) {
							if (compiler.nextTokenIs(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `core`,
									keyword: `set`,
									lino,
									request: `setProperty`,
									target: targetRecord.name,
									name,
									value
								});
								return true;
							}
						}
					}
				}
				break;
			case `arg`:
				name = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (compiler.nextTokenIs(`to`)) {
							const value = compiler.getNextValue();
							compiler.addCommand({
								domain: `core`,
								keyword: `set`,
								lino,
								request: `setArg`,
								target: targetRecord.name,
								name,
								value
							});
							return true;
						}
					}
				}
			}
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			switch (compiler.getToken()) {
			case `elements`:
				compiler.next();
				if (compiler.tokenIs(`of`)) {
					compiler.next();
					if (!compiler.isSymbol()) {
						throw new Error(`Unknown variable '${compiler.getToken()}'`);
					}
					const symbol = compiler.getToken();
					compiler.next();
					if (compiler.tokenIs(`to`)) {
						compiler.next();
						// get the value
						const value = compiler.getValue();
						compiler.addCommand({
							domain: `core`,
							keyword: `set`,
							lino,
							request: `setElements`,
							symbol,
							value
						});
						return true;
					}
				}
				break;
			case `encoding`:
				if (compiler.nextTokenIs(`to`)) {
					const encoding = compiler.getNextValue();
					compiler.addCommand({
						domain: `core`,
						keyword: `set`,
						request: `encoding`,
						lino,
						encoding
					});
					return true;
				}
				compiler.addWarning(`Unknown encoding option`);
				break;
			case `payload`:
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const callbackRecord = compiler.getSymbolRecord();
						if (callbackRecord.keyword === `callback`) {
							if (compiler.nextTokenIs(`to`)) {
								const payload = compiler.getNextValue();
								compiler.addCommand({
									domain: `core`,
									keyword: `set`,
									request: `setPayload`,
									lino,
									callback: callbackRecord.name,
									payload
								});
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		run: program => {
			let targetRecord;
			const command = program[program.pc];
			switch (command.request) {
			case `setBoolean`:
				const target = program.getSymbolRecord(command.target);
				if (target.isVHolder) {
					target.value[target.index] = {
						type: `boolean`,
						content: true
					};
					command.numeric = false;
				} else {
					program.variableDoesNotHoldAValueError(command.lino, target.name);
				}
				break;
			case `setReady`:
				let parent = EasyCoder.scripts[program.parent];
				if (parent) {
					parent.run(parent.nextPc);
					parent.nextPc = 0;
					program.unblocked = true;
				}
				break;
			case `setArray`:
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.elements = command.value.length;
				targetRecord.value = command.value;
				break;
			case `encoding`:
				program.encoding = program.getValue(command.encoding);
				break;
			case `setElements`:
				const symbol = program.getSymbolRecord(command.symbol);
				const oldCount = symbol.elements;
				symbol.elements = program.getValue(command.value);
				if (symbol.elements > oldCount) {
					for (var n = oldCount; n < symbol.elements; n++) {
						symbol.value.push({});
						symbol.element.push(null);
					}
				} else {
					symbol.value = symbol.value.slice(0, symbol.elements);
					symbol.element = symbol.element.slice(0, symbol.elements);
				}
				if (symbol.index >= symbol.elements) {
					symbol.index = symbol.elements - 1;
				}
				break;
			case `setElement`:
				targetRecord = program.getSymbolRecord(command.target);
				const index = program.getValue(command.index);
				const elements = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
				let value = program.getValue(command.value);
				if (program.isJsonString(value)) {
					value = JSON.parse(value);
				}
				elements[index] = value;
				targetRecord.value[targetRecord.index].content = JSON.stringify(elements);
				break;
			case `setProperty`:
				// This is the name of the property
				const itemName = program.getValue(command.name);
				// This is the value of the property
				let itemValue = program.getValue(command.value);
				if (program.isJsonString(itemValue)) {
					itemValue = JSON.parse(itemValue);
				}
				targetRecord = program.getSymbolRecord(command.target);
				let targetValue = targetRecord.value[targetRecord.index];
				// Get the existing JSON
				if (!targetValue.numeric) {
					let content = targetValue.content;
					if (content === ``) {
						content = {};
					}
					else if (program.isJsonString(content)) {
						content = JSON.parse(content);
					}
					// Set the property
					content[itemName] = itemValue;
					// Put it back
					content = JSON.stringify(content);
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content
					};
				}
				break;
			case `setPayload`:
				program.getSymbolRecord(command.callback).payload = program.getValue(command.payload);
				break;
			case `setArg`:
				const name = program.getValue(command.name);
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord[name] = program.getValue(command.value);
				break;
			case `setVarTo`:
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: command.type === `array` ? `[]` : `{}`
				};
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	Sort: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const arrayRecord = compiler.getSymbolRecord();
				if (compiler.nextTokenIs(`with`)) {
					const func = compiler.nextToken();
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `sort`,
						lino,
						array: arrayRecord.name,
						func
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const variable = program.getSymbolRecord(command.array);
			const value = variable.value[variable.index].content;
			const func = program.getSymbolRecord(command.func).pc;
			try {
				const array = JSON.parse(value);
				array.sort(function (a, b) {
					variable.a = a;
					variable.b = b;
					program.run(func);
					return variable.v;
				});
				variable.value[variable.index].content = JSON.stringify(array);
			} catch (err) {
				program.runtimeError(command.lino, `Can't parse this array`);
			}
			return command.pc + 1;
		}
	},

	Split: {

		compile: compiler => {
			const lino = compiler.getLino();
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
							domain: `core`,
							keyword: `split`,
							lino,
							item,
							on,
							target: targetRecord.name
						});
						return true;
					}
				}
			}
			return false;
		},

		run: program => {
			let command = program[program.pc];
			let content = program.getValue(command.item);
			let on = program.getValue(command.on);
			content = content.split(on);
			let elements = content.length;
			targetRecord = program.getSymbolRecord(command.target);
			targetRecord.elements = elements;
			for (let n = 0; n < elements; n++) {
				targetRecord.value[n] = {
					type: `constant`,
					numeric: false,
					content: content[n]
				};
			}
			targetRecord.index = 0;
			return command.pc + 1;
		}
	},

	Stop: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.more() && compiler.isSymbol() && !compiler.getToken().endsWith(`:`)) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `module`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `stop`,
						lino,
						name: symbolRecord.name
					});
					return true;
				} else {
					return false;
				}
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `stop`,
				lino,
				next: 0
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			if (command.name) {
				const symbolRecord = program.getSymbolRecord(command.name);
				EasyCoder.scripts[symbolRecord.program].exit();
				symbolRecord.program = null;
			} else {
				return 0;
			}
			return command.pc + 1;
		}
	},

	Take: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Get the (first) value
			let value1;
			try {
				value1 = compiler.getValue();
			} catch (err) {
				return false;
			}
			if (compiler.tokenIs(`from`)) {
				compiler.next();
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbol();
					const variable = compiler.getCommandAt(symbol.pc);
					if (variable.isVHolder) {
						if (compiler.peek() === `giving`) {
							// This variable must be treated as a second value
							const value2 = compiler.getValue();
							compiler.next();
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `take`,
								lino,
								value1,
								value2,
								target
							});
						} else {
							// Here the variable is the target.
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `core`,
								keyword: `take`,
								lino,
								value1,
								target
							});
						}
						return true;
					} else {
						compiler.warning(`core 'take'': Expected value holder`);
					}
				} else {
					// Here we have 2 values so 'giving' must come next
					const value2 = compiler.getValue();
					if (compiler.tokenIs(`giving`)) {
						compiler.next();
						const target = compiler.getToken();
						compiler.next();
						compiler.addCommand({
							domain: `core`,
							keyword: `take`,
							lino,
							value1,
							value2,
							target
						});
						return true;
					} else {
						compiler.warning(`core 'take'': Expected "giving"`);
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const value1 = command.value1;
			const value2 = command.value2;
			const target = program.getSymbolRecord(command.target);
			if (target.isVHolder) {
				const value = target.value[target.index];
				if (value2) {
					const result = program.getValue(value2) -
						program.getValue(value1);
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command.lino);
					}
					const result = parseInt(program.getValue(value)) - parseInt(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: true,
						content: result
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Test: {

		compile: compiler => {
			compiler.next();
			return true;
		},

		run: program => {
			console.log(`Test`);
			return program[program.pc].pc + 1;
		}
	},

	Toggle: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				const symbolPc = compiler.getSymbolPc();
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `toggle`,
					lino,
					symbol: symbolPc
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbol = program[command.symbol];
			if (symbol.isVHolder) {
				const handler = program.domain[symbol.domain];
				const content = handler.value.get(program, symbol.value[symbol.index]).content;
				handler.value.put(symbol, {
					type: `boolean`,
					content: !content
				});
			} else {
				program.variableDoesNotHoldAValueError(command.lino, symbol.name);
			}
			return command.pc + 1;
		}
	},

	Variable: {

		compile: compiler => {
			compiler.compileVariable(`core`, `variable`, true);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Wait: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const value = compiler.getValue(compiler);
			const scale = compiler.getToken();
			let multiplier = 1000;
			switch (scale) {
			case `milli`:
			case `millis`:
				compiler.next();
				multiplier = 1;
				break;
			case `tick`:
			case `ticks`:
				compiler.next();
				multiplier = 10;
				break;
			case `second`:
			case `seconds`:
				compiler.next();
				multiplier = 1000;
				break;
			case `minute`:
			case `minutes`:
				compiler.next();
				multiplier = 60000;
				break;
			}
			compiler.addCommand({
				domain: `core`,
				keyword: `wait`,
				lino,
				value,
				multiplier
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const value = program.getValue(command.value);
			setTimeout(function () {
				if (program.run) {
					program.run(command.pc + 1);
				}
			}, value * command.multiplier);
			return 0;
		}
	},

	While: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const condition = compiler.getCondition();
			const pc = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `while`,
				lino,
				condition
			});
			// Skip when test fails
			const skip = compiler.getPc();
			compiler.addCommand({
				domain: `core`,
				keyword: `goto`,
				goto: 0
			});
			// Do the body
			compiler.compileOne();
			// Repeat the test
			compiler.addCommand({
				domain: `core`,
				keyword: `goto`,
				goto: pc
			});
			// Fixup the 'goto' on completion
			compiler.getCommandAt(skip).goto = compiler.getPc();
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const condition = command.condition;
			const test = program.condition.test(program, condition);
			if (test) {
				return program.pc + 2;
			}
			return program.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `add`:
			return EasyCoder_Core.Add;
		case `alias`:
			return EasyCoder_Core.Alias;
		case `append`:
			return EasyCoder_Core.Append;
		case `begin`:
			return EasyCoder_Core.Begin;
		case `callback`:
			return EasyCoder_Core.Callback;
		case `clear`:
			return EasyCoder_Core.Clear;
		case `close`:
			return EasyCoder_Core.Close;
		case `continue`:
			return EasyCoder_Core.Continue;
		case `debug`:
			return EasyCoder_Core.Debug;
		case `decode`:
			return EasyCoder_Core.Decode;
		case `divide`:
			return EasyCoder_Core.Divide;
		case `dummy`:
			return EasyCoder_Core.Dummy;
		case `encode`:
			return EasyCoder_Core.Encode;
		case `end`:
			return EasyCoder_Core.End;
		case `every`:
			return EasyCoder_Core.Every;
		case `exit`:
			return EasyCoder_Core.Exit;
		case `filter`:
			return EasyCoder_Core.Filter;
		case `fork`:
			return EasyCoder_Core.Fork;
		case `go`:
		case `goto`:
			return EasyCoder_Core.Go;
		case `gosub`:
			return EasyCoder_Core.Gosub;
		case `if`:
			return EasyCoder_Core.If;
		case `import`:
			return EasyCoder_Core.Import;
		case `index`:
			return EasyCoder_Core.Index;
		case `module`:
			return EasyCoder_Core.Module;
		case `multiply`:
			return EasyCoder_Core.Multiply;
		case `negate`:
			return EasyCoder_Core.Negate;
		case `on`:
			return EasyCoder_Core.On;
		case `pop`:
			return EasyCoder_Core.Pop;
		case `print`:
			return EasyCoder_Core.Print;
		case `push`:
			return EasyCoder_Core.Push;
		case `put`:
			return EasyCoder_Core.Put;
		case `replace`:
			return EasyCoder_Core.Replace;
		case `require`:
			return EasyCoder_Core.Require;
		case `return`:
			return EasyCoder_Core.Return;
		case `run`:
			return EasyCoder_Core.Run;
		case `sanitize`:
			return EasyCoder_Core.Sanitize;
		case `script`:
			return EasyCoder_Core.Script;
		case `send`:
			return EasyCoder_Core.Send;
		case `set`:
			return EasyCoder_Core.Set;
		case `sort`:
			return EasyCoder_Core.Sort;
		case `split`:
			return EasyCoder_Core.Split;
		case `stop`:
			return EasyCoder_Core.Stop;
		case `subtract`:
		case `take`:
			return EasyCoder_Core.Take;
		case `test`:
			return EasyCoder-Core.Test;
		case `toggle`:
			return EasyCoder_Core.Toggle;
		case `variable`:
			return EasyCoder_Core.Variable;
		case `wait`:
			return EasyCoder_Core.Wait;
		case `while`:
			return EasyCoder_Core.While;
		default:
			return false;
		}
	},

	run: program => {
		// Look up the appropriate handler and call it
		// If it's not there throw an error
		const command = program[program.pc];
		const handler = EasyCoder_Core.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino,
				`Unknown keyword '${command.keyword}' in 'core' package`);
		}
		return handler.run(program);
	},

	isNegate: (compiler) => {
		const token = compiler.getToken();
		if (token === `not`) {
			compiler.next();
			return true;
		}
		return false;
	},

	value: {

		compile: compiler => {
			if (compiler.isSymbol()) {
				const name = compiler.getToken();
				const symbolRecord = compiler.getSymbolRecord();
				switch (symbolRecord.keyword) {
				case `module`:
					compiler.next();
					return {
						domain: `core`,
						type: `module`,
						name
					};
				case `variable`:
					const type = compiler.nextToken();
					if ([`format`, `modulo`].includes(type)) {
						const value = compiler.getNextValue();
						return {
							domain: `core`,
							type,
							name,
							value
						};
					}
					return {
						domain: `core`,
						type: `symbol`,
						name
					};
				}
				return null;
			}
			
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}

			var token = compiler.getToken();
			if (token === `true`) {
				compiler.next();
				return {
					domain: `core`,
					type: `boolean`,
					content: true
				};
			}
			if (token === `false`) {
				compiler.next();
				return {
					domain: `core`,
					type: `boolean`,
					content: false
				};
			}
			if (token === `random`) {
				compiler.next();
				const range = compiler.getValue();
				return {
					domain: `core`,
					type: `random`,
					range
				};
			}
			if (token === `cos`) {
				compiler.next();
				const angle_c = compiler.getValue();
				compiler.skip(`radius`);
				const radius_c = compiler.getValue();
				return {
					domain: `core`,
					type: `cos`,
					angle_c,
					radius_c
				};
			}
			if (token === `sin`) {
				compiler.next();
				const angle_s = compiler.getValue();
				compiler.skip(`radius`);
				const radius_s = compiler.getValue();
				return {
					domain: `core`,
					type: `sin`,
					angle_s,
					radius_s
				};
			}
			if (token === `tan`) {
				compiler.next();
				const angle_t = compiler.getValue();
				compiler.skip(`radius`);
				const radius_t = compiler.getValue();
				return {
					domain: `core`,
					type: `tan`,
					angle_t,
					radius_t
				};
			}
			if ([`now`, `timestamp`, `today`, `newline`, `backtick`, `break`, `empty`, `uuid`].includes(token)) {
				compiler.next();
				return {
					domain: `core`,
					type: token
				};
			}
			if (token === `date`) {
				const value = compiler.getNextValue();
				return {
					domain: `core`,
					type: `date`,
					value
				};
			}
			if ([`encode`, `decode`, `lowercase`, `hash`, `reverse`].includes(token)) {
				compiler.next();
				const value = compiler.getValue();
				return {
					domain: `core`,
					type: token,
					value
				};
			}
			if (token === `element`) {
				const element = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `variable`) {
							return {
								domain: `core`,
								type: `element`,
								element,
								symbol: symbolRecord.name
							};
						}
					}
				}
				return null;
			}
			if (token === `property`) {
				const property = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `variable`) {
							return {
								domain: `core`,
								type: `property`,
								property,
								symbol: symbolRecord.name
							};
						}
					}
				}
				return null;
			}
			if (token === `arg`) {
				const value = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const target = compiler.getSymbolRecord();
						compiler.next();
						return {
							domain: `core`,
							type: `arg`,
							value,
							target: target.name
						};
					}
				}
			}
			if ([`character`, `char`].includes(token)) {
				let index = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					let value = compiler.getNextValue();
					return {
						domain: `core`,
						type: `char`,
						index,
						value
					};
				}
			}
			const type = compiler.getToken();
			switch (type) {
			case `elements`:
				if ([`of`, `in`].includes(compiler.nextToken())) {
					if (compiler.nextIsSymbol()) {
						const name = compiler.getToken();
						compiler.next();
						return {
							domain: `core`,
							type,
							name
						};
					}
				}
				break;
			case `index`:
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						if (compiler.peek() === `in`) {
							const value1 = compiler.getValue();
							const value2 = compiler.getNextValue();
							return {
								domain: `core`,
								type: `indexOf`,
								value1,
								value2
							};
						} else {
							const name = compiler.getToken();
							compiler.next();
							return {
								domain: `core`,
								type,
								name
							};
						}
					} else {
						const value1 = compiler.getValue();
						if (compiler.tokenIs(`in`)) {
							const value2 = compiler.getNextValue();
							return {
								domain: `core`,
								type: `indexOf`,
								value1,
								value2
							};
						}
					}
				}
				break;
			case `value`:
				if (compiler.nextTokenIs(`of`)) {
					compiler.next();
					const value = compiler.getValue();
					return {
						domain: `core`,
						type: `valueOf`,
						value
					};
				}
				break;
			case `length`:
				if (compiler.nextTokenIs(`of`)) {
					compiler.next();
					const value = compiler.getValue();
					return {
						domain: `core`,
						type: `lengthOf`,
						value
					};
				}
				break;
			case `left`:
			case `right`:
				try {
					const count = compiler.getNextValue();
					if (compiler.tokenIs(`of`)) {
						const value = compiler.getNextValue();
						return {
							domain: `core`,
							type,
							count,
							value
						};
					}
				} catch (err) {
					return null;
				}
				break;
			case `from`:
				const from = compiler.getNextValue();
				const to = compiler.tokenIs(`to`) ? compiler.getNextValue() : null;
				if (compiler.tokenIs(`of`)) {
					const value = compiler.getNextValue();
					return {
						domain: `core`,
						type,
						from,
						to,
						value
					};
				}
				break;
			case `position`:
				let nocase = false;
				if (compiler.nextTokenIs(`nocase`)) {
					nocase = true;
					compiler.next();
				}
				if (compiler.tokenIs(`of`)) {
					var last = false;
					if (compiler.nextTokenIs(`the`)) {
						if (compiler.nextTokenIs(`last`)) {
							compiler.next();
							last = true;
						}
					}
					const needle = compiler.getValue();
					if (compiler.tokenIs(`in`)) {
						const haystack = compiler.getNextValue();
						return {
							domain: `core`,
							type: `position`,
							needle,
							haystack,
							last,
							nocase
						};
					}
				}
				break;
			case `payload`:
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const callbackRecord = compiler.getSymbolRecord();
						if (callbackRecord.keyword === `callback`) {
							compiler.next();
							return {
								domain: `core`,
								type: `payload`,
								callback: callbackRecord.name
							};
						}
					}
				}
				break;
			case `message`:
			case `error`:
			case `millisecond`:
			case `time`:
				compiler.next();
				return {
					domain: `core`,
					type
				};
			case `year`:
			case `hour`:
			case `minute`:
			case `second`:
				compiler.next();
				var timestamp = null;
				if (compiler.tokenIs() == `of`) {
					compiler.next();
					timestamp = compiler.getNextValue();
				}
				return {
					domain: `core`,
					type,
					timestamp
				}
			case `day`:
			case `month`:
				if (compiler.nextTokenIs(`number`)) {
					compiler.next();
					var timestamp = null;
					if (compiler.tokenIs() == `of`) {
						compiler.next();
						timestamp = compiler.getNextValue();
					}
					return {
						domain: `core`,
						type: `${type}number`,
						timestamp
					};
				}
				return null;
			}
			return null;
		},

		get: (program, value) => {
			let content = ``;
			switch (value.type) {
			case `boolean`:
				return {
					type: `boolean`,
					numeric: false,
					content: value.content
				};
			case `elements`:
				return {
					type: `constant`,
					numeric: true,
					content: program.getSymbolRecord(value.name).elements
				};
			case `index`:
				return {
					type: `constant`,
					numeric: true,
					content: program.getSymbolRecord(value.name).index
				};
			case `random`:
				const range = program.evaluate(value.range);
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor((Math.random() * range.content))
				};
			case `cos`:
				const angle_c = program.getValue(value.angle_c);
				const radius_c = program.getValue(value.radius_c);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.cos(parseFloat(angle_c) * 0.01745329) * radius_c, 10)
				};
			case `sin`:
				const angle_s = program.getValue(value.angle_s);
				const radius_s = program.getValue(value.radius_s);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.sin(parseFloat(angle_s) * 0.01745329) * radius_s, 10)
				};
			case `tan`:
				const angle_t = program.getValue(value.angle_t);
				const radius_t = program.getValue(value.radius_t);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.tan(parseFloat(angle_t) * 0.01745329) * radius_t, 10)
				};
			case `valueOf`:
				const v = parseInt(program.getValue(value.value));
				return {
					type: `constant`,
					numeric: true,
					content: v ? v : 0
				};
			case `lengthOf`:
				return {
					type: `constant`,
					numeric: true,
					content: program.getValue(value.value).length
				};
			case `left`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).substr(0, program.getValue(value.count))
				};
			case `right`:
				const str = program.getValue(value.value);
				return {
					type: `constant`,
					numeric: false,
					content: str.substr(str.length - program.getValue(value.count))
				};
			case `from`:
				const from = program.getValue(value.from);
				const to = value.to ? program.getValue(value.to) : null;
				const fstr = program.getValue(value.value);
				return {
					type: `constant`,
					numeric: false,
					content: to ? fstr.substr(from, to) : fstr.substr(from)
				};
			case `position`:
				let needle = program.getValue(value.needle);
				let haystack = program.getValue(value.haystack);
				if (value.nocase) {
					needle = needle.toLowerCase();
					haystack = haystack.toLowerCase();
				}
				return {
					type: `constant`,
					numeric: true,
					content: value.last ? haystack.lastIndexOf(needle) : haystack.indexOf(needle)
				};
			case `payload`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.callback).payload
				};
			case `modulo`:
				const symbolRecord = program.getSymbolRecord(value.name);
				const modval = program.evaluate(value.value);
				return {
					type: `constant`,
					numeric: true,
					content: symbolRecord.value[symbolRecord.index].content % modval.content
				};
			case `format`:
				const fmtRecord = program.getSymbolRecord(value.name);
				const fmtValue = program.getValue(fmtRecord.value[fmtRecord.index]) * 1000;
				try {
					const spec = JSON.parse(program.getValue(value.value));
					switch (spec.mode) {
					case `time`:
						
						return {
							type: `constant`,
							numeric: true,
							content: new Date(fmtValue).toLocaleTimeString(spec.locale, spec.options)
						};
					case `date`:
					default:
						const date = new Date(fmtValue);
						const content = (spec.format === `iso`)
							? `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
							: date.toLocaleDateString(spec.locale, spec.options);
						return {
							type: `constant`,
							numeric: false,
							content
						};
					}
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse ${value.value}`);
					return null;
				}
			case `empty`:
				return {
					type: `constant`,
					numeric: false,
					content: ``
				};
			case `now`:
                const d = new Date();
                const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
                const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
                const isDST = Math.max(jan, jul) !== d.getTimezoneOffset();  
                let now = Math.floor(Date.now() / 1000)
				if (isDST) {
					now += 3600
				}
				return {
					type: `constant`,
					numeric: true,
					content: now
				};
			case `timestamp`:
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(Date.now() / 1000)
				};
			case `millisecond`:
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(Date.now())
				};
			case `time`:
				let date = new Date()
				let date2 = new Date()
				date2.setHours(0, 0, 0, 0);
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor((date.getTime() - date2.getTime())/1000)
				};
			case `today`:
				date = new Date()
				date.setHours(0, 0, 0, 0);
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(date.getTime() / 1000)
				};
			case `date`:
				content = Date.parse(program.getValue(value.value)) / 1000;
				if (isNaN(content)) {
					program.runtimeError(program[program.pc].lino, `Invalid date format; expecting 'yyyy-mm-dd'`);
					return null;
				}
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `newline`:
				return {
					type: `constant`,
					numeric: false,
					content: `\n`
				};
			case `backtick`:
				return {
					type: `constant`,
					numeric: false,
					content: `\``
				};
			case `break`:
				return {
					type: `constant`,
					numeric: false,
					content: `<br />`
				};
			case `uuid`:
				return {
					type: `constant`,
					numeric: false,
					content: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function(c) {
						var r = Math.random() * 16 | 0, v = c == `x` ? r : (r & 0x3 | 0x8);
						return v.toString(16);
					})
				};
			case `encode`:
				return {
					type: `constant`,
					numeric: false,
					content: program.encode(program.getValue(value.value))
				};
			case `decode`:
				return {
					type: `constant`,
					numeric: false,
					content: program.decode(program.getValue(value.value))
				};
			case `reverse`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).split(``).reverse().join(``)
				};
			case `lowercase`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).toLowerCase()
				};
			case `hash`:
				const hashval = program.getValue(value.value);
				let hash = 0;
				if (hashval.length === 0) return hash;
				for (let i = 0; i < hashval.length; i++) {
					const chr = hashval.charCodeAt(i);
					hash = ((hash << 5) - hash) + chr;
					//					hash |= 0; // Convert to 32bit integer
				}
				return {
					type: `constant`,
					numeric: true,
					content: hash
				};
			case `element`:
				const element = program.getValue(value.element);
				const elementRecord = program.getSymbolRecord(value.symbol);
				var elementContent = ``;
				try {
					elementContent = JSON.parse(program.getValue(elementRecord.value[elementRecord.index]))[element];
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse JSON`);
					return null;
				}
				return {
					type: `constant`,
					numeric: false,
					content: typeof elementContent === `object` ?
						JSON.stringify(elementContent) : elementContent
				};
			case `property`:
				const property = program.getValue(value.property);
				const propertyRecord = program.getSymbolRecord(value.symbol);
				let propertyContent = program.getValue(propertyRecord.value[propertyRecord.index]);
				if (property && propertyContent) {
					if (typeof propertyContent === `object`) {
						content = propertyContent[property];
					} else if ([`{`, `]`].includes(propertyContent.charAt(0))) {
						try {
							content = JSON.parse(propertyContent);
						} catch (err) {
							program.runtimeError(program[program.pc].lino, `Can't parse '${propertyContent}': ${err.message}`);
						}
						content = content[property];
						if (content == undefined) {
							content = ``;
						}
					}
				}
				return {
					type: `constant`,
					numeric: !Array.isArray(content) && !isNaN(content),
					content: typeof content === `object` ? JSON.stringify(content) : content
				};
			case `module`:
				const module = program.getSymbolRecord(value.name);
				return {
					type: `boolean`,
					numeric: false,
					content: module.program
				};
			case `message`:
				content = program.message;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `error`:
				content = program.errorMessage;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `indexOf`:
				const value1 = program.getValue(value.value1);
				const value2 = program.getValue(value.value2);
				try {
					content = JSON.parse(value2).indexOf(value1);
					return {
						type: `constant`,
						numeric: true,
						content
					};
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse ${value2}`);
				}
				break;
			case `arg`:
				const name = program.getValue(value.value);
				const target = program.getSymbolRecord(value.target);
				content = target[name];
				return {
					type: `constant`,
					numeric: !isNaN(content),
					content
				};
			case `char`:
				let index = program.getValue(value.index);
				let string = program.getValue(value.value);
				return {
					type: `constant`,
					numeric: false,
					content: string[index]
				};
			case `year`:
				var year = new Date().getFullYear();
				if (value.timestamp) {
					year = new Date(program.getValue(value.timestamp) * 1000).getFullYear();
				}
				return {
					type: `constant`,
					numeric: true,
					content: year
				};
			case `hour`:
				var hour = new Date().getHours();
				if (value.timestamp) {
					hour = new Date(program.getValue(value.timestamp) * 1000).getHours();
				}
				return {
					type: `constant`,
					numeric: true,
					content: hour
				};
			case `minute`:
				var minute = new Date().getMinutes();
				if (value.timestamp) {
					minute = new Date(program.getValue(value.timestamp) * 1000).getMinutes();
				}
				return {
					type: `constant`,
					numeric: true,
					content: minute
				};
			case `second`:
				var second = new Date().getSeconds();
				if (value.timestamp) {
					second = new Date(program.getValue(value.timestamp) * 1000).getSeconds();
				}
				return {
					type: `constant`,
					numeric: true,
					content: second
				};
			case `monthnumber`:
				var monthNumber = new Date().getMonth();
				if (value.timestamp) {
					monthNumber = new Date(program.getValue(value.timestamp) * 1000).getMonth();
				}
				return {
					type: `constant`,
					numeric: true,
					content: monthNumber
				};
			case `daynumber`:
				var dayNumber = new Date().getDate();
				if (value.timestamp) {
					dayNumber = new Date(program.getValue(value.timestamp) * 1000).getDate();
				}
				return {
					type: `constant`,
					numeric: true,
					content: dayNumber
				};
			default:
				return null;
			}
		},

		put: (symbol, value) => {
			symbol.value[symbol.index] = value;
		}
	},

	condition: {

		compile: compiler => {
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `module`) {
					if (compiler.nextTokenIs(`is`)) {
						let sense = true;
						if (compiler.nextTokenIs(`not`)) {
							compiler.next();
							sense = false;
						}
						if (compiler.tokenIs(`running`)) {
							compiler.next();
							return {
								domain: `core`,
								type: `moduleRunning`,
								name: symbolRecord.name,
								sense
							};
						}
					}
					return null;
				}
			}
			if (compiler.tokenIs(`not`)) {
				const value = compiler.getNextValue();
				return {
					domain: `core`,
					type: `not`,
					value
				};
			}
			try {
				const value1 = compiler.getValue();
				const token = compiler.getToken();
				if (token === `includes`) {
					const value2 = compiler.getNextValue();
					return {
						domain: `core`,
						type: `includes`,
						value1,
						value2
					};
				}
				if (token === `is`) {
					compiler.next();
					const negate = EasyCoder_Core.isNegate(compiler);
					const test = compiler.getToken();
					switch (test) {
					case `numeric`:
						compiler.next();
						return {
							domain: `core`,
							type: `numeric`,
							value1,
							negate
						};
					case `even`:
						compiler.next();
						return {
							domain: `core`,
							type: `even`,
							value1
						};
					case `odd`:
						compiler.next();
						return {
							domain: `core`,
							type: `odd`,
							value1
						};
					case `greater`:
						if (compiler.nextTokenIs(`than`)) {
							compiler.next();
							const value2 = compiler.getValue();
							return {
								domain: `core`,
								type: `greater`,
								value1,
								value2,
								negate
							};
						}
						return null;
					case `less`:
						if (compiler.nextTokenIs(`than`)) {
							compiler.next();
							const value2 = compiler.getValue();
							return {
								domain: `core`,
								type: `less`,
								value1,
								value2,
								negate
							};
						}
						return null;
					case `an`:
						switch (compiler.nextToken()) {
							case `array`:
								compiler.next();
								return {
									domain: `core`,
									type: `array`,
									value1
								};
								break;
							case `object`:
								compiler.next();
								return {
									domain: `core`,
									type: `object`,
									value1
								};
								break;
						}
						return null;
					default:
						const value2 = compiler.getValue();
						return {
							domain: `core`,
							type: `is`,
							value1,
							value2,
							negate
						};
					}
				} else if (value1) {
					// It's a boolean if
					return {
						domain: `core`,
						type: `boolean`,
						value: value1
					};
				}
			} catch (err) {
				compiler.warning(`Can't get a value`);
				return 0;
			}
			return null;
		},

		test: (program, condition) => {
			var comparison;
			switch (condition.type) {
			case `boolean`:
				return program.getValue(condition.value);
			case `numeric`:
				let v = program.getValue(condition.value1);
				let test = v === ` ` || isNaN(v);
				return condition.negate ? test : !test;
			case `even`:
				return (program.getValue(condition.value1) % 2) === 0;
			case `odd`:
				return (program.getValue(condition.value1) % 2) === 1;
			case `is`:
				comparison = program.compare(program, condition.value1, condition.value2);
				return condition.negate ? comparison !== 0 : comparison === 0;
			case `greater`:
				comparison = program.compare(program, condition.value1, condition.value2);
				return condition.negate ? comparison <= 0 : comparison > 0;
			case `less`:
				comparison = program.compare(program, condition.value1, condition.value2);
				return condition.negate ? comparison >= 0 : comparison < 0;
			case `array`:
				const isArray = program.getValue(condition.value1)[0] === `[`;
				return condition.negate ? !isArray : isArray;
			case `object`:
				const isObject = program.getValue(condition.value1)[0] === `{`;
				return condition.negate ? !isObject : isObject;
			case `not`:
				return !program.getValue(condition.value);
			case `moduleRunning`:
				let moduleRecord = program.getSymbolRecord(condition.name);
				if (typeof moduleRecord.program !== `undefined`) {
					let p = EasyCoder.scripts[moduleRecord.program];
					if (!p) {
						return !condition.sense;
					}
					return condition.sense ? p.running : !p.running;
				}
				return !condition.sense;
			case `includes`:
				const value1 = program.getValue(condition.value1);
				const value2 = program.getValue(condition.value2);
				return value1.includes(value2);
			}
			return false;
		}
	}
};
const EasyCoder_Browser = {

	name: `EasyCoder_Browser`,

	A: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `a`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Alert: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const value = compiler.getNextValue();
			compiler.addCommand({
				domain: `browser`,
				keyword: `alert`,
				lino,
				value
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			const value = program.getFormattedValue(command.value);
			alert(value);
			return command.pc + 1;
		}
	},

	Attach: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			compiler.next();
			if (compiler.isSymbol()) {
				//				const symbol = compiler.getProgram()[compiler.getSymbol().pc];
				const symbol = compiler.getSymbolRecord();
				let type = symbol.keyword;
				switch (type) {
				case `a`:
				case `blockquote`:
				case `button`:
				case `canvas`:
				case `div`:
				case `fieldset`:
				case `file`:
				case `form`:
				case `h1`:
				case `h2`:
				case `h3`:
				case `h4`:
				case `h5`:
				case `h6`:
				case `image`:
				case `img`:
				case `input`:
				case `label`:
				case `legend`:
				case `li`:
				case `option`:
				case `p`:
				case `pre`:
				case `select`:
				case `span`:
				case `table`:
				case `td`:
				case `text`:
				case `textarea`:
				case `tr`:
				case `ul`:
					compiler.next();
					if (compiler.tokenIs(`to`)) {
						let cssId = null;
						if (compiler.nextTokenIs(`body`)) {
							if (type=== `div`) {
								cssId = `body`;
								compiler.next();
							} else {
								throw Error(`Body variable must be a div`);
							}
						}
						else cssId = compiler.getValue();
						let onError = 0;
						if (compiler.tokenIs(`or`)) {
							compiler.next();
							onError = compiler.getPc() + 1;
							compiler.completeHandler();
						}
						compiler.addCommand({
							domain: `browser`,
							keyword: `attach`,
							lino,
							type,
							symbol: symbol.name,
							cssId,
							onError
						});
						return true;
					}
					break;
				default:
					compiler.addWarning(`type '${symbol.keyword}' not recognized in browser 'attach'`);
					return false;
				}
			}
			compiler.addWarning(`Unrecognised syntax in 'attach'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let content = null;
			let element = null;
			if (command.cssId === `body`) {
				const target = program.getSymbolRecord(command.symbol);
				target.element[target.index] = document.body;
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					content
				};
			} else {
				content = program.value.evaluate(program, command.cssId).content;
				EasyCoder_Browser.Attach.getElementById(program, command, content, 100);
				return 0;
			}
			if (command.type === `popup`) {
				// Register a popup
				program.popups.push(element.id);
				// Handle closing of the popup
				window.onclick = function (event) {
					if (program.popups.includes(event.target.id)) {
						event.target.style.display = `none`;
					}
				};
			}
			return command.pc + 1;
		},

		getElementById: (program, command, id, retries) => {
            const element = document.getElementById(id);
            if (element) {
				if (program.run) {
					const target = program.getSymbolRecord(command.symbol);
					target.element[target.index] = element;
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						id
					};
					program.run(command.pc + 1);
				}
            } else {
                if (retries > 0) {
                    setTimeout(function() {
                        EasyCoder_Browser.Attach.getElementById(program, command, id, --retries);
                    }, 10);
                } else {
					if (!element) {
						if (command.onError) {
							program.run(command.onError);
						} else {
							program.runtimeError(command.lino, `No such element: '${id}'`);
						}
					}
				}
            }
        }
	},

	Audioclip: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `audioclip`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	BLOCKQUOTE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `blockquote`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	BUTTON: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `button`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	CANVAS: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `canvas`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Click: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (targetRecord.keyword === `select`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `click`,
						lino,
						target: targetRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			const element = targetRecord.element[targetRecord.index];
			element.dispatchEvent(new Event(`click`));
			return command.pc + 1;
		}
	},

	Clear: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const name = compiler.nextToken();
			if ([`body`, `styles`].includes(name)) {
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `clear`,
					lino,
					name
				});
				return true;
			}
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.extra === `dom`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `clear`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			switch (command.name) {
			case `body`:
				document.body.innerHTML = ``;
				break;
			case `styles`:
				// document.querySelectorAll(`[style]`).forEach(el => el.removeAttribute(`style`));
				document.querySelectorAll(`link[rel="stylesheet"]`)
					.forEach(el => el.parentNode.removeChild(el));
				document.querySelectorAll(`style`).forEach(el => el.parentNode.removeChild(el)); 
				break;
			default:
				const targetRecord = program.getSymbolRecord(command.name);
				const target = targetRecord.element[targetRecord.index];
				switch (targetRecord.keyword) {
				case `input`:
				case `textarea`:
					target.value = ``;
					break;
				default:
					target.innerHTML = ``;
					break;
				}
			}
			return command.pc + 1;
		}
	},

	Convert: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`whitespace`)) {
				if (compiler.nextTokenIs(`in`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.isVHolder) {
							if (compiler.nextTokenIs(`to`)) {
								const mode = compiler.nextToken();
								compiler.next();
								compiler.addCommand({
									domain: `browser`,
									keyword: `convert`,
									lino,
									name: symbolRecord.name,
									mode
								});
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const content = targetRecord.value[targetRecord.index].content;
			let value = content;
			switch (command.mode) {
			case `print`:
				value = value.split(`%0a`).join(`\n`).split(`%0A`).join(`\n`).split(`%0d`).join(``).split(`$0D`).join(``);
				break;
			case `html`:
				value = value.split(`%0a`).join(`<br />`).split(`%0A`).join(`<br />`).split(`%0d`).join(``).split(`$0D`).join(``);
				break;
			}
			targetRecord.value[targetRecord.index].content = value;
			return command.pc + 1;
		}
	},

	Copy: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `input`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `copy`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const element = targetRecord.element[targetRecord.index];
			element.select();
			element.setSelectionRange(0, 99999); // For mobile devices
			document.execCommand(`copy`);
			return command.pc + 1;
		}
	},

	Create: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const keyword = symbolRecord.keyword;
				if (keyword === `audioclip`) {
					if (compiler.nextTokenIs(`from`)) {
						const value = compiler.getNextValue();
						compiler.addCommand({
							domain: `browser`,
							keyword: `create`,
							type: `audioclip`,
							name: symbolRecord.name,
							lino,
							value
						});
						return true;
					}
					return false;
				}
				if ([`a`,
					`blockquote`,
					`button`,
					`canvas`,
					`div`,
					`fieldset`,
					`file`,
					`form`,
					`h1`,
					`h2`,
					`h3`,
					`h4`,
					`h5`,
					`h6`,
					`hr`,
					`image`,
					`img`,
					`input`,
					`label`,
					`legend`,
					`li`,
					`option`,
					`p`,
					`pre`,
					`progress`,
					`select`,
					`span`,
					`table`,
					`tr`,
					`td`,
					`text`,
					`textarea`,
					`ul`
				].includes(keyword)) {
					if (compiler.nextTokenIs(`in`)) {
						if (compiler.nextTokenIs(`body`)) {
							compiler.next();
							compiler.addCommand({
								domain: `browser`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: `body`
							});
							return true;
						}
						if (compiler.isSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							compiler.next();
							compiler.addCommand({
								domain: `browser`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: parentRecord.name
							});
							return true;
						}
					} else {
						const imports = compiler.imports;
						if (imports && imports.length > 0 && compiler.parent === `Codex`) {
							// && compiler.program[compiler.parent.symbols[imports[0]].pc].keyword === `div`) {
							// This is used by Codex to force run in Run panel, which must be the first import
							compiler.addCommand({
								domain: `browser`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: imports[0],
								imported: true
							});
							return true;
						}
						compiler.addCommand({
							domain: `browser`,
							keyword: `create`,
							lino,
							name: symbolRecord.name,
							parent: `body`
						});
						return true;
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			switch (command.type) {
			case `audioclip`:
				targetRecord.value[targetRecord.index] = command.value;
				break;
			default:
				let parent;
				if (command.parent === `body`) {
					parent = document.body;
				} else {
					const p = command.imported ? EasyCoder.scripts[program.parent] : program;
					const parentRecord = p.getSymbolRecord(command.parent);
					if (!parentRecord.element[parentRecord.index]) {
						program.runtimeError(command.pc, `Element ${parentRecord.name} does not exist.`);
					}
					parent = parentRecord.element[parentRecord.index];
				}
				targetRecord.element[targetRecord.index] = document.createElement(targetRecord.keyword);
				targetRecord.element[targetRecord.index].id =
					`ec-${targetRecord.name}-${targetRecord.index}-${EasyCoder.elementId++}`;
				if (targetRecord.keyword === `a`) {
					targetRecord.element[targetRecord.index].setAttribute(`href`, `#`);
				}
				parent.appendChild(targetRecord.element[targetRecord.index]);
				break;
			}
			return command.pc + 1;
		}
	},

	Disable: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `disable`,
					lino,
					symbol
				});
				return true;
			}
			compiler.addWarning(`Unrecognised syntax in 'disable'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			const target = document.getElementById(symbol.value[symbol.index].content);
			target.disabled = `true`;
			return command.pc + 1;
		}
	},

	DIV: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `div`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Enable: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `enable`,
					lino,
					symbol
				});
				return true;
			}
			compiler.addWarning(`Unrecognised syntax in 'enable'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			const target = document.getElementById(symbol.value[symbol.index].content);
			target.disabled = false;
			return command.pc + 1;
		}
	},

	FIELDSET: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `fieldset`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	FILE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `file`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Focus: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbol = compiler.getToken();
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `focus`,
					lino,
					symbol
				});
				return true;
			}
			compiler.addWarning(`Unrecognised syntax in 'focus'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbol = program.getSymbolRecord(command.symbol);
			const element = symbol.element[symbol.index];
			element.focus();
			return command.pc + 1;
		}
	},

	FORM: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `form`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Get: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const target = compiler.getToken();
				let targetRecord = compiler.getSymbolRecord();
				if (compiler.nextTokenIs(`from`)) {
					if (compiler.nextTokenIs(`storage`)) {
						if (compiler.nextTokenIs(`as`)) {
							const key = compiler.getNextValue();
							compiler.addCommand({
								domain: `browser`,
								keyword: `get`,
								action: `getStorage`,
								lino,
								target,
								key
							});
							return true;
						} else {
							compiler.addCommand({
								domain: `browser`,
								keyword: `get`,
								action: `listStorage`,
								lino,
								target
							});
							return true;
						}
					}
					if (compiler.isSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `select`) {
							if (targetRecord.keyword === `option`) {
								compiler.next();
								compiler.addCommand({
									domain: `browser`,
									keyword: `get`,
									action: `getOption`,
									lino,
									target,
									select: symbolRecord.name
								});
								return true;
							}
							throw Error(`Invalid variable type`);
						}
						if (symbolRecord.keyword !== `form`) {
							throw Error(`Invalid variable type`);
						}
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `get`,
							action: `getForm`,
							lino,
							target,
							form: symbolRecord.name
						});
						return true;
					}
				}
			}
			compiler.addWarning(`Unrecognised syntax in 'get'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			switch (command.action) {
			case `getForm`:
				const formRecord = program.getSymbolRecord(command.form);
				const form = document.getElementById(formRecord.value[formRecord.index].content);
				const data = new FormData(form);
				const content = {};
				for (const entry of data) {
					content[entry[0]] = entry[1].replace(/\r/g, ``).replace(/\n/g, `%0a`);
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(content)
				};
				break;
			case `listStorage`:
				const items = [];
				for (let i = 0, len = window.localStorage.length; i < len; i++) {
					items.push(localStorage.key(i));
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(items)
				};
				break;
			case `getStorage`:
				let value = window.localStorage.getItem(program.getValue(command.key));
				if (typeof value === `undefined`) {
					value = null;
				}
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: value
				};
				break;
			case `getOption`:
				let selectRecord = program.getSymbolRecord(command.select);
				let select = selectRecord.element[selectRecord.index];
				let option = select.options[select.selectedIndex];
				targetRecord.element[targetRecord.index] = option;
				break;
			}
			return command.pc + 1;
		}
	},

	H1: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h1`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H2: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h2`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H3: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h3`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H4: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h4`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H5: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h5`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	H6: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `h6`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Highlight: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.extra === `dom`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `highlight`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const element = targetRecord.element[targetRecord.index];
			element.select();
			return command.pc + 1;
		}
	},

	History: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const type = compiler.nextToken();
			switch (type) {
			case `push`:
			case `set`:
			case `replace`:
				compiler.next();
				let url = ``;
				let state = ``;
				let title = ``;
				while (true) {
					const token = compiler.getToken();
					if (token === `url`) {
						url = compiler.getNextValue();
					} else if (token === `state`) {
						state = compiler.getNextValue();
					} else if (token === `title`) {
						title = compiler.getNextValue();
					} else {
						break;
					}
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `history`,
					lino,
					type,
					url,
					state,
					title
				});
				return true;
			case `pop`:
			case `back`:
			case `forward`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `history`,
					lino,
					type
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			if (!program.script) {
				program.script = `script${Date.now()/1000}`;
			}
			const command = program[program.pc];
			let state = program.getValue(command.state);
			if (!state) {
				state = `{"script":"${program.script}"}`;
			}
			let title = program.getValue(command.title);
			const url = program.getValue(command.url);
			switch (command.type) {
			case `push`:
				if (!window.history.state) {
					program.runtimeError(command.lino, `No state history; you need to call 'history set' on the parent`);
					return 0;
				}
				window.history.pushState(state, ``, url);
				break;
			case `set`:
			case `replace`:
				window.history.replaceState(state, title, url);
				break;
			case `pop`:
			case `back`:
				window.history.back();
				break;
			case `forward`:
				window.history.forward();
				break;
			}
			return command.pc + 1;
		}
	},

	HR: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `hr`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	IMAGE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `image`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	IMG: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `img`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	INPUT: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `input`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	LABEL: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `label`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	LEGEND: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `legend`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	LI: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `li`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Location: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			let newWindow = false;
			if (compiler.nextTokenIs(`new`)) {
				newWindow = true;
				compiler.next();
			}
			const location = compiler.getValue();
			compiler.addCommand({
				domain: `browser`,
				keyword: `location`,
				lino,
				location,
				newWindow
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			const location = program.getValue(command.location);
			if (command.newWindow) {
				window.open(location, `_blank`);
			} else {
				window.location = location;
			}
			return command.pc + 1;
		}
	},

	Mail: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`to`)) {
				const to = compiler.getNextValue();
				let subject = ``;
				let body = ``;
				if (compiler.tokenIs(`subject`)) {
					subject = compiler.getNextValue();
					if (compiler.tokenIs(`body`) || compiler.tokenIs(`message`)) {
						compiler.next();
						body = compiler.getValue();
					}
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `mail`,
					lino,
					to,
					subject,
					body
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (command.subject) {
				window.location.href = `mailto:${program.getValue(command.to)}` +
					`?subject=${program.getValue(command.subject)}&body=${encodeURIComponent(program.getValue(command.body))}`;
			} else {
				window.location.href = `mailto:${program.getValue(command.to)}`;
			}
			return command.pc + 1;
		}
	},

	On: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `change`:
				compiler.next();
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.extra !== `dom`) {
						return false;
					}
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					return compiler.completeHandler();
				}
				break;
			case `click`:
				if (compiler.nextTokenIs(`document`)) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action: `clickDocument`
					});
					return compiler.completeHandler();
				}
				if (compiler.isSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.extra !== `dom`) {
						return false;
					}
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					return compiler.completeHandler();
				}
				break;
			case `key`:
			case `leave`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			case `window`:
				if (compiler.nextTokenIs(`resize`)) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action: `windowResize`
					});
					return compiler.completeHandler();
				}
				return false;
			case `browser`:
			case `restore`:
				if (action === `browser` && !compiler.nextTokenIs(`back`)) {
					return false;
				}
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action: `browserBack`
				});
				return compiler.completeHandler();
			case `swipe`:
				if ([`left`, `right`].includes(compiler.nextToken())) {
					const direction = compiler.getToken();
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action: `swipe`,
						direction
					});
					return compiler.completeHandler();
				}
				return false;
			case `pick`:
				if (compiler.nextIsSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.extra !== `dom`) {
						return false;
					}
					compiler.addCommand({
						domain: `browser`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					return compiler.completeHandler();
				}
				return false;
			case `drag`:
			case `drop`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
			}
			compiler.addWarning(`Unrecognised syntax in 'on'`);
			return false;
		},

		run: (program) => {
			let targetRecord;
			const command = program[program.pc];
			switch (command.action) {
			case `change`:
				targetRecord = program.getSymbolRecord(command.symbol);
				targetRecord.program = program.script;
				targetRecord.element.forEach(function (target, index) {
					if (target) {
						target.targetRecord = targetRecord;
						target.targetIndex = index;
						target.targetPc = command.pc + 2;
						target.addEventListener(`change`, (event) => {
							event.stopPropagation();
							if (program.length > 0) {
								const eventTarget = event.target;
								if (typeof eventTarget.targetRecord !== `undefined`) {
									eventTarget.targetRecord.index = eventTarget.targetIndex;
									setTimeout(function () {
										EasyCoder.timestamp = Date.now();
										let p = EasyCoder.scripts[eventTarget.targetRecord.program];
										p.run(eventTarget.targetPc);
									}, 1);
								}
							}
						});
					}
				});
				break;
			case `click`:
				targetRecord = program.getSymbolRecord(command.symbol);
				targetRecord.program = program.script;
				targetRecord.element.forEach(function (target, index) {
					if (target) {
						target.targetRecord = targetRecord;
						target.targetIndex = index;
						target.targetPc = command.pc + 2;
						target.onclick = function (event) {
							event.stopPropagation();
							EasyCoder_Browser.clickData = {
								target,
								clientX: event.clientX,
								clientY: event.clientY
							};
							if (program.length > 0) {
								const eventTarget = event.target;
								if (eventTarget.type != `radio`) {
									eventTarget.blur();
								}
								if (typeof eventTarget.targetRecord !== `undefined`) {
									eventTarget.targetRecord.index = eventTarget.targetIndex;
									setTimeout(function () {
										EasyCoder.timestamp = Date.now();
										let p = EasyCoder.scripts[eventTarget.targetRecord.program];
										p.run(eventTarget.targetPc);
									}, 1);
								}
							}
							return false;
						};
					}
				});
				break;
			case `clickDocument`:
				program.targetPc = command.pc + 2;
				const interceptClickEvent = (e) => {
					EasyCoder.timestamp = Date.now();
					let target = e.target || e.srcElement;
					let href = ``;
					while (target.parentNode) {
						if (target.tagName === `A`) {
							href = target.href;
							program.docPath = href.slice(-(href.length - window.location.href.length));
							break;
						}
						target = target.parentNode;
					}
					while (target.parentNode) {
						if (target.id.indexOf(`ec-`) === 0) {
							let id = target.id.slice(3);
							let pos = id.indexOf(`-`);
							program.varName = id.slice(0, pos);
							id = id.slice(pos + 1);
							pos = id.indexOf(`-`);
							program.varIndex = parseInt(id.slice(0, pos));
							break;
						}
						target = target.parentNode;
					}
					if (href.indexOf(window.location.href) === 0) {
						program.run(program.targetPc);
						e.preventDefault();
					}
				};
				if (document.addEventListener) {
					document.addEventListener(`click`, interceptClickEvent);
				} else if (document.attachEvent) {
					document.attachEvent(`onclick`, interceptClickEvent);
				}
				break;
			case `swipe`:
				let xDown;
				const getTouches = (evt) => {
					return evt.touches || // browser API
							evt.originalEvent.touches; // jQuery
				};
				const handleTouchStart = (evt) => {
					const firstTouch = getTouches(evt)[0];
					xDown = firstTouch.clientX;
				};
				const handleTouchMove = (evt) => {
					evt.stopImmediatePropagation();
					if (!xDown) {
						return;
					}
					const xUp = evt.touches[0].clientX;
					const xDiff = xDown - xUp;
					if (Math.abs(xDiff) > 150) {
						xDown = null;
						if (xDiff > 0 && program.onSwipeLeft) {
							program.run(program.onSwipeLeft);
						} else if (xDiff < 0 && program.onSwipeRight) {
							program.run(program.onSwipeRight);
						}
					}
				};
				switch (command.direction) {
				case `left`:
					program.onSwipeLeft = command.pc + 2;
					break;
				case `right`:
					program.onSwipeRight = command.pc + 2;
					break;
				}
				document.addEventListener(`touchstart`, handleTouchStart, false);
				document.addEventListener(`touchmove`, handleTouchMove, false);
				break;
			case `pick`:
				const pickRecord = program.getSymbolRecord(command.symbol);
				document.pickRecord = pickRecord;
				pickRecord.element.forEach(function (element, index) {
					if (!element) {
						return;
					}
					document.pickIndex = index;
					element.pickIndex = index;
					// Set up the mouse down and up listeners
					element.mouseDownPc = command.pc + 2;
					// Check if touch device
					let isTouchDevice = `ontouchstart` in element;
					if (isTouchDevice) {
						element.addEventListener(`touchstart`, function (e) {
							const element = e.targetTouches[0].target;
							document.pickX = e.touches[0].clientX;
							document.pickY = e.touches[0].clientY;
							element.blur();
							setTimeout(function () {
								document.pickRecord.index = element.pickIndex;
								program.run(element.mouseDownPc);
							}, 1);
						}, false);
						element.addEventListener(`touchmove`, function (e) {
							document.dragX = e.touches[0].clientX;
							document.dragY = e.touches[0].clientY;
							setTimeout(function () {
								program.run(document.mouseMovePc);
							}, 1);
							return false;
						}, false);
						element.addEventListener(`touchend`, function () {
							setTimeout(function () {
								program.run(document.mouseUpPc);
							}, 1);
							return false;
						});
					} else {
						element.onmousedown = function (event) {
							let e = event ? event : window.event;
							e.stopPropagation();
							// IE uses srcElement, others use target
							if (program.length > 0) {
								const element = e.target ? e.target : e.srcElement;
								element.offsetX = e.offsetX;
								element.offsetY = e.offsetY;
								document.pickX = e.clientX;
								document.pickY = e.clientY;
								element.blur();
								setTimeout(function () {
									document.pickRecord.index = element.pickIndex;
									program.run(element.mouseDownPc);
								}, 1);
							}
							document.onmousemove = function (event) {
								let e = event ? event : window.event;
								e.stopPropagation();
								document.dragX = e.clientX;
								document.dragY = e.clientY;
								if (document.onmousemove) {
									setTimeout(function () {
										program.run(document.mouseMovePc);
									}, 1);
								}
								return false;
							};
							window.onmouseup = function () {
								document.onmousemove = null;
								document.onmouseup = null;
								setTimeout(function () {
									if (program && program.run) {
										program.run(document.mouseUpPc);
									}
								}, 1);
								return false;
							};
							return false;
						};
					}
				});
				break;
			case `drag`:
				// Set up the move listener
				document.mouseMovePc = command.pc + 2;
				break;
			case `drop`:
				// Set up the move listener
				document.mouseUpPc = command.pc + 2;
				break;
			case `key`:
				if (typeof document.onKeyListeners === `undefined`) {
					document.onKeyListeners = [];
				}
				if (!document.onKeyListeners.includes(program)) {
					document.onKeyListeners.push(program);
				}
				program.onKeyPc = command.pc + 2;
				document.onkeydown = function (event) {
					for (const program of document.onKeyListeners) {
						program.key = event.key;
						try {
							setTimeout(function () {
								program.run(program.onKeyPc);
							}, 1);
						} catch (err) {
							console.log(`Error: ${err.message}`);
						}
					}
					return true;
				};
				break;
			case `windowResize`:
				program.onWindowResize = command.pc + 2;
				window.addEventListener(`resize`, function() {
					program.run(program.onWindowResize);
				});
				break;
			case `browserBack`:
				program.onBrowserBack = command.pc + 2;
				break;
			case `leave`:
				window.addEventListener(`beforeunload`, function () {
					program.run(command.pc + 2);
				});
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	OPTION: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `option`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	P: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `p`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Play: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				if (targetRecord.keyword === `audioclip`) {
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `play`,
						lino,
						target: targetRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			const url = program.value.evaluate(program, targetRecord.value[targetRecord.index]).content;
			new Audio(url).play();
			return command.pc + 1;
		}
	},

	PRE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `pre`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	PROGRESS: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `progress`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Put: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			// Get the value
			const value = compiler.getNextValue();
			if (compiler.tokenIs(`into`)) {
				if (compiler.nextTokenIs(`storage`)) {
					if (compiler.nextTokenIs(`as`)) {
						const key = compiler.getNextValue();
						compiler.addCommand({
							domain: `browser`,
							keyword: `put`,
							lino,
							value,
							key
						});
						return true;
					}
				}
			}
			return false;
		},

		// runtime

		run: (program) => {
			const command = program[program.pc];
			window.localStorage.setItem(program.getValue(command.key), program.getValue(command.value));
			return command.pc + 1;
		}
	},

	Remove: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`element`)) {
				if (compiler.nextIsSymbol()) {
					const element = compiler.getSymbolRecord();
					if (element.extra != `dom`) {
						compiler.warning(`'${element.name}' is not a DOM element`);
						return false;
					}
					compiler.next();
					compiler.addCommand({
						domain: `browser`,
						keyword: `remove`,
						type: `removeElement`,
						lino,
						element: element.name
					});
					return true;
				}
			}
			if (compiler.tokenIs(`attribute`)) {
				const attribute = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const targetRecord = compiler.getSymbolRecord();
						if (targetRecord.extra !== `dom`) {
							throw new Error(`Inappropriate type '${targetRecord.keyword}'`);
						}
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `remove`,
							type: `removeAttribute`,
							lino,
							attribute,
							target: targetRecord.name
						});
						return true;
					}
				}
			}
			try {
				const key = compiler.getValue();
				if (compiler.tokenIs(`from`)) {
					if (compiler.nextTokenIs(`storage`)) {
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `remove`,
							type: `removeStorage`,
							key
						});
						return true;
					}
				}
			} catch (err) {
				return false;
			}
			return false;
		},

		// runtime

		run: (program) => {
			const command = program[program.pc];
			switch (command.type) {
			case `removeAttribute`:
				const attribute = program.getValue(command.attribute);
				const targetRecord = program.getSymbolRecord(command.target);
				target = targetRecord.element[targetRecord.index];
				target.removeAttribute(attribute);
				break;
			case `removeElement`:
				const elementRecord = program.getSymbolRecord(command.element);
				const element = elementRecord.element[elementRecord.index];
				if (element) {
					element.parentElement.removeChild(element);
				}
				break;
			case `removeStorage`:
				const key = program.getValue(command.key);
				window.localStorage.removeItem(key);
				break;
			}
			return command.pc + 1;
		}
	},

	Request: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextToken() === `fullscreen`) {
				let option = ``;
				if (compiler.nextToken() === `exit`) {
					option = `exit`;
					compiler.next();
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `request`,
					lino,
					option
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (command.option === `exit`) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
			return command.pc + 1;
		}
	},

	SELECT: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `select`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Scroll: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			let name = null;
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				name = symbolRecord.name;
				compiler.next();
			}
			if (compiler.tokenIs(`to`)) {
				const to = compiler.getNextValue();
				compiler.addCommand({
					domain: `browser`,
					keyword: `scroll`,
					lino,
					name,
					to
				});
				return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const to = program.getValue(command.to);
			if (command.name) {
				const symbolRecord = program.getSymbolRecord(command.name);
				symbolRecord.element[symbolRecord.index].scrollTo(0, to);
			} else {
				window.scrollTo(0, to);
			}
			return command.pc + 1;
		}
	},

	SECTION: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `section`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Set: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const targetRecord = compiler.getSymbolRecord();
				const target = targetRecord.name;
				if (targetRecord.extra === `dom`) {
					const token = compiler.nextToken();
					if (token === `from`) {
						if (compiler.nextIsSymbol()) {
							if (targetRecord.keyword === `select`) {
								const sourceRecord = compiler.getSymbolRecord();
								if (sourceRecord.keyword === `variable`) {
									var display = null;
									if (compiler.nextTokenIs(`as`)) {
										display = compiler.getNextValue();
									}
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setSelect`,
										select: target,
										source: sourceRecord.name,
										display
									});
									return true;
								}
								return false;
							}
							const source = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setContentVar`,
								source,
								target
							});
							return true;
						}
					}
				}
			} else {
				let token = compiler.getToken();
				if (token === `the`) {
					token = compiler.nextToken();
				}
				if (token === `title`) {
					if (compiler.nextTokenIs(`to`)) {
						const value = compiler.getNextValue();
						compiler.addCommand({
							domain: `browser`,
							keyword: `set`,
							lino,
							type: `setTitle`,
							value
						});
						return true;
					}
				} else if (token === `content`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const target = compiler.getToken();
							if (compiler.nextTokenIs(`from`)) {
								if (compiler.nextIsSymbol()) {
									const source = compiler.getToken();
									compiler.next();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setContentVar`,
										source,
										target
									});
									return true;
								}
							}
							if (compiler.tokenIs(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `browser`,
									keyword: `set`,
									lino,
									type: `setContent`,
									value,
									target
								});
								return true;
							}
						}
						throw new Error(`'${compiler.getToken()}' is not a symbol`);
					}
				} else if (token === `class`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							if (symbol.extra === `dom`) {
								if (compiler.nextTokenIs(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setClass`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === `id`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							if (symbol.extra === `dom`) {
								if (compiler.nextTokenIs(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setId`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === `text`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							switch (symbol.keyword) {
							case `button`:
							case `input`:
							case `span`:
							case `label`:
							case `legend`:
								if (compiler.nextTokenIs(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setText`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
								break;
							default:
								break;
							}
						}
					}
				} else if (token === `size`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							switch (symbol.keyword) {
							case `input`:
								if (compiler.nextTokenIs(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setSize`,
										symbolName: symbol.name,
										value
									});
									return true;
								}
							}
						}
					}
				} else if (token === `attribute`) {
					compiler.next();
					const attributeName = compiler.getValue();
					if (compiler.tokenIs(`of`)) {
						if (compiler.nextIsSymbol(true)) {
							const symbolRecord = compiler.getSymbolRecord();
							const symbolName = symbolRecord.name;
							compiler.next();
							let attributeValue = {
								type: `boolean`,
								content: true
							};
							if (compiler.tokenIs(`to`)) {
								attributeValue = compiler.getNextValue();
							}
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setAttribute`,
								symbolName,
								attributeName,
								attributeValue
							});
							return true;
						}
					}
				} else if (token === `attributes`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							const symbolName = symbolRecord.name;
							if (symbolRecord.extra !== `dom`) {
								compiler.warning(`'${symbolName}' is not a DOM type`);
								return false;
							}
							if (compiler.nextTokenIs(`to`)) {
								const attributes = compiler.getNextValue();
								if (attributes) {
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setAttributes`,
										symbolName,
										attributes
									});
									return true;
								}
							}
						}
					}
					compiler.warning(`'${compiler.getToken()}' is not a symbol`);
					return false;
				} else if (token === `style`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							const symbolName = symbolRecord.name;
							if (symbolRecord.extra !== `dom`) {
								compiler.warning(`'${symbolName}' is not a DOM type`);
								return false;
							}
							if (compiler.nextTokenIs(`to`)) {
								const styleValue = compiler.getNextValue();
								if (styleValue) {
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setStyles`,
										symbolName,
										styleValue
									});
									return true;
								}
							}
						}
						compiler.warning(`'${compiler.getToken()}' is not a symbol`);
						return false;
					}
					const styleName = compiler.getValue();
					let type = `setStyle`;
					let symbolName = ``;
					token = compiler.getToken();
					if (token === `of`) {
						if (compiler.nextToken() === `body`) {
							type = `setBodyStyle`;
						} else if (compiler.isSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							symbolName = symbolRecord.name;
							if (symbolRecord.extra !== `dom`) {
								throw Error(`'${symbolName}' is not a DOM type`);
							}
						} else {
							throw Error(`'${compiler.getToken()}' is not a known symbol`);
						}
						if (compiler.nextTokenIs(`to`)) {
							const styleValue = compiler.getNextValue();
							if (styleValue) {
								compiler.addCommand({
									domain: `browser`,
									keyword: `set`,
									lino,
									type,
									symbolName,
									styleName,
									styleValue
								});
								return true;
							}
						}
					}
					else if (token === `to`) {
						const styleValue = compiler.getNextValue();
						if (styleValue) {
							compiler.addCommand({
								domain: `browser`,
								keyword: `set`,
								lino,
								type: `setHeadStyle`,
								styleName,
								styleValue
							});
							return true;
						}
					}
				} else if (token === `default`) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							if (symbolRecord.keyword === `select`) {
								if (compiler.nextTokenIs(`to`)) {
									const value = compiler.getNextValue();
									compiler.addCommand({
										domain: `browser`,
										keyword: `set`,
										lino,
										type: `setDefault`,
										name: symbolRecord.name,
										value
									});
									return true;
								}
							}
						}
					}
				}
			}
			compiler.addWarning(`Unrecognised syntax in 'set'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let symbol;
			let value;
			let target;
			let targetId;
			let targetRecord;
			let cssId;
			let selectRecord;
			switch (command.type) {
			case `setContentVar`:
				const sourceVar = program.getSymbolRecord(command.source);
				targetRecord = program.getSymbolRecord(command.target);
				const source = document.getElementById(sourceVar.value[sourceVar.index].content);
				target = targetRecord.element[targetRecord.index];
				if (!target) {
					targetId = program.getValue(targetRecord.value[targetRecord.index]);
					target = document.getElementById(targetId);
				}
				target.innerHTML = source.innerHTML;
				break;
			case `setContent`:
				value = program.getValue(command.value);
				targetRecord = program.getSymbolRecord(command.target);
				target = targetRecord.element[targetRecord.index];
				if (!target) {
					cssId = targetRecord.value[targetRecord.index].content;
					if (!cssId) {
						program.runtimeError(command.lino,
							`Variable '${targetRecord.name}' has not been attached to a DOM element.`);
						return 0;
					}
					target = document.getElementById(cssId);
				}
				targetRecord.element[targetRecord.index] = target;
				switch (targetRecord.keyword) {
				case `text`:
				case `textarea`:
				case `input`:
					target.value = value;
					break;
				default:
					target.innerHTML = value;
					break;
				}
				break;
			case `setSelect`:
				// The source is assumed to be an array
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
				selectRecord = program.getSymbolRecord(command.select);
				const select = selectRecord.element[selectRecord.index];
				select.options.length = 0;
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
					select.appendChild(opt);
				});
				if (display) {
					select.selectedIndex = itemArray.indexOf(display);
				} else {
					select.selectedIndex = -1;
				}
				break;
			case `setClass`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				program.getValue(command.value).split(` `).forEach(function(item) {
					target.classList.remove(item);
					target.classList.add(item);
				});
				break;
			case `setId`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				target.id = program.getValue(command.value);
				break;
			case `setText`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				value = program.getValue(command.value);
				switch (symbol.keyword) {
				case `button`:
				case `span`:
				case `label`:
				case `legend`:
					target.innerHTML = value;
					break;
				case `input`:
					target.value = value;
					break;
				default:
					break;
				}
				break;
			case `setSize`:
				symbol = program.getSymbolRecord(command.symbolName);
				if (symbol.keyword === `input`) {
					target = symbol.element[symbol.index];
					if (!target) {
						targetId = program.getValue(symbol.value[symbol.index]);
						target = document.getElementById(targetId);
					}
					target.size = program.getValue(command.value);
				} else {
					program.runtimeError(command.lino, `Inappropriate variable type '${symbol.name}'`);
				}
				break;
			case `setAttribute`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				const attributeName = program.getValue(command.attributeName);
				if (command.attributeValue.type === `boolean`) {
					target.setAttribute(attributeName, command.attributeValue.content);
				} else {
					target.setAttribute(attributeName, program.getValue(command.attributeValue));
				}
				break;
			case `setAttributes`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					targetId = program.getValue(symbol.value[symbol.index]);
					target = document.getElementById(targetId);
				}
				for (let n = target.attributes.length - 1; n >= 0; n--) {
					target.removeAttribute(target.attributes[n].name);
				}
				let attributes = program.getValue(command.attributes);
				let list = attributes.split(` `);
				for (let n = 0; n < list.length; n++) {
					let attribute = list[n];
					let p = attribute.indexOf(`=`);
					if (p > 0) {
						target.setAttribute(attribute.substr(0, p), attribute.substr(p + 1));
					}
					else {
						target.setAttribute(attribute, attribute);
					}
				}
				break;
			case `setStyle`:
			case `setStyles`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = symbol.element[symbol.index];
				if (!target) {
					const symbolElement = symbol.value[symbol.index];
					if (!symbolElement.type) {
						program.runtimeError(command.lino,
							`Variable '${symbol.name}' is not attached to a DOM element.`);
						return 0;
					}
					targetId = program.getValue(symbolElement);
					target = document.getElementById(targetId);
				}
				const styleValue = program.getValue(command.styleValue);
				if (!symbol.element[symbol.index]) {
					program.runtimeError(command.lino, `Variable '${symbol.name}' has no DOM element.`);
					return 0;
				}
				switch (command.type) {
				case `setStyle`:
					target.style[command.styleName.content] = styleValue;
					break;
				case `setStyles`:
					target.style.cssText = styleValue;
					break;
				}
				break;
			case `setHeadStyle`:
				const headStyleName = program.getValue(command.styleName);
				const headStyleValue = program.getValue(command.styleValue);
				var style = document.createElement(`style`);
				style.innerHTML = `${headStyleName} ${headStyleValue}`;
				for (let i = 0; i < document.head.childNodes.length; i++) {
					let node = document.head.childNodes[i];
					if (node.tagName === `STYLE`) {
						let data = node.innerHTML;
						if (data.indexOf(`${headStyleName} `) === 0) {
							document.head.removeChild(node);
							break;
						}
					}
				}	
				document.head.appendChild(style);
				break;
			case `setBodyStyle`:
				const bodyStyleValue = program.getValue(command.styleValue);
				switch (command.styleName.content) {
				case `background`:
					document.body.style.background = bodyStyleValue;
					break;
				default:
					program.runtimeError(command.lino,
						`Unsupported body attribute '${command.styleName.content}'`);
					return 0;
				}
				break;
			case `setTitle`:
				document.title = program.getValue(command.value);
				break;
			case `setDefault`:
				selectRecord = program.getSymbolRecord(command.name);
				value = program.getValue(command.value);
				const element = selectRecord.element[selectRecord.index];
				for (let n = 0; n < element.options.length; n++) {
					if (element.options[n].value === value) {
						element.selectedIndex = n;
						break;
					}
				}
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	SPAN: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `span`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TABLE: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `table`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TR: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `tr`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TD: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `td`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	TEXTAREA: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `textarea`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Trace: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const variables = [];
			if (compiler.nextIsSymbol()) {
				while (compiler.isSymbol()) {
					variables.push(compiler.getToken());
					compiler.next();
				}
				let alignment = `horizontal`;
				if (compiler.tokenIs(`horizontal`) || compiler.tokenIs(`vertical`)) {
					alignment = compiler.getToken();
					compiler.next();
				}
				compiler.addCommand({
					domain: `browser`,
					keyword: `trace`,
					variant: `setup`,
					lino,
					variables,
					alignment
				});
				return true;
			}
			compiler.addCommand({
				domain: `browser`,
				keyword: `trace`,
				variant: `run`,
				lino
			});
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			switch (command.variant) {
			case `setup`:
				console.log(`Set up tracer`);
				program.tracer = {
					variables: command.variables,
					alignment: command.alignment
				};
				break;
			case `run`:
				console.log(`Run tracer`);
				if (!program.tracer) {
					program.tracer = {
						variables: [],
						alignment: `horizontal`
					};
				}
				if (!program.tracing) {
					const tracer = document.getElementById(`easycoder-tracer`);
					if (tracer) {
						tracer.innerHTML =
								`<div><input id="easycoder-run-button" type="button" value="Run" />` +
								`<input id="easycoder-step-button" type="button" value="Step" />` +
								`<div id="easycoder-tracer-content" style="border:1px solid black;padding:4px";width:100%>` +
								`</div>`;
						tracer.style.display = `none`;
					}
					program.tracing = true;
				}
				program.stop = false;
				break;
			}
			return program.pc + 1;
		}
	},

	UL: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `ul`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Upload: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const file = compiler.getToken();
				if (compiler.nextTokenIs(`to`)) {
					const path = compiler.getNextValue();
					if (compiler.tokenIs(`with`)) {
						if (compiler.nextIsSymbol()) {
							const progress = compiler.getToken();
							if (compiler.nextTokenIs(`and`)) {
								if (compiler.nextIsSymbol()) {
									const status = compiler.getToken();
									compiler.next();
									compiler.addCommand({
										domain: `browser`,
										keyword: `upload`,
										lino,
										file,
										path,
										progress,
										status
									});
									return true;
								}
							}
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const fileSpec = program.getSymbolRecord(command.file);
			const path = program.getValue(command.path);
			const progressSpec = program.getSymbolRecord(command.progress);
			const statusSpec = program.getSymbolRecord(command.status);

			const file = fileSpec.element[fileSpec.index];
			const progress = progressSpec.element[progressSpec.index];
			const status = statusSpec.element[statusSpec.index];

			const setProgress = (value) => {
				if (progress) {
					progress.value = value;
				}
			};
			const setStatus = (value) => {
				if (status) {
					status.innerHTML = value;
				}
			};

			const source = file.files[0];
			if (source) {
				const formData = new FormData();
				formData.append(`source`, source);
				formData.append(`path`, path);
				const ajax = new XMLHttpRequest();
				ajax.upload.addEventListener(`progress`, function (event) {
					const percent = Math.round((event.loaded / event.total) * 100);
					setProgress(percent);
					setStatus(`${Math.round(percent)}%...`);
				}, false);
				ajax.addEventListener(`load`, function (event) {
					const response = event.target.responseText;
					setProgress(0);
					setStatus(``);
					if (response) {
						console.log(response);
					}
				}, false);
				ajax.addEventListener(`error`, function () {
					setStatus(`Upload failed`);
					console.log(`Upload failed`);
				}, false);
				ajax.addEventListener(`abort`, function () {
					setStatus(`Upload aborted`);
					console.log(`Upload aborted`);
				}, false);
				ajax.onreadystatechange = function () {
					if (this.readyState === 4) {
						const command = program.ajaxCommand;
						const status = this.status;
						switch (status) {
						case 200:
							program.run(command.pc + 1);
							break;
						case 0:
							break;
						default:
							try {
								program.runtimeError(command.lino, `Error ${status}`);
							} catch (err) {
								program.reportError(err, program);
							}
							break;
						}
					}
				};
				ajax.onerror = function () {
					if (command.onError) {
						program.errorMessage = this.responseText;
						program.run(command.onError);
					} else {
						const error = this.responseText;
						program.runtimeError(command.lino, error);
					}
				};
				program.ajaxCommand = command;
				const postpath = path.startsWith(`http`)
					? path
					: `${window.location.origin}/${EasyCoder_Rest.restPath}/${path}`;
				ajax.open(`POST`, postpath);
				ajax.send(formData);
			}
			return 0;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `a`:
			return EasyCoder_Browser.A;
		case `alert`:
			return EasyCoder_Browser.Alert;
		case `attach`:
			return EasyCoder_Browser.Attach;
		case `audioclip`:
			return EasyCoder_Browser.Audioclip;
		case `blockquote`:
			return EasyCoder_Browser.BLOCKQUOTE;
		case `button`:
			return EasyCoder_Browser.BUTTON;
		case `canvas`:
			return EasyCoder_Browser.CANVAS;
		case `clear`:
			return EasyCoder_Browser.Clear;
		case `click`:
			return EasyCoder_Browser.Click;
		case `convert`:
			return EasyCoder_Browser.Convert;
		case `copy`:
			return EasyCoder_Browser.Copy;
		case `create`:
			return EasyCoder_Browser.Create;
		case `disable`:
			return EasyCoder_Browser.Disable;
		case `div`:
			return EasyCoder_Browser.DIV;
		case `enable`:
			return EasyCoder_Browser.Enable;
		case `fieldset`:
			return EasyCoder_Browser.FIELDSET;
		case `file`:
			return EasyCoder_Browser.FILE;
		case `focus`:
			return EasyCoder_Browser.Focus;
		case `form`:
			return EasyCoder_Browser.FORM;
		case `fullscreen`:
			return EasyCoder_Browser.FullScreen;
		case `get`:
			return EasyCoder_Browser.Get;
		case `h1`:
			return EasyCoder_Browser.H1;
		case `h2`:
			return EasyCoder_Browser.H2;
		case `h3`:
			return EasyCoder_Browser.H3;
		case `h4`:
			return EasyCoder_Browser.H4;
		case `h5`:
			return EasyCoder_Browser.H5;
		case `h6`:
			return EasyCoder_Browser.H6;
		case `highlight`:
			return EasyCoder_Browser.Highlight;
		case `history`:
			return EasyCoder_Browser.History;
		case `hr`:
			return EasyCoder_Browser.HR;
		case `image`:
			return EasyCoder_Browser.IMAGE;
		case `img`:
			return EasyCoder_Browser.IMG;
		case `input`:
			return EasyCoder_Browser.INPUT;
		case `label`:
			return EasyCoder_Browser.LABEL;
		case `legend`:
			return EasyCoder_Browser.LEGEND;
		case `li`:
			return EasyCoder_Browser.LI;
		case `location`:
			return EasyCoder_Browser.Location;
		case `mail`:
			return EasyCoder_Browser.Mail;
		case `on`:
			return EasyCoder_Browser.On;
		case `option`:
			return EasyCoder_Browser.OPTION;
		case `p`:
			return EasyCoder_Browser.P;
		case `play`:
			return EasyCoder_Browser.Play;
		case `pre`:
			return EasyCoder_Browser.PRE;
		case `progress`:
			return EasyCoder_Browser.PROGRESS;
		case `put`:
			return EasyCoder_Browser.Put;
		case `remove`:
			return EasyCoder_Browser.Remove;
		case `request`:
			return EasyCoder_Browser.Request;
		case `select`:
			return EasyCoder_Browser.SELECT;
		case `scroll`:
			return EasyCoder_Browser.Scroll;
		case `section`:
			return EasyCoder_Browser.SECTION;
		case `set`:
			return EasyCoder_Browser.Set;
		case `span`:
			return EasyCoder_Browser.SPAN;
		case `table`:
			return EasyCoder_Browser.TABLE;
		case `tr`:
			return EasyCoder_Browser.TR;
		case `td`:
			return EasyCoder_Browser.TD;
		case `textarea`:
			return EasyCoder_Browser.TEXTAREA;
		case `trace`:
			return EasyCoder_Browser.Trace;
		case `ul`:
			return EasyCoder_Browser.UL;
		case `upload`:
			return EasyCoder_Browser.Upload;
		default:
			return null;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_Browser.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'browser' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (compiler.nextTokenIs(`exists`)) {
					if (symbolRecord.extra === `dom`) {
						compiler.next();
						return {
							domain: `browser`,
							type: `exists`,
							value: symbolRecord.name
						};
					}
					return null;
				}
				switch (symbolRecord.keyword) {
				case `file`:
				case `input`:
				case `select`:
				case `textarea`:
					return {
						domain: `browser`,
						type: symbolRecord.keyword,
						value: symbolRecord.name
					};
				}
				return null;
			}

			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			let offset = false;
			if (compiler.tokenIs(`offset`)) {
				offset = true;
				compiler.next();
			}

			let type = compiler.getToken();
			let text;
			let attribute;
			switch (type) {
			case `mobile`:
			case `portrait`:
			case `landscape`:
			case `br`:
			case `location`:
			case `key`:
			case `hostname`:
				compiler.next();
				return {
					domain: `browser`,
					type
				};
			case `browser`:
				if (compiler.nextTokenIs(`name`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `browserName`
					};
				}
				break;
			case `content`:
			case `text`:
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbol = compiler.getSymbolRecord();
						compiler.next();
						return {
							domain: `browser`,
							type: `contentOf`,
							symbol: symbol.name
						};
					}
					throw new Error(`'${compiler.getToken()}' is not a symbol`);
				}
				break;
			case `selected`:
				let arg = compiler.nextToken();
				if ([`index`, `item`].includes(arg)) {
					if ([`in`, `of`].includes(compiler.nextToken())) {
						if (compiler.nextIsSymbol()) {
							const symbol = compiler.getSymbolRecord();
							if ([`ul`, `ol`, `select`].includes(symbol.keyword)) {
								compiler.next();
								return {
									domain: `browser`,
									type: `selected`,
									symbol: symbol.name,
									arg
								};
							}
						}
					}
				}
				break;
			case `color`:
				compiler.next();
				const value = compiler.getValue();
				return {
					domain: `browser`,
					type,
					value
				};
			case `attribute`:
				attribute = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					compiler.next();
					if (compiler.isSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.extra === `dom`) {
							compiler.next();
							return {
								domain: `browser`,
								type: `attributeOf`,
								attribute,
								symbol: symbolRecord.name
							};
						}
					}
				}
				break;
			case `style`:
				const style = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.extra === `dom`) {
							compiler.next();
							return {
								domain: `browser`,
								type,
								style,
								target: symbolRecord.name
							};
						}
					}
				}
				break;
			case `confirm`:
				text = compiler.getNextValue();
				return {
					domain: `browser`,
					type: `confirm`,
					text
				};
			case `prompt`:
				text = compiler.getNextValue();
				let pre = null;
				if (compiler.tokenIs(`with`)) {
					pre = compiler.getNextValue();
				}
				return {
					domain: `browser`,
					type: `prompt`,
					text,
					pre
				};
			case `screen`:
				attribute = compiler.nextToken();
				if ([`width`, `height`].includes(attribute)) {
					compiler.next();
					return {
						domain: `browser`,
						type,
						attribute
					};
				}
				break;
			case `top`:
			case `bottom`:
			case `left`:
			case `right`:
			case `width`:
			case `height`:
				return EasyCoder_Browser.value.getCoord(compiler, type, offset);
			case `scroll`:
				if (compiler.nextTokenIs(`position`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `scrollPosition`
					};
				}
				break;
			case `document`:
				if (compiler.nextTokenIs(`path`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `docPath`
					};
				}
				break;
			case `storage`:
				if (compiler.nextTokenIs(`keys`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `storageKeys`
					};
				}
				break;
			case `parent`:
				switch (compiler.nextToken()) {
				case `name`:
					compiler.next();
					return {
						domain: `browser`,
						type: `varName`
					};
				case `index`:
					compiler.next();
					return {
						domain: `browser`,
						type: `varIndex`
					};
				}
				break;
			case `history`:
				if (compiler.nextTokenIs(`state`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `historyState`
					};
				}
				break;
			case `pick`:
			case `drag`:
				if (compiler.nextTokenIs(`position`)) {
					compiler.next();
					return {
						domain: `browser`,
						type: `${type}Position`
					};
				}
				break;
			case `click`:
				const which = compiler.nextToken();
				if ([`left`, `top`].includes(which)) {
					compiler.next();
					return {
						domain:`browser`,
						type: `click`,
						which
					};
				}
				break;
			}
			return null;
		},

		getCoord: (compiler, type, offset) => {
			if (compiler.nextTokenIs(`of`)) {
				if (compiler.nextTokenIs(`the`)) {
					compiler.nextToken();
				}
				const symbol = compiler.getToken();
				if ([`window`, `viewport`].includes(symbol)) {
					compiler.next();
					return {
						domain: `browser`,
						type,
						symbol,
						offset
					};
				}
				let symbolRecord = null;
				if (compiler.isSymbol()) {
					symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.extra === `dom`) {
						compiler.next();
						return {
							domain: `browser`,
							type,
							symbol: symbolRecord.name,
							offset
						};
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			let symbolRecord;
			let element;
			let target;
			let content;
			switch (value.type) {
			case `file`:
			case `input`:
			case `select`:
			case `textarea`:
				symbolRecord = program.getSymbolRecord(value.value);
				target = symbolRecord.element[symbolRecord.index];
				if (!target) {
					program.runtimeError(program[program.pc].lino,
						`Variable '${symbolRecord.name}' is not attached to a DOM element.`);
					return null;
				}
				return {
					type: `constant`,
					numeric: false,
					content: target.value
				};
			case `exists`:
				symbolRecord = program.getSymbolRecord(value.value);
				return {
					domain: `browser`,
					type: `boolean`,
					content: typeof symbolRecord.element[symbolRecord.index] !== `undefined`
				};
			case `mobile`:
				const isMobile = {
					Android: function() {
						return navigator.userAgent.match(/Android/i);
					},
					BlackBerry: function() {
						return navigator.userAgent.match(/BlackBerry/i);
					},
					iOS: function() {
						return navigator.userAgent.match(/iPhone|iPad|iPod/i);
					},
					Opera: function() {
						return navigator.userAgent.match(/Opera Mini/i);
					},
					Windows: function() {
						return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
					},
					any: function() {
						return (isMobile.Android() || isMobile.BlackBerry()
						|| isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
					}
				};
				return {
					domain: `browser`,
					type: `boolean`,
					content: isMobile.any()
					// content: (typeof window.orientation !== `undefined`) || (navigator.userAgent.indexOf(`IEMobile`) !== -1)
					//content: (/Android|iPhone/i.test(navigator.userAgent))
				};
			case `browserName`:
				let userAgent = navigator.userAgent;
				let browserName;
			
				if (userAgent.match(/chrome|chromium|crios/i)) {
					browserName = "Chrome";
				} else if (userAgent.match(/firefox|fxios/i)) {
					browserName = "Firefox";
				} else if (userAgent.match(/safari/i)) {
					browserName = "Safari";
				} else if (userAgent.match(/opr\//i)) {
					browserName = "Opera";
				} else if (userAgent.match(/edg/i)) {
					browserName = "Edge";
				} else if (userAgent.match(/android/i)) {
					browserName = "Android";
				} else if (userAgent.match(/iphone/i)) {
					browserName = "iPhone";
				} else {
					browserName = "Unknown";
				}
				return {
					domain: `browser`,
					type: `constant`,
					numeric: false,
					content: browserName
				};  
			case `portrait`:
				return {
					domain: `browser`,
					type: `boolean`,
					content: document.documentElement.clientWidth < document.documentElement.clientHeight
				};
			case `landscape`:
				return {
					domain: `browser`,
					type: `boolean`,
					content: document.documentElement.clientWidth >= document.documentElement.clientHeight
				};
			case `br`:
				return {
					type: `constant`,
					numeric: false,
					content: decodeURIComponent(`%3Cbr%20%2F%3E`)
				};
			case `attributeOf`:
				symbolRecord = program.getSymbolRecord(value.symbol);
				const attribute = program.getValue(value.attribute);
				target = symbolRecord.element[symbolRecord.index];
				if (attribute.indexOf(`data-`) === 0) {
					return program.getSimpleValue(target.dataset[attribute.substr(5)]);
				}
				return program.getSimpleValue(target[attribute]);
			case `style`:
				symbolRecord = program.getSymbolRecord(value.target);
				const style = program.getValue(value.style);
				target = symbolRecord.element[symbolRecord.index];
				return program.getSimpleValue(target.style[style]);
			case `confirm`:
				return {
					type: `boolean`,
					content: window.confirm(program.getValue(value.text))
				};
			case `prompt`:
				const text = program.getValue(value.text);
				const pre = program.getValue(value.pre);
				return {
					type: `constant`,
					numeric: false,
					content: pre ? window.prompt(text, pre) : window.prompt(text)
				};
			case `contentOf`:
				symbolRecord = program.getSymbolRecord(value.symbol);
				target = symbolRecord.element[symbolRecord.index];
				if (target === null || typeof target === `undefined`) {
					program.runtimeError(program[program.pc].lino,
						`Variable '${symbolRecord.name}' is not attached to a DOM element.`);
					return null;
				}
				switch (symbolRecord.keyword) {
				case `input`:
				case `textarea`:
					content = target.value;
					break;
				case `pre`:
					content = target.innerHTML;
					break;
				default:
					content = target.innerHTML.split(`\n`).join(``);
					break;
				}
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `selected`:
				symbolRecord = program.getSymbolRecord(value.symbol);
				target = symbolRecord.element[symbolRecord.index];
				let selectedIndex = target.selectedIndex;
				let selectedText = selectedIndex  >= 0 ? target.options[selectedIndex].text : ``;
				content = (value.arg === `index`) ? selectedIndex : selectedText;
				return {
					type: `constant`,
					numeric: false,
					content
				};
			case `top`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenY
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				element = symbolRecord.element[symbolRecord.index];
				content = Math.round(value.offset ? element.offsetTop : element.getBoundingClientRect().top);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `bottom`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenY + window.innerHeight
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().bottom);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `left`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenLeft
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				element = symbolRecord.element[symbolRecord.index];
				content = Math.round(value.offset ? element.offsetLeft : element.getBoundingClientRect().left);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `right`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.screenX + window.innerWidth
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().right);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `width`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.innerWidth
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().width);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `height`:
				if (value.symbol == `window`) {
					return {
						type: `constant`,
						numeric: true,
						content: window.innerHeight
					};
				}
				symbolRecord = program.getSymbolRecord(value.symbol);
				content = Math.round(symbolRecord.element[symbolRecord.index].getBoundingClientRect().height);
				return {
					type: `constant`,
					numeric: true,
					content
				};
			case `color`:
				const styleValue = program.value.evaluate(program, value.value).content;
				const hex = styleValue.toString(16).padStart(6, `0`);
				return {
					type: `constant`,
					numeric: false,
					content: `#${hex}`
				};
			case `docPath`:
				return {
					type: `constant`,
					numeric: false,
					content: program.docPath
				};
			case `storageKeys`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(Object.keys(localStorage))
				};
			case `location`:
				return {
					type: `constant`,
					numeric: false,
					content: window.location.href
				};
			case `historyState`:
				return {
					type: `constant`,
					numeric: false,
					content: window.history.state
				};
			case `scrollPosition`:
				return {
					type: `constant`,
					numeric: true,
					content: scrollPosition
				};
			case `varName`:
				return {
					type: `constant`,
					numeric: false,
					content: program.varName
				};
			case `varIndex`:
				return {
					type: `constant`,
					numeric: true,
					content: program.varIndex
				};
			case `key`:
				return {
					type: `constant`,
					numeric: false,
					content: program.key
				};
			case `hostname`:
				return {
					type: `constant`,
					numeric: false,
					content: location.hostname
				};
			case `screen`:
				return {
					type: `constant`,
					numeric: true,
					content: screen[value.attribute]
				};
			case `pickPosition`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify({
						"x": document.pickX,
						"y": document.pickY
					})
				};
			case `dragPosition`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify({
						"x": document.dragX,
						"y": document.dragY
					})
				};
			case `click`:
				const clickData = EasyCoder_Browser.clickData;
				if (typeof clickData === `undefined`) {
					return 0;
				}
				const boundingRect = clickData.target.getBoundingClientRect();
				return {
					type: `constant`,
					numeric: true,
					content: value.which === `left`
						? clickData.clientX - Math.round(boundingRect.left)
						: clickData.clientY - Math.round(boundingRect.top)
				};
			}
		}
	},

	condition: {

		compile: (compiler) => {
			if (compiler.tokenIs(`confirm`)) {
				const value = compiler.getNextValue();
				return {
					domain: `browser`,
					type: `confirm`,
					value
				};
			} else if (compiler.tokenIs(`element`)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.extra === `dom`) {
						const token = compiler.nextToken();
						if (token === `has`) {
							if (compiler.nextTokenIs(`the`)) {
								compiler.next();
							}
							if (compiler.tokenIs(`focus`)) {
								compiler.next();
								return {
									domain: `browser`,
									type: `focus`,
									element: symbolRecord.name
								};
							}
						} else if (token === `contains`) {
							const position = compiler.getNextValue();
							return {
								domain: `browser`,
								type: `contains`,
								element: symbolRecord.name,
								position
							};
						}
					}
				}
			}
			return null;
		},

		test: (program, condition) => {
			switch (condition.type) {
			case `confirm`:
				return confirm(program.getValue(condition.value));
			case `focus`:
				const focusRecord = program.getSymbolRecord(condition.element);
				return focusRecord.element[focusRecord.index] === document.activeElement;
			case `contains`:
				const containsRecord = program.getSymbolRecord(condition.element);
				const element = containsRecord.element[containsRecord.index];
				const bounds = element.getBoundingClientRect();
				const left = Math.round(bounds.left);
				const right = Math.round(bounds.right);
				const top = Math.round(bounds.top);
				const bottom = Math.round(bounds.bottom);
				const position = JSON.parse(program.getValue(condition.position));
				const x = position.x;
				const y = position.y;
				if (x >= left && x <= right && y >= top && y <= bottom) {
					return true;
				}
				return false;
			}
		}
	},

	setStyles: (id, styleString) => {
		const element = document.getElementById(id);
		const styles = styleString.split(`;`);
		for (const item of styles) {
			const style = item.split(`:`);
			element.setAttribute(style[0], style[1]);
		}
	}
};

let scrollPosition = 0;

window.addEventListener(`scroll`, function () {
	scrollPosition = this.scrollY;
});

window.onpopstate = function (event) {
	window.EasyCoder.timestamp = Date.now();
	const state = JSON.parse(event.state);
	if (state && state.script) {
		const program = window.EasyCoder.scripts[state.script];
		if (program) {
			if (program.onBrowserBack) {
				program.run(program.onBrowserBack);
			}
		} else {
			console.log(`No script property in window state object`);
		}
	}
};
const EasyCoder_Json = {

	name: `EasyCoder_Json`,

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
					content.domain = content.domain.slice(0, -1);
				}
				n = content.domain.indexOf(`/`);
				if (n > 0) {
					content.path = content.domain.substr(n + 1);
					content.domain = content.domain.substr(0, n);
				}
				else {
					content.path = ``;
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
				record.push(program.isJsonString(content) ? JSON.parse(content) :content);
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
			return null;
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
				if ([`size`, `count`].includes(type)) {
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
				} else if (type === `keys`) {
					let sorted = true;
					if (compiler.nextTokenIs(`unsorted`)) {
						sorted = false;
						compiler.next();
					}
					if (compiler.tokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const target = compiler.getSymbolRecord();
							compiler.next();
							if (target.isVHolder) {
								return {
									domain: `json`,
									type,
									name: target.name,
									sorted
								};
							}
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
					content: array ? array.length : 0
				};
			case `keys`:
				symbolRecord = program.getSymbolRecord(value.name);
				data = program.getValue(symbolRecord.value[symbolRecord.index]);
				content = data ? JSON.stringify(Object.keys(JSON.parse(data)).sort()) : `[]`;
				if (data) {
					content = Object.keys(JSON.parse(data));
					if (value.sorted) {
						content= content.sort();
					}
					content = JSON.stringify(content);
				} else {
					content = `[]`;
				}
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
const EasyCoder_Rest = {

	name: `EasyCoder_Rest`,

	Rest: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = compiler.nextToken();
			switch (request) {
			case `path`:
				const path = compiler.getNextValue();
				compiler.addCommand({
					domain: `rest`,
					keyword: `rest`,
					lino,
					request: `path`,
					path
				});
				return true;
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
				const args = {};
				while (compiler.tokenIs(`with`)) {
					const argName = compiler.nextToken();
					if (compiler.nextTokenIs(`as`)) {
						const argValue = compiler.getNextValue();
						args[argName] = argValue;
					} else {
						break;
					}
				}
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
					args,
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
			if (command.request == `path`) {
				EasyCoder_Rest.restPath = program.getValue(command.path);
				return command.pc + 1;
			}

			const url = program.getValue(command.url);
			// Default is the path for a WordPress installation
			if (!EasyCoder_Rest.restPath) {
				EasyCoder_Rest.restPath = `/wp-content/plugins/easycoder/rest.php`;
			}
			let path = url;
			if (!url.startsWith(`http`)) {
				if (url[0] == `/`) {
					path = url.substr(1);
				} else {
					path = `${EasyCoder_Rest.restPath}/${url}`;
				}
			}

			const request = EasyCoder_Rest.Rest.createCORSRequest(command.request, path);
			if (!request) {
				program.runtimeError(command.lino, `CORS not supported`);
				return;
			}
			request.script = program.script;
			request.program = program;
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
					request.program.run(command.onError);
				} else {
					const error = this.responseText;
					request.program.runtimeError(command.lino, error);
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
				for (key of Object.keys(command.args)) {
					const argval = request.program.getValue(command.args[key]);
					request.setRequestHeader (key, argval);
				}
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
// eslint-disable-next-line no-unused-vars
const EasyCoder_Compare = (program, value1, value2) => {

	const val1 = program.value.evaluate(program, value1);
	const val2 = program.value.evaluate(program, value2);
	var v1 = val1.content;
	var v2 = val2.content;
	if (v1 && val1.numeric) {
		if (!val2.numeric) {
			v2 = (v2 === `` || v2 === `-` || typeof v2 === `undefined`) ? 0 : parseInt(v2);
		}
	} else {
		if (v2 && val2.numeric) {
			v2 = v2.toString();
		}
		if (typeof v1 === `undefined`) {
			v1 = ``;
		}
		if (typeof v2 === `undefined`) {
			v2 = ``;
		}
	}
	if (v1 > v2) {
		return 1;
	}
	if (v1 < v2) {
		return -1;
	}
	return 0;
};
// eslint-disable-next-line no-unused-vars
const EasyCoder_Condition = {

	name: `EasyCoder_Condition`,

	compile: (compiler) => {
		// See if any of the domains can handle it
		const mark = compiler.getIndex();
		for (const domainName of Object.keys(compiler.domain)) {
			// console.log(`Try domain '${domainName}' for condition`);
			const domain = compiler.domain[domainName];
			const code = domain.condition.compile(compiler);
			if (code) {
				return code;
			}
			compiler.rewindto(mark);
		}
	},

	// runtime

	test: (program, condition) => {
		const handler = program.domain[condition.domain];
		return handler.condition.test(program, condition);
	}
};
const EasyCoder_Value = {

	name: `EasyCoder_Value`,

	getItem: (compiler) => {
		const token = compiler.getToken();
		if (!token) {
			return null;
		}

		// Check for a boolean
		if (token === `true`) {
			compiler.next();
			return {
				type: `boolean`,
				content: true
			};
		}

		if (token === `false`) {
			compiler.next();
			return {
				type: `boolean`,
				content: false
			};
		}

		// Check for a string constant
		if (token.charAt(0) === `\``) {
			compiler.next();
			const value = {
				type: `constant`,
				numeric: false,
				content: token.substring(1, token.length - 1)
			};
			return value;
		}

		// Check for a numeric constant
		if (token.charAt(0).match(/[0-9-]/)) {
			const val = eval(token);
			if (Number.isInteger(val)) {
				compiler.next();
				const value = {
					type: `constant`,
					numeric: true,
					content: val
				};
				return value;
			} else {
				throw new Error(`'${token}' is not an integer`);
			}
		}

		// See if any of the domains can handle it
		const mark = compiler.getIndex();
		for (const name of Object.keys(compiler.domain)) {
			const handler = compiler.domain[name];
			const code = handler.value.compile(compiler);
			if (code) {
				return code;
			}
			compiler.rewindTo(mark);
		}
		return null;
	},

	compile: compiler => {
		const token = compiler.getToken();
		let item = EasyCoder_Value.getItem(compiler);
		if (!item) {
			throw new Error(`Undefined value: '${token}'`);
		}

		if (compiler.getToken() === `cat`) {
			const value = {
				type: `cat`,
				numeric: false,
				parts: [item]
			};
			while (compiler.tokenIs(`cat`)) {
				compiler.next();
                item = EasyCoder_Value.getItem(compiler);
                if (!item) {
                    throw new Error(`Undefined value: '${token}'`);
                }
				value.parts.push(item);
			}
			return value;
		}

		return item;
	},

	// runtime

	doValue: (program, value) => {
		//  console.log('Value:doValue:value: '+JSON.stringify(value,null,2));
		// See if it's a constant string, a variable or something else
		if (typeof value.type === `undefined`) {
			program.runtimeError(program[program.pc].lino, `Undefined value (variable not initialized?)`);
			return null;
		}
		const type = value.type;
		switch (type) {
		case `cat`:
			return {
				type: `constant`,
				numeric: false,
				content: value.parts.reduce(function (acc, part) {
					let value = EasyCoder_Value.doValue(program, part);
					return acc + (value ? value.content : ``);
				}, ``)
			};
		case `boolean`:
		case `constant`:
			return value;
		case `symbol`:
			const symbol = program.getSymbolRecord(value.name);
			if (symbol.isVHolder) {
				const symbolValue = symbol.value[symbol.index];
				if (symbolValue) {
					const v = symbolValue.content;
					if (v === null || typeof v === `undefined`) {
						symbolValue.content = symbolValue.numeric ? 0 : ``;
					}
					return symbolValue;
				} else {
					return null;
				}
			} else {
				const handler = program.domain[symbol.domain].value;
				return handler.get(program, value);
			}
		default:
			break;
		}
		// Call the given domain to handle a value
		const handler = program.domain[value.domain].value;
		return handler.get(program, value);
	},

	constant: (content, numeric) => {
		return {
			type: `constant`,
			numeric,
			content
		};
	},

	evaluate: (program, value) => {
		if (!value) {
			return {
				type: `constant`,
				numeric: false,
				content: ``
			};
		}
		const result = EasyCoder_Value.doValue(program, value);
		if (result) {
			return result;
		}
		program.runtimeError(program[program.pc].lino, `Can't decode value: ` + value);
	},

	getValue: (program, value) => {
		const v = EasyCoder_Value.evaluate(program, value);
		return v ? v.content : null;
	},

	// tools

	encode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			default:
			case `ec`:
				return value.replace(/\n/g, `~lf~`)
					.replace(/%0a/g, `~lf~`)
					.replace(/\n/g, `~cr~`)
					.replace(/%0d/g, `~cr~`)
					.replace(/"/g, `~dq~`)
					.replace(/'/g, `~sq~`)
					.replace(/\\/g, `~bs~`);
			case `url`:
				return encodeURIComponent(value.replace(/\s/g, `+`));
			case `base64`:
				return btoa(value);
			case `sanitize`:
				return value.normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``);
			}
		}
		return value;
	},

	decode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			default:
			case `ec`:
				return value.replace(/%0a/g, `\n`)
					.replace(/~lf~/g, `\n`)
					.replace(/%0d/g, `\r`)
					.replace(/~cr~/g, `\n`)
					.replace(/~dq~/g, `"`)
					.replace(/~sq~/g, `'`)
					.replace(/~bs~/g, `\\`);
			case `url`:
				const decoded = decodeURIComponent(value);
				return decoded.replace(/\+/g, ` `);
			case `base64`:
				return atob(value);
			}
		}
		return value;
	}
};
const EasyCoder_Run = {

	name: `EasyCoder_Run`,

	run: (program, pc) =>{

		const queue = [];

		const minIndent = (scriptLines) => {
			let count = 9999;
			scriptLines.forEach(function (element) {
				const item = element.line;
				let n = 0;
				while (n < item.length) {
					if (item[n] !== ` `) {
						break;
					}
					n++;
				}
				if (n > 0 && n < count) {
					count = n;
				}
			});
			return 0;
		};

		if (queue.length) {
			queue.push(pc);
			return;
		}
		program.register(program);
		queue.push(pc);
		while (queue.length > 0) {
			program.pc = queue.shift();
			program.watchdog = 0;
			while (program.running) {
				if (program.watchdog > 1000000) {
					program.lino = program[program.pc].lino;
					program.reportError(
						new Error(`Program runaway intercepted.\nHave you forgotten to increment a loop counter?`, program),
						program);
					break;
				}
				program.watchdog++;
				const domain = program[program.pc].domain;
				if (program.debugStep) {
					console.log(`${program.script}: Line ${program[program.pc].lino}: `
					+ `${domain}:${program[program.pc].keyword} ${program.source.scriptLines[program.pc]})`);
				}
				const handler = program.domain[domain];
				if (!handler) {
					program.runtimeError(program[program.pc].lino, `Unknown domain '${domain}'`);
					break;
				}
				program.pc = handler.run(program);
				if (!program.pc) {
					break;
				}
				if (program.stop) {
					program.tracing = false;
					break;
				}
				if (program.tracing) {
					const command = program[program.pc];
					const scriptLines = program.source.scriptLines;
					const minSpace = minIndent(scriptLines);
					const tracer = document.getElementById(`easycoder-tracer`);
					if (!tracer) {
						program.runtimeError(command.lino, `Element 'easycoder-tracer' was not found`);
						return;
					}
					tracer.style.display = `block`;
					tracer.style.visibility = `visible`;
					var variables = ``;
					if (program.tracer) {
						const content = document.getElementById(`easycoder-tracer-content`);
						if (content) {
							program.tracer.variables.forEach(function (name, index, array) {
								const symbol = program.getSymbolRecord(name);
								if (symbol.elements > 1) {
									variables += `${name}: ${symbol.index}/${symbol.elements}: `;
									for (var n = 0; n < symbol.elements; n++) {
										const value = symbol.value[n];
										if (value) {
											variables += `${value.content} `;
										} else {
											variables += `undefined `;
										}
									}
								} else {
									const value = symbol.value[symbol.index];
									if (value) {
										variables += `${name}: ${value.content}`;
									} else {
										variables += `${name}: undefined`;
									}
								}
								switch (program.tracer.alignment) {
								case `horizontal`:
									if (index < array.length - 1) {
										variables += `, `;
									}
									break;
								case `vertical`:
									variables += `<br>`;
									break;
								}
							});
							variables += `<hr>`;
							var trace = ``;
							for (var n = 5; n > 0; n--) {
								if (command.lino) {
									const text = scriptLines[command.lino - n].line.substr(minSpace);
									trace += `<input type="text" name="${n}"` +
                  `value="${command.lino - n + 1}: ${text.split(`\\s`).join(` `)}"` +
                  `style="width:100%;border:none;enabled:false">`;
								}
								trace += `<br>`;
							}
							content.innerHTML = `${variables} ${trace}`;
							content.style.display = `block`;
							const run = document.getElementById(`easycoder-run-button`);
							const step = document.getElementById(`easycoder-step-button`);

							run.onclick = function () {
								run.blur();
								program.tracing = false;
								const content = document.getElementById(`easycoder-tracer-content`);
								content.style.display = `none`;
								try {
									EasyCoder_Run.run(program, program.resume);
								} catch (err) {
									const message = `Error in run handler: ` + err.message;
									console.log(message);
									alert(message);
								}
							};

							step.onclick = function () {
								console.log(`step`);
								step.blur();
								program.tracing = true;
								const content = document.getElementById(`easycoder-tracer-content`);
								content.style.display = `block`;
								try {
									program.run(program.resume);
								} catch (err) {
									const message = `Error in step handler: ` + err.message;
									console.log(message);
									alert(message);
								}
							};
						}

						program.resume = program.pc;
						program.pc = 0;
					}
					break;
				}
			}
		}
	},

	exit: (program) => {
		if (program.onExit) {
			program.run(program.onExit);
		}
		let parent = program.parent;
		let afterExit = program.afterExit;
		delete EasyCoder.scripts[program.script];
		if (program.module) {
			delete program.module.program;
		}
		Object.keys(program).forEach(function(key) {
			delete program[key];
		});
		if (parent && afterExit) {
			EasyCoder.scripts[parent].run(afterExit);
		}
	}
};
// eslint-disable-next-line no-unused-vars
const EasyCoder_Compiler = {

	name: `EasyCoder_Compiler`,

	getTokens: function() {
		return this.tokens;
	},

	addWarning: function(message) {
		this.warnings.push(message);
	},

	warning: function(message) {
		this.addWarning(message);
	},

	unrecognisedSymbol: function(item) {
		this.addWarning(`Unrecognised symbol '${item}'`);
	},

	getWarnings: function() {
		return this.warnings;
	},

	getIndex: function() {
		return this.index;
	},

	next: function(step = 1) {
		this.index = this.index + step;
	},

	peek: function() {
		return this.tokens[this.index + 1].token;
	},

	more: function() {
		return this.index < this.tokens.length;
	},

	getToken: function() {
		if (this.index >= this.tokens.length) {
			return null;
		}
		const item = this.tokens[this.index];
		return item ? this.tokens[this.index].token : null;
	},

	nextToken: function() {
		this.next();
		return this.getToken();
	},

	tokenIs: function(token) {
		if (this.index >= this.tokens.length) {
			return false;
		}
		return token === this.tokens[this.index].token;
	},

	nextTokenIs: function(token) {
		this.next();
		return this.tokenIs(token);
	},

	skip: function(token) {
		if (this.index >= this.tokens.length) {
			return null;
		}
		this.next();
		if (this.tokenIs(token)) {
			this.next();
		}
	},

	prev: function() {
		this.index--;
	},

	getLino: function() {
		if (this.index >= this.tokens.length) {
			return 0;
		}
		return this.tokens[this.index].lino;
	},

	getTarget: function(index = this.index) {
		return this.tokens[index].token;
	},

	getTargetPc: function(index = this.index) {
		return this.symbols[this.getTarget(index)].pc;
	},

	getCommandAt: function(pc) {
		return this.program[pc];
	},

	isSymbol: function(required = false) {
		const isSymbol = this.getTarget() in this.symbols;
		if (isSymbol) return true;
		if (required) {
			throw new Error(`Unknown symbol: '${this.getTarget()}'`);
		}
		return false;
	},

	nextIsSymbol: function(required = false) {
		this.next();
		return this.isSymbol(required);
	},

	getSymbol: function(required = false) {
		if (this.isSymbol(required)) {
			return this.symbols[this.getToken()];
		}
	},

	getSymbolPc: function(required = false) {
		return this.getSymbol(required).pc;
	},

	getSymbolRecord: function() {
		const record = this.program[this.getSymbolPc(true)];
		record.used = true;
		return record;
	},

	getSymbols: function() {
		return this.symbols;
	},

	getProgram: function() {
		return this.program;
	},

	getPc: function() {
		return this.program.length;
	},

	getValue: function() {
		return this.value.compile(this);
	},

	getNextValue: function() {
		this.next();
		return this.getValue();
	},

	getCondition: function() {
		return this.condition.compile(this);
	},

	constant: function(content, numeric = false) {
		return this.value.constant(content, numeric);
	},

	addCommand: function(item) {
		item.pc = this.program.length;
		this.program.push(item);
	},

	addSymbol: function(name, pc) {
		this.symbols[name] = {
			pc
		};
	},

	rewindTo: function(index) {
		this.index = index;
	},

	completeHandler: function() {
		const lino = this.getLino();
		// Add a 'goto' to skip the action
		const goto = this.getPc();
		this.addCommand({
			domain: `core`,
			keyword: `goto`,
			lino,
			goto: 0
		});
		// Add the action
		this.compileOne();
		// If `continue` is set
		if (this.continue) {
			this.addCommand({
				domain: `core`,
				keyword: `goto`,
				lino,
				goto: this.getPc() + 1
			});
			this.continue = false;
		}
		// else add a 'stop'
		else {
			this.addCommand({
				domain: `core`,
				keyword: `stop`,
				lino,
				next: 0
			});
		} 
		// Fixup the 'goto'
		this.getCommandAt(goto).goto = this.getPc();
		return true;
	},

	compileVariable: function(domain, keyword, isVHolder = false, extra = null) {
		this.next();
		const lino = this.getLino();
		const item = this.getTokens()[this.getIndex()];
		if (this.symbols[item.token]) {
			throw new Error(`Duplicate variable name '${item.token}'`);
		}
		const pc = this.getPc();
		this.next();
		this.addSymbol(item.token, pc);
		const command = {
			domain,
			keyword,
			lino,
			isSymbol: true,
			used: false,
			isVHolder,
			name: item.token,
			elements: 1,
			index: 0,
			value: [{}],
			element: [],
			extra
		};
		if (extra === `dom`) {
			command.element = [];
		}
		this.addCommand(command);
		return command;
	},

	compileToken: function() {
		// Try each domain in turn until one can handle the command
		const token = this.getToken();
		if (!token) {
			return;
		}
		// console.log(`Compile ${token}`);
		const mark = this.getIndex();
		for (const domainName of Object.keys(this.domain)) {
			// console.log(`Try domain ${domainName} for token ${token}`);
			const domain = this.domain[domainName];
			if (domain) {
				const handler = domain.getHandler(token);
				if (handler) {
					if (handler.compile(this)) {
						return;
					}
				}
			}
			this.rewindTo(mark);
		}
		console.log(`No handler found`);
		throw new Error(`I don't understand '${token}...'`);
	},

	compileOne: function() {
		const keyword = this.getToken();
		if (!keyword) {
			return;
		}
		// console.log(`Compile keyword '${keyword}'`);
		this.warnings = [];
		const pc = this.program.length;
		// First check for a label
		if (keyword.endsWith(`:`)) {
			// console.log(`Label: ${keyword}`);
			const name = keyword.substring(0, keyword.length - 1);
			if (this.symbols[name]) {
				throw new Error(`Duplicate symbol: '${name}'`);
			}
			this.symbols[name] = {
				pc
			};
			this.index++;
		} else {
			this.compileToken();
		}
	},

	compileFromHere: function(stopOn) {
		while (this.index < this.tokens.length) {
			const token = this.tokens[this.index];
			const keyword = token.token;
			if (keyword === `else`) {
				return this.program;
			}
			this.compileOne();
			if (stopOn.indexOf(keyword) > -1) {
				break;
			}
		}
	},

	compile: function(tokens) {
		this.tokens = tokens;
		this.index = 0;
		this.program = [];
		this.program.script = 0;
		this.program.symbols = {};
		this.symbols = this.program.symbols;
		this.warnings = [];
		this.compileFromHere([]);
		this.addCommand({
			domain: `core`,
			keyword: `exit`,
			lino: this.getLino(),
			next: 0
		});
		//    console.log('Symbols: ' + JSON.stringify(this.symbols, null, 2));
		for (const symbol in this.symbols) {
			const record = this.program[this.symbols[symbol].pc];
			if (record.isSymbol && !record.used && !record.exporter) {
				console.log(`Symbol '${record.name}' has not been used.`);
			}
		}
		return this.program;
	}
};
const EasyCoder = {

	name: `EasyCoder_Main`,

	domain: {
		core: EasyCoder_Core,
		browser: EasyCoder_Browser,
		json: EasyCoder_Json,
		rest: EasyCoder_Rest
	},

	elementId: 0,

	runtimeError: function (lino, message) {
		this.lino = lino;
		this.reportError({
			message: `Line ${(lino >= 0) ? lino : ``}: ${message}`
		}, this.program);
		if (this.program) {
			this.program.aborted = true;
		}
	},
	nonNumericValueError: function (lino) {
		this.runtimeError(lino, `Non-numeric value`);
	},
	variableDoesNotHoldAValueError: function (lino, name) {
		this.runtimeError(lino, `Variable '${name}' does not hold a value`);
	},

	reportError: function (err, program, source) {
		if (!err.message) {
			console.log(`An error occurred - origin was ${err.path[0]}`);
			return;
		}
		if (!this.compiling && !program) {
			const errString = `Error: ${err.message}`;
			alert(errString);
			console.log(errString);
			return;
		}
		const {
			tokens,
			scriptLines
		} = source ? source : program.source;
		const compiler = EasyCoder_Compiler;
		const lino = this.compiling ? tokens[compiler.getIndex()].lino : program[program.pc].lino;
		var errString = this.compiling
			? `Compile error in '${compiler.script}'`
			: `Runtime error in '${program.script}'`;
		errString += `:\n`;
		var start = lino - 5;
		start = start < 0 ? 0 : start;
		for (var n = start; n < lino; n++) {
			const nn = (`` + (n + 1)).padStart(4, ` `);
			errString += nn + ` ` + scriptLines[n].line.split(`\\s`).join(` `) + `\n`;
		}
		errString += `${err.message}\n`;
		const warnings = compiler.getWarnings();
		if (warnings.length) {
			errString += `Warnings:\n`;
			for (const warning of warnings) {
				errString += `${warning}\n`;
			}
		}
		console.log(errString);
		alert(errString);
	},

	getSymbolRecord: function (name) {
		const target = this[this.symbols[name].pc];
		if (target.alias) {
			return this.getSymbolRecord(target.alias);
		}
		if (target.exporter) {
			// if (target.exporter != this.script) {
			return EasyCoder.scripts[target.exporter].getSymbolRecord(target.exportedName);
			// }
		}
		return target;
	},

	verifySymbol: function (name) {
		return typeof this.symbols[name] !== `undefined`;
	},

	encode: function (value) {
		return EasyCoder_Value.encode(value, this.encoding);
	},

	decode: function (value) {
		return EasyCoder_Value.decode(value, this.encoding);
	},

	evaluate: function (value) {
		return EasyCoder_Value.evaluate(this, value);
	},

	getValue: function (value) {
		return EasyCoder_Value.getValue(this, value);
	},

	getFormattedValue: function (value) {
		const v = EasyCoder_Value.evaluate(this, value);
		if (v.numeric) {
			return v.content;
		}
		if (v.type === `boolean`) {
			return v.content ? `true` : `false`;
		}
		if (this.isJsonString(v.content)) {
			try {
				const parsed = JSON.parse(v.content);
				return JSON.stringify(parsed, null, 2);
			} catch (err) {
				this.reportError(err);
				return `{}`;
			}
		}
		return v.content;
	},

	getSimpleValue: function (content) {
		if (content === true || content === false) {
			return {
				type: `boolean`,
				content
			};
		}
		return {
			type: `constant`,
			numeric: Number.isInteger(content),
			content
		};
	},

	run: function (pc) {
		if (pc) {
			this.program = this;
			EasyCoder_Run.run(this, pc);
		}
	},

	exit: function () {
		EasyCoder_Run.exit(this);
	},

	register: (program) => {
		this.program = program;
	},

	require: function(type, src, cb) {
		let prefix = ``;
		if (src[0] == `/`) {
			prefix = window.location.origin + `/`;
		}
		const element = document.createElement(type === `css` ? `link` : `script`);
		switch (type) {
		case `css`:
			element.type = `text/css`;
			element.href = `${prefix}${src}`;
			element.rel = `stylesheet`;
			break;
		case `js`:
			element.type = `text/javascript`;
			element.src = `${prefix}${src}`;
			break;
		default:
			return;
		}
		element.onload = function () {
			console.log(`${Date.now() - EasyCoder.timestamp} ms: Library ${prefix}${src} loaded`);
			cb();
		};
		document.head.appendChild(element);
	},

	isUndefined: item => {
		return typeof item === `undefined`;
	},

	isJsonString: function (str) {
		if ([`{`, `[`].includes(str[0])) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}
		return false;
	},

	runScript: function (program) {
		const command = program[program.pc];
		const script = program.getValue(command.script);
		const imports = command.imports;
		imports.caller = program.script;
		const moduleRecord = command.module ? program.getSymbolRecord(command.module) : null;
		try {
			EasyCoder.tokeniseAndCompile(script.split(`\n`), imports, moduleRecord, this.script, command.then);
		} catch (err) {
			EasyCoder.reportError(err, program, program.source);
			if (program.onError) {
				program.run(program.onError);
			} else {
				let parent = EasyCoder.scripts[program.parent];
				if (parent && parent.onError) {
					parent.run(parent.onError);
				}
			}
			return;
		}
		if (command.nowait) {
			EasyCoder.run(program.nextPc);
		}
	},

	close: function () {},

	compileScript: function (source, imports, module, parent) {
		const {
			tokens
		} = source;
		this.compiling = true;
		const compiler = EasyCoder_Compiler;
		this.compiler = compiler;
		compiler.value = EasyCoder_Value;
		compiler.condition = EasyCoder_Condition;
		compiler.parent = parent;
		compiler.domain = this.domain;
		compiler.imports = imports;
		compiler.continue = false;
		const program = compiler.compile(tokens);
		//    console.log('Program: ' + JSON.stringify(program, null, 2));
		this.compiling = false;

		program.EasyCoder = this;
		program.value = EasyCoder_Value;
		program.condition = EasyCoder_Condition;
		program.compare = EasyCoder_Compare;
		program.source = source;
		program.run = this.run;
		program.exit = this.exit;
		program.runScript = this.runScript;
		program.evaluate = this.evaluate;
		program.getValue = this.getValue;
		program.getFormattedValue = this.getFormattedValue;
		program.getSimpleValue = this.getSimpleValue;
		program.encode = this.encode;
		program.decode = this.decode;
		program.domain = this.domain;
		program.require = this.require;
		program.isUndefined = this.isUndefined;
		program.isJsonString = this.isJsonString;
		program.getSymbolRecord = this.getSymbolRecord;
		program.verifySymbol = this.verifySymbol;
		program.runtimeError = this.runtimeError;
		program.nonNumericValueError = this.nonNumericValueError;
		program.variableDoesNotHoldAValueError = this.variableDoesNotHoldAValueError;
		program.reportError = this.reportError;
		program.register = this.register;
		program.symbols = compiler.getSymbols();
		program.unblocked = false;
		program.encoding = `ec`;
		program.popups = [];
		program.programStack = [];
		program.dataStack = [];
		program.queue = [0];
		program.module = module;
		program.parent = parent;
		if (module) {
			module.program = program.script;
		}
		return program;
	},

	tokeniseFile: function(file) {
		const scriptLines = [];
		const tokens = [];
		let index = 0;
		file.forEach(function (line, lino) {
			scriptLines.push({
				lino: lino + 1,
				line
			});
			const len = line.length;
			let token = ``;
			let inSpace = true;
			for (let n = 0; n < len; n++) {
				const c = line[n];
				if (c.trim().length == 0) {
					if (inSpace) {
						continue;
					}
					tokens.push({
						index,
						lino: lino + 1,
						token
					});
					index++;
					token = ``;
					inSpace = true;
					continue;
				}
				inSpace = false;
				if (c === `\``) {
					m = n;
					while (++n < line.length) {
						if (line[n] === `\``) {
							break;
						}
					}
					token = line.substr(m, n - m + 1);
				} else if (c == `!`) {
					break;
				} else {
					token += c;
				}
			}
			if (token.length > 0) {
				tokens.push({
					index,
					lino: lino + 1,
					token
				});
			}
		});
		return {scriptLines, tokens};
	},

	tokeniseAndCompile: function (file, imports, module, parent, then) {
		//  console.log('Tokenise script: ');
		let program = null;
		const startCompile = Date.now();
		const source = this.tokeniseFile(file);
		try {
			program = this.compileScript(source, imports, module, parent);
			if (!program.script) {
				program.script = EasyCoder.scriptIndex;
				EasyCoder.scriptIndex++;
			}
			const finishCompile = Date.now();
			console.log(`${finishCompile - this.timestamp} ms: ` +
				`Compiled ${program.script}: ${source.scriptLines.length} lines (${source.tokens.length} tokens) in ` +
				`${finishCompile - startCompile} ms`);
		} catch (err) {
			if (err.message !== `stop`) {
				let parentRecord = EasyCoder.scripts[parent];
				this.reportError(err, parentRecord, source);
				if (parentRecord && parentRecord.onError) {
					parentRecord.run(parentRecord.onError);
				}
				// Remove this script
				if (EasyCoder_Compiler.script) {
					delete EasyCoder.scripts[EasyCoder_Compiler.script];
					delete EasyCoder_Compiler.script;
				}
			}
			return;
		}
		if (program) {
			EasyCoder.scripts[program.script] = program;
			if (module) {
				module.program = program.script;
			}
			program.afterExit = then;
			program.running = true;
			EasyCoder_Run.run(program, 0);
		}
	},

	start: function(source) {
		EasyCoder.restPath = `rest.php`;
		
		EasyCoder.scriptIndex = 0;
		const script = source.split(`\n`);
		if (!this.tokenising) {
			try {
				this.tokeniseAndCompile(script);
			} catch (err) {
				this.reportError(err, null, source);
			}
			this.tokenising = true;
		}
	},
};
EasyCoder.version = `230628`;
EasyCoder.timestamp = Date.now();
console.log(`EasyCoder loaded; waiting for page`);

function EasyCoder_Startup() {
	console.log(`${Date.now() - EasyCoder.timestamp} ms: Page loaded; reset timer & start EasyCoder`);
	EasyCoder.timestamp = Date.now();
	EasyCoder.scripts = {};
	window.EasyCoder = EasyCoder;
	const script = document.getElementById(`easycoder-script`);
	if (script) {
		script.style.display = `none`;
		try {
			EasyCoder.start(script.innerText);
		}
		catch (err) {
			EasyCoder.reportError(err);
		}
	}
}

// For browsers
window.onload = EasyCoder_Startup;
