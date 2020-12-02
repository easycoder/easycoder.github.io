# Simple animation #
This is another tool in the programmer's box. Although it can easily be overdone, the right amount of movement brings a web page to life and directs the user's attention to key parts of it.

This example draws 3 colored circles and turns them on and off in rapid succession. I've chosen this example in order to highlight a number of useful programming techniques and bring in some more CSS.

From this point on some of the examples get quite long, so we won't reproduce them here. Instead, click the button below to load the example into the editor:

~copy~

When you have similar things being done to a number of different objects your code starts to get repetitive. Repetition is bad because if you need to change some key feature you have to do it in all the places it occurs. And of course, the more code there is, the more places there are for errors (bugs) to creep in through simple typos.

One good way to avoid this is to use arrays. An array is a variable that has multiple values. Like a pigeon-hole letterbox system, where the boxes are all the same but have different contents.

In most programming languages, arrays use brackets to indicate what's going on. So, to access the third element of the array variable ~code:data~ you would see

~code:data[3]~

~ec~ doesn't like symbols, using as few of them as it can to keep things as close as possible to natural English. We could have replaced this with

~code:the third element of Data~

but that's rather clunky so we took a cleaner approach. In ~ec~ all variables are arrays but most of them only have a single element. They also have an internal value that points to the current element. If there's only one, the pointer contains zero. (In computing, the first element of anything is 0, not 1). You can ask for however many elements you like for an array, and the internal pointer - called the _index_, ranges from 0 up to 1 less than the number of elements in the array.

In this script I've added some comment lines to help you see where things are being done. They have no effect on the program.

At line 11 we request 3 elements for the ~code:Button~ array. These will be addressed as index 0, 1 and 2. Then we have a loop that repeats 3 times, incrementing the counter ~code:N~ each time. We 'index' the button to the value of ~code:N~ so the array presents each of the elements in turn, and we do all the things that are the same for all the buttons. These are:

The width and height.
A margin on each side that keeps them apart.
The border radius. Buttons are rectangular by default; this gives them rounded corners. By using the value 50% we make the button a circle or an ellipse, depending if the width and height are the same.
Setting the display value to ~code:inline-block~ keeps all the buttons on a single line. (You're right; that not at all obvious, is it?)
The buttons start off invisible (but still occupying space).

Now we have to set the background color, which is different for each button so we test the value of ~code:N~ to see which color to use. CSS has 140 named colors, plus you can use combinations of red, green, blue and transparency to make a total of 4,294,967,296 distinct colors to choose from.

Finally, at line 29 the animation itself starts. We have a loop within a loop; the outer one runs forever while the inner one counts through the buttons, setting the index of the ~code:Button~ array each time then making the button visible for a short while before making it invisible again. Note how ~ec~ has 2 different ways of setting styles; one deals with just a single style while the other sets several at once and overrides anything else that was previously set.

The script has no need of a ~code:stop~ command at the end because it will never reach it.

~next:Bouncy rectangle~
