const EasyCoder_CodeMirror = {

	name: `EasyCoder_CodeMirror`,

	CodeMirror: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `init`:
				const mode = compiler.nextToken();
				let profile = ``;
				if (compiler.nextTokenIs(`profile`)) {
					profile = compiler.getNextValue();
				}
				compiler.addCommand({
					domain: `codemirror`,
					keyword: `codemirror`,
					lino,
					action,
					mode,
					profile
				});
				return true;
			case `attach`:
				if (compiler.nextTokenIs(`to`)) {
					if (compiler.nextIsSymbol()) {
						const editor = compiler.getToken();
						let mode = `ecs`;
						if (compiler.nextTokenIs(`mode`)) {
							mode = compiler.nextToken();
							compiler.next();
						}
						compiler.addCommand({
							domain: `codemirror`,
							keyword: `codemirror`,
							lino,
							action,
							editor,
							mode
						});
						return true;
					}
				}
				break;
			case `set`:
				if (compiler.nextTokenIs(`content`)) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const editor = compiler.getSymbolRecord();
							if (compiler.nextTokenIs(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `codemirror`,
									keyword: `codemirror`,
									lino,
									action: `setContent`,
									editor: editor.name,
									value
								});
								return true;
							}
						}
					}
				}
				break;
			case `close`:
				if (compiler.nextIsSymbol()) {
					const editor = compiler.getSymbolRecord();
					compiler.next();
					compiler.addCommand({
						domain: `codemirror`,
						keyword: `codemirror`,
						lino,
						action: `close`,
						editor: editor.name
					});
					return true;
				}
				return false;
			default:
				throw new Error(`Unrecognized action '${action}'`);
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			var editor;
			switch (command.action) {
			case `init`:
				switch (command.mode) {
				case `basic`:
					program.require(`css`, `https://codemirror.net/lib/codemirror.css`,
						function () {
							program.require(`js`, `https://codemirror.net/lib/codemirror.js`,
								function () {
									if (command.profile) {
										program.require(`js`, program.getValue(command.profile),
											function () {
												program.run(command.pc + 1);
											});
									} else {
										program.run(command.pc + 1);
									}
								});
						});
					return 0;
				}
				break;
			case `attach`:
				try {
					editor = program.getSymbolRecord(command.editor);
					const element = document.getElementById(editor.element[editor.index].id);
					editor.editor = CodeMirror.fromTextArea(element, {
						mode: command.mode,
						theme: `default`,
						lineNumbers: true
					});
					editor.editor.setSize(`100%`, `100%`);
				} catch (err) { alert(err); }
				break;
			case `setContent`:
				editor = program.getSymbolRecord(command.editor);
				const value = program.getValue(command.value);
				editor.editor.setValue(value);
				break;
			case `close`:
				editor = program.getSymbolRecord(command.editor);
				editor.editor.toTextArea();
				break;
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `codemirror`:
			return EasyCoder_CodeMirror.CodeMirror;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_CodeMirror.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino,
				`Unknown keyword '${command.keyword}' in 'codemirror' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: () => {
			return null;
		},
		get: () => {}
	},

	condition: {

		compile: () => {},
		test: () => {}
	}
};
