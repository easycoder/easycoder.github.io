const EasyCoder_CKEditor = {

	name: `EasyCoder_CKEditor`,

	CKEditor: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			compiler.next();
			switch (action) {
			case `attach`:
				if (compiler.tokenIs(`to`)) {
					if (compiler.nextIsSymbol()) {
						const editor = compiler.getToken();
						compiler.next();
						compiler.addCommand({
							domain: `ckeditor`,
							keyword: `ckeditor`,
							lino,
							action,
							editor
						});
						return true;
					}
				}
				break;
			case `close`:
				if (compiler.isSymbol()) {
					const editor = compiler.getToken();
					compiler.next();
					compiler.addCommand({
						domain: `ckeditor`,
						keyword: `ckeditor`,
						lino,
						action,
						editor
					});
					return true;
				}
				break;
			case `get`:
				if (compiler.isSymbol()) {
					const target = compiler.getToken();
					if (compiler.nextTokenIs(`from`)) {
						compiler.next();
						if (compiler.isSymbol()) {
							const editor = compiler.getToken();
							compiler.next();
							compiler.addCommand({
								domain: `ckeditor`,
								keyword: `ckeditor`,
								lino,
								action,
								target,
								editor
							});
							return true;
						}
					}
				}
				break;
			case `set`:
				if (compiler.isSymbol()) {
					const editor = compiler.getToken();
					if (compiler.nextTokenIs(`to`)) {
						const value = compiler.getNextValue();
						compiler.addCommand({
							domain: `ckeditor`,
							keyword: `ckeditor`,
							lino,
							action,
							editor,
							value
						});
						return true;
					}
				}
				break;
			default:
				compiler.addCommand({
					domain: `ckeditor`,
					keyword: `ckeditor`,
					lino,
					action
				});
				break;
			}
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			var editor;
			var content;
			switch (command.action) {
			case `test`:
				break;
			case `attach`:
				editor = program.getSymbolRecord(command.editor);
				editor.editor =
				CKEDITOR.appendTo(editor.element[editor.index].id, {
					height: 400
				});
				break;
			case `close`:
				editor = program.getSymbolRecord(command.editor);
				editor.editor.destroy();
				break;
			case `get`:
				editor = program.getSymbolRecord(command.editor);
				const targetRecord = program.getSymbolRecord(command.target);
				content = editor.editor.getData()
					.split(`\n`).join(``).split(`&nbsp;`).join(` `);
				targetRecord.value[targetRecord.index] = {
					type: `constant`,
					numeric: false,
					content
				};
				break;
			case `set`:
				editor = program.getSymbolRecord(command.editor);
				content = program.getValue(command.value);
				editor.editor.setData(content, {
					callback: function () {
						program.run(command.pc + 1);
					}
				});
				return 0;
			case `reset`:
				for (const name in CKEDITOR.instances) {
					CKEDITOR.instances[name].destroy();
				}
				break;
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `ckeditor`:
			return EasyCoder_CKEditor.CKEditor;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_CKEditor.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino,
				`Unknown keyword '${command.keyword}' in 'ckeditor' package`);
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
