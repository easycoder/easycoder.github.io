~page:contents:Contents~

# How to embed a presentation

To embed a presentation in your own web page you just need the ~iwsy~ runtime engine and a presentation script. The best place to start is with a stand-alone web page, which is coded like this:
<hr>
```
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<script src='https://cdn.jsdelivr.net/gh/easycoder/easycoder.github.io/iwsy/iwsy.js'></script>
	<script src='https://cdn.jsdelivr.net/gh/easycoder/easycoder.github.io/iwsy/iwsystart.js'></script>
  </head>

  <body style="margin:0;padding:0">

    <div id="iwsy-container" style="position:absolute;top:0;left:0;width:100%;height:100%;background:black">
    <img src="https://cdn.jsdelivr.net/gh/easycoder/easycoder.github.io/iwsy/resources/img/fullscreen.png" style="width:50%;height:50%;position:absolute;left:50%;top:50%;transform:translate(-50%, -50%)"/>
    </div>
    <pre id="iwsy-script" style="display:none">https://cdn.jsdelivr.net/gh/easycoder/easycoder.github.io/iwsy/resources/scripts/demo.json</pre>

  </body>
</html>
</html>
```
<hr>
All of the resources in this demo are loaded on demand from the CDN attached to the GitHub repository for ~iwsy~, which is part of [EasyCoder](https://easycoder.github.io).

The ~m:head~ of the document requests 2 scripts. One is the ~iwsy~ runtime engine; the other is a launcher for the presentation, which waits for the page to load then starts things up.

The ~m:body~ contains a ~m:&lt;div&gt;~ with an ID that is specific to ~iwsy~. Inside this is a graphic that holds instructions on how to run the presentation. Then finally there's a hidden ~&lt;pre&gt;~ element that holds the URL of the presentation script.

## Doing your own embedding

When you want to embed a presentation, some of the same things are needed. The ~iwsy~ engine is always required but the launcher function will be probably be provided by your own page code. You will need to study the code in ~m:iwsystart.js~ to see how to do this, but it should be no more than a single page of vanilla JavaScript. The container is the ~m:&lt;div&gt;~ on your page in which you want the show to run. The script can be provided in any way you like; it's just a text file that is passed to ~iwsy~ on startup.
