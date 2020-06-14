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
			case `ec`:
				return value.replace(/\n/g, `%0a`)
					.replace(/\r/g, `%0d`)
					.replace(/"/g, `~dq~`)
					.replace(/'/g, `~sq~`)
					.replace(/\\/g, `~bs~`);
			case `url`:
				return encodeURIComponent(value.replace(/\s/g, `+`));
			case `sanitize`:
				return value.normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``);
			default:
				return value;
			}
		}
		return value;
	},

	decode: (value, encoding) => {
		if (value) {
			switch (encoding) {
			case `ec`:
				return value.replace(/%0a/g, `\n`)
					.replace(/%0d/g, `\r`)
					.replace(/~dq~/g, `"`)
					.replace(/~sq~/g, `'`)
					.replace(/~bs~/g, `\\`);
			case `url`:
				const decoded = decodeURIComponent(value);
				return decoded.replace(/\+/g, ` `);
			default:
				return value;
			}
		}
		return value;
	}
};
