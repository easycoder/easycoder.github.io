const EasyCoder_Dummy = {

	name: `EasyCoder_Dummy`,

	Dummy: {

		// Command keywords
		compile: compiler => {
			const lino = compiler.getLino();
			compiler.next();
			compiler.addCommand({
				domain: `dummy`,
				keyword: `dummy`,
				lino
			});
			return true;
		},

		run: program => {
			const command = program[program.pc];
			return command.pc + 1;
		}
	},

	// Values
	value: {

		compile: () => {
			return {
				domain: `dummy`,
				type: `dummy`
			};
		},

		get: (program, value) => {
			return value;
		}
	},

	// Conditions
	condition: {

		compile: () => {},

		test: () => {}
	},

	// Dispatcher
	getHandler: (name) => {
		switch (name) {
		case `dummy`:
			return EasyCoder_Dummy.Dummy;
		default:
			return false;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_Dummy.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'dummy' package`);
		}
		return handler.run(program);
	}
};

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.dummy = EasyCoder_Dummy;
