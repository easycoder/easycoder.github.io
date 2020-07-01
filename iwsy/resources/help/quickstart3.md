~page:contents:Contents~

# ~iwsy~ Quickstart, part 3

In ~page:quickstart:Part 1~ and ~page:quickstart2:Part 2~ we created an introduction that fades up a background panel and zooms up a title. In this part we'll add some typical presentation page, one of what would often be many having a similar format. Our theme is Ligurian villages and here we'll add the first one; Manarola, one of the famous Cinque Terre villages.

Click the **Content** button opposite, then click ~img:resources/icon/plus.png:icon~ to add a new content item. Set the name to ~m:Manarola~ then paste the following text into the empty box:

> ~m:Cinque Terre - Manarola~
> ~m:Romantic Manarola – a hamlet of Riomaggiore – spills down a ravine to the wild and rugged Cinque Terre coastline. Besides its natural beauty, the village is also famous for its sweet Sciacchetrà wine, celebrated by Gabriele D'Annunzio in one of his amazing poems. Manarola has brightly painted houses, priceless medieval relics and a tiny harbour that features a boat ramp and a swimming hole; to the north, on the way to Corniglia, there's a stunning viewpoint (Punta Bonfiglio) where visitors can enjoy a drink in a bar between the village’s cemetery and the sea. Everywhere is the scent of the lemon trees, thyme, rosemary and Mediterranean maquis; the grapevines – grown on terraces – embrace the village in a tight hug.~

~img:resources/help/quickstart/manarola-content.png:100%~

As usual, save your work, then click the **Blocks** button. We'll have a 2-column layout with text on one side and a photo on the other. Create 2 new blocks and edit them so they look like this:

~img:resources/help/quickstart/manarola-text.png:100%~

~img:resources/help/quickstart/manarola-photo.jpg:100%~

Now Click the **Steps** button. We need a **set content** step; we could add to the one we created at the start but sometimes it makes more sense to do it where it will be used. Add a new step; pick the **set content** action, call it **setup manarola** then add a block; pick **manarola text** and for its content pick **manarola**. Make the step look like this:

~img:resources/help/quickstart/setup-manarola.png:100%~

This operation may need time to complete, so let's do it before the block is visible. Add a **pause** of 1 second.

Now add another new step and get it looking like this:

~img:resources/help/quickstart/fade-up-manarola.png:100%~

This step operates on a pair of blocks, which will fade up concurrently. Note that the fade animation will not wait for the content to be ready before starting. Where text has embedded images it takes time to download and render them; this is done at the **set content** step so it's always best to have a pause just after to allow the processing work to complete.

Now run your presentation. If everything is correct it should end up like this:

~img:resources/help/quickstart/manarola-1.jpg:100%~

This is OK but obviously needs a little tweaking here and there. Start with the **manarola text** block and adjust it a little, adding a text margin on the left (which also adds the same on the right):

~img:resources/help/quickstart/manarola-text-2.png:100%~

Next, go to the **Content**, select the **Manarola** item and put `"## "` - that's 2 # characters and a space - in front of the first word (CINQUE). Then put a line break after MANAROLA. This will turn the first line into a level 2 header.

Finally, add the following just in front of the word Romantic, at the start of the text:

~m:&#126;img:resources/help/quickstart/cinqueterre.jpg:left 50%&#126;~

This adds an image into the text, using a custom addition to the MarkDown syntax. Everything between the 2 tildes (&#126;) is treated as a special command. It starts with **img:**, which signifies it's an image tag. The URL of the image then follows, after which is another colon then some special tags, in this case one to force the image to "float" to the left and the other being to give it 50% of its container width. Those who are familar with CSS should have little trouble seeing what's happening here. The markup causes HTML to be generated to perform the desired task, but you can in fact insert HTML directly into the file if you need some feature we don't offer. (Though this somewhat negates the purpose of using MarkDown in the first place.)

Run the presentation again:

~img:resources/help/quickstart/manarola-2.jpg:100%~

Ah, this is a lot better. You may want to adjust the size of the font (in the **manarola text** block) so it fills the screen better, but you'll find you get different results on different browsers. For some reason, Chrome gives smaller text than Firefox does for the same numerical value.

The rest of the items are similar to what we already have. Create another **Content** item called **Apricale**, with this content:

> ~m:## Provincia di Imperia - Apricale~
> ~m:&#126;img:resources/help/quickstart/imperia.jpg:left 50%&#126;Apricale is a picturesque small village to the north-east of Dolceacqua in western Liguria and surrounded by forested hills, included on the list of the 'most beautiful villages in Italy'.~
> ~m:Just one of several attractive hill villages in this region, Apricale is compact and easy to explore. Most of the sights of interest are on or very close to the square in the centre of the village, although of course you will also want to follow the main street along the ridge to enjoy more views and to appreciate the medieval character of Apricale."~

Create a third village **Content** item called **Noli**:

> ~m:## ## Provincia di Savona - Noli~
> ~m:&#126;img:resources/help/quickstart/savona.jpg:left 50%&#126;The seaside village of Noli lies a few km west of Savona, in the central part of Liguria. Although popular with Italians it's scarcely known to anyone else outside of the area. It's a beautiful quiet and relatively unspoiled gem, with a good beach and right behind it the old town with pedestrian-only streets and a sprinkling of shops and restaurants, all preserving the ancient architecture and topped by a small castle. Although it lies on the main &quot;Via Aurelia&quot; coast road, all the through traffic now goes on the Autostrada, leaving Noli free from noisy vehicles. The coast road is also spectacular and it's well worth forsaking the motorway to explore the coastline between Savona and the busy resorts of Finale Ligure and Loano."~

Then create 2 more pairs of **Blocks** similar to the ones for **Manarola**, calling them **apricale text**, **apricale photo**, **noli text** and **noli photo**. The 3 text blocks are in fact identical; the photo blocks only differ by the name of the image file; these 2 are **apricale.jpg** and **noli.jpg**.

Create a **set content** item for **Apricale** similar to the one for **Manarola**.

Add a **pause** of a suitable length - say 10 seconds - to hold the **Manarola** page.

The transitions from one village to the next comprise a fade-down and a fade-up, running concurrently. So for the **Manarola** to **Apricale** transition, add a new **Step**, choosing the **fade down** action. Add both the **manarola text** and **manarola photo** blocks, choose a suitable duration and set the **Continue** flag **true**. This will cause the next action to start without waiting for this one to complete. As both animations run concurrently they give the impression of a crossfade.

The action in question is a new **fade up** action. Give it the **apricale text** and **apricale photo** blocks, use the same duration as the fade down but leave **Continue** **false**.

By this time you should be able to handle the transition from **Apricale** to **Noli** without any help.

As described earlier, after each pair of fade down and fade up, prepare the next item with **set content** and put in a 10-second pause. When you have finished, your presentation should run as a simplified version of the demo that appears on ~page:iwsy:the main Help page~.

And with that we arrive at the end of the Quickstart tutorial. We've really only skimmed the surface but you should at least have an idea of what ~iwsy~ is all about and whether you're likely to want to use it. In the ~page:contents:Contents~ you'll find a lot more detail about all aspects of this web app, as well as contact details and an invitation to join the development team if you wish.
