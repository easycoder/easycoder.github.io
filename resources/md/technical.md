# Technical Overview #

~ec~ is a scripting language for browsers, written in JavaScript. It comprises a compiler and a runtime and by using a pluggable, modular architecture it can handle projects of any size. For general information see [easycoder.github.io](easycoder.github.io).

Modern web programming regards structure as being more important than content. A plethora of frameworks exist to provide a structural basis for any web project, and without a deep understanding of at least one such framework it is hard to be taken seriously as a web programmer.

By imposing structure we aim to reduce the opportunity for coding errors to be made. It's difficult to measure the success of this approach since to do so would mean creating a second version of the project that does not use a structural framework, then comparing the two to see which is better. Such a test is unlikely to take place for anything but a trivial project, so we have to take the word of the industry that their products are everything claimed for them.

At ~ec~ we do not take this as axiom, for the following reasons:

1. Frameworks greatly add to the size of the code base, and a primary rule of programming is that the bigger the code, the more places there are for bugs to hide.

1. Frameworks reduce the scope for ingenuity, seeking to eliminate errors from the outset by reducing all programming effort to a simple process of following rules. This relies more on learning the structure and less on thinking about problems and solutions.

1. Frameworks are hard to learn and none last long before they are replaced by different frameworks. It is naive to believe that any of the current crop will still be preeminent in a decade's time. This is bad for projects that require intermittent maintenance over a long period, where skills are often not maintained in the organization. External contractors brought in to deal with updates do not have time to become fully familiar with the product, and overall integrity suffers.

1. Programming should not be the preserve solely of highly skilled professionals. It's a skill anyone can develop, that can be used at varying levels. To expect everyone to spend months learning JavaScript plus a massive framework is to exclude talent that is very much needed.

## Sructure of ~ec~ ##

~ec~ operates without HTML or JavaScript. There's no virtual DOM; instead the language operates directly on the page. The package has its own compiler and runtime, which both run in the browser. Scripts are plain text files that are compiled on demand. This is very quick; the compiler will process about 20 lines of script per millisecond on an average laptop and take only little longer on a smartphone. Scripts tend to be fairly small, usually well under 1000 lines long. Initial page load times are usually under 2 seconds, depending on how much is needed in the initial page and how much can be deferred until after the page has rendered.

~ec~ is modular and pluggable. It is composed of a core set of JavaScript files totalling less than 250k bytes, with additional plugins that provide special functionality. Many projects will need no more than the core set, which provides basic language features, DOM manipulation, JSON and REST features. Plugins are available for text editors, Google Maps, markdown processing and more. 

~ec~ compiles script into an intermediate form; an array of objects, one for each step in the program. The runtime engine goes through the list, achieving respectable performance.

~ec~ is highly customizable. If the supplied functionality is insufficient, a plugin module can be written to provide missing features or to make existing ones run faster. Plugin programming is straightforward; it comprises code to handle the additional syntax and to wrap the algorithms used at runtime. Google Maps is a good example; it has a simple API that is well suited to being implemented as an ~ec~ plugin, and the source JavaScript of the plugin, comprising compiler and runtime, is only 560 lines long.

~ec~ does not use any third-party libraries for its core code, so its behavior can be relied upon not to change. Some plugins make use of code from CDN libraries so we cannot offer any guarantees in that respect, but all the ~ec~ files are available as Open Source here on GitHub.
