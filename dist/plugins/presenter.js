const EasyCoder_Presenter = {

    name: `EasyCoder_Presenter`,

    presenter: {
        defaults: {}
    },

	Present: {

		compile: (compiler) => {
        
            const lino = compiler.getLino();
            if (compiler.nextIsSymbol()) {
                const symbolRecord = compiler.getSymbolRecord();
                if (compiler.nextTokenIs(`in`)) {
                    const container = compiler.getNextValue();
                    compiler.addCommand({
                        domain: `presenter`,
                        keyword: `present`,
                        lino,
                        script: symbolRecord.name,
                        container
                    });
                    return true;
                }
            }
			return false;
		},

		run: (program) => {
            const command = program[program.pc];
            const symbolRecord = program.getSymbolRecord(command.script);
            const script = program.getValue(symbolRecord.value[symbolRecord.index]);
            const container = program.getValue(command.container);
            JSON_Presenter.present(container, script);
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
            case `present`:
                return EasyCoder_Presenter.Present;
            default:
				return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_Presenter.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'presenter' package`);
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
EasyCoder.domain.presenter = EasyCoder_Presenter;
