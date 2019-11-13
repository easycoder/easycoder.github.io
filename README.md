### EasyCoder ###

**_EasyCoder_** is a WordPress or standalone plugin that lets you write highly readable scripts to control the appearance and behavior of your web pages. This is what JavaScript does, but **_EasyCoder_** is a lot easier to learn. Here are its main benefits:

 1. It's quick to write browser applications in **_EasyCoder_**. Website development is faster and sites are more reliable.
 1. **_EasyCoder_** scripts are smaller than the corresponding JavaScript and are easy to read by most people, not just by programmers. This matters later on when maintenance is needed and the original programmer may no longer be available.
 1. You don't have to figure where to put custom JavaScript files in the WordPress directory structure, because the **_EasyCoder_** script is kept in its own section of your WordPress page or post, or downloaded from your database. It's easy to see the context of each script and what it does and the script is less likely to get lost during maintenance of the site.
 1. The **_EasyCoder_** plugin has the ability to single-step your script, showing you its variables at each step, which makes it easier to see what's happening.
 1. When things go wrong an error message pops up, showing you which line of the code you reached. The error message also gets written to the browser console.
 1. The language has commands to do things that are very complex to do in JavaScript, such as handling REST dialogs, custom GUI elements and vector graphics.
 1. You can divide your HTML into markup and content, by providing the latter as a JSON structure in its own section of your page. The script can easily access this data to write content into the HTML elements. This makes it easier to understand the structure of the page.
 1. **_EasyCoder_** has a fully pluggable architecture. This allows any owner of JavaScript functionality to 'wrap' this in script commands and offer it as a plugin, allowing any site developer to use it without the need to learn JavaScript. Typical examples of such wrappers would be for Google Maps or for CKEditor, each of which presents a concise API and has functionality that's easily understood and easy to describe in plain English. Such well-encapsulated products are ideal candidates for implementation as **_EasyCoder_** plug-ins.
 1. **_EasyCoder_** includes a REST server that permits scripts to access resources on demand from the server rather than having them embedded in the page. Resources include scripts, HTML components, CSS and general data, and all can be loaded and unloaded dynamically.
 1. **_EasyCoder_** is well suited to the construction of single-page web designs of unlimited size. The memory space occupied by JavaScript remains roughly the same no matter how many scripts and data you load and unload using REST. There is no memory or performance hit as the size of the project grows, because modules remain on the server, ready for use, instead of taking up browser space.
 
It is said that there's a shortage of competent programmers, a belief that's confirmed by the huge number of job vacancies all asking for the same skills such as React. If that's true then the use of React or similar tools in any project that is not managed by a permanent team is almost guaranteed to result in problems later with maintenance. If it's hard to find developers now then the chances of locating a skilled React engineer in 5-10 years' time at a price compatible with effective maintenance are vanishingly small.

**_EasyCoder_** tries to address this problem by offering a way to build websites that won't rely on such high-level skills, using the power of language rather than relying on elaborate structures to achieve the desired goal. In the hands of a competent programmer it makes little difference to the cost of building the project but a huge difference to that of maintaining it by people lacking those skills. **_EasyCoder_** scripts are easy to understand by anyone who has a good knowledge of what the site does, even by many people who aren't programmers at all.

There's a lot more information on [our website](https://easycoder.software) including example scripts, and full reference documentation on the language plus a tutorial course, suitable for desktop or mobile users, can be found on [our Codex page](https://codex.easycoder.software). Anyone interested in helping develop **_EasyCoder_** will find a developer manual in the last of the links below.

[A Simple Example](Example.md)

[A Demo Website](DemoWebsite.md)

[About EasyCoder](AboutEasyCoder.md)

[Developer Manual](developer/Developer.md)

### The Codex ###
The Codex is a separate website that provides a tutorial series plus a programming playground to try out code and a complete programmers' reference to the **_EasyCoder_** language. We also offer a zip file that can be unpacked on any suitable host. The only special hosting requirement is a recent version of PHP. Running it on your own hosting allows you to save scripts to your server; otherwise they remain in browser local storage.

### License ###

Copyright (c) 2018-19 EasyCoder Software

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

