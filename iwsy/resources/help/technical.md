~page:contents:Contents~

# Technical stuff

The ~iwsy~ presentation engine is about 1200 lines of vanilla JavaScript. It can be loaded from a CDN and be included in any web page. To avoid name clashes it comprises a single JavaScript object called `IWSY`.

Rather than relying on graphic libraries, ~iwsy~ leverages the power of CSS to create animated slideshows. A good deal of processing power is needed to achieve smooth animation but computer performance increases year by year, bringing improved graphic performance along with it.

All of the animations and transitions in this package have a smooth start and finish, achieved wih a cosine function.

## The UI

The UI of this website is coded in [**_EasyCoder_**](easycoder.github.io), a high-level scripting language that takes plain text scripts and compiles them in the browser as they are required. **_EasyCoder_** scripts tend to be much shorter than their JavaScript equivalents, and more importantly they are readable by any intelligent person who understands the target domain, so the long term maintenance prospects of an **_EasyCoder_** website such as ~iwsy~ are good as there will always be someone around who can learn it quickly.

The presentation engine itself can be used independently of the ~iwsy~ website. The project is [hosted on GitHub](https://github.com/easycoder/easycoder.github.io/tree/master/iwsy) as part of **_EasyCoder_** and enquiries are welcome from other programmers who are interested in contributing. The range of transition effects is currently limited so there is considerable scope for extension. An outline plug-in mechanism is present so it should be possible to enhance the system without major disruption each time.

The UI comprises about 3500 lines of EasyCoder scripts. The longest of these, at about 1100 lines, compiles in under 40ms on mid-range (core-i5) hardware.

[Pingdom Tools](https://tools.pingdom.com/) report a page load time of just over a second.

## Structure

The home page of a EasyCoder website is usually a bootloader for the application scripts themselves. These are plain text files that load on demand and are compiled on the fly by the EasyCoder runtime library. There is no build process and the only tool required is a text editor.

User management is done with a small PHP REST module that runs on the server and keeps records either in a database or in file storage. Each user is allocated a directory on the server in which are their scripts and uploaded images, the latter which are scaled to a maximum width of 1200 pixels to avoid excessive file sizes.

The ~iwsy~ website can be used without any login but the features available are restricted. In particular, the file manager is not available so if images are wanted they must be provided as independent URLs. Scripts can still be saved, but go into browser storage.

~page:contents:Contents~
