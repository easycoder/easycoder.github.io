// eslint-disable-next-line no-unused-vars
const EasyCoder_Plugins = {

	getGlobalPlugins: (timestamp, path, setPluginCount, getPlugin, addPlugin) => {

		console.log(`${Date.now() - timestamp} ms: Load plugins`);

		/*
		 * To include EasyCoder global plugins in your site, add them here.
		 * It adds the selected plugins to every page of your site that uses EasyCoder.
		 * You can also dynamically load plugins before launching a script; see getLocalPlugin() below.
		 * 
		 * setPluginCount() sets the number of plugins to add.
		 * getPlugin() loads a plugin from any URL.
		 * addPlugin() adds it to the EasyCoder system.
		 * When all the plugins have been added, EasyCoder starts up.
		 */

		setPluginCount(6); // *** IMPORTANT *** the number of plugins you will be adding

		getPlugin(`browser`,
			`/plugins/browser.js`,
			function () {
				addPlugin(`browser`, EasyCoder_Browser);
			});

		getPlugin(`json`,
			`/plugins/json.js`,
			function () {
				addPlugin(`json`, EasyCoder_Json);
			});

		getPlugin(`rest`,
			`/plugins/rest.js`,
			function () {
				addPlugin(`rest`, EasyCoder_Rest);
			});

		getPlugin(`svg`,
			`/plugins/svg.js`,
			function () {
				addPlugin(`svg`, EasyCoder_SVG);
			});

		getPlugin(`showdown`,
			`/plugins/showdown.js`,
			function () {
				addPlugin(`showdown`, EasyCoder_Showdown);
			});

		getPlugin(`vfx`,
			`/plugins/vfx.js`,
			function () {
				addPlugin(`vfx`, EasyCoder_VFX);
			});

	},

	getLocalPlugin: (path, name, getPlugin, addPlugin, callback) => {

		/*
		 * This lets you add a plugin before launching a script, using the 'plugin' command.
		 * You must provide a case for every plugin you will be adding;
		 * use any one of them as the pattern to follow.
		 */

		switch (name) {
		case `codemirror`:
			getPlugin(name,
				`/plugins/codemirror.js`,
				function () {
					addPlugin(name, EasyCoder_CodeMirror, callback);
				});
			break;
		case `ckeditor`:
			getPlugin(name,
				`/plugins/ckeditor.js`,
				function () {
					addPlugin(name, EasyCoder_CKEditor, callback);
				});
			break;
		case `ui`:
			getPlugin(name,
				`/plugins/ui.js`,
				function () {
					addPlugin(name, EasyCoder_UI, callback);
				});
			break;
		case `anagrams`:
			getPlugin(name,
				`/plugins/anagrams.js`,
				function () {
					addPlugin(name, EasyCoder_Anagrams, callback);
				});
			break;
		case `gmap`:
			getPlugin(name,
				`/plugins/gmap.js`,
				function () {
					addPlugin(name, EasyCoder_GMap, callback);
				});
			break;
		case `wof`:
			getPlugin(name,
				`/plugins/wof.js`,
				function () {
					addPlugin(name, EasyCoder_WOF, callback);
				});
			break;
		default:
			console.log(`Plugin '${name}' not found.`);
			break;
		}
	},

	rest: () => {
		return `rest.php`;
	}
};
