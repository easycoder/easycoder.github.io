const EasyCoder = {

	name: `EasyCoder_Main`,

	domain: {
		core: EasyCoder_Core
	},

	elementId: 0,

	runtimeError: function (lino, message) {
		this.lino = lino;
		this.reportError({
			message: `Line ${(lino >= 0) ? lino : ``}: ${message}`
		}, this.program);
		if (this.program) {
			this.program.aborted = true;
		}
	},
	nonNumericValueError: function (lino) {
		this.runtimeError(lino, `Non-numeric value`);
	},
	variableDoesNotHoldAValueError: function (lino, name) {
		this.runtimeError(lino, `Variable '${name}' does not hold a value`);
	},

	reportError: function (err, program, source) {
		if (!err.message) {
			console.log(`An error occurred - origin was ${err.path[0]}`);
			return;
		}
		if (!this.compiling && !program) {
			const errString = `Error: ${err.message}`;
			alert(errString);
			console.log(errString);
			return;
		}
		// const compiler = EasyCoder_Compiler;
		const {
			tokens,
			scriptLines
		} = source ? source : program.source;
		const lino = this.compiling ? tokens[EasyCoder_Compiler.getIndex()].lino : program[program.pc].lino;
		var errString = this.compiling ? `Compile error` : `Runtime error in '${program.script}'`;
		errString += `:\n`;
		var start = lino - 5;
		start = start < 0 ? 0 : start;
		for (var n = start; n < lino; n++) {
			const nn = (`` + (n + 1)).padStart(4, ` `);
			errString += nn + ` ` + scriptLines[n].line.split(`\\s`).join(` `) + `\n`;
		}
		errString += `${err.message}\n`;
		const warnings = EasyCoder_Compiler.getWarnings();
		if (warnings.length) {
			errString += `Warnings:\n`;
			for (const warning of warnings) {
				errString += `${warning}\n`;
			}
		}
		console.log(errString);
		alert(errString);
	},

	getSymbolRecord: function (name) {
		const target = this[this.symbols[name].pc];
		if (target.alias) {
			return this.getSymbolRecord(target.alias);
		}
		if (target.exporter) {
			// if (target.exporter != this.script) {
			return EasyCoder.scripts[target.exporter].getSymbolRecord(target.exportedName);
			// }
		}
		return target;
	},

	verifySymbol: function (name) {
		return this.symbols.hasOwnProperty(name);
	},

	encode: function (value) {
		return EasyCoder_Value.encode(value, this.encoding);
	},

	decode: function (value) {
		return EasyCoder_Value.decode(value, this.encoding);
	},

	evaluate: function (value) {
		return EasyCoder_Value.evaluate(this, value);
	},

	getValue: function (value) {
		return EasyCoder_Value.getValue(this, value);
	},

	getFormattedValue: function (value) {
		const v = EasyCoder_Value.evaluate(this, value);
		if (v.numeric) {
			return v.content;
		}
		if (v.type === `boolean`) {
			return v.content ? `true` : `false`;
		}
		if (this.isJsonString(v.content)) {
			try {
				const parsed = JSON.parse(v.content);
				return JSON.stringify(parsed, null, 2);
			} catch (err) {
				this.reportError(err);
				return `{}`;
			}
		}
		return v.content;
	},

	getSimpleValue: function (content) {
		if (content === true || content === false) {
			return {
				type: `boolean`,
				content
			};
		}
		return {
			type: `constant`,
			numeric: Number.isInteger(content),
			content
		};
	},

	run: function (pc) {
		if (pc) {
			this.program = this;
			EasyCoder_Run.run(this, pc);
		}
	},

	exit: function () {
		EasyCoder_Run.exit(this);
	},

	register: (program) => {
		this.program = program;
	},

	require: function(type, src, cb) {
		const element = document.createElement(type === `css` ? `link` : `script`);
		switch (type) {
		case `css`:
			element.type = `text/css`;
			element.href = src;
			element.rel = `stylesheet`;
			break;
		case `js`:
			element.type = `text/javascript`;
			element.src = src;
			break;
		default:
			return;
		}
		element.onload = function () {
			console.log(`${Date.now() - EasyCoder.timestamp} ms: Library ${src} loaded`);
			cb();
		};
		document.head.appendChild(element);
	},

	isUndefined: item => {
		return typeof item === `undefined`;
	},

	isJsonString: function (str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	},

	runScript: function (program) {
		const command = program[program.pc];
		const script = program.getValue(command.script);
		const imports = command.imports;
		imports.caller = program.script;
		const moduleRecord = command.module ? program.getSymbolRecord(command.module) : null;
		try {
			EasyCoder.tokeniseAndCompile(script.split(`\n`), imports, moduleRecord, this.script, command.then);
		} catch (err) {
			EasyCoder.reportError(err, program, program.source);
			if (program.onError) {
				program.run(program.onError);
			} else {
				let parent = EasyCoder.scripts[program.parent];
				if (parent && parent.onError) {
					parent.run(parent.onError);
				}
			}
			return;
		}
		if (command.nowait) {
			EasyCoder.run(program.nextPc);
		}
	},

	close: function () {},

	compileScript: function (source, imports, module, parent) {
		const {
			tokens
		} = source;
		this.compiling = true;
		const compiler = EasyCoder_Compiler;
		this.compiler = compiler;
		compiler.value = EasyCoder_Value;
		compiler.condition = EasyCoder_Condition;
		compiler.domain = this.domain;
		compiler.imports = imports;
		compiler.continue = false;
		const program = EasyCoder_Compiler.compile(tokens);
		//    console.log('Program: ' + JSON.stringify(program, null, 2));
		this.compiling = false;

		program.EasyCoder = this;
		program.value = EasyCoder_Value;
		program.condition = EasyCoder_Condition;
		program.compare = EasyCoder_Compare;
		program.source = source;
		program.run = this.run;
		program.exit = this.exit;
		program.runScript = this.runScript;
		program.evaluate = this.evaluate;
		program.getValue = this.getValue;
		program.getFormattedValue = this.getFormattedValue;
		program.getSimpleValue = this.getSimpleValue;
		program.encode = this.encode;
		program.decode = this.decode;
		program.domain = this.domain;
		program.require = this.require;
		program.isUndefined = this.isUndefined;
		program.isJsonString = this.isJsonString;
		program.checkPlugin = this.checkPlugin;
		program.getPlugin = this.getPlugin;
		program.addLocalPlugin = this.addLocalPlugin;
		program.getPluginsPath = this.getPluginsPath;
		program.getSymbolRecord = this.getSymbolRecord;
		program.verifySymbol = this.verifySymbol;
		program.runtimeError = this.runtimeError;
		program.nonNumericValueError = this.nonNumericValueError;
		program.variableDoesNotHoldAValueError = this.variableDoesNotHoldAValueError;
		program.reportError = this.reportError;
		program.register = this.register;
		program.symbols = compiler.getSymbols();
		program.unblocked = false;
		program.encoding = `ec`;
		program.popups = [];
		program.stack = [];
		program.queue = [0];
		program.module = module;
		program.parent = parent;
		if (module) {
			module.program = program.script;
		}
		return program;
	},

	tokeniseFile: function(file) {
		const scriptLines = [];
		const tokens = [];
		let index = 0;
		file.forEach(function (line, lino) {
			scriptLines.push({
				lino: lino + 1,
				line
			});
			const len = line.length;
			let token = ``;
			let inSpace = true;
			for (let n = 0; n < len; n++) {
				const c = line[n];
				if (c.trim().length == 0) {
					if (inSpace) {
						continue;
					}
					tokens.push({
						index,
						lino: lino + 1,
						token
					});
					index++;
					token = ``;
					inSpace = true;
					continue;
				}
				inSpace = false;
				if (c === `\``) {
					m = n;
					while (++n < line.length) {
						if (line[n] === `\``) {
							break;
						}
					}
					token = line.substr(m, n - m + 1);
				} else if (c == `!`) {
					break;
				} else {
					token += c;
				}
			}
			if (token.length > 0) {
				tokens.push({
					index,
					lino: lino + 1,
					token
				});
			}
		});
		return {scriptLines, tokens};
	},

	tokeniseAndCompile: function (file, imports, module, parent, then) {
		//  console.log('Tokenise script: ');
		let program = null;
		const startCompile = Date.now();
		const source = this.tokeniseFile(file);
		try {
			program = this.compileScript(source, imports, module, parent);
			this.scriptIndex++;
			if (!program.script) {
				program.script = this.scriptIndex;
			}
			const finishCompile = Date.now();
			console.log(`${finishCompile - this.timestamp} ms: ` +
				`Compiled ${program.script}: ${source.scriptLines.length} lines (${source.tokens.length} tokens) in ` +
				`${finishCompile - startCompile} ms`);
		} catch (err) {
			if (err.message !== `stop`) {
				let parentRecord = EasyCoder.scripts[parent];
				this.reportError(err, parentRecord, source);
				if (parentRecord && parentRecord.onError) {
					parentRecord.run(parentRecord.onError);
				}
				// Remove this script
				if (EasyCoder_Compiler.script) {
					delete EasyCoder.scripts[EasyCoder_Compiler.script];
					delete EasyCoder_Compiler.script;
				}
			}
			return;
		}
		if (program) {
			EasyCoder.scripts[program.script] = program;
			if (module) {
				module.program = program.script;
			}
			program.afterExit = then;
			program.running = true;
			EasyCoder_Run.run(program, 0);
		}
	},

	tokenise: function(source) {
		const script = source.split(`\n`);
		if (!this.tokenising) {
			try {
				this.tokeniseAndCompile(script);
			} catch (err) {
				this.reportError(err, null, source);
			}
			this.tokenising = true;
		}
	},

	setPluginCount: function(count) {
		EasyCoder.plugins = [];
		EasyCoder.pluginCount = count;
	},

	checkPlugin: function(name) {
		return EasyCoder.domain[name];
	},

	getPlugin: function(name, src, onload) {
		if (EasyCoder.domain[name]) {
			onload();
			return;
		}
		const script = document.createElement(`script`);
		script.type = `text/javascript`;
		let location = document.scripts[0].src;
		location = location.substring(0, location.indexOf(`/easycoder.js`));
		// script.src = `${location}/${src}?ver=${EasyCoder.version}`;
		script.src = `${src}?ver=${EasyCoder.version}`;
		script.onload = function () {
			console.log(`${Date.now() - EasyCoder.timestamp} ms: Plugin ${src} loaded`);
			onload();
		};
		document.head.appendChild(script);
	},

	addGlobalPlugin: function(name, handler) {
		// alert(`Add plugin ${name}`);
		EasyCoder.plugins.push({
			name,
			handler
		});
		if (EasyCoder.plugins.length === EasyCoder.pluginCount) {
			EasyCoder.plugins.forEach(function (plugin) {
				EasyCoder.domain[plugin.name] = plugin.handler;
			});
			EasyCoder.tokenise(EasyCoder.source);
		}
	},

	addLocalPlugin: function(name, handler, callback) {
		EasyCoder.domain[name] = handler;
		callback();
	},

	getPluginsPath: function() {
		return EasyCoder.pluginsPath;
	},

	loadPluginJs: function(path) {
		console.log(`${Date.now() - this.timestamp} ms: Load ${path}/easycoder/plugins.js`);
		const script = document.createElement(`script`);
		script.src = `${window.location.origin}${path}/easycoder/plugins.js?ver=${this.version}`;
		script.type = `text/javascript`;
		script.onload = () => {
			EasyCoder_Plugins.getGlobalPlugins(
				this.timestamp,
				path,
				this.setPluginCount,
				this.getPlugin,
				this.addGlobalPlugin
			);
		};
		script.onerror = () => {
			if (path) {
				this.loadPluginJs(path.slice(0, path.lastIndexOf(`/`)));
			} else {
				this.reportError({
					message: `Can't load plugins.js`
				}, this.program, this.source);
			}
		};
		document.head.appendChild(script);
		this.pluginsPath = path;
	},

	start: function(source) {
		this.source = source;
		this.scriptIndex = 0;
		let pathname = window.location.pathname;
		if (pathname.endsWith(`/`)) {
			pathname = pathname.slice(0, -1);
		} else {
			pathname = ``;
		}
		if (typeof EasyCoder_Plugins === `undefined`) {
			this.loadPluginJs(pathname);
		} else {
			this.pluginsPath = pathname;
			EasyCoder_Plugins.getGlobalPlugins(
				this.timestamp,
				pathname,
				this.setPluginCount,
				this.getPlugin,
				this.addGlobalPlugin
			);
		}
	}
};
