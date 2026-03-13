const EasyCoder_Showdown = {

	name: `EasyCoder_Showdown`,
	runtimeProgram: null,

	getSymbol: (program, name) => {
		if (!program || !program.symbols || !program.symbols[name]) {
			return null;
		}
		return program[program.symbols[name].pc] || null;
	},

	getValue: (program, name) => {
		const symbol = EasyCoder_Showdown.getSymbol(program, name);
		if (!symbol || !symbol.value || typeof symbol.index === `undefined`) {
			return ``;
		}
		const item = symbol.value[symbol.index];
		return item && typeof item.content !== `undefined` ? item.content : ``;
	},

	setValue: (program, name, content) => {
		const symbol = EasyCoder_Showdown.getSymbol(program, name);
		if (!symbol || !symbol.value || typeof symbol.index === `undefined`) {
			return;
		}
		symbol.value[symbol.index] = {
			type: `constant`,
			numeric: false,
			content
		};
	},

	fallbackTransform: (program, payload) => {
		if (payload === `ec`) {
			return EasyCoder_Showdown.getValue(program, `ECPayload`) || `<strong>EasyCoder</strong>`;
		}
		if (payload.startsWith(`quot:`)) {
			const text = payload.slice(5);
			return `<span style="font-family:mono;font-size:90%;color:darkred">&#96;${text}&#96;</span>`;
		}
		if (payload.startsWith(`code:`)) {
			return `<span style="font-family:Courier New;color:darkred">${payload.slice(5)}</span>`;
		}
		if (payload.startsWith(`step`)) {
			return `<pre>${EasyCoder_Showdown.getValue(program, `Fragment`)}</pre>`;
		}
		if (payload.startsWith(`pre:`)) {
			return `<pre>${payload.slice(4)}</pre>`;
		}
		if (payload.startsWith(`copy`)) {
			return `<button id="copy">Copy to editor</button>`;
		}
		if (payload.startsWith(`icon:`)) {
			const parts = payload.slice(5).split(`:`);
			if (parts.length >= 3) {
				const [name, size, ...titleParts] = parts;
				const title = titleParts.join(`:`);
				return `<img src="codex/icon/${name}.png" style="width:${size};height:${size}" title="${title}" />`;
			}
		}
		if (payload.startsWith(`link:`)) {
			const body = payload.slice(5);
			const pos = body.indexOf(`:`);
			if (pos > -1) {
				const data = body.slice(0, pos);
				const text = body.slice(pos + 1);
				const linkCount = parseInt(EasyCoder_Showdown.getValue(program, `LinkCount`) || `0`, 10) || 0;
				EasyCoder_Showdown.setValue(program, `LinkCount`, String(linkCount + 1));
				return `<b><a href="" id="ec-link-${linkCount}" data-codexid="${data}">${text}</a></b>`;
			}
		}
		if (payload.startsWith(`next:`)) {
			return `<h2>Next: <a href="#" id="next">${payload.slice(5)}</a></h2>`;
		}
		return payload;
	},

	Load: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`showdown`)) {
				compiler.next();
				compiler.addCommand({
					domain: `showdown`,
					keyword: `load`,
					lino
				});
				return true;
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			EasyCoder_Showdown.runtimeProgram = program;
			if (typeof showdown === `undefined`) {
				program.require(`js`, `/dist/vendor/showdown/showdown.min.js`,
					() => {
						EasyCoder_Showdown.runtimeProgram = program;
						EasyCoder_Showdown.setupExtension();
						program.run(command.pc + 1);
					});
			}
			else {
				EasyCoder_Showdown.setupExtension();
				return command.pc + 1;
			}
			return 0;
		}
	},

	setupExtension: () => {
		const program = EasyCoder_Showdown.runtimeProgram;
		if (!program) {
			return;
		}
		showdown.extension(`Extension`, {
			type: `lang`,
			filter: function (text, converter) {
				if (!converter.callback) {
					return text;
				}
				const callback = program.getSymbolRecord(converter.callback);
				if (!callback) {
					return text;
				}
				return text.replace(/~([^~]+)~/g, function (match, group) {
					callback.payload = group;
					program.run(callback.cb);
					if (callback.payload !== group) {
						return callback.payload;
					}
					// If callback execution is queued, apply immediate fallback transform.
					return EasyCoder_Showdown.fallbackTransform(program, group);
				});
			}
		});
	},

	getHandler: (name) => {
		switch (name) {
		case `load`:
			return EasyCoder_Showdown.Load;
		default:
			return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_Showdown.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'showdown' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: compiler => {
			if (compiler.tokenIs(`showdown`)) {
				if (compiler.nextTokenIs(`decode`)) {
					const value = compiler.getNextValue();
					let callback = null;
					if (compiler.tokenIs(`with`)) {
						if (compiler.nextIsSymbol()) {
							const symbolRecord = compiler.getSymbolRecord();
							if (symbolRecord.keyword === `callback`) {
								callback = symbolRecord.name;
								compiler.next();
							}
						}
					}
					return {
						domain: `showdown`,
						type: `decode`,
						value,
						callback
					};
				}
			}
			return null;
		},

		get: (program, value) => {
			const converter = new showdown.Converter({
				extensions: [`Extension`]
			});
			switch (value.type) {
			case `decode`:
				converter.callback = value.callback;
				const markdown = program.getValue(value.value);
				const content = converter.makeHtml(markdown);
				return {
					type: `constant`,
					numeric: false,
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

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.showdown = EasyCoder_Showdown;
