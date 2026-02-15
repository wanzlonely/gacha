const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const TelegramBot = require('node-telegram-bot-api');
const input = require("input");
const moment = require('moment-timezone');
const fs = require('fs');

const CONFIG = {
    apiId: 39113132,
    apiHash: "4131586e1bbef992beb4b563aa8681ed",
    botToken: "8531617912:AAH4qdR7BH9b6Q89_JdtCy0oZ_0FDh_CA0o",
    adminId: 8062935882,
    myGroupId: -1003887790861,
    fileGroupId: -1003671573755,
    fsubChatIds: ["@numberspyx", "@otpspyx"],
    sourceChatIds: [
        "-1003562550168", "-1003873870803", "-1003388744078",
        "-1003808609180", "-1003522959807", "-1001234567890"
    ],
    sessionFile: "session.txt"
};

const bot = new TelegramBot(CONFIG.botToken, { polling: true });
let messageQueue = [];
let isProcessingQueue = false;

const getWIB = () => moment().tz("Asia/Jakarta").format('HH:mm:ss');
const getDate = () => moment().tz("Asia/Jakarta").format('DD/MM/YYYY');

const escapeHtml = (unsafe) => {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const loadSession = () => {
    if (fs.existsSync(CONFIG.sessionFile)) {
        return fs.readFileSync(CONFIG.sessionFile, "utf8");
    }
    return "";
};

const saveSession = (sessionData) => {
    fs.writeFileSync(CONFIG.sessionFile, sessionData);
};

const detectService = (text) => {
    const t = text.toLowerCase();
    if (t.includes('whatsapp') || t.includes('wa ') || t.includes('ws ')) return 'WhatsApp';
    if (t.includes('telegram') || t.includes('tg ')) return 'Telegram';
    if (t.includes('facebook') || t.includes('fb ')) return 'Facebook';
    if (t.includes('instagram') || t.includes('ig ')) return 'Instagram';
    if (t.includes('tiktok')) return 'TikTok';
    if (t.includes('google') || t.includes('gmail')) return 'Google';
    if (t.includes('shopee')) return 'Shopee';
    if (t.includes('gojek') || t.includes('gopay')) return 'Gojek';
    if (t.includes('grab')) return 'Grab';
    if (t.includes('dana')) return 'DANA';
    if (t.includes('ovo')) return 'OVO';
    
    const codePattern = /#[a-zA-Z]{2}\s+([a-zA-Z0-9]+)/;
    const match = text.match(codePattern);
    if (match && match[1]) return match[1].toUpperCase();

    return 'Universal';
};

const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
        const item = messageQueue.shift();
        try {
            const sentMsg = await bot.sendMessage(CONFIG.myGroupId, item.text, {
                parse_mode: 'HTML',
                reply_markup: item.markup,
                disable_web_page_preview: true
            });

            setTimeout(() => {
                bot.deleteMessage(CONFIG.myGroupId, sentMsg.message_id).catch(() => {});
            }, 60000);

        } catch (err) {
            console.error(err.message);
        }
        await new Promise(r => setTimeout(r, 40));
    }

    isProcessingQueue = false;
};

const addToQueue = (text, markup) => {
    messageQueue.push({ text, markup });
    processQueue();
};

const checkSubscription = async (userId) => {
    try {
        for (const chatId of CONFIG.fsubChatIds) {
            const member = await bot.getChatMember(chatId, userId);
            if (['left', 'kicked'].includes(member.status)) return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

(async () => {
    console.log("SYSTEM STARTED...");
    
    const stringSession = new StringSession(loadSession());
    
    const client = new TelegramClient(stringSession, CONFIG.apiId, CONFIG.apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Number: "),
        password: async () => await input.text("2FA: "),
        phoneCode: async () => await input.text("OTP: "),
        onError: (err) => console.log(err),
    });

    saveSession(client.session.save());
    console.log("CLIENT CONNECTED.");

    client.addEventHandler(async (event) => {
        const message = event.message;
        if (!message) return;

        const chatId = message.chatId ? message.chatId.toString() : "";
        
        const isSource = CONFIG.sourceChatIds.some(id => 
            chatId.replace("-100", "") === id.replace("-100", "") || chatId === id
        );

        if (isSource) {
            let extractedCode = null;
            let fullText = message.message || "";

            if (message.replyMarkup && message.replyMarkup.rows) {
                for (let row of message.replyMarkup.rows) {
                    for (let btn of row.buttons) {
                        fullText += " " + (btn.text || "");
                        if (/^(?:\d{4,8}|\d{3}[- ]\d{3})$/.test((btn.text || "").trim())) {
                            extractedCode = (btn.text || "").replace(/[^0-9]/g, '');
                            break;
                        }
                    }
                    if (extractedCode) break;
                }
            }

            if (!extractedCode) {
                const patterns = [
                    /Code\s*[:]\s*(\d{4,8})/i,
                    /OTP\s*[:]\s*(\d{4,8})/i,
                    /(?<!\d)(\d{3}[- ]\d{3})(?!\d)/,
                    /(?<!\d)(\d{4,8})(?!\d)/
                ];

                for (let pattern of patterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                        extractedCode = (match[1] || match[0]).replace(/[^0-9]/g, '');
                        break;
                    }
                }
            }

            if (!extractedCode) return;

            const serviceName = detectService(fullText);
            const safeMsg = escapeHtml(message.message || "Attached Media/Button Only");
            
            const displayContent = `
<b>☠️ 𝗪𝗔𝗟𝗭𝗬 𝗜𝗡𝗧𝗘𝗥𝗖𝗘𝗣𝗧𝗢𝗥</b>
━━━━━━━━━━━━━━━━━━━
<b>┌ 📡 𝗔𝗽𝗽   : ${serviceName.toUpperCase()}</b>
<b>├ 🕒 𝗧𝗶𝗺𝗲  : ${getWIB()} WIB</b>
<b>└ 🔐 𝗖𝗼𝗱𝗲  :</b> <code>${extractedCode}</code>

<blockquote>${safeMsg.substring(0, 300)}</blockquote>
━━━━━━━━━━━━━━━━━━━
<i>👾 Encrypted Connection Established</i>`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: `⛓️ 𝗖𝗢𝗣𝗬 : ${extractedCode}`, copy_text: { text: extractedCode } }
                    ],
                    [
                        { text: "💎 𝗩𝗜𝗣 𝗔𝗖𝗖𝗘𝗦𝗦", url: "https://t.me/numberwalz" }
                    ]
                ]
            };

            addToQueue(displayContent, keyboard);
        }
    }, new NewMessage({}));
})();

bot.on('document', async (msg) => {
    if (msg.chat.id.toString() !== CONFIG.adminId.toString()) return;

    const fileName = msg.document.file_name || "unknown";
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const nameParts = cleanName.split(/[-_ ]/);

    const country = (nameParts[0] || "Global").toUpperCase();
    const service = (msg.caption || (nameParts.length > 1 ? nameParts[1] : "Mixed")).toUpperCase();

    const caption = `
<b>📂 𝗪𝗔𝗟𝗭𝗬 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘</b>
━━━━━━━━━━━━━━━━━━━
<b>🌍 𝗥𝗲𝗴𝗶𝗼𝗻  : ${country}</b>
<b>📱 𝗧𝘆𝗽𝗲    : ${service}</b>
<b>💾 𝗦𝗶𝘇𝗲    : ${(msg.document.file_size / 1024).toFixed(2)} KB</b>
<b>📅 𝗗𝗮𝘁𝗲    : ${getDate()}</b>
━━━━━━━━━━━━━━━━━━━
<i>✅ Verificated by Walzy System</i>
    `;

    try {
        await bot.sendDocument(CONFIG.fileGroupId, msg.document.file_id, {
            caption: caption,
            parse_mode: 'HTML'
        });
        bot.sendMessage(msg.chat.id, `✅ <b>UPLOADED</b>\n<code>${fileName}</code>`, { parse_mode: 'HTML' });
    } catch (e) {
        bot.sendMessage(msg.chat.id, `❌ <b>ERROR</b>\nCheck Channel ID`, { parse_mode: 'HTML' });
    }
});

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    if (chatId.toString() === CONFIG.adminId.toString()) {
        return bot.sendMessage(chatId, `<b>👑 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗠𝗔𝗦𝗧𝗘𝗥</b>\n<i>System is Online & Ready.</i>`, { parse_mode: 'HTML' });
    }

    const isJoined = await checkSubscription(chatId);
    if (!isJoined) {
        const joinKeyboard = CONFIG.fsubChatIds.map((channel, idx) => 
            [{ text: `📢 𝗝𝗢𝗜𝗡 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 ${idx + 1}`, url: `https://t.me/${channel.replace('@', '')}` }]
        );
        joinKeyboard.push([{ text: "🟢 𝗩𝗘𝗥𝗜𝗙𝗬 𝗔𝗖𝗖𝗘𝗦𝗦", callback_data: "check_sub" }]);

        const msgDeny = `
<b>⛔ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗</b>
━━━━━━━━━━━━━━━━━━━
<i>Sistem mendeteksi Anda belum terdaftar di database kami. Silahkan bergabung untuk melanjutkan.</i>
        `;
        
        bot.sendMessage(chatId, msgDeny, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: joinKeyboard }
        });
        return;
    }

    const welcomeMsg = `
<b>👋 𝗛𝗘𝗟𝗟𝗢 𝗨𝗦𝗘𝗥</b>
━━━━━━━━━━━━━━━━━━━
<b>🆔 ID :</b> <code>${chatId}</code>
<b>🤖 Status :</b> <i>Online</i>

<i>Untuk pembelian script bot atau akses VIP, silahkan hubungi administrator.</i>
    `;

    bot.sendMessage(chatId, welcomeMsg, { 
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [[{ text: "📩 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 𝗔𝗗𝗠𝗜𝗡", url: "https://t.me/walzyexploit" }]]
        }
    });
});

bot.on('callback_query', async (query) => {
    if (query.data === "check_sub") {
        const isJoined = await checkSubscription(query.from.id);
        if (isJoined) {
            bot.deleteMessage(query.message.chat.id, query.message.message_id);
            bot.sendMessage(query.message.chat.id, "✅ <b>𝗔𝗖𝗖𝗘𝗦𝗦 𝗚𝗥𝗔𝗡𝗧𝗘𝗗</b>", { parse_mode: 'HTML' });
        } else {
            bot.answerCallbackQuery(query.id, { text: "❌ ACCESS DENIED!", show_alert: true });
        }
    }
});
