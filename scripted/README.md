# Script editor

The files here are for our script editor. They comprise a server script, `scripted-server.ecs`, and a browser file `index.html`. 
Put both files in the same directory.

Start up the server:

```
easycoder scripted-server.ecs {port}
```

where {port} is a port number such as 5500, then run

● Linux:
  chromium "file:///path/to/scripted/index.html?port={port}"  

● Windows:                                                                                        
  start chromium "file:///C:/path/to/scripted/index.html?port={port}"
                                                                                                  
● Mac:
  open -a "Chromium" "file:///path/to/scripted/index.html?port={port}"                             
                                                                     
  (Replace Chromium with Google Chrome or whatever browser is installed.)                         

This should start the editor.


See the instructions in our [Primer](https://easycoder.github.io/primer.html).
