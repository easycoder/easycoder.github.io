# Adding images #
Web pages are often highly visual, with plenty of images, so before continuing with more traditional programming topics I'll show you how to create a page with an image and a title.

When you look at the HTML for a web page you never see any pictures; it's just a text document. So how do images get onto the page?

When we need an image we give information that tells the browser how to find it, somewhere out there on the Internet where it's stored on a computer somewhere. We give this information in the form of a URL, which stands for Uniform Resource Locator. This is otherwise referred to as the "address" of the image.

The code that follows fetches an image from our own webserver, scales it so it occupies 70% of the page width and places it centrally aligned with a title underneath.

~step~
~copy~

The script starts not with program code but with a comment. Comments are for the benefit of human readers; you can put them anywhere you feel the need to explain - to someone else or to your future self - what is going on in your code. Comments start with an exclamation mark and continue to the end of the same line, so you can either place them in their own line (as here) or after a script command.

Comments are the subject of many an argument between programmers. Some don't like writing comments, claiming the code itself should be self-explanatory, while others feel the need to add some to explain the intention behind the code, which is otherwise often missing. We will leave you to do as you prefer.

Next we have 3 variables of different types. A ~code:div~ is a division of a page; a container inside which other elements can be placed. Many web pages consist of many divs within other divs, most of them invisible and just providing the overall structure.

The ~code:img~ variable is where we'll place our image, and the ~code:p~ variable is for the title that sits underneath it.

First we create the container, giving it center alignment, a margin around itself, a gray border, some padding inside to keep its contents away from the border and a background color. As explained in the previous step, all these are standard CSS attributes that you can look up. The list of styles is quite long, so to keep the line from wrapping in the editor I've broken it into 2 parts with a ~code:cat~ between them. "Cat" is short for "catenate", which simply joins 2 pieces of text together.

The image element is then created. Note that the command requests it to be created inside the container; the default would be for it to sit underneath. The image width is set to 70% of its containing element. Then we request the image itself from our server. When resources such as graphics are located on the same server as the code that uses them it's common for the URL not to begin with the usual ~code:http://~; here we have a relative path that refers to a folder on the server. As the programmer you obviously will know where your images are kept.

The title text comprises several lines. In a web page a line break is requested by using the word ~code:break~, and to keep things tidy here the whole string is divided into lines and catenated together.

~next:Animation~
