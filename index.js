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
    fsubChatIds: ["@numberspyx", "@otpspyx"],
    sourceChatIds: [
        "-1003562550168", "-1003873870803", "-1003388744078", 
        "-1003808609180", "-1003522959807", "-1001234567890",
        "-1000000000001", "-1000000000002"
    ],
    session: ""
};

const COUNTRY_MAP = {
    '62': ['🇮🇩', 'ID'], '1': ['🇺🇸', 'US'], '44': ['🇬🇧', 'UK'], '7': ['🇷🇺', 'RU'],
    '60': ['🇲🇾', 'MY'], '63': ['🇵🇭', 'PH'], '65': ['🇸🇬', 'SG'], '66': ['🇹🇭', 'TH'],
    '84': ['🇻🇳', 'VN'], '81': ['🇯🇵', 'JP'], '82': ['🇰🇷', 'KR'], '86': ['🇨🇳', 'CN'],
    '91': ['🇮🇳', 'IN'], '92': ['🇵🇰', 'PK'], '55': ['🇧🇷', 'BR'], '52': ['🇲🇽', 'MX'],
    '33': ['🇫🇷', 'FR'], '49': ['🇩🇪', 'DE'], '39': ['🇮🇹', 'IT'], '34': ['🇪🇸', 'ES'],
    '31': ['🇳🇱', 'NL'], '32': ['🇧🇪', 'BE'], '41': ['🇨🇭', 'CH'], '46': ['🇸🇪', 'SE'],
    '47': ['🇳🇴', 'NO'], '45': ['🇩🇰', 'DK'], '48': ['🇵🇱', 'PL'], '90': ['🇹🇷', 'TR'],
    '20': ['🇪🇬', 'EG'], '27': ['🇿🇦', 'ZA'], '966': ['🇸🇦', 'SA'], '971': ['🇦🇪', 'AE'],
    '98': ['🇮🇷', 'IR'], '964': ['🇮🇶', 'IQ'], '212': ['🇲🇦', 'MA'], '213': ['🇩🇿', 'DZ'],
    '234': ['🇳🇬', 'NG'], '254': ['🇰🇪', 'KE'], '380': ['🇺🇦', 'UA'], '375': ['🇧🇾', 'BY'],
    '351': ['🇵🇹', 'PT'], '30': ['🇬🇷', 'GR'], '43': ['🇦🇹', 'AT'], '358': ['🇫🇮', 'FI'],
    '353': ['🇮🇪', 'IE'], '36': ['🇭🇺', 'HU'], '420': ['🇨🇿', 'CZ'], '40': ['🇷🇴', 'RO'],
    '359': ['🇧🇬', 'BG'], '381': ['🇷🇸', 'RS'], '385': ['🇭🇷', 'HR'], '421': ['🇸🇰', 'SK'],
    '61': ['🇦🇺', 'AU'], '64': ['🇳🇿', 'NZ'], '54': ['🇦🇷', 'AR'], '56': ['🇨🇱', 'CL'],
    '57': ['🇨🇴', 'CO'], '51': ['🇵🇪', 'PE'], '58': ['🇻🇪', 'VE'], '593': ['🇪🇨', 'EC'],
    '502': ['🇬🇹', 'GT'], '503': ['🇸🇻', 'SV'], '504': ['🇭🇳', 'HN'], '505': ['🇳🇮', 'NI'],
    '506': ['🇨🇷', 'CR'], '507': ['🇵🇦', 'PA'], '591': ['🇧🇴', 'BO'], '595': ['🇵🇾', 'PY'],
    '598': ['🇺🇾', 'UY'], '880': ['🇧🇩', 'BD'], '94': ['🇱🇰', 'LK'], '977': ['🇳🇵', 'NP'],
    '852': ['🇭🇰', 'HK'], '886': ['🇹🇼', 'TW'], '855': ['🇰🇭', 'KH'], '856': ['🇱🇦', 'LA'],
    '95': ['🇲🇲', 'MM'], '961': ['🇱🇧', 'LB'], '962': ['🇯🇴', 'JO'], '963': ['🇸🇾', 'SY'],
    '965': ['🇰🇼', 'KW'], '968': ['🇴🇲', 'OM'], '974': ['🇶🇦', 'QA'], '973': ['🇧🇭', 'BH'],
    '967': ['🇾🇪', 'YE'], '216': ['🇹🇳', 'TN'], '218': ['🇱🇾', 'LY'], '249': ['🇸🇩', 'SD'],
    '251': ['🇪🇹', 'ET'], '255': ['🇹🇿', 'TZ'], '256': ['🇺🇬', 'UG'], '233': ['🇬🇭', 'GH'],
    '225': ['🇨🇮', 'CI'], '237': ['🇨🇲', 'CM'], '221': ['🇸🇳', 'SN'], '355': ['🇦🇱', 'AL'],
    '387': ['🇧🇦', 'BA'], '389': ['🇲🇰', 'MK'], '386': ['🇸🇮', 'SI'], '370': ['🇱🇹', 'LT'],
    '371': ['🇱🇻', 'LV'], '372': ['🇪🇪', 'EE'], '352': ['🇱🇺', 'LU'], '356': ['🇲🇹', 'MT'],
    '357': ['🇨🇾', 'CY'], '354': ['🇮🇸', 'IS']
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

const cleanOtp = (text) => text.replace(/[^0-9]/g, '');

const getFlagAndCode = (text) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    for (const [code, info] of Object.entries(COUNTRY_MAP)) {
        if (cleanText.startsWith(code) || text.includes(`+${code}`)) {
            return { flag: info[0], code: `#${info[1]}` };
        }
    }
    return { flag: '🏳️', code: '#INT' };
};

const getServiceCode = (text) => {
    const t = text.toLowerCase();
    if (t.includes('whatsapp') || t.includes('wa')) return 'WS';
    if (t.includes('telegram') || t.includes('tg')) return 'TG';
    if (t.includes('facebook') || t.includes('fb')) return 'FB';
    if (t.includes('instagram') || t.includes('ig')) return 'IG';
    if (t.includes('tiktok')) return 'TT';
    if (t.includes('google') || t.includes('gmail')) return 'GO';
    if (t.includes('shopee')) return 'SP';
    if (t.includes('gojek') || t.includes('goto')) return 'GJ';
    if (t.includes('grab')) return 'GR';
    if (t.includes('dana')) return 'DN';
    if (t.includes('ovo')) return 'OV';
    if (t.includes('twitter') || t.includes('x ')) return 'TW';
    if (t.includes('discord')) return 'DS';
    if (t.includes('amazon')) return 'AZ';
    if (t.includes('netflix')) return 'NF';
    if (t.includes('apple')) return 'AP';
    if (t.includes('microsoft')) return 'MS';
    if (t.includes('kakao')) return 'KT';
    if (t.includes('line')) return 'LN';
    if (t.includes('wechat')) return 'WC';
    return 'OT'; 
};

const generateId = (text) => {
    const nums = text.match(/\d+/g);
    if (nums) {
        const str = nums.join('');
        if (str.length >= 4) return str.substring(str.length - 4);
    }
    return Math.floor(1000 + Math.random() * 9000);
};

(async () => {
    const client = new TelegramClient(new StringSession(CONFIG.session), CONFIG.apiId, CONFIG.apiHash, {
        connectionRetries: 5,
        useWSS: true 
    });

    await client.start({
        phoneNumber: async () => await input.text("Nomor HP: "),
        password: async () => await input.text("Password 2FA: "),
        phoneCode: async () => await input.text("OTP Code: "),
        onError: (err) => console.log(err),
    });

    console.log("SYSTEM STARTED");
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

            const { flag, code } = getFlagAndCode(fullText);
            const service = getServiceCode(fullText);
            const id = generateId(fullText);
            
            const headerText = `${flag} ${code} ${service} WLZ${id}`;

            let formattedOtp = extractedCode;
            if (extractedCode.length === 6) {
                formattedOtp = `${extractedCode.slice(0,3)}-${extractedCode.slice(3)}`;
            }

            const keyboard = {
                inline_keyboard: [
                    [
                        { 
                            text: `📄 ${formattedOtp}`, 
                            copy_text: { text: extractedCode } 
                        }
                    ],
                    [
                        { text: "Number Channel ↗", url: "https://t.me/numberwalz" },
                        { text: "OTP Group ↗", url: "https://t.me/otpspyx" }
                    ]
                ]
            };

            msgQueue.push({
                chatId: CONFIG.myGroupId,
                text: headerText,
                options: { parse_mode: 'HTML', reply_markup: keyboard }
            });

            processQueue();
        }
    }, new NewMessage({}));
})();
