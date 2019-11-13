// eslint-disable-next-line no-unused-vars
const EasyCoder_WOF = {

	name: `EasyCoder_WOF`,

	/*
	A package to draw and manage a roulette wheel.
	*/

	Draw: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const wheelRecord = compiler.getSymbolRecord();
				if (wheelRecord.keyword === `wheel`) {
					if (compiler.nextTokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const canvasRecord = compiler.getSymbolRecord();
							if (canvasRecord.keyword === `canvas`) {
								compiler.next();
								compiler.addCommand({
									domain: `wof`,
									keyword: `draw`,
									lino,
									wheel: wheelRecord.name,
									canvas: canvasRecord.name
								});
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const wheelRecord = program.getSymbolRecord(command.wheel);
			const canvasRecord = program.getSymbolRecord(command.canvas);
			const canvas = canvasRecord.element[canvasRecord.index];
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			const wheel = EasyCoder_roulette_wheel;
			wheelRecord.wheel = wheel;
			wheel.canvas = canvas;
			wheel.init(wheel);
			wheel.drawRouletteWheel(wheel);
			return command.pc + 1;
		}
	},

	Spin: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const wheelRecord = compiler.getSymbolRecord();
				if (wheelRecord.keyword === `wheel`) {
					compiler.next();
					compiler.addCommand({
						domain: `wof`,
						keyword: `spin`,
						lino,
						wheel: wheelRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const wheelRecord = program.getSymbolRecord(command.wheel);
			wheelRecord.wheel.spin(wheelRecord.wheel);
			return command.pc + 1;
		}
	},

	Wheel: {

		compile: (compiler) => {
			compiler.compileVariable(`wof`, `wheel`, false, `dom`);
			return true;
		},

		run: (program) => {
			return program[program.pc].pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `draw`:
			return EasyCoder_WOF.Draw;
		case `spin`:
			return EasyCoder_WOF.Spin;
		case `wheel`:
			return EasyCoder_WOF.Wheel;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_WOF.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'wof' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.tokenIs(`anagrams`)) {
				if (compiler.nextTokenIs(`of`)) {
					const value = compiler.getNextValue();
					return {
						domain: `anagrams`,
						type: `getAnagrams`,
						value
					};
				}
			}
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `getAnagrams`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(AnagramFinder.getAnagrams(program.getValue(value.value), EasyCoder_words))
				};
			}
			return null;
		}
	},

	condition: {

		compile: () => {}
	},		
};

// A sample roulette wheel
const EasyCoder_roulette_wheel = {
    
	init: ($) => {
		$.options = [`$100`, `$10`, `$25`, `$250`, `$30`, `$1000`, `$1`, `$200`, `$45`, `$500`, `$5`, `$20`, `Lose`, `$1000000`, `Lose`, `$350`, `$5`, `$99`];
		$.startAngle = 0;
		$.arc = Math.PI / ($.options.length / 2);
		$.spinTimeout = null;
		$.spinArcStart = 10;
		$.spinTime = 0;
		$.spinTimeTotal = 0;
		$.ctx = null;
	},

	byte2Hex: (n) => {
		var nybHexString = `0123456789ABCDEF`;
		return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
	},

	RGB2Color: ($,r,g,b) => {
		return `#` + $.byte2Hex(r) + $.byte2Hex(g) + $.byte2Hex(b);
	},

	getColor: ($, item, maxitem) => {
		var phase = 0;
		var center = 128;
		var width = 127;
		var frequency = Math.PI*2/maxitem;
			
		var red   = Math.sin(frequency*item+2+phase) * width + center;
		var green = Math.sin(frequency*item+0+phase) * width + center;
		var blue  = Math.sin(frequency*item+4+phase) * width + center;
			
		return $.RGB2Color($,red,green,blue);
	},

	drawRouletteWheel: ($) => {
		const canvas = $.canvas;
		const width = canvas.width;
		const height = canvas.height;
		$.width = width;
		$.height = height;
		if (canvas.getContext) {
			var outsideRadius = 200*width/500;
			var textRadius = 160*width/500;
			var insideRadius = 125*width/500;

			$.ctx = canvas.getContext(`2d`);
			$.ctx.clearRect(0,0,width,height);

			$.ctx.strokeStyle = `black`;
			$.ctx.lineWidth = 2;

			$.ctx.font = `bold ${12*width/500}px Helvetica, Arial`;

			for(var i = 0; i < $.options.length; i++) {
				var angle = $.startAngle + i * $.arc;
				//ctx.fillStyle = colors[i];
				$.ctx.fillStyle = $.getColor($, i, $.options.length);

				$.ctx.beginPath();
				$.ctx.arc(width/2, height/2, outsideRadius, angle, angle + $.arc, false);
				$.ctx.arc(width/2, height/2, insideRadius, angle + $.arc, angle, true);
				$.ctx.stroke();
				$.ctx.fill();

				$.ctx.save();
				$.ctx.shadowOffsetX = -1;
				$.ctx.shadowOffsetY = -1;
				$.ctx.shadowBlur    = 0;
				$.ctx.shadowColor   = `rgb(220,220,220)`;
				$.ctx.fillStyle = `black`;
				$.ctx.translate(width/2 + Math.cos(angle + $.arc / 2) * textRadius, 
					height/2 + Math.sin(angle + $.arc / 2) * textRadius);
				$.ctx.rotate(angle + $.arc / 2 + Math.PI / 2);
				var text = $.options[i];
				$.ctx.fillText(text, -$.ctx.measureText(text).width / 2, 0);
				$.ctx.restore();
			} 

			//Arrow
			$.ctx.fillStyle = `black`;
			$.ctx.beginPath();
			$.ctx.moveTo(width/2 - 4, height/2 - (outsideRadius + 5));
			$.ctx.lineTo(width/2 + 4, height/2 - (outsideRadius + 5));
			$.ctx.lineTo(width/2 + 4, height/2 - (outsideRadius - 5));
			$.ctx.lineTo(width/2 + 9, height/2 - (outsideRadius - 5));
			$.ctx.lineTo(width/2 + 0, height/2 - (outsideRadius - 13));
			$.ctx.lineTo(width/2 - 9, height/2 - (outsideRadius - 5));
			$.ctx.lineTo(width/2 - 4, height/2 - (outsideRadius - 5));
			$.ctx.lineTo(width/2 - 4, height/2 - (outsideRadius + 5));
			$.ctx.fill();
		}
	},

	easeOut: (t, b, c, d) => {
		var ts = (t/=d)*t;
		var tc = ts*t;
		return b+c*(tc + -3*ts + 3*t);
	},

	stopRotateWheel: ($) => {
		clearTimeout($.spinTimeout);
		var degrees = $.startAngle * 180 / Math.PI + 90;
		var arcd = $.arc * 180 / Math.PI;
		var index = Math.floor((360 - degrees % 360) / arcd);
		$.ctx.save();
		$.ctx.font = `bold ${30*$.width/500}px Helvetica, Arial`;
		var text = $.options[index];
		$.ctx.fillText(text, $.width/2 - $.ctx.measureText(text).width / 2, $.height/2 + 10*$.height/500);
		$.ctx.restore();
	},

	rotateWheel: ($) => {
		$.spinTime += 30;
		if($.spinTime >= $.spinTimeTotal) {
			$.stopRotateWheel($);
			return;
		}
		var spinAngle = $.spinArcStart - $.easeOut($.spinTime, 0, $.spinArcStart, $.spinTimeTotal);
		$.startAngle += (spinAngle * Math.PI / 180);
		$.drawRouletteWheel($);
		$.spinTimeout = setTimeout(function(){ $.rotateWheel($); }, 30);
	},

	spin: ($) => {
		$.spinArcStart = Math.random() * 10 + 10;
		$.spinTime = 0;
		$.spinTimeTotal = Math.random() * 3 + 4 * 1000;
		$.rotateWheel($);
	}
};
