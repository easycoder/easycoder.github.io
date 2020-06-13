~page:contents:Contents~

# The `fade up` and `fade down` actions

This action fades one or more blocks up or down by varying their opacity.

~img:resources/users/2020/160/1/images/quickstart/action-fade.png:100%~

The **Action**, **Name** and **Label** properties are present for all actions.

The **Blocks** property is a list of blocks that will be handled by this step. Add another block to the list by clicking the ~img:resources/icon/plus.png:icon~ button.

The **Duration** property is the time in seconds the fade should take.

The **Continue** is **true** or **false**. It governs whether the next step should run at the same time as this one (**true**) or if it should wait until the fade has completed (**false**). A common use for this is to implement a crossfade, where one scene dissoves into another. The **fade down** and **fade up** steps both have the same **Duration** and the first one has **Continue** set **true**. There's also a separate **Crossfade** action; see the documentation ~page:action-crossfade:here~.

When this action runs the blocks referenced are all faded at the same time. You can change the order of display by moving blocks up the list using the ~img:resources/icon/up.png:icon~ buttons. (This has no effect on the show; it's just a convenience for the programmer.) You can delete any block using the ~img:resources/icon/stop.png:icon~ buttons.

Fades and other animated effects run at 25 frames/sec, as a compromise between visual smoothness and processing requirements.

Next: ~page:action-crossfade:Crossfade block content~
