# Installing the EasyCoder Codex #
The ~ec~ **Codex** is a complete integrated development system for coding websites. It can be run locally in your own computer or installed on your server; the only prerequisite is a recent copy of PHP or Python 3, depending on which you want to use to run a local webserver.

## Installation on a regular PC using PHP ##
First download the Codex archive into an empty folder.

Unzip the archive.

Open a command line shell and navigate to the folder where you unzipped the archive. Then type

~code:php -S localhost:8000~

You should get confirmation that the PHP server started.

Now go to your browser and type ~code:localhost:8000~ into the address bar. Hit ~code:Enter~. The Codex should start up.

## Installation on a regular PC using Python 3 ##
In this case, use the ~code:rest.py~ script to run a local webserver on any port you choose.

## Installation on a server ##
Download the Codex archive into the root of your website.

Unzip the archive.

Type the URL of your server into your browser address bar and hit ~code:Enter~. The Codex should start up.

If you need help, join our [Slack channel](https://join.slack.com/t/easycoder-software/shared_invite/enQtNTU5ODEwOTQ5NTU0LWQ1NWVkOTUxOGQ3NzJmNDI1ZGRlOTdmMjc1NDAxMGIwMTFjODg1ZDJhODEzMzUzODc2MDNlZWU4NmYyZWRlOWI).

## Script strategies ##
There are two main strategies for using ~ec~ scripts, as follows:

### Script in BODY ###
The simplest approach is to embed your script in the body of the page. The basic outline is

~pre:<html lang="en">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My scripted web page</title>
<script type='text/javascript' src='/easycoder/easycoder.js'></script>

</head>

<body>

<pre id="easycoder-script">

alert &#96Hello, world!&#96 <----- This is the EasyCoder script

</pre>

</body>

</html>~

A variant of this is where you add a script to a page that already contains HTML. The script will be added in its own preformatted block on the page. The location of the script in the page is not significant; it can be at the top, in the middle or at the bottom.

The main thing to note is that instead of the script creating DOM elements as in the Codex tutorials, these elements will in many cases already exist. So instead of using ~code:create~ you will use ~code:attach~, giving the id of the element you want to attach to, so

~pre:create Button in Container~

becomes

~pre:attach Button to &#96;ec-button&#96;~

where ~code:ec-button~ is the id of an element that already exists in your HTML.

The most common use of this strategy is probably where an existing page is being retrofitted with ~ec~ script.

### Script from your server ###
This second strategy is more powerful and carries many benefits. Here the script is not embedded in the page at all. Instead, all that is present is a 'boot loader' that retrieves the script from a folder on the server. As before, you can make use of existing HTML on the page if you wish.

Here's what the simplest form of this page looks like:

~pre:<html lang="en">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My scripted web page</title>
<script type='text/javascript' src='/easycoder/easycoder.js'></script>

</head>

<body>

<pre id="easycoder-script">

variable Script
rest get Script from &#96;/resources/ecs/myscript.ecs&#96;
run Script
stop

</pre>

</body>

</html>~

Here the script (~code:myscript.ecs~) is located in the ~code:{site root}/resources/ecs~ directory. When you write scripts in Codex, put them in this directory, allowing you to directly maintain your site code from any computer (including a smartphone). The downloaded package includes a file called ~scripted.html~, which is a script editor with which you can edit files in the ~ecs~ directory. You will have to set up an encrypted password in ~code:properties.txt~; it's probably best to contact us for details of this unless you feel like diving into the ~code:rest.php~ REST server.

If you can deal with the CORS issues you can use a complete URL to retrieve your script from a remote site, as in

~pre:rest get Script from &#96;https://mysite.com/myscripts/home.ecs&#96;~
