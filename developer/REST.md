# The REST Server #

**_EasyCoder_** can be used to add interactivity to an existing web page or to create the entire page. In the former case the page will have come from the server, and usually everything **_EasyCoder_** needs will already be in the browser.

Where pages are built entirely in the browser, however, they often need extra resources that are stored either on the server or in its database. To get at these resources we provide a small REST module written in PHP.

REST (REpresentational State Transfer) allows requesting systems to access and manipulate textual representations of Web resources by using a uniform and predefined set of stateless operations.This is a fairly loose definition and allows plenty of flexibility in its implementation. In the case of **_EasyCoder_**, everything is done with a call to _rest.php_, with further items in the URL that specify the nature of the operation requested and optionally some data to go with it. POST requests usually also carry JSON-encoded data in the body of the request.

In a typical website powered by **_EasyCoder_** the operating scripts are kept on the server along with any other resources needed by the page. The REST module enables a script to read and write files on the server, to access the database and to perform other miscellaneous services like encoding passwords.

The REST module has a standard set of functionality plus the ability to call a custom extension module to perform any desired function. Like the _plugins.js_ file that defines which plugins will be available to **_EasyCoder_**, _rest-local.php_ is located in the toplevel _easycoder_ directory and can be edited at will.

Language support for REST is in the _rest.js_ plugin and by default is always loaded with **_EasyCoder_**. A typical GET command looks like this:

```
get MyData from `_load/scripts~mapdemo`
```

which uses _GET_ to request a script called _mapdemo_ from the _easycoder/scripts_ folder. Note you don't give the full path, just the bit after _easycoder_. If this has any forward-slashes they must be converted to tilde characters (_~_) otherwise they will confuse the rather simple parser in the REST module. The command to be executed in this example is _\_load_ and the data that returns is placed into the _MyData_ variable.

Similarly with _POST_:

```
post Content to `ec_data/set/id/2351`
```

which POSTS the contents of the variable to the database record whose id is 2351 in the table _ec-data_.

Inside _rest.php_ everything depends on the first word of the path given (everything before the first forward slash), which is the name of a database table unless it starts with an underscore, in which case it's a special command. You can examine the PHP source to see what commands are supported; most are pretty obvious. If the command word is just a single underscore the extension module is triggered; it can do anything you like.

[Developer Manual](Developer.md)

[The EasyCoder Compiler](Compiler.md)

[The Keyword Compilers](Core.md)

[The Runtime Engine](Runtime.md)