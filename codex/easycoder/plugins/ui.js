const EasyCoder_UI = {

	monthNames: [
		`January`,
		`February`,
		`March`,
		`April`,
		`May`,
		`June`,
		`July`,
		`August`,
		`September`,
		`October`,
		`November`,
		`December`
	],

	renderDate: (dateRecord) => {
		const date = new Date(dateRecord.timestamp);
		const day = date.getDate();
		const month = date.getMonth();
		const year = date.getFullYear();

		const daysInMonth = [
			31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
		];

		if (year % 4 === 0) {
			daysInMonth[1] = 29;
		}

		// Do the day list
		const dayList = dateRecord.day;
		while (dayList.firstChild) {
			dayList.removeChild(dayList.lastChild);
		}
		for (var i = 0; i < daysInMonth[month]; i++) {
			const option = new Option(String(i));
			option.value = i;
			option.text = String(i + 1);
			dayList.appendChild(option);
		}
		dayList.selectedIndex = day - 1;

		// Do the month list
		const monthList = dateRecord.month;
		while (monthList.firstChild) {
			monthList.removeChild(monthList.lastChild);
		}
		EasyCoder_UI.monthNames.forEach(function (month, index) {
			const option = document.createElement(`option`);
			option.value = index;
			option.text = month;
			monthList.appendChild(option);
		});
		monthList.selectedIndex = month;

		// Do the year list
		const yearList = dateRecord.year;
		while (yearList.firstChild) {
			yearList.removeChild(yearList.lastChild);
		}
		const yr = new Date().getUTCFullYear();
		var sel = 0;
		for (i = 0; i < 10; i++) {
			const option = document.createElement(`option`);
			var y = yr - i + 1;
			option.value = y;
			option.text = String(y);
			if (y === year) {
				sel = i;
			}
			yearList.appendChild(option);
		}
		yearList.selectedIndex = sel;
	},

	Create: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const type = symbolRecord.keyword;
				if (type === `date`) {
					if (compiler.nextTokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const holderRecord = compiler.getSymbolRecord();
							compiler.next();
							var second = compiler.constant(-1, true);
							var minute = compiler.constant(-1, true);
							var hour = compiler.constant(-1, true);
							var day = compiler.constant(-1, true);
							var month = compiler.constant(-1, true);
							var year = compiler.constant(-1, true);
							while (true) {
								const token = compiler.getToken();
								if (token === `second`) {
									second = compiler.getNextValue();
								} else if (token === `minute`) {
									minute = compiler.getNextValue();
								} else if (token === `hour`) {
									hour = compiler.getNextValue();
								} else if (token === `day`) {
									day = compiler.getNextValue();
								} else if (token === `month`) {
									month = compiler.getNextValue();
								} else if (token === `year`) {
									year = compiler.getNextValue();
								} else {
									break;
								}
							}
							compiler.addCommand({
								domain: `ui`,
								keyword: `create`,
								lino,
								type,
								date: symbolRecord.name,
								holder: holderRecord.name,
								day,
								month,
								year,
								hour,
								minute,
								second,
								format: `date`
							});
							return true;
						}
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			switch (command.type) {
			case `date`:
				const dateRecord = program.getSymbolRecord(command.date);
				const dayList = document.createElement(`select`);
				dayList.id = `ec-day`;
				dateRecord.day = dayList;
				const monthList = document.createElement(`select`);
				dayList.id = `ec-month`;
				dateRecord.month = monthList;
				const yearList = document.createElement(`select`);
				dayList.id = `ec-year`;
				dateRecord.year = yearList;

				const holderRecord = program.getSymbolRecord(command.holder);
				const holder = holderRecord.element[holderRecord.index];
				while (holder.firstChild) {
					holder.removeChild(holder.lastChild);
				}
				holder.appendChild(dayList);
				holder.appendChild(monthList);
				holder.appendChild(yearList);

				// Get the requested values
				var day = program.getValue(command.day);
				var month = program.getValue(command.month);
				var year = program.getValue(command.year);
				const date = new Date();
				if (day !== -1) {
					date.setDate(day);
				}
				if (month !== -1) {
					date.setMonth(month);
				}
				if (year !== -1) {
					date.setYear(year);
				}
				dateRecord.timestamp = date.getTime();
				EasyCoder_UI.renderDate(dateRecord);

				dayList.dateRecord = dateRecord;
				monthList.dateRecord = dateRecord;
				yearList.dateRecord = dateRecord;

				dayList.onchange = function () {
					const date = new Date(this.dateRecord.timestamp);
					date.setDate(this.selectedIndex + 1);
					this.dateRecord.timestamp = date.getTime();
					EasyCoder_UI.renderDate(this.dateRecord);
				};

				monthList.onchange = function () {
					const date = new Date(this.dateRecord.timestamp);
					date.setMonth(this.selectedIndex);
					this.dateRecord.timestamp = date.getTime();
					EasyCoder_UI.renderDate(this.dateRecord);
				};

				yearList.onchange = function () {
					const date = new Date(this.dateRecord.timestamp);
					date.setYear(this[this.selectedIndex].value);
					this.dateRecord.timestamp = date.getTime();
					EasyCoder_UI.renderDate(this.dateRecord);
				};
				break;
			}

			return command.pc + 1;
		}
	},

	Date: {

		compile: (compiler) => {
			compiler.compileVariable(`ui`, `date`);
			return true;
		},

		run: (program) => {
			const command = program[program.pc];
			command.value = {
				type: `constant`,
				numeric: true,
				content: Date.now()
			};
			return command.pc + 1;
		}
	},

	Set: {

		compile: (compiler) => {
			const lino = compiler.getLino();
			compiler.skip(`the`);
			const token = compiler.getToken();
			switch (token) {
			case `date`:
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const dateRecord = compiler.getSymbolRecord();
						if (dateRecord.keyword === `date`) {
							if (compiler.nextTokenIs(`to`)) {
								const timestamp = compiler.getNextValue();
								compiler.addCommand({
									domain: `ui`,
									keyword: `set`,
									lino,
									what: `date`,
									date: dateRecord.name,
									timestamp
								});
								return true;
							}
						}
					}
				}
				break;
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			switch (command.what) {
			case `date`:
				const dateRecord = program.getSymbolRecord(command.date);
				dateRecord.timestamp = program.getValue(command.timestamp) * 1000;
				EasyCoder_UI.renderDate(dateRecord);
				break;
			}
			return command.pc + 1;
		}
	},

	getHandler: (name) => {
		switch (name) {
		case `create`:
			return EasyCoder_UI.Create;
		case `date`:
			return EasyCoder_UI.Date;
		case `set`:
			return EasyCoder_UI.Set;
		default:
			return false;
		}
	},

	run: (program) => {
		const command = program[program.pc];
		const handler = EasyCoder_UI.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'ui' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: (compiler) => {
			if (compiler.isSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `date`) {
					compiler.next();
					return {
						domain: `ui`,
						type: `date`,
						what: `timestamp`,
						value: symbolRecord.name
					};
				}
				return null;
			}
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			const what = compiler.getToken();
			if ([`date`, `timestamp`].includes(what)) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `date`) {
							compiler.next();
							return {
								domain: `ui`,
								type: `date`,
								what,
								value: symbolRecord.name
							};
						}
						return null;
					}
				}
				return null;
			}
			// Try other value possibilities
			return null;
		},

		get: (program, value) => {
			switch (value.type) {
			case `date`:
				const dateRecord = program.getSymbolRecord(value.value);
				const day = dateRecord.day.options[dateRecord.day.selectedIndex].text;
				const month = dateRecord.month.options[dateRecord.month.selectedIndex].value;
				const year = dateRecord.year.options[dateRecord.year.selectedIndex].value;
				const date = new Date(year, month, day, 0, 0, 0, 0);
				switch (value.what) {
				case `date`:
					return {
						type: `constant`,
						numeric: false,
						content: `${day} ${EasyCoder_UI.monthNames[month]} ${year}`
					};
				case `timestamp`:
					return {
						type: `constant`,
						numeric: true,
						content: date.getTime() / 1000
					};
				}
			}
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};