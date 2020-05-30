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
				default:
					compiler.next();
					compiler.addCommand({
						domain: `iwsy`,
						keyword: `iwsy`,
						lino,
						action
					});
					return true;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const action = command.action;
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
					const script = program.getValue(command.script);
					IWSY(player, JSON.parse(script));
					break;
				case `show`:
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
EasyCoder.domain.iwsy = EasyCoder_IWSY;
