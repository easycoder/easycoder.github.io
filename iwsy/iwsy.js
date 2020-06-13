// IWSY

const IWSY = (playerElement, text) => {

    let player = playerElement;
    let script = text;
    let clicked = false;

    // Set up all the blocks
    const setupBlocks = () => {
        for (const block of script.blocks) {
            const current = {};
            for (const name in block.defaults) {
                current[name] = block.defaults[name];
            }
            block.current = current;
        }
    };

    const release = step => {
        player.style.cursor = 'none';
        document.removeEventListener(`click`, release);
        document.onkeydown = null;
        step.next();
    };

    const doManual = step => {
        player.style.cursor = 'pointer';
        document.addEventListener(`click`, release);
        document.onkeydown = (event) => {
            switch (event.code) {
                case `Space`:
                case `ArrowRight`:
                    document.onkeydown = null;
                    release(step);
                    break;
                case `ArrowLeft`:
                    break;
                case `Enter`:
                    player.style.cursor = 'none';
                    document.addEventListener(`click`, onClick);
                    script.runMode = `auto`;
                    release(step);
                    break;
            }
            return true;
        };
    };

    const onClick = () => {
        clicked = true;
    };

    const hold = step => {
        if (script.speed === `scan`) {
            step.next();
            return;
        }
        script.stepping = false;
        if (script.runMode === `manual`) {
            doManual(step);
        } else {
            if (clicked) {
                document.removeEventListener(`click`, onClick);
                clicked = false;
                script.runMode = `manual`;
                doManual(step);
            } else {
                setTimeout(() => {
                    step.next();
                }, step.duration * 1000);
            }
        }
    };

    const pause = step => {
        if (script.speed === `scan`) {
            step.next();
            return;
        }
        script.stepping = false;
        setTimeout(() => {
            step.next();
        }, step.duration * 1000);
    };

    // Get the bounding rectangle of a block
    const getBlockRect = (block, r) => {
        const left = block.defaults.left;
        const top = block.defaults.top;
        const width = block.defaults.width;
        const height = block.defaults.height;
        if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
            return rect;
        }
        const w = r.width / 1000;
        const h = r.height / 1000;
        const rect = {};
        rect.width = width * w;
        rect.height = height * h;
        rect.left = left * w;
        rect.top = top * h;
        return rect;
    };

    // Create a block
    const createBlock = block => {
        let rect = {
            width: player.clientWidth,
            height: player.clientHeight,
            left: 0,
            top: 0
        }
        if (block.defaults.parent) {
            for (b of script.blocks) {
                if (b.defaults.name === block.defaults.parent) {
                    rect = getBlockRect(b, rect);
                    break;
                }
            }
        };
        const w = rect.width / 1000;
        const h = rect.height / 1000;
        const l = rect.left;
        const t = rect.top;
        const defaults = block.defaults;
        const element = document.createElement(`div`);
        player.appendChild(element);
        block.element = element;
        if (script.speed === `scan`) {
            element.style.display = `none`;
        }
        element.style.position = `absolute`;
        element.style.opacity = `0.0`;
        let val = defaults.left;
        if (isNaN(val)) {
            element.style.left = val;
        } else {
            val *= w;
            element.style.left = `calc(${l}px + ${val}px)`;
        }
        val = defaults.top;
        if (isNaN(val)) {
            element.style.left = val;
        } else {
            val *= h;
            element.style.top = `calc(${t}px + ${val}px)`;
        }
        val = defaults.width;
        if (!isNaN(val)) {
            val = `${val * w}px`;
        }
        element.style.width = val;
        val = defaults.height;
        if (!isNaN(val)) {
            val = `${val * h}px`;
        }
        element.style.height = val;
        if (defaults.background) {
            element.style.background = defaults.background;
        }
        element.style[`background-size`] = `cover`;
        element.style.border = defaults.border;
        element.style[`overflow`] = `hidden`;
        element.style[`display`] = `none`;
        element.style[`opacity`] = `0`;
        val = defaults.textMarginLeft;
        if (!isNaN(val)) {
            val *= w;
        }
        const marginLeft = val;
        val = defaults.textMarginTop;
        if (!isNaN(val)) {
            val *= h;
        }
        const marginTop = val;
        const text = document.createElement(`div`);
        element.appendChild(text);
        block.textPanel = text;
        text.style.position = `absolute`;
        text.style.left = marginLeft;
        text.style.top = marginTop;
        text.style.width = `calc(100% - ${marginLeft}px - ${marginLeft}px)`;
        text.style.height = `calc(100% - ${marginTop}px - ${marginTop}px)`;
        text.style[`font-family`] = defaults.fontFamily;
        val = defaults.fontSize;
        if (!isNaN(val)) {
            val *= h;
        }
        text.style[`font-size`] = `${val}px`;
        text.style[`font-weight`] = defaults.fontWeight;
        text.style[`font-style`] = defaults.fontStyle;
        text.style.color = defaults.fontColor;
        text.style[`text-align`] = defaults.textAlign;
    };

    // Set the content of one or more blocks
    const setcontent = step => {
        for (const item of step.blocks)
        {
            for (const block of script.blocks) {
                if (block.defaults.name === item.block) {
                    if (!block.element) {
                        createBlock(block);
                    }
                    for (const text of script.content) {
                        if (text.name === item.content) {
                            const converter = new showdown.Converter({
                                extensions: [`IWSY`]
                            });
                            block.textPanel.innerHTML =
                                converter.makeHtml(text.content.split(`%0a`).join(`\n`));
                            break;
                        }
                    }
                    break;
                }
            }
        }
        if (script.speed === `scan` && step.index === script.scanTarget) {
            script.stepping = false;
        }
        step.next();
    };

    // Show or hide a block
    const doShowHide = (step, showHide) => {
        for (const name of step.blocks)
        {
            for (const block of script.blocks) {
                if (block.defaults.name === name) {
                    block.element.style.opacity = showHide ? `1.0` : `0.0`;
                    block.element.style.display = showHide ? `block` : `none`;
                    break;
                }
            }
        }
        if (script.speed === `scan` && step.index === script.scanTarget) {
            script.stepping = false;
        }
        step.next();
    };

    const show = step => {
        doShowHide(step, true);
    };

    const hide = step => {
        doShowHide(step, false);
    };

    // Fade up or down
    const doFade = (step, upDown) => {
        const stepBlocks = [];
        for (const name of step.blocks) {
            script.blocks.every((block, index) => {
                if (block.defaults.name === name) {
                    stepBlocks.push(block);
                    if (!block.element) {
                        createBlock(block);
                    }
                    return false;
                }
                return true;
            });
        } 
        if (script.speed === `scan`) {
            for (const block of stepBlocks)
            {
                block.element.style.opacity = upDown ? 1.0 : 0.0;
                block.element.style.display = upDown ? `block` : `none`;
            }
            step.next();
        } else {
            const animSteps = Math.round(step.duration * 25);
            const continueFlag = step.continue;
            for (const block of stepBlocks)
            {
                block.element.style.display = `block`;
            }
            let animStep = 0;
            const interval = setInterval(() => {
                try {
                    if (animStep < animSteps) {
                        const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                        for (const block of stepBlocks)
                        {
                            block.element.style.opacity = upDown ? ratio : 1.0 - ratio;
                        }
                        animStep++;
                    } else {
                        for (const block of stepBlocks)
                        {
                            block.element.style.opacity = upDown ? 1 : 0;
                            block.element.style.display = upDown ? `block` :`none`;
                        }
                        script.stepping = false;
                        clearInterval(interval);
                        if (!continueFlag) {
                            step.next();
                        }
                    }
                } catch(err) {
                    clearInterval(interval);
                    throw Error(err);
                }
            }, 40);
            if (continueFlag) {
                step.next();
            }
        }
    };

    const fadeup = step => {
        doFade(step, true);
    };

    const fadedown = step => {
        doFade(step, false);
    };

    // Handle a crossfade
    const crossfade = step => {
        for (const content of script.content) {
            if (content.name === step.target) {
                const converter = new showdown.Converter({
                    extensions: [`IWSY`]
                });
                const newText = converter.makeHtml(content.content.split(`%0a`).join(`\n`));
                for (const block of script.blocks) {
                    if (block.defaults.name === step.block) {
                        if (script.speed === `scan`) {
                            block.textPanel.innerHTML = newText;
                            step.next();
                        } else {
                            const element = document.createElement(`div`);
                            block.element.parentElement.appendChild(element);
                            element.style.position = `absolute`;
                            element.style.opacity = `0.0`;
                            element.style.left = block.element.style.left;
                            element.style.top = block.element.style.top;
                            element.style.width = block.element.style.width;
                            element.style.height = block.element.style.height;
                            if (block.element.style.background) {
                                element.style.background = block.element.style.background;
                            }
                            element.style.border = block.element.style.border
                            element.style[`border-radius`] = block.element.style[`border-radius`]
                            const text = document.createElement(`div`);
                            element.appendChild(text);
                            text.style.position = `absolute`;
                            text.style.left = block.textPanel.style.left;
                            text.style.top = block.textPanel.style.top;
                            text.style.width = block.textPanel.style.width;
                            text.style[`font-family`] = block.textPanel.style[`font-family`];
                            text.style[`font-size`] = block.textPanel.style[`font-size`];
                            text.style[`font-weight`] = block.textPanel.style[`font-weight`];
                            text.style[`font-style`] = block.textPanel.style[`font-style`];
                            text.style[`text-align`] = block.textPanel.style[`text-align`];
                            text.style.color = block.textPanel.style.color;
                            text.innerHTML = newText;
                
                            const animSteps = Math.round(step.duration * 25);
                            let animStep = 0;
                            const interval = setInterval(() => {
                                if (animStep < animSteps) {
                                    const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                                    block.element.style.opacity = 1.0 - ratio;
                                    element.style.opacity = ratio;
                                    animStep++;
                                } else {
                                    script.stepping = false;
                                    clearInterval(interval);
                                    block.textPanel.innerHTML = newText;
                                    if (content.url) {
                                        block.element.style.background = `url("${content.url}")`;
                                    }
                                    block.element.style[`background-size`] = `cover`;
                                    block.element.style.opacity = 1.0 ;
                                    removeElement(element);
                                    if (!step.continue) {
                                        step.next();
                                    }
                                }
                            }, 40);
                            if (step.continue) {
                                step.next();
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
    };

    // Compute a block size
    const setComputedBlockSize = (block, target, ratio) => {
        const boundingRect = player.getBoundingClientRect();
        const w = boundingRect.width / 1000;
        const h = boundingRect.height / 1000;
        let width = block.current.width;
        if (!isNaN(width)) {
            width *= w;
        }
        let height = block.current.height;
        if (!isNaN(height)) {
            height *= h;
        }
        let endWidth = target.defaults.width;
        if (!isNaN(endWidth)) {
            endWidth *= w;
        }
        let endHeight = target.defaults.height;
        if (!isNaN(endHeight)) {
            endHeight *= h;
        }
        block.element.style.width = 
            `${width + (endWidth - width) * ratio}px`;
        block.element.style.height = 
            `${height + (endHeight - height) * ratio}px`;
    };

    // Compute a block position
    const setComputedBlockPosition = (block, target, ratio) => {
        const boundingRect = player.getBoundingClientRect();
        const w = boundingRect.width / 1000;
        const h = boundingRect.height / 1000;
        let left = block.current.left;
        if (!isNaN(left)) {
            left *= w;
        }
        let top = block.current.top;
        if (!isNaN(top)) {
            top *= h;
        }
        let endLeft = target.defaults.left;
        if (!isNaN(endLeft)) {
            endLeft *= w;
        }
        let endTop = target.defaults.top;
        if (!isNaN(endTop)) {
            endTop *= h;
        }
        block.element.style.left = left + (endLeft - left) * ratio;
        block.element.style.top = top + (endTop - top) * ratio;
    };

    // Compute a font size
    const setComputedFontSize = (block, target, ratio) => {
        const h = Math.round(player.getBoundingClientRect().height) / 1000;
        let size = block.current.fontSize;
        if (!isNaN(size)) {
            size *= h;
        }
        let endSize = target.defaults.fontSize;
        if (!isNaN(endSize)) {
            endSize *= h;
        }
        block.textPanel.style[`font-size`] = 
            `${size + (endSize - size) * ratio}px`;
    };

    // Compute a font color
    const setComputedFontColor = (block, target, ratio) => {
        const color = block.current.fontColor;
        const endColor = target.defaults.fontColor;
        const rStart = parseInt(color.slice(1, 3), 16);
        const gStart = parseInt(color.slice(3, 5), 16);
        const bStart = parseInt(color.slice(5, 7), 16);
        const rFinish = parseInt(endColor.slice(1, 3), 16);
        const gFinish = parseInt(endColor.slice(3, 5), 16);
        const bFinish = parseInt(endColor.slice(5, 7), 16);
        const red = rStart + Math.round((rFinish - rStart) * ratio);
        const green = gStart + Math.round((gFinish - gStart) * ratio);
        const blue = bStart + Math.round((bFinish - bStart) * ratio);
        const r = ("0" + red.toString(16)).slice(-2);
        const g = ("0" + green.toString(16)).slice(-2);
        const b = ("0" + blue.toString(16)).slice(-2);
        block.textPanel.style.color = `#${r}${g}${b}`;
    };

    // Handle a single step of a transition
    const doTransitionStep = (block, target, ratio) => {
        setComputedBlockSize(block, target, ratio);
        setComputedBlockPosition(block, target, ratio);
        setComputedFontSize(block, target, ratio);
        setComputedFontColor(block, target, ratio);
    };

    // Set the final state of a transition
    const setFinalState = (block, target) =>
    {
        block.current.width = target.defaults.width;
        block.current.height = target.defaults.height;
        block.current.left = target.defaults.left;
        block.current.top = target.defaults.top;
        block.current.fontColor = target.defaults.fontColor;
        block.current.fontSize = target.defaults.fontSize;
    };

    // Handle a transition
    const transition = step => {
        let block = null;
        let target = null;
        script.blocks.every(item => {
            if (item.defaults.name === step.block) {
                block = item;
            }
            if (item.defaults.name === step.target) {
                target = item;
            }
            return true;
        });
        if (typeof block.element === `undefined`) {
            throw Error(`Block '${block.defaults.name}' has not been set up`);
        }
        block.element.style.opacity = 1;
        block.element.style.display = `block`;
        if (script.speed === `scan`) {
            doTransitionStep(block, target, 1.0);
            setFinalState(block,target);
            step.next();
        } else {
            const animSteps = Math.round(step.duration * 25);
            let animStep = 0;
            const continueFlag = step.continue;
            const interval = setInterval(() => {
                if (animStep < animSteps) {
                    const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                    doTransitionStep(block, target, ratio);
                    animStep++;
                } else {
                    script.stepping = false;
                    clearInterval(interval);
                    setFinalState(block,target);
                    if (!continueFlag) {
                        step.next();
                    }
                }
                }, 40);
                if (continueFlag) {
                    step.next();
            }
        }
    };

    // Remove all the blocks from the player
    const removeBlocks = () => {
        for (const block of script.blocks) {
            if (block.element) {
                removeElement(block.element);
                delete(block.element);
            }
        }
    };

    // Remove an element
    const removeElement = element => {
        const parent = element.parentElement;
        if (parent) {
            parent.removeChild(element);
        } else {
            throw Error(`element has no parent`);
        }
        element.remove();
    };

    // Load a plugin action
    const load = step => {
        if (script.speed === `scan`) {
            step.next();
        } else {
            const element = document.createElement(`script`);
            element.src = step.url;
            element.onload = () => {
                console.log(`Plugin ${element.src} loaded`);
                step.next();
            };
            element.onerror = () => {
                throw Error(`Can't load plugin ${step.url}`);
            };
            document.head.appendChild(element);
        }
    };

    // Initialize the presentation
    const init = step => {
        if (step.title) {
            document.title = step.title;
        }
        if (step.css) {
            setHeadStyle(step.css.split(`%0a`).join(`\n`));
        }
        const aspect = step[`aspect ratio`];
        if (aspect) {
            const colon = aspect.indexOf(`:`);
            if (colon > 0) {
                const aspectW = aspect.substr(0, colon);
                const aspectH = aspect.substr(colon + 1);
                const height = Math.round(parseFloat(player.offsetWidth) * aspectH / aspectW);
                player.style.height = `${Math.round(height)}px`;
            }
            player.style.position = `relative`;
            player.style.overflow = `hidden`;
            player.style.cursor = `none`;
            player.style.border = step.border;
            if (step.background) {
                player.style.background = step.background.split(`&quot;`).join(`"`);
            }
            player.style[`background-size`] = `cover`;
        }
        step.next();
    };

    // Scan the script
    const scan = () => {
        script.speed = `scan`;
        removeBlocks();
        setupBlocks();
        player.innerHTML = ``;
        doStep(script.steps[0]);
    };

    // Go to a specified label
    const goto = step => {
        const target = script.labels[step.target];
        if (typeof target !== `undefined`) {
            script.scanTarget = target;
            scan();
        } else {
            throw Error(`Unknown label '${step.target}`);
        }
    };

    // Chain to another presentation
    const chain = step => {
        step.next();
    };

    // Embed another presentation
    const embed = step => {
        step.next();
    };

    // Restore the cursor
    const restoreCursor = () => {
        player.style.cursor = `pointer`;
        if (script.then) {
            script.then();
            script.then = null;
        }
    };

    // Set up Showdown
    const setupShowdown = () => {
        if (typeof showdown === `undefined`) {
            require(`js`, `https://cdn.rawgit.com/showdownjs/showdown/1.9.1/dist/showdown.min.js`,
                () => {
                    showdown.extension(`IWSY`, {
                        type: `lang`,
                        filter: function (text, converter) {
                            return text.replace(/~([^~]+)~/g, function (match, group) {
                                return decodeShowdown(group);
                            });
                        }
                    });
                });
            }
        else {
        }
    };

    // Decode special Showdown tags
    const decodeShowdown = group => {
        if (group.slice(0, 5) === `code:`) {
            return `<span style="font-family:mono;color:darkred">${group.slice(5)}</span>`;
        }
        if (group.slice(0, 5) === `html:`) {
            return group.slice(5);
        }
        if (group.slice(0, 4) === `img:`) {
            const data = group.slice(4);
            const colon = data.indexOf(`:`);
            if (colon > 0) {
                const src = data.slice(0, colon);
                const classes = data.slice(colon + 1).split(` `);
                const styles = [];
                for (const item of classes) {
                    if (item.endsWith(`%`)) {
                        styles.push(`width:${item}`);
                    } else if (item.startsWith(`{`) && item.endsWith(`}`)) {
                        styles.push(item.slice(1, -1));
                    } else {
                        switch (item) {
                            case `left`:
                                styles.push(`float:left;margin-right:1em`);
                                break;
                            case `center`:
                                styles.push(`margin:0 auto`);
                                break;
                            case `right`:
                                styles.push(`float:right;margin-left:1em`);
                                break;
                            case `clear`:
                                styles.push(`clear:both`);
                                break;
                            case `border`:
                                styles.push(`padding:2px;border:1px solid black`);
                                break;
                        }
                    }
                }
                return `<img src="${src}" style="${styles.join(`;`)}" />`;
            }
        }
        return group;
    };

    // Load a JS or CSS library
	const require = (type, src, cb) => {
		let prefix = ``;
		if (src[0] == `/`) {
			prefix = window.location + `/`;
		}
		const element = document.createElement(type === `css` ? `link` : `script`);
		switch (type) {
		case `css`:
			element.type = `text/css`;
			element.href = `${prefix}${src}`;
			element.rel = `stylesheet`;
			break;
		case `js`:
			element.type = `text/javascript`;
			element.src = `${prefix}${src}`;
			break;
		default:
			return;
		}
		element.onload = function () {
			console.log(`Library ${prefix}${src} loaded`);
			cb();
		};
		document.head.appendChild(element);
    };
    
    // Set a HEAD style
    const setHeadStyle = (styleName, styleValue) => {
        for (let i = 0; i < document.head.childNodes.length; i++) {
            let node = document.head.childNodes[i];
            if (node.tagName === `STYLE`) {
                let data = node.innerHTML;
                if (data.indexOf(`${styleName} `) === 0) {
                    document.head.removeChild(node);
                    break;
                }
            }
        }
        var style = document.createElement('style');
        style.className = `iwsy-css`;
        style.innerHTML = `${styleName} ${styleValue}`;
        document.head.appendChild(style);
    };

    // Initialize the script
    const initScript = () => {
        document.onkeydown = null;
        player.style.position = `relative`;
        player.style.overflow = `hidden`;
        player.style.cursor = 'none';
        script.speed = `normal`;
        script.singleStep = true;
        script.labels = {};
        script.stop = false;
        removeStyles();
        for (const block of script.blocks) {
            const element = block.element;
            if (typeof element !== `undefined`) {
                removeElement(element);
                block.element = null;
            }
        }
        player.innerHTML = null;
        script.steps.forEach((step, index) => {
            step.index = index;
            if (typeof step.label !== `undefined`) {
                script.labels[step.label] = index;
            }
            if (index < script.steps.length - 1) {
                step.next = () => {
                    if (script.runMode == `auto` || (script.singleStep && script.speed === `scan`)) {
                        setTimeout(() => {
                            if (script.stop) {
                                script.stop = false;
                                restoreCursor();
                            } else {
                                doStep(script.steps[step.index + 1]);
                            }
                        }, 0);
                    }
                }
            }
            else {
                step.next = () => {
                    console.log(`Step ${index + 1}: Finished`);
                    restoreCursor();
               }
            };
        });
        setupBlocks();
    }

    const actions = {
        init,
        setcontent,
        show,
        hide,
        pause,
        hold,
        fadeup,
        fadedown,
        crossfade,
        transition,
        goto,
        load,
        chain,
        embed
    };

    // Process a single step
    const doStep = step => {
        if (step.title) {
            console.log(`Step ${step.index}: ${step.title}`);
        } else {
            console.log(`Step ${step.index}: ${step.action}`);
        }
        if (script.speed === `scan` && step.index === script.scanTarget) {
            script.speed = `normal`;
            for (const block of script.blocks) {
                if (block.element) {
                    block.element.style.display = `block`;
                }
            }
        }
        const actionName = step.action.split(` `).join(``);
        let handler = actions[actionName];
        if (typeof handler === `undefined`) {
            handler = IWSY.plugins[actionName];
            if (typeof handler === `undefined`) {
                throw Error(`Unknown action: '${step.action}'`);
            }
        }
        if (script.onStepCB && script.runMode === `auto`) {
            script.onStepCB(step.index);
        }
        try {
            handler(step);
        } catch (err) {
            console.log(`Step ${step.index} (${step.action}): ${err}`);
            alert(`Step ${step.index} (${step.action}): ${err}`);
        }
    };

    ///////////////////////////////////////////////////////////////////////////////
    // These are all the exported functions
    
    // Set the script
    const setScript = newScript => {
        removeBlocks();
        script = newScript;
        initScript();
    };
    
    // Go to a specified step number
    const gotoStep = (target) => {
        if (!script.stepping) {
            script.stepping = true;
            script.scanTarget = target;
            script.singleStep = true;
            script.runMode = `manual`;
            scan();
        }
    };
    
    // Show a block
    const block = blockIndex => {
        player.innerHTML = ``;
        const w = player.getBoundingClientRect().width / 1000;
        const h = player.getBoundingClientRect().height / 1000;
        script.blocks.forEach((block, index) => {
            const defaults = block.defaults;
            const element = document.createElement(`div`);
            player.appendChild(element);
            if (script.speed === `scan`) {
                element.style.display = `none`;
            }
            element.style.position = `absolute`;
            element.style.opacity = `0.5`;
            let val = defaults.left;
            if (!isNaN(val)) {
                val *= w;
            }
            element.style.left = val;
            val = defaults.top;
            if (!isNaN(val)) {
                val *= h;
            }
            element.style.top = val;
            val = defaults.width;
            if (!isNaN(val)) {
                val = `${val * w - 2}px`;
            } else {
                val = `calc(${val} - 2px)`
            }
            element.style.width = val;
            val = defaults.height;
            if (!isNaN(val)) {
                val = `${val * h - 2}px`;
            } else {
                val = `calc(${val} - 2px)`
            }
            element.style.height = val;
            element.style[`font-size`] = `${h * 40}px`
            element.innerHTML = defaults.name;
            if (index == blockIndex) {
                element.style.background = `#ddffdd`;
                element.style.border = `1px solid #00ff00`;
                element.style[`font-weight`] = `bold`
                element.style[`z-index`] = 10;
                element.style.color = `#006600`;
            } else {
                element.style.border = `1px solid #ff0000`;
                element.style[`text-align`] = `right`;
                element.style[`z-index`] = 0;
                element.style.color = `#ff0000`;
            }
        });
    };
    
    // Run the presentation
    const run = (mode, then) => {
        if (mode === `fullscreen`) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                player.requestFullscreen();
                document.onfullscreenchange = () => {
                    if (document.fullscreenElement) {
                        player = document.fullscreenElement;
                        runPresentation(then);
                    } else {
                        player = playerElement;
                    }
                };
            }
        } else {
            runPresentation(then);
        }
    }

    const runPresentation = then => {
        if (!script.stepping) {
            initScript();
            script.runMode = `auto`;
            script.speed = `normal`;
            script.singleStep = false;
            script.then = then;
            doStep(script.steps[0]);
        }
    };
    
    // Stop the run
    const stop = () => {
        script.stop = true;
    };
    
    // Set a step callback
    const onStep = onStepCB => {
        script.onStepCB = onStepCB;
    };
    
    // Remove all the CSS styles
    const removeStyles = () => {
        const styles = document.getElementsByClassName("iwsy-css");
        for (const style of styles) {
            style.parentNode.removeChild(style);
        }
    };

    ///////////////////////////////////////////////////////////////////////////

    document.removeEventListener(`click`, init);
    if (script.runMode === `auto`) {
        document.addEventListener(`click`, onClick);
    }
    setupShowdown();
    initScript();
    return {
        setScript,
        gotoStep,
        block,
        run,
        stop,
        onStep,
        removeStyles
    };
};