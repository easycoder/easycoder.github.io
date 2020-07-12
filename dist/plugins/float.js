const EasyCoder_Float = {

	name: `EasyCoder_Float`,

	Add: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`float`)) {
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
									domain: `float`,
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
									domain: `float`,
									keyword: `add`,
									lino,
									value1,
									target
								});
							}
							return true;
						}
						compiler.warning(`float 'add': Expected value holder`);
					} else {
						// Here we have 2 values so 'giving' must come next
						const value2 = compiler.getValue();
						if (compiler.tokenIs(`giving`)) {
							compiler.next();
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `float`,
								keyword: `add`,
								lino,
								value1,
								value2,
								target
							});
							return true;
						}
						compiler.warning(`float 'add'': Expected "giving"`);
					}
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
					const result = parseFloat(program.getValue(value2)) +
						parseFloat(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command.lino);
					}
					const result = parseFloat(value.content) + parseFloat(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Divide: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`float`)) {
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
							domain: `float`,
							keyword: `divide`,
							lino,
							value1,
							value2,
							target
						});
						return true;
					}
					compiler.warning(`float 'divide'': Expected value holder`);
				} else {
					// Here we should already have the target.
					if (typeof target === `undefined`) {
						compiler.warning(`float 'divide': No target variable given`);
					}
					compiler.addCommand({
						domain: `float`,
						keyword: `divide`,
						lino,
						value2,
						target
					});
					return true;
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
				if (value1) {
					const result = parseFloat(program.getValue(value1)) / parseFloat(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command, lino);
					}
					const result = parseFloat(value.content) / parseFloat(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Multiply: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`float`)) {
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
							domain: `float`,
							keyword: `multiply`,
							lino,
							value1,
							value2,
							target
						});
						return true;
					}
					compiler.warning(`float multiply: Expected value holder`);
				} else {
					// Here we should already have the target.
					if (typeof target === `undefined`) {
						compiler.warning(`float multiply: No target variable given`);
					}
					compiler.addCommand({
						domain: `float`,
						keyword: `multiply`,
						lino,
						value2,
						target
					});
					return true;
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
				if (value1) {
					const result = parseFloat(program.getValue(value1)) *
						parseFloat(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command, lino);
					}
					const result = parseFloat(value.content) * parseFloat(program.getValue(value2));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	Take: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`float`)) {
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
									domain: `float`,
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
									domain: `float`,
									keyword: `take`,
									lino,
									value1,
									target
								});
							}
							return true;
						} else {
							compiler.warning(`float 'take'': Expected value holder`);
						}
					} else {
						// Here we have 2 values so 'giving' must come next
						const value2 = compiler.getValue();
						if (compiler.tokenIs(`giving`)) {
							compiler.next();
							const target = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `float`,
								keyword: `take`,
								lino,
								value1,
								value2,
								target
							});
							return true;
						} else {
							compiler.warning(`float 'take'': Expected "giving"`);
						}
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
					const result = parseFloat(program.getValue(value2)) -
						parseFloat(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				} else {
					if (!value.numeric && isNaN(value.content)) {
						program.nonNumericValueError(command.lino);
					}
					const result = parseFloat(program.getValue(value)) - parseFloat(program.getValue(value1));
					target.value[target.index] = {
						type: `constant`,
						numeric: false,
						content: String(result)
					};
				}
			} else {
				program.variableDoesNotHoldAValueError(command.lino, target.name);
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `add`:
			return EasyCoder_Float.Add;
		case `divide`:
			return EasyCoder_Float.Divide;
		case `multiply`:
			return EasyCoder_Float.Multiply;
		case `subtract`:
		case `take`:
			return EasyCoder_Float.Take;
		default:
			return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_Float.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'float' package`);
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
EasyCoder.domain.float = EasyCoder_Float;
