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

    setPluginCount(5);  // *** IMPORTANT *** the number of plugins you will be adding
    
    getPlugin('browser',
      `/easycoder/plugins/browser.js`,
      function() {
        addPlugin('browser', EasyCoder_Browser);
      });
    
    getPlugin('json',
      `/easycoder/plugins/json.js`,
      function() {
        addPlugin('json', EasyCoder_Json);
      });
    
    getPlugin('rest',
      `/easycoder/plugins/rest.js`,
      function() {
        addPlugin('rest', EasyCoder_Rest);
      });
    
    getPlugin('svg',
      `/easycoder/plugins/svg.js`,
      function() {
        addPlugin('svg', EasyCoder_SVG);
      });
    
    getPlugin('ckeditor',
      `/easycoder/plugins/ckeditor.js`,
      function() {
        addPlugin('ckeditor', EasyCoder_CKEditor);
      });
    
  },
  
  getLocalPlugin: (path, name, getPlugin, addPlugin, callback) => {
    
    /*
     * This lets you add a plugin before launching a script, using the 'plugin' command.
     * You must provide a case for every plugin you will be adding;
     * use 'ckeditor' as the pattern to follow.
     */
    
    switch (name) {
      case 'codemirror':
        getPlugin(name,
          `/easycoder/plugins/codemirror.js`,
          function() {
            addPlugin(name, EasyCoder_CodeMirror, callback);
          });
        break;
      case 'showdown':
        getPlugin(name,
          `/easycoder/plugins/showdown.js`,
          function() {
            addPlugin(name, EasyCoder_Showdown, callback);
          });
        break;
      case 'ui':
        getPlugin(name,
          `/easycoder/plugins/ui.js`,
          function() {
            addPlugin(name, EasyCoder_UI, callback);
          });
        break;
      case 'anagrams':
        getPlugin(name,
          `/easycoder/plugins/anagrams.js`,
          function() {
            addPlugin(name, EasyCoder_Anagrams, callback);
          });
        break;
      case 'gmap':
        getPlugin(name,
          `/easycoder/plugins/gmap.js`,
          function() {
            addPlugin(name, EasyCoder_GMap, callback);
          });
        break;
      case 'wof':
        getPlugin(name,
          `/easycoder/plugins/wof.js`,
          function() {
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
