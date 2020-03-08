const EasyCoder_VFX = {

	name: `EasyCoder_VFX`,

	ANIMATION: {

		compile: (compiler) => {
			compiler.compileVariable(`vfx`, `animation`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Create: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const keyword = symbolRecord.keyword;
				if (keyword == `animation`) {
					if (compiler.nextTokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							compiler.next();
							compiler.addCommand({
								domain: `vfx`,
								keyword: `create`,
								lino,
								name: symbolRecord.name,
								parent: parentRecord.name
							});
							return true;
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.name);
			const p = command.imported ? EasyCoder.scripts[program.parent] : program;
			const parentRecord = p.getSymbolRecord(command.parent);
			if (!parentRecord.element[parentRecord.index]) {
				program.runtimeError(command.pc, `Element ${parentRecord.name} does not exist.`);
			}
			let parent = parentRecord.element[parentRecord.index];
			// Create the container
			let container = document.createElement(`div`);
			targetRecord.element[targetRecord.index] = container;
			targetRecord.element[targetRecord.index].id =
				`ec-${targetRecord.name}-${targetRecord.index}-${EasyCoder.elementId++}`;
			parent.appendChild(container);
			container.style[`position`] = `relative`;
			container.style[`overflow`] = `hidden`;
			if (typeof targetRecord.animation === `undefined`) {
				targetRecord.animation = [];
				for (let n = 0; n < targetRecord.elements; n++) {
					targetRecord.animation.push({});
				}
			}
			const image = document.createElement(`img`);
			targetRecord.animation[targetRecord.index].image = image;
			container.appendChild(image);
			image.style[`display`] = `none`;
			image.style[`position`] = `absolute`;
			image.style[`max-width`] = `none`;
			return command.pc + 1;
		}
	},

	On: {

		compile: compiler => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
				case `trigger`:
					if (compiler.nextIsSymbol()) {
						let symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `animation`) {
						compiler.next();
						compiler.addCommand({
							domain: `vfx`,
							keyword: `on`,
							lino,
							action,
							target:symbolRecord.name
						});
						return compiler.completeHandler();
					}
					break;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const cb = command.pc + 2;
			const symbolRecord = program.getSymbolRecord(command.target);
			switch (command.action) {
			case `trigger`:
				symbolRecord.onTrigger = cb;
				break;
			default:
				program.runtimeError(command.lino, `Unknown action '${command.action}'`);
				return 0;
			}
			return command.pc + 1;
		}
	},

	Set: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			let type = compiler.nextToken();
			if (compiler.tokenIs(`the`)) {
				type = compiler.nextToken();
			}
			if ([`url`, `specification`, `spec`, `opacity`].includes(type)) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (compiler.nextTokenIs(`to`)) {
							const value = compiler.getNextValue();
							compiler.addCommand({
								domain: `vfx`,
								keyword: `set`,
								lino,
								target: symbolRecord.name,
								type,
								value
							});
							return true;
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			let targetRecord = program.getSymbolRecord(command.target);
			let container = targetRecord.element[targetRecord.index];
			let animation;
			switch (command.type) {
				case `url`:
					let url = program.getValue(command.value);
					animation.image.setAttribute(`src`, url);
					break;
				case `specification`:
				case `spec`:
					animation = targetRecord.animation[targetRecord.index];
					let spec = JSON.parse(program.getValue(command.value));
					animation.spec = spec;
					animation.step = spec.steps;
					if (['panzoom'].includes(spec.type)) {
						container.style.width =  spec.width;
						container.style.height = spec.height;
						let width = container.getBoundingClientRect().width;
						let height = container.getBoundingClientRect().height;
						animation.widthS = width * 100 / spec.start.width;
						let zoomS = animation.widthS / width;
						let heightS = height * zoomS;
						animation.leftS = width * zoomS * spec.start.left / 100;
						animation.topS = height * zoomS * spec.start.top / 100;
						animation.widthF = width * 100 / spec.finish.width;
						let zoomF = animation.widthF / width;
						let heightF = height * zoomF;
						animation.leftF = width * zoomF * spec.finish.left / 100;
						animation.topF = height * zoomF * spec.finish.top / 100;

						if (spec.start.width > 100) {
							throw new Error(`Start width too great for item ${targetRecord.index}`);
						}
						if (spec.finish.width > 100) {
							throw new Error(`Finish width too great for item ${targetRecord.index}`);
						}
						if (animation.widthS - animation.leftS < width) {
							throw new Error(`Insufficient start width for item ${targetRecord.index}`);
						}
						if (heightS - animation.topS < height) {
							throw new Error(`Insufficient start height for item ${targetRecord.index}`);
						}
						if (animation.widthF - animation.leftF < width) {
							throw new Error(`Insufficient finish width for item ${targetRecord.index}`);
						}
						if (heightF - animation.topF < height) {
							throw new Error(`Insufficient finish height for item ${targetRecord.index}`);
						}
						animation.left = animation.leftS;
						animation.top = animation.topS;
						animation.width = animation.widthS;
						let image = animation.image;
						image.style.left = `-${animation.left}px`;
						image.style.top = `-${animation.top}px`;
						image.style.width = `${animation.width}px`;
						image.setAttribute(`src`, spec.url);
					} else {
						program.runtimeError(command.lino, `Unknown animation type '${spec.type}'`);
						return 0;
					}
				case `opacity`:
					animation = targetRecord.animation[targetRecord.index];
					let image = animation.image;
					image.style.opacity = command.value;
					break;
			}
			return command.pc + 1;
		}
	},

	Start: {
		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const keyword = symbolRecord.keyword;
				if (keyword == `animation`) {
					compiler.next();
					compiler.addCommand({
						domain: `vfx`,
						keyword: `start`,
						lino,
						target: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			const animation = targetRecord.animation[targetRecord.index];
			animation.step = 0;
			animation.left = animation.leftS;
			animation.top = animation.topS;
			animation.width = animation.widthS;
			animation.image.style.display = `inline-block`;
			return command.pc + 1;
		}
	},

	Step: {
		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const keyword = symbolRecord.keyword;
				if (keyword == `animation`) {
					compiler.next();
					compiler.addCommand({
						domain: `vfx`,
						keyword: `step`,
						lino,
						target: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetRecord = program.getSymbolRecord(command.target);
			for (targetRecord.index = 0; targetRecord.index < targetRecord.elements; targetRecord.index++) {
				const animation = targetRecord.animation[targetRecord.index];
				if (animation.step < animation.spec.steps) {
					animation.step++;
					let proportion = parseFloat(animation.step) / animation.spec.steps;
					animation.left = animation.leftS + (animation.leftF - animation.leftS) * proportion;
					animation.top = animation.topS + (animation.topF - animation.topS)  * proportion;
					animation.width = animation.widthS + (animation.widthF - animation.widthS) * proportion;
					const image = animation.image;
					image.style.left = `-${animation.left}px`;
					image.style.top = `-${animation.top}px`;
					image.style.width = `${animation.width}px`;
					if (animation.step === animation.spec.trigger) {
						program.run(targetRecord.onTrigger);
					}
				}
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
			case `animation`:
				return EasyCoder_VFX.ANIMATION;
			case `create`:
				return EasyCoder_VFX.Create;
			case `on`:
				return EasyCoder_VFX.On;
			case `set`:
				return EasyCoder_VFX.Set;
			case `start`:
				return EasyCoder_VFX.Start;
			case `step`:
				return EasyCoder_VFX.Step;
			default:
				return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_VFX.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'vfx' package`);
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
