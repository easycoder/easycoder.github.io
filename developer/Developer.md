# EasyCoder Developer's Manual #

**_EasyCoder_** is a high-level scripting language for web browsers. It is designed to enable the construction of interactive websites and web applications of any size without the need to learn any JavaScript or its associated frameworks. It can be used successfully for just about anything except projects that require high-speed animation, such as platform games.

This does not imply that **_EasyCoder_** is complete in all respects and able to tackle any job without any help. The core of the language, as supplied here, can deal with most common needs but there are always special cases that go beyond what was envisaged by its creators. So we built in a plugin mechanism that allows you to add extensions to the language that then provide seamless additions to its vocabulary and syntax. Whenever it become clumsy - or impossible - to express something using the system as provided, a plugin will usually deal with the problem in a more efficient way.

The raw performance of **_EasyCoder_**  code is admittedly well below what can be achieved in JavaScript alone. However, the power of JavaScript is now so great that it permits considerable coding inefficiency while still delivering good results. The trade-off here is between performance on the one hand and ease of construction allied to ease of maintenance on the other. In the case of most websites the latter is by far the more important.

This manual describes how **_EasyCoder_** works and how to add plugin extensions to it.

**_EasyCoder_** was built as a WordPress plugin, in which environment a PHP file (_easycoder.php_) performs various duties to ensure the environment is set up for **_EasyCoder_** itself. However, **_EasyCoder_** is not dependant upon WordPress and can be used just as easily outside that environment. The only difference is the programmer must attend to the setup details when installing **_EasyCoder_** but this is not an onerous task and I'll mention the relevant issues as I come to them.

The system comprises a number of JavaScript files; one core script and several plugin modules in their own directory. The core script is specified in the HEAD of the page; it's called either _easycoder.js_ or _easycoder-min.js_ depending if you need to debug your scripts at that level. These files aren't to be found in the GitHub repository as they're constructed by the build process, so here are a few words about that.

## The Build Process ##

**_EasyCoder_** is a relatively simple project so its build needs are also fairly simple, requiring only a shell script. The Bash script _build_ shows how it's done on one particular Linux setup, where the project is kept in a DropBox folder and the final file set is sent to a top-level folder called _EasyCoder_. Most other developers would need to make appropriate alterations to the file paths.

The tools required for the build are the 2 Node modules _babel_ and _browserify_, plus Google's _closure_, which minifies the core script.

## From the top ##

The script _EasyCoder.js_ is where things start. When it loads it initializes a timestamp variable and waits for the page to finish its initial load. On receipt of the _window.onload()_ signal it logs the elapsed time and resets the timestamp, which is used to report progress as the page loads to help the developer optimise things and achieve a good load time.

Next it looks for a DOM element with the id _easycoder-script_, which identifies the main script. You can use any container but a _PRE_ or a _DIV_ are recommended. The contents of this element are passed to the _start()_ function in _Main.js_.

## Main.js ##

Much of the functionality of **_EasyCoder_** is in plugins, not all of which are required by every page. To avoid loading code that won't be needed we have a small script, _plugins.js_,located in a folder called _easycoder_ at the top level of the site installation, that defines which plugins should be loaded up front for this website. In a WordPress environment this file will be created when the **_EasyCoder_** plugin is installed, but for other systems the developer must do this when installing **_EasyCoder_**. There's a sample file, _plugins-sample.js_ in the **_EasyCoder_** directory that you can use either "as is" or suitably modified.

_plugins.js_ also defines plugins that should be made available for scripts to load on demand. These can be local files or can be external URLs. In the latter case you will almost certainly have to deal with CORS issues that prevent browsers from loading potentially harmful files.

_loadPluginsJS()_ attempts to load _plugins.js_. This will usually succeed except for special cases where your site code is not at the level of the site root. If the load fails the script backs up one level and tries again.

When the load succeeds, the script calls _getGlobalPlugins()_, handing it the number of plugins required and a list of those plugins. Each of these is requested in turn, and when all have been loaded successfully a call is made to _tokenize()_ to process the script that was handed in at the start.

Whether you use WordPress or are building a site without it you may need to edit the contents of _plugins.js_ to include plugins that aren't listed by default. In WordPress this file is not affected by updates to either the theme or to the **_EasyCoder_** plugin.

## tokenize(), tokeniseAndCompile() and tokenizeFile() ##

These 3 functions work together to convert the incoming text file into a list of tokens for the compiler to process. They also create a list of script lines, which is used for debugging and for error reporting. The list of tokens has all comments removed (to save space) and each token is an object with the source line number and the text of the token. Tokens are delimited by white space but string values are single tokens that may include spaces, so the tokenizer has to go through the script looking for the backticks that bracket strings. Note that the compiler pretty well ignores line breaks so a command can be on one line or may span several, but neither a string nor a comment can extend from one line to another.

So now we have a list of source lines, a list of tokens and a list of plugins. It's time to start the compiler.

## compileScript() ##

This function injects some properties into the _EasyCoder_Compiler_ script then calls the _compile()_ function in that script. If compilation succeeds it gets back a _program_ object. It then sets a rather longer list of properties into that object before returning it to the tokenizer, which passes it to _EasyCoder_Run_ for execution.

Next: [The EasyCoder Compiler](Compiler.md)

[The Keyword Compilers](Core.md)

[The Runtime Engine](Runtime.md)

[The ReST Server](REST.md)