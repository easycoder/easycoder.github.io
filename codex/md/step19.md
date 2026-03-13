# Pan and Zoom #

When TV programmes show a series of images they often apply something called the "Ken Burns" Effect (named after the American documentary maker who pioneered the technique). This causes each image to slowly pan and/or zoom before dissolving into the next, giving a sense of movement. The effect was extensively used by the American documentarian after whom it was named.

In this tutorial step we'll just deal with the pan and zoom; the dissolve can wait till later.

Most of the work in the animation is done by an ~ec~ `vfx` plugin module. All the script has to do is set things up and then run it.

~copy~

The code here is designed to work with any size of image container, so all dimensions are calculated as a percentage of the parent element. The data for the animation is all held in a variable called ~code:Spec~, with 2blocks of data for the start and finish of the animation. The key items are the ~code:left~, ~code:top~ and ~code:width~ values. ~code:width~ is the percentage of the entire image that will be shown for the start or the finish of the animation. ~code:left~ is the percentage that will "hang off" to the left of the display area and ~code:top~ to the corresponding amount that will hang off the top. Since the height of the image always tracks its width, keeping the aspet ration the same, that's all we need. The data packalso includes the URL of the image, the number of steps involved and which step should cause the script to do something special, in this case to stop the animation.

All we have to do now is send regular requests to step the animation. This is done by the script rather than the plugin as it enables us to keep control over the process.

If you create more than one animation but put them all into the same variable as an array, the ~code:step~ command will run all of them, though the only ones that actually do anything will be those whose step counter hasn't yet reached its number of steps. You can restart an animation at any time by using

```
    index Anim to N
    start Anim
```

~next:The Ken Burns Effect~
