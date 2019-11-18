# Introduction #
So you've built yourself a website and you'd like to add some interactivity. For this you need a program - otherwise known as a script - and some element on your page to make interactive. You may have been told that JavaScript is your only option and you may have already tried it and found it rather intimidating; if so, here's a simpler alternative. (Note for WordPress users: these instructions also apply to you; check /WP/ for some further details.)

To help you get started, let's do something super simple. I'm assuming you already have access to your own hosting plan or are able to borrow some space on a friend's site. If you haven't yet built any kind of working web page - from the level of Hello, World upwards - I recommend you get familiar with that first; it's rather outside the scope of these instructions.

Once you have edit access to an empty server directory, download [helloworld.zip](#) into it and unzip it. If all is well, when you type the URL of the site into your browser the message **Hello, world!** should appear at the top of the window.

Then open `index.html` into your editor. This is the file we'll be using for this short demo. Replace the existing `<body>...</body>` section with the following:

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

Now you've got this far, the best place to learn more is our ~codex~; a tutorial and programmer's playground where you can write and test scripts, that includes a full reference manual for the ~ec~ programming language.
