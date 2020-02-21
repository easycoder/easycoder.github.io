EasyCoder.version = `2.6.0`;
EasyCoder.timestamp = Date.now();

const app = {
	initialize: function() {
		document.addEventListener(`deviceready`, this.onDeviceReady.bind(this), false);
	},

	onDeviceReady: function() {
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
};

app.initialize();