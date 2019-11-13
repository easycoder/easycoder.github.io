const EasyCoder_SVG = {

	name: `EasyCoder_SVG`,

	Circle: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `circle`, false, `dom`);
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
				compiler.next();
				switch (symbolRecord.keyword) {
				case `svg`:
					if (compiler.tokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parent = compiler.getToken();
							compiler.next();
							var style = null;
							var flag = true;
							while (flag) {
								const token = compiler.getToken();
								compiler.next();
								switch (token) {
								case `style`:
									style = compiler.getValue();
									break;
								default:
									compiler.prev();
									flag = false;
									break;
								}
							}
							if (!style) {
								style = {
									type: `constant`,
									numeric: false,
									content: `width:100%;height:100%`
								};
							}
							compiler.addCommand({
								domain: `svg`,
								keyword: `create`,
								lino,
								type: `svg`,
								name: symbolRecord.name,
								style,
								parent
							});
							return true;
						}
					}
					break;
				case `group`:
					if (compiler.tokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							if (![`svg`, `group`].includes(parentRecord.keyword)) {
								throw new Error(`Inappropriate type '${parentRecord.keyword}'`);
							}
							compiler.next();
							compiler.addCommand({
								domain: `svg`,
								keyword: `create`,
								lino,
								type: `group`,
								name: symbolRecord.name,
								parent: parentRecord.name
							});
							return true;
						}
					}
					break;
				case `circle`:
				case `ellipse`:
				case `line`:
				case `rect`:
				case `svgtext`:
					if (compiler.tokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							if (![`svg`, `group`].includes(parentRecord.keyword)) {
								throw new Error(`Inappropriate type '${parentRecord.keyword}'`);
							}
							compiler.next();
							var text;
							flag = true;
							while (flag) {
								const token = compiler.getToken();
								compiler.next();
								switch (token) {
								case `style`:
									style = compiler.getValue();
									break;
								case `text`:
									text = compiler.getValue();
									break;
								default:
									compiler.prev();
									flag = false;
									break;
								}
							}
							compiler.addCommand({
								domain: `svg`,
								keyword: `create`,
								lino,
								type: symbolRecord.keyword === `svgtext` ? `text` : symbolRecord.keyword,
								name: symbolRecord.name,
								style,
								text,
								parent: parentRecord.name
							});
							return true;
						}
					}
					break;
				}
			}
			return false;
		},

		run: (program) => {
			const ns = `http://www.w3.org/2000/svg`;
			const command = program[program.pc];
			var parentRecord = program.getSymbolRecord(command.parent);
			var group;
			const symbolRecord = program.getSymbolRecord(command.name);
			if (command.type === `group`) {
				symbolRecord.parent = command.parent;
				symbolRecord.x = 0;
				symbolRecord.y = 0;
			} else {
				if (parentRecord.keyword === `group`) {
					group = parentRecord;
					// Add this element to the group
					const groupElement = group.value[group.index];
					if (!groupElement.content) {
						groupElement.content = [];
					}
					groupElement.content.push({
						name: symbolRecord.name,
						index: symbolRecord.index
					});
					// Find the real parent
					while (parentRecord.keyword === `group`) {
						parentRecord = program.getSymbolRecord(parentRecord.parent);
					}
				}
				const container = parentRecord.element[parentRecord.index];
				const element = document.createElementNS(ns, command.type);
				symbolRecord.element[symbolRecord.index] = element;
				container.appendChild(element);
				// Set the id
				const id = `ec-` + symbolRecord.name + `-` + symbolRecord.index;
				element.setAttribute(`id`, id);
				if (symbolRecord.keyword === `svgtext`) {
					element.textContent = program.value.evaluate(program, command.text).content;
				}
				symbolRecord.value[symbolRecord.index] = {
					type: `constant`,
					numeric: false,
					content: id
				};
				if (command.style) {
					const style = program.value.evaluate(program, command.style).content;
					program.domain.browser.setStyles(id, style);
					// Store the location of this shape
					const value = symbolRecord.value[symbolRecord.index];
					switch (symbolRecord.keyword) {
					case `circle`:
					case `ellipse`:
						value.x = element.getAttribute(`cx`);
						value.y = element.getAttribute(`cy`);
						break;
					case `line`:
						value.x = element.getAttribute(`x1`);
						value.y = element.getAttribute(`y1`);
						value.x2 = element.getAttribute(`x2`);
						value.y2 = element.getAttribute(`y2`);
						break;
					case `rect`:
					case `svgtext`:
						value.x = element.getAttribute(`x`);
						value.y = element.getAttribute(`y`);
						break;
					}
					if (group) {
						// Record the group name and index
						value.groupName = group.name;
						value.groupIndex = group.index;
					}
				}
			}
			return program[program.pc].pc + 1;
		}
	},

	Ellipse: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `ellipse`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Group: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `group`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Line: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `line`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Move: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (compiler.nextTokenIs(`to`)) {
					const x = compiler.getNextValue();
					const y = compiler.getValue();
					compiler.addCommand({
						domain: `svg`,
						keyword: `move`,
						lino,
						type: `moveTo`,
						name: symbolRecord.name,
						x,
						y
					});
					return true;
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const newX = program.value.evaluate(program, command.x).content;
			const newY = program.value.evaluate(program, command.y).content;
			const symbolRecord = program.getSymbolRecord(command.name);
			switch (symbolRecord.keyword) {
			case `group`:
				for (const item of symbolRecord.value[symbolRecord.index].content) {
					const itemRecord = program.getSymbolRecord(item.name);
					const value = itemRecord.value[item.index];
					const element = document.getElementById(value.content);
					const x = parseInt(value.x) + newX;
					const y = parseInt(value.y) + newY;
					switch (itemRecord.keyword) {
					case `circle`:
					case `ellipse`:
						element.setAttribute(`cx`, x);
						element.setAttribute(`cy`, y);
						break;
					case `line`:
						element.setAttribute(`x1`, x);
						element.setAttribute(`y1`, y);
						element.setAttribute(`x2`, parseInt(value.x2) + newX);
						element.setAttribute(`y2`, parseInt(value.y2) + newY);
						break;
					case `rect`:
					case `svgtext`:
						element.setAttribute(`x`, x);
						element.setAttribute(`y`, y);
						break;
					}
				}
				symbolRecord.x = newX;
				symbolRecord.y = newY;
				break;
			case `circle`:
			case `ellipse`:
			case `line`:
			case `rect`:
			case `svgtext`:
				var px = 0;
				var py = 0;
				const symRec = symbolRecord.value[symbolRecord.index];
				if (symRec.groupName) {
					const parentRecord = program.getSymbolRecord(symRec.groupName);
					px = parentRecord.x;
					py = parentRecord.y;
				}
				const symbolValue = symbolRecord.value[symbolRecord.index];
				const element = document.getElementById(symbolRecord.value[symbolRecord.index].content);
				switch (symbolRecord.keyword) {
				case `circle`:
				case `ellipse`:
					element.setAttribute(`cx`, px + newX);
					element.setAttribute(`cy`, py + newY);
					break;
				case `line`:
					element.setAttribute(`x1`, px + newX);
					element.setAttribute(`y1`, py + newY);
					const dx = parseInt(symbolValue.x2) - parseInt(symbolValue.x1);
					const dy = parseInt(symbolValue.y2) - parseInt(symbolValue.y1);
					element.setAttribute(`x2`, px + dx + newX);
					element.setAttribute(`y2`, py + dy + newY);
					break;
				case `rect`:
				case `svgtext`:
					element.setAttribute(`x`, px + newX);
					element.setAttribute(`y`, py + newY);
					break;
				}
				symbolValue.x = newX;
				symbolValue.y = newY;
				break;
			}
			return program[program.pc].pc + 1;
		}
	},

	On: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			switch (action) {
			case `click`:
				if (compiler.nextIsSymbol()) {
					const symbol = compiler.getSymbolRecord();
					compiler.next();
					if (symbol.keyword !== `group`) {
						return false;
					}
					compiler.addCommand({
						domain: `svg`,
						keyword: `on`,
						lino,
						action,
						symbol: symbol.name
					});
					// Add a 'goto' to skip the action
					const goto = compiler.getPc();
					compiler.addCommand({
						domain: `core`,
						keyword: `goto`,
						goto: 0
					});
					// Add the action
					compiler.compileOne();
					// Fixup the 'goto'
					compiler.getCommandAt(goto).goto = compiler.getPc();
					return true;
				}
			}
			compiler.addWarning(`Unrecognised syntax in 'on'`);
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const targetItem = program.getSymbolRecord(command.symbol);
			switch (command.action) {
			case `click`:
				if (targetItem.keyword === `group`) {
					// Iterate the group array
					for (const groupValue of targetItem.value) {
						if (groupValue.content) {
							for (const value of groupValue.content) {
								const contentItem = program.getSymbolRecord(value.name);
								const contentValue = contentItem.value[value.index];
								if (contentValue.content) {
									const target = document.getElementById(contentValue.content);
									target.targetPc = command.pc + 2;
									target.contentItem = contentItem;
									target.contentIndex = value.index;
									target.onclick = function (event) {
										event.target.blur();
										const contentItem = event.target.contentItem;
										contentItem.index = event.target.contentIndex;
										const contentValue = contentItem.value[contentItem.index];
										if (contentValue.groupName) {
											targetItem.index = contentValue.groupIndex;
											// Set the content indices
											const group = targetItem.value[targetItem.index];
											for (const gc of group.content) {
												const gi = program.getSymbolRecord(gc.name);
												gi.index = gc.index;
											}
										}
										try {
											program.run(event.target.targetPc);
										} catch (err) {
											program.reportError(err, program);
										}
										return false;
									};
								}
							}
						}
					}
				}
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	Rect: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `rect`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	Set: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			var token = compiler.nextToken();
			if (token === `the`) {
				token = compiler.nextToken();
			}
			if (token === `text`) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbol = compiler.getSymbolRecord();
						switch (symbol.keyword) {
						case `svgtext`:
							if (compiler.nextTokenIs(`to`)) {
								compiler.next();
								const value = compiler.getValue();
								compiler.addCommand({
									domain: `svg`,
									keyword: `set`,
									lino,
									type: `setText`,
									symbolName: symbol.name,
									value
								});
								return true;
							}
							break;
						default:
							break;
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			var symbol;
			var value;
			var target;
			switch (command.type) {
			case `setText`:
				symbol = program.getSymbolRecord(command.symbolName);
				target = document.getElementById(symbol.value[symbol.index].content);
				value = program.value.evaluate(program, command.value).content;
				switch (symbol.keyword) {
				case `svgtext`:
					target.innerHTML = value;
					break;
				default:
					break;
				}
				break;
			default:
				break;
			}
			return command.pc + 1;
		}
	},

	SVG: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `svg`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	SVGText: {

		compile: (compiler) => {
			compiler.compileVariable(`svg`, `svgtext`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `circle`:
			return EasyCoder_SVG.Circle;
		case `create`:
			return EasyCoder_SVG.Create;
		case `ellipse`:
			return EasyCoder_SVG.Ellipse;
		case `group`:
			return EasyCoder_SVG.Group;
		case `line`:
			return EasyCoder_SVG.Line;
		case `move`:
			return EasyCoder_SVG.Move;
		case `on`:
			return EasyCoder_SVG.On;
		case `rect`:
			return EasyCoder_SVG.Rect;
		case `set`:
			return EasyCoder_SVG.Set;
		case `svg`:
			return EasyCoder_SVG.SVG;
		case `svgtext`:
			return EasyCoder_SVG.SVGText;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_SVG.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'svg' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			if (compiler.tokenIs(`text`)) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						compiler.next();
						if (symbolRecord.keyword === `svgtext`) {
							return {
								domain: `svg`,
								type: `svgtext`,
								name: symbolRecord.name
							};
						}
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `svgtext`:
				const symbolRecord = program.getSymbolRecord(value.name);
				//          console.log('symbolRecord: ' + JSON.stringify(symbolRecord.value[symbolRecord.index], null, 2));
				const element = document.getElementById(symbolRecord.value[symbolRecord.index].content);
				return {
					type: `constant`,
					numeric: false,
					content: element.innerHTML
				};
			}
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};
