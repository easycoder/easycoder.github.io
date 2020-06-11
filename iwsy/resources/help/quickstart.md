~page:contents:Contents~

# Quickstart

This tutorial will quickly take you through all the steps needed to build your first IWSY presentation. Everything you need is here and everything will be explained.

We don't need to log into IWSY, so that's some time saved already. The first thing to do is define a _block_. This is an area of the screen having a defined position and size, to contain text and/or images.

## Your first block

Click the **Blocks** button over in the right-hand panel, then click the ~img:/resources/icon/plus.png:{width:1em}~ at the right-hand end of the title row. Now click the button titled "New Block". You should get this:

~img:resources/users/2020/160/1/images/quickstart/newblock.png:100%~

Most of these default values are fine as they are; they describe a block that occupies the whole window area. Let's just change the 'name' property to `background` and the 'background' property to `url('resources/users/2020/160/1/images/SemoigoDawn.jpg')`. The effect will be to display a full-size image.

The effect I want to create is for the image to fade up from the white of the screen background. So let's go to to the **Steps** editor and make that happen. But before we do so, let's save our work. Type the name `quickstart` in the **Script name** box under the main button bar, then click the ~img:/resources/icon/save.png:{width:1em}~ icon in the button bar. It's highly recommended that you click this button regularly so you don't lose your work in the event of something going wrong.

## Adding some steps

The `init` step is fine as it is so there's no need to touch it. Click the ~img:/resources/icon/plus.png:{width:1em}~ to add a new step, then click the **New step** button. You should see this:

~img:resources/users/2020/160/1/images/quickstart/newstep.png:100%~

Click in the Action box and a drop-down list appears:

~img:resources/users/2020/160/1/images/quickstart/actions.png:100%~

Choose `set content`. Now set the `name` property to `set up background`. It should now look like this:

~img:resources/users/2020/160/1/images/quickstart/setup-background.png:100%~

Click the ~img:/resources/icon/plus.png:{width:1em}~ in the `Blocks` row, then click the empty selector under the `Blocks` title. A drop-down list appears with the name of the block we created earlier:

~img:resources/users/2020/160/1/images/quickstart/select-background-block.png:100%~

so select that. The block has no text; if it did we'd choose it in the `Content` drop-down list. Click the **Save** button for this step, then click the ~img:/resources/icon/save.png:{width:1em}~ icon in the button bar.

## Fading up

Now we have a block with a background, let's fade it up. Click ~img:/resources/icon/plus.png:{width:1em}~ again or click the **Add step after** button. In the new step, open the editor, give it the name `fade up background` and select the **fade up** action. It should look like this:

~img:resources/users/2020/160/1/images/quickstart/fade-up-background.png:100%~

This action lets you fade up as many blocks as you like simultaneously, so it provides you with the means to add a list. Here we only have a single block so let's add that. Click the ~img:/resources/icon/plus.png:{width:1em}~ in the **Blocks** row, then click the empty selector in the new row and choose **background** again. Finally set the duration of the fade to a suitable value; say 2 (seconds). You can use decimal fractions here if you need to. It should now look like this:

~img:resources/users/2020/160/1/images/quickstart/fade-up-background2.png:100%~

If you haven't saved your project recently, do it now.

## Watch it run!

Now it's time to test your work. This will cause the help panel to disappear, but don't worry; you can bring it back by clicking the ~img:/resources/icon/help.png:{width:1em}~ button in the toolbar.

Click the ~img:/resources/icon/run.png:{width:1em}~ icon in the button bar and enjoy watching your steps run!

A couple of things to note. One is that as the presentation runs the steps in the editor take on green backgrounds. With only a single fade this happens too quickly to see, but in a longer presentation you can see where you are at all times.

Another thing is that you can click the ~img:/resources/icon/binoculars.png:{width:1em}~ icon for any step to see what the presentation looks like at that step. The program invisibly runs the entire presentation up to the step you clicked, then runs that step, giving the button a blue background.

in ~page:quickstart-part2:Part 2~ we'll add some text to the presentation.
