EasyCoder.version = `2.6.1`;
EasyCoder.timestamp = Date.now();

function EasyCoder_Startup() {
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
};

// For browsers
window.onload = EasyCoder_Startup;
