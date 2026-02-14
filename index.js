const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const TelegramBot = require('node-telegram-bot-api');
const input = require("input");
const fs = require('fs');
const moment = require('moment-timezone');

const CONFIG = {
    apiId: 39113132,
    apiHash: "4131586e1bbef992beb4b563aa8681ed",
    botToken: "8531617912:AAH4qdR7BH9b6Q89_JdtCy0oZ_0FDh_CA0o",
    sourceChatId: -1003808609180,
    myGroupId: -1003806004438,
    adminId: 8062935882,
    session: "" 
};

const dbFile = 'database.json';
const userDataFile = 'user_data.json';
const bot = new TelegramBot(CONFIG.botToken, { polling: true });

let database = [];
let userDatabase = [];
let adminSession = {};

if (fs.existsSync(dbFile)) {
    try {
        database = JSON.parse(fs.readFileSync(dbFile));
    } catch (e) { database = []; }
} else {
    fs.writeFileSync(dbFile, '[]');
}

if (fs.existsSync(userDataFile)) {
    try {
        userDatabase = JSON.parse(fs.readFileSync(userDataFile));
    } catch (e) { userDatabase = []; }
} else {
    fs.writeFileSync(userDataFile, '[]');
}

const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(database, null, 2));
const saveUserDb = () => fs.writeFileSync(userDataFile, JSON.stringify(userDatabase, null, 2));
const getWIB = () => moment().tz("Asia/Jakarta").format('HH:mm:ss');
const getDate = () => moment().tz("Asia/Jakarta").format('DD MMMM YYYY');

const createBox = (title, content) => {
    return `╭─── 〔 ${title} 〕 ──
│
${content}
│
╰───────────────────────`;
};

const createFancyBox = (emoji, title, content, footer = '') => {
    return `\( {emoji} * \){title}* ${emoji}
${content}
\( {footer ? `_ \){footer}_` : ''}`;
};

const parseNumbersFromFile = async (fileId) => {
    try {
        const fileUrl = await bot.getFileLink(fileId);
        const response = await fetch(fileUrl);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim().match(/^\+\d{10,15}$/));
        return lines;
    } catch (err) {
        console.error('Error parsing file:', err);
        return [];
    }
};

const saveUserNumbers = (userId, country, numbers) => {
    const existing = userDatabase.find(u => u.userId === userId);
    if (existing) {
        existing.history.push({ country, numbers, date: getDate(), time: getWIB() });
    } else {
        userDatabase.push({
            userId,
            history: [{ country, numbers, date: getDate(), time: getWIB() }]
        });
    }
    saveUserDb();
};

(async () => {
    const client = new TelegramClient(new StringSession(CONFIG.session), CONFIG.apiId, CONFIG.apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Nomor HP: "),
        password: async () => await input.text("Password 2FA: "),
        phoneCode: async () => await input.text("Kode OTP: "),
        onError: (err) => console.log(err),
    });

    console.log("Walzy System Connected.");
    console.log(client.session.save());

    client.addEventHandler(async (event) => {
        const message = event.message;
        if (message && message.message) {
            const originalText = message.message;

            const content = `│ 👤 𝗦𝗼𝘂𝗿𝗰𝗲 : 𝗟𝗶𝘃𝗲 𝗧𝗮𝗿𝗴𝗲𝘁
│ ⌚ 𝗧𝗶𝗺𝗲   : ${getWIB()} WIB
│ 📅 𝗗𝗮𝘁𝗲   : ${getDate()}
│
│ 💬 *𝗣𝗘𝗦𝗔𝗡 𝗧𝗘𝗥𝗕𝗔𝗥𝗨 :*
│ ${originalText}
│
│ ⚡ 𝗦𝘁𝗮𝘁𝘂𝘀 : *𝗔𝗰𝘁𝗶𝘃𝗲 𝗦𝗽𝘆*`;

            try {
                await bot.sendMessage(CONFIG.myGroupId, createBox('☠️ 𝗪𝗔𝗟𝗭𝗬 𝗦𝗣𝗬 ☠️', content), {
                    parse_mode: 'Markdown'
                });
            } catch (err) {
                console.error(err.message);
            }
        }
    }, new NewMessage({ chats: [CONFIG.sourceChatId] }));
})();

bot.on('document', (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== CONFIG.adminId) return;

    adminSession[chatId] = {
        fileId: msg.document.file_id,
        fileName: msg.document.file_name,
        fileSize: (msg.document.file_size / 1024).toFixed(2) + ' KB',
        step: 'WAITING_NAME'
    };

    const content = `│ 📂 𝗙𝗶𝗹𝗲 : \`${msg.document.file_name}\`
│ 💾 𝗦𝗶𝘇𝗲 : \`${adminSession[chatId].fileSize}\`
│
│ ⌨️ 𝗦𝗶𝗹𝗮𝗵𝗸𝗮𝗻 𝗞𝗶𝗿𝗶𝗺 𝗡𝗮𝗺𝗮 𝗙𝗶𝗹𝗲 (contoh: Venezuela 7k Numbers)...`;

    bot.sendMessage(chatId, createBox('📥 𝗨𝗣𝗟𝗢𝗔𝗗 𝗠𝗢𝗗𝗘', content), { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text && msg.text.startsWith('/')) return;

    if (chatId === CONFIG.adminId && adminSession[chatId] && adminSession[chatId].step === 'WAITING_NAME') {
        if (!msg.text) return;

        const name = msg.text.trim();
        const session = adminSession[chatId];

        const newData = {
            id: Date.now().toString(),
            name: name,
            fileId: session.fileId,
            size: session.fileSize,
            date: getDate()
        };

        database.push(newData);
        saveDb();
        delete adminSession[chatId];

        const content = `│ 🏷️ 𝗡𝗮𝗺𝗮 : ${name}
│ 📅 𝗗𝗮𝘁𝗲 : ${newData.date}
│ ⚡ 𝗦𝘁𝗮𝘁𝘂𝘀 : *𝗧𝗲𝗿𝘀𝗶𝗺𝗽𝗮𝗻 (𝗣𝘂𝗯𝗹𝗶𝗸)*`;

        bot.sendMessage(chatId, createBox('✅ 𝗗𝗔𝗧𝗔 𝗦𝗔𝗩𝗘𝗗', content), { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from.first_name || 'User';
    const userId = msg.from.id;

    if (database.length === 0) {
        bot.sendMessage(chatId, '⚠️ *Database Walzy Kosong*\nSilakan hubungi admin untuk menambahkan negara.', { parse_mode: 'Markdown' });
        return;
    }

    const countries = database.map(item => ({
        name: item.name.split(' ')[0],
        flag: getFlagEmoji(item.name),
        id: item.id,
        count: extractCount(item.name)
    })).filter((item, index, self) => 
        index === self.findIndex(t => t.name === item.name)
    );

    const keyboard = countries.map(country => [{
        text: `${getFlagEmoji(country.name)} \( {country.name} ( \){country.count})`,
        callback_data: `country:${country.id}`
    }]);

    const content = `🌟 *Selamat Datang, ${user}!* 🌟

⌚ *Waktu:* ${getWIB()} WIB | 📅 *Tanggal:* ${getDate()}

🔥 *Pilih Negara untuk Gacha Nomor WhatsApp (Gratis!)*

_Pilih negara di bawah untuk mendapatkan 5 nomor segar secara random._

💡 *Tips:* Nomor disimpan otomatis di akunmu untuk riwayat.`;

    bot.sendMessage(chatId, createFancyBox('🇺🇸', 'PAK CYBER NUMBERS', content, 'Powered by Walzy Exploit'), {
        parse_mode: 'Markdown',
        reply_markup: { 
            inline_keyboard: [
                ...keyboard,
                [{ text: '📊 Riwayat Saya', callback_data: 'history' }],
                [{ text: '👥 Join OTP Group', url: 'https://t.me/your_otp_group' }]
            ] 
        }
    });

    if (!userDatabase.find(u => u.userId === userId)) {
        userDatabase.push({ userId, history: [] });
        saveUserDb();
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    bot.answerCallbackQuery(query.id);

    if (data.startsWith('country:')) {
        const fileId = data.split(':')[1];
        const item = database.find(x => x.id === fileId);
        if (!item) {
            bot.sendMessage(chatId, '❌ File tidak ditemukan.');
            return;
        }

        bot.sendMessage(chatId, '🔄 *Sedang menggacha 5 nomor segar...*', { parse_mode: 'Markdown' });

        const numbers = await parseNumbersFromFile(item.fileId);
        if (numbers.length === 0) {
            bot.sendMessage(chatId, '❌ Tidak ada nomor tersedia. Hubungi admin.');
            return;
        }

        const shuffled = numbers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        const country = item.name.split(' ')[0];
        const content = selected.map((num, i) => `📱 *Nomor \( {i+1}:* \` \){num}\``).join('\n');

        const message = createFancyBox('✅', `${getFlagEmoji(country)} ${country} - 5 Nomor Baru`, 
            `Dapatkan nomor WhatsApp segar dari \( {country}!\n\n \){content}\n\n⏰ *Waktu:* ${getWIB()} WIB`,
            'Gunakan untuk verifikasi. Get Next untuk lebih banyak!'
        );

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        saveUserNumbers(userId, country, selected);

        const keyboard = [
            [{ text: '🔄 Get Next 5', callback_data: `country:${fileId}` }],
            [{ text: '🏠 Kembali ke Menu', callback_data: 'back' }]
        ];
        bot.sendMessage(chatId, 'Pilih aksi:', {
            reply_markup: { inline_keyboard: keyboard }
        });

    } else if (data === 'history') {
        const userHistory = userDatabase.find(u => u.userId === userId)?.history || [];
        if (userHistory.length === 0) {
            bot.sendMessage(chatId, '📭 *Riwayat kosong.* Mulai gacha nomor dulu!');
            return;
        }

        let historyText = '📜 *Riwayat Gacha Kamu:*\n\n';
        userHistory.slice(-5).reverse().forEach(h => { 
            historyText += `\( {getFlagEmoji(h.country)} * \){h.country}* - ${h.numbers.length} nomor\n⏰ ${h.time} | 📅 ${h.date}\n\n`;
        });

        bot.sendMessage(chatId, createFancyBox('📊', 'Riwayat Saya', historyText), { parse_mode: 'Markdown' });

    } else if (data === 'back') {
        bot.deleteMessage(chatId, query.message.message_id);
        bot.sendMessage(chatId, '/start', { parse_mode: 'Markdown' });
    }
});

const getFlagEmoji = (country) => {
    const flags = {
  "Andorra": "🇦🇩",
  "United Arab Emirates": "🇦🇪",
  "Afghanistan": "🇦🇫",
  "Antigua and Barbuda": "🇦🇬",
  "Anguilla": "🇦🇮",
  "Albania": "🇦🇱",
  "Armenia": "🇦🇲",
  "Angola": "🇦🇴",
  "Antarctica": "🇦🇶",
  "Argentina": "🇦🇷",
  "American Samoa": "🇦🇸",
  "Austria": "🇦🇹",
  "Australia": "🇦🇺",
  "Aruba": "🇦🇼",
  "Åland Islands": "🇦🇽",
  "Azerbaijan": "🇦🇿",
  "Bosnia and Herzegovina": "🇧🇦",
  "Barbados": "🇧🇧",
  "Bangladesh": "🇧🇩",
  "Belgium": "🇧🇪",
  "Burkina Faso": "🇧🇫",
  "Bulgaria": "🇧🇬",
  "Bahrain": "🇧🇭",
  "Burundi": "🇧🇮",
  "Benin": "🇧🇯",
  "Saint Barthélemy": "🇧🇱",
  "Bermuda": "🇧🇲",
  "Brunei Darussalam": "🇧🇳",
  "Bolivia": "🇧🇴",
  "Bonaire, Sint Eustatius and Saba": "🇧🇶",
  "Brazil": "🇧🇷",
  "Bahamas": "🇧🇸",
  "Bhutan": "🇧🇹",
  "Bouvet Island": "🇧🇻",
  "Botswana": "🇧🇼",
  "Belarus": "🇧🇾",
  "Belize": "🇧🇿",
  "Canada": "🇨🇦",
  "Cocos (Keeling) Islands": "🇨🇨",
  "Congo": "🇨🇩",
  "Central African Republic": "🇨🇫",
  "Congo": "🇨🇬",
  "Switzerland": "🇨🇭",
  "Côte D'Ivoire": "🇨🇮",
  "Cook Islands": "🇨🇰",
  "Chile": "🇨🇱",
  "Cameroon": "🇨🇲",
  "China": "🇨🇳",
  "Colombia": "🇨🇴",
  "Costa Rica": "🇨🇷",
  "Cuba": "🇨🇺",
  "Cape Verde": "🇨🇻",
  "Curaçao": "🇨🇼",
  "Christmas Island": "🇨🇽",
  "Cyprus": "🇨🇾",
  "Czech Republic": "🇨🇿",
  "Germany": "🇩🇪",
  "Djibouti": "🇩🇯",
  "Denmark": "🇩🇰",
  "Dominica": "🇩🇲",
  "Dominican Republic": "🇩🇴",
  "Algeria": "🇩🇿",
  "Ecuador": "🇪🇨",
  "Estonia": "🇪🇪",
  "Egypt": "🇪🇬",
  "Western Sahara": "🇪🇭",
  "Eritrea": "🇪🇷",
  "Spain": "🇪🇸",
  "Ethiopia": "🇪🇹",
  "Finland": "🇫🇮",
  "Fiji": "🇫🇯",
  "Falkland Islands (Malvinas)": "🇫🇰",
  "Micronesia": "🇫🇲",
  "Faroe Islands": "🇫🇴",
  "France": "🇫🇷",
  "Gabon": "🇬🇦",
  "United Kingdom": "🇬🇧",
  "Grenada": "🇬🇩",
  "Georgia": "🇬🇪",
  "French Guiana": "🇬🇫",
  "Guernsey": "🇬🇬",
  "Ghana": "🇬🇭",
  "Gibraltar": "🇬🇮",
  "Greenland": "🇬🇱",
  "Gambia": "🇬🇲",
  "Guinea": "🇬🇳",
  "Guadeloupe": "🇬🇵",
  "Equatorial Guinea": "🇬🇶",
  "Greece": "🇬🇷",
  "South Georgia": "🇬🇸",
  "Guatemala": "🇬🇹",
  "Guam": "🇬🇺",
  "Guinea-Bissau": "🇬🇼",
  "Guyana": "🇬🇾",
  "Hong Kong": "🇭🇰",
  "Heard Island and Mcdonald Islands": "🇭🇲",
  "Honduras": "🇭🇳",
  "Croatia": "🇭🇷",
  "Haiti": "🇭🇹",
  "Hungary": "🇭🇺",
  "Indonesia": "🇮🇩",
  "Ireland": "🇮🇪",
  "Israel": "🇮🇱",
  "Isle of Man": "🇮🇲",
  "India": "🇮🇳",
  "British Indian Ocean Territory": "🇮🇴",
  "Iraq": "🇮🇶",
  "Iran": "🇮🇷",
  "Iceland": "🇮🇸",
  "Italy": "🇮🇹",
  "Jersey": "🇯🇪",
  "Jamaica": "🇯🇲",
  "Jordan": "🇯🇴",
  "Japan": "🇯🇵",
  "Kenya": "🇰🇪",
  "Kyrgyzstan": "🇰🇬",
  "Cambodia": "🇰🇭",
  "Kiribati": "🇰🇮",
  "Comoros": "🇰🇲",
  "Saint Kitts and Nevis": "🇰🇳",
  "North Korea": "🇰🇵",
  "South Korea": "🇰🇷",
  "Kuwait": "🇰🇼",
  "Cayman Islands": "🇰🇾",
  "Kazakhstan": "🇰🇿",
  "Lao People's Democratic Republic": "🇱🇦",
  "Lebanon": "🇱🇧",
  "Saint Lucia": "🇱🇨",
  "Liechtenstein": "🇱🇮",
  "Sri Lanka": "🇱🇰",
  "Liberia": "🇱🇷",
  "Lesotho": "🇱🇸",
  "Lithuania": "🇱🇹",
  "Luxembourg": "🇱🇺",
  "Latvia": "🇱🇻",
  "Libya": "🇱🇾",
  "Morocco": "🇲🇦",
  "Monaco": "🇲🇨",
  "Moldova": "🇲🇩",
  "Montenegro": "🇲🇪",
  "Saint Martin (French Part)": "🇲🇫",
  "Madagascar": "🇲🇬",
  "Marshall Islands": "🇲🇭",
  "Macedonia": "🇲🇰",
  "Mali": "🇲🇱",
  "Myanmar": "🇲🇲",
  "Mongolia": "🇲🇳",
  "Macao": "🇲🇴",
  "Northern Mariana Islands": "🇲🇵",
  "Martinique": "🇲🇶",
  "Mauritania": "🇲🇷",
  "Montserrat": "🇲🇸",
  "Malta": "🇲🇹",
  "Mauritius": "🇲🇺",
  "Maldives": "🇲🇻",
  "Malawi": "🇲🇼",
  "Mexico": "🇲🇽",
  "Malaysia": "🇲🇾",
  "Mozambique": "🇲🇿",
  "Namibia": "🇳🇦",
  "New Caledonia": "🇳🇨",
  "Niger": "🇳🇪",
  "Norfolk Island": "🇳🇫",
  "Nigeria": "🇳🇬",
  "Nicaragua": "🇳🇮",
  "Netherlands": "🇳🇱",
  "Norway": "🇳🇴",
  "Nepal": "🇳🇵",
  "Nauru": "🇳🇷",
  "Niue": "🇳🇺",
  "New Zealand": "🇳🇿",
  "Oman": "🇴🇲",
  "Panama": "🇵🇦",
  "Peru": "🇵🇪",
  "French Polynesia": "🇵🇫",
  "Papua New Guinea": "🇵🇬",
  "Philippines": "🇵🇭",
  "Pakistan": "🇵🇰",
  "Poland": "🇵🇱",
  "Saint Pierre and Miquelon": "🇵🇲",
  "Pitcairn": "🇵🇳",
  "Puerto Rico": "🇵🇷",
  "Palestinian Territory": "🇵🇸",
  "Portugal": "🇵🇹",
  "Palau": "🇵🇼",
  "Paraguay": "🇵🇾",
  "Qatar": "🇶🇦",
  "Réunion": "🇷🇪",
  "Romania": "🇷🇴",
  "Serbia": "🇷🇸",
  "Russia": "🇷🇺",
  "Rwanda": "🇷🇼",
  "Saudi Arabia": "🇸🇦",
  "Solomon Islands": "🇸🇧",
  "Seychelles": "🇸🇨",
  "Sudan": "🇸🇩",
  "Sweden": "🇸🇪",
  "Singapore": "🇸🇬",
  "Saint Helena, Ascension and Tristan Da Cunha": "🇸🇭",
  "Slovenia": "🇸🇮",
  "Svalbard and Jan Mayen": "🇸🇯",
  "Slovakia": "🇸🇰",
  "Sierra Leone": "🇸🇱",
  "San Marino": "🇸🇲",
  "Senegal": "🇸🇳",
  "Somalia": "🇸🇴",
  "Suriname": "🇸🇷",
  "South Sudan": "🇸🇸",
  "Sao Tome and Principe": "🇸🇹",
  "El Salvador": "🇸🇻",
  "Sint Maarten (Dutch Part)": "🇸🇽",
  "Syrian Arab Republic": "🇸🇾",
  "Swaziland": "🇸🇿",
  "Turks and Caicos Islands": "🇹🇨",
  "Chad": "🇹🇩",
  "French Southern Territories": "🇹🇫",
  "Togo": "🇹🇬",
  "Thailand": "🇹🇭",
  "Tajikistan": "🇹🇯",
  "Tokelau": "🇹🇰",
  "Timor-Leste": "🇹🇱",
  "Turkmenistan": "🇹🇲",
  "Tunisia": "🇹🇳",
  "Tonga": "🇹🇴",
  "Turkey": "🇹🇷",
  "Trinidad and Tobago": "🇹🇹",
  "Tuvalu": "🇹🇻",
  "Taiwan": "🇹🇼",
  "Tanzania": "🇹🇿",
  "Ukraine": "🇺🇦",
  "Uganda": "🇺🇬",
  "United States Minor Outlying Islands": "🇺🇲",
  "United States": "🇺🇸",
  "Uruguay": "🇺🇾",
  "Uzbekistan": "🇺🇿",
  "Vatican City": "🇻🇦",
  "Saint Vincent and The Grenadines": "🇻🇨",
  "Venezuela": "🇻🇪",
  "Virgin Islands, British": "🇻🇬",
  "Virgin Islands, U.S.": "🇻🇮",
  "Viet Nam": "🇻🇳",
  "Vanuatu": "🇻🇺",
  "Wallis and Futuna": "🇼🇫",
  "Samoa": "🇼🇸",
  "Yemen": "🇾🇪",
  "Mayotte": "🇾🇹",
  "South Africa": "🇿🇦",
  "Zambia": "🇿🇲",
  "Zimbabwe": "🇿🇼"
    };
    return flags[country] || '🌍';
};

const extractCount = (name) => {
    const match = name.match(/(\d+k?)/i);
    return match ? match[1] : 'N/A';
};

console.log('Walzy Upgraded System Running...');