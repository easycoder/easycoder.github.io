=== EasyCoder Plugin ===

Donate link: https://easycoder.software
Contributors: gtanyware
Tags: code, compiler, css, customise, customize, debug, debugger, DSL, interactivity, graphics, javascript, program, programming, rest, script, scripting, tracer, webservice
Requires at least: 4.4
Requires PHP: 5.2
Tested up to: 5.2
Stable tag: trunk
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Control the appearance and behavior of your posts and pages by embedding simple English-like scripts, without the need to learn JavaScript

== Description ==

*EasyCoder* is a programming language written in JavaScript/ECMAScript6 and packaged as a browser plugin. It is known to work with popular browsers such as Chrome and Firefox on Windows or Linux, as well as on current iOS and Android devices.

*EasyCoder* is for non-programmers, who generally find JavaScript hard to learn. Not everyone wants to be a professional programmer; most just want to achieve results with the minimum of effort. The work done by JavaScript in a web page mostly uses a small fraction of its capabilities, so we've taken the more common requirements and packaged them up in an English-like script syntax. Some of the things you may want to do are

* Change the appearance of a screen element by modifying its CSS attributes. You may want something a little - or a lot - different to what your theme provides
* Show and hide parts of your content, avoiding the need to reload the page by putting everything in at the start and selecting which parts of it to show
* React to button clicks and other events by altering the appearance or revealing content as above
* Retrieve content from web services using REST and JSON
* Draw and animate simple graphics
* Create a Google Map, put markers on it and intearct with the map and the markers
* Use CodeMirror to create a unique color-coded text editor
* Include the CKEditor rich text editor in your pages
* Include the Showdown markdown converter in your pages

*EasyCoder* provides a simple syntax to do all these things, at about the same level of complexity and readability as SQL or Excel macros. It's a full programming language, though, capable of making complex logical decisions.

*EasyCoder* scripts are embedded in your page or post, inside a special "preformatted" tag. When the page loads, *EasyCoder* looks for this element then compiles and runs the script it contains. When it interacts with HTML elements it attaches their IDs to its own variables, so your HTML and its controlling script are in the same file.

The *EasyCoder* core module is currently about 60k bytes in its minimised form and it downloads its own plugin modules from a growing library. Its performance is good because it precompiles scripts - a process that takes jus a few tens of milliseconds - and the compiled code for each command is only a thin wrapper around the corresponding JavaScript functionality.

When *EasyCoder* detects an error, either in compilation or at runtime, it opens a popup window with a friendly error message that tries to tell you what went wrong and where in the script it happened.

As a further help when developing scripts, *EasyCoder* has a single-step tracer where you can decide which variables to display for each step of your script. To use this feature you add another special "preformatted" section to your page and add the 'trace' command in your script where you want tracing to start. See the [Documentation](https://easycoder.software/documentation).

*EasyCoder* has a fully pluggable architecture. This means any JavaScript development team can make their own plugins, that 'wrap' *EasyCoder* functionality round their products so WordPress site developers can use them without the need to learn JavaScript. Plugins can be served from any website without any need to notify EasyCoder Software.

== Documentation ==

Extensive documentation is available at our [documentation](https://easycoder.software/documentation)page.

== Examples ==

A range of example scripts can be seen at our [examples](https://easycoder.software/examples) page.

== Learning resources ==

For tutorials and a programmers' reference see our [EasyCoder Software Codex](https://codex.easycoder.software).

== Changelog ==

= 2.7.1 04-may 2020 =
* Fix bug in 'set styles'

= 2.7.0 04-may 2020 =
* Added 'click left' and 'click top'

= 2.6.1 16-apr 2020 =
* Use CDN to deliver all files

= 2.6.0 21-feb 2020 =
* Added a VFX plugin; many other updates & bug fixes

= 2.5.6 14-dec-2019 =
* Fix bug in REST handling errors

= 2.5.5 12-dec-2019 =
* Fix problems with exit(); replace program with name in objects

= 2.5.4 10-dec-2019 =
* Fixed bug in parent script handling

= 2.5.3 09-dec-2019 =
* Revised run/import handling & minor additions

= 2.5.2 05-oct-2019 =
* Fix bugs in drag & drop and others

= 2.5.1 30-aug-2019 =
* CORS, bug fixes

= 2.5.0 26-aug-2019 =
* Drag & drop

= 2.4.6 09-aug-2019 =
* Minor updates to gmap and others

= 2.4.5 24-jul-2019 =
* Update version number

= 2.4.4 21-jul-2019 =
* Add 'or' clause to 'attach'

= 2.4.3 5-jul-2019 =
* Refactor for faster tokenizing

= 2.4.2 22-jun-2019 =
* Fix another bug in REST server

= 2.4.1 18-jun-2019 =
* Fix bug in REST server

= 2.4.0 18-jun-2019 =
* Sorting & filtering; added the script editor

= 2.3.1 7-jun-2019 =
* Bug fixes & updates to support learn-to-code

= 2.3.0 16-may-2019 =
* All JS modues version-numbered; split json into json/rest

= 2.2.6 12-may-2019 =
* Updated 'require'; replaced missing sample file

= 2.2.5 9-may-2019 =
* Updated 'require'; replaced missing sample file

= 2.2.4 1-may-2019 =
* Handler for on leave

= 2.2.3 29-apr-2019 =
* Detect portrait and landscape

= 2.2.2 1-apr-2019 =
* Added date formatting

= 2.2.1 17-mar-2019 =
* New plugin: anagrams. Various changes/optimisations/bugfixes

= 2.2.0 25-feb-2019 =
* New plugins: gmap and showdown.

= 2.1.9 21-jan-2019 =
* Code checked by eslint.

= 2.1.8 16-dec-2018 =
* All UI components can be created programmatically.

= 2.1.7 09-dec-2018 =
* Moved local files out of plugins folder.

= 2.1.6 07-dec-2018 =
* Fixed bugs in plugin loader.

= 2.1.5 06-dec-2018 =
* Improvements to REST; new UI package.

= 2.1.4 18-nov-2018 =
* Bug fixes and minor improvements.

= 2.1.3 29-oct-2018 =
* Revised REST functionality.

= 2.1.2 26-oct-2018 =
* Better error handling and reporting.

= 2.1.1 25-oct-2018 =
* Added some more REST functions and a REST server.

= 2.1.0 21-oct-2018 =
* Change from curly braces to backticks.

= 2.0.1 18-oct-2018 =
* Bug fixes.

= 2.0.0 17-oct-2018 =
* New pluggable architecture.

= 1.5.3 11-oct-2018 =
* Added 'replace'; fixed bugs.

= 1.5.2 =
* Added some minor features, fixed bugs.

= 1.5.1 =
* Fix some REST bugs.

= 1.5.0 =
* Added sin, cos & tan trig functions; left and right substring operators; json shuffle.

= 1.4.0 =
* Added alias variables.

= 1.3.0 =
* Added width/height, modulo and array data assignment. Various other bug fixes.

= 1.2.0 =
* Added new features to groups and other graphics items.

= 1.1.1 =
* Bug fix

= 1.1.0 =
* Added graphics features based on SVG.

= 1.0.0 =
* Initial release version.
