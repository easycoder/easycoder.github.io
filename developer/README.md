# EasyCoder Developer's Manual

**_EasyCoder_** is a high-level scripting language for web browsers. It is designed to enable the construction of interactive websites and web applications of any size without the need to learn any JavaScript or its associated frameworks. It can be used successfully for just about anything except projects that require high-speed animation, such as platform games.

This does not imply that **_EasyCoder_** is complete in all respects and able to tackle any job without any help. The core of the language, as supplied here, can deal with most common needs but there are always special cases that go beyond what was envisaged by its creators. So we built in a plugin mechanism that allows you to add extensions to the language that then provide seamless additions to its vocabulary and syntax. Whenever it become clumsy - or impossible - to express something using the system as provided, a plugin will usually deal with the problem in a more efficient way.

The raw performance of **_EasyCoder_**  code is admittedly well below what can be achieved in JavaScript alone. However, the power of JavaScript is now so great that it permits considerable coding inefficiency while still delivering good results. The trade-off here is between performance on the one hand and ease of construction allied to ease of maintenance on the other. In the case of most websites the latter is by far the more important.

This manual describes how **_EasyCoder_** works and how to add plugin extensions to it.

The system comprises a number of JavaScript files; one core script and several plugin modules in their own directory. The core script is specified in the HEAD of the page; it's called either _easycoder.js_ or _easycoder-min.js_ depending if you need to debug your scripts at that level.

## The Build Process 

**_EasyCoder_** is a relatively simple project so its build needs are also simple, requiring only a shell script (supplied here as `build`) which catenates together all the files in the `js/easycoder` directory then minifies the result using Google's `closure`. The result is written to the `dist` folder. The build script also adds a few server files.

## From the top 

The script _EasyCoder.js_ is where things start. When it loads it initializes a timestamp variable and waits for the page to finish its initial load. On receipt of the _window.onload()_ signal it logs the elapsed time and resets the timestamp, which is used to report progress as the page loads to help the developer optimise things and achieve a good load time.

Next it looks for a DOM element with the id _easycoder-script_, which identifies the main script. You can use any container but a _PRE_ or a _DIV_ are recommended. The contents of this element are passed to the _start()_ function in _Main.js_.

## Main.js 

Much of the functionality of **_EasyCoder_** is in plugins, not all of which are required by every page. There is a core set comprising `Core.js`, `Browser.js`, `Json.js` and `Rest.js`, all of which are included in `easycoder.js` by the build script.

Other plugins are kept in the `plugins` folder. These are all in a standard format and when loaded each one adds itself to a list kept in the main **_EasyCoder_** module. See the `require` language command.

## tokenize(), tokeniseAndCompile() and tokenizeFile() 

These 3 functions work together to convert the incoming script file into a list of tokens for the compiler to process. They also create a list of script lines, which is used for debugging and for error reporting. The list of tokens has all comments removed (to save space) and each token is an object with the source line number and the text of the token. Tokens are delimited by white space but string values are single tokens that may include spaces, so the tokenizer has to go through the script looking for the backticks that bracket strings. Note that the compiler pretty well ignores line breaks so a command can be on one line or may span several, but neither a string nor a comment can extend from one line to another.

So now we have a list of source lines, a list of tokens and a list of plugins. It's time to start the compiler.

## compileScript() 

This function injects some properties into the _EasyCoder_Compiler_ script then calls the _compile()_ function in that script. If compilation succeeds it gets back a _program_ object. It then sets a rather longer list of properties into that object before returning it to the tokenizer, which passes it to _EasyCoder_Run_ for execution.

Next: [The EasyCoder Compiler](Compiler.md)

[The Keyword Compilers](Core.md)

[The Runtime Engine](Runtime.md)

[The ReST Server](REST.md)