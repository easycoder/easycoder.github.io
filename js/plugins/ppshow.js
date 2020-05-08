const EasyCoder_PP = {

    name: `EasyCoder_PP`,

    pp: {
        defaults: {}
    },
    
	PP: {

		compile: (compiler) => {
            let symbolRecord;
            let token;
            let item;
            let url;
            let value;
            let pp;
            let id;
            const lino = compiler.getLino();
            const action = compiler.nextToken();
            if (compiler.isSymbol()) {
                symbolRecord = compiler.getSymbolRecord();
                if (symbolRecord.keyword === `pppanel`) {
                    token = compiler.nextToken();
                    switch (token) {
                        case `text`:
                            value = compiler.getNextValue();
                            compiler.addCommand({
                                domain: `pp`,
                                keyword: `pp`,
                                lino,
                                action: `setText`,
                                name: symbolRecord.name,
                                value
                            });
                            return true;
                        case `dissolve`:
                            if (compiler.nextTokenIs(`to`)) {
                                value = compiler.getNextValue();
                                let duration = EasyCoder_Value.constant(`1.0`, false);
                                if (compiler.tokenIs(`duration`)){
                                    duration= compiler.getNextValue();
                                }
                                compiler.addCommand({
                                    domain: `pp`,
                                    keyword: `pp`,
                                    lino,
                                    action: `dissolve`,
                                    name: symbolRecord.name,
                                    value,
                                    duration
                                });
                                return true;
                            }
                    }
                }
                return false;
            }
            switch (action) {
                case `attach`:
                    if (compiler.nextTokenIs(`to`)) {
                        compiler.next();
                    }
                    if (compiler.isSymbol()) {
                        symbolRecord = compiler.getSymbolRecord();
                        if (symbolRecord.keyword === `div`) {
                            compiler.next();
                            compiler.addCommand({
                                domain: `pp`,
                                keyword: `pp`,
                                lino,
                                action: `attachDiv`,
                                container: symbolRecord.name
                            });
                            return true;
                        }
                    } else {
                        id = compiler.getValue();
                        compiler.addCommand({
                            domain: `pp`,
                            keyword: `pp`,
                            lino,
                            action: `attachId`,
                            id
                        });
                        return true;
                    }
                    break;
                case `background`:
                    url = compiler.getNextValue();
                    compiler.addCommand({
                        domain: `pp`,
                        keyword: `pp`,
                        lino,
                        action,
                        url
                    });
                    return true;
                case `init`:
                    const overrides = [];
                    compiler.next();
                    item = `0`;
                    while (item) {
                        item = compiler.getToken();
                        switch (item) {
                            case `fontFace`:
                            case `fontSize`:
                            case `fontWeight`:
                            case `fontStyle`:
                            case `fontColor`:
                            case `textAlign`:
                            case `panelLeft`:
                            case `panelTop`:
                            case `panelWidth`:
                            case `panelHeight`:
                            case `panelBorder`:
                            case `panelPadding`:
                            case `panelBackground`:
                                value = compiler.getNextValue();
                                overrides.push({item,value});
                                break;
                            default:
                                item = null;
                                break;
                        }
                    }
                    compiler.addCommand({
                        domain: `pp`,
                        keyword: `pp`,
                        lino,
                        action,
                        overrides
                    });
                    return true;
                case `panel`:
                    symbolRecord = compiler.compileVariable(`pp`, `pppanel`);
                    pp = {};
                    while (true) {
                        item = compiler.getToken();
                        if ([`panelLeft`, `panelTop`, `panelWidth`, `panelHeight`,
                            `panelBorder`, `panelPadding`, `panelBackground`,
                            `fontFace`, `fontSize`, `fontWeight`, `fontStyle`, `fontColor`,
                            `textAlign`]
                            .includes(item)) {
                            value = compiler.getNextValue();
                            pp[item] = value;
                        }
                        else {
                            break;
                        }
                    }
                    compiler.addCommand({
                        domain: `pp`,
                        keyword: `pp`,
                        lino,
                        action,
                        name: symbolRecord.name,
                        pp
                    });
                    return true;
                default:
                    break;
            }
			return false;
		},

		run: (program) => {
            const command = program[program.pc];
            const action = command.action;
            let symbolRecord;
            let element;
            let inner;
            let newInner;
            let container;
            let steps;
            let pp;
            let values;
            let value;
            let w;
            let h;
            let n;
            const nConst = (content) => {
                return {
                    type: `constant`,
                    numeric: true,
                    content
                };
            };
            const sConst = (content) => {
                return {
                    type: `constant`,
                    numeric: false,
                    content
                };
            };
            const setupContainer = (program, container) => {
                EasyCoder_PP.pp.container = container;
                container.style[`position`] = `relative`;
                container.style[`overflow`] = `hidden`;
                const defaults =  EasyCoder_PP.pp.defaults;
                const height = parseFloat(container.offsetWidth)
                    * program.getValue(defaults.aspectH) / program.getValue(defaults.aspectW);
                container.style[`height`] = `${Math.round(height)}px`;
            };
            const step = (n, then) => {
                const opacity = parseFloat(n) / steps;
                newInner.style[`opacity`] = opacity;
                inner.style[`opacity`] = 1.0 - opacity;
                if (n < steps) {
                    setTimeout(function () {
                        step(n + 1, then);
                    }, 100);
                } else {
                    then();
                }
            };
            switch (action) {
                case `attachDiv`:
                    symbolRecord = program.getSymbolRecord(command.container);
                    container = symbolRecord.element[symbolRecord.index];
                    setupContainer(program, container);
                    break;
                case `attachId`:
                    container = document.getElementById(program.getValue(command.id));
                    setupContainer(program, container);
                    break;
                case `background`:
                    container = EasyCoder_PP.pp.container;
                    container.style[`background-image`] = `url("${program.getValue(command.url)}")`;
                    container.style[`background-size`] = `cover`;
                    break;
                case `init`:
                    EasyCoder_PP.pp.container = null;
                    EasyCoder_PP.pp.defaults = {
                        aspectW: nConst(16),
                        aspectH: nConst(9),
                        fontFace: sConst(`sans-serif`),
                        fontSize: nConst(50),
                        fontWeight: sConst(`normal`),
                        fontStyle: sConst(`normal`),
                        fontColor: sConst(`black`),
                        textAlign: sConst(`left`),
                        panelLeft: nConst(100),
                        panelTop: nConst(100),
                        panelWidth: nConst(800),
                        panelHeight: nConst(800),
                        panelBorder: sConst(`1px solid black`),
                        panelPadding: sConst(`1em`),
                        panelBackground: sConst(`none`)
                    };
                    for (const item of command.overrides) {
                        EasyCoder_PP.pp.defaults[item.item] = item.value;
                    }
                    break;
                case `panel`:
                    symbolRecord = program.getSymbolRecord(command.name);
                    pp = command.pp;
                    values = JSON.parse(JSON.stringify(EasyCoder_PP.pp.defaults))
                    if (pp.panelLeft) {
                        values.panelLeft = pp.panelLeft;
                    }
                    if (pp.panelTop) {
                        values.panelTop = pp.panelTop;
                    }
                    if (pp.panelWidth) {
                        values.panelWidth = pp.panelWidth;
                    }
                    if (pp.panelHeight) {
                        values.panelHeight = pp.panelHeight;
                    }
                    if (pp.panelBorder) {
                        values.panelBorder = pp.panelBorder;
                    }
                    if (pp.panelPadding) {
                        values.panelPadding = pp.panelPadding;
                    }
                    if (pp.panelBackground) {
                        values.panelBackground = pp.panelBackground;
                    }
                    if (pp.fontFace) {
                        values.fontFace = pp.fontFace;
                    }
                    if (pp.fontSize) {
                        values.fontSize = pp.fontSize;
                    }
                    if (pp.fontWeight) {
                        values.fontWeight = pp.fontWeight;
                    }
                    if (pp.fontStyle) {
                        values.fontStyle = pp.fontStyle;
                    }
                    if (pp.fontColor) {
                        values.fontColor = pp.fontColor;
                    }
                    if (pp.textAlign) {
                        values.textAlign = pp.textAlign;
                    }
                    container = EasyCoder_PP.pp.container;
                    w = Math.round(container.getBoundingClientRect().width);
                    h = Math.round(container.getBoundingClientRect().height);
                    element = document.createElement(`div`);
                    symbolRecord.element[symbolRecord.index] = element;
                    element.id = `ec-${symbolRecord.name}-${symbolRecord.index}-${EasyCoder.elementId++}`;
                    element.style[`position`] = `absolute`;
                    element.style[`left`] = program.getValue(values.panelLeft) * w / 1000;
                    element.style[`top`] = program.getValue(values.panelTop) * h / 1000;
                    element.style[`width`] = `${program.getValue(values.panelWidth) * w / 1000}px`;
                    element.style[`height`] = `${program.getValue(values.panelHeight) * h / 1000}px`;
                    element.style[`background`] = program.getValue(values.panelBackground);
                    element.style[`border`] = `${program.getValue(values.panelBorder)}`;
                    container.appendChild(element);
                    inner = document.createElement(`div`);
                    inner.style[`position`] = `absolute`;
                    inner.style[`margin`] = `${program.getValue(values.panelPadding)}`;
                    inner.style[`font-face`] = program.getValue(values.fontFace);
                    inner.style[`font-size`] = `${program.getValue(values.fontSize) * h / 1000}px`;
                    inner.style[`font-weight`] = program.getValue(values.fontWeight);
                    inner.style[`font-style`] = program.getValue(values.fontStyle);
                    inner.style[`color`] = program.getValue(values.fontColor);
                    inner.style[`text-align`] = program.getValue(values.textAlign);
                    element.appendChild(inner);
                    element.inner = inner;
                    break;
                case`setText`:
                    symbolRecord = program.getSymbolRecord(command.name);
                    element = symbolRecord.element[symbolRecord.index];
                    value = program.getValue(command.value);
                    element.inner.innerHTML = value.split(`\n`).join(`<br>`);
                    break;
                case `dissolve`:
                    symbolRecord = program.getSymbolRecord(command.name);
                    element = symbolRecord.element[symbolRecord.index];
                    value = program.getValue(command.value);
                    steps = Math.round(parseFloat(program.getValue(command.duration)) * 10);
                    inner = element.inner;
                    newInner = document.createElement(`div`);
                    newInner.style[`position`] = `absolute`;
                    newInner.style[`margin`] = inner.style[`margin`];
                    newInner.style[`font-face`] = inner.style[`font-face`];
                    newInner.style[`font-size`] = inner.style[`font-size`];
                    newInner.style[`font-weight`] = inner.style[`font-weight`];
                    newInner.style[`font-style`] = inner.style[`font-style`];
                    newInner.style[`color`] = inner.style[`color`];
                    newInner.style[`text-align`] = inner.style[`text-align`];
                    newInner.innerHTML = value.split(`\n`).join(`<br>`);
                    element.appendChild(newInner);
                    step(0, function () {
                        inner.innerHTML = newInner.innerHTML;
                        inner.style[`opacity`] = 1.0;
                        element.removeChild(newInner);
                    });
                    break;
            }
			return command.pc + 1;
		}
	},

	PPPanel: {

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
			case `pp`:
				return EasyCoder_PP.PP;
            case `pppanel`:
                return EasyCoder_PP.PPPanel;
            default:
				return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_PP.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'pp' package`);
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

// eslint-disable-next-line no-unused-vars
EasyCoder.domain.pp = EasyCoder_PP;
