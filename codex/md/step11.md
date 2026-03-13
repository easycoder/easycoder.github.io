# Interactivity #
In all but the simplest of programs there are ways the user can interact and control how things happen. Here I'll show how to do this. For our example we'll build a script that asks the user for a number then creates that number of buttons on the screen. When a button is clicked its appearance will change to show it's no longer clickable. Here's the code:

~copy~

The script starts by asking the user how many buttons to place on the screen. It then sizes a couple of arrays to the number you give. One array will hold the buttons; the other is an array of flags that are set when the corresponding button has been clicked. The next piece of code goes through this array clearing each of its values (setting it false). Then we create the main container to hold the buttons.

Now we enter a loop, which redraws everything each time we go through it. The first thing is to clear the container of all its previous content - if any - then draw all the buttons using a loop. For each button we create the outline - a ~code:div~ with a border, then check if the button has been clicked. If it has, a simple message is placed in the button, but if not we need to create a hyperlink, which in HTML is an ~code:a~ element so that's what it's called in ~ec~ too. We give the button the content ~code:Button N~, where ~code:N~ counts from 0 to the number of buttons.

The next part says what happens when the user clicks/taps a button. The on keyword denotes an event handler. An event is something that happens while a program is running and there are a number of different event types; click being one of them. When a click is detected, the system runs the command or block of commands that follow.

You can set an event handler on any screen component, but there's one significant difference with a hyperlink element, that when the mouse pointer passes over it ("hovers" over it) the icon changes to a hand, whereas it doesn't for a ~code:div~ or any of the other types. Obviously this only applies to PCs; touch-based devices such as smartphones don't have a hover mechanism so you're advised to make it obvious that something is a link. Another difference is that hyperlinks have "decoration", usually in the form of the text being underlined. This is the default but you can change it or turn it off completely in your CSS styles.

The action we take on detecting a click is to set the ~code:Clicked~ flag for that button then redraw the screen. So we have to be able to tell which button was clicked, and that's a very good reason for keeping them in an array. When you have an array of hyperlinks you only need to do on click once because it applies to the whole array. When the click occurs the internal pointer is set to the element that had the click, so here we get that index and use it to point to the same element in the ~code:Clicked~ array. We set that true, so when the screen is redrawn the element takes on its clicked form.

~next:TicTacToe~
