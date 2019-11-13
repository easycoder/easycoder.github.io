window.onload = function () {
	const script = document.getElementById(`script`);
	ScriptRunner.start(script.innerText);
};

const ScriptRunner = {

	start: function (script) {
		ScriptRunner.run(JSON.parse(script));
	},

	run: function(script, pc = 0) {
		script.pc = pc;
		while (script.pc < script.length) {
			const keyword = script[script.pc].keyword;
			switch (keyword) {
			case `alert`:
			case `attach`:
			case `create`:
				const handler = `do${keyword.charAt(0).toUpperCase()}${keyword.substr(1)}`;
				ScriptRunner[handler](script);
				break;
			case `stop`:
				script.pc = 0;
				break;
			default:
				script.pc++;
			}
			if (script.pc === 0) break;
		}
	},

	doAlert: function (script) {
		const command = script[script.pc];
		alert(command.message);
		script.pc++;
	},

	doAttach: function (script) {
		const command = script[script.pc];
		command.element = document.getElementById(command.id);
		script.pc++;
	},

	doCreate: function (script) {
		const command = script[script.pc];
		command.element = document.createElement(command.type);
		switch (command.type) {
		case `a`:
			command.element.setAttribute(`href`, `#`);
			command.element.innerHTML = command.text;
			command.element.onclick = function () {
				for (let n = 0; n < script.length; n++) {
					if (script[n].label === command.onClick) {
						ScriptRunner.run(script, n);
						break;
					}
				}
			};
			break;
		}
		for (let n = 0; n < script.length; n++) {
			if (script[n].name === command.parent) {
				const parent = script[n].element;
				parent.appendChild(command.element);
				script.pc++;
				return;
			}
		}
		script.pc = 0;
	}
};