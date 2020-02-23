 # EasyCoder distribution file set
 
 Here are the files that will be used by EasyCoder applications. Not all will be needed for any given application but it's probably simplest to copy them all. The file `plugins,js` defines which plugins will be used by default (causing them to be loaded) so it should be edited if a different set is required.
 
 Most of these files, particularly those in the `plugin` folder, are simply copies of the source set at `js`. The two files `easycoder.js` and `easycoder-min.js` are built from those sources; the latter is a minimized version of the former.

 To use EasyCoder, put the entire `easycoder` folder onto your webserver (keeping the same name) and in your HTML page header call for `easycoder.js` or `easycoder-min.js` (the former is more useful for debugging). This will call in other files as it needs them.
