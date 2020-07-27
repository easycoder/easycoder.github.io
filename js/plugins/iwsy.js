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
				try {
					const cdn = compiler.getNextValue();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action,
						cdn
					});
					return true;
				} catch (err) {
					throw Error(`iwsy init: No CDN URL given`);
				}
			case `stop`:
				compiler.next();
				compiler.addCommand({
					domain: `iwsy`,
					keyword: `iwsy`,
					lino,
					action
				});
				return true;
			case `remove`:
				if (compiler.nextTokenIs(`styles`)) {
					compiler.next();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action: `removeStyles`
					});
					return true;
				}
				return false;	
			case `path`:	
				const path = compiler.getNextValue();
				compiler.addCommand({
					domain: `iwsy`,
					keyword: `iwsy`,
					lino,
					action,
					path
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
			case `block`:
				const block = compiler.getNextValue();
				compiler.addCommand({
					domain: `iwsy`,
					keyword: `iwsy`,
					lino,
					action,
					block
				});
				return true;
			case `run`:
				const pc = compiler.getPc();
				let mode = `normal`;
				let startMode = `wait`;
				if (compiler.nextToken() === `fullscreen`) {
					mode = compiler.getToken();
					if ([`auto`, `manual`].includes(compiler.nextToken())) {
						startMode = compiler.getToken();
						compiler.next();
					}
				}
				compiler.addCommand({
					domain: `iwsy`,
					keyword: `iwsy`,
					lino,
					action,
					mode,
					startMode,
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
			case `panzoom`:
				const spec = compiler.getNextValue();
				compiler.addCommand({
					domain: `iwsy`,
					keyword: `iwsy`,
					lino,
					action,
					spec
				});
				return true;			
			default:
				break;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const action = command.action;
			let script;
			switch (action) {
			case `init`:
				const cdn = program.getValue(command.cdn);
				if (typeof IWSY === `undefined`) {
					program.require(`js`, `${cdn}/iwsy.js`,
						function () {
							program.run(command.pc + 1);
						});
					return 0;
				} 
				break;
			case `load`:
				const playerRecord = program.getSymbolRecord(command.player);
				const player = playerRecord.element[playerRecord.index];
				player.innerHTML = ``;
				player.style.background = `none`;
				player.style.border = `none`;
				script = program.getValue(command.script);
				try {
					script = JSON.parse(script);
				} catch (err) {
					alert(`iwsy load: Badly formatted script`);
				}
				program.iwsyFunctions = IWSY(player, script);
				break;
			case `path`:
				if (program.iwsyFunctions) {
					program.iwsyFunctions.setPath(program.getValue(command.path));
				}
				break;
			case `script`:
				script = program.getValue(command.script);
				try {
					script = JSON.parse(script);
				} catch (err) {
					alert(`iwsy script: Badly formatted script`);
				}
				if (program.iwsyFunctions) {
					program.iwsyFunctions.setScript(script);
				}
				break;
			case `goto`:
				if (program.iwsyFunctions) {
					program.iwsyFunctions.gotoStep(program.getValue(command.target));
				}
				break;
			case `block`:
				if (program.iwsyFunctions) {
					program.iwsyFunctions.block(program.getValue(command.block));
				}
				break;
			case `run`:
				if (program.iwsyFunctions) {
					program.iwsyFunctions.run(command.mode, command.startMode, () => {
						program.run(command.then);
					});
					return 0;
				}
				break;
			case `stop`:
				if (program.iwsyFunctions) {
					program.iwsyFunctions.stop();
				}
				break;
			case `removeStyles`:
				if (program.iwsyFunctions) {
					program.iwsyFunctions.removeStyles();
				}
				break;
			case `onstep`:
				const cb = command.pc + 2;
				if (program.iwsyFunctions) {
					program.iwsyFunctions.onStep(function(step) {
						program.iwsyStep = step;
						program.run(cb);
					});
				}
				break;
			case `panzoom`:
				const spec = program.getValue(command.spec);
				if (program.iwsyFunctions) {
					program.iwsyFunctions.panzoom(spec);
				}
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
				if (compiler.nextTokenIs(`iwsy`)) {
					const type = compiler.nextToken();
					if ([`script`, `step`].includes(type)) {
						compiler.next();
						return {
							domain: `iwsy`,
							type
						};
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `script`:
				let script = null;
				if (program.iwsyFunctions) {
					script = program.iwsyFunctions.getScript();
					return {
						type: `constant`,
						numeric: false,
						content: JSON.stringify(script)
					};
				}
				break;
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
