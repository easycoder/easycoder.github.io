// IWSY

const IWSY = (container, text) => {

    let script = text;
    let clicked = false;

    // Preload all the images
    const preloadImages = () => {
        for (const item in script.content) {
            if (item.type == `image`) {
                item.img = document.createElement(`div`);
                const url = item.url.split(`&quot;`).join(`"`);
                item.img.style.background = `url("${url}")`;
            }
        }
    };

    const pause = step => {
        setTimeout(() => {
            step.next();
        }, script.speed === `normal` ? step.duration * 1000 : 0);
    };

    const release = step => {
        container.style.cursor = 'none';
        document.removeEventListener(`click`, release);
        document.onkeydown = null;
        step.next();
    };

    const doManual = step => {
        container.style.cursor = 'pointer';
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
                    container.style.cursor = 'none';
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

    // Create a block.
    const createBlock = (block) => {
        const w = container.getBoundingClientRect().width / 1000;
        const h = container.getBoundingClientRect().height / 1000;
        const element = document.createElement(`div`);
        container.appendChild(element);
        block.element = element;
        if (script.speed === `scan`) {
            element.style[`display`] = `none`;
        }
        element.style[`position`] = `absolute`;
        element.style[`opacity`] = `0.0`;
        let val = block.left;
        if (!isNaN(val)) {
            val *= w;
        }
        element.style[`left`] = val;
        val = block.top;
        if (!isNaN(val)) {
            val *= h;
        }
        element.style[`top`] = val;
        val = block.width;
        if (!isNaN(val)) {
            val = `${val * w}px`;
        }
        element.style[`width`] = val;
        val = block.height;
        if (!isNaN(val)) {
            val = `${val * h}px`;
        }
        element.style[`height`] = val;
        element.style[`background`] = block.background;
        element.style[`border`] = block.border;
        val = block.textMarginLeft;
        if (!isNaN(val)) {
            val *= w;
        }
        const marginLeft = val;
        val = block.textMarginTop;
        if (!isNaN(val)) {
            val *= h;
        }
        const marginTop = val;
        const text = document.createElement(`div`);
        element.appendChild(text);
        text.style[`position`] = `absolute`;
        text.style[`left`] = marginLeft;
        text.style[`top`] = marginTop;
        text.style[`width`] = `calc(100% - ${marginLeft}px - ${marginLeft}px)`;
        text.style[`height`] = `calc(100% - ${marginTop}px - ${marginTop}px)`;
        text.style[`font-family`] = block.fontFamily;
        val = block.fontSize;
        if (!isNaN(val)) {
            val *= h;
        }
        text.style[`font-size`] = `${val}px`;
        text.style[`font-weight`] = block.fontWeight;
        text.style[`font-style`] = block.fontStyle;
        text.style[`color`] = block.fontColor;
        text.style[`text-align`] = block.textAlign;
        block.textPanel = text;
    };

    // Set the content of a block
    const doSetContent = (spec) => {
        const block = script.blocks[spec.block];
        const content = script.content[spec.content];
        if (!block) {
            throw Error(`Block '${block}' cannot be found`);
        }
        if (!block.element) {
            createBlock(block);
        }
        block.textPanel.innerHTML = content.split(`\n`).join(`<br>`);
    };

    // Set the content of a block
    const setcontent = step => {
        if (step.blocks) {
            for (const spec of step.blocks)
            {
                doSetContent(spec);
            }
        } else {
            doSetContent(step);
        }
        step.next();
    };

    // Show or hide a block
    const doShowHide = (step, showHide) => {
        if (script.speed !== `scan`) {
            if (Array.isArray(step.blocks)) {
                for (const name of step.blocks)
                {
                    script.blocks[name].opacity = showHide ? `1.0` : `0.0`;
                    script.blocks[name].element.style[`opacity`] = script.blocks[name].opacity;
                }
            } else {
                script.blocks[step.blocks].opacity = showHide ? `1.0` : `0.0`;
                script.blocks[step.blocks].element.style[`opacity`] = script.blocks[step.blocks].opacity;
            }
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
        const stepBlocks = step.blocks;
        for (const b of stepBlocks) {
            const block = script.blocks[b];
            if (!block.element) {
                createBlock(block);
            }
        }
        if (script.speed === `scan`) {
            for (const block of stepBlocks)
            {
                script.blocks[block].element.style.opacity = upDown ? 1.0 : 0.0;
            }
            step.next();
        } else {
            const animSteps = Math.round(step.duration * 25);
            const continueFlag = step.continue;
            let animStep = 0;
            const interval = setInterval(() => {
                if (animStep < animSteps) {
                    const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                    let blocks = stepBlocks.length;
                    for (const block of stepBlocks)
                    {
                        const element = script.blocks[block].element;
                        element.style[`opacity`] = upDown ? ratio : 1.0 - ratio;
                    }
                    animStep++;
                } else {
                    clearInterval(interval);
                    for (const block of stepBlocks)
                    {
                        script.blocks[block].opacity = upDown ? 1.0 : 0.0;
                    }
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

    const fadeup = step => {
        doFade(step, true);
    };

    const fadedown = step => {
        doFade(step, false);
    };

    // Handle a crossfade
    const crossfade = step => {
        const content = script.content[step.target];
        const block = script.blocks[step.block];
        if (script.speed === `scan`) {
            switch (content.type) {
                case `text`:
                    newText = content.content;
                    newText = newText.split(`\n`).join(`<br>`);
                    block.textPanel.innerHTML = newText;
                    break;
                case `image`:
                    block.element.style[`background`] = `url("${content.url}")`;
                    break;
            }
            step.next();
        } else {
            const continueFlag = step.continue;
            let element;
            let newText;
            element = document.createElement(`div`);
            element.style[`position`] = `absolute`;
            element.style[`opacity`] = `0.0`;
            element.style[`left`] = block.element.style[`left`];
            element.style[`top`] = block.element.style[`top`];
            element.style[`width`] = block.element.style[`width`];
            element.style[`height`] = block.element.style[`height`];
            element.style[`background`] = block.element.style[`background`]
            element.style[`border`] = block.element.style[`border`]
            element.style[`border-radius`] = block.element.style[`border-radius`]
            container.appendChild(element);
            const text = document.createElement(`div`);
            text.style[`position`] = `absolute`;
            text.style[`left`] = block.textPanel.style[`left`];
            text.style[`top`] = block.textPanel.style[`top`];
            text.style[`width`] = block.textPanel.style[`width`];
            text.style[`font-family`] = block.textPanel.style[`font-family`];
            text.style[`font-size`] = block.textPanel.style[`font-size`];
            text.style[`font-weight`] = block.textPanel.style[`font-weight`];
            text.style[`font-style`] = block.textPanel.style[`font-style`];
            text.style[`color`] = block.textPanel.style[`color`];
            text.style[`text-align`] = block.textPanel.style[`text-align`];
            element.appendChild(text);
            newText = content.content;
            newText = newText.split(`\n`).join(`<br>`);
            text.innerHTML = newText;

            const animSteps = Math.round(step.duration * 25);
            let animStep = 0;
            const interval = setInterval(() => {
                if (animStep < animSteps) {
                    const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                    block.element.style[`opacity`] = 1.0 - ratio;
                    element.style[`opacity`] = ratio;
                    animStep++;
                } else {
                    clearInterval(interval);
                    block.textPanel.innerHTML = newText;
                    block.element.style[`background`] = `url("${content.url}")`;
                    block.element.style[`background-size`] = `cover`;
                    block.element.style[`opacity`] = 1.0 ;
                    container.removeChild(element);
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

    // Compute a block size
    const setComputedBlockSize = (block, target, ratio) => {
        const boundingRect = container.getBoundingClientRect();
        const w = boundingRect.width / 1000;
        const h = boundingRect.height / 1000;
        let width = block.width;
        if (!isNaN(width)) {
            width *= w;
        }
        let height = block.height;
        if (!isNaN(height)) {
            height *= h;
        }
        let endWidth = target.width;
        if (!isNaN(endWidth)) {
            endWidth *= w;
        }
        let endHeight = target.height;
        if (!isNaN(endHeight)) {
            endHeight *= h;
        }
        block.element.style[`width`] = 
            `${width + (endWidth - width) * ratio}px`;
        block.element.style[`height`] = 
            `${height + (endHeight - height) * ratio}px`;
    };

    // Compute a block position
    const setComputedBlockPosition = (block, target, ratio) => {
        const boundingRect = container.getBoundingClientRect();
        const w = boundingRect.width / 1000;
        const h = boundingRect.height / 1000;
        let left = block.left;
        if (!isNaN(left)) {
            left *= w;
        }
        let top = block.top;
        if (!isNaN(top)) {
            top *= h;
        }
        let endLeft = target.left;
        if (!isNaN(endLeft)) {
            endLeft *= w;
        }
        let endTop = target.top;
        if (!isNaN(endTop)) {
            endTop *= h;
        }
        block.element.style[`left`] = 
            left + (endLeft - left) * ratio;
        block.element.style[`top`] = 
            top + (endTop - top) * ratio;
    };

    // Compute a font size
    const setComputedFontSize = (block, target, ratio) => {
        const h = Math.round(container.getBoundingClientRect().height) / 1000;
        let size = block.fontSize;
        if (!isNaN(size)) {
            size *= h;
        }
        let endSize = target.fontSize;
        if (!isNaN(endSize)) {
            endSize *= h;
        }
        block.textPanel.style[`font-size`] = 
            `${size + (endSize - size) * ratio}px`;
    };

    // Compute a font color
    const setComputedFontColor = (block, target, ratio) => {
        const color = block.fontColor;
        const endColor = target.fontColor;
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
        block.textPanel.style[`color`] = `#${r}${g}${b}`;
    };

    // Handle a single step of a transition
    const doTransitionStep = (block, target, ratio) => {
        setComputedBlockSize(block, target, ratio);
        setComputedBlockPosition(block, target, ratio);
        setComputedFontSize(block, target, ratio);
        setComputedFontColor(block, target, ratio);
    };

    // Handle a transition
    const transition = step => {
        const block = script.blocks[step.block];
        const target = script.blocks[step.target];
        if (script.speed === `scan`) {
            doTransitionStep(block, target, 1.0);
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
                    clearInterval(interval);
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
        for (const name in script.blocks) {
            const block = script.blocks[name];
            if (block.element) {
                container.removeChild(block.element);
                block.element = null;
            }
        }
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
        const aspect = step[`aspect ratio`];
        if (aspect) {
            const colon = aspect.indexOf(`:`);
            if (colon > 0) {
                const aspectW = aspect.substr(0, colon);
                const aspectH = aspect.substr(colon + 1);
                const height = Math.round(parseFloat(container.offsetWidth) * aspectH / aspectW);
                container.style.height = `${Math.round(height)}px`;
            }
            container.style.position = `relative`;
            container.style.overflow = `hidden`;
            container.style.cursor = `none`;
            container.style.border = step.border;
            container.style.background = step.background.split(`&quot;`).join(`"`);
            container.style[`background-size`] = `cover`;
        }
        step.next();
    };

    // Scan the script
    const scan = () => {
        script.speed = `scan`;
        removeBlocks();
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

    // Run the presentation
    const run = then => {
        initScript();
        script.runMode = `auto`;
        script.speed = `normal`;
        script.singleStep = false;
        script.then = then;
        doStep(script.steps[0]);
    };

    // Stop the run
    const stop = () => {
        script.stop = true;
    };

    // Set a step callback
    const onStep = onStepCB => {
        script.onstepCB = onStepCB;
    };

    // Chain to another presentation
    const chain = step => {
        step.next();
    };

    // Embed another presentation
    const embed = step => {
        step.next();
    };

    // Go to a specified step number
    const gotoStep = (target) => {
        script.scanTarget = target;
        script.singleStep = true;
        script.runMode = `manual`;
        scan();
    };

    // Restore the cursor
    const restoreCursor = () => {
        container.style.cursor = `pointer`;
        if (script.then) {
            script.then();
            script.then = null;
        }
    };

    // Replace the script
    const setScript = newScript => {
        removeBlocks();
        script = newScript;
        initScript();
    };

    // Initialize the script
    const initScript = () => {
        document.onkeydown = null;
        container.style.position = `relative`;
        container.style.overflow = `hidden`;
        container.style.cursor = 'none';
        script.speed = `normal`;
        script.singleStep = true;
        script.labels = {};
        script.stop = false;
        for (const name in script.blocks) {
            const block = script.blocks[name];
            const element = block.element;
            if (typeof element !== `undefined`) {
                container.removeChild(element);
                block.element = null;
            }
        }
        for (const [index, step] of script.steps.entries()) {
            step.index = index;
            step.script = script;
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
        };
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
        if (script.speed === `scan`) {
            if (step.index === script.scanTarget) {
                script.speed = `normal`;
                for (const name in script.blocks) {
                    const block = script.blocks[name];
                    if (block.element) {
                        block.element.style.display = `block`;
                    }
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
        if (script.onStepCB) {
            script.onStepCB(step.index);
        }
        handler(step);
    };

    container.innerHTML = ``;
    document.removeEventListener(`click`, init);
    if (script.runMode === `auto`) {
        document.addEventListener(`click`, onClick);
    }
    initScript();
    IWSY.plugins = {};
    preloadImages();
    doStep(script.steps[0]);
    return {
        setScript,
        gotoStep,
        run,
        stop
    };
};
