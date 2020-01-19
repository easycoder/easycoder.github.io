# Our philosophy #

"It's very easy to make things complicated, but it's very hard to make them simple".

~ec~ **_Software_** has a mission: to make complicated things simple. We created ~ec~ because JavaScript is just too hard for most people to learn, yet many of the things that people want it to do can be easily expressed in English. So we figured if we can't make everyone a programmer, let's make programming easy for everyone. ~ec~ is the result of our efforts.

## Analysis ##

The mainstream software industry is driven by the desires of top developers to achieve results quickly. While this works quite well for big projects and in large teams, there are 2 areas in which it falls down badly. The first is that it fails to allow for people with lower skill levels, and the second - deriving from the first - is that it takes little to no account of future maintenance needs.

Although JavaScript is a mature programming language it is continually evolving and in the process becoming more complex. Fortunately, because of the need for older websites to go on working, it continues to support old code. This means a project can be written using a 10-year old version of JavaScript (if that is the preference of the programmer) with little risk of it not working.

Such a suggestion will be greeted with horror by most professional programmers, but we are in a world where not everyone is a professional. Much as the industry would like to monopolize all programming activity, the reality is that many projects will be maintained by people who do not have up-to-date skills.

The language itself, however, is only half of the problem. The other half is the prevalence of complex frameworks designed to overcome shortcomings in the language itself. These tend to be massively complex, but also to have short life spans before they are rendered obsolete by newer and more fashionable frameworks. The consequences for long-term maintenance are severe; after a few years it is likely that nobody will be available with any knowledge of the framework used. Given the complexity of frameworks, it's also likely that even an experienced programmer will have difficulty in figuring out how the code works in order to make changes to it or fix bugs.

Large professional programming teams do not see these problems; they are unaffected by them as they always have the resources they need to maintain continuity. For many smaller projects, however, this is far from being the case.

## A fresh view ##

The great majority of websites can be described in plain English, if necessary by focusing on one block at a time. Indeed, if a website is too complex to describe it's probably also too complex to use. So the idea that complex tools and frameworks are essential is for many sites a flawed one unless you start with the view that frameworks are always good and should be used at all times.

Here's a very approximate calculation. We estimate the total amount of effort that will be expended during development and maintenance, then multiply each part by the cost of the people that will be needed. It immediately becomes clear that there's a trade-off between the complexity of the development tools and the skill levels of the developers. With less complex tools, development may take longer (though we would in fact dispute that because simpler tools are quicker to learn) but cost less, and the maintenance cost is also lowered. There are so many factors in play that the calculation can only be heuristic (i.e. not rigorous), but if we compare building and running a new Facebook with, say, a local real-estate website then it's quite likely the former would benefit from the latest technology but the latter might well not.

It's in the latter category that tools like ~ec~ provide a viable alternative to the current mainstream. Any website that will require maintenance at a level that does not justify the retention of high-level skills will become unmaintainable if development assumes such skills will always be present.

## Technical overview ##

~ec~ is about language, not structure. For a brief summary of how it works, see here.
