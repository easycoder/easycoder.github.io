# Starter template

The files here are the bare minimum to get started with EasyCoder. If you are developing a command-line application, nothing is needed; just tell your agent what you want to achieve. If you are developing a browser app, you'll need 3 files:

```
index.html
project.ecs
project.json
```

Aim your browser at index.html and you should see a blank screen with the word (empty) in the middle. Now tell your agent what you want next.

If you are developing a client-server application you will need a 4th file, `server.ecs`. Run it as follows:

```
easycoder server.ecs?port={port}
```

where {port} is some number such as 5500. Aim your browser at `http://localhost:{port}.

See the instructions in our [Primer](https://easycoder.github.io/primer.html).
