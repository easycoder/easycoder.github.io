# The Ken Burns Effect #

In this tutorial step we'll complete the Ken Burns Effect by adding some more images and a dissolve between them. Each of the images will animate according to its own set of rules so the overall effect is one of continuous movement. On TV this gives an impression of watching a video rather than a slide show, which is why the effect is so popular.

~copy~

Most of the code is the specifications for each of 9 images. (The images are all of arbitrary scenes in northern Italy). The code does much the same as for the pan/zoom example except that it repeats itself in a loop, once for each of the images. This is all handled by making ~code:Anim~ and ~code:Spec~ arrays of 9 elements each.

The key to the effect is in the transitions. At the top we define the style that will cause an image to fade in or out from one level of opacity to another. The code arranges for the current image to fade out while the next image fades in, creating a dissolve. We set a trigger on each image to be one second before the end of its zoom/pan so the dissolve happens at the end of one image and the start of the next. The zoom/pan for the 2 images run concurrently and the images are set up as a circular list so the effect runs forever.

~next:...~
