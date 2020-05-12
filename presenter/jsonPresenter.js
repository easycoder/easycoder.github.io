// JSON::Presenter

window.onload = () => {
    const createCORSRequest = (url) => {
        var xhr = new XMLHttpRequest();
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
    
    const container = document.getElementById(`jp-container`);

    const scriptElement = document.getElementById(`jp-script`);
    const request = createCORSRequest(scriptElement.innerText);
    if (!request) {
        throw Error(`Unable to access the JSON script`);
    }

    request.onload = () => {
        if (200 <= request.status && request.status < 400) {
            JSON_Presenter.present(container, request.responseText);
        } else {
            throw Error(`Unable to access the JSON script`);
        }
    };

    request.onerror = () => {
        throw Error(`Unable to access the JSON script`);
    };

    request.send();
};

const JSON_Presenter = {

    present: (container, text) => {
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
            `blockBackground`,
            `blockPadding`
        ];

        const script = JSON.parse(text);
        document.title = script.title;
        const height = Math.round(parseFloat(container.offsetWidth) * script.aspectH / script.aspectW);
        container.style[`height`] = `${Math.round(height)}px`;
        container.style[`position`] = `relative`;
        script.element = container;
        for (const item of containerStyles) {
            JSON_Presenter.doStyle(container, script.container, item);
        } 
        container.style[`background-size`] = `cover`;
        JSON_Presenter.doBlocks(container, script.blocks, script.defaults);
        JSON_Presenter.doStep(script, 0);
    },

    // Process a style property
    doStyle: (element, spec, property) => {
        if (typeof spec[property] !== 'undefined') {
            element.style[property] = spec[property];
        }
    },

    // Create all the blocks
    doBlocks: (container, blocks, defaults) => {
        for (const name in blocks) {
            const block = blocks[name];
            const properties = {};
            // Set up the default properties
            for (const name in defaults) {
                properties[name] = defaults[name];
            }
            // Override with local values
            for (const name in block.spec) {
                properties[name] = block.spec[name];
            }
            block.properties = properties;
            block.container = container;
        }
    },

    // Run a step
    doStep: (script, stepno) => {
        const goto = (script, stepno) => {
            if (stepno < script.steps.length) {
                setTimeout(function () {
                    JSON_Presenter.doStep(script, stepno);
                }, 1);
            }
        };

        // Create an element.
        const createElement = (block) => {
            const container = block.container;
            w = Math.round(container.getBoundingClientRect().width);
            h = Math.round(container.getBoundingClientRect().height);
            const properties = block.properties;
            const element = document.createElement(`div`);
            block.element = element;
            element.style[`position`] = `absolute`;
            element.style[`display`] = `none`;
            element.style[`left`] = properties.blockLeft * w / 1000;
            element.style[`top`] = properties.blockTop * h / 1000;
            element.style[`width`] = `${properties.blockWidth * w / 1000}px`;
            element.style[`height`] = `${properties.blockHeight * h / 1000}px`;
            element.style[`background`] = properties.blockBackground;
            element.style[`border`] = properties.blockBorder;
            container.appendChild(element);
            const paddingLeft = `${properties.blockPaddingLeft * w / 1000}px`;
            const paddingTop = `${properties.blockPaddingTop * h / 1000}px`;
            const inner = document.createElement(`div`);
            inner.style[`position`] = `absolute`;
            inner.style[`left`] = paddingLeft;
            inner.style[`top`] = paddingTop;
            inner.style[`width`] = `calc(100% - ${paddingLeft} - ${paddingLeft})`;
            element.appendChild(inner);
            element.inner = inner;
            const text = document.createElement(`div`);
            text.style[`font-family`] = properties.fontFamily;
            text.style[`font-size`] = `${properties.fontSize * h / 1000}px`;
            text.style[`font-weight`] = properties.fontWeight;
            text.style[`font-style`] = properties.fontStyle;
            text.style[`color`] = properties.fontColor;
            text.style[`text-align`] = properties.textAlign;
            inner.appendChild(text);
            inner.text = text;
        };

        // Set the content of blocks
        const doSetContent = (script, step) => {
            for (const item of step.blocks) {
                const block = script.blocks[item.block];
                switch (block.type) {
                    case `text`:
                        let content = script.content[item.content];
                        if (Array.isArray(content)) {
                            content = content.join(`<br><br>`);
                        }
                        content = content.split(`\n`).join(`<br>`);
                        block.element.inner.text.innerHTML = content.split(`\n`).join(`<br>`);
                    break;
                    case `image`:
                        break;
                }
            }
        };
        
        // Create an element
        const doCreate = (script, step) => {
            if (Array.isArray(step.blocks)) {
                for (const block of step.blocks)
                {
                    createElement(script.blocks[block]);
                }
            } else {
                createElement(script.blocks[step.blocks]);
            }
        };

        // Process a single fade step
        const doFadeStep = (element, steps, n, upDown, onFinish) => {
            if (upDown) {
                element.style[`opacity`] = parseFloat(n) / steps;
            } else {
                element.style[`opacity`] = 1.0 - parseFloat(n) / steps;
            }
            if (n < steps) {
                setTimeout(function () {
                    doFadeStep(element, steps, n + 1, upDown, onFinish);
                }, 40);
            } else {
                element.style[`opacity`] = upDown ? 1.0 : 0.0;
                if (!upDown) {
                    element.style[`display`] = `none`;
                }
                onFinish();
            }
        };

        // Handle a fade up or down
        const doFade = (script, step, stepno, upDown) => {
            const steps = Math.round(parseFloat(step.duration) * 25);
            if (Array.isArray(step.blocks)) {
                let blocks = step.blocks.length;
                for (const block of step.blocks)
                {
                    const element = script.blocks[block].element;
                    element.style[`opacity`] = upDown ? 0.0 : 1.0;
                    if (upDown) {
                        element.style[`display`] = `block`;
                    }
                    doFadeStep(element, steps, 0, upDown, () => {
                        blocks--;
                        if (blocks === 0 && step.wait) {
                            goto(script, stepno + 1);
                        }
                    });
                }
            } else {
                const element = script.blocks[step.blocks].element;
                element.style[`opacity`] = upDown ? 0.0 : 1.0;
                if (upDown) {
                    element.style[`display`] = `block`;
                }
                doFadeStep(element, steps, 0, upDown, () => {
                    if (step.wait) {
                        goto(script, stepno + 1);
                    }
                });
            }
            if (!step.wait) {
                goto(script, stepno + 1);
            }
        };

        // Show or hide an element
        const doShowHide = (script, step, showHide) => {
            if (Array.isArray(step.blocks)) {
                for (const block of step.blocks)
                {
                    script.blocks[block].element.style[`display`] = showHide ? `block` : `none`;
                }
            } else {
                script.blocks[step.blocks].element.style[`display`] = showHide ? `block` : `none`;
            }
        };

        // Process a single transition step
        const doTransitionStep = (block, target, step, nSteps, n, transition, onFinish) => {
            transition(block, target, step, nSteps, n);
            if (n < nSteps) {
                setTimeout(function () {
                    doTransitionStep(block, target, step, nSteps, n + 1, transition, onFinish);
                }, 40);
            } else {
                onFinish();
            }
        };

        // Compute a block size
        const setComputedBlockSize = (block, target, nSteps, n) => {
            const boundingRect = block.container.getBoundingClientRect();
            w = Math.round(boundingRect.width);
            h = Math.round(boundingRect.height);
            const width = block.properties.blockWidth * w / 1000;
            const height = block.properties.blockHeight * h / 1000;
            const endWidth = target.properties.blockWidth * w / 1000;
            const endHeight = target.properties.blockHeight * h / 1000;
            block.element.style[`width`] = 
                `${width + Math.round((endWidth - width) * n / nSteps)}px`;
            block.element.style[`height`] = 
                `${height + Math.round((endHeight - height) * n / nSteps)}px`;
        };

        // Compute a block position
        const setComputedBlockPosition = (block, target, nSteps, n) => {
            const boundingRect = block.container.getBoundingClientRect();
            w = Math.round(boundingRect.width);
            h = Math.round(boundingRect.height);
            const left = block.properties.blockLeft * w / 1000;
            const top = block.properties.blockTop * h / 1000;
            const endLeft = target.properties.blockLeft * w / 1000;
            const endTop = target.properties.blockTop * h / 1000;
            block.element.style[`left`] = 
                left + Math.round((endLeft - left) * n / nSteps);
            block.element.style[`top`] = 
                top + Math.round((endTop - top) * n / nSteps);
        };

        // Compute a font size
        const setComputedFontSize = (block, target, nSteps, n) => {
            h = Math.round(script.element.getBoundingClientRect().height);
            const size = block.properties.fontSize * h / 1000;
            const endSize = target.properties.fontSize * h / 1000;
            block.element.inner.text.style[`font-size`] = 
                `${size + Math.round((endSize - size) * n / nSteps)}px`;
        };

        // Compute a font color
        const setComputedFontColor = (block, target, nSteps, n) => {
            const color = block.spec.fontColor;
            const endColor = target.spec.fontColor;
            const rStart = parseInt(color.slice(1, 3), 16);
            const gStart = parseInt(color.slice(3, 5), 16);
            const bStart = parseInt(color.slice(5, 7), 16);
            const rFinish = parseInt(endColor.slice(1, 3), 16);
            const gFinish = parseInt(endColor.slice(3, 5), 16);
            const bFinish = parseInt(endColor.slice(5, 7), 16);
            const red = rStart + Math.round((rFinish - rStart) * n / nSteps);
            const green = gStart + Math.round((gFinish - gStart) * n / nSteps);
            const blue = bStart + Math.round((bFinish - bStart) * n / nSteps);
            const r = ("0" + red.toString(16)).slice(-2);
            const g = ("0" + green.toString(16)).slice(-2);
            const b = ("0" + blue.toString(16)).slice(-2);
            block.element.inner.text.style[`color`] = `#${r}${g}${b}`;
        };

        const computeTransitionValues = (block, target, step, nSteps, n) => {
            for (const type of step.type) {
                switch (type) {
                    case `block size`:
                        setComputedBlockSize(block, target, nSteps, n);
                        break;
                    case `block position`:
                        setComputedBlockPosition(block, target, nSteps, n);
                        break;
                    case `font size`:
                        setComputedFontSize(block, target, nSteps, n);
                        break;
                    case `font color`:
                        setComputedFontColor(block, target, nSteps, n);
                        break;
                    default:
                        throw Error(`Unknown transition type: '${type}'`);
                }
            }
        };

        // Do the transition
        const computeTransitionStep = (block, target, types, nSteps, n) => {
            if (Array.isArray(types)) {
                for (const type of types) {
                    computeTransitionValues(block, target, type, nSteps, n);
                }
            } else {
                computeTransitionValues(block, target, types, nSteps, n);
            }
            h = Math.round(script.element.getBoundingClientRect().height);
            const size = block.properties.fontSize * h / 1000;
            const endSize = target.properties.fontSize * h / 1000;
            block.element.inner.text.style[`font-size`] = 
                `${size + Math.round((endSize - size) * n / nSteps)}px`;
        };

        const doTransition = (script, step, stepno) => {
            const block = script.blocks[step.block];
            const target = script.blocks[step.target];
            const nSteps = Math.round(parseFloat(step.duration) * 25);
            doTransitionStep(block, target, step, nSteps, 0, computeTransitionStep, function() {
                if (step.wait) {
                    goto(script, stepno + 1);
                }
            });
            if (!step.wait) {
                goto(script, stepno + 1);
            }
        };

        // Process a single step
        const step = script.steps[stepno];
        switch (step.action) {
            case `set content`:
                doSetContent(script, step);
                goto(script, stepno + 1);
                break;
            case `create`:
                doCreate(script, step);
                goto(script, stepno + 1);
                break;
            case `show`:
                doShowHide(script, step, true);
                goto(script, stepno + 1);
                break;
            case `hide`:
                doShowHide(script, step, false);
                goto(script, stepno + 1);
                break;
            case `hold`:
                setTimeout(function () {
                    goto(script, stepno + 1);
                }, step.duration * 1000);
                break;
            case `fade up`:
                doFade(script, step, stepno, true);
                break;
            case `fade down`:
                doFade(script, step, stepno, false);
                break;
            case`transition`:
                doTransition(script, step, stepno);
                break;
            default:
                throw Error(`Unknown action: '${step.action}'`);
        }
    }
};
