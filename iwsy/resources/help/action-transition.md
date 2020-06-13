~page:contents:Contents~

# The `transition` action

This action performs any combination of zoom, move and changing text size and/or color.

~img:resources/users/2020/160/1/images/quickstart/zoom-title.png:100%~

The **Action**, **Name** and **Label** properties are present for all actions.

The **Block** property is the block that will be handled by this step.

The **Target** property is a block whose attributes represent the _target_ of the transition.

The **Duration** property is the time in seconds the transition should take.

The **Continue** is **true** or **false**. It governs whether the next step should run at the same time as this one (**true**) or if it should wait until the effect has completed (**false**).

When this action runs, the attributes of the named block are gradually transitioned into those held by the target block. This is done for the block size and position, the size of the text and the color of the text. A variety of effects can be achieved with this, such as

 - Blocks can be moved in any direction; even off the screen completely
 - Blocks can be resized
 - The size of text can be increased or decreased
 - The color of text can be changed

All of these effects apply to text blocks; the first two also apply to blocks that just have a background image.

When the color of text is to be changed, the size values in both **Block** and **Target** must be expressed in the form **#RRGGBB**, where **RRGGBB** carries the hex values of the red, green and blue components of the color.

Fades and other animated effects run at 25 frames/sec, as a compromise between visual smoothness and processing requirements.
