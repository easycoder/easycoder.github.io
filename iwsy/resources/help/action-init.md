~page:contents:Contents~

# The `init` action

Every ~iwsy~ presentation starts with an `init` action, which defines the environment in which the presentation will run. The editor looks like this:

~img:https://easycoder.github.io/iwsy/resources/help/img/editor-init.png|100%~

Here there are a set of _properties_ relating to the `init` action. All these are editable. The Title is there for your convenience; it has no affect on the presentation. The properties are as follows:

 - `aspect` `ratio` is a pair of numbers that govern the size of the display area. The width is that of the container provided to IWSY by the web page. Sometimes the height will also be defined, in which case you should clear the `aspect` `ratio` field. In most cases, though, the height is not given. You can decide what it should be in relation to the width. The default is a 16:9 widescreen format but other common choices are 4:3 (old-style TV) and 1:1 (square). You can adjust these values to fill the screen exactly. Some experimentation may be needed, and once you've discovered a ratio that works for your computer you can use it in all presentations.
 
 - `background` is for the entire screen. By default it has no value, making it transparent. The values you use here are standard CSS background styles, which include using images.
 
 - `border` is also for the screen. A default value is provided. When you started IWSY the left-hand side of the screen will have shown this outline before the help panel replaced it.
 
 - `css` is any set of global style values you wish to set up for your presentation. These will be added to the HEAD of your document. Typical uses are to set a color for headers or to adjust margins on specific elements.

Next: ~page:action-set-content:Set the content of blocks~
