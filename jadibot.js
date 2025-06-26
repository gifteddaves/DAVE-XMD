const { modul } = require('./module'); const { baileys, boom, chalk, fs, figlet, FileType, process, PhoneNumber } = modul; const { Boom } = boom const path = require('path'); const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, generateWAMessage, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, makeCacheableSignalKeyStore } = baileys; const { color, bgcolor } = require('./lib/color'); const log = (pino = require("pino")); const qrcode = require('qrcode'); const rimraf = require("rimraf"); let Pino = require("pino");

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif'); const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep, reSize } = require('./myfunc'); const owner = JSON.parse(fs.readFileSync('./src/data/role/owner.json').toString()); const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) }); let NodeCache = require("node-cache"); let msgRetryCounterCache = new NodeCache();

if (!global.conns) global.conns = [];

const jadibot = async (connMain, number, m, from) => { const { sender } = m; const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, ./jadibot/${sender})); try { async function start() { const { version } = await fetchLatestBaileysVersion(); const config = { logger: Pino({ level: "fatal" }).child({ level: "fatal" }), printQRInTerminal: false, mobile: false, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" })) }, browser: ["Ubuntu", "Chrome", "20.0.04"], markOnlineOnConnect: true, generateHighQualityLinkPreview: true, msgRetryCounterCache, defaultQueryTimeoutMs: undefined }; const simple = require('./simple'); const conn = simple.makeWASocket(config);

if (!conn.authState.creds.registered) {
    setTimeout(async () => {
      console.log(chalk.red.bold(`[ Jadibot ] -> (+${number})`));
      const code = await conn.requestPairingCode(number);
      const hasilcode = code?.match(/.{1,4}/g)?.join("-") || code;
      global.codepairing = `${hasilcode}`;
    }, 3000);
  }

  conn.public = true;
  store.bind(conn.ev);
  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.timedOut].includes(reason)) {
        start();
      } else conn.end();
    } else if (connection === 'open') {
      conn.id = conn.decodeJid(conn.user.id);
      conn.time = Date.now();
      global.conns.push(conn);
      await m.reply(`*Connected: ${conn.id}*`);
    }
  });

  conn.ev.on('messages.upsert', async chatUpdate => {
    try {
      const msg = chatUpdate.messages?.[0];
      if (!msg || !msg.message) return;
      const raw = Object.keys(msg.message)[0] === 'ephemeralMessage' ? msg.message.ephemeralMessage.message : msg.message;
      msg.message = raw;
      if (msg.key?.remoteJid === 'status@broadcast') return;
      if (!conn.public && !msg.key.fromMe) return;
      const mObj = smsg(conn, msg, store);
      require('./XeonCheems10.js')(conn, mObj, chatUpdate, store);
    } catch (err) {
      console.error(err);
    }
  });

  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    } else return jid;
  };
}
start();

} catch (e) { console.log(e); } };

module.exports = { jadibot, conns };

   
