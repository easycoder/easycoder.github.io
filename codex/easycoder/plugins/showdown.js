const EasyCoder_Showdown = {

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
			if (program.isUndefined(this.showdown_loaded)) {
				program.require(`js`, `https://cdn.rawgit.com/showdownjs/showdown/1.9.0/dist/showdown.min.js`, function () {
					this.showdown_loaded = true;
					showdown.extension(`Extension`, {
						type: `lang`,
						filter: function (text, converter) {
							const callback = program.getSymbolRecord(converter.callback);
							return text.replace(/~([^~]+)~/g, function (match, group) {
								callback.payload = group;
								program.run(callback.cb);
								return callback.payload;
							});
						}
					});
					program.run(command.pc + 1);
				});
			}
			else {
				return command.pc + 1;
			}
			return 0;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `load`:
			return EasyCoder_Showdown.Load;
		default:
			return false;
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