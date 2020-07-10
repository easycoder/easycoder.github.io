~page:contents:Contents~

# The `crossfade` action

This action crossfades the text of a block, replacing it with new content.

~img:https://easycoder.github.io/iwsy/resources/help/img/action-crossfade.png|100%~

The **Action**, **Name** and **Label** properties are present for all actions.

The **Block** property is the block that will be handled by this step.

The **Target** property is the **Content** item that will replace the text currently in the block.

The **Duration** property is the time in seconds the crossfade should take.

The **Continue** is **true** or **false**. It governs whether the next step should run at the same time as this one (**true**) or if it should wait until the effect has completed (**false**).

When this action runs, the text of the block is replaced by that of the text held in **Target**. The original text is faded down and the new is faded up at the same time, over the duration given. A similar effet can be obtained using **fade up** and **fade down**, but **crossfade** has the advantage that the result is in the same block as before, so if you are running a set of slides where the text in a block keeps changing, then the **crossfade** is much simpler.

Fades and other animated effects run at 25 frames/sec, as a compromise between visual smoothness and processing requirements.

Next: ~page:action-transition:Transition a block~
