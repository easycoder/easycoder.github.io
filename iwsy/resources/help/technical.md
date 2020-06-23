~page:contents:Contents~

# Technical stuff

The UI of this website is coded in [**_EasyCoder_**](easycoder.github.io), a high-level scripting language that takes plain text scripts and compiles them in the browser as they are required. **_EasyCoder_** scripts tend to be much shorter than their JavaScript equivalents, and more importantly they are readable by any intelligent person who understands the target domain, so the long term maintenance prospects of an **_EasyCoder_** website such as ~iwsy~ are good as there will always be someone around who can learn it quickly.

The presentation engine itself can be used independently of the ~iwsy~ website. The project is hosted on GitHub as part of **_EasyCoder_** and enquiries are welcome from other programmers who are interested in contributing. The range of transition effects is currently limited so there is considerable scope for extension. An outline plug-in mechanism is present so it should be possible to enhance the system without major disruption each time.

## Statistics

The presentation engine is a little over 1000 lines of vanilla JavaScript.

The UI comprises 3343 lines of EasyCoder scripts. The longest of these, at about 1100 lines, compiles in under 40ms on mid-range (core-i5) hardware. Pingdom Tools report a page load time of just over a second.

## Structure

The home page is simply a bootloader for the application scripts themselves. These are plain text files that load on demand and are compiled on the fly by the EasyCoder runtime library. There is no build process and the only tool required is a text editor.

User management is done with a small PHP REST module that runs on the server and keeps records either in a database or in file storage. Each user is allocated a directory on the server in which are their scripts and uploaded images, the latter which are scaled to a maximum width of 1200 pixels to avoid excessive file sizes.

~iwsy~ can be used without any login but the features available are restricted. In particular, the file manager is not available so if images are wanted they must be provided as independent URLs. Scripts can still be saved, but go to browser storage.

~page:contents:Contents~
