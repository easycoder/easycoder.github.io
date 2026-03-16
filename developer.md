# Developer instructions

EasyCoder is a coding system for AI-powered software development. It is used to create 

 1. Python-based desktop applications 
 2. JavaScript-based web applications

These two variants use similar versions of the same coding language. EasyCoder is far simpler for inexperienced software developers to understand than either Python or JavaScript, yet equally capable of building substantial software products. This is thanks to the way AI is agnostic when it comes to programming languages; able to code with anything that can provide the necessary functionality. See the **AI Manual** tab on this page for a full exposition of this subject. 

## The primer prompt
Development can proceed using either a cloud-based agent or a local LLM hosted by yourself and accessed via Open WebUI. In either case, once you are set up the first step is to provide a "primer prompt" that will get your agent familiar with EasyCoder. You can ask a cloud-based agent to read this from a URL, but for a local LLM you will have to open the URL yourself, copy its content and paste this as the primer prompt.

For the Python version the URL is
`https://easycoder.github.io/agent-primer-python.md`

For JavaScript it is
`https://easycoder.github.io/agent-primer-js.md`

Once you have given the primer prompt you can start asking your agent to write some code. Start with something simple to get familiar with how it works. Save the script generated as `project.ecs`.

## Running your script 
To run a Python-based script, install EasyCoder:

```
pip install -U easycoder
```
Note that on some systems it will not be installed on your $PATH, so either give the full path or set up a symbolic link. To run your script, use

`easycoder project.ecs`

To run a JavaScript-based script, see below. 

## Testing
To test any program you need a debugger. If you are doing cloud-based development you may be using an AI-Powered editor such as VS Code. You can set up its tooling to provide full debugging support for either version of EasyCoder. This can be complicated, so ask your agent to do this for you.

## Initial setup for webapps
For local LLM development of a webapp, set up a simple Python local server:

```bash
python3 -m http.server 5500
```

Then open `http://localhost:5500/` in your browser.

Copy the file at `https://easycoder.github.io/index_html` to your own `index.html` and serve this to your browser.

Now create a script file, `project.ecs` with the following content. It starts by setting up a panel in your browser. Add new code written by your AI agent to the bottom of the script:

```
!  project.ecs

   script Project

   div Body
   variable Mobile
   variable ScreenWebson

   if portrait
   begin
      if mobile set Mobile else clear Mobile
   end
   attach Body to body
   if Mobile
      set the style of Body to `width:100%;height:100%`
   else
      set the style of Body to `width:1024px;height:100%;display:flex`

   rest get ScreenWebson from `project.json` or stop
   render ScreenWebson in Body
```

Create a file `project.json` as follows:

```json
{
   "#element": "div",
   "@id": "app",
   "width": "100%",
   "minHeight": "100vh",
   "display": "flex",
   "flexDirection": "column",
   "alignItems": "center",
   "justifyContent": "center",
    "fontFamily": "sans-serif",
   "#": ["$Status"],
   "$Status": {
      "#element": "p",
      "@id": "status",
      "fontSize": "1.1em",
      "color": "#1e2430",
      "#content": "(empty)"
   }
}
```

Both versions of EasyCoder have a built-in tracer that lets you stop a script at any point, examine variables and single-step or run.

## Teach yourself EasyCoder 
You can get some familiarity with many features of EasyCoder by starting with our [Codex](https://easycoder.github.io/codex.html). This is an integrated tutorial, reference manual and programmer's playground for the scripting language.

And that's it! If you have questions you can email us at [easycoder.ai@gmail.com](mailto:easycoder.ai@gmail.com). 
