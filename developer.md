# Developer instructions

EasyCoder is a coding system for AI-powered software development. It is used to create 

 - Python-based desktop applications 
 - JavaScript-based web applications
 - Any combination of the two.

The Python and JS variants are similar versions of the same coding language. 

## Why use high-level scripting?
EasyCoder is far simpler for inexperienced software developers (or even non-programmers) to understand than either Python or JavaScript, yet equally capable of building substantial software products. This is thanks to the way AI is agnostic when it comes to programming languages; able to code with anything that can provide the necessary functionality. What this means in practice is people can validate the code being produced without first becoming coding gurus. This is in contrast to 'vibe coding', where you have to just trust AI to do the right job. With EasyCoder, _you_ are in control all the way.

See the **AI Manual** tab on this page for a full exposition of this subject. 

## The primer prompt
Development can proceed using either a cloud-based agent or a local LLM hosted by yourself and accessed via Open WebUI. In either case, once you are set up, your first step will be to provide a "primer prompt" that will get your agent familiar with EasyCoder. You can ask a cloud-based agent to read this from a URL, but for a local LLM you will have to open the URL yourself, copy its content and paste this as the primer prompt.

For the Python version the URL is
`https://easycoder.github.io/agent-primer-python.md`

For JavaScript it is
`https://easycoder.github.io/agent-primer-js.md`

Include either or both of these according to the needs of your project.

Follow these with an outline of your project; what will it do, is it command-line or browser, how does it communicate, what special terminology will you be using, etc. The more you give, the better the agent will understand your needs.

Once you have given the primer prompt you can start asking your agent to write some code. Start with something simple to get familiar with how it works. (If you'd like some examples, see the note at the bottom of this screen about Codex.) Save the script generated as `project.ecs`.

## Running your script 
### Python version
To run a Python-based script, install EasyCoder:

`pip install -U easycoder`

If EasyCoder is already installed this will update you to the latest version, which you might need to do from time to time as it's still under development and new features are regularly being added. Note that on some Linux systems, EasyCoder will not be installed on your $PATH, so either give the full path (usually ~/.local/bin/easycoder) or set up a symbolic link. To check the version number, use

`easycoder`

and to run your script, use

`easycoder project.ecs`

### JavaScript version
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

## Testing and debugging
To test any program you need a debugger. If you are doing cloud-based development you may be using an AI-powered editor such as VS Code. You can set up its tooling to provide full debugging support for either version of EasyCoder or both simultaneously. This can be complicated for the JS version, so ask your agent to do this for you.

Both versions of EasyCoder have a minimal debugger; a built-in tracer that lets you stop a script at any point, examine variables and single-step or run.

## Teach yourself EasyCoder 
You can get some familiarity with many features of EasyCoder by starting with our [Codex](https://easycoder.github.io/codex.html). This is an integrated tutorial, reference manual and programmer's playground for the scripting language.

And that's it! If you have questions you can email us at [easycoder.ai@gmail.com](mailto:easycoder.ai@gmail.com). 
