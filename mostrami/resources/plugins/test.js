const JSON_Presenter_Test = step => {
    if (step.script.speed === `scan`) {
        step.next();
    } else {
        const animSteps = Math.round(step.duration * 25);
        let animStep = 0;
        let interval = setInterval(() => {
            if (animStep < animSteps) {
                const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                const block = step.script.blocks[step.block];
                block.element.style[`opacity`] = 1.0 - ratio;
                animStep++;
            } else {
                clearInterval(interval);
                animStep = 0;
                interval = setInterval(() => {
                    if (animStep < animSteps) {
                        const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
                        const block = step.script.blocks[step.block];
                        block.element.style[`opacity`] = ratio;
                        animStep++;
                    } else {
                        clearInterval(interval);
                        step.next();
                    }
                }, 40);
            }
        }, step.script.speed === `normal` ? 40 : 400);
    }
};

JSON_Presenter.plugins.test = JSON_Presenter_Test;
