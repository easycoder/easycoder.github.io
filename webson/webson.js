const EasyCoder_Webson = {

	name: `EasyCoder_Webson`,

	Render: {
        // render Script in Parent

		compile: compiler => {
			const lino = compiler.getLino();
            const script = compiler.getNextValue();
            if (compiler.tokenIs(`in`)) {
                if (compiler.nextIsSymbol()) {
                    const parentRecord = compiler.getSymbolRecord();
                    if (parentRecord.extra === `dom`) {
                        compiler.next();
                        compiler.addCommand({
                            domain: `webson`,
                            keyword: `render`,
                            lino,
                            parent: parentRecord.name,
                            script
                        });
                        return true;
                    }
                }
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const parent = program.getSymbolRecord(command.parent);
            const element = parent.element[parent.index];
            const script = program.getValue(command.script);
            Webson.render(element, `main`, script)
                .then(() => {
                    program.run(command.pc + 1);
                })
                .catch((err) => {
                    program.runtimeError(command.lino, err.message ? err.message : String(err));
                });
            return 0;
		}
	},

	// Values
	value: {

		compile: compiler => {
            return null;
		},

		get: (program, value) => {
			return null;
		}
	},

	// Conditions
	condition: {

		compile: compiler => {
		},

		test: (program, condition) => {
            return false;
        }
    },

	// Dispatcher
	getHandler: name => {
		switch (name) {
            case `render`:
                return EasyCoder_Webson.Render;
            default:
                return false;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_Webson.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'dom' package`);
		}
		return handler.run(program);
	}
};

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.webson = EasyCoder_Webson;

// Webson is a rendering engine for JSON-based markup scripts.
    
    const Webson = {
    
    // Expand all variables in a value.
    // Expressions inside angle braces are fed to eval().
    expand: (element, input, symbols) => {
        let output = input;
        let mod = true;
        let values;
        let changed = false;
        if (typeof input === `object`) {
            const keys = Object.keys(input);
            for (let key of keys) {
                switch (key) {
                    case `#select`:
                        // Process an array selector
                        const value = Webson.expand(element, input[key], symbols);
                        const index = input[`#index`];
                        if (typeof index === `undefined`) {
                            throw Error(`#select '${input[key]} has no #index`);
                        }
                        output = value[Webson.expand(element, index, symbols)];
                        mod = true;
                        changed = true;
                        break;
                    default:
                        break;
                }
            }
        } else {
            while (mod) {
                mod = false;
                re = /(?:\#|\$)[a-zA-Z0-9_.]*/g;
                while ((values = re.exec(output)) !== null) {
                    let item = values[0];
                    switch (item[0]) {
                        case `#`:
                            // Evaluate system values
                            switch (item) {
                                case `#element_width`:
                                    output = output.replace(item, element.offsetWidth);
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#parent_width`:
                                    output = output.replace(
                                        item, element.parentElement.offsetWidth);
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#random`:
                                    output = output.replace(item, Math.floor(Math.random() * 10));
                                    mod = true;
                                    changed = true;
                                    break;
                                case `#step`:
                                    output = output.replace(item, symbols[`#step`]);
                                    mod = true;
                                    changed = true;
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case `$`:
                            let value = item;
                            const val = symbols[item];
                            if (Array.isArray(val)) {
                                output = val;
                            } else {
                                value = Webson.expand(element, val, symbols);
                                output = output.replace(item, value);
                            }
                            mod = true;
                            changed = true;
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        // Remove braces. Try to evaluate their contents.
        // If this doesn't work, assume it's a value that can't be further simplified.
        changed = true;
        while (changed) {
            changed = false;
            try {
                const p = output.lastIndexOf(`<`);
                if (p >= 0) {
                    const q = output.indexOf(`>`, p);
                    if (q < 0) {
                        throw Error(`Mismatched braces in ${input}`);
                    }
                    const substr = output.substring(p + 1, q);
                    if (!['b', '/b', 'i', '/i', 'br', '/br'].includes(substr)) {
                        let repl = `<${substr}>`;
                        try {
                            const v = eval(substr);
                            output = output.replace(repl, v);
                        } catch (e) {
                            output = output.replace(repl, substr);
                        }
                        changed = true;
                    }
                }
            }
            catch (e) {
            }
        }
        return output;
    },
    
    // Get the definitions from a set of items
    getDefinitions: (items, symbols) => {
        const keys = Object.keys(items);
        for (let key of keys) {
            if (key[0] === `$`) {
                symbols[key] = items[key];
            }
        }
    },
    
    // Include another script
    include: async (parent, name, path, symbols) => {
        if (symbols[`#debug`] >= 2) {
            console.log(`#include ${name}: ${path}`);
        }
        const response = await fetch(path);
        const script = await response.text();
        await Webson.build(parent, name, JSON.parse(script), symbols);
    },

    // Cache for external text files
    textCache: {},

    // Load text content from file (cached)
    loadTextFile: async (path) => {
        if (typeof Webson.textCache[path] !== `undefined`) {
            return Webson.textCache[path];
        }
        const response = await fetch(path);
        if (!response.ok) {
            throw Error(`Unable to load text file '${path}' (${response.status})`);
        }
        const text = await response.text();
        Webson.textCache[path] = text;
        return text;
    },

    // Resolve $variables backed by external text files
    resolveFileBackedSymbols: async (items, symbols, element) => {
        for (const key of Object.keys(items)) {
            if (key[0] !== `$`) {
                continue;
            }
            const def = items[key];
            if (typeof def !== `object` || Array.isArray(def) || def === null) {
                continue;
            }
            const filePathSpec = typeof def[`#textFile`] !== `undefined`
                ? def[`#textFile`]
                : def[`#file`];
            if (typeof filePathSpec === `undefined`) {
                continue;
            }
            const filePath = Webson.expand(element, filePathSpec, symbols);
            const text = await Webson.loadTextFile(filePath);
            items[key] = text;
            symbols[key] = text;
            if (symbols[`#debug`] >= 2) {
                console.log(`File variable ${key}: ${filePath}`);
            }
        }
    },

    waitForElementReady: (element) => {
        if (!element || element.tagName !== `IMG`) {
            return Promise.resolve();
        }
        if (element.complete) {
            return Promise.resolve();
        }
        const timeoutMs = 5000;
        return new Promise(resolve => {
            let finished = false;
            const finish = () => {
                if (finished) {
                    return;
                }
                finished = true;
                element.removeEventListener(`load`, finish);
                element.removeEventListener(`error`, finish);
                resolve();
            };
            element.addEventListener(`load`, finish);
            element.addEventListener(`error`, finish);
            setTimeout(finish, timeoutMs);
        });
    },

    // Build a DOM structure
    build: async (parent, name, items, parentSymbols) => {
        if (typeof parent === `undefined`) {
            throw Error(`build: 'parent' is undefined`);
        }
        if (typeof name === `undefined`) {
            throw Error(`build: element is undefined (is the #element directive missing?`);
        }
        if (typeof items === `undefined`) {
            throw Error(`build: ${name} has no properties`);
        }
        const symbols = JSON.parse(JSON.stringify(parentSymbols));
        Webson.getDefinitions(items, symbols);
        await Webson.resolveFileBackedSymbols(items, symbols, parent);
        if (typeof items[`#debug`] !== `undefined`) {
            symbols[`#debug`] = items[`#debug`];
        }
        if (symbols[`#debug`] >= 2) {
            console.log(`Build ${name}`);
        }
        if (typeof items[`#doc`] !== `undefined` && symbols[`#debug`] >= 1) {
            console.log(items[`#doc`]);
        }

        let element = parent;
        const elementType = items[`#element`];
        if (typeof elementType !== `undefined`) {
            if (symbols[`#debug`] >= 2) {
                console.log(`#element: ${elementType}`);
            }
            element = document.createElement(elementType);
            parent.appendChild(element);
        }
        symbols[`#element`] = element;

        for (const key of Object.keys(items)) {
            let value = items[key];
            switch (key) {
                case `#`:
                case `#debug`:
                case `#doc`:
                case `#element`:
                    break;
                case `#content`:
                    var val = ``;
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            val += Webson.expand(element, item, symbols);
                        }
                    } else {
                        val = Webson.expand(element, value, symbols);
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#content: ${value} -> ${val}`);
                    }
                    symbols[value] = val;
                    switch (element.type) {
                        case `text`:
                        case `textarea`:
                        case `input`:
                            element.value = val;
                            break;
                        default:
                            element.innerHTML = val;
                            break;
                    }
                    break;
                case `#repeat`:
                    symbols[`#steps`] = 0;
                    for (let item in value) {
                        switch (item) {
                            case `#doc`:
                                if (symbols[`#debug`] >= 1) {
                                    console.log(value[item]);
                                }
                                break;
                            case `#target`:
                                symbols[`#target`] = value[item];
                                break;
                            case `#steps`:
                                const stepspec = value[item];
                                for (let stepitem in stepspec) {
                                    switch (stepitem) {
                                        case `#arraysize`:
                                            const targetName = stepspec[stepitem];
                                            symbols[`#steps`] = symbols[targetName].length;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#repeat: ${symbols[`#target`]}, ${symbols[`#steps`]}`);
                    }
                    for (let step = 0; step < symbols[`#steps`]; step++) {
                        symbols[`#step`] = step;
                        await Webson.build(element, `${name}[${step}]`, symbols[symbols[`#target`]], symbols);
                    }
                    break;
                case `#include`:
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            const defs = Object.keys(item);
                            const includeName = defs[0];
                            const path = item[includeName];
                            await Webson.include(element, includeName, path, symbols);
                        }
                    } else if (typeof value === `object`) {
                        const defs = Object.keys(value);
                        const includeName = defs[0];
                        const path = value[includeName];
                        await Webson.include(element, includeName, path, symbols);
                    } else {
                        await Webson.include(element, value, value, symbols);
                    }
                    break;
                case `#switch`:
                    for (let state of Object.keys(value)) {
                        if (state === symbols[`#state`]) {
                            await Webson.build(element, value[state], symbols[value[state]], symbols);
                            return;
                        }
                    }
                    await Webson.build(element, name, symbols[value[`default`]], symbols);
                    return;
                case `#onClick`:
                    element.onClickItems = value;
                    element.onclick = function (event) {
                        event.stopPropagation();
                        for (let state of Object.keys(element.onClickItems)) {
                            if (state === symbols[`#state`]) {
                                Webson.parent.replaceChildren();
                                void Webson.build(Webson.parent, Webson.name, Webson.script, {
                                    "debug": 0,
                                    "#state": value[state]
                                });
                                return false;
                            }
                        }
                        return false;
                    };
                    break;
                default:
                    if (key[0] === `@`) {
                        const aName = key.substring(1);
                        const aValue = Webson.expand(parent, value, symbols);
                        if (typeof aValue === `undefined`) {
                            throw Error(`Element ${value} could not be found`);
                        }
                        element.setAttribute(aName, aValue);
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Attribute ${aName}: ${JSON.stringify(value, 0, 0)} -> ${aValue}`);
                        }
                    } else if (key[0] === `$`) {
                        const userVal = Webson.expand(element, value, symbols);
                        symbols[key] = userVal;
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Variable ${key}: ${JSON.stringify(value, 0, 0)} -> ${userVal}`);
                        }
                    } else {
                        const styleVal = Webson.expand(element, value, symbols);
                        element.style[key] = styleVal;
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Style ${key}: ${JSON.stringify(value, 0, 0)} -> ${styleVal}`);
                        }
                    }
                    break;
            }
        }

        if (typeof items[`#`] !== `undefined`) {
            const data = items[`#`];
            if (Array.isArray(data)) {
                for (const childName of data) {
                    await Webson.build(element, childName, symbols[childName], symbols);
                }
            } else if (data[0] === `$`) {
                await Webson.build(element, data, symbols[data], symbols);
            }
        }

        await Webson.waitForElementReady(element);
    },

    // Render a script into a given container
    render: async (parent, name, script) => {
        Webson.parent = parent;
        Webson.name = name;
        Webson.script = JSON.parse(script);
        await Webson.build(parent, name, Webson.script, {
            "#debug": 0,
            "#state": "default"
        });
    }
};
