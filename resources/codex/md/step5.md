# Styling and CSS #
The previous step gave us a line of text at the top of the screen, but it's crammed up against the left-hand edge in rather an unattractive way. We can deal with this by giving it some styling. Here's the same script, with some styling added:

~step~
~copy~

As before click  to run the script.

That looks a lot better; the text is bigger, it's in the middle of the panel and it's a nice shade of blue. How was this done?

On the web, the content of your page - what you see - is determined by HTML. This includes both the visible text and images, but also the block structure that make up your page. Paragraphs and other components defined in your EasyCoder scripts translate directly to corresponding forms to go in the web page. The type names are identical although the syntax is very different.

Styling, on the other hand, governs how the page looks, and this is controlled by CSS, which stands for Cascading Style Sheets. Keeping these two things separate lets us change the appearance without having to change the content. You may not appreciate just how useful this technique is until you work with it for a while.

CSS lets you control virtually any aspect of how a thing looks. Such as:

size
color
margins and padding
borders
backgrounds
positioning
visibility
and so on. In our example we've used the following:

~code:text-align:center;color:blue;font-size:1.4em~

which has 3 parts. The first part sets the text to be center-aligned in the paragraph; the second part sets the color of the text and the final part sets the font size to be 1.4 times that of the current default value, whatever that might be. A 'em' comes from the world of typesetting and represents the size of a letter 'm' in the current font and style.

CSS styles are just strings of text and we use them in ~ec~ exactly as described in the extensive documentation available online and in books, so we won't go into any details here. All the styles we use in our examples are very well documented. So for example, if you want to find out what the text-align style does, just Google "css text-align".

~next:Adding images~
