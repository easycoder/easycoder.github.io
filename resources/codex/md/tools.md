# EasyCoder Tools and Techniques #
To deploy an ~ec~ script you need to embed it in a web page. The basic mechanism is described in our **Install** page but a number of other topics need to be covered as well.

## Plugins ##
The standard ~ec~ language includes a wide range of general-purpose programming constructs needed by any language; variables, values, conditionals, strings, numbers and so on. Everything else is provided by plugins. Some of these, notably browser features, JSON and REST, are loaded automatically (though this behavior can be changed if necessary) and several more are available as optional plugins. Plugins add commands to the language and must be loaded before any script that makes use of those keywords will compile.

The mechanism for requesting a plugin is very simple. Suppose you want to include a Google Map in your web page. You will need the ~code:gmap~ plugin, which is loaded like this, where the ~ec~ files are all in a top-level `easycoder` folder:

~pre:require js `easycoder/plugins/gmap.js`~

In this example the plugin is a standard ~ec~ one but you can also load third-party plugins from any URL if you deal with CORS issues.

Once the plugin is loaded it is available to any script that needs it (but not the one that loaded it). Here, any script that includes map commands can be loaded and compiled, as in

~pre:rest get Script from `/resources/ecs/myscript.ecs`
run Script~

(This is the simplest form, that assumes you don't need to communicate with the script once it's running.)

It should be fairly obvious that when plugins are used in this way the code you want to run must be in a separate script that's loaded and run _after_ the plugin is ready. An alternative to this is to declare the plugin globally at the point ~ec~ starts up. In the top-level easycoder folder is a file called ~code:plugins.js~, which allows you to specify which plugins should be loaded at startup and which will be available to load on demand. This will make the initial page load a little more slowly, but in practice the difference is very small.
