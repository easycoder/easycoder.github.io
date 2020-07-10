~page:contents:Contents~

# The `animate` action

This action a visual effect on the content of a bock. At present there is only pan/zoom, used to create the "Ken Burns" effect that makes still photos look a little like video.

This action performs a visual effect on one or more blocks. Each of the blocks has content which contains a special Markdown extension that defines the visual effect to be applied. The format is

~m:&#126;vfx:100% manarola&#126;~

where ~m:manarola~ is the name of the effect in the ~m:VFX~ section of the script. You can have any number of animations in a single content block, though more than one is usually over-doing it.

The parameters needed for the effect are as follows:

~img:https://easycoder.github.io/iwsy/resources/help/img/animate.png|100%~

Here the type is defined as a ~m:panzoom~ (it's currently the only option available). The name then follows. Next we have the aspect ratio of the container that holds the image being manipulated, the URL of that image and the duration of the effect in seconds.

The effect works by magnifying the image and using the container as a "window" onto a part of the magnified image. By moving the window and altering the magnification we achieve the pan and zoom effect.

There are 2 groups of 3 parameters, one for the start of the effect and the other for the end. Each of the sets of values are as follows:

 1. the size (magnification).
 1. the offset of the left-hand edge of the image from the left-hand edge of the container. Negative values cause the image to position to the left of the container, so in general the values will all be negative or zero.
 1. the offset of the top edge of the image from the top of the container. Negative values cause the top of the image to position above the container.

In all cases the values are expressed as a percentage of the container width or height.

The animation follows a cosine function that causes it to start slowly, accelerate towards the middle of the effect the deccelerate towards the end, giving a smooth start and finish.

To use a sequence of images, each with its own Ken Burns specification, fade down the current item and fade up the next, in each case with the ~m:continue~ flag set to ~m:yes~, then follow these with the animation itself. With the right fade duration this will give you a smooth transition during the period the animation is moving at its slowest. You may also have to ensure the images are preloaded (cached) to avoid stuttering as a new animation starts.

You can see an example running on the ~page:iwsy:Home~ page of this documentation.

Next: ~page:action-pause:Pause~
