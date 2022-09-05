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
            Webson.render(element, `main`, script);
			return command.pc + 1;
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
                    let repl = `<${substr}>`;
                    try {
                        const v = eval(substr);
                        output = output.replace(repl, v);
                    } catch (e) {
                        //output = output.replace(repl, substr);
                    }
                    changed = true;
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
    include: (parent, name, path, symbols) => {
        if (symbols[`#debug`] >= 2) {
            console.log(`#include ${name}: ${path}`);
        };
        fetch(path)
            .then(response => response.text())
            .then((script) => {
                element = document.createElement(`div`);
                Webson.build(parent, name, JSON.parse(script), symbols);
                parent.appendChild(element);
            });
    },
    
    // Build a DOM structure
    build: (parent, name, items, parentSymbols) => {
        if (typeof parent === `undefined`) {
            throw Error(`build: 'parent' is undefined`);
        }
        if (typeof name === `undefined`) {
            throw Error(`build: element is undefined (is the #element directive missing?`);
        }
        if (typeof items === `undefined`) {
            throw Error(`build: item is undefined`);
        }
        // Deep copy the symbol table
        const symbols = JSON.parse(JSON.stringify(parentSymbols));
        // Expand all definitions
        Webson.getDefinitions(items, symbols);
        // Set the debug level
        if (typeof items[`#debug`] !== `undefined`) {
            symbols[`#debug`] = items[`#debug`];
        }
        if (symbols[`#debug`] >= 2) {
            console.log(`Build ${name}`);
        }
        if (typeof items[`#doc`] !== `undefined`) {
            if (symbols[`#debug`] >= 1) {
                console.log(items[`#doc`]);
            }
        }
        // Set up an element if there is one.
        // If the element is a DOM type, create it and append it to the parent.
        // Otherwise, set the current element to the parent.
        // Then apply styles, content etc. 
        let element = parent;
        const elementType = items[`#element`];
        if (typeof elementType != `undefined`) {
            if (symbols[`#debug`] >= 2) {
                console.log(`#element: ${elementType}`);
            }
            element = document.createElement(elementType);
            parent.appendChild(element);
        }
        symbols[`#element`] = element;
        // Do the main operations
        Object.keys(items).forEach(function(key) {
            let value = items[key];
            switch (key) {
                case `#`:
                case `#debug`:
                case "#doc":
                case `#element`:
                    break;
                case `#content`:
                    // Handle the content of the element
                    // If it's an array, expand it and catenate the elements
                    var val;
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            val += Webson.expand(element, item, symbols);
                        } 
                    } else {
                        val = Webson.expand(element, value, symbols);
                    }
                    // const val = Webson.expand(element, value, symbols);
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#content: ${value} -> ${val}`);
                    }
                    // Update the item in the symbol table
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
                    // Implement a repeat directive
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
                                            const name = stepspec[stepitem];
                                            symbols[`#steps`] = symbols[name].length;
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    if (symbols[`#debug`] >= 2) {
                        console.log(`#repeat: ${symbols[`#target`]}, ${symbols[`#steps`]}`);
                    }
                    for (let step = 0; step < symbols[`#steps`]; step++) {
                        symbols[`#step`] = step;
                        Webson.build(
                            element, `${name}[${step}]`, symbols[symbols[`#target`]], symbols);
                    }
                    break;
                case `#include`:
                    // Include another Webson script
                    if (typeof value === `object`) {
                        const defs = Object.keys(value);
                        const name = defs[0];
                        const path = value[name];
                        Webson.include(element, name, path, symbols);
                    } else if (Array.isArray(value)) {
                        for (item of value) {
                            const defs = Object.keys(item);
                            const name = defs[0];
                            const path = item[name];
                            Webson.include(element, name, path, symbols);
                        }
                    } else {
                        Webson.include(element, value, value, symbols);
                    }
                    break;
                case `#switch`:
                    // Implement a switch
                    const keys = Object.keys(value);
                    for (let state of keys) {
                        if (state === symbols[`#state`]) {
                            Webson.build(element, value[state], symbols[value[state]], symbols);
                            return;
                        }
                    };
                    Webson.build(element, name, symbols[value[`default`]], symbols);
                    break;
                case `#onClick`:
                    // Handle a click on the element
                    element.onClickItems = value;
                    element.onclick = function (event) {
                        event.stopPropagation();
                        for (let state of Object.keys(element.onClickItems)) {
                            if (state === symbols[`#state`]) {
                                Webson.parent.replaceChildren();
                                Webson.build(Webson.parent, Webson.name, Webson.script, {
                                    "debug": 0,
                                    "#state": value[state]
                                });
                                return false;
                            }
                        };
                        return false;
                    }
                    break;
                default:
                    if (key[0] === `@`) {
                        // Handle attributes
                        const aName = key.substring(1);
                        const aValue = Webson.expand(parent, value, symbols);
                        element.setAttribute(aName, aValue);
                        if (symbols[`#debug`] >= 2) {
                            console.log(
                                `Attribute ${aName}: ${JSON.stringify(value,0,0)} -> ${aValue}`);
                        }
                    } else if (key[0] === `$`) {
                        // Handle user variables
                        const val = Webson.expand(element, value, symbols);
                        symbols[key] = val;
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Variable ${key}: ${JSON.stringify(value,0,0)} -> ${val}`);
                        }
                    } else {
                        // Handle properties
                        const val = Webson.expand(element, value, symbols);
                        element.style[key] = val;
                        if (symbols[`#debug`] >= 2) {
                            console.log(`Style ${key}: ${JSON.stringify(value,0,0)} -> ${val}`);
                        }
                    }
                    break;
            }
        });
        // Get children
        if (typeof items[`#`] !== `undefined`) {
            const data = items[`#`];
            if (Array.isArray(data)) {
                data.forEach(function(name) {
                    Webson.build(element, name, symbols[name], symbols);
                });
            } else if (data[0] === `$`) {
                Webson.build(element, data, symbols[data], symbols);
            }
        }
    }, 
    
    // Render a script into a given container
    render: (parent, name, script) => {
        Webson.parent = parent;
        Webson.name = name;
        Webson.script = JSON.parse(script);
        Webson.build(parent, name, Webson.script, {
            "#debug": 0,
            "#state": "default"
        });
    }
};
