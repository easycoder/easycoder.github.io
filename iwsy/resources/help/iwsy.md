~page:contents:Contents~

# ~iwsy~ - I Wanna Show You 

I Wanna Show You (~iwsy~, pronounced "You-zee" as an approximation to the initials) is an online presentation package built to deliver slideshows that either run under manual control or unattended. Instead of being a PC application that's tied to the desktop, ~iwsy~ is entirely browser-based. ~iwsy~ presentations can run here in this web app, they can be embedded in other web pages or they can run as independent web pages.

## Quickstart tutorial

These help pages contain everything there is to know about ~iwsy~, but there's a lot to read. Most people just want to get started quickly, so we have a built-in ~page:quickstart:quick-start tutorial~ where you can create a simple presentation - a few slides with text and pictures - in just a few minutes. Once you've completed this first step you'll have a pretty good idea of what ~iwsy~ is all about, and the rest of the help pages won't be nearly as intimidating.

## Feature summary

The basic features of ~iwsy~ are:

 - A step editor, where you create a set of steps that together form your presentation
 - A block editor, where you define templates to control where things appear on the screen
 - A content editor, where you keep all the text that will be shown in your presentation
 - A presentation viewer that runs your shows or displays any step
 - A block viewer to visualise your blocks
 - User management - each user has their own account and storage area
 - Image management - users can create folders, upload/delete images and so on
 - Built-in help - what you're reading
 - A ~page:quickstart:quick-start tutorial~

## Background

~iwsy~ started with a need to embed a slide show in a web page, but rather than just a sequence of pictures I wanted something between that and a video. Videos are time-consuming to make and almost impossible to alter when changes happen to the things being described. Presentation packages such as PowerPoint, on the other hand, lack extensive animation features and are hard to embed in a web page. It seemed to me there was room between the two for a new type of product, and once the idea took hold it was hard to put down. It coincided with the Coronoavirus pandemic, which enforced solitude at home and provided the time for development to take place.

Much of my previous work in recent years has been in building websites, often of a specialized nature with unusual interactive needs. Not having an exceptional intellect I have difficulty with complexity and this has become something of an obsession over the years. Rather than face the issue directly I devised a programming language suited to those who, like myself, regard excessive complexity as something to be avoided at all costs. The language, called EasyCoder, is itself written in JavaScript and has been applied to a number of web projects. I have yet to find a user interface that it cannot handle.

EasyCoder takes plain text scripts and compiles them in the browser. This is very quick, typically taking less than 50ms for a 1000-line script. EasyCoder scripts tend to be much shorter than their JavaScript equivalents, though by how much depends on the work being done. More importantly, they are readable by any intelligent person who understands the target domain. The basics of the language can be picked up in a day, which compares with the 3 or 4 months needed to learn React or Angular on top of JavaScript itself. So the long term maintenance prospects of an EasyCoder website such as ~iwsy~ are good as there will always be someone around who can learn it quickly.

The other main advantage of EasyCoder is that it doesn't have a build process. Scripts are loaded directly into the browser and compiled there. The only build tool needed is a text editor.

So that's the environment for ~iwsy~. All of the website UI is coded in EasyCoder. The presentation engine itself is just under 1000 lines of vanilla JavaScript and can be used independently of the ~iwsy~ website. This ensures performance is as good as it can get without moving to WebAssembly, though the latter is always an option.

The project is hosted on GitHub as part of EasyCoder and enquiries are welcome from other programmers who are interested in contributing. The range of transition effects is currently limited so there is considerable scope for extension. An outline plug-in mechanism is also present so it should be possible to enhance the system without major disruption each time.

~page:contents:Contents~
