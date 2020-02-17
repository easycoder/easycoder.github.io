# Pan and Zoom #

When TV programmes show a series of images they often apply something called the "Ken Burns" Effect. This causes each image to slowly pan and/or zoom before dissolving into the next, giving a sense of movement. The effect was extensively used by the American documentarian after whom it was named.

In this tutorial step we'll just deal with the pan and zoom; the dissolve can wait till later.

~copy~

The code here is designed to work with any size of image container, so all dimensions are calculated as a percentage of the parent element. ~ec~ only works with integers so we deal with floating point values by exploiting the fact that each one is just one integer divided by another. So the first thing is to define the aspect ratio of the main container as a width and a height component. Then we create the container, giving it 90% of the width of its parent. We can immediately ask the system how wide this is in pixels, then we calculate the corresponding height and set it. We also get it to hide any content that falls outside its boundary.

Next we set up some test values. All except the last one are percentages of the width or height of the container and they define the values at the start of the animatuion and at the finish. L is "left", T is "top" and W is "width". The final value is the number of steps in the animation.

Next we calculate the sizes of each step for the left, top and width. Because these are actually fractional values we scale everything by a large value (1000) to maintain precision in the division operations. You'll see shortly how this is used to achieve a smooth pan or zoom.

Now we can create the image, give it a source URL and set its size and position to the initial values in the test data. The position style attribute is ~code:absolute~ so we can use specific dimensions inside the container.

Next we create high-precision working variables L, T and W, initialised to the starting values.

~code:while true~ ensures that the animation will run forever. Inside, each step of the animation adds the step values to the working variables and uses these to set the location and size of the image. Here we exploit a very clever feature of the browser's style processing engine, by giving it a calculation to do. To explain: if we ask for a position or size value using a calculation such as ~code:calc(142581px / 1000)~ the actual value used will be 142.581 pixels; a fractional value. The amazing thing is that the browser actually uses this value to position the image. If it were to just use the nearest integer the image would jitter badly as it moves or scales, but with the fractional value the jitter disappears and the movement is smooth. This technique works on all the browsers I've tested.

~next:...~
