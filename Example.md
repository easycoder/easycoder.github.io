### A Simple Example ###

As a simple example, suppose you'd like to adjust the background color of a specific block of text when the page loads. The simple way is to go into the WordPress page editor, find the paragraph and wrap it in a tag:

```
<div style="background-color:pink">This is the paragraph of text</div>
```

That's easy enough but the background will always be pink. Suppose you'd like it to only change when the user interacts with the page in some way? This is where you need a bit of JavaScript and it's where **_EasyCoder_** makes things a breeze. Here's the code for making the background change; we'll look at triggering it later.

First of all, the DIV must have its own unique ID, like this:

```
<div id="my-special-div">This is the paragraph of text</div>
```

but it doesn't need any style information; we'll do that using a script.

I'm assuming that you have installed and activated the **_EasyCoder_** plugin. So now you need to provide it with a script to run. Put the following code anywhere in your HTML file:

```
<pre id="easycoder-script" style="display:none">
  <!-- script goes here -->
</pre>
```

As you can see, the script is contained in an invisible preformatted section with a specific ID that the plugin will look for. Let's supply some code to change the backgound color.

```
<pre id="easycoder-script" style="display:none">
  div MyDiv
  
  attach MyDiv to `my_special-div`
  set style `background-color` of MyDiv to `pink`
</pre>
```

The first line declares a "variable" called _MyDiv_, being an instance of the general type _div_, and it attaches this variable to the element having the id _my-special_div_. The backticks are what **_EasyCoder_** uses to define a text constant; other languages mostly use double-quotes but we have a couple of good reasons for not doing so - see the documentation on our website. The final line sets a single style element - the background color - to the element.

Most non-programmers will find this a lot easier to read than the corresponding JavaScript. It's English, after all, with a minimum of special symbols.

Let's suppose you wanted to change the background color only when the user clicks a button in your page. So you need to add an appropriate ID to your button in the HTML.

```
<button id="my-clickable-button">Click me!</button>
```

And the script now looks like this:

```
<pre id="easycoder-script" style="display:none">
  div MyDiv
  button Button
  
  attach MyDiv to `my_special-div`
  attach Button to `my-clickable-button`
  on click Button set style `background-color` of MyDiv to `pink`
</pre>
```
This code does the following:
1. Attaches MyDiv to the _div_ element with the id _my_special_div_.
1. Attaches the _Button_ variable to the _button_ element with the id  _my-clickable-button_ id
1. Waits for the user to click the button and sets the _background-color_ when this happens.

[About EasyCoder](AboutEasyCoder.md)

[EasyCoder](README.md)
