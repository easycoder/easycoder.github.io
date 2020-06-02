const EasyCoder_IWSY = {

    name: `EasyCoder_IWSY`,

    iwsy: {
    },

	IWSY: {

		compile: (compiler) => {
        
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
				case `load`:
					if (compiler.nextIsSymbol()) {
						const playerRecord = compiler.getSymbolRecord();
						if (playerRecord.keyword === `div`) {
							const script = compiler.getNextValue();
							compiler.addCommand({
								domain: `iwsy`,
								keyword: `iwsy`,
								lino,
								action,
								player: playerRecord.name,
								script
							});
							return true;
						}
					}
					break;
				case `init`:
				case `stop`:
					compiler.next();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action
					});
					return true;
				case `script`:
					const script = compiler.getNextValue();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action,
						script
					});
					return true;
				case `goto`:
					const target = compiler.getNextValue();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action,
						target
					});
					return true;
				case `run`:
					const pc = compiler.getPc();
					compiler.next();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action,
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
				case `onstep`:
					compiler.next();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action
					});
					return compiler.completeHandler();
				default:
					break;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const action = command.action;
			let scriptRecord;
			let script;
			switch (action) {
				case `init`:
					program.require(`js`, `iwsy.js`,
					function () {
						program.run(command.pc + 1);
					});
					return 0;
				case `load`:
					const playerRecord = program.getSymbolRecord(command.player);
					const player = playerRecord.element[playerRecord.index];
					player.innerHTML = ``;
					player.style.background = `none`;
					player.style.border = `none`;
					script = program.getValue(command.script);
					try {
						script = JSON.parse(script);
						EasyCoder.iwsyFunctions = IWSY(player, script);
					} catch (err) {
						alert(`Badly formatted script`);
					}
					break;
				case `script`:
					script = program.getValue(command.script);
					try {
						script = JSON.parse(script);
						if (EasyCoder.iwsyFunctions) {
							EasyCoder.iwsyFunctions.setScript(script);
						}
					} catch (err) {
						alert(`Badly formatted script`);
					}
					break;
				case `goto`:
					if (EasyCoder.iwsyFunctions) {
						EasyCoder.iwsyFunctions.gotoStep(program.getValue(command.target));
					}
					break;
				case `run`:
					if (EasyCoder.iwsyFunctions) {
						EasyCoder.iwsyFunctions.run(function() {
							program.run(command.then);
						});
						return 0;
					}
					break;
				case `stop`:
					if (EasyCoder.iwsyFunctions) {
						EasyCoder.iwsyFunctions.stop();
					}
					break;
				case `onstep`:
					const cb = command.pc + 2;
					if (EasyCoder.iwsyFunctions) {
						EasyCoder.iwsyFunctions.onStep(function(step) {
							program.iwsyStep = step;
							program.run(cb);
						});
					}
					break;
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
            case `iwsy`:
				return EasyCoder_IWSY.IWSY;
            default:
				return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_IWSY.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'iwsy' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.tokenIs(`the`)) {
				if (compiler.nextTokenIs(`step`)) {
					compiler.next();
					return {
						domain: `iwsy`,
						type: `step`
					};
				}
			}
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `step`:
				return {
					type: `constant`,
					numeric: true,
					content: program.iwsyStep
				};
			}
			return null;
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.iwsy = EasyCoder_IWSY;
