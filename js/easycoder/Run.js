const EasyCoder_Run = {

	name: `EasyCoder_Run`,

	run: (program, pc) =>{
		if (typeof pc === `undefined` || pc === null) {
			return;
		}

		// While tracer is paused, suppress only periodic `every` callbacks.
		// Other async continuations (e.g. attach completion) must still resume.
		if (
			program.tracing &&
			typeof program.resume !== `undefined` &&
			pc !== program.resume &&
			program.everyCallbacks &&
			program.everyCallbacks[pc]
		) {
			return;
		}

		if (!program.runQueue) {
			program.runQueue = [];
		}
		if (typeof program.runningQueue === `undefined`) {
			program.runningQueue = false;
		}
		const queue = program.runQueue;

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

		if (program.runningQueue) {
			queue.push(pc);
			return;
		}
		program.runningQueue = true;
		program.register(program);
		queue.push(pc);
		if (!program.tracing && program.intentQueue && program.intentQueue.length > 0) {
			while (program.intentQueue.length > 0) {
				queue.push(program.intentQueue.shift());
			}
		}
		try {
			while (queue.length > 0) {
				let pausedForTrace = false;
				program.pc = queue.shift();
				program.watchdog = 0;
				while (program.running) {
				const activeCommand = program[program.pc];
				if (activeCommand && activeCommand.lino) {
					program.lastLino = activeCommand.lino;
				}
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
					const lino = program[program.pc].lino;
					let line = '';
					try {
						line = program.source.scriptLines[lino - 1].line;
					}
					catch (e) {
					}
					EasyCoder.writeToDebugConsole(`${program.script}: Line ${lino}: `
					+ `${domain}:${program[program.pc].keyword} - ${line}`);
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
					const displayLino = command && command.lino ? command.lino : (program.lastLino || 0);
					const tracer = document.getElementById(`easycoder-tracer`);
					if (!tracer) {
						program.runtimeError(command.lino, `Element 'easycoder-tracer' was not found`);
						return;
					}
					tracer.style.display = `block`;
					tracer.style.visibility = `visible`;
					var variables = ``;
					if (program.tracer) {
						// Drop stale callbacks so step resumes from the traced instruction path.
						queue.length = 0;
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
								if (displayLino && scriptLines[displayLino - n]) {
									const text = scriptLines[displayLino - n].line.substr(minSpace);
									trace += `<input type="text" name="${n}"` +
								  `value="${displayLino - n + 1}: ${text.split(`\\s`).join(` `)}"` +
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
										EasyCoder.writeToDebugConsole(message);
									alert(message);
								}
							};

							step.onclick = function () {
									EasyCoder.writeToDebugConsole(`step`);
								step.blur();
								program.tracing = true;
								const content = document.getElementById(`easycoder-tracer-content`);
								content.style.display = `block`;
								try {
									EasyCoder_Run.run(program, program.resume);
								} catch (err) {
									const message = `Error in step handler: ` + err.message;
										EasyCoder.writeToDebugConsole(message);
									alert(message);
								}
							};
						}

						program.resume = program.pc;
						program.pc = 0;
					}
					pausedForTrace = true;
					break;
				}
				}
				if (pausedForTrace) {
					break;
				}
			}
		} finally {
			program.runningQueue = false;
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
