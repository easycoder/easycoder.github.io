# A bouncy rectangle #
Here's another simple animation example. This time we'll draw a rectangle whose height varies according to a sine calculation. Don't worry about the mathematics; I'll explain. Here's the code; copy it to the editor then run it so you'll know what it does.

~copy~

The gray rectangle starts off being half the height of the enclosing container, then it grows and shrinks, finally returning to its original size.

We start off by creating the container, giving it a width that's 90% of the enclosing panel. Without the margin style this would cause it to sit hard up against the left of the panel. You'll have to read up on The CSS style ~code:margin~ to get the full syntax details, but in short, using auto for the left and right margins forces them to divide up the free space between them so the box sits centrally.

The rectangle is set to occupy 9% of the container's width and to have a border and background. The ~code:position~ style is another CSS goodie that's too involved to explain here; basically it allows us to set the position of the top of the element. Without ~code:position~ and ~code:top~ it would just stick to the top of the box. The rectangle is forced to have its top half-way down the container (in the computer world, the top of a container is always zero and bigger values are downwards).

Don't be put off by the apparent complexity of CSS. It's well worth spending some time reading up on it, but in the end you just have to try things out. The great thing about using the ~ec~ editor is you can experiment until you succeed in making it work.

So far, we have a gray rectangle in a larger box. The next command is ~code:wait 2 seconds~, which does just that. You can use ~code:wait~ to pause a script for any number of ~code:millis~ (milliseconds), ~code:ticks~ (100ths of a second), ~code:seconds~ or ~code:minutes~. In all cases the final ~code:s~ is optional.

Now for the animation itself. We use a variable ~code:Angle~ to count from 0 to 360. This is the number of degrees in a circle. If you're not mathematically inclined, try to visualize a clock with a second hand going around it. It's a rather odd second hand that stretches right across the clock from one edge to the other. If you were to look at the clock edge-on you wouldn't see the rotary movement; the second hand would just appear to get longer and shorter as it journeys around the dial. The mathematical sine function tells us the apparent length of the second hand at any point in its progression around the dial. In our example the diameter of the clock is 200 pixels (so the radius is 100 pixels) and the apparent length, seen end-on, varies from 0 to 200 pixels. (Exactly the same principle applies to the length of the day as the seasons change. So you see, maths can be useful.)

The calculation ~code:sin Angle radius 100~ takes care of all this so I'll say no more about it. We use the resulting ~code:Height~ value to compute the new top of the rectangle and its new height.

There are a couple of calculations done in the CSS styles. The top of the rectangle is the 50% point as before but with the sine value subtracted from it. Similarly, the height of the rectangle is basically 100 pixels but with the sine value added.

~next:The Mexican Wave~
