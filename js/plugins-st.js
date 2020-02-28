// Plugins for StoryTeller

// eslint-disable-next-line no-unused-vars
const EasyCoder_Plugins = {

	// eslint-disable-next-line no-unused-vars
	getGlobalPlugins: (timestamp, path, setPluginCount, getPlugin, addPlugin) => {
		setPluginCount(9); // *** IMPORTANT *** the number of plugins you will be adding

		addPlugin(`browser`, EasyCoder_Browser);
		addPlugin(`json`, EasyCoder_Json);
		addPlugin(`rest`, EasyCoder_Rest);
		addPlugin(`gmap`, EasyCoder_GMap);
		addPlugin(`showdown`, EasyCoder_Showdown);
		addPlugin(`codemirror`, EasyCoder_CodeMirror);
		addPlugin(`svg`, EasyCoder_SVG);
		addPlugin(`ui`, EasyCoder_UI);
		addPlugin(`vfx`, EasyCoder_VFX);
	},
  
	rest: () => {
		return ``;
	}
};
