// eslint-disable-next-line no-unused-vars
const EasyCoder_Life = {

	name: `EasyCoder_Life`,

	value: {

		compile: (compiler) => {
			if (compiler.tokenIs(`the`)) {
				compiler.nextToken();
			}
			if (compiler.tokenIs(`neighbours`)) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword == `variable`) {
							if (compiler.nextTokenIs(`cell`)) {
								const cell = compiler.getNextValue();
								return {
									domain: `life`,
									type: `getNeighbours`,
									name: symbolRecord.name,
									cell
								};
							}
						}
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `getNeighbours`:
				const symbolRecord = program.getSymbolRecord(value.name);
				const size = Math.sqrt(symbolRecord.elements);
				const cell = program.getValue(value.cell);
				const row = Math.trunc(cell / size);
				const column = cell % size;
				const map = symbolRecord.value;
				let count = 0;
				if (column > 0) {
					if (map[cell - 1].content) {
						count++;
					}
				}
				if (column < size - 1) {
					if (map[cell + 1].content) {
						count++;
					}
				}
				if (row > 0) {
					for (let c = -1; c < 2; c++) {
						let cc = column + c;
						if (cc >= 0 && cc < size) {
							if (map[cell - size + c].content) {
								count++;
							}
						}
					}
				}
				if (row < size - 1) {
					for (let c = -1; c < 2; c++) {
						let cc = column + c;
						if (cc >= 0 && cc < size) {
							if (map[cell + size + c].content) {
								count++;
							}
						}
					}
				}
				return {
					type: `constant`,
					numeric: true,
					content: count
				};
			}
			return null;
		}
	},

	getHandler: () => {
		return null;
	},

	condition: {

		compile: () => {}
	}
};