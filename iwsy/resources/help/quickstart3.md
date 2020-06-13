~page:contents:Contents~

# ~iwsy~ Quickstart, part 3

In ~page:quickstart:Part 1~ and ~page:quickstart2:Part 2~ we created an introduction that fades up a background panel and zooms up a title. In this part we'll add a typical presentation page, one of what would often be many having a similar format. Our theme is Italian villages and here we'll add the first one; Manarola, one of the famous Cinque Terre villages in Liguria.

Click the **Content** button opposite, then click ~img:resources/icon/plus.png:icon~ to add a new content item. Set the name to ~m:Manarola~ then paste the following text into the empty box:

> ~m:CINQUE TERRE – MANAROLA~
> ~m:Romantic Manarola – a hamlet of Riomaggiore – spills down a ravine to the wild and rugged Cinque Terre coastline. Besides its natural beauty, the village is also famous for its sweet Sciacchetrà wine, celebrated by Gabriele D'Annunzio in one of his amazing poems. Manarola has brightly painted houses, priceless medieval relics and a tiny harbour that features a boat ramp and a swimming hole; to the north, on the way to Corniglia, there's a stunning viewpoint (Punta Bonfiglio) where visitors can enjoy a drink in a bar between the village’s cemetery and the sea. Everywhere is the scent of the lemon trees, thyme, rosemary and Mediterranean maquis; the grapevines – grown on terraces – embrace the village in a tight hug.~

~img:resources/users/2020/160/1/images/quickstart/manarola-content.png:100%~

As usual, save your work, then click the **Blocks** button. We'll have a 2-column layout with text on one side and a photo on the other. Create 2 new blocks and edit them so they look like this:

~img:resources/users/2020/160/1/images/quickstart/manarola-text.png:100%~

~img:resources/users/2020/160/1/images/quickstart/manarola-photo.png:100%~

Now Click the **Steps** button. Click the **set up blocks** step. You need to add the Manarola text and photo blocks so they will be ready when needed. Make the step look like this:

~img:resources/users/2020/160/1/images/quickstart/setup-all-blocks.png:100%~

Add a new step with a 2-second pause, exactly as before, then add 2 more new steps and get them looking like this:

~img:resources/users/2020/160/1/images/quickstart/fade-down-bg.png:100%~

~img:resources/users/2020/160/1/images/quickstart/fade-up-manarola.png:100%~

Each of these 2 steps operates on a pair of blocks, and the **continue** in the first step means the following step will run without waiting for this one to finish. In this case it means the 2 fades will run concurrently as a cross-fade.

Now run your presentation. If everything is correct it should end up like this:

~img:resources/users/2020/160/1/images/quickstart/final-1.png:100%~

This is OK but obviously needs a little tweaking here and there. Start with the **manarola text** block and adjust it a little, adding a text margin on the left (which also adds the same on the right):

~img:resources/users/2020/160/1/images/quickstart/manarola-text-2.png:100%~

Next, go to the **Content**, select the **Manarola** item and put `"## "` - that's 2 # characters and a space - in front of the first word (CINQUE). Then put a line break after MANAROLA. This will turn the first line into a level 2 header.

Finally, add the following just in front of the word Romantic, at the start of the text:

~m:&#126;img:resources/users/2020/160/1/images/quickstart/cinqueterre.jpg:left 50%&#126;~

This adds an image into the text, using a custom addition to the MarkDown syntax. Everything between the 2 tildes (&#126;) is treated as a special command. It starts with **img:**, which signifies it's an image tag. The URL of the image then follows, after which is another colon then some special tags, in this case one to force the image to "float" to the left and the other being to give it 50% of its container width. Those who are familar with CSS should have little trouble seeing what's happening here.

Run the presentation again:

~img:resources/users/2020/160/1/images/quickstart/final-2.png:100%~

Ah, this is a lot better. You may want to adjust the size of the font (in the **manarola text** block) so it fills the screen better, but you'll find you get different results on different browsers. For some reason, Chrome gives smaller text than Firefox does for the same numerical value.

And with that we arrive at the end of the Quickstart tutorial. We've really only skimmed the surface but you should at least have an idea of what ~iwsy~ is all about and whether you're likely to want to use it. In the ~page:contents:Contents~ you'll find a lot more detail about all aspects of this web app, as well as contact details and an invitation to join the development team if you wish.
