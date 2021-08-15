const EasyCoder_Box = {

	name: `EasyCoder_Box`,

	BOX: {

		compile: (compiler) => {
			compiler.compileVariable(`box`, `box`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Create: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol())
			{
				const symbolRecord = compiler.getSymbolRecord();
				const keyword = symbolRecord.keyword;
				if (keyword === `box`) {
                    let width;
                    let depth;
                    let height;
                    let weight;
                    compiler.next();
                    while (true)
                    {
                        switch (compiler.getToken()) {
                        case `width`:
                            width = compiler.getNextValue();
                            break;
                        case `depth`:
                            depth = compiler.getNextValue();
                            break;
                        case `height`:
                            height = compiler.getNextValue();
                            break;
                        case `weight`:
                            weight = compiler.getNextValue();
                            break;
                        default:
                            compiler.addCommand({
                                domain: `box`,
                                keyword: `create`,
                                name: symbolRecord.name,
                                lino,
                                width,
                                depth,
                                height,
                                weight
                            });
                            return true;
                        }
                    }
                 }
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const width = program.getValue(command.width);
			const depth = program.getValue(command.depth);
			const height = program.getValue(command.height);
			const weight = program.getValue(command.weight);
			const box = program.getSymbolRecord(command.name);
			box.value[box.index] = {
                width,
                depth,
                height,
                weight
			};
			return command.pc + 1;
		}
	},

	// Values
	value: {

		compile: (compiler) => {
            compiler.skip(`the`);
            const type = compiler.getToken();
            if ([`width`, `depth`, `height`, `weight`, `volume`].includes(type)) {
                compiler.next();
                compiler.skip(`of`);
                const name = compiler.getToken();
                compiler.next();
                return {
                    domain: `box`,
                    name,
                    type
                };
            };
            return null;
		},

		get: (program, value) => {
            const symbolRecord = program.getSymbolRecord(value.name);
            const record = symbolRecord.value[symbolRecord.index];
            let content;
            switch (value.type) {
                case `width`:
                    content = record.width;
                    break;
                case `depth`:
                    content = record.depth;
                    break;
                case `height`:
                    content = record.height;
                    break;
                case `weight`:
                    content = record.weight;
                    break;
                case `volume`:
                    content = record.width * record.depth * record.height / 100 / 100 / 100;
                    break;
            }
            return {
                type: `constant`,
                numeric: true,
                content
            };
			return value;
		}
	},

	// Conditions
	condition: {

		compile: (compiler) => {
            if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `box`) {
					if (compiler.nextTokenIs(`is`)) {
						let sense = true;
						if (compiler.nextTokenIs(`not`)) {
							compiler.next();
							sense = false;
						}
						if (compiler.tokenIs(`heavy`)) {
							compiler.next();
							return {
								domain: `box`,
								type: `heavy`,
								name: symbolRecord.name,
								sense
							}
						}
					}
					return null;
				}
            }
		},

		test: (program, condition) => {
            if (condition.type === `heavy`) {
                const record = program.getSymbolRecord(condition.name);
                const heavy = (record.value[record.index].weight >= 25);
                return condition.sense ? heavy : !heavy;
            }
            return false;
        }
    },

	// Dispatcher
	getHandler: (name) => {
		switch (name) {
		case `box`:
			return EasyCoder_Box.BOX;
		case `create`:
			return EasyCoder_Box.Create;
		default:
			return false;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_Box.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'box' package`);
		}
		return handler.run(program);
	}
};

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.box = EasyCoder_Box;
