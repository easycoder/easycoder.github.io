// eslint-disable-next-line no-unused-vars
const IWSY = (playerElement, scriptObject) => {

	let player = playerElement;
	let script = scriptObject;
	let homeScript = script;
	let thePath = ``;
	let afterRun;
	let plugins;
	let timeouts = [];
	let intervals = [];

	// Set up all the blocks
	const setupBlocks = () => {
		for (const block of script.blocks) {
			const current = {};
			for (const name in block.defaults) {
				current[name] = block.defaults[name];
			}
			block.current = current;
			block.vfx = [];
		}
	};

	const pause = step => {
		if (script.speed === `scan`) {
			step.next();
			return;
		}
		addTimeoutTimer(setTimeout(() => {
			step.next();
		}, script.runMode === `manual` ? 0 : step.duration * 1000));
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
		};
		if (block.defaults.parent) {
			for (b of script.blocks) {
				if (b.defaults.name === block.defaults.parent) {
					rect = getBlockRect(b, rect);
					break;
				}
			}
		}
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

	// No operation
	const noop = step => {
		step.next();
	};

	// Set the content of one or more blocks
	const setcontent = step => {
		let continueFlag = true;
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
							const converted = converter.makeHtml(text.content.split(`%0a`).join(`\n`));
							const tag = converted.match(/data-slide="([\w-_.]*)"/);
							if (tag) {
								const imagesLoading = [];
								for (const vfx of script.vfx) {
									if (vfx.name === tag[1]) {
										vfx.container = block.textPanel;
										if (vfx.url) {
											if (vfx.url[0] === `=`) {
												const lastVFX = vfx.url.slice(1);
												for (const index in block.vfx) {
													const vfx2 = block.vfx[index];
													if (vfx2.name === lastVFX) {
														vfx.image = vfx2.image;
														initImage(vfx);
														vfx.startsize = vfx2.endsize;
														vfx.startxoff = vfx2.endxoff;
														vfx.startyoff = vfx2.endyoff;
														vfx.w = vfx2.w2;
														vfx.h = vfx2.h2;
														vfx.xoff = vfx2.xoff2;
														vfx.yoff = vfx2.yoff2;
														if (!vfx.image) {
															throw new Error(`Unknown vfx ${lastVFX}`);
														}
														block.vfx[index] = vfx;
													}
													break;
												}
											} else {
												block.vfx.push(vfx);
												continueFlag = false;
												block.textPanel.innerHTML = converted;
												const image = new Image();
												vfx.image = image;
												image.id = vfx.name;
												image.src = vfx.url;
												image.addEventListener(`load`, () => {
													initImage(vfx);
													const index = imagesLoading.indexOf(image);
													if (index > -1) {
														imagesLoading.splice(index, 1);
													}
													if (imagesLoading.length === 0) {
														step.next();
													}
												});
												imagesLoading.push(image);
												block.textPanel.appendChild(image);
											}
											break;
										}
										break;
									}
								}
							} else {
								block.textPanel.innerHTML = converted;
							}
							break;
						}
					}
					block.element.style.display = step.display;
					break;
				}
			}
		}
		if (continueFlag) {
			step.next();
		}
	};

	// Set the visibility of a block
	const setVisibility = (block, showHide) => {
		if (showHide) {
			// block.element.style.opacity = `1.0`;
			block.element.style.display = `block`;
		} else {
			// block.element.style.opacity = `0.0`;
			block.element.style.display = `none`;
		}
	};

	// Show or hide a block
	const doShowHide = (step, showHide) => {
		for (const name of step.blocks)
		{
			for (const block of script.blocks) {
				if (block.defaults.name === name) {
					if (!block.element) {
						createBlock(block);
					}
					setVisibility(block, showHide);
					break;
				}
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

	addIntervalTimer = (interval) => {
		if (!Array.isArray(intervals)) {
			intervals = [];
		}
		intervals.push(interval);
	};

	clearIntervalTimer = interval => {
		clearInterval(interval);
		const pos = intervals.indexOf(interval);
		intervals.splice(pos, 1);
	};

	addTimeoutTimer = (timeout) => {
		if (!Array.isArray(timeouts)) {
			timeouts = [];
		}
		timeouts.push(timeout);
	};

	clearAllTimers = () => {
		while (intervals.length) {
			clearInterval(intervals[0]);
			intervals.splice(0, 1);
		}
		while (timeouts.length) {
			clearTimeout(timeouts[0]);
			timeouts.splice(0, 1);
		}
	};

	// Fade up or down
	const doFade = (step, upDown) => {
		const stepBlocks = [];
		for (const name of step.blocks) {
			script.blocks.every((block) => {
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
				if (upDown) {
					block.element.style.opacity = `1.0`;
					block.element.style.display = `block`;
				} else {
					block.element.style.opacity = `0.0`;
					block.element.style.display = `none`;
				}
			}
		} else {
			const animSteps = Math.round(step.duration * 25);
			const continueFlag = step.continue === `yes`;
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
							// if (block.element) {
							block.element.style.opacity = upDown ? ratio : 1.0 - ratio;
							// }
						}
						animStep++;
					} else {
						for (const block of stepBlocks)
						{
							// if (block.element) {
							block.element.style.opacity = upDown ? 1 : 0;
							block.element.style.display = upDown ? `block` :`none`;
							// }
						}
						clearIntervalTimer(interval);
						if (!continueFlag) {
							if (script.runMode === `manual`) {
								enterManualMode(step);
							} else {
								step.next();
							}
						}
					}
				} catch(err) {
					clearIntervalTimer(interval);
					throw Error(err);
				}
			}, 40);
			addIntervalTimer(interval);
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

	const initImage = vfx => {
		const container = vfx.container;
		const image = vfx.image;
		let aspectW = 4;
		let aspectH = 3;
		const colon = vfx.aspect.indexOf(`:`);
		if (colon) {
			aspectW = vfx.aspect.slice(0,colon);
			aspectH = vfx.aspect.slice(colon + 1);
		}
		const ratio = aspectW / aspectH;
		const width = container.offsetWidth;
		const height = width / ratio;
		container.style.height = `${Math.round(height)}px`;
		container.style.display = `inline-block`;
		container.style.overflow = `hidden`;

		const realWidth = image.naturalWidth;
		const realHeight = image.naturalHeight;
		const realRatio = realWidth / realHeight;
		let w;
		let h;
		if (ratio < realRatio) {
			h = height;
			w = height * realRatio;
		} else {
			w = width;
			h = width / realRatio;
		}
		const w2 = w * vfx.endsize / 100;
		const h2 = h * vfx.endsize / 100;
		w *= vfx.startsize / 100;
		h *= vfx.startsize / 100;
		const xoff = -width * vfx.startxoff / 100;
		const yoff = -height * vfx.startyoff / 100;
		const xoff2 = -width * vfx.endxoff / 100;
		const yoff2 = -height * vfx.endyoff / 100;

		vfx.w = w;
		vfx.w2 = w2;
		vfx.h = h;
		vfx.h2 = h2;
		vfx.xoff = xoff;
		vfx.xoff2 = xoff2;
		vfx.yoff = yoff;
		vfx.yoff2 = yoff2;

		image.style.position = `absolute`;
		image.style.width = `${w}px`;
		image.style.height = `${h}px`;
		image.style.left = `${xoff}px`;
		image.style.top = `${yoff}px`;
	};

	const doPanzoom = (timestamp, vfx) => {
		if (vfx.start === undefined) {
			vfx.start = timestamp;
		}
		const image = vfx.image;
		const elapsed = timestamp - vfx.start;
		const duration = vfx.duration * 1000;
		if (elapsed < duration) {
			const ratio =  0.5 - Math.cos(Math.PI * elapsed / duration) / 2;
			image.style.width = `${vfx.w + (vfx.w2 - vfx.w) * ratio}px`;
			image.style.height = `${vfx.h + (vfx.h2 - vfx.h) * ratio}px`;
			image.style.left = `${vfx.xoff + (vfx.xoff2 - vfx.xoff) * ratio}px`;
			image.style.top = `${vfx.yoff + (vfx.yoff2 - vfx.yoff) * ratio}px`;
			requestAnimationFrame(timestamp => {
				doPanzoom(timestamp, vfx);
			});
		} else {
			image.style.width = `${vfx.w2}px`;
			image.style.height = `${vfx.h2}px`;
			image.style.left = `${vfx.xoff2}px`;
			image.style.top = `${vfx.yoff2}px`;
			if (vfx.then) {
				vfx.then();
			}
		}
	};

	// This is where the vfx animations are started
	const startVFX = (step, vfx) => {
		const vfxElement = vfx.container;
		vfxElement.style.position = `relative`;
		vfxElement.style.display = `inline-block`;
		for (const item of script.vfx) {
			if (item.name === vfx.name) {
				if (!Array.isArray(step.vfx)) {
					step.vfx = [];
				}
				step.vfx.push(item);
				vfx.then = () => {
					const index = step.vfx.indexOf(item);
					if (index > -1) {
						step.vfx.splice(index, 1);
					}
					if (step.vfx.length === 0 && step.continue !== `yes`) {
						step.next();
					}
				};
				delete(vfx.start);
				requestAnimationFrame(timestamp => {
					doPanzoom(timestamp, vfx);
				});
				break;
			}
		} 
		if (step.vfx.length === 0) {
			step.next();
		}
	};

	// Animate blocks
	const animate = step => {
		let continueFlag = true;
		for (const name of step.blocks)
		{
			for (const block of script.blocks) {
				if (block.defaults.name === name) {
					for (const vfx of block.vfx) {
						continueFlag = step.continue === `yes`;
						startVFX(step, vfx);
					}
					break;
				}
			}
		}
		if (script.runMode === `manual`) {
			enterManualMode(step);
		} else if (continueFlag) {
			step.next();
		}
	};

	// Run a pan-zoom
	const panzoom = arg => {
		player.innerText = ``;
		const vfx = JSON.parse(arg);
		vfx.container = player;
		const image = new Image();
		vfx.image = image;
		image.src = spec.url;
		// image.style.display = `none`;
		image.addEventListener(`load`, () => {
			initImage(spec);
			requestAnimationFrame(timestamp => {
				doPanzoom(timestamp, vfx);
			});
		});
		player.appendChild(image);
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
							player.appendChild(element);
							element.style.position = `absolute`;
							element.style.opacity = `0.0`;
							element.style.left = block.element.style.left;
							element.style.top = block.element.style.top;
							element.style.width = block.element.style.width;
							element.style.height = block.element.style.height;
							if (block.element.style.background) {
								element.style.background = block.element.style.background;
							}
							element.style.border = block.element.style.border;
							element.style[`border-radius`] = block.element.style[`border-radius`];
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
							const continueFlag = step.continue === `yes`;
							let animStep = 0;
							const interval = setInterval(() => {
								if (animStep < animSteps) {
									const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
									block.element.style.opacity = 1.0 - ratio;
									element.style.opacity = ratio;
									animStep++;
								} else {
									clearIntervalTimer(interval);
									block.textPanel.innerHTML = newText;
									if (content.url) {
										block.element.style.background = `url("${content.url}")`;
									}
									block.element.style[`background-size`] = `cover`;
									block.element.style.opacity = 1.0 ;
									removeElement(element);
									if (!continueFlag) {
										if (script.runMode === `manual`) {
											enterManualMode(step);
										} else {
											step.next();
										}
									}
								}
							}, 40);
							addIntervalTimer(interval);
							if (continueFlag) {
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
		const r = (`0` + red.toString(16)).slice(-2);
		const g = (`0` + green.toString(16)).slice(-2);
		const b = (`0` + blue.toString(16)).slice(-2);
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
			const continueFlag = step.continue === `yes`;
			const interval = setInterval(() => {
				if (animStep < animSteps) {
					const ratio =  0.5 - Math.cos(Math.PI * animStep / animSteps) / 2;
					try {
						doTransitionStep(block, target, ratio);
					} catch (err) {
						clearIntervalTimer(interval);
					}
					animStep++;
				} else {
					clearIntervalTimer(interval);
					setFinalState(block,target);
					if (!continueFlag) {
						if (script.runMode === `manual`) {
							enterManualMode(step);
						} else {
							step.next();
						}
					}
				}
			}, 40);
			addIntervalTimer(interval);
			if (continueFlag) {
				step.next();
			}
		}
	};

	// Remove all the blocks from the player
	const removeBlocks = () => {
		if (Array.isArray(script.blocks)) {
			for (const block of script.blocks) {
				if (block.element) {
					removeElement(block.element);
					delete(block.element);
				}
			}
		}
	};

	// Remove an element
	const removeElement = element => {
		const parent = element.parentElement;
		if (parent) {
			parent.removeChild(element);
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
		if (step.css) {
			setHeadStyle(step.css.split(`%0a`).join(`\n`));
		}
		const aspect = step[`aspect ratio`];
		if (aspect) {
			const colon = aspect.indexOf(`:`);
			if (colon > 0) {
				const aspectW = aspect.substr(0, colon);
				const aspectH = aspect.substr(colon + 1);
				if (document.fullscreenElement) {
					player.style.width = window.innerWidth;
					player.style.height = window.innerHeight;
					player.style.border = ``;
				} else {
					const height = Math.round(parseFloat(player.offsetWidth) * aspectH / aspectW);
					player.style.height = `${Math.round(height)}px`;
					player.style.border = step.border;
				}
			}
			player.style.position = `relative`;
			player.style.overflow = `hidden`;
			player.style.cursor = `none`;
			if (step.background) {
				player.style.background = step.background.split(`&quot;`).join(`"`);
			}
			player.style[`background-size`] = `cover`;
		}
		step.next();
	};

	// Scan the script
	const scan = () => {
		removeBlocks();
		setupBlocks();
		player.innerHTML = ``;
		initScript();
		script.speed = `scan`;
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

	// Restore the cursor
	const restoreCursor = () => {
		player.style.cursor = `pointer`;
		script = homeScript;
		if (afterRun) {
			afterRun();
		}
	};

	// Set up Showdown
	const setupShowdown = () => {
		if (typeof showdown === `undefined`) {
			require(`js`, `https://cdn.rawgit.com/showdownjs/showdown/1.9.1/dist/showdown.min.js`,
				() => {
					showdown.extension(`IWSY`, {
						type: `lang`,
						filter: function (text) {
							return text.replace(/~([^~]+)~/g, function (match, group) {
								return decodeShowdown(group);
							});
						}
					});
				});
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
			const pipe = data.indexOf(`|`);
			if (pipe > 0) {
				const src = data.slice(0, pipe);
				const classes = data.slice(pipe + 1).split(` `);
				const styles = [];
				for (const item of classes) {
					setImageStyles(item, styles);
				}
				return `<img src="${src}" style="${styles.join(`;`)}" />`;
			}
		}
		if (group.slice(0, 4) === `vfx:`) {
			const styles = [];
			let slide = ``;
			const items = group.slice(4).split(` `);
			for (const item of items) {
				if (!setImageStyles(item, styles)) {
					slide = item;
				}
			}
			return `<div class="iwsy-vfx" style="${styles.join(`;`)}"
				data-slide="${slide}"></div>`;
		}
		return group;
	};

	// Set the image styles
	const setImageStyles = (item, styles) => {
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
				styles.push(`position:absolute;left:50%;top:0;transform:translate(-50%, 0)`);
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
			default:
				return false;
			}
		}
		return true;
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
		var style = document.createElement(`style`);
		style.className = `iwsy-css`;
		style.innerHTML = `${styleName} ${styleValue}`;
		document.head.appendChild(style);
	};

	// Release the presentation to continue
	const release = () => {
		player.style.cursor = `none`;
		document.removeEventListener(`click`, release);
		document.addEventListener(`click`, () => {
			script.runMode = `manual`;
		});
		document.onkeydown = () => {
			script.runMode = `manual`;
		};
		doStep(script.nextStep);
	};

	// Manual mode. Set up listeners and wait for the user
	const enterManualMode = step => {
		script.nextStep = step ? script.steps[step.index + 1] : script.steps[0];
		player.style.cursor = `pointer`;
		document.addEventListener(`click`, release);
		document.onkeydown = event => {
			switch (event.code) {
			case `Space`:
			case `ArrowRight`:
				document.onkeydown = null;
				script.runMode = `manual`;
				release();
				break;
			case `ArrowLeft`:
				break;
			case `Enter`:
				document.addEventListener(`click`, () => {
					script.runMode = `manual`;
				});
				player.style.cursor = `none`;
				script.runMode = `auto`;
				release();
				break;
			}
			return true;
		};
	};

	// Initialize the script
	const initScript = () => {
		document.onkeydown = null;
		player.style.position = `relative`;
		player.style.overflow = `hidden`;
		player.style.cursor = `none`;
		script.speed = `normal`;
		script.labels = {};
		script.stop = false;
		script.scanFinished = false;
		removeStyles();
		for (const block of script.blocks) {
			const element = block.element;
			if (element != null && typeof element !== `undefined`) {
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
				const nextStep = script.steps[step.index + 1];
				step.next = () => {
					if (script.scanFinished) {
						script.scanFinished = false;
					} else {
						if (script.speed === `scan` && nextStep.index === script.scanTarget) {
							script.speed = `normal`;
							script.scanFinished = true;
						}
						if (script.runMode == `auto` || script.speed === `scan`) {
							setTimeout(() => {
								if (script.stop) {
									script.stop = false;
									restoreCursor();
								} else {
									doStep(nextStep);
								}
							}, 0);
						} else {
							doStep(nextStep);
						}
					}
				};
			}
			else {
				step.next = () => {
					console.log(`Step ${index + 1}: Finished`);
					restoreCursor();
				};
			}
		});
		setupBlocks();
	};

	const actions = {
		init,
		noop,
		setcontent,
		show,
		hide,
		fadeup,
		fadedown,
		animate,
		crossfade,
		transition,
		pause,
		goto,
		load
	};

	// Process a single step
	const doStep = step => {
		try {
			if (!step) {
				return;
			}
			if (step.title) {
				console.log(`Step ${step.index}: ${step.title}`);
			} else {
				console.log(`Step ${step.index}: ${step.action}`);
			}

			const onStepCB = script.onStepCB;
			if (step.action === `chain`) {
				const runMode = script.runMode;
				if (step.mode === `static`) {
					script = window.localStorage.getItem(step.script);
					if (onStepCB) {
						onStepCB(-1);
					}
					initScript();
					script.runMode = runMode;
					doStep(script.steps[1]);
				} else {
					fetch(`${thePath}/${step.script}?v=${Date.now()}`)
						.then(response => {
							if (response.status >= 400) {
								throw Error(`Unable to load ${step.script}: ${response.status}`);
							}
							response.json().then(data => {
								script = data;
								if (onStepCB) {
									onStepCB(-1);
								}
								initScript();
								script.runMode = runMode;
								doStep(script.steps[1]);
							});
						})
						.catch(err => {
							console.log(`Fetch Error :${err}`);
						});
					return;
				}
			}
            
			const actionName = step.action.split(` `).join(``);
			let handler = actions[actionName];
			if (script.runMode === `auto`) {
				if (typeof handler === `undefined`) {
					handler = plugins[actionName];
					if (typeof handler === `undefined`) {
						throw Error(`Unknown action: '${step.action}'`);
					}
				}
				if (onStepCB) {
					onStepCB(step.index);
				}
				try {
					handler(step);
				} catch (err) {
					console.log(`Step ${step.index} (${step.action}): ${err}`);
					alert(`Step ${step.index} (${step.action}): ${err}`);
				}
			} else {
				try {
					handler(step);
				} catch (err) {
					console.log(JSON.stringify(step,0,2) + `\n` + JSON.stringify(handler,0,2));
					console.log(`Step ${step.index} (${step.action}): ${err}`);
					alert(`Step ${step.index} (${step.action}): ${err}`);
				}
			}
		}
		catch (err) {
			console.log(`Step error: ${err}`);
			throw Error(err);
		}
	};

	///////////////////////////////////////////////////////////////////////////////
	// These are all the exported functions

	// Get the script
	const getScript = () => {
		return script;
	};
    
	// Set the script
	const setScript = newScript => {
		removeBlocks();
		script = newScript;
		initScript();
	};
    
	// Set the path (for 'embed')
	const setPath = path => {
		thePath = path;
	};
    
	// Go to a specified step number
	const gotoStep = target => {
		script.scanTarget = target;
		script.runMode = `manual`;
		scan();
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
				val = `calc(${val} - 2px)`;
			}
			element.style.width = val;
			val = defaults.height;
			if (!isNaN(val)) {
				val = `${val * h - 2}px`;
			} else {
				val = `calc(${val} - 2px)`;
			}
			element.style.height = val;
			element.style[`font-size`] = `${h * 40}px`;
			element.innerHTML = defaults.name;
			if (index == blockIndex) {
				element.style.background = `#ddffdd`;
				element.style.border = `1px solid #00ff00`;
				element.style[`font-weight`] = `bold`;
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
	const run = (mode, startMode, then) => {
		try {
			player.innerHTML = ``;
			homeScript = JSON.parse(JSON.stringify(script));
			afterRun = then;
			initScript();
			if (mode === `fullscreen`) {
				if (document.fullscreenElement) {
					document.exitFullscreen();
				} else {
					player.requestFullscreen();
					document.onfullscreenchange = () => {
						if (document.fullscreenElement) {
							player = document.fullscreenElement;
							script.nextStep = script.steps[0];  
							switch (startMode) {
							case `auto`:
								script.runMode = `auto`;
								release();
								break;
							case `manual`:
								script.runMode = `manual`;
								release();
								break;
							case `wait`:
								script.runMode = `manual`;
								enterManualMode(null);
								break;
							}
						} else {
							player = playerElement;
							script.stop = true;
						}
					};
				}
			} else {
				script.runMode = `auto`;
				doStep(script.steps[0]);
			}
		} catch (err) {
			console.log(`Run error: ${err}`);
			throw Error(err);
		}
	};
    
	// Stop the run
	const stop = () => {
		clearAllTimers();
		script.stop = true;
	};
    
	// Set a step callback
	const onStep = onStepCB => {
		script.onStepCB = onStepCB;
	};
    
	// Remove all the CSS styles
	const removeStyles = () => {
		const styles = document.getElementsByClassName(`iwsy-css`);
		for (const style of styles) {
			style.parentNode.removeChild(style);
		}
	};

	///////////////////////////////////////////////////////////////////////////

	setupShowdown();
	initScript();
	return {
		getScript,
		setScript,
		setPath,
		gotoStep,
		block,
		run,
		stop,
		onStep,
		removeStyles,
		panzoom
	};
};