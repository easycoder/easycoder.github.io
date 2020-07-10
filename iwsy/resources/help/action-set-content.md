~page:contents:Contents~

# The `set content` action

This action calls blocks into existence and assigns content to them. Here's a typical example:

~img:https://easycoder.github.io/iwsy/resources/help/img/setup-all-blocks.png|100%~

The **Action**, **Name** and **Label** properties are present for all actions, so that just leaves **Blocks**. This is a list of blocks that will be handled by this step. For each one a **content** items is defined; blocks that are just used to hold a background image or color will leave this empty. Add another block to the list by clicking the ~img:https://easycoder.github.io/iwsy/resources/icon/plus.png|icon~ button.

When this action runs the blocks are created in the order they are listed, so a block lower down the list will mask one that's higher up if they overlap. You can change the order of display by moving blocks up using the ~img:https://easycoder.github.io/iwsy/resources/icon/up.png|icon~ buttons. You can delete any block using the ~img:https://easycoder.github.io/iwsy/resources/icon/stop.png|icon~ buttons.

Setting content does not make a block visible. To do that you need either ~page:action-show-hide:show~ or ~page:action-fade:fade up~.

Next: ~page:action-show-hide:Show or hide blocks~
