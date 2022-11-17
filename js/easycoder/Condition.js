// eslint-disable-next-line no-unused-vars
const EasyCoder_Condition = {

	name: `EasyCoder_Condition`,

	compile: (compiler) => {
		// See if any of the domains can handle it
		const mark = compiler.getIndex();
		for (const domainName of Object.keys(compiler.domain)) {
			// console.log(`Try domain '${domainName}' for condition`);
			const domain = compiler.domain[domainName];
			const code = domain.condition.compile(compiler);
			if (code) {
				return code;
			}
			compiler.rewindto(mark);
		}
	},

	// runtime

	test: (program, condition) => {
		const handler = program.domain[condition.domain];
		return handler.condition.test(program, condition);
	}
};
