const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const TelegramBot = require('node-telegram-bot-api');
const input = require("input");
const moment = require('moment-timezone');

const CONFIG = {
    apiId: 39113132,
    apiHash: "4131586e1bbef992beb4b563aa8681ed",
    botToken: "8531617912:AAH4qdR7BH9b6Q89_JdtCy0oZ_0FDh_CA0o",
    adminId: 8062935882,
    myGroupId: -1003887790861,
    fileGroupId: -1003671573755,
    fsubChatIds: [
        "@numberspyx",
        "@otpspyx"
    ],
    sourceChatIds: [
        "-1003562550168",
        "-1003873870803",
        "-1003388744078",
        "-1003808609180",
        "-1003522959807",
        "-1001234567890",
        "-1000000000001",
        "-1000000000002",
        "-1000000000003",
        "-1000000000004",
        "-1000000000005",
        "-1000000000006",
        "-1000000000007",
        "-1000000000008",
        "-1000000000009",
        "-1000000000010",
        "-1000000000011",
        "-1000000000012",
        "-1000000000013",
        "-1000000000014",
        "-1000000000015",
        "-1000000000016",
        "-1000000000017",
        "-1000000000018",
        "-1000000000019",
        "-1000000000020"
    ],
    session: ""
};

const bot = new TelegramBot(CONFIG.botToken, { polling: true });
const msgQueue = [];
let isProcessing = false;

const processQueue = async () => {
    if (isProcessing || msgQueue.length === 0) return;
    isProcessing = true;

    while (msgQueue.length > 0) {
        const task = msgQueue.shift();
        try {
            const sentMsg = await bot.sendMessage(task.chatId, task.text, task.options);
            setTimeout(() => {
                bot.deleteMessage(sentMsg.chat.id, sentMsg.message_id).catch(() => {});
            }, 60000);
        } catch (e) {}
        await new Promise(r => setTimeout(r, 50));
    }
    isProcessing = false;
};

const getTimestamp = () => moment().tz("Asia/Jakarta").format('HH:mm:ss');
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

const cleanOtp = (text) => text.replace(/[^0-9]/g, '');

const detectService = (text) => {
    const t = text.toLowerCase();
    if (t.includes('whatsapp') || t.includes('wa ') || t.includes('ws ')) return 'WhatsApp';
    if (t.includes('telegram') || t.includes('tg ')) return 'Telegram';
    if (t.includes('facebook') || t.includes('fb ')) return 'Facebook';
    if (t.includes('instagram') || t.includes('ig ')) return 'Instagram';
    if (t.includes('tiktok')) return 'TikTok';
    if (t.includes('michat') || t.includes('mi ')) return 'MiChat';
    if (t.includes('google') || t.includes('gmail')) return 'Google';
    if (t.includes('shopee')) return 'Shopee';
    if (t.includes('gojek') || t.includes('gopay')) return 'Gojek';
    if (t.includes('grab')) return 'Grab';
    if (t.includes('dana')) return 'DANA';
    if (t.includes('ovo')) return 'OVO';
    
    const codePattern = /#[a-zA-Z]{2}\s+([a-zA-Z0-9]+)/;
    const match = text.match(codePattern);
    return (match && match[1]) ? match[1].toUpperCase() : 'Universal App';
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
    const client = new TelegramClient(new StringSession(CONFIG.session), CONFIG.apiId, CONFIG.apiHash, {
        connectionRetries: 5,
        useWSS: true 
    });

    await client.start({
        phoneNumber: async () => await input.text("Nomor HP (+62...): "),
        password: async () => await input.text("Password 2FA: "),
        phoneCode: async () => await input.text("OTP Code: "),
        onError: (err) => console.log(err),
    });

    console.log("WALZY BILINGUAL SYSTEM V16 RUNNING");
    console.log(client.session.save());

    client.addEventHandler(async (event) => {
        const message = event.message;
        if (!message) return;

        const chatId = message.chatId ? message.chatId.toString() : "";
        const isSource = CONFIG.sourceChatIds.some(id => chatId.endsWith(id.replace("-100", "")));

        if (isSource) {
            let extractedCode = null;
            let fullText = message.message || "";

            if (message.replyMarkup && message.replyMarkup.rows) {
                for (let row of message.replyMarkup.rows) {
                    for (let btn of row.buttons) {
                        const btnText = btn.text || "";
                        fullText += " " + btnText;
                        if (/^(?:\d{4,8}|\d{3}[- ]\d{3})$/.test(btnText.trim())) {
                            extractedCode = cleanOtp(btnText);
                            break;
                        }
                    }
                    if (extractedCode) break;
                }
            }

            if (!extractedCode) {
                const patterns = [
                    /Code\s*:\s*(\d{4,8})/i,
                    /OTP\s*:\s*(\d{4,8})/i,
                    /(?<!\d)(\d{3}[- ]\d{3})(?!\d)/,
                    /(?<![\d\+xX])(\d{4,8})(?!\d)/
                ];

                for (let pattern of patterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                        extractedCode = cleanOtp(match[1] || match[0]);
                        break;
                    }
                }
            }

            if (!extractedCode) return;

            const serviceName = detectService(fullText);
            const safeMsg = escapeHtml(message.message || "");
            
            const displayContent = `
<b> 𝗡𝗲𝘄 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 • 𝗣𝗲𝘀𝗮𝗻 𝗕𝗮𝗿𝘂</b>
━━━━━━━━━━━━━━━━━━
<b>📡 𝗦𝗼𝘂𝗿𝗰𝗲</b>   : <code>Live Target</code>
<b>📱 𝗔𝗽𝗽𝘀</b>     : <code>${serviceName}</code>
<b>🕒 𝗪𝗮𝗸𝘁𝘂</b>    : <code>${getTimestamp()} WIB</code>

<b>💬 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 / 𝗜𝘀𝗶 𝗣𝗲𝘀𝗮𝗻 :</b>
<code>${safeMsg.substring(0, 250) || "Media/Attachment"}</code>
━━━━━━━━━━━━━━━━━━
<i> Walzy System | Active Monitoring</i>`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: `📋 𝗖𝗢𝗣𝗬 𝗢𝗧𝗣 : ${extractedCode}`, copy_text: { text: extractedCode } }
                    ],
                    [
                        { text: "⚡️ 𝗔𝗠𝗕𝗜𝗟 𝗡𝗢𝗠𝗢𝗥 (𝗕𝗨𝗬)", url: "https://t.me/numberwalz" }
                    ]
                ]
            };

            msgQueue.push({
                chatId: CONFIG.myGroupId,
                text: displayContent,
                options: { parse_mode: 'HTML', reply_markup: keyboard }
            });

            processQueue();
        }
    }, new NewMessage({}));
})();

bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== CONFIG.adminId.toString()) return;

    const fileName = msg.document.file_name;
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const parts = cleanName.split(/[-_ ]/);
    const country = parts[0] || "Global";
    const service = msg.caption || (parts.length > 1 ? parts[1] : "Mixed");

    const caption = `
<b> 𝗪𝗔𝗟𝗭𝗬 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘 • 𝗦𝗧𝗢𝗥𝗘</b>
━━━━━━━━━━━━━━━━━━
<b>🌍 𝗖𝗼𝘂𝗻𝘁𝗿𝘆/𝗡𝗲𝗴𝗮𝗿𝗮</b> : <code>${country.toUpperCase()}</code>
<b>📂 𝗧𝘆𝗽𝗲/𝗝𝗲𝗻𝗶𝘀</b>     : <code>${service.toUpperCase()}</code>
<b>📅 𝗗𝗮𝘁𝗲/𝗧𝗮𝗻𝗴𝗴𝗮𝗹</b>   : <code>${getDate()}</code>
<b>💾 𝗦𝗶𝘇𝗲</b>           : <code>${(msg.document.file_size / 1024).toFixed(2)} KB</code>
━━━━━━━━━━━━━━━━━━
<i> Uploaded Successfully / Berhasil</i>`;

    try {
        await bot.sendDocument(CONFIG.fileGroupId, msg.document.file_id, {
            caption: caption,
            parse_mode: 'HTML'
        });
        bot.sendMessage(chatId, `<b>☑️ 𝗙𝗜𝗟𝗘 𝗦𝗘𝗡𝗧 / 𝗧𝗘𝗥𝗞𝗜𝗥𝗜𝗠</b>\n<code>${fileName}</code>`, { parse_mode: 'HTML' });
    } catch (e) {
        bot.sendMessage(chatId, `<b>☒ 𝗙𝗔𝗜𝗟𝗘𝗗 / 𝗚𝗔𝗚𝗔𝗟</b>\nBot Not Admin.`, { parse_mode: 'HTML' });
    }
});

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const isJoined = await checkSubscription(chatId);
    
    if (!isJoined && chatId.toString() !== CONFIG.adminId.toString()) {
        const joinKeyboard = CONFIG.fsubChatIds.map((ch, i) => 
            [{ text: `📢 𝗝𝗢𝗜𝗡 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 ${i + 1}`, url: `https://t.me/${ch.replace('@','')}` }]
        );
        joinKeyboard.push([{ text: "🔄 𝗖𝗘𝗞 𝗦𝗧𝗔𝗧𝗨𝗦 / 𝗩𝗘𝗥𝗜𝗙𝗬", callback_data: "check_sub" }]);

        bot.sendMessage(chatId, `<b>⛔️ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗 / 𝗔𝗞𝗦𝗘𝗦 𝗗𝗜𝗧𝗢𝗟𝗔𝗞</b>\n━━━━━━━━━━━━━━━━━━\nUntuk menggunakan <b>Walzy Tools</b>, Anda wajib join channel di bawah ini:\n<i>You must join these channels to access:</i>`, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: joinKeyboard }
        });
        return;
    }

    bot.sendMessage(chatId, `<b> 𝗪𝗔𝗟𝗭𝗬 𝗘𝗫𝗣𝗟𝗢𝗜𝗧 𝗛𝗤</b>\n━━━━━━━━━━━━━━━━━━\n👋 <b>Halo, ${msg.from.first_name}</b>\n\n<b>🔑 License:</b> <code>Premium / Aktif</code>\n<b>📱 Device:</b> <code>iOS Terminal</code>\n\n<i>Butuh Script? Contact @walzyexploit.</i>`, { parse_mode: 'HTML' });
});

bot.on('callback_query', async (query) => {
    if (query.data === "check_sub") {
        const isJoined = await checkSubscription(query.from.id);
        if (isJoined) {
            bot.deleteMessage(query.message.chat.id, query.message.message_id);
            bot.sendMessage(query.message.chat.id, "<b>✅ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗚𝗥𝗔𝗡𝗧𝗘𝗗 / 𝗗𝗜𝗧𝗘𝗥𝗜𝗠𝗔</b>", { parse_mode: 'HTML' });
        } else {
            bot.answerCallbackQuery(query.id, { text: "❌ Belum Join / Not Joined Yet!", show_alert: true });
        }
    }
});
