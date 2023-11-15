# Build a Distributed Chat Server in Deno!

### An optimistic talk about how things can work well in JavaScript these days

### By Everett Bogue

Who am I?

I've been programming JS since 1999. I'm from Chicago. I work as a substitute middle manager for a California-based company at the local outlet mall.

+ Website: https://evbogue.com/
+ Bogbook: https://bogbook.com/
+ Email: ev@evbogue.com

https://ntfy.sh/ me using Deno:

```
import { textEv } from 'https://raw.githubusercontent.com/evbogue/textme/master/mod.js'

textEv('Hey Ev!')
```

***

### What is Deno?

<img src='https://user-images.githubusercontent.com/33424336/82143322-b7b0ae00-984b-11ea-9e0a-cfa5279d616c.gif' />

```
 "node".split("").sort().join("") 
```

Deno is a next generation JavaScript runtime similar to Node.js and Bun.js. 

Deno is created by Ryan Dahl, the creator of Node.js. 

Here's ry's talk about why he made mistakes when making Node.js and why he decided to create Deno:

<iframe src="https://www.youtube.com/embed/M3BM9TB-8yA?si=hVMh1MmSRg5y_P6K" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

And here's ry's talk about how Deno decided to embrace NPM from the recent Denofest in Tokyo:

<iframe src="https://www.youtube.com/embed/r8MPtrihtTA?si=cvQQtdDncoMHQCEQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

***

### cool Deno things

Here's a few few things that I like about Deno:

### URL imports! 

```
import { serveDir } from 'https://deno.land/std@0.202.0/http/file_server.ts'
```

### One line server!

```
Deno.serve((req) => new Response("Hello world"))
```

### Security!

```
import { textEv } from 'https://raw.githubusercontent.com/evbogue/textme/master/mod.js'

textEv('HEY!')

```

### A standard library!

https://deno.com/std/ 

### Run from a URL!

```
deno run https://examples.deno.land/hello-world.ts
```

### Make a binary!

```
deno compile https://examples.deno.land/hello-world.ts
```

### NPM compatiblity

```
import express from "npm:express@4"

const app = new express()

app.use('/', (req, res) => {
  res.send('Hello World')
})

app.listen('8000')

```

### An experimental Key/Value store right in the runtime!

```
const kv = await Deno.openKv()
```

And of course TypeScript and JSX out of the box.

More at: 

+ https://deno.com/
+ https://examples.deno.land/

***

### Deno Deploy

The Deno people have a "serverless" deployment platform you can use to deploy your Deno apps to 35 regions. 

https://deno.dev/

We're going to use Deno Deploy to host the app examples below, because it's free*!

You can also run your Deno apps everywhere else, such as on your local computer, a VPS, or another Deno-compatible "cloud" platform.

***

### A serverless chatroom in 23 lines of JS

Using Deno's broadcastChannel API to chat between edge deployments:

```
const html = `<script>const ws = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host)
  ws.onmessage = e => pre.textContent = e.data + '\\n' + pre.textContent</script>
  <input onkeyup="event.key=='Enter'&&ws.send(this.value)"><pre id=pre>`

const sockets = new Set()
const channel = new BroadcastChannel("")

channel.onmessage = e => {
  (e.target != channel) && channel.postMessage(e.data)
  sockets.forEach(s => s.send(e.data))
}

Deno.serve((r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    sockets.add(socket)
    socket.onmessage = channel.onmessage
    socket.onclose = _ => sockets.delete(socket)
    return response
  } catch {
    return new Response(html, {headers: {'Content-type': 'text/html'}})
  }
})
```

<iframe style='width: 50%; float: right;' src='https://deno-mini-chat.deno.dev/'></iframe>

https://deno-mini-chat.deno.dev/

<div id='minichat'></div>



***

### Count your website visits using Deno.kv

```
const html = `
  <script>
    const ws = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host)
    ws.onopen = e => {ws.send('Hit')}
    ws.onmessage = e => {
      counter.textContent = (e.data == '1') ? e.data + ' visit.' : e.data + ' visits.'
    }
  </script>
  <pre id='counter'>
`

const sockets = new Set()
const channel = new BroadcastChannel('')

const kv = await Deno.openKv()

const key = ["counter"]

channel.onmessage = async e => {
  (e.target != channel) && channel.postMessage(e.data)
  const v = await kv.get(key)
  const current = v.value.value
  sockets.forEach(s => s.send(current))
  channel.postMessage(current)
}

Deno.serve((r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    sockets.add(socket)
    socket.onopen = e => {
      kv.atomic().sum(key, 1n).commit()
    }
    socket.onmessage = channel.onmessage
    socket.onclose = _ => {
      sockets.delete(socket)
    }
    return response
  } catch {
    return new Response(html, {headers: {'Content-type': 'text/html'}})
  }
})

```

<iframe style='width: 50%; float: right;' src='https://deno-visits.deno.dev/'></iframe>

https://deno-visits.deno.dev/

<div id='visitskv'></div>

***

### Let's make a distributed chat app

In the next couple of apps we're going to use TweetNaCl to sign and optionally encrypt messages using 

+ https://tweetnacl.cr.yp.to/
+ https://tweetnacl.js.org/#/

and hashing blobs using sha256 using the crypto.subtle API available in Deno and web browsers.

Why are we using cryptography?

Prior art:

+ https://en.wikipedia.org/wiki/Nostr
+ https://nostr.com/
+ https://en.wikipedia.org/wiki/Secure_Scuttlebutt
+ https://scuttlebot.io/
+ https://en.wikipedia.org/wiki/InterPlanetary_File_System
+ https://ipfs.tech/

Similar art:

+ https://yggdrasil-network.github.io/
+ https://github.com/cjdelisle/cjdns
+ https://www.wireguard.com/

And don't forget what Alan Kay said at OOPSLA 1997!

> "The computer revolution hasnt happened yet" ... "HTML on the Internet has gone back to the dark ages" 

and of course

> "I believe that every object on the Internet should have an IP"

<iframe src="https://www.youtube.com/embed/aYT2se94eU0?si=fx7ptppm4rNqL_uz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>


***

### Generate a keypair

```
import nacl from './lib/nacl-fast-es.js'
import { encode } from './lib/base64.js'

export const ed25519 = {}

export const generate = async () => {
  const genkey = nacl.sign.keyPair()
  const keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
  return keygen
}

ed25519.keypair = async () => {
  const keypair = await localStorage.getItem('keypair')
  if (!keypair) {
    const keypair = await generate()
    localStorage.setItem('keypair', keypair)
    return keypair
  } else {
    return keypair
  }
}
```

***

The "Bog" message protocol we're using:

```
import nacl from './lib/nacl-fast-es.js'
import { ed25519 } from './keys.js'
import { decode, encode } from './lib/base64.js'
import { make, find } from './blob.js'

export async function publish (text, previous) {
  const pubkey = await ed25519.pubkey()
  const privkey = await ed25519.privkey()
  const datahash = await make(text)

  const timestamp = Date.now()

  const msg = timestamp + pubkey + datahash

  const hash = encode(
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg))
      )
    )
  )

  if (!previous) {
    previous = hash
  }

  const next = msg + previous + hash

  const sig = encode(nacl.sign(new TextEncoder().encode(next), decode(privkey)))

  return pubkey + sig
}

export async function open (msg) {
  const opened = new TextDecoder().decode(nacl.sign.open(decode(msg.substring(44)), decode(msg.substring(0, 44))))

  const obj = {
    timestamp: parseInt(opened.substring(0, 13)),
    author: opened.substring(13, 57),
    hash : opened.substring(145),
    previous: opened.substring(101, 145),
    data: opened.substring(57, 101),
    raw: msg
  }

  obj.text = await find(obj.data)

  return obj
}
```

<iframe style='width: 50%; float: right;' src='https://deno-secure-chat.deno.dev/'></iframe>

https://deno-secure-chat.deno.dev/

<div id='securechat'></div>

***

### Let's make a private chat app

Box and unbox using the same identity we use to sign messages.

```
import nacl from './lib/nacl-fast-es.js'
import { convertPublicKey, convertSecretKey } from './lib/ed2curve.js'
import { decode, encode } from './lib/base64.js'
import { ed25519 } from './keys.js'

export const box = async (msg, recp) => {
  if (recp && recp.length === 44) {
    const keys = await ed25519.keypair()

    const receiver = convertPublicKey(decode(recp))
    const sender = convertPublicKey(decode(keys.substring(0, 44)))
    const privatekey = convertSecretKey(decode(keys.substring(44)))
    const nonce = nacl.randomBytes(nacl.box.nonceLength)
    const message = new TextEncoder().encode(msg)
    const boxed = nacl.box(message, nonce, receiver, privatekey)
    const nonceMsg = new Uint8Array(sender.length + nonce.length + boxed.length)

    nonceMsg.set(sender)
    nonceMsg.set(nonce, sender.length)
    nonceMsg.set(boxed, sender.length + nonce.length)

    return encode(nonceMsg)
  } else { return }
}

export const unbox = async (base64) => {
  try {
    const boxed = new Uint8Array(decode(base64))

    const keys = await ed25519.keypair()

    const privatekey = convertSecretKey(decode(keys.substring(44)))

    const senderkey = boxed.slice(0, 32)
    const nonce = boxed.slice(32, 32 + 24)
    const msg = boxed.slice(32 + 24)
    const unboxed = nacl.box.open(msg, nonce, senderkey, privatekey)
    const message = new TextDecoder().decode(unboxed)
    return message
  } catch { return }
}
```

<iframe style='width: 50%; float: right;' src='https://deno-private-chat.deno.dev/'></iframe>

https://deno-private-chat.deno.dev/

<div id='privatechat'></div>

***

### Let's make a persistent chat app

Using Deno.kv to store the messages across sessions

```
channel.onmessage = async e => {
  (e.target != channel) && channel.postMessage(e.data)
  console.log(e.data)
  if (e.data.length > 44) {
    const msg = JSON.parse(e.data)
    const opened = await open(msg.payload)
    kv.set([opened.hash], opened.raw)
    if (msg.blob) {
      kv.set([opened.data], msg.blob)
      opened.text = msg.blob
    }
    if (msg.boxed) {
      kv.set([opened.data], msg.boxed)
    }
    if (msg.latest) {
      kv.set([opened.author], opened.raw)
    }
    sockets.forEach(s => s.send(e.data))
  }
  if (e.data.length === 44) {
    const msg = await kv.get([e.data])
    if (msg.value) {
      const opened = await open(msg.value)
      const blob = await kv.get([opened.data])
      const tosend = {
        type: 'post',
        payload: msg.value,
        blob: blob.value
      }
      sockets.forEach(s => s.send(JSON.stringify(tosend)))
    }
  }
}

```

<iframe style='width: 50%; float: right;' src='https://deno-persistent-chat.deno.dev/'></iframe>

https://deno-persistent-chat.deno.dev/

<div id='persistentchat'></div>

***

# Avatar names and some UI design

Give pubkey a name, which is then sent around with your latest message so clients know what to call you.

https://deno-final-chat.deno.dev/

<div id='finalchat'></div>

<iframe style='width: 100%; float: right;' src='https://deno-final-chat.deno.dev/'></iframe>

***

End of talk.

