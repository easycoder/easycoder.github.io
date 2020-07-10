~page:contents:Contents~

# ~iwsy~ Quickstart, part 2

In ~page:quickstart:Part 1~ we created a presentation that just fades up a background panel. In this part we'll add some text to it and look at some of the actions available.

After the background has appeared, let's hold it on the screen for a couple of seconds. As before, add a new step at the end of your presentation, then go into its editor and name it ~m:pause 2 seconds~. Click the empty selector next to the **Action** label and select the **pause** option. Set the **Duration** to ~m:2~ then save the step (or click ~img:/resources/icon/save.png:icon~ as before).

We're going to bring up some text in the center of the screen, zooming it from a point below the center line. This presentation is to be some slides about villages in Liguria, the region of Italy that borders the northern Mediterranean, so let's create our first content item. Click the **Content** button and then the ~img:/resources/icon/plus.png:icon~ icon. Open the editor for the new item; it should look like this:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/new-content.png|100%~

Set the name to ~m:Ligurian villages~ then put the same text into the empty box. As usual, save your work.

What you've done is create a content item whose name is the same as its content (but it usually won't be). When you refer to the name in the **Steps** editor you get the content, so if you use the same content in several places this saves repeating it each time and ensures all the affected slides get changed at once.

The title will end up in the middle of the screen, but to make it more challenging let's get it to zoom up from a point in the bottom third of the screen. For this we need 2 blocks. One holds the text and defines the starting point of the zoom effect. The other holds the final position of the block after the zoom has finished.

Click the **Blocks** button and create 2 new blocks (I'm assuming you know how to do that; we covered it in ~page:quickstart:Part 1~). Make the first one look like this:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/main-title.png|100%~

and the other like this:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/center-title.png|100%~

The differences are in the ~m:top~, ~m:height~ and ~m:fontSize~ values. The transition effect you'll be using animates the text as it moves from the first to the second state. It can also change the color of the text as it goes, but we're not doing that here.

All of the numbers you see are _mils_ - that's thousandths of the width or height of the block's container, normally the window. (Though you can use the **parent** field to make a block a child of another block.) If you are proficient with CSS and would like to use its values you can do so, but the results can vary from one screen to another. The sharp-eyed may also be wondering why the **top** value of the second block is only set at 150; this is because the text renderer displays items as HTML ~m:&gt;p&lt;~ tags with margins and padding set by your browser. There are ways to get round this; see the detailed manual pages.

You may like to note that in the **Blocks** panel each block has a ~img:https://easycoder.github.io/iwsy/resources/icon/binoculars.png|icon~ icon next to it. If you click one of these you will see where your block is on the screen.

Now go to the **Steps** panel. The first thing to do is to initialize the **main title** block by adding it to the set of blocks that are initialized in the **set up background** step, so click this step to open its editor:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/setup-background.png|100%~

Click the ~img:https://easycoder.github.io/iwsy/resources/icon/plus.png:icon~ in the **Blocks** row to add a new block. Select the **main title** block and then select **Ligurian villages** from the **Content** drop-down list. Change the name of the step to **set up blocks** and the result should be:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/setup-blocks-2.png|100%~

If you prefer, you can add a separate step to initialize each block, but in this case we'll do them all at the same time, in one place.

The animated text effect is done with a **transition** action. Add a new step to your presentation, choose the action type **transition** and call it **zoom up title**. Set **block** to **main title** and **target** to **center title**:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/zoom-title.png|100%~

Now you can run your presentation again. The background will fade up first, then after a couple of seconds the text will zoom up.

Add another pause, say 3 seconds, then another action, selecting **fade down**. Call it **fade down title and background**. Add 2 blocks, picking **main title** and **background**. Set the duration to 2 seconds. You should have this:

~img:https://easycoder.github.io/iwsy/resources/help/quickstart/fade-down.png|100%~

Finally, add another pause of a second.

In the ~page:quickstart3:final part of this tutorial~ we'll add the first of what might in a real presentation be a large number of similar slides, each one describing a different Ligurian village.
