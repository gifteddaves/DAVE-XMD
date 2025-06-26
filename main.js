//base by DGXeon (Xeon Bot Inc.)
//Recode by Dave
//Contact: https://wa.me/254104260236

require('./settings')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, PHONENUMBER_MCC } = require("@whiskeysockets/baileys")
const { uncache, nocache } = require('./lib/loader')
const { color } = require('./lib/color')
const NodeCache = require("node-cache")
const readline = require("readline")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const yargs = require('yargs/yargs')
const chalk = require('chalk')
const _ = require('lodash')
const { Low, JSONFile } = require('./lib/lowdb')
const { File } = require('megajs')
const { delay } = require("@whiskeysockets/baileys")
const { makeInMemoryStore, jidNormalizedUser } = require('@whiskeysockets/baileys')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(new JSONFile(`src/database.json`))

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise(resolve => setInterval(() => {
    if (!global.db.READ) {
      clearInterval(this)
      resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
    }
  }, 1000))

  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {}, database: {}, chats: {}, game: {}, settings: {}, ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()

if (global.db) setInterval(async () => {
  if (global.db.data) await global.db.write()
}, 30 * 1000)

// 📦 Load Bellah.js and watch for changes
require('./Bellah.js')
nocache('../Bellah.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'))

//------------------------------------------------------
// NEW: Dynamic Session Handling from /pair
const sessionID = process.env.SESSION_ID || process.argv[2]
const sessionDir = sessionID
  ? path.join(__dirname, 'sessions', sessionID)
  : path.join(__dirname, 'session')
const credsPath = path.join(sessionDir, 'creds.json')
//------------------------------------------------------

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise(resolve => rl.question(text, resolve))

async function downloadSessionData() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true })

    if (!fs.existsSync(credsPath)) {
      if (!sessionID) {
        return console.log(color(`❌ SESSION_ID not found!\nNo creds.json found in session folder.\nPlease pass a valid session.`, 'red'))
      }

      const megaID = sessionID.split("DAVE-XMD~")[1]
      const file = File.fromURL(`https://mega.nz/file/${megaID}`)

      const data = await new Promise((resolve, reject) => {
        file.download((err, data) => err ? reject(err) : resolve(data))
      })

      await fs.promises.writeFile(credsPath, data)
      console.log(color(`✅ Session successfully restored. Starting bot...`, 'green'))
    }

    await startDaveXMD()
  } catch (err) {
    console.error('❌ Error restoring session:', err)
  }
}

async function startDaveXMD() {
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const msgRetryCounterCache = new NodeCache()

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ["DAVE-XMD", "Chrome", "110.0"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async key => {
      let jid = jidNormalizedUser(key.remoteJid)
      let msg = await store.loadMessage(jid, key.id)
      return msg?.message || ""
    },
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
  })

  store.bind(sock.ev)

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect } = update
    try {
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output.statusCode
        if (reason === DisconnectReason.badSession) {
          console.log("❌ Bad Session. Delete and reconnect.")
        } else if (reason === DisconnectReason.connectionClosed) {
          console.log("📴 Connection closed. Reconnecting...")
        } else if (reason === DisconnectReason.connectionLost) {
          console.log("📡 Connection lost. Reconnecting...")
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log("🔄 Connection replaced. Reconnect.")
        } else if (reason === DisconnectReason.loggedOut) {
          console.log("🚪 Logged out. Delete session and reconnect.")
        } else if (reason === DisconnectReason.restartRequired) {
          console.log("🔁 Restart required.")
        } else if (reason === DisconnectReason.timedOut) {
          console.log("⏰ Timed out. Reconnecting...")
        } else {
          console.log("❓ Unknown disconnect reason: ", reason)
        }
        startDaveXMD()
      }

      if (connection === "connecting") {
        console.log(color(`\n🟡 Connecting...`, 'yellow'))
      }

      if (connection === "open") {
        console.log(color(`✅ Connected as => ` + JSON.stringify(sock.user, null, 2), 'green'))
        await delay(2000)
        sock.sendMessage("254104260236@s.whatsapp.net", { text: "`✅ DAVE-XMD is online.`" })
      }
    } catch (err) {
      console.log('Error on connection.update:', err)
      startDaveXMD()
    }
  })

  sock.ev.on("messages.upsert", () => { })
}

// 🚀 Launch
downloadSessionData()
