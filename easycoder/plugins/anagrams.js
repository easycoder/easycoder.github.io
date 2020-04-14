// eslint-disable-next-line no-unused-vars
const EasyCoder_Anagrams = {

	name: `EasyCoder_Anagrams`,

	value: {

		compile: (compiler) => {
			if (compiler.tokenIs(`anagrams`)) {
				if (compiler.nextTokenIs(`of`)) {
					const value = compiler.getNextValue();
					return {
						domain: `anagrams`,
						type: `getAnagrams`,
						value
					};
				}
			}
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `getAnagrams`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(AnagramFinder.getAnagrams(program.getValue(value.value), EasyCoder_words))
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

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.anagrams = EasyCoder_Anagrams;
