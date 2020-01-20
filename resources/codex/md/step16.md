# Using Google Maps #
One of the strengths of ~ec~ is the way it can be extended using plugins. These are JavaScript code modules that provide extra language features to users of the system. EasyCoder comes with a number of these, available on demand, so I'll demonstrate how to use one of the more interesting ones.

Google Maps are one of the most spectacular features to be found on any website. They provide a vast range of features and require very little effort to include on the page. That said, it takes some effort to learn how to do it, and we've taken away that effort by building our own ~ec~ plugin to handle maps for you. Currently it's a little basic but we hope to add more features as time goes by. Click here to load the map script:

~copy~

The script builds a page using the full space available, then divides it into a ~code:Controls~ bar and the main map panel itself. The ~code:Controls~ bar only has a title but there's space to put whatever buttons you might need to control the operation of your map.

In the variable list you'll see ~code:gmap Map~. This is part of the new functionality available with the plugin loaded, as are the commands later that make reference to the ~code:Map~.

The map itself requires a div to place it in, then you can create the map using a very small set of commands. The first thing to add to the map is an 'API key' provided by Google to authorize the use of a map on this website. You can get your own API key by registering as a Google developer and requesting your key on the appropriate page. (Unfortunately it's beyond the scope of these notes to describe how to do it.) This particular key is one that restricts usage to pages on a limited range of websites, of which this is one. (The ~code:reverse~ part is to prevent GitHub detecting that an API key has been given, causing it to issue security warnings.)

There are only 3 items of information needed to set up a map; ~code:latitude~, ~code:longitude~ and ~code:zoom~. Experiment with each of these to discover how they work; try to get a map displaying your own home.

~next:Pick, Drag and Drop~
