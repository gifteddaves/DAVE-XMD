//base by DGXeon (Xeon Bot Inc.)
//Recode by Dave
//Contact: https://wa.me/254104260236

require('./settings')
const makeWASocket = require("@whiskeysockets/baileys").default
const { uncache, nocache } = require('./lib/loader')
const { color } = require('./lib/color')
const NodeCache = require("node-cache")
const readline = require("readline")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const { Low, JSONFile } = require('./lib/lowdb')
const yargs = require('yargs/yargs')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const _ = require('lodash')
const { File } = require('megajs')
const moment = require('moment-timezone')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { default: XeonBotIncConnect, getAggregateVotesInPollMessage, delay, PHONENUMBER_MCC, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@whiskeysockets/baileys")

const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(new JSONFile(`src/database.json`))

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    database: {},
    chats: {},
    game: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()

if (global.db) setInterval(async () => {
   if (global.db.data) await global.db.write()
}, 30 * 1000)

require('./Bellah.js')
nocache('../Bellah.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'))
require('./main.js')
nocache('../main.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'))

//------------------------------------------------------
// NEW: Session Handling Logic
const passedSessionID = process.argv[2]
const sessionDir = passedSessionID
  ? path.join(__dirname, 'sessions', passedSessionID)
  : path.join(__dirname, 'session')

const credsPath = path.join(sessionDir, 'creds.json')
//------------------------------------------------------

let phoneNumber = "254104245659"
let owner = JSON.parse(fs.readFileSync('./src/data/role/owner.json'))

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function downloadSessionData() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true })

    if (!fs.existsSync(credsPath)) {
      if (!global.SESSION_ID) {
        return console.log(color(`Session id not found at SESSION_ID!\nCreds.json not found at session folder!\n\nWait to enter your number`, 'red'))
      }

      const sessdata = global.SESSION_ID.split("Bellah~")[1]
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`)

      await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) reject(err)
          resolve(data)
        })
      }).then(async (data) => {
        await fs.promises.writeFile(credsPath, data)
        console.log(color(`Session successfully saved, please wait!!`, 'green'))
        await startXeonBotInc()
      })
    }
  } catch (error) {
    console.error('Error downloading session data:', error)
  }
}

async function startXeonBotInc() {
  let { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const msgRetryCounterCache = new NodeCache()

  const XeonBotInc = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !pairingCode,
    mobile: useMobile,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      let jid = jidNormalizedUser(key.remoteJid)
      let msg = await store.loadMessage(jid, key.id)
      return msg?.message || ""
    },
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
  })

  store.bind(XeonBotInc.ev)

  if (pairingCode && !XeonBotInc.authState.creds.registered) {
    if (useMobile) throw new Error('Cannot use pairing code with mobile api')

    let phoneNumber
    if (!!phoneNumber) {
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
      if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
        console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : +254xxx")))
        process.exit(0)
      }
    } else {
      phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number \nFor example: +254xxx : `)))
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
      if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
        console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : +254xxx")))
        phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number \nFor example: +254xxx : `)))
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        rl.close()
      }
    }

    setTimeout(async () => {
      let code = await XeonBotInc.requestPairingCode(phoneNumber)
      code = code?.match(/.{1,4}/g)?.join("-") || code
      console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
    }, 3000)
  }

  XeonBotInc.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    try {
      if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode
        if (reason === DisconnectReason.badSession) {
          console.log(`Bad Session File, Please Delete Session and Scan Again`)
          startXeonBotInc()
        } else if (reason === DisconnectReason.connectionClosed) {
          console.log("Connection closed, reconnecting....")
          startXeonBotInc()
        } else if (reason === DisconnectReason.connectionLost) {
          console.log("Connection Lost from Server, reconnecting...")
          startXeonBotInc()
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log("Connection Replaced, Please Close Current Session First")
          startXeonBotInc()
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(`Device Logged Out, Please Delete Session and Scan Again.`)
          startXeonBotInc()
        } else if (reason === DisconnectReason.restartRequired) {
          console.log("Restart Required, Restarting...")
          startXeonBotInc()
        } else if (reason === DisconnectReason.timedOut) {
          console.log("Connection TimedOut, Reconnecting...")
          startXeonBotInc()
        } else XeonBotInc.end(`Unknown DisconnectReason: ${reason}|${connection}`)
      }
      if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
        console.log(color(`\nConnecting...`, 'white'))
      }
      if (update.connection == "open" || update.receivedPendingNotifications == "true") {
        console.log(color(` `, 'magenta'))
        console.log(color(`Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2), 'green'))
        await delay(1999)
        XeonBotInc.sendMessage(`254104245659@s.whatsapp.net`, { text: `\`CONNECTED\`\n\n Holla, 😴,Connected` })
      }
    } catch (err) {
      console.log('Error in Connection.update ' + err)
      startXeonBotInc()
    }
  })

  XeonBotInc.ev.on('creds.update', saveCreds)
  XeonBotInc.ev.on("messages.upsert", () => {})
}

// Boot it up
downloadSessionData()
