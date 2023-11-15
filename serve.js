import { marked } from 'https://deno.land/x/marked/mod.ts';

const header = `
<!doctype HTML>
<html>
  <head>
    <title>Deno Talk</title>
    <script src='https://cdn.jsdelivr.net/npm/davidshimjs-qrcodejs@0.0.2/qrcode.min.js'></script>
    <style>
      body { font-family: sans-serif; width: 870px; margin-left: auto; margin-right: auto; max-width: 100%;}
      pre { background: #444; color: #f5f5f5; padding: .5em; border-radius: .5em;}
      iframe { width: 100%; height: 350px;}
      hr { margin-top: 15em; margin-bottom: 7em;}
    </style>
  </head>
  <body>

`

const footer = `
  <script>
  new QRCode(document.getElementById("minichat"), "https://deno-mini-chat.deno.dev/")
  new QRCode(document.getElementById("visitskv"), "https://deno-visits.deno.dev/")
  new QRCode(document.getElementById("securechat"), "https://deno-secure-chat.deno.dev/")
  new QRCode(document.getElementById("privatechat"), "https://deno-private-chat.deno.dev/")
  new QRCode(document.getElementById("persistentchat"), "https://deno-persistent-chat.deno.dev/")
  new QRCode(document.getElementById("finalchat"), "https://deno-final-chat.deno.dev/")
  </script>
  </body></html>`

Deno.serve(async r => {
  const markdown = await Deno.readTextFile('./contents.md')

  const html = header + marked.parse(markdown) + footer

  return new Response(html, {headers: {'Content-type': 'text/html'}})
})
