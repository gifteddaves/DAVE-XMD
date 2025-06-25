//base by DGXeon
//recode by Dave
//YouTube: @Dave

const fs = require('fs')
const chalk = require('chalk')
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname + '/.env' })

global.SESSION_ID = process.env.SESSION_ID || 'Bellah~2z40RA7T#VRneuCjwFxSYHupVJSJHZDNmNDE_THLCNxjVd9jGWuw'

// Owner vCard
global.ytname = "YT: Dave" // your YouTube channel
global.socialm = "IG: @gifted_dave" // your Instagram or GitHub
global.location = "Kenya" // your location

// Bot Info
global.botname = process.env.BOT_NAME || '𝐃𝐀𝐕𝐄 𝐗𝐌𝐃' // bot name
global.ownernumber = process.env.OWNER_NUMBER || '254104245659' // owner number
global.ownername = '© Dave' // owner name
global.websitex = "https://whatsapp.com/channel/0029VaPZWbY1iUxVVRIIOm0D" // channel link
global.wagc = "https://chat.whatsapp.com/Hs0AwkOaFzbGi5sjicdeTR" // WhatsApp group
global.themeemoji = '🪀'
global.wm = "Dave"
global.botscript = 'https://whatsapp.com/channel/0029VaPZWbY1iUxVVRIIOm0D' // bot script/channel link
global.packname = process.env.PACK_NAME || "DAVE-XMD" // sticker pack name
global.author = "Dave"
global.creator = "254104260236@s.whatsapp.net"
global.xprefix = process.env.PREFIX || '.'
global.premium = ["254104260236"] // Premium users
global.hituet = 0

// Bot Settings
global.typemenu = process.env.TYPE_MENU || 'v2'
global.typereply = process.env.TYPE_REPLY || 'v1'
global.autoblocknumber = process.env.AUTOBLOCK_NUMBER || '263,234'
global.antiforeignnumber = process.env.ANTIFOREIGN_NUMBER || ''
global.welcome = process.env.WELCOME || 'false'
global.anticall = process.env.ANTI_CALL || 'false'
global.autoswview = process.env.AUTOSW_VIEW || 'true'
global.adminevent = true
global.groupevent = true

// Message Settings
global.autorecord = process.env.AUTO_RECORD || 'false'
global.autorecordtype = process.env.AUTO_RECORDTYPE || 'false'

global.mess = {
	limit: 'Your limit is up <\\>',
	nsfw: 'Nsfw is disabled in this group, Please tell the admin to enable',
    done: 'Done ✓',
    error: 'Error !',
    success: 'Success •'
}

// Thumbnail/Sticker Logo
global.thumb = fs.readFileSync('./XMEDIA/theme/davexmd.jpg') // ← use your uploaded logo image

// File Watcher for Auto-Reload
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update '${__filename}'`))
    delete require.cache[file]
    require(file)
})
