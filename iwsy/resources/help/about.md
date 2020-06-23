~page:contents:Contents~

## About us

~iwsy~ is a client-size all-JavaScript web application, currently under development by a small independent software development team.

## Contact us

All enquiries should be sent to [info@iwannashowyou.com](mailto:info@iwannashowyou.com).

## Technical stuff

The ~iwsy~ user interface is coded entirely in [EasyCoder](https://easycoder.github.io) scripts, which download, compile and run as they are needed. Everything is done in the browser; there is no build process for the web app. A small server-side REST module handles user registration and login and manages files created by users that are stored on the server.

There are a little over 3000 lines of code in total. The largest code module (that runs the **Steps** panel opposite) is just over 1000 lines long and typically takes under 50ms to compile. Modules are loaded when they are first needed and the load time of the web app is around 1.5 seconds (Pingdom Tools). The web app uses about 15MB of heap space while running.

We are keen to collaborate with anyone who may have ideas for improving the website and the range of features it provides. Enquiries should be made in the first instance to the email address given above.
