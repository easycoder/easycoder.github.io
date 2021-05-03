# How It Works

This is a description of the interaction between the ~ec~ and the Markdown scripts to power this website. You should be able to follow the flow as I name the files involved.

Before I start I should explain that ~ec~ uses the ~code:Showdown~ Markdown library to add custom features to the regular `Markdown` set. I may refer to ~code:Showdown~ and `Markdown` interchangeably.

In `index.html` the boot script loads and runs `main.ecs`, whose main role is to control the menu panel on the home page. It sets up button variables and module handlers, each of which is initialized with a script for the functions it performs. Not all of the module handlers have a corresponding button; some are called from regular hyperlinks in the text. The code loads the script for each module then runs it, which initializes the module then waits for a message.

Let's start with one of the simplest possible cases, where the user clicks the `Wordpress` button. This will cause a message to be sent to the `wordpress.ecs` module. The module only ever expects to receive one kind of message, so the content is empty. The module will already have loaded the `wordpress.md` Markdown file, so all it needs to do on receiving the message is to call the ~code:Showdown~ module, passing it the page script. This is formatted by ~code:Showdown~ and placed in the main viewing panel.

Interactions between the ~ec~ and ~code:Showdown~ scripts occur in 2 ways:

 1 `Markdown`/~code:Showdown~ can include HTML sections according to your needs. If a hyperlink element with an id is placed in the `.md` script, ~ec~ can attach one of its own variables to the hyperlink and detect when it is clicked.

 1 In the same way, any element with an id can have its content altered at will by ~ec~. This allows the page to change dynamically under script control.

 There's a fair amount of detail that I've glossed over by picking the simplest example, but this should at least provide an indication of where to start gaining an understanding of the code.