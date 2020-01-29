// eslint-disable-next-line no-unused-vars
const EasyCoder_Compare = (program, value1, value2) => {

	const val1 = program.value.evaluate(program, value1);
	const val2 = program.value.evaluate(program, value2);
	var v1 = val1.content;
	var v2 = val2.content;
	if (v1 && val1.numeric) {
		if (!val2.numeric) {
			v2 = (v2 === `` || typeof v2 === `undefined`) ? 0 : parseInt(v2);
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
		const pc = this.program.length;
		this.program.push({
			pc,
			...item
		});
	},

	addSymbol: function(name, pc) {
		this.symbols[name] = {
			pc
		};
	},

	mark: function() {
		this.savedMark = this.index;
	},

	rewind: function() {
		this.index = this.savedMark;
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
		// Add a 'stop'
		this.addCommand({
			domain: `core`,
			keyword: `stop`,
			lino,
			next: 0
		});
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
		this.mark();
		for (const domainName of Object.keys(this.domain)) {
			//      console.log(`Try domain ${domainName} for token ${token}`);
			const domain = this.domain[domainName];
			if (domain) {
				const handler = domain.getHandler(token);
				if (handler) {
					if (handler.compile(this)) {
						return;
					}
				}
			}
			this.rewind();
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
// eslint-disable-next-line no-unused-vars
const EasyCoder_Condition = {

	name: `EasyCoder_Condition`,

	compile: (compiler) => {
		// See if any of the domains can handle it
		compiler.mark();
		for (const domainName of Object.keys(compiler.domain)) {
			// console.log(`Try domain '${domainName}' for condition`);
			const domain = compiler.domain[domainName];
			const code = domain.condition.compile(compiler);
			if (code) {
				return {
					domain: name,
					...code
				};
			}
			compiler.rewind();
		}
	},

	// runtime

	test: (program, condition) => {
		const handler = program.domain[condition.domain];
		return handler.condition.test(program, condition);
	}
};
const EasyCoder_Core = {

	name: `EasyCoder_Core`,

	Add: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			// Get the (first) value
			const value1 = compiler.getValue();
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
			} else if (compiler.tokenIs(`step`)) {
				compiler.next();
				compiler.addCommand({
					domain: `core`,
					keyword: `debug`,
					lino,
					item: `step`
				});
				return true;
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
			var target;
			if (compiler.nextIsSymbol()) {
				// It may be the target
				const symbol = compiler.getSymbol();
				target = compiler.getCommandAt(symbol.pc).name;
			}
			// Get the value even if we have a target
			const value1 = compiler.getValue();
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
			program.exit();
			if (parent) {
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
				program.stack.push(program.pc + 1);
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

	Load: {

		compile: compiler => {
			const lino = compiler.getLino();
			const type = compiler.nextToken();
			switch (type) {
			case `plugin`:
				const name = compiler.getNextValue();
				compiler.addCommand({
					domain: `core`,
					keyword: `load`,
					lino,
					name
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const name = program.getValue(command.name);
			switch (command.keyword) {
			case `load`:
				if (program.checkPlugin(name)) {
					return command.pc + 1;
				}
				EasyCoder_Plugins.getLocalPlugin(
					program.getPluginsPath,
					name,
					program.getPlugin,
					program.addLocalPlugin,
					function () {
						program.run(command.pc + 1);
					});
				return 0;
			}
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
			var target;
			if (compiler.isSymbol()) {
				// It may be the target
				const symbol = compiler.getSymbol();
				target = compiler.getCommandAt(symbol.pc).name;
			}
			// Get the value even if we have a target
			const value1 = compiler.getValue();
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
			const content = value.split(original).join(replacement);
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
			return program.stack.pop();
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
			if (EasyCoder.scripts[program.script]) {
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
					compiler.next();
					const value = [];
					while (true) {
						compiler.mark();
						try {
							value.push(compiler.getValue());
						} catch (err) {
							compiler.rewind();
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
				symbol.index = 0;
				if (symbol.elements > oldCount) {
					for (var n = oldCount; n < symbol.elements; n++) {
						symbol.value.push({});
						symbol.element.push({});
					}
				} else {
					symbol.value = symbol.value.slice(0, symbol.elements);
					symbol.element = symbol.element.slice(0, symbol.elements);
				}
				break;
			case `setElement`:
				targetRecord = program.getSymbolRecord(command.target);
				const index = program.getValue(command.index);
				const elements = JSON.parse(program.getValue(targetRecord.value[targetRecord.index]));
				const value = program.getValue(command.value);
				elements[index] = JSON.parse(value);
				targetRecord.value[targetRecord.index].content = JSON.stringify(elements);
				break;
			case `setProperty`:
				targetRecord = program.getSymbolRecord(command.target);
				let targetValue = program.getValue(targetRecord.value[targetRecord.index]);
				if (!targetValue) {
					targetValue = `{}`;
				}
				let targetJSON = ``;
				try {
					targetJSON = JSON.parse(targetValue);
				} catch (err) {
					program.runtimeError(command.lino, `Can't parse ${targetRecord.name}`);
					return 0;
				}
				const itemName = program.getValue(command.name);
				const itemValue = program.evaluate(command.value);
				if (itemValue) {
					if (itemValue.content instanceof Array) {
						targetJSON[itemName] = itemValue.content;
					} else if (itemValue.type === `boolean`) {
						targetJSON[itemName] = itemValue.content;
					} else if (itemValue.numeric) {
						targetJSON[itemName] = itemValue.content;
					// } else if (itemValue.content.substr(0, 2) === `{"`) {
					} else if ([`["`, `{"`].includes(itemValue.content.substr(0, 2))) {
						targetJSON[itemName] = JSON.parse(itemValue.content);
					} else {
						targetJSON[itemName] = itemValue.content.split(`"`).join(`\\"`);
					}
					targetRecord.value[targetRecord.index] = {
						type: `constant`,
						numeric: false,
						content: JSON.stringify(targetJSON)
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
			const value1 = compiler.getValue();
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
		case `load`:
			return EasyCoder_Core.Load;
		case `module`:
			return EasyCoder_Core.Module;
		case `multiply`:
			return EasyCoder_Core.Multiply;
		case `negate`:
			return EasyCoder_Core.Negate;
		case `on`:
			return EasyCoder_Core.On;
		case `print`:
			return EasyCoder_Core.Print;
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
		case `take`:
			return EasyCoder_Core.Take;
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
			if ([`now`, `today`, `newline`, `break`, `empty`].includes(token)) {
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
			if ([`encode`, `decode`, `lowercase`, `hash`].includes(token)) {
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
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			const type = compiler.getToken();
			switch (type) {
			case `elements`:
				if (compiler.nextTokenIs(`of`)) {
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
				compiler.next();
				return {
					domain: `core`,
					type
				};
			}
			return null;
		},

		get: (program, value) => {
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
							numeric: true,
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
				return {
					type: `constant`,
					numeric: true,
					content: Math.floor(Date.now() / 1000)
				};
			case `today`:
				const date = new Date();
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
			case `break`:
				return {
					type: `constant`,
					numeric: false,
					content: `<br />`
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
				var content = ``;
				if (property && propertyContent) {
					if (typeof propertyContent === `object`) {
						content = propertyContent[property];
					} else if (propertyContent.charAt(0) === `{`) {
						try {
							content = JSON.parse(propertyContent)[property];
						} catch (err) {
							console.log(`Can't parse '${propertyContent}': ${err.message}`);
						}
					}
				}
				return {
					type: `constant`,
					numeric: !isNaN(content),
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
			}
			return null;
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
						compiler.next();
						if (compiler.tokenIs(`than`)) {
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
						compiler.next();
						if (compiler.tokenIs(`than`)) {
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
			case `not`:
				return !program.getValue(condition.value);
			case `moduleRunning`:
				const running = program.getSymbolRecord(condition.name).program;
				return condition.sense ? running : !running;
			case `includes`:
				const value1 = JSON.parse(program.getValue(condition.value1));
				const value2 = program.getValue(condition.value2);
				return value1.includes(value2);
			}
			return false;
		}
	}
};
const EasyCoder = {

	name: `EasyCoder_Main`,

	domain: {
		core: EasyCoder_Core
	},

	runtimeError: function (lino, message) {
		this.lino = lino;
		this.reportError({
			message: `Line ${(lino >= 0) ? lino : ``}: ${message}`
		}, this.program);
		this.program.aborted = true;
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
		// const compiler = EasyCoder_Compiler;
		const {
			tokens,
			scriptLines
		} = source ? source : program.source;
		const lino = this.compiling ? tokens[EasyCoder_Compiler.getIndex()].lino : program[program.pc].lino;
		var errString = this.compiling ? `Compile error` : `Runtime error in '${program.script}'`;
		errString += `:\n`;
		var start = lino - 5;
		start = start < 0 ? 0 : start;
		for (var n = start; n < lino; n++) {
			const nn = (`` + (n + 1)).padStart(4, ` `);
			errString += nn + ` ` + scriptLines[n].line.split(`\\s`).join(` `) + `\n`;
		}
		errString += `${err.message}\n`;
		const warnings = EasyCoder_Compiler.getWarnings();
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
		return this.symbols.hasOwnProperty(name);
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
		if (typeof v.content !==`undefined` && v.content.length >= 2
			&& (v.content.substr(0, 2) === `{"` || v.content[0] === `[`)) {
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
		const element = document.createElement(type === `css` ? `link` : `script`);
		switch (type) {
		case `css`:
			element.type = `text/css`;
			element.href = src;
			element.rel = `stylesheet`;
			break;
		case `js`:
			element.type = `text/javascript`;
			element.src = src;
			break;
		default:
			return;
		}
		element.onload = function () {
			console.log(`${Date.now() - EasyCoder.timestamp} ms: Library ${src} loaded`);
			cb();
		};
		document.head.appendChild(element);
	},

	isUndefined: item => {
		return typeof item === `undefined`;
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
				let parent = program.parent;
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
		compiler.domain = this.domain;
		compiler.imports = imports;
		const program = EasyCoder_Compiler.compile(tokens);
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
		program.checkPlugin = this.checkPlugin;
		program.getPlugin = this.getPlugin;
		program.addLocalPlugin = this.addLocalPlugin;
		program.getPluginsPath = this.getPluginsPath;
		program.getSymbolRecord = this.getSymbolRecord;
		program.verifySymbol = this.verifySymbol;
		program.runtimeError = this.runtimeError;
		program.nonNumericValueError = this.nonNumericValueError;
		program.variableDoesNotHoldAValueError = this.variableDoesNotHoldAValueError;
		program.reportError = this.reportError;
		program.register = this.register;
		program.symbols = compiler.getSymbols();
		program.encoding = `ec`;
		program.popups = [];
		program.stack = [];
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
			this.scriptIndex++;
			if (!program.script) {
				program.script = this.scriptIndex;
			}
			const finishCompile = Date.now();
			console.log(`${finishCompile - this.timestamp} ms: ` +
				`Compiled ${program.script}: ${source.scriptLines.length} lines (${source.tokens.length} tokens) in ` +
				`${finishCompile - startCompile} ms`);
		} catch (err) {
			if (err.message !== `stop`) {
				this.reportError(err, parent, source);
				if (parent && parent.onError) {
					parent.run(parent.onError);
				}
			}
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

	tokenise: function(source) {
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

	setPluginCount: function(count) {
		EasyCoder.plugins = [];
		EasyCoder.pluginCount = count;
	},

	checkPlugin: function(name) {
		return EasyCoder.domain[name];
	},

	getPlugin: function(name, src, onload) {
		if (EasyCoder.domain[name]) {
			onload();
			return;
		}
		const script = document.createElement(`script`);
		script.type = `text/javascript`;
		script.src = `${src}?ver=${EasyCoder.version}`;
		script.onload = function () {
			console.log(`${Date.now() - EasyCoder.timestamp} ms: Plugin ${src} loaded`);
			onload();
		};
		document.head.appendChild(script);
	},

	addGlobalPlugin: function(name, handler) {
		// alert(`Add plugin ${name}`);
		EasyCoder.plugins.push({
			name,
			handler
		});
		if (EasyCoder.plugins.length === EasyCoder.pluginCount) {
			EasyCoder.plugins.forEach(function (plugin) {
				EasyCoder.domain[plugin.name] = plugin.handler;
			});
			EasyCoder.tokenise(EasyCoder.source);
		}
	},

	addLocalPlugin: function(name, handler, callback) {
		EasyCoder.domain[name] = handler;
		callback();
	},

	getPluginsPath: function() {
		return EasyCoder.pluginsPath;
	},

	loadPluginJs: function(path) {
		console.log(`${Date.now() - this.timestamp} ms: Load ${path}/easycoder/plugins.js`);
		const script = document.createElement(`script`);
		script.src = `${window.location.origin}${path}/easycoder/plugins.js?ver=${this.version}`;
		script.type = `text/javascript`;
		script.onload = () => {
			EasyCoder_Plugins.getGlobalPlugins(
				this.timestamp,
				path,
				this.setPluginCount,
				this.getPlugin,
				this.addGlobalPlugin
			);
		};
		script.onerror = () => {
			if (path) {
				this.loadPluginJs(path.slice(0, path.lastIndexOf(`/`)));
			} else {
				this.reportError({
					message: `Can't load plugins.js`
				}, this.program, this.source);
			}
		};
		document.head.appendChild(script);
		this.pluginsPath = path;
	},

	start: function(source) {
		this.source = source;
		this.scriptIndex = 0;
		let pathname = window.location.pathname;
		if (pathname.endsWith(`/`)) {
			pathname = pathname.slice(0, -1);
		} else {
			pathname = ``;
		}
		if (typeof EasyCoder_Plugins === `undefined`) {
			this.loadPluginJs(pathname);
		} else {
			this.pluginsPath = pathname;
			EasyCoder_Plugins.getGlobalPlugins(
				this.timestamp,
				pathname,
				this.setPluginCount,
				this.getPlugin,
				this.addGlobalPlugin
			);
		}
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
					console.log(`${program.script}: Line ${program[program.pc].lino}: PC: ${program.pc} ${domain}:${program[program.pc].keyword}`);
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
		const index = compiler.getIndex();
		for (const name of Object.keys(compiler.domain)) {
			compiler.rewindTo(index);
			const handler = compiler.domain[name];
			const code = handler.value.compile(compiler);
			if (code) {
				return code;
			}
		}
		return null;
	},

	compile: compiler => {
		const token = compiler.getToken();
		const item = EasyCoder_Value.getItem(compiler);
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
				value.parts.push(compiler.value.getItem(compiler));
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
					return acc + EasyCoder_Value.doValue(program, part).content;
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
		return EasyCoder_Value.evaluate(program, value).content;
	},

	// tools

	encode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			case `ec`:
				return value.replace(/'/g, `~sq~`)
					.replace(/"/g, `~dq~`)
					.replace(/\n/g, `%0a`)
					.replace(/\r/g, `%0d`);
			case `url`:
				return encodeURIComponent(value.replace(/\s/g, `+`));
			case `sanitize`:
				return value.normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``);
			}
		}
		return value;
	},

	decode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			case `ec`:
				return value.replace(/~dq~/g, `"`)
					.replace(/~sq~/g, `'`)
					.replace(/%0a/g, `\n`)
					.replace(/%0d/g, `\r`);
			case `url`:
				const decoded = decodeURIComponent(value);
				return decoded.replace(/\+/g, ` `);
			}
		}
		return value;
	}
};
EasyCoder.version = `2.5.6`;
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
