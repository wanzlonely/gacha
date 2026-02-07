const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const TelegramBot = require('node-telegram-bot-api');
const input = require("input");
const fs = require('fs');
const moment = require('moment-timezone');

const CONFIG = {
    apiId: 35068945,
    apiHash: "K_b8R7Twurk",
    botToken: "7984554210:AAGSDIdl-boOwDYiQNUTxsoMVDBTWNI8XIQ",
    sourceChatId: -1003873870803,
    myGroupId: -1003675929763,
    adminId: 7650101390,
    session: "" 
};

const dbFile = 'database.json';
const bot = new TelegramBot(CONFIG.botToken, { polling: true });

let database = [];
let adminSession = {};

if (fs.existsSync(dbFile)) {
    try {
        database = JSON.parse(fs.readFileSync(dbFile));
    } catch (e) { database = []; }
} else {
    fs.writeFileSync(dbFile, '[]');
}

const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(database, null, 2));
const getWIB = () => moment().tz("Asia/Jakarta").format('HH:mm:ss');
const getDate = () => moment().tz("Asia/Jakarta").format('DD MMMM YYYY');

const createBox = (title, content) => {
    return `╭─── 〔 ${title} 〕 ──
│
${content}
│
╰───────────────────────`;
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
│ ⌨️ 𝗦𝗶𝗹𝗮𝗵𝗸𝗮𝗻 𝗞𝗶𝗿𝗶𝗺 𝗡𝗮𝗺𝗮 𝗙𝗶𝗹𝗲...`;

    bot.sendMessage(chatId, createBox('📥 𝗨𝗣𝗟𝗢𝗔𝗗 𝗠𝗢𝗗𝗘', content), { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text && msg.text.startsWith('/')) return;

    if (chatId === CONFIG.adminId && adminSession[chatId] && adminSession[chatId].step === 'WAITING_NAME') {
        if (!msg.text) return;

        const name = msg.text;
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
    const user = msg.from.first_name;

    if (database.length === 0) {
        bot.sendMessage(chatId, '⚠️ *Database Walzy Kosong*', { parse_mode: 'Markdown' });
        return;
    }

    const keyboard = database.map((item) => {
        return [{ text: `📂 ${item.name}`, callback_data: item.id }];
    });

    const content = `│ 👋 𝗛𝗮𝗹𝗼, ${user}
│ ⌚ 𝗧𝗶𝗺𝗲 : ${getWIB()} 𝗪𝗜𝗕
│ 📅 𝗗𝗮𝘁𝗲 : ${getDate()}
│
│ 🔻 *𝗦𝗜𝗟𝗔𝗛𝗞𝗔𝗡 𝗔𝗠𝗕𝗜𝗟 𝗡𝗢𝗠𝗢𝗥 (𝗚𝗥𝗔𝗧𝗜𝗦) :*`;

    bot.sendMessage(chatId, createBox('☠️ 𝗪𝗔𝗟𝗭𝗬 𝗘𝗫𝗣𝗟𝗢𝗜𝗧 ☠️', content), {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const dataId = query.data;
    const item = database.find(x => x.id === dataId);

    if (item) {
        bot.answerCallbackQuery(query.id, { text: '🔄 Walzy Downloading...' });
        
        const content = `│ 📂 𝗙𝗶𝗹𝗲 : *${item.name}*
│ 💾 𝗦𝗶𝘇𝗲 : \`${item.size}\`
│ 📅 𝗨𝗽𝗹𝗼𝗮𝗱 : ${item.date}
│
│ 🚀 _𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗪𝗮𝗹𝘇𝘆 𝗘𝘅𝗽𝗹𝗼𝗶𝘁_`;

        bot.sendDocument(chatId, item.fileId, {
            caption: createBox('✅ 𝗙𝗜𝗟𝗘 𝗥𝗘𝗔𝗗𝗬', content),
            parse_mode: 'Markdown'
        });
    } else {
        bot.answerCallbackQuery(query.id, { text: 'File Error.' });
    }
});

console.log('Walzy Hybrid System Running...');
