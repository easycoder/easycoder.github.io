# Examples

The following websites were all built entirely in EasyCoder script:

 - This site: [EasyCoder](https://easycoder.github.io)
 - [Yorkshirewoman](https://yorkshirewoman.uk)
 - [Here on the map](https://hereonthemap.com)
 - [Rembrandt.ie](https://rembrandt.ie)
 - [Storyteller](https://storyteller-framework.netlify.app)
 - [I Wanna Show You](https://iwannashowyou.com)
 - [Vehicle Checks](https://vehiclecheck.netlify.app)

## This website

The ~ec~ website is driven by a script, with text provided as custom Markdown files. These 2 components work closely together and it's not immediately obvious where to start when trying to understand how it's done. <a href="#" id="how-it-works">Here's a page</a> that explains the process.

## Dice roller /SHOW-DICEROLLER/

This simple demo shows two dice with a random choice of faces. Click either dice to select a new pair of value. A simple animation mimics the rolling of the dice.
~<div id="ex-diceroller"></div>~

## Image switcher /SHOW-IMAGESWITCHER/

There are 9 images with only 1 showing. A row of thumbnail icons lets the user move left or right or select a specific image.
~<div id="ex-imageswitcher"></div>~

## Capture user input /SHOW-USERCAPTURE/

This is a rewrite of a script published in [Smashing Magazine](https://www.smashingmagazine.com/2020/03/introduction-alpinejs-javascript-framework/) as an example of how to use the Alpine.js micro-framework. It represents a block added to a web page, that displays an announcement and handles feedback from users.
~<div id="ex-usercapture"></div>~
The User Capture can be run as an independent web page; see [User Capture](https://easycoder.github.io/examples/usercapture). If you view the page source you will see the entire script inside its special preformatted element.

## Storyteller

Storyteller is a tool for building static websites using Markdown instead of HTML. Markdown is much easier to learn and is very suited to pages that comprise a single column of text, with headings, images and links to other pages. Storyteller adds some custom tags to the standard MarkDown set, to give better control over the way pages are rendered. The structure of the site is one of subjects that contain topics; each subject is a folder and each topic is a single text file written in Markdown. All the images used by the subject and its topics are placed in a folder inside that subject folder.

To use Storyteller all you need is to copy a short `index.html` file to your server and provide the topics your visitors will read. This is all covered by the documentation on the [Storyteller website](https://storyteller-ec.netlify.app).

The author has used Storyteller to create his own [personal memoirs](https://graham-trott.netlify.app) webapp.

Storyteller is written in ~ec~; its source code is in the [Storyteller repository](https://github.com/easycoder/storyteller).

## I Wanna Show You (IWSY) (under development)

IWSY is a web app for building slideshows and presentations that can be embedded in any web page or run from the IWSY app in the same way as from PowerPoint. The emphasis is less on providing elaborate static slides and more in manipulating text and images to provide an experience midway between a PowerPoint presentation and a video. Text can be panned, zoomed and color-changed and images can have a "Ken Burns" effect, so it's possible to create a show where the screen is never quite static but still offers the user the option to step through manually.

IWSY presentations are JSON files that are created edited in the IWSY editor and then run by the presentation engine, a single JavaScript file.

See the [IWSY website](https://iwannashowyou.com); the source is in the [EasyCoder repository](https://easycoder.github.io) in the `iwsy` directory.

## The Game of Life /SHOW-LIFE/

This is a "cellular automaton" - a no-player game devised in 1970 by John Conway. The "player" sets up an initial configuration and observes the game running according to a simple set of rules.

Click /LIFEDOC/ for a description of the program.
~<div id="ex-life" style="width:100%;max-width:400px"></div>~

## Others

There are a number of other examples in the pages of the **CODEX** - see the link in the contents panel.
