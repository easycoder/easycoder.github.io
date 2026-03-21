## Using <template> tag

To avoid the CORS issue but still be able to load scripts from the server and keep scripted.html minimal, can we use the <template> tag in HEAD?

So, the script might say

load Script from template `main-script`
load MainWebson from template `main-webson`

The template in each case would contain the EasyCoder or Webson script.

This would allow us to keep scripts like 'scripted' up to date without users having to download updates. 

Is this doable?

## scripted file access

Arrange for scripted to only access files in the folder in which its server is running. 

# Importing non-JS content into HTML

The `<script>` tag is more flexible than most people realise. While it defaults to JavaScript, it can be used for other content types too.

## Non-JS uses of `<script>`

**1. JSON / structured data (very common)**

The `type="application/json"` (or `application/ld+json` for Schema.org) trick lets you embed data blocks that JS can read, or that search engines parse:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "My Article Title"
}
</script>
```

**2. HTML templates**

`type="text/html"` (or any non-JS MIME type) prevents the browser from executing the content, making it a handy inert HTML store:

```html
<script type="text/html" id="my-template">
  <div class="card">
    <h2>{{title}}</h2>
    <p>{{body}}</p>
  </div>
</script>
```

JS can then read it via `document.getElementById('my-template').innerHTML`.

**3. The `<template>` tag (modern alternative)**

Worth knowing: HTML5 introduced `<template>` specifically for inert markup, which is generally preferred over the `<script>` hack above:

```html
<template id="my-template">
  <div class="card">...</div>
</template>
```

**4. Module maps (`importmap`)**

A relatively modern feature that lets you define JS module aliases:

```html
<script type="importmap">
{
  "imports": {
    "lodash": "/node_modules/lodash-es/lodash.js"
  }
}
</script>
```

**5. Custom/arbitrary data**

Any unrecognised MIME type causes the browser to silently ignore the block, so it's sometimes used to embed arbitrary data for JS to pick up:

```html
<script type="text/x-config" id="app-config">
  { "apiUrl": "https://api.example.com", "debug": false }
</script>
```

## The key rule

If `type` is omitted, `text/javascript`, or any recognised JS MIME type, the browser **executes** it. Any other type causes the browser to **skip execution** but still make the raw text content available to JavaScript via `.textContent` or `.innerHTML` — which is what makes all the above patterns work.

## How this applies to EasyCoder

The executor (`easycoder.js` or whatever the runtime is) loads via a normal `<script>` tag, and it fetches the EasyCoder program as plain text from the same server.

The minimal host page would be something like:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://easycoder.github.io/runtime.js"></script>
</head>
<body>
  <script type="application/json" id="ec-config">
    { "program": "https://easycoder.github.io/programs/myprogram.ec" }
  </script>
</body>
</html>
```

And the runtime picks up the config and fetches the program autonomously.

A couple of thoughts that might be useful:

**The config block could be even simpler** — since there's likely only ever one program per page, even a plain `<script type="text/x-easycoder">` block with just the URL as its text content would work and is very readable:

```html
<script type="text/x-easycoder">
  https://easycoder.github.io/programs/myprogram.ec
</script>
```

The runtime just looks for that tag, reads the URL, fetches and runs it.

**Or inline the program directly** in the same tag, giving you the option of either a URL or embedded source — the runtime checks whether the content looks like a URL or like actual code.

Does the EasyCoder runtime currently have a defined way for the host page to tell it which program to run, or is that still being worked out?

_Currently, EasyCoder looks for a specific <pre> block known to contain the script to run. This is preferably a simple loader that GETs the main script from a URL, hence the CORS issue when running from local host._

That's a neat two-stage pattern — the `<pre>` block contains a tiny loader script, and the loader fetches the real program. The CORS problem only bites because the loader is doing a `fetch()` from a local context to the remote server.

A few thoughts:

**The `<script type="text/x-easycoder">` approach would solve this cleanly.** Since the runtime itself comes from the remote server, when it does the `fetch()` for the program it's same-origin — the browser sees the request as coming from the remote origin, not from localhost. This sidesteps the CORS issue entirely without any server configuration.

**Alternatively, keep the `<pre>` but make the runtime do the fetching.** Rather than the loader script calling `fetch()`, the `<pre>` could simply contain the URL as plain text, and the runtime detects whether its content is a URL or a full program and acts accordingly:

```html
<pre id="easycoder-script">
  https://easycoder.github.io/programs/myprogram.ec
</pre>
```

The runtime does the fetch itself — and again, since the runtime came from the remote server, it's same-origin.

**The key insight** is that CORS is about where the *request originates from* in terms of the page's origin, not where the JS file physically lives. So moving the `fetch()` responsibility from an inline script (local origin) into the remotely-loaded runtime (remote origin) is the fix.

Is the loader currently a small EasyCoder script, or raw JS?

_EasyCoder_

That's the root of the issue then. The EasyCoder runtime is executing the loader script, but the `fetch()` that the loader triggers is still happening in the context of the local page origin — the runtime being remote doesn't change that. CORS is determined by the **page's origin**, not where the JS engine code came from.

So the options really come down to:

**1. Server-side CORS header** — the simplest fix if you control the remote server. Just allow all origins on the script-serving endpoint:
```
Access-Control-Allow-Origin: *
```
Since these are just static plain text files, there's no security concern in doing this.

**2. Inline the loader differently** — instead of the EasyCoder loader doing a `fetch()`, have the runtime itself recognise a URL in the `<pre>` block and do the fetch natively in JS before execution begins. The EasyCoder script never makes the cross-origin call — the JS runtime does, and you can handle CORS or use a proxy there.

**3. Local dev proxy** — a minimal workaround just for local development, without changing the server or runtime.

Given that EasyCoder is designed to be dropped into any page from any origin, option 1 seems like the right long-term answer — the scripts are public assets, so `Access-Control-Allow-Origin: *` is entirely appropriate. Is that something you can set on the GitHub Pages server, or is that outside your control?
