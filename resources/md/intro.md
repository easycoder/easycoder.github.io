# Introduction #
So you've built yourself a website and you'd like to add some interactivity. For this you need a program - otherwise known as a script - and some element on your page to make interactive. You may have been told that JavaScript is your only option and you may have already tried it and found it rather intimidating; if so, here's a simpler alternative. (Note for WordPress users: a plugin is available for ~ec~; just search for it by name. It also has [its own website](https://easycoder.software)).

To help you get started, let's do something super simple. I'm assuming you already have access to your own hosting plan or are able to borrow some space on a friend's site. If you haven't yet built any kind of working web page - from the level of Hello, World upwards - I recommend you get familiar with that first; it's rather outside the scope of these instructions.

Once you have edit access to an empty server directory, create an `index.html` file with the following contents:

```
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src='https://cdn.jsdelivr.net/gh
/easycoder/easycoder.github.io/easycoder/easycoder.js'></script>
  </head>

  <body>

    <div id="easycoder-script" style="display:none">

      alert `Hello, world!`

    </div>

  </body>
</html>
```

If all is well, when you type the URL of the page into your browser the message **Hello, world!** should appear in a popup message window.

The upper half of the file is the _HEAD_ of the document. In here is a call to load the ~ec~ JavaScript engine that we'll be using instead of regular JavaScript. It's called from a _Content Delivery Network_ that takes files from the  ~ec~ source-code repository. Don't worry if this is all a bit too technical; it's not necessary to understand in order to use it.

The lower half of the file is the _BODY_ of the document, which contains everything your users are going to see. This example, being as simple as you can get, has a single element, a `<div>` element inside which is the 1-line script that displays the popup message you just saw. ~ec~ scripts look a lot like English, and like human languages they use very few symbols. It's very easy to learn the basics and whatever you write always goes inside the `<div>` element we see here.

## Next Steps

Now I'll show you a slightly more complex example, that displays some text which when clicked pops up a message. We'll start with the previous example and make the necessary changes to it. Open `index.html` into your editor and replace the existing `<body>...</body>` section with the following:

/1/
Load the page into your browser and check the text appears. Note that only text that's outside of any angle braces will appear; the rest is all HTML tags. In this case there's a single ~code:&lt;div&gt;~ (division) that contains our text; it also has an identifier string that we'll use shortly.

We're going to write a script that does something when you click the text.

Replace the entire `<body>...</body>` section again with the following:

/2/
This adds a special piece of HTML that ~ec~ looks for when the page starts up. You'll never see it on your page, but anything inside it is assumed to be the script you want to run. So let's add the script itself:

/3/
Here we define a "variable" called ~code:MyText~ and attach it to the ~code:&lt;div&gt;~ containing the message. Variables are named items that hold values of some kind, so when you use the variable you are accessing the data it contains - or in this case the ~code:&lt;div&gt;~ it's attached to.

By "attach", what I mean is the variable ~code:MyText~ looks for the screen element having the id ~code:my-first~, which already exists in the body of the page. Now, anything we do with ~code:MyText~ will operate directly on that screen element.

Just about the simplest interactivity we can have is to pop up a message when you click the text, so that's what the next line does.

The final line just tells ~ec~ to stop and wait for something to happen.

Save the page again and refresh your browser tab. Click the text and you should get the popup alert. Voila! Your ~ec~ script is running!

Now you've got this far, the best place to learn more is our **Codex**; a tutorial and programmer's playground where you can write and test scripts, that includes a full reference manual for the ~ec~ programming language. Click the **Codex** link in the menu panel.
