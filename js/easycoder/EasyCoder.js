EasyCoder.version = `250824`;
EasyCoder.timestamp = Date.now();
EasyCoder.writeStartupTrace(`EasyCoder loaded; waiting for page`);

function EasyCoder_Startup() {
	EasyCoder.writeStartupTrace(`window.onload fired`);
	EasyCoder.writeStartupTrace(`${Date.now() - EasyCoder.timestamp} ms: Start EasyCoder`);
	EasyCoder.timestamp = Date.now();
	EasyCoder.scripts = {};
	window.EasyCoder = EasyCoder;
	const script = document.getElementById(`easycoder-script`);
	if (script) {
		EasyCoder.writeStartupTrace(`Found #easycoder-script (${script.innerText.split(`\n`).length} lines)`);
		script.style.display = `none`;
		try {
			EasyCoder.writeStartupTrace(`Calling EasyCoder.start`);
			EasyCoder.start(script.innerText);
			EasyCoder.writeStartupTrace(`EasyCoder.start returned`);
		}
		catch (err) {
			EasyCoder.reportError(err);
		}
	} else {
		EasyCoder.writeStartupTrace(`No #easycoder-script element found`);
	}
}

// For browsers
window.onload = EasyCoder_Startup;
