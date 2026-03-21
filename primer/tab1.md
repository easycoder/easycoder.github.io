# Build Software, Not Just Prompts

This project is for people who want to become stronger programmers in the AI era.
No shortcuts, no “overnight success” claims — just practical learning through real product work.

## What you learn

 - How to structure a real smartphone webapp.
 - How to work effectively with an AI coding agent.
 - How to review and understand each change.

This is a guided route into software work.

## What are EasyCoder and Codex?

EasyCoder is a high-level coding language that works with AI to deliver code that can be checked by humans, not just taken on trust. Before starting your first project, go to the [Codex](https://easycoder.github.io/codex.html). This is a combined tutorial, reference manual and programmer's playground and will very quickly get you accustomed to the kind of output that will be delivered by AI.

Contact: [easycoder.ai@gmail.com](mailto:easycoder.ai@gmail.com)

EasyCoder is used to create 

 - Python-based desktop applications 
 - JavaScript-based web applications
 - Any combination of the two.

The Python and JS variants are similar versions of the same coding language. 

## Why use high-level scripting?

EasyCoder is far simpler for inexperienced software developers (or even non-programmers) to understand than either Python or JavaScript, yet equally capable of building substantial software products. This is thanks to the way AI is agnostic when it comes to programming languages; able to code with anything that can provide the necessary functionality. What this means in practice is people can validate the code being produced without first becoming coding gurus. This is in contrast to 'vibe coding', where you have to trust AI to do the right job. With EasyCoder, _you_ are in control all the way.

See the **AI Manual** tab on this page for a full exposition of this subject. 

## The primer prompt

Development can proceed using either a cloud-based agent or a local LLM hosted by yourself and accessed via Open WebUI. In either case, once you are set up, your first step will be to provide a "primer prompt" that will get your agent familiar with EasyCoder. You can ask a cloud-based agent to read this from a URL, but for a local LLM you will have to open the URL yourself, copy its content and paste this as the primer prompt.

For the Python version the URL is
[https://easycoder.github.io/agent-primer-python.md](https://easycoder.github.io/agent-primer-python.md)

For JavaScript it is
[https://easycoder.github.io/agent-primer-js.md](https://easycoder.github.io/agent-primer-js.md])

Include either or both of these according to the needs of your project.

Follow these with an outline of your project; what will it do, is it command-line or browser, how does it communicate, what special terminology will you be using, etc. The more you give, the better the agent will understand your needs.

Once you have given the primer prompt you can start asking your agent to write some code. Start with something simple to get familiar with how it works. (If you'd like some examples, see the note at the bottom of this screen about [Codex](https://easycoder.github.io/codex.html).)

## Building and running your script

A command-line app is very different from a browser-based webapp.

### Python version
To run a Python-based script, first install EasyCoder:

`pip install -U easycoder`

If EasyCoder is already installed, this will update you to the latest version, which you might need to do from time to time as it's still under development and new features are regularly being added. Note that on some Linux systems, EasyCoder will not be installed on your $PATH, so either give the full path (usually ~/.local/bin/easycoder) or set up a symbolic link. To check the version number, use

`easycoder`

and to run your script, use

`easycoder project.ecs`

Ask your agent to start building a script for you.

### JavaScript version

For development of a webapp, set up a simple Python local server in your project folder:

`python3 -m http.server 5500` (or whatever port you prefer)

Copy 3 files:

 [https://easycoder.github.io/primer/index.html](https://easycoder.github.io/primer/index.html) 
 [https://easycoder.github.io/primer/project.ecs](https://easycoder.github.io/primer/project.ecs) 
 [https://easycoder.github.io/primer/project.json](https://easycoder.github.io/primer/project.json)

to your project folder.

Aim your browser at `http://localhost:5500/index.html`.

Tell your agent what you want to do next.

## Testing and debugging

To test any program you need a debugger. If you are doing cloud-based development you may be using an AI-powered editor such as VS Code. You can set up its tooling to provide full debugging support for either version of EasyCoder or both simultaneously. This can be complicated for the JS version, so ask your agent to do this for you.

Both versions of EasyCoder have a minimal debugger; a built-in tracer that lets you stop a script at any point, examine variables and single-step or run.

## Teach yourself EasyCoder 
You can get some familiarity with many features of EasyCoder by starting with our [Codex](https://easycoder.github.io/codex.html). This is an integrated tutorial, reference manual and programmer's playground for the scripting language.

And that's it! If you have questions you can email us at [easycoder.ai@gmail.com](mailto:easycoder.ai@gmail.com). 


