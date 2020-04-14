 # EasyCoder distribution file set
 
 Here are the files that can be used to create standalone EasyCoder applications. Not all will be needed for any given application but it's probably simplest to copy them all. The main `easycoder.js` contains everything that will be needed for a wide range of applications. Extra functionality is supplied by the files in the `plugins` folder. These will be requested where they are needed, using the `require` keyword.
 
 The files in the `plugin` folder are simply copies of the source set at `js`. The two files `easycoder.js` and `easycoder-min.js` are built from their sources; the latter is a minimized version of the former.

 To use EasyCoder, put the entire `easycoder` folder onto your webserver (giving it any suitable name) and in your HTML page header call for `easycoder.js` or `easycoder-min.js` (the former is more useful for debugging). This will call in other files as it needs them.
