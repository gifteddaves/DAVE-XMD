/*
  Premium System for DAVE-XMD
  WhatsApp: wa.me/254104260236
  Telegram: t.me/Digladoo
  Instagram: instagram.com/_gifted_dave
  GitHub: github.com/gifteddevsmd
*/

const fs = require("fs");
const toMs = require("ms");

// Load premium users list
const premium = JSON.parse(fs.readFileSync('./src/data/role/premium.json'));

// Add or extend premium user
const addPremiumUser = (userId, expired, _dir) => {
	const cekUser = premium.find((user) => user.id === userId);
	if (cekUser) {
		cekUser.expired += toMs(expired);
	} else {
		const obj = { id: userId, expired: Date.now() + toMs(expired) };
		_dir.push(obj);
	}
	fs.writeFileSync("./src/data/role/premium.json", JSON.stringify(_dir));
};

// Get user's position in the premium list
const getPremiumPosition = (userId, _dir) => {
	let position = null;
	for (const i in _dir) {
		if (_dir[i].id === userId) {
			position = i;
			break;
		}
	}
	return position;
};

// Get expiry timestamp for a premium user
const getPremiumExpired = (userId, _dir) => {
	const position = getPremiumPosition(userId, _dir);
	return position !== null ? _dir[position].expired : null;
};

// Check if a user is premium
const checkPremiumUser = (userId, _dir) => {
	return _dir.some((user) => user.id === userId);
};

// Remove expired premium users automatically
const expiredPremiumCheck = (sock, msg, _dir) => {
	setInterval(() => {
		for (let i = 0; i < _dir.length; i++) {
			if (Date.now() >= _dir[i].expired) {
				const idny = _dir[i].id;
				console.log(`Premium expired: ${idny}`);
				_dir.splice(i, 1);
				fs.writeFileSync("./src/data/role/premium.json", JSON.stringify(_dir));
				if (idny) {
					sock.sendMessage(idny, { text: "⏰ Your premium has expired.\nRenew to continue using premium features." });
				}
				break;
			}
		}
	}, 1000);
};

// Get list of all premium user IDs
const getAllPremiumUser = (_dir) => _dir.map(user => user.id);

module.exports = {
	addPremiumUser,
	getPremiumExpired,
	getPremiumPosition,
	expiredPremiumCheck,
	checkPremiumUser,
	getAllPremiumUser,
};
