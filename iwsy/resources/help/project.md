~page:contents:Contents~

# The Project panel

The right-hand side of the screen holds the Project panel. When you start up - or after you click the ~img:https://easycoder.github.io/iwsy/resources/icon/new.png|icon~(New) button - it looks like this:
~img:https://easycoder.github.io/iwsy/resources/help/img/project.png|100%~

There are 3 main sections.

## 1 - Steps

This lists the steps of your presentation. These are in some way analogous to the 'slides' of a PowerPoint presentation. A step is any action that affects the presentation, whether it causes a visual change or not. Every presentation starts with an `init` step where you define the size and proportions of your screen. This step is already provided, with its name on a clickable button. When you click the button it opens the ~page:action-init:`init` step editor~. All the action types are documented in their own pages - see the ~page:contents:Contents~.

To the left of the button is a tiny ~img:/resources/icon/binoculars.png:icon~ binoculars symbol. When you click one of these the panel on the left - called the _player_ - shows you what the presentation looks like at this step.

To the right of the button is a ~img:/resources/icon/plus.png:icon~ plus symbol, that when clicked adds a new step to the end of the presentation. See ~page:addStep:Adding a step~.

## 2 - Blocks

This lists the blocks used in your presentation. A block is a rectangular area of the screen that can contain text, an image or some of each.

It's common to use the same layout for multiple slides in a presentation, and one of the problems with PowerPoint is how difficult it is to change a layout once set. Sometimes the only way is to edit the numerical coordinates of the text and other blocks on each slide; a time-consuming and error-prone task.

~iwsy~ takes a different approach. You define all the different type of block that will be used, giving each one a name, then use them on as many slides as you like. To make changes you then just need to edit the block definition; all the slides that use it will take on the new size and position. See ~page:addBlock:Adding a block~.

## 3 - Content

This lists all the content text items used in your presentation. Each one is named. In the step editor you assign content to blocks by clicking names from a drop-down list. This makes it much easier to see what is where than by having the full text visible at each point.

All content text is written using **_MarkDown_**; a format that is mostly plain text, plus simple markup tags to define headers and other text features. ~iwsy~ provides a set of custom MarkDown extensions that define image and other attributes. These help pages are written using the same system. See ~page:addContent:Adding content~.
