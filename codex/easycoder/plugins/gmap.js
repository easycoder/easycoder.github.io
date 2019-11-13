
const EasyCoder_GMap = {

	Create: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const type = symbolRecord.keyword;
				switch (type) {
				case `gmap`:
					if (compiler.nextTokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							if (parentRecord.keyword === `div`) {
								compiler.next();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `create`,
									type,
									lino,
									name: symbolRecord.name,
									parent: parentRecord.name
								});
								return true;
							}
						}
					}
					return false;
				case `marker`:
					if (compiler.nextTokenIs(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							if (parentRecord.keyword === `gmap`) {
								compiler.next();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `create`,
									type,
									lino,
									name: symbolRecord.name,
									map: parentRecord.name
								});
								return true;
							}
						}
					}
					return false;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			switch (command.type) {
			case `gmap`:
				symbolRecord.parent = program.getSymbolRecord(command.parent);
				symbolRecord.markers = [];
				break;
			case `marker`:
				const mapRecord = program.getSymbolRecord(command.map);
				const element = new google.maps.Marker({
					map: mapRecord.map
				});
				symbolRecord.element[symbolRecord.index] = element;
				mapRecord.markers.push(element);
				element.addListener(`click`, function () {
					program.run(symbolRecord.onClick);
				});
				break;
			}
			return command.pc + 1;
		}
	},

	GMap: {

		compile: compiler => {
			compiler.compileVariable(`gmap`, `gmap`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	On: {

		compile: compiler => {
			const lino = compiler.getLino();
			const action = compiler.nextToken();
			if ([`click`, `move`, `type`, `zoom`].includes(action)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.keyword === `gmap` || (symbolRecord.keyword === `marker` && action === `click`)) {
						compiler.next();
						compiler.addCommand({
							domain: `gmap`,
							keyword: `on`,
							lino,
							action,
							name: symbolRecord.name
						});
						return compiler.completeHandler();
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			switch (command.action) {
			case `click`:
				if (symbolRecord.keyword === `marker`) {
					symbolRecord.element.forEach(function (marker, index) {
						marker.targetRecord = symbolRecord;
						marker.targetIndex = index;
						marker.targetPc = command.pc + 2;
						marker.addListener(`click`, function () {
							if (program.length > 0) {
								marker.targetRecord.index = marker.targetIndex;
								setTimeout(function () {
									EasyCoder.timestamp = Date.now();
									program.run(marker.targetPc);
								}, 1);
							}
							return false;
						});
					});
				} else {
					symbolRecord.onClick = command.pc + 2;
				}
				break;
			case `move`:
				symbolRecord.onMove = command.pc + 2;
				break;
			case `type`:
				symbolRecord.onType = command.pc + 2;
				break;
			case `zoom`:
				symbolRecord.onZoom = command.pc + 2;
				break;
			default:
				program.runtimeError(command.lino, `Unknown action '${command.action}'`);
				return 0;
			}
			return command.pc + 1;
		}
	},

	Marker: {

		compile: compiler => {
			compiler.compileVariable(`gmap`, `marker`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Remove: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextTokenIs(`markers`)) {
				if (compiler.nextTokenIs(`from`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `gmap`) {
							compiler.next();
							compiler.addCommand({
								domain: `gmap`,
								keyword: `remove`,
								lino,
								name: symbolRecord.name
							});
							return true;
						}
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const mapRecord = program.getSymbolRecord(command.name);
			for (const marker of mapRecord.markers) {
				marker.setMap(null);
			}
			mapRecord.markers = [];
			return command.pc + 1;
		}
	},

	Set: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.skip(`the`);
			const attribute = compiler.getToken();
			if ([`key`, `latitude`, `longitude`, `type`, `zoom`].includes(attribute)) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `gmap`) {
							if (compiler.nextTokenIs(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `set`,
									lino,
									name: symbolRecord.name,
									attribute,
									value
								});
								return true;
							}
						}
					}
				}
			} else if ([`label`, `title`, `position`, `color`].includes(attribute)) {
				if (compiler.nextTokenIs(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `marker`) {
							if (compiler.nextTokenIs(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `set`,
									lino,
									name: symbolRecord.name,
									attribute,
									value
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
			function pinSymbol(color) {
				return {
					path: `M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z`,
					fillColor: color,
					fillOpacity: 1,
					strokeColor: `#000`,
					strokeWeight: 2,
					scale: 1,
					labelOrigin: new google.maps.Point(0, -28)
				};
			}
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			if ([`key`, `latitude`, `longitude`, `type`, `zoom`].includes(command.attribute)) {
				symbolRecord[command.attribute] = program.getValue(command.value);
			} else if (command.attribute === `label`) {
				symbolRecord.label = program.getValue(command.value);
				const marker = symbolRecord.element[symbolRecord.index];
				marker.setLabel(symbolRecord.label);
			} else if (command.attribute === `title`) {
				symbolRecord.title = program.getValue(command.value);
				const marker = symbolRecord.element[symbolRecord.index];
				marker.setTitle(symbolRecord.title);
			} else if (command.attribute === `color`) {
				symbolRecord.color = program.getValue(command.value);
				const marker = symbolRecord.element[symbolRecord.index];
				marker.setIcon(pinSymbol(symbolRecord.color));
			} else if (command.attribute === `position`) {
				const value = JSON.parse(program.getValue(command.value));
				symbolRecord.latitude = value.latitude;
				symbolRecord.longitude = value.longitude;
				const lat = parseFloat(value.latitude);
				const lng = parseFloat(value.longitude);
				symbolRecord.element[symbolRecord.index].setPosition(new google.maps.LatLng(lat, lng));
			}
			return command.pc + 1;
		}
	},

	Show: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const type = symbolRecord.keyword;
				if (type === `gmap`) {
					compiler.next();
					compiler.addCommand({
						domain: `gmap`,
						keyword: `show`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const mapRecord = program.getSymbolRecord(command.name);
			if (mapRecord.keyword !== `gmap`) {
				return 0;
			}
			const parentElement = mapRecord.parent.element[mapRecord.parent.index];
			if (typeof EasyCoder_GMap.loaded === `undefined`) {
				const script = document.createElement(`script`);
				script.src = `https://maps.googleapis.com/maps/api/js?key=${mapRecord.key}`;
				script.async = true;
				script.defer = true;
				script.onload = function () {
					EasyCoder_GMap.setupMap(parentElement, mapRecord, program);
					program.run(command.pc + 1);
					EasyCoder_GMap.loaded = true;
				};
				parentElement.insertBefore(script, null);
				return 0;
			}
			EasyCoder_GMap.setupMap(parentElement, mapRecord, program);
			return command.pc + 1;
		}
	},

	setupMap: (parentElement, mapRecord, program) => {
		const lat = parseFloat(mapRecord.latitude);
		const lng = parseFloat(mapRecord.longitude);
		const zoom = parseFloat(mapRecord.zoom);
		mapRecord.map = new google.maps.Map(parentElement, {
			center: {
				lat,
				lng
			},
			zoom,
			gestureHandling: `greedy`
		});
		mapRecord.map.markers = [];
		if (mapRecord.type === `hybrid`) {
			mapRecord.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
		}
		mapRecord.map.addListener(`center_changed`, function () {
			program.run(mapRecord.onMove);
		});
		mapRecord.map.addListener(`zoom_changed`, function () {
			program.run(mapRecord.onZoom);
		});
		mapRecord.map.addListener(`maptypeid_changed`, function () {
			program.run(mapRecord.onType);
		});
		mapRecord.map.addListener(`click`, function (event) {
			mapRecord.clickPosition = {
				latitude: event.latLng.lat().toString(),
				longitude: event.latLng.lng().toString()
			};
			program.run(mapRecord.onClick);
		});
	},

	Update: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `gmap`) {
					compiler.next();
					compiler.addCommand({
						domain: `gmap`,
						keyword: `update`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const mapRecord = program.getSymbolRecord(command.name);
			mapRecord.map.setCenter(new google.maps.LatLng(mapRecord.latitude, mapRecord.longitude));
			mapRecord.map.setZoom(parseFloat(mapRecord.zoom));
			return command.pc + 1;
		}
	},

	getHandler: name => {
		switch (name) {
		case `create`:
			return EasyCoder_GMap.Create;
		case `gmap`:
			return EasyCoder_GMap.GMap;
		case `marker`:
			return EasyCoder_GMap.Marker;
		case `on`:
			return EasyCoder_GMap.On;
		case `remove`:
			return EasyCoder_GMap.Remove;
		case `set`:
			return EasyCoder_GMap.Set;
		case `show`:
			return EasyCoder_GMap.Show;
		case `update`:
			return EasyCoder_GMap.Update;
		default:
			return false;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = EasyCoder_GMap.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'gmap' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: compiler => {
			if (compiler.tokenIs(`the`)) {
				compiler.next();
			}
			const type = compiler.getToken();
			if (type === `click`) {
				if (compiler.nextTokenIs(`position`)) {
					if (compiler.nextTokenIs(`of`)) {
						if (compiler.nextIsSymbol()) {
							const mapRecord = compiler.getSymbolRecord();
							if (mapRecord.keyword === `gmap`) {
								compiler.next();
								return {
									domain: `gmap`,
									type,
									name: mapRecord.name
								};
							}
						}
					}
				}
			}
			if (compiler.nextTokenIs(`of`)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.keyword === `gmap` && [`latitude`, `longitude`, `type`, `zoom`, `bounds`].includes(type) ||
            symbolRecord.keyword === `marker` && [`latitude`, `longitude`, `title`].includes(type)) {
						compiler.next();
						return {
							domain: `gmap`,
							type,
							name: symbolRecord.name
						};
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			var symbolRecord;
			switch (value.type) {
			case `latitude`:
				symbolRecord = program.getSymbolRecord(value.name);
				switch (symbolRecord.keyword) {
				case `gmap`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).map.getCenter().lat().toString()
					};
				case `marker`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).marker.getPosition().lat().toString()
					};
				}
				break;
			case `longitude`:
				symbolRecord = program.getSymbolRecord(value.name);
				switch (symbolRecord.keyword) {
				case `gmap`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).map.getCenter().lng().toString()
					};
				case `marker`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).marker.getPosition().lng().toString()
					};
				}
				break;
			case `type`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.name).map.getMapTypeId()
				};
			case `zoom`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.name).map.getZoom().toString()
				};
			case `bounds`:
				const map = program.getSymbolRecord(value.name).map;
				const bounds = map ? JSON.stringify(map.getBounds()) : ``;
				return {
					type: `constant`,
					numeric: false,
					content: bounds
				};
			case `title`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.name).marker.getTitle()
				};
			case `click`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(program.getSymbolRecord(value.name).clickPosition)
				};
			}
			return null;
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};
