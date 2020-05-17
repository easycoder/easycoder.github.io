// JSON::Presenter

const JSON_Presenter = (container, script) => {

    let speed = `normal`;
    let stepno= -1;
    let step;
    let mode = `manual`;

    const containerStyles = [
        `border`,
        `background`
    ];
    const defaults = [
        `fontFace`,
        `fontWeight`,
        `fontStyle`,
        `textAlign`,
        `fontColor`,
        `blockLeft`,
        `blockTop`,
        `blockWidth`,
        `blockHeight`,
        `blockBackground`
    ];

    // Initialize all the blocks
    const initBlocks = (container, blocks, defaults) => {
        for (const name in blocks) {
            const block = blocks[name];
            const properties = {};
            // Set up the default properties
            for (const name in defaults) {
                properties[name] = defaults[name];
            }
            // Override with local values
            for (const name in block) {
                properties[name] = block[name];
            }
            block.properties = properties;
            block.container = container;
        }
    };

    // Preload all the images
    const preloadImages = (content) => {
        for (const item in content) {
            if (item.type == `image`) {
                item.img = document.createElement(`div`);
                item.img.style[`background`] = `url("${item.url}")`;
            }
        }
    };

    const doPause = () => {
        setTimeout(() => {
            doStep();
        }, speed === `normal` ? step.duration * 1000 : 0);
    };

    const release = () => {
        document.removeEventListener(`click`, release);
        document.onkeydown = null;
        doStep();
    };

    const doHold = () => {
        if (mode === `manual`) {
            document.addEventListener(`click`, release);
            document.onkeydown = function (event) {
                document.onkeydown = null;
                switch (event.code) {
                    case `Space`:
                    case `ArrowRight`:
                        release();
                        break;
                    case `ArrowLeft`:
                        break;
                    case `Enter`:
                        mode = `auto`;
                        doStep();
                        break;
                    default:
                        break;
                }
                return true;
            };
        } else {
            document.onkeydown = function (event) {
                document.onkeydown = null;
                switch (event.code) {
                    case `Enter`:
                        mode = `manual`;
                        break;
                }
                return true;
            };
            setTimeout(() => {
                doStep();
            }, speed === `normal` ? step.duration * 1000 : 0);
        }
    };

    // Create a text block.
    const createTextBlock = (block) => {
        const container = block.container;
        if (block.element) {
            container.removeChild(block.element);
        }
        const w = container.getBoundingClientRect().width / 1000;
        const h = container.getBoundingClientRect().height / 1000;
        const properties = block.properties;
        const element = document.createElement(`div`);
        block.element = element;
        element.style[`position`] = `absolute`;
        element.style[`opacity`] = `0.0`;
        element.style[`left`] = properties.blockLeft * w;
        element.style[`top`] = properties.blockTop * h;
        element.style[`width`] = `${properties.blockWidth * w}px`;
        element.style[`height`] = `${properties.blockHeight * h}px`;
        element.style[`background`] = properties.blockBackground;
        element.style[`border`] = properties.blockBorder;
        container.appendChild(element);
        const marginLeft = properties.textMarginLeft * w;
        const marginTop = properties.textMarginTop * h;
        const inner = document.createElement(`div`);
        inner.style[`position`] = `absolute`;
        inner.style[`left`] = marginLeft;
        inner.style[`top`] = marginTop;
        inner.style[`width`] = `calc(100% - ${marginLeft}px - ${marginLeft}px)`;
        element.appendChild(inner);
        element.inner = inner;
        const text = document.createElement(`div`);
        text.style[`font-family`] = properties.fontFamily;
        text.style[`font-size`] = `${properties.fontSize * h}px`;
        text.style[`font-weight`] = properties.fontWeight;
        text.style[`font-style`] = properties.fontStyle;
        text.style[`color`] = properties.fontColor;
        text.style[`text-align`] = properties.textAlign;
        inner.appendChild(text);
        inner.text = text;
    };

    // Create an image block.
    const createImageBlock = (block) => {
        const container = block.container;
        if (block.element) {
            container.removeChild(block.element);
        }
        w = container.getBoundingClientRect().width / 1000;
        h = container.getBoundingClientRect().height / 1000;
        const properties = block.properties;
        const element = document.createElement(`div`);
        block.element = element;
        element.style[`position`] = `absolute`;
        element.style[`opacity`] = `0.0`;
        element.style[`left`] = properties.blockLeft * w;
        element.style[`top`] = properties.blockTop * h;
        element.style[`width`] = `${properties.blockWidth * w}px`;
        element.style[`height`] = `${properties.blockHeight * h}px`;
        element.style[`background`] = properties.blockBackground;
        element.style[`border`] = properties.blockBorder;
        element.style[`border-radius`] = properties.blockBorderRadius;
        container.appendChild(element);
    };

    // Set the content of a block
    const setContent = (spec) => {
        const block = script.blocks[spec.block];
        const contentSpec = script.content[spec.content];
        if (!block) {
            throw Error(`Block '${block}' cannot be found`);
        }
        switch (contentSpec.type) {
            case `text`:
                if (!block.element) {
                    createTextBlock(block);
                }
                let content = contentSpec.content;
                if (Array.isArray(content)) {
                    content = content.join(`<br><br>`);
                }
                block.element.inner.text.innerHTML = content.split(`\n`).join(`<br>`);
            break;
            case `image`:
                if (!block.element) {
                    createImageBlock(block);
                }
                block.element.style[`background`] = `url("${contentSpec.url}")`;
                block.element.style[`background-size`] = `cover`;
                break;
        }
    };

    // Set the content of a block
    const doSetContent = () => {
        if (step.blocks) {
            for (const spec of step.blocks)
            {
                setContent(spec);
            }
        } else {
            setContent(step);
        }
        doStep();
    };

    // Show or hide a block
    const doShowHide = (showHide) => {
        if (Array.isArray(step.blocks)) {
            for (const block of step.blocks)
            {
                script.blocks[block].element.style[`opacity`] = showHide ? `1.0` : `0.0`;
            }
        } else {
            script.blocks[step.blocks].element.style[`opacity`] = showHide ? `1.0` : `0.0`;
        }
        doStep();
    };

    // Fade up or down
    const doFade = (upDown) => {
        const animSteps = Math.round(step.duration * 25);
        const stepBlocks = step.blocks;
        const continueFlag = step.continue;
        let animStep = 0;
        const interval = setInterval(() => {
            if (animStep < animSteps) {
                const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                if (Array.isArray(stepBlocks)) {
                    let blocks = stepBlocks.length;
                    for (const block of stepBlocks)
                    {
                        const element = script.blocks[block].element;
                        element.style[`opacity`] = upDown ? ratio : 1.0 - ratio;
                    }
                } else {
                    const block = script.blocks[stepBlocks];
                    if (!block.element) {
                        clearInterval(interval);
                        throw Error(`I can't fade up a block with no content`);
                    }
                    block.element.style[`opacity`] = upDown ? ratio : 1.0 - ratio;
                }
                animStep++;
            } else {
                clearInterval(interval);
                if (!continueFlag) {
                    doStep();
                }
            }
            }, speed === `normal` ? 40 : 0);
            if (continueFlag) {
                doStep();
            }
    };

    // Handle a crossfade
    const doCrossfade = () => {
        const block = script.blocks[step.block];
        const content = script.content[step.target];
        const continueFlag = step.continue;
        let element;
        let newText;
        switch (content.type) {
            case `text`:
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
                block.container.appendChild(element);
                const inner = document.createElement(`div`);
                inner.style[`position`] = `absolute`;
                inner.style[`left`] = block.element.inner.style[`left`];
                inner.style[`top`] = block.element.inner.style[`top`];
                inner.style[`width`] = block.element.inner.style[`width`];
                element.appendChild(inner);
                const text = document.createElement(`div`);
                text.style[`font-family`] = block.element.inner.text.style[`font-family`];
                text.style[`font-size`] = block.element.inner.text.style[`font-size`];
                text.style[`font-weight`] = block.element.inner.text.style[`font-weight`];
                text.style[`font-style`] = block.element.inner.text.style[`font-style`];
                text.style[`color`] = block.element.inner.text.style[`color`];
                text.style[`text-align`] = block.element.inner.text.style[`text-align`];
                inner.appendChild(text);
                newText = content.content;
                if (Array.isArray(newText)) {
                    newText = newText.join(`<br><br>`);
                }
                newText = newText.split(`\n`).join(`<br>`);
                text.innerHTML = newText;
                break;
            case `image`:
                element = document.createElement(`div`);
                element.style[`position`] = `absolute`;
                element.style[`opacity`] = `0.0`;
                element.style[`left`] = block.element.style[`left`];
                element.style[`top`] = block.element.style[`top`];
                element.style[`width`] = block.element.style[`width`];
                element.style[`height`] = block.element.style[`height`];
                element.style[`background`] = block.element.style[`background`];
                element.style[`border`] = block.element.style[`border`];
                element.style[`border-radius`] = block.element.style[`border-radius`];
                block.container.appendChild(element);
                element.style[`background`] = `url("${content.url}")`;
                element.style[`background-size`] = `cover`;
                break;
            default:
                throw Error(`Unknown content type: '${content.type}'`);
        }

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
                switch (content.type) {
                    case `text`:
                        block.element.inner.text.innerHTML = newText;
                        break;
                    case `image`:
                        block.element.style[`background`] = `url("${content.url}")`;
                        block.element.style[`background-size`] = `cover`;
                        break;
                }
                block.element.style[`opacity`] = 1.0 ;
                element.parentNode.removeChild(element);
                if (!continueFlag) {
                    doStep();
                }
            }
            }, speed === `normal` ? 80 : 0);
            if (continueFlag) {
                doStep();
            }
    };

    // Compute a block size
    const setComputedBlockSize = (block, target, ratio) => {
        const boundingRect = block.container.getBoundingClientRect();
        w = Math.round(boundingRect.width);
        h = Math.round(boundingRect.height);
        const width = block.properties.blockWidth * w / 1000;
        const height = block.properties.blockHeight * h / 1000;
        const endWidth = target.properties.blockWidth * w / 1000;
        const endHeight = target.properties.blockHeight * h / 1000;
        block.element.style[`width`] = 
            `${width + (endWidth - width) * ratio}px`;
        block.element.style[`height`] = 
            `${height + (endHeight - height) * ratio}px`;
    };

    // Compute a block position
    const setComputedBlockPosition = (block, target, ratio) => {
        const boundingRect = block.container.getBoundingClientRect();
        w = Math.round(boundingRect.width);
        h = Math.round(boundingRect.height);
        const left = block.properties.blockLeft * w / 1000;
        const top = block.properties.blockTop * h / 1000;
        const endLeft = target.properties.blockLeft * w / 1000;
        const endTop = target.properties.blockTop * h / 1000;
        block.element.style[`left`] = 
            left + (endLeft - left) * ratio;
        block.element.style[`top`] = 
            top + (endTop - top) * ratio;
    };

    // Compute a font size
    const setComputedFontSize = (block, target, ratio) => {
        h = Math.round(block.container.getBoundingClientRect().height);
        const size = block.properties.fontSize * h / 1000;
        const endSize = target.properties.fontSize * h / 1000;
        block.element.inner.text.style[`font-size`] = 
            `${size + Math.round((endSize - size) * ratio)}px`;
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
        block.element.inner.text.style[`color`] = `#${r}${g}${b}`;
    };

    // Handle a single step of a transition
    const doTransitionStep = (type, block, target, ratio) => {
        switch (type) {
            case `block size`:
                setComputedBlockSize(block, target, ratio);
                break;
            case `block position`:
                setComputedBlockPosition(block, target, ratio);
                break;
            case `font size`:
                setComputedFontSize(block, target, ratio);
                break;
            case `font color`:
                setComputedFontColor(block, target, ratio);
                break;
            default:
                throw Error(`Unknown transition type: '${type}'`);
        }
    };

    // Handle a transition
    const doTransition = () => {
        const animSteps = Math.round(step.duration * 25);
        let animStep = 0;
        const stepType = step.type;
        const continueFlag = step.continue;
        const block = script.blocks[step.block];
        const target = script.blocks[step.target];
        const interval = setInterval(() => {
            if (animStep < animSteps) {
                const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                if (Array.isArray(stepType)) {
                    for (const type of stepType) {
                        doTransitionStep(type, block, target, ratio);
                    }
                } else {
                    doTransitionStep(type, block, target, ratio);
                }
                animStep++;
            } else {
                clearInterval(interval);
                if (!continueFlag) {
                    doStep();
                }
            }
            }, speed === `normal` ? 40 : 0);
            if (continueFlag) {
            doStep();
        }
    };

    // Process a single step
    const doStep = () => {
        if (stepno < script.steps.length) {
            step = script.steps[stepno++];
            while (!step.action) {
                if (step.speed) {
                    speed = step.speed;
                }
                else throw Error(`Unknown syntax: '${JSON.stringify(step, 0, 2)}'`);
                step = script.steps[stepno++];
            }
            if (step.comment) {
                console.log(`Step ${stepno}: ${step.comment}`);
            } else {
                console.log(`Step ${stepno}: ${step.action}`);
            }
            switch (step.action) {
                case `set content`:
                    doSetContent();
                    break;
                case `show`:
                    doShowHide(true);
                    break;
                case `hide`:
                    doShowHide(false);
                    break;
                case `pause`:
                    doPause();
                    break;
                case `hold`:
                    doHold();
                    break;
                case `fade up`:
                    doFade(true);
                    break;
                case `fade down`:
                    doFade(false);
                    break;
                case `crossfade`:
                    doCrossfade();
                    break;
                case`transition`:
                    doTransition();
                    break;
                default:
                    throw Error(`Unknown action: '${step.action}'`);
            }
        }
        else {
            console.log(`Step ${stepno}: Finished`);  
        }
    };

    // Initialization
    const init = () => {
        container.innerHTML = ``;
        document.removeEventListener(`click`, init);
        document.onkeydown = null;
        if (script.title) {
            document.title = script.title;
        }
        const height = Math.round(parseFloat(container.offsetWidth) * script.aspectH / script.aspectW);
        container.style[`height`] = `${Math.round(height)}px`;
        container.style[`position`] = `relative`;
        container.style[`overflow`] = `hidden`;
        container.style[`background-size`] = `cover`;
        for (const property of containerStyles) {
            if (typeof script.container[property] !== 'undefined') {
                container.style[property] = script.container[property];
            }
        }
        initBlocks(container, script.blocks, script.defaults);
        preloadImages(script.content);
        stepno = 0;
        doStep();
    }

    // Set the default mode
    const modeValue = document.getElementById(`jp-mode`);
    if (typeof modeValue !== 'undefined') {
        mode = modeValue.innerText;
    }
    // Wait for a click/tap or a keypress to start
    document.addEventListener(`click`, init);
    document.onkeydown = function (event) {
        document.onkeydown = null;
        switch (event.code) {
            case `Enter`:
                mode = `auto`;
                break;
            default:
                mode = `manual`;
                break;
        }
        init();
        return true;
    };
};

window.onload = () => {
    const createCORSRequest = (url) => {
        let xhr = new XMLHttpRequest();
        if (`withCredentials` in xhr) {
    
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(`GET`, url, true);
    
        } else if (typeof XDomainRequest != `undefined`) {
    
            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            xhr = new XDomainRequest();
            xhr.open(`GET`, url);
    
        } else {
    
            // Otherwise, CORS is not supported by the browser.
            xhr = null;
    
        }
        return xhr;
    };

    const scriptElement = document.getElementById(`jp-script`);
    if (scriptElement) {
        const request = createCORSRequest(`${scriptElement.innerText}?v=${Math.floor(Date.now())}`);
        if (!request) {
            throw Error(`Unable to access the JSON script`);
        }

        request.onload = () => {
            if (200 <= request.status && request.status < 400) {
                const script = JSON.parse(request.responseText);
                JSON_Presenter(document.getElementById(`jp-container`), script);
        } else {
                throw Error(`Unable to access the JSON script`);
            }
        };

        request.onerror = () => {
            throw Error(`Unable to access the JSON script`);
        };

        request.send();
    }
};
