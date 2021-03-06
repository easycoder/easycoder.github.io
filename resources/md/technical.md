# Technical Overview #

~ec~ is an English-like, high level scripting language for browsers, written in JavaScript. It comprises a compiler and a runtime and by using a pluggable, modular architecture it can handle projects of any size. For general information see [easycoder.github.io](https://easycoder.github.io).

Modern web programming regards structure as being more important than content. A plethora of frameworks exist to provide a structural basis for any web project, and without a deep understanding of at least one such framework it is hard to be taken seriously as a web programmer.

By imposing structure we aim to reduce the opportunity for coding errors to be made. It's difficult to measure the success of this approach since to do so would mean creating a second version of the project that does not use a structural framework, then comparing the two to see which is better. Such a test is unlikely to take place for anything but a trivial project, so we have to take the word of the industry that their products are everything claimed for them.

At ~ec~ we take issue with this claim, for the following reasons:

1. Frameworks reduce the scope for ingenuity, seeking to eliminate errors from the outset by reducing all programming effort to a simple process of following rules that relies more on learning the structure than on thinking about problems and solutions. We consider the benefit to be marginal at best and the approach to result in sites that are harder to maintain as the structure is not always easy to see.

1. Rather than imposing a straitjacket on developers, large monolithic systems should wherever possible be broken down into smaller units that work in cooperation with each other and are maintained independently - the classic "black box" approach. Each unit can use different design choices, depending on the job being done and the skills available to construct it.

1. Frameworks are hard to learn and none last long before they are replaced by different frameworks. It is naive to believe that any of the current crop will still be preeminent in a decade's time. This is bad for projects that require intermittent maintenance over a long period, where skills are often not maintained in the organization. External contractors brought in to deal with updates do not have time to become fully familiar with the product, and overall integrity suffers.

1. Programming should not be the preserve solely of highly skilled professionals. It's a skill anyone can develop, that can be used at varying levels. To expect everyone to spend months learning JavaScript plus a massive framework is to exclude talent that is very much needed.

## Structure and benefits of ~ec~ ##

~ec~ can operate without HTML, CSS or JavaScript. There's no virtual DOM; instead the language operates directly on the page. The package has its own compiler and runtime, which both run in the browser. Scripts are plain text files that are compiled on demand. This is very quick; the compiler will process about 20 lines of script per millisecond on an average laptop and take only a little longer on a smartphone. Scripts tend to be fairly small, generally well under 1000 lines long, and are compiled on the fly when needed. Page load times are usually under 2 seconds, depending on how much is needed in the initial page and how much can be deferred until after the page has rendered.

~ec~ scripts describe functionality as seen by a user of the system. Aside from the DOM there are no structural features in the language. This may be a disadvantage for some types of project but ~ec~ is not intended to be a "one size fits all" solution; it's designed to be quick, effective and accessible by casual programmers.

~ec~ is modular and pluggable. It is composed of a core set of JavaScript files totalling less than 250k bytes, with additional plugins that provide special functionality. Many projects will need no more than the core set, which provides basic language features, DOM manipulation, JSON and REST features. Plugins are available for text editors, Google Maps, markdown processing and more. In this respect ~ec~ is itself a framework, albeit one that emphasises language rather than structure.

~ec~ compiles script into an intermediate form; an array of objects, one for each step in the program. The runtime engine goes through the array item by item and achieves respectable performance. This all happens in the browser, unseen by visitors to the web page.

~ec~ is highly customizable. If the supplied functionality is insufficient, a plugin module can be written to provide missing features or to make existing ones run faster. Plugin programming is straightforward; it comprises code to handle the additional syntax and to wrap the algorithms used at runtime. Google Maps is a good example; it has a simple API that is well suited to being implemented as an ~ec~ plugin, and the source JavaScript of the plugin, comprising compiler and runtime, is only 560 lines long.

~ec~ does not use any third-party libraries for its core code, so its behavior can be relied upon not to change as a result of updates to such libraries. Some of our plugins make use of code from CDN libraries so we cannot offer any guarantees in that respect, but all the ~ec~ files are available as Open Source here on GitHub.

A website bult with ~ec~ can be maintained by any competent programmer without needing high-level skills in specific languages or frameworks. This lowers the overall cost of ownership and helps extend the useful life span of the product.
