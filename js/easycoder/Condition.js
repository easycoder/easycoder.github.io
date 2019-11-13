// eslint-disable-next-line no-unused-vars
const EasyCoder_Condition = {

	name: `EasyCoder_Condition`,

	compile: (compiler) => {
		// See if any of the domains can handle it
		compiler.mark();
		for (const domainName of Object.keys(compiler.domain)) {
			// console.log(`Try domain '${domainName}' for condition`);
			const domain = compiler.domain[domainName];
			const code = domain.condition.compile(compiler);
			if (code) {
				return {
					domain: name,
					...code
				};
			}
			compiler.rewind();
		}
	},

	// runtime

	test: (program, condition) => {
		const handler = program.domain[condition.domain];
		return handler.condition.test(program, condition);
	}
};
