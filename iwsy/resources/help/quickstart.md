~page:contents:Contents~

# ~iwsy~ Quickstart

This tutorial will quickly take you through all the steps needed to build your first ~iwsy~ presentation. Everything you need is here and everything will be explained. You don't have to register with ~iwsy~ to try it out, so no messing around with login and registration screens. 

Presentations can be simple or they can be highly complex and detailed. The computer can't tell what's in your head so everything has to be spelled out in minute detail. With ~iwsy~, much of the work is in the preparation; deciding what the presentation should look like, its block positions and sizes, what transitions and effects are wanted and so on. Once these things are out of the way the remainder of the work gets a lot simpler. This tutorial covers some of the things you  will need if you are to do any more than just present one static slide after another. It's likely you'll need at least an hour to complete this tutorial.

The first thing to do is define a _block_. This is an area of the screen having a defined position and size, to contain text and/or images.

## Your first block

Click the **Blocks** button over in the right-hand panel, then click the ~img:/resources/icon/plus.png:icon~ at the right-hand end of the title row. Now click the button titled "New Block". You should get this:

~img:resources/users/2020/160/1/images/quickstart/newblock.png:100%~

Most of these default values are fine as they are; they describe a block that occupies the whole window area. Let's just change the ~m:name~ property to ~m:background~ and the ~m:background~ property to ~m:url('resources/users/2020/160/1/images/SemoigoDawn.jpg')~. When the presentation runs, the effect will be to display a full-size image. This is what the panel should look like now:

~img:resources/users/2020/160/1/images/quickstart/first-block.png:100%~

Now let's save our work. There's a **Save** button in the editor panel but this just anchors your changes and updates titles etc. You really need to save the entire project. If you are registered it will go to the ~iwsy~ website, but if not it will be saved to your browser's own storage space. Type the name ~m:quickstart~ in the **Script name** box under the main button bar, then click the ~img:/resources/icon/save.png:icon~ icon in the button bar. It's highly recommended that you click this button regularly so you don't lose your work in the event of something going wrong.

The effect I want to create is for the image to fade up from the white of the screen background. So let's go to to the **Steps** editor and make that happen. 

## Adding some steps

The ~m:init~ step is fine as it is so there's no need to touch it. Click the ~img:/resources/icon/plus.png:icon~ to add a new step, then click the **New step** button. You should see this:

~img:resources/users/2020/160/1/images/quickstart/newstep.png:100%~

Click in the Action box and a drop-down list appears:

~img:resources/users/2020/160/1/images/quickstart/actions.png:100%~

Choose ~m:set~ ~m:content~. Now set the ~m:Name~ property to ~m:set up background~, then click **Save**. It should now look like this:

~img:resources/users/2020/160/1/images/quickstart/setup-background.png:100%~

The ~m:set~ ~m:content~ action lets you set up any number of blocks at the same time, though here we only have one. Click the ~img:/resources/icon/plus.png:icon~ in the **Blocks** row, then click the empty selector under the **Blocks** title. A drop-down list appears with the name of the block we created earlier:

~img:resources/users/2020/160/1/images/quickstart/select-background-block.png:100%~

so select that. The block has no text, but if it did we'd choose it in the **Content** drop-down list. Click the **Save** button for this step, then click the ~img:/resources/icon/save.png:icon~ icon in the button bar.

## Fading up

Now we have a block with a background, let's fade it up. Click ~img:/resources/icon/plus.png:icon~ again or click the **Add step after** button. In the new step, open the editor, give it the name ~m:fade up background~ and select the **fade up** action. It should look like this:

~img:resources/users/2020/160/1/images/quickstart/fade-up-background.png:100%~

This action lets you fade up as many blocks as you like simultaneously, so it provides you with the means to add a list. Here we only have a single block so let's add that. Click the ~img:/resources/icon/plus.png:icon~ in the **Blocks** row, then click the empty selector in the new row and choose **background** again. Finally set the duration of the fade to a suitable value; say 2 (seconds). You can use decimal fractions here if you need to. It should now look like this:

~img:resources/users/2020/160/1/images/quickstart/fade-up-background2.png:100%~

If you haven't saved your project recently, do it now.

## Watch it run!

Now it's time to test your work. This will cause the help panel to disappear, but don't worry; you can bring it back by clicking the ~img:/resources/icon/help.png:icon~ button in the toolbar.

You have 2 run options. The ~img:/resources/icon/run.png:icon~ button runs the presentation inside ~iwsy~, in the left-hand panel currently occupied by this Help page. The ~img:/resources/icon/fullscreen.png:icon~ button runs it full-screen. Note that the full-screen mode doesn't always start up properly; if you have trouble then put your browser into full-screen mode yourself before clicking ~img:/resources/icon/fullscreen.png:icon~.

Click the ~img:/resources/icon/run.png:icon~ or ~img:/resources/icon/run.png:icon~ icon in the button bar and enjoy watching your steps run!

A couple of things to note. One is that as the presentation runs the steps in the editor take on green backgrounds. With only a single fade this happens too quickly to see, but in a longer presentation you can see where you are at all times.

Another thing is that you can click the ~img:/resources/icon/binoculars.png:icon~ icon for any step to see what the presentation looks like at that step. The program invisibly runs the entire presentation up to the step you clicked, then runs that step, giving the button a blue background.

in ~page:quickstart2:Part 2~ we'll add some text to the presentation.
