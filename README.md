# EasyCoder #

**_EasyCoder_** is a high-level English-like scripting language that runs entirely inthe browser and lets you write highly readable scripts to control the appearance and behavior of your web pages. It's much easier to learn than JavaScript but does many of the same things. Here are its main benefits:

 1. It's quick to write browser applications in **_EasyCoder_**. Website development is faster and sites are more reliable because they are more compact and easier to read.
 1. **_EasyCoder_** scripts are smaller than the corresponding JavaScript and are easy to read by most people, not just by programmers. This matters later on when maintenance is needed and the original programmer may no longer be available.
  1. **_EasyCoder_** plugin has the ability to single-step its scripts, showing you its variables at each step, which makes it easier to see what's happening.
 1. When things go wrong an error message pops up, showing you which line of the code you reached. The error message also gets written to the browser console.
 1. The language has plain English commands to do things that are complex to do in JavaScript, such as handling REST dialogs, custom GUI elements and vector graphics. These are all written in JavaScript and supplied as seamless extensions in the form of plug-in modules.
 1. Program data can be put into JSON files and either provided as a hidden block in your HTML or downloaded on demand using the REST commands. This allows you to keep your HTML as just structure and to write the content in from the script.
 1. **_EasyCoder_** has a fully pluggable architecture. This allows any owner of JavaScript functionality to 'wrap' this in script commands and offer it as a plugin, allowing any site developer to use it without the need to learn JavaScript. Typical examples of such wrappers that are already provided are Google Maps or and CKEditor, each of which presents a concise API and has functionality that's easily understood and easy to describe in plain English. Well-encapsulated products are ideal candidates for implementation as **_EasyCoder_** plug-ins.
 1. **_EasyCoder_** includes a REST server that permits scripts to access resources on demand from the server rather than having them embedded in the page. Resources include scripts, HTML components, CSS and general data, and all can be loaded and unloaded dynamically. Two versions of the REST server are provided, written in PHP and Python respectively.
 1. **_EasyCoder_** is well suited to the construction of single-page web designs of unlimited size. The memory space occupied by JavaScript remains roughly the same no matter how many scripts and data you load and unload using REST. There is no memory or performance hit as the size of the project grows, because unused modules remain on the server, ready for use, instead of taking up permanent browser space.

To use **_EasyCoder_** all you need is to include its main JavaScript file in the _HEAD_ of your web page. It will call in any other JavaScript files it needs. An introductory example is given in the Introduction page of [our website](https://easycoder.github.io). You can alternatively build a standalone page where all the files are present on your own server, which avoids any possible risk of your site breaking when updates occur. We do our best to prevent this happening but it's impossible to cover all possibilities.

It is said that there's a shortage of competent programmers, a belief that's confirmed by the huge number of job vacancies all asking for skills such as React. If that's true then the use of React or similar tools in any project that is not managed by a permanent team is almost guaranteed to result in problems later with maintenance. If it's hard to find developers now then the chances of locating a skilled React engineer in 5-10 years' time, someone skilled enough to understand, take apart and rebuild your code at a price compatible with effective maintenance are vanishingly small.

**_EasyCoder_** tries to address this problem by offering a way to build websites that won't rely on such high-level skills, using the power of language rather than relying on elaborate structures to achieve the desired goal. In the hands of a competent programmer it makes little difference to the cost of building the project but a huge difference to that of maintaining it by people lacking those skills. **_EasyCoder_** scripts are easy to understand by anyone who has a good knowledge of what the site does, even by many people who aren't programmers at all.

There's a lot more information on [our website](https://easycoder.github.io), which includes example scripts plus the Codex; a full reference documentation on the language and a tutorial course suitable for desktop or mobile users. Anyone interested in helping develop **_EasyCoder_** will find an outline developer manual in the last of the links below.

[A Simple Example](Example.md)

[A Demo Website](DemoWebsite.md)

[About EasyCoder](AboutEasyCoder.md)

[Developer Manual](developer/Developer.md)

## The Codex ##

The Codex is a page on [our website](https://easycoder.github.io) that provides a tutorial series plus a programming playground to try out code and a complete programmers' reference to the **_EasyCoder_** language.

## License ##

Copyright (c) 2018-19 EasyCoder Software

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
