EasyCoder.version = `240713`;
EasyCoder.timestamp = Date.now();
console.log(`EasyCoder loaded; waiting for page`);

function EasyCoder_Startup() {
	console.log(`${Date.now() - EasyCoder.timestamp} ms: Start EasyCoder`);
	EasyCoder.timestamp = Date.now();
	EasyCoder.scripts = {};
	window.EasyCoder = EasyCoder;
	const script = document.getElementById(`easycoder-script`);
	if (script) {
		script.style.display = `none`;
		try {
			EasyCoder.start(script.innerText);
		}
		catch (err) {
			EasyCoder.reportError(err);
		}
	}
}

// For browsers
window.onload = EasyCoder_Startup;
