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
				EasyCoder.writeToDebugConsole(`Symbols: ${JSON.stringify(program.symbols, null, 2)}`);
				break;
			case `symbol`:
				const record = program.getSymbolRecord(command.name);
				const exporter = record.exporter.script;
				delete record.exporter;
				EasyCoder.writeToDebugConsole(`Symbol: ${JSON.stringify(record, null, 2)}`);
				record.exporter.script = exporter;
				break;
			case `step`:
				program.debugStep = true;
				break;
			case `stop`:
				program.debugStep = false;
				break;
			case `program`:
				EasyCoder.writeToDebugConsole(`Debug program: ${JSON.stringify(program, null, 2)}`);
				break;
			default:
				if (item.content >= 0) {
					EasyCoder.writeToDebugConsole(`Debug item ${item.content}: ${JSON.stringify(program[item.content], null, 2)}`);
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
			if (!theProgram.everyCallbacks) {
				theProgram.everyCallbacks = {};
			}
			theProgram.everyCallbacks[cb] = true;
			setInterval(function() {
				if (!theProgram.running || theProgram.tracing) {
					return;
				}
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
				EasyCoder.writeToDebugConsole(err.message);
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

	Log: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			const value = compiler.getValue();
			compiler.addCommand({
				domain: `core`,
				keyword: `print`,
				lino,
				value,
				log: true
			});
			return true;
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

	No: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`cache`)) {
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `no`,
					lino
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			EasyCoder.noCache = true;
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
			const raw = program.getFormattedValue(command.value);
			const value = (raw === null || typeof raw === `undefined` || raw === ``) ? `<empty>` : raw;
			if (command.log) {
				const now = new Date();
				const hh = String(now.getHours()).padStart(2, `0`);
				const mm = String(now.getMinutes()).padStart(2, `0`);
				const ss = String(now.getSeconds()).padStart(2, `0`);
				const ms = String(now.getMilliseconds()).padStart(3, `0`);
				EasyCoder.writeToDebugConsole(`${hh}:${mm}:${ss}.${ms}:${program.script}:${command.lino}->${value}`);
			} else {
				EasyCoder.writeToDebugConsole(value);
			}
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

	Release: {

		compile: compiler => {
			if (compiler.getToken()== `parent`) {
					compiler.next();
					compiler.addCommand({
						domain: `core`,
						keyword: `set`,
						lino,
						request: `setReady`
					});
					return true;
				}
				else {
					return false
				}
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
				let recipient;
				let replyVar = null;
				compiler.next();
				if ([`parent`, `sender`].includes(compiler.getToken())) {
					recipient = compiler.getToken();
					compiler.next();
				} else if (compiler.isSymbol()) {
					const moduleRecord = compiler.getSymbolRecord();
					if (moduleRecord.keyword !== `module`) {
						return false;
					}
					recipient = moduleRecord.name;
					compiler.next();
				} else {
					return false;
				}
				if (compiler.tokenIs(`and`)) {
					compiler.next();
					if (!compiler.tokenIs(`assign`)) return false;
					compiler.next();
					if (!compiler.tokenIs(`reply`)) return false;
					compiler.next();
					if (!compiler.tokenIs(`to`)) return false;
					if (!compiler.nextIsSymbol()) return false;
					replyVar = compiler.getSymbolRecord().name;
					compiler.next();
				}
				compiler.addCommand({
					domain: `core`,
					keyword: `send`,
					lino,
					message,
					recipient,
					replyVar
				});
			}
			return true;
		},

		run: program => {
			const command = program[program.pc];
			const message = program.getValue(command.message);
			let target = null;
			if (command.recipient === `parent`) {
				if (program.parent) {
					target = EasyCoder.scripts[program.parent];
				}
				// Intercept: if the caller is awaiting a direct reply
				if (target && target.replyVar) {
					target.message = message;
					const replyTarget = target.getSymbolRecord(target.replyVar);
					replyTarget.value[replyTarget.index] = {
						type: `text`,
						numeric: false,
						content: message
					};
					target.replyVar = null;
					return command.pc + 1;
				}
			} else if (command.recipient === `sender`) {
				if (program.sender) {
					target = EasyCoder.scripts[program.sender];
				}
				// Intercept: if the caller is awaiting a direct reply
				if (target && target.replyVar) {
					target.message = message;
					const replyTarget = target.getSymbolRecord(target.replyVar);
					replyTarget.value[replyTarget.index] = {
						type: `text`,
						numeric: false,
						content: message
					};
					target.replyVar = null;
					return command.pc + 1;
				}
			} else {
				const recipient = program.getSymbolRecord(command.recipient);
				if (recipient.program) {
					target = EasyCoder.scripts[recipient.program];
				}
			}
			if (command.replyVar) {
				program.replyVar = command.replyVar;
				if (target && target.onMessage) {
					target.sender = program.script;
					target.message = message;
					target.run(target.onMessage);
				}
				if (program.replyVar) {
					program.replyVar = null;
					program.runtimeError(command.lino, `No reply received from '${command.recipient}'`);
					return 0;
				}
				return command.pc + 1;
			}
			if (target && target.onMessage) {
				target.sender = program.script;
				target.message = message;
				target.run(target.onMessage);
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
					const value = [compiler.getValue()];
					const mark = compiler.getIndex();
					try {
						value.push(compiler.getValue());
					} catch (err) {
						compiler.rewindTo(mark);
						compiler.addCommand({
							domain: `core`,
							keyword: `put`,
							lino,
							value: value[0],
							target: targetRecord.name
						});
						return true;
					}
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
			var targetRecord = null;
			if (compiler.nextIsSymbol()) {
				targetRecord = compiler.getSymbolRecord();
			}
			item = compiler.getValue();
			let on = {
				type: `constant`,
				numeric: false,
				content: `\n`
			};
			if (compiler.tokenIs(`on`)) {
				on = compiler.getNextValue();
			}
			if ([`giving`, `into`].includes(compiler.getToken())) {
				if (compiler.nextIsSymbol()) {
					targetRecord = compiler.getSymbolRecord();
					compiler.next();
				} else {
					return false;
				}
			}
			if (targetRecord == null) {
				throw new Error(`No target variable given`);
			}
			if (targetRecord.keyword === `variable`) {
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
			throw new Error(`'{targetRecord.name}' is not a variable`);
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
			EasyCoder.writeToDebugConsole(`Test`);
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
			return EasyCoder_Core.Go;
		case `gosub`:
			return EasyCoder_Core.Gosub;
		case `goto`:
			return EasyCoder_Core.Go;
		case `if`:
			return EasyCoder_Core.If;
		case `import`:
			return EasyCoder_Core.Import;
		case `index`:
			return EasyCoder_Core.Index;
		case `log`:
			return EasyCoder_Core.Log;
		case `module`:
			return EasyCoder_Core.Module;
		case `multiply`:
			return EasyCoder_Core.Multiply;
		case `negate`:
			return EasyCoder_Core.Negate;
		case `no`:
			return EasyCoder_Core.No;
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
			if (token === `acos`) {
				compiler.next();
				const dy = compiler.getValue();
				const dx = compiler.getValue();
				return {
					domain: `core`,
					type: `acos`,
					dy,
					dx
				};
			}
			if (token === `asin`) {
				compiler.next();
				const dy = compiler.getValue();
				const dx = compiler.getValue();
				return {
					domain: `core`,
					type: `asin`,
					dy,
					dx
				};
			}
			if (token === `atan`) {
				compiler.next();
				const dy = compiler.getValue();
				const dx = compiler.getValue();
				return {
					domain: `core`,
					type: `atan`,
					dy,
					dx
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
			if ([`encode`, `decode`, `lowercase`, `hash`, `reverse`, `trim`].includes(token)) {
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
			if (token === `item`) {
				const item = compiler.getNextValue();
				if (compiler.tokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `variable`) {
							return {
								domain: `core`,
								type: `item`,
								item,
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
				compiler.next();
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
			case `sender`:
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
				var timestamp = null;
				if (compiler.nextTokenIs(`of`)) {
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
					var timestamp = null;
					if (compiler.nextTokenIs(`of`)) {
						timestamp = compiler.getNextValue();
					}
					return {
						domain: `core`,
						type: `${type}number`,
						timestamp
					};
				} else {
					var timestamp = null;
					if (compiler.tokenIs(`of`)) {
						timestamp = compiler.getNextValue();
					}
					return {
						domain: `core`,
						type,
						timestamp
					}
					}
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
			case `acos`:
				const cdy = program.getValue(value.dy);
				const cdx = program.getValue(value.dx);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.acos(cdy / cdx) * (180/Math.PI), 10)
				};
			case `asin`:
				const ady = program.getValue(value.dy);
				const adx = program.getValue(value.dx);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.asin(ady / adx) * (180/Math.PI), 10)
				};
			case `atan`:
				const tdy = program.getValue(value.dy);
				const tdx = program.getValue(value.dx);
				return {
					type: `constant`,
					numeric: true,
					content: parseInt(Math.atan2(tdy, tdx) * (180/Math.PI), 10)
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
			case `trim`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getValue(value.value).trim()
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
			case `item`:
				const item = program.getValue(value.item);
				const itemRecord = program.getSymbolRecord(value.symbol);
				var itemContent = ``;
				try {
					const rawContent = program.getValue(itemRecord.value[itemRecord.index]);
					itemContent = JSON.parse(rawContent)[item];
					// EasyCoder.writeToDebugConsole(itemContent)
				} catch (err) {
					program.runtimeError(program[program.pc].lino, `Can't parse JSON`);
					return null;
				}
				return {
					type: `constant`,
					numeric: false,
					content: typeof itemContent === `object` ?
						JSON.stringify(itemContent) : itemContent
				};
			case `property`:
				const property = program.getValue(value.property);
				const propertyRecord = program.getSymbolRecord(value.symbol);
				let propertyContent = program.getValue(propertyRecord.value[propertyRecord.index]);
				if (property && propertyContent) {
					if (typeof propertyContent === `object`) {
						content = propertyContent[property];
					} else {
						content = ``;
						propertyContent = ``+propertyContent;
						if (propertyContent != `` && [`{`, `]`].includes(propertyContent.charAt(0))) {
							try {
								content = JSON.parse(propertyContent);
								content = content[property];
							} catch (err) {
								program.runtimeError(program[program.pc].lino, `${err.message}: ${propertyContent}`);
							}
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
			case `sender`:
				content = program.sender || ``;
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
			case `month`:
				var month = new Date().getMonth();
				if (value.timestamp) {
					month = new Date(program.getValue(value.timestamp) * 1000).getMonth();
				}
				return {
					type: `constant`,
					numeric: true,
					content: month
				};
			case `day`:
				var day = new Date().getDay();
				if (value.timestamp) {
					day = new Date(program.getValue(value.timestamp) * 1000).getDay();
				}
				return {
					type: `constant`,
					numeric: true,
					content: day
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

		// Parse a single condition term (no AND/OR)
		parseConditionTerm: compiler => {
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
			if (compiler.tokenIs(`tracing`)) {
				compiler.next();
				return {
					domain: `core`,
					type: `tracing`,
					sense: true
				};
			}
			if (compiler.tokenIs(`not`)) {
				if (compiler.peek() === `tracing`) {
					compiler.next(2);
					return {
						domain: `core`,
						type: `tracing`,
						sense: false
					};
				}
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
				if (token === `starts`) {
					if (compiler.nextTokenIs(`with`)) {
						compiler.next();
						const value2 = compiler.getValue();
						return {
							domain: `core`,
							type: `startsWith`,
							value1,
							value2
						};
					}
					return null;
				}
				if (token === `ends`) {
					if (compiler.nextTokenIs(`with`)) {
						compiler.next();
						const value2 = compiler.getValue();
						return {
							domain: `core`,
							type: `endsWith`,
							value1,
							value2
						};
					}
					return null;
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

		// Parse AND expressions (higher precedence than OR)
		parseAndExpression: compiler => {
			let left = EasyCoder_Core.condition.parseConditionTerm(compiler);
			if (!left) {
				return null;
			}
			while (compiler.tokenIs(`and`)) {
				compiler.next();
				const right = EasyCoder_Core.condition.parseConditionTerm(compiler);
				if (!right) {
					compiler.warning(`Expected condition after 'and'`);
					return left;
				}
				left = {
					domain: `core`,
					type: `and`,
					left,
					right
				};
			}
			return left;
		},

		// Parse OR expressions (lower precedence than AND)
		parseOrExpression: compiler => {
			let left = EasyCoder_Core.condition.parseAndExpression(compiler);
			if (!left) {
				return null;
			}
			while (compiler.tokenIs(`or`)) {
				compiler.next();
				const right = EasyCoder_Core.condition.parseAndExpression(compiler);
				if (!right) {
					compiler.warning(`Expected condition after 'or'`);
					return left;
				}
				left = {
					domain: `core`,
					type: `or`,
					left,
					right
				};
			}
			return left;
		},

		// Main compile method that starts the recursive descent parser
		compile: compiler => {
			return EasyCoder_Core.condition.parseOrExpression(compiler);
		},

		test: (program, condition) => {
			var comparison;
			switch (condition.type) {
			case `or`:
				return program.condition.test(program, condition.left) ||
					program.condition.test(program, condition.right);
			case `and`:
				return program.condition.test(program, condition.left) &&
					program.condition.test(program, condition.right);
			case `tracing`:
				return condition.sense ? !!program.tracing : !program.tracing;
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
			case `startsWith`:
				return program.getValue(condition.value1).startsWith(program.getValue(condition.value2));
			case `endsWith`:
				return program.getValue(condition.value1).endsWith(program.getValue(condition.value2));
			}
			return false;
		}
	}
};
const EasyCoder_Browser = {

	name: `EasyCoder_Browser`,

	renderMarkdownToHtml: (markdown) => {
		if (typeof EasyCoder_Markdown !== `undefined` && EasyCoder_Markdown && typeof EasyCoder_Markdown.renderToHtml === `function`) {
			return EasyCoder_Markdown.renderToHtml(markdown);
		}
		return `${markdown == null ? `` : markdown}`;
	},

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

		nowMs: () => {
			if (typeof performance !== `undefined` && typeof performance.now === `function`) {
				return performance.now();
			}
			return Date.now();
		},

		reportTiming: (message) => {
			if (!(typeof EasyCoder !== `undefined` && EasyCoder.timingEnabled)) {
				return;
			}
			if (typeof EasyCoder !== `undefined` && typeof EasyCoder.writeToDebugConsole === `function`) {
				EasyCoder.writeToDebugConsole(message);
			} else {
				console.log(message);
			}
		},

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
				const waitMs = (typeof EasyCoder !== `undefined` && Number.isFinite(EasyCoder.attachWaitMs))
					? EasyCoder.attachWaitMs
					: 1000;
				const waitUntil = Date.now() + waitMs;
				const trace = {
					id: content,
					type: command.type,
					symbol: command.symbol,
					startedAt: EasyCoder_Browser.Attach.nowMs(),
					lookupAttempts: 0,
					waitMs
				};
				EasyCoder_Browser.Attach.getElementById(program, command, content, waitUntil, trace);
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

		getElementById: (program, command, id, waitUntil, trace) => {
			trace.lookupAttempts += 1;
			const element = document.getElementById(id);
			if (element) {
				const isImageTarget = [`img`, `image`].includes(command.type);
				if (isImageTarget && !EasyCoder_Browser.Attach.isImageReady(element)) {
					EasyCoder_Browser.Attach.waitForImageReady(program, command, id, element, waitUntil, trace);
				} else {
					EasyCoder_Browser.Attach.completeAttach(program, command, element, id, trace);
				}
			} else if (Date.now() < waitUntil) {
				const retry = () => EasyCoder_Browser.Attach.getElementById(program, command, id, waitUntil, trace);
				if (typeof window !== `undefined` && typeof window.requestAnimationFrame === `function`) {
					window.requestAnimationFrame(retry);
				} else {
					setTimeout(retry, 16);
				}
			} else {
				const elapsed = Math.round(EasyCoder_Browser.Attach.nowMs() - trace.startedAt);
				EasyCoder_Browser.Attach.reportTiming(`[AttachTiming] FAILED id='${id}' symbol='${trace.symbol}' type='${trace.type}' attempts=${trace.lookupAttempts} elapsed=${elapsed}ms waitLimit=${trace.waitMs}ms`);
				if (command.onError) {
					program.run(command.onError);
				} else {
					program.runtimeError(command.lino, `No such element: '${id}'`);
				}
			}
		},

		completeAttach: (program, command, element, id, trace) => {
			if (program.run) {
				const elapsed = Math.round(EasyCoder_Browser.Attach.nowMs() - trace.startedAt);
				EasyCoder_Browser.Attach.reportTiming(`[AttachTiming] id='${id}' symbol='${trace.symbol}' type='${trace.type}' attempts=${trace.lookupAttempts} elapsed=${elapsed}ms`);
				const target = program.getSymbolRecord(command.symbol);
				target.element[target.index] = element;
				target.value[target.index] = {
					type: `constant`,
					numeric: false,
					id
				};
				program.run(command.pc + 1);
			}
		},

		isImageReady: (element) => {
			if (!element) {
				return false;
			}
			if (element.tagName !== `IMG`) {
				return true;
			}
			return element.complete;
		},

		waitForImageReady: (program, command, id, element, waitUntil, trace) => {
			if (EasyCoder_Browser.Attach.isImageReady(element) || Date.now() >= waitUntil) {
				EasyCoder_Browser.Attach.completeAttach(program, command, element, id, trace);
				return;
			}
			let finished = false;
			let timer = null;
			const finish = () => {
				if (finished) {
					return;
				}
				finished = true;
				element.removeEventListener(`load`, finish);
				element.removeEventListener(`error`, finish);
				if (timer) {
					clearTimeout(timer);
				}
				EasyCoder_Browser.Attach.completeAttach(program, command, element, id, trace);
			};
			element.addEventListener(`load`, finish);
			element.addEventListener(`error`, finish);
			timer = setTimeout(finish, Math.max(0, waitUntil - Date.now()));
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
					`th`,
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
			let target = symbol.element[symbol.index];
			if (!target) {
				const symbolValue = symbol.value[symbol.index] || {};
				const targetId = symbolValue.content || symbolValue.id;
				target = targetId ? document.getElementById(targetId) : null;
			}
			if (!target) {
				program.runtimeError(command.lino, `Variable '${symbol.name}' is not attached to a DOM element.`);
				return 0;
			}
			target.disabled = true;
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
			let target = symbol.element[symbol.index];
			if (!target) {
				const symbolValue = symbol.value[symbol.index] || {};
				const targetId = symbolValue.content || symbolValue.id;
				target = targetId ? document.getElementById(targetId) : null;
			}
			if (!target) {
				program.runtimeError(command.lino, `Variable '${symbol.name}' is not attached to a DOM element.`);
				return 0;
			}
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
							return false;
						}
						if (symbolRecord.keyword !== `form`) {
							return false;
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
			if (state == ``) {
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
			case `resume`:
				compiler.next();
				compiler.addCommand({
					domain: `browser`,
					keyword: `on`,
					lino,
					action
				});
				return compiler.completeHandler();
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
								const boundTarget = event.currentTarget || target;
								if (eventTarget && eventTarget.type != `radio` && typeof eventTarget.blur === `function`) {
									eventTarget.blur();
								}
								if (typeof boundTarget.targetRecord !== `undefined`) {
									boundTarget.targetRecord.index = boundTarget.targetIndex;
									setTimeout(function () {
										EasyCoder.timestamp = Date.now();
										let p = EasyCoder.scripts[boundTarget.targetRecord.program];
										p.run(boundTarget.targetPc);
									}, 1);
								} else {
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
							EasyCoder.writeToDebugConsole(`Error: ${err.message}`);
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
			case `resume`:
				program.onResume = command.pc + 2;
				document.addEventListener(`visibilitychange`, function () {
					if (!document.hidden && program.running) {
						EasyCoder.timestamp = Date.now();
						program.run(program.onResume);
					}
				});
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

	Render: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const script = compiler.getNextValue();
			if (compiler.tokenIs(`in`)) {
				if (compiler.nextIsSymbol()) {
					const parentRecord = compiler.getSymbolRecord();
					if (parentRecord.extra === `dom`) {
						compiler.next();
						compiler.addCommand({
							domain: `browser`,
							keyword: `render`,
							lino,
							parent: parentRecord.name,
							script
						});
						return true;
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			if (typeof EasyCoder_Webson === `undefined`) {
				program.runtimeError(command.lino, `Webson engine is not loaded`);
				return 0;
			}
			const parent = program.getSymbolRecord(command.parent);
			const element = parent.element[parent.index];
			const script = program.getValue(command.script);
			EasyCoder_Webson.render(element, `main`, script, {
				debug: 0,
				state: `default`,
				timingEnabled: typeof EasyCoder !== `undefined` && !!EasyCoder.timingEnabled,
				timingReporter: typeof EasyCoder !== `undefined` && typeof EasyCoder.writeToDebugConsole === `function`
					? (message) => EasyCoder.writeToDebugConsole(message)
					: null
			})
				.then(() => {
					program.run(command.pc + 1);
				})
				.catch((err) => {
					program.runtimeError(command.lino, err.message ? err.message : String(err));
				});
			return 0;
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
				const div = symbolRecord.element[symbolRecord.index];

				// Method 1: Standard smooth scroll
				div.scrollTo({ top: 0, behavior: 'smooth' });

				// Method 2: Immediate fallback
				div.scrollTop = 0;

				// Method 3: Force reflow by accessing layout properties
				void div.offsetHeight; // This triggers a reflow

				// Final attempt
				div.scrollTop = 0;
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

	SELECT: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `select`, false, `dom`);
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
					if (target && target.dataset && target.dataset.markdown === `1`) {
						target.innerHTML = EasyCoder_Browser.renderMarkdownToHtml(value);
					} else {
						target.innerHTML = value;
					}
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

	TH: {

		compile: (compiler) => {
			compiler.compileVariable(`browser`, `th`, false, `dom`);
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
				EasyCoder.writeToDebugConsole(`Set up tracer`);
				program.tracer = {
					variables: command.variables,
					alignment: command.alignment
				};
				break;
			case `run`:
				EasyCoder.writeToDebugConsole(`Run tracer`);
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
			program.runtimeError(command.lino, `File upload is disabled in static hosting mode`);
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
		case `render`:
			return EasyCoder_Browser.Render;
		case `request`:
			return EasyCoder_Browser.Request;
		case `scroll`:
			return EasyCoder_Browser.Scroll;
		case `section`:
			return EasyCoder_Browser.SECTION;
		case `select`:
			return EasyCoder_Browser.SELECT;
		case `set`:
			return EasyCoder_Browser.Set;
		case `span`:
			return EasyCoder_Browser.SPAN;
		case `table`:
			return EasyCoder_Browser.TABLE;
		case `td`:
			return EasyCoder_Browser.TD;
		case `textarea`:
			return EasyCoder_Browser.TEXTAREA;
		case `th`:
			return EasyCoder_Browser.TH;
		case `tr`:
			return EasyCoder_Browser.TR;
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
				if (value.type === `input` && target.type === `checkbox`) {
					return {
						type: `boolean`,
						numeric: false,
						content: target.checked
					};
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
			EasyCoder.writeToDebugConsole(`No script property in window state object`);
		}
	}
};
const EasyCoder_Markdown = {

	escapeHtml: (text) => {
		return `${text}`
			.replace(/&/g, `&amp;`)
			.replace(/</g, `&lt;`)
			.replace(/>/g, `&gt;`)
			.replace(/\"/g, `&quot;`)
			.replace(/'/g, `&#39;`);
	},

	normalizeColor: (value) => {
		const color = `${value || ``}`.trim();
		if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
			return color;
		}
		if (/^[a-zA-Z]+$/.test(color)) {
			return color.toLowerCase();
		}
		return null;
	},

	normalizeFontFamily: (value) => {
		const key = `${value || ``}`.trim().toLowerCase();
		const map = {
			sansserif: `sans-serif`,
			serif: `serif`,
			monospace: `monospace`,
			system: `system-ui`
		};
		return map[key] || null;
	},

	applyExtendedInline: (html) => {
		let output = html;
		output = output.replace(/\[\[color=([^\]]+)\]\]([\s\S]*?)\[\[\/color\]\]/gi,
			(match, rawColor, content) => {
				const color = EasyCoder_Markdown.normalizeColor(rawColor);
				if (!color) {
					return content;
				}
				return `<span style="color:${color};">${content}</span>`;
			});
		output = output.replace(/\[\[font=([^\]]+)\]\]([\s\S]*?)\[\[\/font\]\]/gi,
			(match, rawFont, content) => {
				const fontFamily = EasyCoder_Markdown.normalizeFontFamily(rawFont);
				if (!fontFamily) {
					return content;
				}
				return `<span style="font-family:${fontFamily};">${content}</span>`;
			});
		return output;
	},

	renderToHtml: (markdown) => {
		const source = `${markdown == null ? `` : markdown}`.replace(/\r\n?/g, `\n`);
		const parseInline = (text) => {
			let html = EasyCoder_Markdown.escapeHtml(text);
			html = html.replace(/`([^`]+)`/g, `<code>$1</code>`);
			html = html.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);
			html = html.replace(/__([^_]+)__/g, `<strong>$1</strong>`);
			html = html.replace(/(^|[^*])\*([^*]+)\*/g, `$1<em>$2</em>`);
			html = html.replace(/(^|[^_])_([^_]+)_/g, `$1<em>$2</em>`);
			html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);
			html = EasyCoder_Markdown.applyExtendedInline(html);
			return html;
		};

		const out = [];
		let inCodeBlock = false;
		let inBlockquote = false;
		let listType = ``;
		let tableRows = [];
		const closeList = () => {
			if (listType) {
				out.push(`</${listType}>`);
				listType = ``;
			}
		};
		const closeBlockquote = () => {
			if (inBlockquote) {
				closeList();
				out.push(`</blockquote>`);
				inBlockquote = false;
			}
		};
		const parseTableRow = (line) => {
			return line.replace(/^\|/, ``).replace(/\|$/, ``).split(`|`).map(c => c.trim());
		};
		const flushTable = () => {
			if (tableRows.length === 0) return;
			const hasHeader = tableRows.length >= 2 && /^[\s|:-]+$/.test(tableRows[1]);
			out.push(`<table style="border-collapse:collapse;border:1px solid #ccc;">`);
			if (hasHeader) {
				const headers = parseTableRow(tableRows[0]);
				out.push(`<thead><tr>`);
				for (const cell of headers) {
					out.push(`<th style="border:1px solid #ccc;padding:4px 8px;">${parseInline(cell)}</th>`);
				}
				out.push(`</tr></thead>`);
				out.push(`<tbody>`);
				for (let i = 2; i < tableRows.length; i++) {
					const cells = parseTableRow(tableRows[i]);
					out.push(`<tr>`);
					for (const cell of cells) {
						out.push(`<td style="border:1px solid #ccc;padding:4px 8px;">${parseInline(cell)}</td>`);
					}
					out.push(`</tr>`);
				}
				out.push(`</tbody>`);
			} else {
				out.push(`<tbody>`);
				for (const row of tableRows) {
					const cells = parseTableRow(row);
					out.push(`<tr>`);
					for (const cell of cells) {
						out.push(`<td style="border:1px solid #ccc;padding:4px 8px;">${parseInline(cell)}</td>`);
					}
					out.push(`</tr>`);
				}
				out.push(`</tbody>`);
			}
			out.push(`</table>`);
			tableRows = [];
		};

		for (const rawLine of source.split(`\n`)) {
			const line = rawLine;
			if (line.trim().startsWith(`\`\`\``)) {
				closeBlockquote();
				closeList();
				if (!inCodeBlock) {
					out.push(`<pre><code>`);
					inCodeBlock = true;
				} else {
					out.push(`</code></pre>`);
					inCodeBlock = false;
				}
				continue;
			}
			if (inCodeBlock) {
				out.push(`${EasyCoder_Markdown.escapeHtml(line)}\n`);
				continue;
			}

			if (line.trim().startsWith(`|`)) {
				closeBlockquote();
				closeList();
				tableRows.push(line.trim());
				continue;
			}
			flushTable();

			if (line.trim() === ``) {
				closeBlockquote();
				closeList();
				continue;
			}

			const quote = /^>\s?(.*)$/.exec(line);
			if (quote) {
				closeList();
				if (!inBlockquote) {
					out.push(`<blockquote>`);
					inBlockquote = true;
				}
				out.push(`<p>${parseInline(quote[1])}</p>`);
				continue;
			}
			closeBlockquote();

			const heading = /^(#{1,6})\s+(.*)$/.exec(line);
			if (heading) {
				closeList();
				const level = heading[1].length;
				out.push(`<h${level} style="font-family:sans-serif;">${parseInline(heading[2])}</h${level}>`);
				continue;
			}

			const ulist = /^[-*]\s+(.*)$/.exec(line);
			if (ulist) {
				if (listType !== `ul`) {
					closeList();
					listType = `ul`;
					out.push(`<ul>`);
				}
				out.push(`<li>${parseInline(ulist[1])}</li>`);
				continue;
			}

			const olist = /^\d+\.\s+(.*)$/.exec(line);
			if (olist) {
				if (listType !== `ol`) {
					closeList();
					listType = `ol`;
					out.push(`<ol>`);
				}
				out.push(`<li>${parseInline(olist[1])}</li>`);
				continue;
			}

			closeList();
			out.push(`<p>${parseInline(line)}</p>`);
		}

		flushTable();
		closeList();
		closeBlockquote();
		if (inCodeBlock) {
			out.push(`</code></pre>`);
		}
		return out.join(`\n`);
	}
};
// EasyCoder_Webson is a rendering engine for JSON-based markup scripts.

// The main entry point is EasyCoder_Webson.render(), which takes a container element,
// a name for the script, the script itself, and an optional options object.
// The script is a JSON object that describes the structure of the DOM
// to be created, along with any dynamic content or behavior.
// The script can include directives such as #element to specify
// the type of element to create, #content to specify the inner HTML
// or value of an element, #repeat to create multiple instances of an element
// based on an array, and #include to include another script.
// The EasyCoder_Webson engine processes the script recursively,
// building the DOM structure and applying any dynamic content or behavior
// as specified in the script.

// EasyCoder_Webson scripts can easily be generated by AI tools,
// allowing for dynamic and data-driven user interfaces.
// If you wish to take advantage of this you may need to 
// provide the AI engine with a link to the EasyCoder_Webson repository
// (https://github.com/easycoder/webson)
// for training purposes.
    
    const EasyCoder_Webson = {
    
    // Expand all variables in a value.
    // Expressions inside angle braces are fed to eval().
    expand: (element, input, symbols) => {
        let output = input;
        let mod = true;
        let values;
        let changed = false;
        if (typeof input === `object`) {
            const keys = Object.keys(input);
            for (let key of keys) {
                switch (key) {
                    case `#select`:
                        // Process an array selector
                        const value = EasyCoder_Webson.expand(element, input[key], symbols);
                        const index = input[`#index`];
                        if (typeof index === `undefined`) {
                            throw Error(`#select '${input[key]} has no #index`);
                        }
                        output = value[EasyCoder_Webson.expand(element, index, symbols)];
                        mod = true;
                        changed = true;
                        break;
                    default:
                        break;
                }
            }
        } else {
            while (mod) {
                mod = false;
                re = /(?:\#|\$)[a-zA-Z0-9_.]*/g;
                while ((values = re.exec(output)) !== null) {
                    let item = values[0];
                    switch (item[0]) {
                        case `#`:
                            // Evaluate system values
                            switch (item) {
                                case `#element_width`:
                                    output = output.replace(item, element.offsetWidth);
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#parent_width`:
                                    output = output.replace(
                                        item, element.parentElement.offsetWidth);
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#random`:
                                    output = output.replace(item, Math.floor(Math.random() * 10));
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#step`:
                                    output = output.replace(item, symbols[`#step`]);
                                    mod = true;
                                    changed = true;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case `$`:
                            let value = item;
                            const val = symbols[item];
                            if (Array.isArray(val)) {
                                output = val;
                            } else {
                                value = EasyCoder_Webson.expand(element, val, symbols);
                                output = output.replace(item, value);
                            }
                            mod = true;
                            changed = true;
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        // Remove braces. Try to evaluate their contents.
        // If this doesn't work, assume it's a value that can't be further simplified.
        changed = true;
        while (changed) {
            changed = false;
            try {
                const p = output.lastIndexOf(`<`);
                if (p >= 0) {
                    const q = output.indexOf(`>`, p);
                    if (q < 0) {
                        throw Error(`Mismatched braces in ${input}`);
                    }
                    const substr = output.substring(p + 1, q);
                    if (!['b', '/b', 'i', '/i', 'br', '/br'].includes(substr)) {
                        let repl = `<${substr}>`;
                        try {
                            const v = eval(substr);
                            output = output.replace(repl, v);
                        } catch (e) {
                            output = output.replace(repl, substr);
                        }
                        changed = true;
                    }
                }
            }
            catch (e) {
            }
        }
        return output;
    },
    
    // Get the definitions from a set of items
    getDefinitions: (items, symbols) => {
        const keys = Object.keys(items);
        for (let key of keys) {
            if (key[0] === `$`) {
                symbols[key] = items[key];
            }
        }
    },
    
    // Include another script
    include: async (parent, name, path, symbols) => {
        if (symbols[`#debug`] >= 2) {
            console.log(`#include ${name}: ${path}`);
        }
        const response = await fetch(path, {
            cache: `no-store`
        });
        const script = await response.text();
        await EasyCoder_Webson.build(parent, name, JSON.parse(script), symbols);
    },

    // Cache for external text files
    textCache: {},

    // Load text content from file (cached)
    loadTextFile: async (path) => {
        if (typeof EasyCoder_Webson.textCache[path] !== `undefined`) {
            return EasyCoder_Webson.textCache[path];
        }
        const response = await fetch(path, {
            cache: `no-store`
        });
        if (!response.ok) {
            throw Error(`Unable to load text file '${path}' (${response.status})`);
        }
        const text = await response.text();
        EasyCoder_Webson.textCache[path] = text;
        return text;
    },

    // Resolve $variables backed by external text files
    resolveFileBackedSymbols: async (items, symbols, element) => {
        for (const key of Object.keys(items)) {
            if (key[0] !== `$`) {
                continue;
            }
            const def = items[key];
            if (typeof def !== `object` || Array.isArray(def) || def === null) {
                continue;
            }
            const filePathSpec = typeof def[`#textFile`] !== `undefined`
                ? def[`#textFile`]
                : def[`#file`];
            if (typeof filePathSpec === `undefined`) {
                continue;
            }
            const filePath = EasyCoder_Webson.expand(element, filePathSpec, symbols);
            const text = await EasyCoder_Webson.loadTextFile(filePath);
            items[key] = text;
            symbols[key] = text;
            if (symbols[`#debug`] >= 2) {
                console.log(`File variable ${key}: ${filePath}`);
            }
        }
    },

    waitForElementReady: (element) => {
        if (!element || element.tagName !== `IMG`) {
            return Promise.resolve();
        }
        if (element.complete) {
            return Promise.resolve();
        }
        const timeoutMs = 5000;
        return new Promise(resolve => {
            let finished = false;
            const finish = () => {
                if (finished) {
                    return;
                }
                finished = true;
                element.removeEventListener(`load`, finish);
                element.removeEventListener(`error`, finish);
                resolve();
            };
            element.addEventListener(`load`, finish);
            element.addEventListener(`error`, finish);
            setTimeout(finish, timeoutMs);
        });
    },

    nowMs: () => {
        if (typeof performance !== `undefined` && typeof performance.now === `function`) {
            return performance.now();
        }
        return Date.now();
    },

    timingEnabled: false,

    timingReporter: null,

    reportTiming: (message) => {
        if (!EasyCoder_Webson.timingEnabled) {
            return;
        }
        if (typeof EasyCoder_Webson.timingReporter === `function`) {
            EasyCoder_Webson.timingReporter(message);
        } else {
            console.log(message);
        }
    },

    // Build a DOM structure
    build: async (parent, name, items, parentSymbols) => {
        const buildStartedAt = EasyCoder_Webson.nowMs();
        if (typeof parent === `undefined`) {
            throw Error(`build: 'parent' is undefined`);
        }
        if (typeof name === `undefined`) {
            throw Error(`build: element is undefined (is the #element directive missing?`);
        }
        if (typeof items === `undefined`) {
            throw Error(`build: ${name} has no properties`);
        }
        const symbols = JSON.parse(JSON.stringify(parentSymbols));
        EasyCoder_Webson.getDefinitions(items, symbols);
        await EasyCoder_Webson.resolveFileBackedSymbols(items, symbols, parent);
        if (typeof items[`#debug`] !== `undefined`) {
            symbols[`#debug`] = items[`#debug`];
        }
        if (symbols[`#debug`] >= 2) {
            console.log(`Build ${name}`);
        }
        if (typeof items[`#doc`] !== `undefined` && symbols[`#debug`] >= 1) {
            console.log(items[`#doc`]);
        }

        let element = parent;
        const elementType = items[`#element`];
        if (typeof elementType !== `undefined`) {
            if (symbols[`#debug`] >= 2) {
                console.log(`#element: ${elementType}`);
            }
            element = document.createElement(elementType);
            parent.appendChild(element);
        }
        symbols[`#element`] = element;

        for (const key of Object.keys(items)) {
            let value = items[key];
            switch (key) {
                case `#`:
                case `#debug`:
                case `#doc`:
                case `#element`:
                    break;
                case `#content`:
                    var val = ``;
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            val += EasyCoder_Webson.expand(element, item, symbols);
                        }
                    } else {
                        val = EasyCoder_Webson.expand(element, value, symbols);
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#content: ${value} -> ${val}`);
                    }
                    symbols[value] = val;
                    switch (element.type) {
                        case `text`:
                        case `textarea`:
                        case `input`:
                            element.value = val;
                            break;
                        default:
                            element.innerHTML = val;
                            break;
                    }
                    break;
                case `#repeat`:
                    symbols[`#steps`] = 0;
                    for (let item in value) {
                        switch (item) {
                            case `#doc`:
                                if (symbols[`#debug`] >= 1) {
                                    console.log(value[item]);
                                }
                                break;
                            case `#target`:
                                symbols[`#target`] = value[item];
                                break;
                            case `#steps`:
                                const stepspec = value[item];
                                for (let stepitem in stepspec) {
                                    switch (stepitem) {
                                        case `#arraysize`:
                                            const targetName = stepspec[stepitem];
                                            symbols[`#steps`] = symbols[targetName].length;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#repeat: ${symbols[`#target`]}, ${symbols[`#steps`]}`);
                    }
                    for (let step = 0; step < symbols[`#steps`]; step++) {
                        symbols[`#step`] = step;
                        await EasyCoder_Webson.build(element, `${name}[${step}]`, symbols[symbols[`#target`]], symbols);
                    }
                    break;
                case `#include`:
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            const defs = Object.keys(item);
                            const includeName = defs[0];
                            const path = item[includeName];
                            await EasyCoder_Webson.include(element, includeName, path, symbols);
                        }
                    } else if (typeof value === `object`) {
                        const defs = Object.keys(value);
                        const includeName = defs[0];
                        const path = value[includeName];
                        await EasyCoder_Webson.include(element, includeName, path, symbols);
                    } else {
                        await EasyCoder_Webson.include(element, value, value, symbols);
                    }
                    break;
                case `#switch`:
                    for (let state of Object.keys(value)) {
                        if (state === symbols[`#state`]) {
                            await EasyCoder_Webson.build(element, value[state], symbols[value[state]], symbols);
                            return;
                        }
                    }
                    await EasyCoder_Webson.build(element, name, symbols[value[`default`]], symbols);
                    return;
                case `#onClick`:
                    element.onClickItems = value;
                    element.onclick = function (event) {
                        event.stopPropagation();
                        for (let state of Object.keys(element.onClickItems)) {
                            if (state === symbols[`#state`]) {
                                EasyCoder_Webson.parent.replaceChildren();
                                void EasyCoder_Webson.build(EasyCoder_Webson.parent, EasyCoder_Webson.name, EasyCoder_Webson.script, {
                                    "debug": 0,
                                    "#state": value[state]
                                });
                                return false;
                            }
                        }
                        return false;
                    };
                    break;
                default:
                    if (key[0] === `@`) {
                        const aName = key.substring(1);
                        const aValue = EasyCoder_Webson.expand(parent, value, symbols);
                        if (typeof aValue === `undefined`) {
                            throw Error(`Element ${value} could not be found`);
                        }
                        element.setAttribute(aName, aValue);
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Attribute ${aName}: ${JSON.stringify(value, 0, 0)} -> ${aValue}`);
                        }
                    } else if (key[0] === `$`) {
                        const userVal = EasyCoder_Webson.expand(element, value, symbols);
                        symbols[key] = userVal;
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Variable ${key}: ${JSON.stringify(value, 0, 0)} -> ${userVal}`);
                        }
                    } else {
                        const styleVal = EasyCoder_Webson.expand(element, value, symbols);
                        if (key.includes(`-`) || key.startsWith(`--`)) {
                            element.style.setProperty(key, styleVal);
                        } else {
                            element.style[key] = styleVal;
                        }
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Style ${key}: ${JSON.stringify(value, 0, 0)} -> ${styleVal}`);
                        }
                    }
                    break;
            }
        }

        if (typeof items[`#`] !== `undefined`) {
            const data = items[`#`];
            if (Array.isArray(data)) {
                for (const childName of data) {
                    await EasyCoder_Webson.build(element, childName, symbols[childName], symbols);
                }
            } else if (data[0] === `$`) {
                await EasyCoder_Webson.build(element, data, symbols[data], symbols);
            }
        }

        const waitStartedAt = EasyCoder_Webson.nowMs();
        await EasyCoder_Webson.waitForElementReady(element);
        const waitElapsed = Math.round(Webson.nowMs() - waitStartedAt);
        const totalElapsed = Math.round(EasyCoder_Webson.nowMs() - buildStartedAt);
        const tag = element && element.tagName ? element.tagName.toLowerCase() : `unknown`;
        EasyCoder_Webson.reportTiming(`[WebsonTiming] name='${name}' tag='${tag}' wait=${waitElapsed}ms total=${totalElapsed}ms`);
    },

    // Render a script into a given container
    render: async (parent, name, script, options = {}) => {
        EasyCoder_Webson.parent = parent;
        EasyCoder_Webson.name = name;
        EasyCoder_Webson.script = typeof script === `string` ? JSON.parse(script) : script;
        EasyCoder_Webson.timingEnabled = !!options.timingEnabled;
        EasyCoder_Webson.timingReporter = typeof options.timingReporter === `function`
            ? options.timingReporter
            : null;
        await EasyCoder_Webson.build(parent, name, EasyCoder_Webson.script, {
            "#debug": Number.isFinite(options.debug) ? options.debug : 0,
            "#state": options.state || "default"
        });
    }
};

if (typeof globalThis !== `undefined`) {
    globalThis.Webson = EasyCoder_Webson;
}

if (typeof module !== `undefined` && module.exports) {
    module.exports = EasyCoder_Webson;
}
const EasyCoder_JSON = {

	name: `EasyCoder_JSON`,

	normalizeComparable: (entry) => {
		if (typeof entry !== `string`) {
			return entry;
		}
		const trimmed = entry.trim();
		if ((trimmed.startsWith(`"`) && trimmed.endsWith(`"`)) ||
			(trimmed.startsWith(`'`) && trimmed.endsWith(`'`))) {
			try {
				return JSON.parse(trimmed.replace(/^'/, `"`).replace(/'$/, `"`));
			} catch (err) {
				return trimmed.substring(1, trimmed.length - 1);
			}
		}
		return entry;
	},

	areComparableEqual: (left, right) => {
		return EasyCoder_JSON.normalizeComparable(left) === EasyCoder_JSON.normalizeComparable(right);
	},

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
				let splitItems;
				try {
					const parsed = JSON.parse(content);
					splitItems = Array.isArray(parsed) ? parsed : content.split(on);
				} catch (err) {
					splitItems = content.split(on);
				}
				targetRecord = program.getSymbolRecord(command.target);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(splitItems)
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
			return EasyCoder_JSON.Json;
		default:
			return null;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_JSON.getHandler(command.keyword);
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
				content = list.findIndex(function (entry) {
					return EasyCoder_JSON.areComparableEqual(entry, item);
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
/**
 * EasyCoder MQTT Plugin for JavaScript
 *
 * Provides MQTT client functionality with support for:
 * - Topic declaration and subscription
 * - MQTT client connection
 * - Message publishing and receiving
 * - Message chunking for large payloads
 * - Event handlers (on connect, on message)
 *
 * Based on the Python implementation in ec_mqtt.py
 * Requires: MQTT.js library (https://github.com/mqttjs/MQTT.js)
 */

const EasyCoder_MQTT = {

    name: `EasyCoder_MQTT`,

    mqttClauseKeywords: new Set(['token', 'id', 'broker', 'port', 'subscribe', 'action']),

    base64UrlToBytes: function(value) {
        const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
            + '='.repeat((4 - (value.length % 4)) % 4);
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let n = 0; n < binary.length; n++) {
            bytes[n] = binary.charCodeAt(n);
        }
        return bytes;
    },

    pkcs7Unpad: function(bytes) {
        if (!bytes || bytes.length === 0) {
            throw new Error('Invalid Fernet payload');
        }
        const pad = bytes[bytes.length - 1];
        if (pad < 1 || pad > 16 || pad > bytes.length) {
            throw new Error('Invalid Fernet padding');
        }
        for (let n = bytes.length - pad; n < bytes.length; n++) {
            if (bytes[n] !== pad) {
                throw new Error('Invalid Fernet padding');
            }
        }
        return bytes.slice(0, bytes.length - pad);
    },

    decryptFernetToken: async function(encryptedToken, key) {
        if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
            throw new Error('Fernet decryption requires browser Web Crypto support');
        }

        const tokenBytes = EasyCoder_MQTT.base64UrlToBytes(encryptedToken);
        const keyBytes = EasyCoder_MQTT.base64UrlToBytes(key);

        if (keyBytes.length !== 32) {
            throw new Error('Invalid Fernet key length');
        }
        if (tokenBytes.length < 1 + 8 + 16 + 32) {
            throw new Error('Invalid Fernet token length');
        }

        const version = tokenBytes[0];
        if (version !== 0x80) {
            throw new Error('Unsupported Fernet token version');
        }

        const signingKey = keyBytes.slice(0, 16);
        const encryptionKey = keyBytes.slice(16, 32);
        const hmacStart = tokenBytes.length - 32;
        const signedPart = tokenBytes.slice(0, hmacStart);
        const providedHmac = tokenBytes.slice(hmacStart);

        const hmacKey = await crypto.subtle.importKey(
            'raw',
            signingKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const valid = await crypto.subtle.verify('HMAC', hmacKey, providedHmac, signedPart);
        if (!valid) {
            throw new Error('Invalid Fernet signature');
        }

        const iv = tokenBytes.slice(1 + 8, 1 + 8 + 16);
        const ciphertext = tokenBytes.slice(1 + 8 + 16, hmacStart);

        const aesKey = await crypto.subtle.importKey(
            'raw',
            encryptionKey,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        let plainBytes;
        try {
            plainBytes = new Uint8Array(await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv },
                aesKey,
                ciphertext
            ));
        } catch (error) {
            throw new Error('Fernet decryption failed');
        }

        // Web Crypto AES-CBC already applies PKCS#7 unpadding.
        return new TextDecoder().decode(plainBytes);
    },

    // MQTT Client class
    MQTTClient: class {
        constructor() {
            this.program = null;
            this.token = null;
            this.clientID = null;
            this.broker = null;
            this.port = null;
            this.topics = [];
            this.client = null;
            this.onConnectPC = null;
            this.onMessagePC = null;
            this.onErrorPC = null;
            this.message = null;
            this.lastError = null;
            this.errorFired = false;
            this.chunkedMessages = {};  // Store incoming chunked messages
            this.chunkSize = 1024;      // Default chunk size
            this.lastSendTime = null;   // Time for last transmission
            this.connected = false;     // Ignore duplicate reconnect callbacks
        }

        create(program, token, clientID, broker, port, topics) {
            this.program = program;
            this.token = token;
            this.clientID = clientID;
            this.broker = broker;
            this.port = parseInt(port, 10);
            this.topics = topics || [];
            const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';

            let url;
            const options = {
                clientId: this.clientID
            };

            if (this.broker === 'mqtt.flespi.io') {
                const wsPort = this.port === 8883 ? 443 : this.port;
                url = isBrowser
                    ? `wss://${this.broker}:${wsPort}`
                    : `mqtts://${this.broker}:${this.port}`;
                options.username = this.token;
                options.password = '';
            } else if (this.broker === 'test.mosquitto.org') {
                url = isBrowser
                    ? `wss://${this.broker}:8081`
                    : `mqtt://${this.broker}:${this.port}`;
            } else {
                url = isBrowser
                    ? (this.port === 443 ? `wss://${this.broker}/mqtt` : `wss://${this.broker}:${this.port}`)
                    : `mqtts://${this.broker}:${this.port}`;
                if (this.token && typeof this.token === 'object') {
                    options.username = this.token.username;
                    options.password = this.token.password;
                }
            }

            this.client = mqtt.connect(url, options);

            // Setup event handlers
            this.client.on('connect', () => this.onConnect());
            this.client.on('message', (topic, payload) => this.onMessage(topic, payload));
            this.client.on('error', (error) => {
                console.error('MQTT connection error:', error);
                if (!this.errorFired) {
                    this.errorFired = true;
                    this.lastError = error.message || String(error);
                    this.client.end(true);
                    this._queueProgramCallback(this.onErrorPC);
                }
            });
            this.client.on('close', () => console.warn('MQTT connection closed'));
        }

        onConnect() {
            const isFirstConnect = !this.connected;
            this.connected = true;
            EasyCoder.writeToDebugConsole(`Client ${this.clientID} connected`);

            // Subscribe to all topics
            for (const topicName of this.topics) {
                const topicRecord = this.program.getSymbolRecord(topicName);
                const topic = topicRecord.object;
                const qos = topic.getQoS();
                this.client.subscribe(topic.getName(), { qos });
                EasyCoder.writeToDebugConsole(`Subscribed to topic: ${topic.getName()} with QoS ${qos}`);
            }

            if (isFirstConnect) {
                this._queueProgramCallback(this.onConnectPC);
            }
        }

        onMessage(topic, payload) {
            const payloadBytes = this._toUint8Array(payload);
            if (this._startsWithAscii(payloadBytes, '!part!')) {
                try {
                    const partEnd = this._indexByte(payloadBytes, 0x20, 6); // space
                    if (partEnd > 6) {
                        const partNum = this._parseAsciiInt(payloadBytes.slice(6, partEnd));
                        const totalEnd = this._indexByte(payloadBytes, 0x20, partEnd + 1);
                        if (totalEnd > partEnd) {
                            const totalChunks = this._parseAsciiInt(payloadBytes.slice(partEnd + 1, totalEnd));
                            const data = payloadBytes.slice(totalEnd + 1);

                            if (partNum === 0) {
                                this.chunkedMessages[topic] = {};
                            }

                            if (this.chunkedMessages[topic]) {
                                this.chunkedMessages[topic][partNum] = data;
                                // EasyCoder.writeToDebugConsole(`Received chunk ${partNum}/${totalChunks - 1} on topic ${topic}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing chunked message:', e);
                }
                return;
            }

            if (this._startsWithAscii(payloadBytes, '!last!')) {
                try {
                    const totalEnd = this._indexByte(payloadBytes, 0x20, 6); // space
                    if (totalEnd > 6) {
                        const totalChunks = this._parseAsciiInt(payloadBytes.slice(6, totalEnd));
                        const data = payloadBytes.slice(totalEnd + 1);

                        if (!this.chunkedMessages[topic]) {
                            this.chunkedMessages[topic] = {};
                        }

                        this.chunkedMessages[topic][totalChunks - 1] = data;

                        const expectedParts = new Set();
                        for (let i = 0; i < totalChunks; i++) {
                            expectedParts.add(i);
                        }
                        const receivedParts = new Set(Object.keys(this.chunkedMessages[topic]).map(k => parseInt(k)));

                        if (expectedParts.size === receivedParts.size &&
                            [...expectedParts].every(p => receivedParts.has(p))) {
                            const messageParts = [];
                            for (let i = 0; i < totalChunks; i++) {
                                messageParts.push(this.chunkedMessages[topic][i]);
                            }
                            const completeMessage = this._decodeUtf8(this._concatBytes(messageParts));
                            delete this.chunkedMessages[topic];

                            try {
                                this.message = JSON.parse(completeMessage);
                                try {
                                    this.message.message = JSON.parse(this.message.message);
                                } catch (e) {
                                }
                            } catch (e) {
                                this.message = completeMessage;
                            }

                            this._queueProgramCallback(this.onMessagePC);
                        } else {
                            console.warn('Warning: Missing chunks for topic ' + topic);
                        }
                    }
                } catch (e) {
                    console.error('Error assembling chunked message:', e);
                }
                return;
            }

            const message = this._decodeUtf8(payloadBytes);

            // Regular non-chunked message
            try {
                this.message = JSON.parse(message);
                try {
                    this.message.message = JSON.parse(this.message.message);
                } catch (e) {
                    // Leave message as string
                }
            } catch (e) {
                this.message = message;
            }

            this._queueProgramCallback(this.onMessagePC);
        }

        getReceivedMessage() {
            let value = this.message;
            value = value && value.message ? value.message : value;
            return value;
        }

        getError() {
            return this.lastError || '';
        }

        sendMessage(topic, message, qos, chunkSize) {
            const sendStart = Date.now();
            // Match Python behavior: non-positive chunk size means "single chunk"
            chunkSize = Number(chunkSize || 0);

            // Convert message to string
            let messageStr;
            if (message instanceof Uint8Array) {
                messageStr = this._decodeUtf8(message);
            } else if (typeof message === 'string') {
                messageStr = message;
            } else {
                messageStr = String(message);
            }

            // Convert to UTF-8 bytes
            const encoder = new TextEncoder();
            const messageBytes = encoder.encode(messageStr);
            if (chunkSize <= 0) {
                chunkSize = messageBytes.length || 1;
            }
            const messageLen = messageBytes.length;
            const numChunks = Math.ceil(messageLen / chunkSize);

            // EasyCoder.writeToDebugConsole(`Sending message (${messageLen} bytes) in ${numChunks} chunks of size ${chunkSize} to topic ${topic} with QoS ${qos}`);

            return this._sendRapidFire(topic, messageBytes, qos, chunkSize, numChunks)
                .then((ok) => {
                    this.lastSendTime = (Date.now() - sendStart) / 1000;
                    return ok;
                });
        }

        _sendRapidFire(topic, messageBytes, qos, chunkSize, numChunks) {
            const promises = [];
            for (let i = 0; i < numChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, messageBytes.length);
                const chunkData = messageBytes.slice(start, end);

                let header;
                if (i === numChunks - 1) {
                    header = `!last!${numChunks} `;
                } else {
                    header = `!part!${i} ${numChunks} `;
                }

                const headerBytes = new TextEncoder().encode(header);
                const chunkMsg = this._concatBytes([headerBytes, chunkData]);
                promises.push(new Promise((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error('PUBACK timeout')), 5000);
                    this.client.publish(topic, chunkMsg, { qos }, (err) => {
                        clearTimeout(timer);
                        if (err) reject(err);
                        else resolve(true);
                    });
                }));
                // EasyCoder.writeToDebugConsole(`Sent chunk ${i}/${numChunks - 1} to topic ${topic} with QoS ${qos}: ${chunkMsg.byteLength} bytes`);
            }
            return Promise.all(promises).then(() => true).catch(() => false);
        }

        _toUint8Array(value) {
            if (value instanceof Uint8Array) {
                return value;
            }
            if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
                return new Uint8Array(value);
            }
            if (typeof value === 'string') {
                return new TextEncoder().encode(value);
            }
            if (value && value.buffer instanceof ArrayBuffer) {
                return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || 0);
            }
            return new Uint8Array(0);
        }

        _decodeUtf8(bytes) {
            return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        }

        _concatBytes(parts) {
            const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
            const merged = new Uint8Array(total);
            let offset = 0;
            for (const part of parts) {
                merged.set(part, offset);
                offset += part.byteLength;
            }
            return merged;
        }

        _startsWithAscii(bytes, text) {
            const ascii = new TextEncoder().encode(text);
            if (bytes.byteLength < ascii.byteLength) {
                return false;
            }
            for (let i = 0; i < ascii.byteLength; i++) {
                if (bytes[i] !== ascii[i]) {
                    return false;
                }
            }
            return true;
        }

        _indexByte(bytes, byteValue, fromIndex) {
            for (let i = fromIndex; i < bytes.byteLength; i++) {
                if (bytes[i] === byteValue) {
                    return i;
                }
            }
            return -1;
        }

        _parseAsciiInt(bytes) {
            const parsed = parseInt(new TextDecoder('ascii').decode(bytes), 10);
            if (Number.isNaN(parsed)) {
                throw new Error('Invalid numeric header');
            }
            return parsed;
        }

        _queueProgramCallback(pc) {
            if (pc === null || pc === undefined) {
                return;
            }
            if (this.program && typeof this.program.queueIntent === 'function') {
                this.program.queueIntent(pc);
                return;
            }
            if (this.program && typeof this.program.run === 'function') {
                this.program.run(pc);
            }
        }
    },

    // ECTopic class - represents an MQTT topic
    ECTopic: class {
        constructor() {
            this.value = null;
        }

        setValue(value) {
            this.value = value;
        }

        getValue() {
            return this.value;
        }

        getName() {
            if (!this.value) return '';
            return this.value.name || '';
        }

        getQoS() {
            if (!this.value) return 0;
            return parseInt(this.value.qos) || 0;
        }

        textify() {
            if (!this.value) return '';
            return JSON.stringify({
                name: this.value.name,
                qos: this.value.qos
            });
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: init {topic} name {name} qos {qos}
    Init: {
        compile: compiler => {
            const lino = compiler.getLino();
            if (compiler.nextIsSymbol()) {
                const record = compiler.getSymbolRecord();
                const topic = record.name;
                compiler.skip('name');
                const name = compiler.getValue();
                compiler.skip('qos');
                const qos = compiler.getValue();

                compiler.addCommand({
                    domain: 'mqtt',
                    keyword: 'init',
                    lino,
                    topic,
                    name,
                    qos
                });
                return true;
            }
            return false;
        },

        run: program => {
            const command = program[program.pc];
            const record = program.getSymbolRecord(command.topic);
            const topic = new EasyCoder_MQTT.ECTopic();
            const value = {
                name: program.getValue(command.name),
                qos: parseInt(program.getValue(command.qos))
            };
            topic.setValue(value);
            record.object = topic;
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: mqtt token {token} [{secretKey}] id {clientID} broker {broker} port {port} subscribe {topic} [and {topic} ...]
    MQTT: {
        compile: compiler => {
            const lino = compiler.getLino();
            const command = {
                domain: 'mqtt',
                keyword: 'mqtt',
                lino,
                requires: {},
                topics: []
            };

            compiler.nextToken(); // skip 'mqtt'
            while (true) {
                const token = compiler.getToken();
                if (token === 'token') {
                    command.token = compiler.getNextValue();
                    if (!EasyCoder_MQTT.mqttClauseKeywords.has(compiler.getToken())) {
                        command.tokenKey = compiler.getValue();
                    }
                } else if (token === 'id') {
                    command.clientID = compiler.getNextValue();
                } else if (token === 'broker') {
                    command.broker = compiler.getNextValue();
                } else if (token === 'port') {
                    command.port = compiler.getNextValue();
                } else if (token === 'subscribe') {
                    const topics = [];
                    while (compiler.nextIsSymbol()) {
                        const record = compiler.getSymbolRecord();
                        topics.push(record.name);
                        if (compiler.peek() === 'and') {
                            compiler.next();
                        } else {
                            compiler.next();
                            break;
                        }
                    }
                    command.topics = topics;
                } else if (token === 'action') {
                    const action = compiler.nextToken();
                    const reqList = [];
                    if (compiler.nextIs('requires')) {
                        while (true) {
                            reqList.push(compiler.nextToken());
                            if (compiler.peek() === 'and') {
                                compiler.next();
                            } else {
                                compiler.next();
                                break;
                            }
                        }
                    }
                    command.requires[action] = reqList;
                } else {
                    break;
                }
            }

            compiler.addCommand(command);
            return true;
        },

        run: program => {
            const command = program[program.pc];

            if (program.mqttClient) {
                program.runtimeError(command.lino, 'MQTT client already defined');
            }

            const clientID = program.getValue(command.clientID);
            const broker = program.getValue(command.broker);
            const port = program.getValue(command.port);
            const topics = command.topics;

            const finalizeClient = token => {
                const client = new EasyCoder_MQTT.MQTTClient();
                try {
                    client.create(program, token, clientID, broker, port, topics);
                } catch (error) {
                    program.runtimeError(command.lino, error.message || String(error));
                    return false;
                }
                program.mqttClient = client;
                program.mqttRequires = command.requires;
                return true;
            };

            const tokenValue = program.getValue(command.token);
            if (command.tokenKey) {
                const tokenKey = program.getValue(command.tokenKey);
                if (broker === 'mqtt.flespi.io') {
                    EasyCoder_MQTT.decryptFernetToken(tokenValue, tokenKey)
                        .then(plainToken => {
                            if (finalizeClient(plainToken)) {
                                program.run(command.pc + 1);
                            }
                        })
                        .catch(error => {
                            program.runtimeError(command.lino, error.message || String(error));
                        });
                    return 0;
                } else {
                    if (!finalizeClient({ username: tokenValue, password: tokenKey })) {
                        return 0;
                    }
                    return command.pc + 1;
                }
            }

            if (!finalizeClient(tokenValue)) {
                return 0;
            }
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: on mqtt (connect|message) {action}
    On: {
        compile: compiler => {
            const lino = compiler.getLino();
            const token = compiler.peek();

            if (token === 'mqtt') {
                compiler.next();
                const event = compiler.nextToken();

                if (event === 'connect' || event === 'message' || event === 'error') {
                    compiler.next();

                    const command = {
                        domain: 'mqtt',
                        keyword: 'on',
                        lino,
                        event,
                        goto: 0
                    };
                    compiler.addCommand(command);
				    return compiler.completeHandler();
                }
            }
            return false;
        },

        run: program => {
            const command = program[program.pc];
            const event = command.event;

            if (!program.mqttClient) {
                program.runtimeError(command.lino, 'No MQTT client defined');
            }

            if (event === 'connect') {
                program.mqttClient.onConnectPC = command.pc + 2;
            } else if (event === 'message') {
                program.mqttClient.onMessagePC = command.pc + 2;
            } else if (event === 'error') {
                program.mqttClient.onErrorPC = command.pc + 2;
            }

            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: send mqtt {message} to {topic} [with qos {qos}] [sender {sender}] [action {action}] [message {message}]
    Send: {
        compile: compiler => {
            const lino = compiler.getLino();
            const command = {
                domain: 'mqtt',
                keyword: 'send',
                lino,
                qos: 1  // default QoS
            };

            // First check for "send mqtt" or "send to"
            if (compiler.nextTokenIs('to')) {
                if (compiler.nextIsSymbol()) {
                    const record = compiler.getSymbolRecord();
                    command.to = record.name;
                    compiler.nextToken()

                    // Parse optional parameters
                    while (true) {
                        const token = compiler.getToken();
                        if (token === 'sender' || token === 'action' ||
                            token === 'qos' || token === 'message' ||
                            token === 'giving') {

                            if (token === 'sender') {
                                if (compiler.nextIsSymbol()) {
                                    const rec = compiler.getSymbolRecord();
                                    command.sender = rec.name;
                                    compiler.nextToken();
                                }
                            } else if (token === 'action') {
                                command.action = compiler.getNextValue();
                            } else if (token === 'qos') {
                                command.qos = compiler.getNextValue();
                            } else if (token === 'message') {
                                command.message = compiler.getNextValue();
                            } else if (token === 'giving') {
                                if (compiler.nextIsSymbol()) {
                                    const rec = compiler.getSymbolRecord();
                                    command.giving = rec.name;
                                    compiler.next();
                                }
                            }
                        } else {
                            break;
                        }
                    }

                    compiler.addCommand(command);
                    return true;
                }
            } else {
                // Format: send mqtt {message} to {topic}
                command.message = compiler.getNextValue();
                compiler.skip('to');

                if (compiler.nextIsSymbol()) {
                    const record = compiler.getSymbolRecord();
                    command.to = record.name;

                    const token = compiler.peek();
                    if (token === 'with') {
                        compiler.next();
                        while (true) {
                            const tok = compiler.nextToken();
                            if (tok === 'qos') {
                                command.qos = compiler.getNextValue();
                            }
                            if (compiler.peek() === 'and') {
                                compiler.next();
                            } else {
                                break;
                            }
                        }
                    }

                    compiler.addCommand(command);
                    return true;
                }
            }

            return false;
        },

        run: program => {
            const command = program[program.pc];
            if (!program.mqttClient) {
                program.runtimeError(command.lino, 'No MQTT client defined');
            }

            const topicRecord = program.getSymbolRecord(command.to);
            const topic = topicRecord.object;
            const qos = command.qos ? parseInt(program.getValue(command.qos)) : 1;

            // Build payload
            const payload = {};

            if (command.sender) {
                const senderRecord = program.getSymbolRecord(command.sender);
                payload.sender = senderRecord.object.textify();
            }

            payload.action = command.action ? program.getValue(command.action) : null;
            payload.message = command.message ? program.getValue(command.message) : null;

            // Validate required fields
            if (!payload.action) {
                program.runtimeError(command.lino, 'MQTT send command missing action field');
            }

            // Check action requirements
            if (program.mqttRequires && program.mqttRequires[payload.action]) {
                const requires = program.mqttRequires[payload.action];
                for (const item of requires) {
                    if (!payload[item]) {
                        program.runtimeError(command.lino, `MQTT send command missing required field: ${item}`);
                    }
                }
            }

            const topicName = topic.getName();
            // EasyCoder.writeToDebugConsole(`MQTT Publish to ${topicName} with QoS ${qos}: ${JSON.stringify(payload)}`);
            if (command.giving) {
                // Async: wait for broker acknowledgment
                program.mqttClient.sendMessage(topicName, JSON.stringify(payload), qos, 1024)
                    .then((ok) => {
                        const target = program.getSymbolRecord(command.giving);
                        target.value[target.index] = {
                            type: 'boolean',
                            content: ok
                        };
                        program.run(command.pc + 1);
                    })
                    .catch(() => {
                        const target = program.getSymbolRecord(command.giving);
                        target.value[target.index] = {
                            type: 'boolean',
                            content: false
                        };
                        program.run(command.pc + 1);
                    });
                return 0;
            } else {
                // Fire-and-forget: don't wait for PUBACK
                program.mqttClient.sendMessage(topicName, JSON.stringify(payload), qos, 1024);
                return command.pc + 1;
            }
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: topic {name}
    Topic: {
        compile: compiler => {
			compiler.compileVariable(`mqtt`, `topic`);
			return true;
        },

        run: program => {
            const command = program[program.pc];
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Value handlers
    value: {
        compile: compiler => {
            let token = compiler.getToken();

            if (token === 'the') {
                token = compiler.nextToken();
            }

            if (compiler.isSymbol()) {
                const record = compiler.getSymbolRecord();
                if (record.object && record.object instanceof EasyCoder_MQTT.ECTopic) {
                    return {
                        domain: 'mqtt',
                        type: 'topic',
                        content: record.name
                    };
                }
            } else if (token === 'mqtt') {
                token = compiler.nextToken();
                if (token === 'message') {
                    compiler.nextToken();
                    return {
                        domain: 'mqtt',
                        type: 'mqtt',
                        content: 'message'
                    };
                } else if (token === 'error') {
                    compiler.nextToken();
                    return {
                        domain: 'mqtt',
                        type: 'mqtt',
                        content: 'error'
                    };
                }
            }

            return null;
        },

        get: (program, value) => {
            if (value.type === 'mqtt') {
                if (value.content === 'message') {
                    const message = program.mqttClient ? program.mqttClient.getReceivedMessage() : null;
                    let content = '';
                    if (typeof message === 'string') {
                        content = message;
                    } else if (message === null || typeof message === 'undefined') {
                        content = '';
                    } else {
                        try {
                            content = JSON.stringify(message, null, 2);
                        } catch (error) {
                            content = String(message);
                        }
                    }
                    return {
                        type: 'constant',
                        numeric: false,
                        content
                    };
                } else if (value.content === 'error') {
                    const content = program.mqttClient ? program.mqttClient.getError() : '';
                    return {
                        type: 'constant',
                        numeric: false,
                        content
                    };
                }
            } else if (value.type === 'topic') {
                const record = program.getSymbolRecord(value.content);
                const topic = record.object;
                return {
                    type: 'constant',
                    numeric: false,
                    content: topic.textify()
                };
            }
            return null;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Condition handlers
    condition: {
        compile: () => {
            return {};
        },

        test: () => {
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Dispatcher - routes keywords to handlers
    getHandler: (name) => {
        switch (name) {
            case 'init':
                return EasyCoder_MQTT.Init;
            case 'mqtt':
                return EasyCoder_MQTT.MQTT;
            case 'on':
                return EasyCoder_MQTT.On;
            case 'send':
                return EasyCoder_MQTT.Send;
            case 'topic':
                return EasyCoder_MQTT.Topic;
            default:
                return null;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Main compile handler
    compile: (compiler) => {
        const token = compiler.getToken();
        const handler = EasyCoder_MQTT.getHandler(token);

        if (!handler) {
            return false;
        }

        return handler.compile(compiler);
    },

    /////////////////////////////////////////////////////////////////////////////
    // Main run handler
    run: (program) => {
        const command = program[program.pc];
        const handler = EasyCoder_MQTT.getHandler(command.keyword);

        if (!handler) {
            program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'mqtt' package`);
        }

        return handler.run(program);
    }
};
const EasyCoder_REST = {

	name: `EasyCoder_REST`,

	Get: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			return EasyCoder_REST.Rest.compileRequest(compiler, `get`, lino);
		},

		run: (program) => {
			return EasyCoder_REST.Rest.run(program);
		}
	},

	Post: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			return EasyCoder_REST.Rest.compileRequest(compiler, `post`, lino);
		},

		run: (program) => {
			return EasyCoder_REST.Rest.run(program);
		}
	},

	Rest: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const request = compiler.nextToken();
			return EasyCoder_REST.Rest.compileRequest(compiler, request, lino);
		},

		compileRequest: (compiler, request, lino) => {
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
				EasyCoder_REST.restPath = program.getValue(command.path);
				return command.pc + 1;
			}
			const url = program.getValue(command.url);
			if (!EasyCoder_REST.restPath) {
				EasyCoder_REST.restPath = `.`;
			}
			let path = url;
			if (!url.startsWith(`http`)) {
				if (url[0] == `/`) {
					if (command.request === `post`) {
						const hostname = window.location.hostname;
						if (hostname !== `localhost` && hostname !== `127.0.0.1`) {
							const error = `REST POST to same-origin endpoints is disabled in static hosting mode`;
							if (command.onError) {
								program.errorMessage = error;
								program.run(command.onError);
								return 0;
							}
							program.runtimeError(command.lino, error);
							return 0;
						}
					}
					path = `${window.location.origin}${url}`;
				} else {
					if (command.request === `post`) {
						const error = `Relative REST POST endpoints are disabled in static hosting mode`;
						if (command.onError) {
							program.errorMessage = error;
							program.run(command.onError);
							return 0;
						}
						program.runtimeError(command.lino, error);
						return 0;
					}
					path = url;
				}
			}

			// Cache-busting for GET requests (helps Android WebView)
			if (command.request === `get` && EasyCoder.noCache) {
				const separator = path.includes(`?`) ? `&` : `?`;
				path += `${separator}_ec=${Date.now()}`;
			}

			const request = EasyCoder_REST.Rest.createCORSRequest(command.request, path);
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
				EasyCoder.writeToDebugConsole(`POST to ${path}`);
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
		case `get`:
			return EasyCoder_REST.Get;
		case `post`:
			return EasyCoder_REST.Post;
		case `rest`:
			return EasyCoder_REST.Rest;
		default:
			return null;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_REST.getHandler(command.keyword);
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

		// Character extraction: char N of Value / character N of Value
		if ([`char`, `character`].includes(token)) {
			const index = compiler.getNextValue();
			if (compiler.tokenIs(`of`)) {
				const value = compiler.getNextValue();
				return {
					domain: `core`,
					type: `char`,
					index,
					value
				};
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
			if (typeof value === `number`) {
				value = {
					type: `numeric`,
					content: value
				};
			} else if (typeof value === `string` && value.length === 1) {
				value = {
					type: `char`,
					content: value
				};
			} else {
				program.runtimeError(program[program.pc].lino, `Undefined value (variable not initialized?)`);
				return null;
			}
		}
		const type = value.type;
		switch (type) {
		case `numeric`:
			return {
				type: `constant`,
				numeric: true,
				content: value.content
			};
		case `char`:
			if (!value.domain) {
				return {
					type: `constant`,
					numeric: false,
					content: value.content
				};
			}
			break;
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
		if (typeof pc === `undefined` || pc === null) {
			return;
		}

		// While tracer is paused, suppress only periodic `every` callbacks.
		// Other async continuations (e.g. attach completion) must still resume.
		if (
			program.tracing &&
			typeof program.resume !== `undefined` &&
			pc !== program.resume &&
			program.everyCallbacks &&
			program.everyCallbacks[pc]
		) {
			return;
		}

		if (!program.runQueue) {
			program.runQueue = [];
		}
		if (typeof program.runningQueue === `undefined`) {
			program.runningQueue = false;
		}
		const queue = program.runQueue;

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

		if (program.runningQueue) {
			queue.push(pc);
			return;
		}
		program.runningQueue = true;
		program.register(program);
		queue.push(pc);
		if (!program.tracing && program.intentQueue && program.intentQueue.length > 0) {
			while (program.intentQueue.length > 0) {
				queue.push(program.intentQueue.shift());
			}
		}
		try {
			while (queue.length > 0) {
				let pausedForTrace = false;
				program.pc = queue.shift();
				program.watchdog = 0;
				while (program.running) {
				const activeCommand = program[program.pc];
				if (activeCommand && activeCommand.lino) {
					program.lastLino = activeCommand.lino;
				}
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
					const lino = program[program.pc].lino;
					let line = '';
					try {
						line = program.source.scriptLines[lino - 1].line;
					}
					catch (e) {
					}
					EasyCoder.writeToDebugConsole(`${program.script}: Line ${lino}: `
					+ `${domain}:${program[program.pc].keyword} - ${line}`);
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
					const displayLino = command && command.lino ? command.lino : (program.lastLino || 0);
					const tracer = document.getElementById(`easycoder-tracer`);
					if (!tracer) {
						program.runtimeError(command.lino, `Element 'easycoder-tracer' was not found`);
						return;
					}
					tracer.style.display = `block`;
					tracer.style.visibility = `visible`;
					var variables = ``;
					if (program.tracer) {
						// Drop stale callbacks so step resumes from the traced instruction path.
						queue.length = 0;
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
								if (displayLino && scriptLines[displayLino - n]) {
									const text = scriptLines[displayLino - n].line.substr(minSpace);
									trace += `<input type="text" name="${n}"` +
								  `value="${displayLino - n + 1}: ${text.split(`\\s`).join(` `)}"` +
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
										EasyCoder.writeToDebugConsole(message);
									alert(message);
								}
							};

							step.onclick = function () {
									EasyCoder.writeToDebugConsole(`step`);
								step.blur();
								program.tracing = true;
								const content = document.getElementById(`easycoder-tracer-content`);
								content.style.display = `block`;
								try {
									EasyCoder_Run.run(program, program.resume);
								} catch (err) {
									const message = `Error in step handler: ` + err.message;
										EasyCoder.writeToDebugConsole(message);
									alert(message);
								}
							};
						}

						program.resume = program.pc;
						program.pc = 0;
					}
					pausedForTrace = true;
					break;
				}
				}
				if (pausedForTrace) {
					break;
				}
			}
		} finally {
			program.runningQueue = false;
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

	rewindto: function(index) {
		this.rewindTo(index);
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
		EasyCoder.writeToDebugConsole(`No handler found`);
		const lino = this.getLino() + 1;
		if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token) && !(token in this.symbols)) {
			throw new Error(`Unknown symbol or keyword '${token}' at line ${lino}`);
		}
		throw new Error(`I don't understand '${token}...' at line ${lino}`);
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
				EasyCoder.writeToDebugConsole(`Symbol '${record.name}' has not been used.`);
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
		json: EasyCoder_JSON,
		rest: EasyCoder_REST,
		mqtt: EasyCoder_MQTT
	},

	elementId: 0,
	attachWaitMs: 3000,
	timingEnabled: false,
	startupTraceCache: null,

	isStartupTraceEnabled: function () {
		if (this.startupTraceCache !== null) {
			return this.startupTraceCache;
		}
		let enabled = false;
		try {
			const params = new URLSearchParams(window.location.search);
			if (params.has(`easycoderStartupTrace`)) {
				const value = (params.get(`easycoderStartupTrace`) || ``).toLowerCase();
				enabled = value === `1` || value === `true`;
				this.startupTraceCache = enabled;
				return enabled;
			}
			const stored = window.localStorage ? window.localStorage.getItem(`easycoder.startupTrace`) : null;
			if (stored !== null) {
				const value = stored.toLowerCase();
				enabled = value === `1` || value === `true`;
			}
		} catch (err) {
			enabled = false;
		}
		this.startupTraceCache = enabled;
		return enabled;
	},

	writeStartupTrace: function (message) {
		if (this.isStartupTraceEnabled()) {
			this.writeToDebugConsole(message);
		}
	},

	getDebugConsoleElement: function () {
		const host = document.getElementById(`stuff`);
		let debugConsole = document.getElementById(`easycoder-debug-console`);
		if (host) {
			if (!debugConsole || debugConsole.parentElement !== host) {
				if (debugConsole && debugConsole.parentElement) {
					debugConsole.parentElement.removeChild(debugConsole);
				}
				debugConsole = document.createElement(`pre`);
				debugConsole.id = `easycoder-debug-console`;
				debugConsole.style.display = `none`;
				host.appendChild(debugConsole);
			}
			debugConsole.style.display = `none`;
			return debugConsole;
		}
		if (debugConsole) {
			debugConsole.style.display = `none`;
			return debugConsole;
		}
		if (!document.body) {
			return null;
		}
		debugConsole = document.createElement(`pre`);
		debugConsole.id = `easycoder-debug-console`;
		debugConsole.style.display = `none`;
		document.body.appendChild(debugConsole);
		return debugConsole;
	},

	writeToDebugConsole: function (message) {
		const params = new URLSearchParams(window.location.search);
		let usePageDebugConsole = params.get(`pageDebugConsole`) === `1`;
		if (!usePageDebugConsole) {
			try {
				const stored = window.localStorage ? window.localStorage.getItem(`easycoder.pageDebugConsole`) : null;
				usePageDebugConsole = stored === `1` || stored === `true`;
			} catch (err) {
				usePageDebugConsole = false;
			}
		}
		if (usePageDebugConsole) {
			const debugConsole = this.getDebugConsoleElement();
			if (debugConsole) {
				const prefix = debugConsole.textContent && debugConsole.textContent.length ? `\n` : ``;
				debugConsole.textContent += `${prefix}${message}`;
				debugConsole.scrollTop = debugConsole.scrollHeight;
				return;
			}
		}
		console.log(message);
	},

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
			EasyCoder.writeToDebugConsole(`An error occurred - origin was ${err.path[0]}`);
			return;
		}
		if (!this.compiling && !program) {
			const errString = `Error: ${err.message}`;
			alert(errString);
			EasyCoder.writeToDebugConsole(errString);
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
		EasyCoder.writeToDebugConsole(errString);
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
		if (v.content === null || typeof v.content === `undefined`) {
			return ``;
		}
		if (typeof v.content === `object`) {
			try {
				return JSON.stringify(v.content, null, 2);
			} catch (err) {
				return String(v.content);
			}
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
		if (typeof pc !== `undefined` && pc !== null) {
			this.program = this;
			EasyCoder_Run.run(this, pc);
		}
	},

	queueIntent: function (pc) {
		if (typeof pc === `undefined` || pc === null) {
			return;
		}
		if (this.tracing) {
			if (!this.intentQueue) {
				this.intentQueue = [];
			}
			if (!this.intentQueue.includes(pc)) {
				this.intentQueue.push(pc);
			}
			return;
		}
		this.run(pc);
	},

	exit: function () {
		EasyCoder_Run.exit(this);
	},

	register: (program) => {
		this.program = program;
	},

	require: function(type, src, cb) {
		let resolvedSrc = src[0] === `/`
			? `${window.location.origin}${src}`
			: src;
		if (EasyCoder.noCache) {
			const separator = resolvedSrc.includes(`?`) ? `&` : `?`;
			resolvedSrc += `${separator}_ec=${Date.now()}`;
		}
		const element = document.createElement(type === `css` ? `link` : `script`);
		switch (type) {
		case `css`:
			element.type = `text/css`;
			element.href = resolvedSrc;
			element.rel = `stylesheet`;
			break;
		case `js`:
			element.type = `text/javascript`;
			element.src = resolvedSrc;
			break;
		default:
			return;
		}
		element.onload = function () {
			EasyCoder.writeToDebugConsole(`${Date.now() - EasyCoder.timestamp} ms: Library ${resolvedSrc} loaded`);
			cb();
		};
		document.head.appendChild(element);
	},

	isUndefined: item => {
		return typeof item === `undefined`;
	},

	isJsonString: function (str) {
		if (typeof str !== `string` || str.length === 0) {
			return false;
		}
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
		program.queueIntent = this.queueIntent;
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
			EasyCoder.writeToDebugConsole(`${finishCompile - this.timestamp} ms: ` +
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
		EasyCoder.restPath = `.`;
		EasyCoder.noCache = false;
		
		EasyCoder.scriptIndex = 0;
		const script = source.split(`\n`);
		EasyCoder.writeStartupTrace(`EasyCoder.start invoked (${script.length} source lines)`);
		if (!this.tokenising) {
			try {
				this.tokeniseAndCompile(script);
				EasyCoder.writeStartupTrace(`tokeniseAndCompile completed`);
			} catch (err) {
				this.reportError(err, null, source);
			}
			this.tokenising = true;
		}
	},
};
EasyCoder.version = `250824`;
EasyCoder.timestamp = Date.now();
EasyCoder.writeStartupTrace(`EasyCoder loaded; waiting for page`);

function EasyCoder_Startup() {
	EasyCoder.writeStartupTrace(`window.onload fired`);
	EasyCoder.writeStartupTrace(`${Date.now() - EasyCoder.timestamp} ms: Start EasyCoder`);
	EasyCoder.timestamp = Date.now();
	EasyCoder.scripts = {};
	window.EasyCoder = EasyCoder;
	const script = document.getElementById(`easycoder-script`);
	if (script) {
		EasyCoder.writeStartupTrace(`Found #easycoder-script (${script.innerText.split(`\n`).length} lines)`);
		script.style.display = `none`;
		try {
			EasyCoder.writeStartupTrace(`Calling EasyCoder.start`);
			EasyCoder.start(script.innerText);
			EasyCoder.writeStartupTrace(`EasyCoder.start returned`);
		}
		catch (err) {
			EasyCoder.reportError(err);
		}
	} else {
		EasyCoder.writeStartupTrace(`No #easycoder-script element found`);
	}
}

// For browsers
window.onload = EasyCoder_Startup;
