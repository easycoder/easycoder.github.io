const EasyCoder_Run = {

	name: `EasyCoder_Run`,

	run: (program, pc) =>{

		const queue = [];

		const minIndent = (scriptLines) => {
			let count = 9999;
			scriptLines.forEach(function (element) {
				const item = element.line;
				let n = 0;
				while (n < item.length) {
					if (item[n] !== ` `) {
						break;
					}
					n++;
				}
				if (n > 0 && n < count) {
					count = n;
				}
			});
			return 0;
		};

		if (queue.length) {
			queue.push(pc);
			return;
		}
		program.register(program);
		queue.push(pc);
		while (queue.length > 0) {
			program.pc = queue.shift();
			program.watchdog = 0;
			while (program.running) {
				if (program.watchdog > 1000000) {
					program.lino = program[program.pc].lino;
					program.reportError(
						new Error(`Program runaway intercepted.\nHave you forgotten to increment a loop counter?`, program),
						program);
					break;
				}
				program.watchdog++;
				const domain = program[program.pc].domain;
				if (program.debugStep) {
					console.log(`${program.script}: Line ${program[program.pc].lino}: `
					+ `${domain}:${program[program.pc].keyword} - ${program.source.scriptLines[program.pc].line})`);
				}
				const handler = program.domain[domain];
				if (!handler) {
					program.runtimeError(program[program.pc].lino, `Unknown domain '${domain}'`);
					break;
				}
				program.pc = handler.run(program);
				if (!program.pc) {
					break;
				}
				if (program.stop) {
					program.tracing = false;
					break;
				}
				if (program.tracing) {
					const command = program[program.pc];
					const scriptLines = program.source.scriptLines;
					const minSpace = minIndent(scriptLines);
					const tracer = document.getElementById(`easycoder-tracer`);
					if (!tracer) {
						program.runtimeError(command.lino, `Element 'easycoder-tracer' was not found`);
						return;
					}
					tracer.style.display = `block`;
					tracer.style.visibility = `visible`;
					var variables = ``;
					if (program.tracer) {
						const content = document.getElementById(`easycoder-tracer-content`);
						if (content) {
							program.tracer.variables.forEach(function (name, index, array) {
								const symbol = program.getSymbolRecord(name);
								if (symbol.elements > 1) {
									variables += `${name}: ${symbol.index}/${symbol.elements}: `;
									for (var n = 0; n < symbol.elements; n++) {
										const value = symbol.value[n];
										if (value) {
											variables += `${value.content} `;
										} else {
											variables += `undefined `;
										}
									}
								} else {
									const value = symbol.value[symbol.index];
									if (value) {
										variables += `${name}: ${value.content}`;
									} else {
										variables += `${name}: undefined`;
									}
								}
								switch (program.tracer.alignment) {
								case `horizontal`:
									if (index < array.length - 1) {
										variables += `, `;
									}
									break;
								case `vertical`:
									variables += `<br>`;
									break;
								}
							});
							variables += `<hr>`;
							var trace = ``;
							for (var n = 5; n > 0; n--) {
								if (command.lino) {
									const text = scriptLines[command.lino - n].line.substr(minSpace);
									trace += `<input type="text" name="${n}"` +
                  `value="${command.lino - n + 1}: ${text.split(`\\s`).join(` `)}"` +
                  `style="width:100%;border:none;enabled:false">`;
								}
								trace += `<br>`;
							}
							content.innerHTML = `${variables} ${trace}`;
							content.style.display = `block`;
							const run = document.getElementById(`easycoder-run-button`);
							const step = document.getElementById(`easycoder-step-button`);

							run.onclick = function () {
								run.blur();
								program.tracing = false;
								const content = document.getElementById(`easycoder-tracer-content`);
								content.style.display = `none`;
								try {
									EasyCoder_Run.run(program, program.resume);
								} catch (err) {
									const message = `Error in run handler: ` + err.message;
									console.log(message);
									alert(message);
								}
							};

							step.onclick = function () {
								console.log(`step`);
								step.blur();
								program.tracing = true;
								const content = document.getElementById(`easycoder-tracer-content`);
								content.style.display = `block`;
								try {
									program.run(program.resume);
								} catch (err) {
									const message = `Error in step handler: ` + err.message;
									console.log(message);
									alert(message);
								}
							};
						}

						program.resume = program.pc;
						program.pc = 0;
					}
					break;
				}
			}
		}
	},

	exit: (program) => {
		if (program.onExit) {
			program.run(program.onExit);
		}
		let parent = program.parent;
		let afterExit = program.afterExit;
		delete EasyCoder.scripts[program.script];
		if (program.module) {
			delete program.module.program;
		}
		Object.keys(program).forEach(function(key) {
			delete program[key];
		});
		if (parent && afterExit) {
			EasyCoder.scripts[parent].run(afterExit);
		}
	}
};
