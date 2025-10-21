// welcomeMessages.js
const { countries } = require("./countries");

const localizedTexts = {
  "United States":
    "🌞 Welcome to the American naturist community! 🇺🇸\nLet the sun and freedom embrace you — share your stories and connect with open hearts!",
  Canada:
    "🍁 Bienvenue / Welcome to the Canadian naturist community! 🇨🇦\nEmbrace nature, friendship, and freedom in the great outdoors!",
  Mexico:
    "🌵 ¡Bienvenido a la comunidad naturista de México! 🇲🇽\nDisfruta del sol, la libertad y la conexión con la naturaleza.",
  Brazil:
    "🌴 Bem-vindo à comunidade naturista do Brasil! 🇧🇷\nSinta a energia do sol e compartilhe suas experiências livres e naturais.",
  "United Kingdom":
    "🌤️ Welcome to the UK naturist community! 🇬🇧\nBe yourself — free, social, and natural!",

  France:
    "🇫🇷 Bienvenue dans la communauté naturiste française! 🌞\nIci, le soleil, la liberté et la nature s’unissent pour une vie plus authentique.",
  Germany:
    "🇩🇪 Willkommen in der deutschen Naturisten-Community! 🌻\nGenieße die Sonne, das Wasser und die Freiheit, du selbst zu sein!",
  Netherlands:
    "🇳🇱 Welkom in de Nederlandse naturisten-community! 🌞\nVoel de vrijheid, deel je ervaringen en geniet van de zon zonder grenzen!",
  Sweden:
    "🇸🇪 Välkommen till den svenska naturistgemenskapen! 🌿\nKänn vinden, solen och friheten av att vara naturlig.",
  Norway:
    "🇳🇴 Velkommen til det norske naturistsamfunnet! ❄️\nNyt naturens frihet og fellesskapet med åpne sinn.",
  Denmark:
    "🇩🇰 Velkommen til det danske naturistsamfund! 🌊\nHer fejrer vi natur, frihed og fællesskab.",
  Finland:
    "🇫🇮 Tervetuloa suomalaiseen naturistiyhteisöön! 🌲\nNauti hiljaisuudesta, luonnosta ja vapaudesta.",
  Spain:
    "🇪🇸 ¡Bienvenido a la comunidad naturista española! ☀️\nVive el sol, el mar y la libertad de ser tú mismo.",
  Italy:
    "🇮🇹 Benvenuto nella comunità naturista italiana! 🌺\nVivi la natura, la bellezza e la libertà con serenità.",
  Poland:
    "🇵🇱 Witamy w polskiej społeczności naturystów! 🌞\nCiesz się wolnością i naturą w jej czystej formie.",
  "Czech Republic":
    "🇨🇿 Vítejte v české naturistické komunitě! 🌻\nPřipojte se k nám a sdílejte svou přirozenost a radost.",
  Hungary:
    "🇭🇺 Üdvözöljük a magyar naturista közösségben! 🌞\nÉrezd a természet szabadságát és a közösség melegségét.",
  Romania:
    "🇷🇴 Bine ai venit în comunitatea naturistă din România! 🌼\nSimte libertatea și natura în forma sa pură.",
  Russia:
    "🇷🇺 Добро пожаловать в российское сообщество натуристов! 🌞\nБудь собой — естественным и свободным.",
  Ukraine:
    "🇺🇦 Ласкаво просимо до української спільноти натуристів! 🌻\nВідчуйте свободу, природу та справжню гармонію.",
  Greece:
    "🇬🇷 Καλώς ήρθατε στην ελληνική κοινότητα γυμνιστών! 🏛️\nΑπολαύστε τη φύση, τη θάλασσα και την ελευθερία του σώματος.",
  Turkey:
    "🇹🇷 Türk naturist topluluğuna hoş geldiniz! 🌅\nDoğayı ve özgürlüğü kucaklayın.",
  Israel:
    "🇮🇱 ברוכים הבאים לקהילת הטבעונים של ישראל! 🌞\nתחוו חופש, טבע ואחדות אמיתית.",
  India:
    "🇮🇳 भारतीय नेचुरिस्ट समुदाय में आपका स्वागत है! 🌄\nस्वाभाविक रहें, स्वतंत्र रहें और अपनी ऊर्जा साझा करें।",
  China: "🇨🇳 欢迎加入中国天体社区！ 🌞\n感受阳光，自然与自由的力量。",
  Japan:
    "🇯🇵 日本のヌーディストコミュニティへようこそ！ 🌸\n自然との調和を楽しみ、自由に過ごしてください。",
  "South Korea":
    "🇰🇷 한국 누디스트 커뮤니티에 오신 것을 환영합니다! 🌿\n자연과 함께 자유를 느껴보세요.",
  Singapore:
    "🇸🇬 Welcome to Singapore’s naturist community! 🌴\nEmbrace balance, respect, and the warmth of the tropics.",
  Thailand:
    "🇹🇭 ยินดีต้อนรับสู่ชุมชนธรรมชาตินิยมของประเทศไทย! 🌺\nรู้สึกอิสระและเป็นหนึ่งเดียวกับธรรมชาติ.",
  Vietnam:
    "🇻🇳 Chào mừng đến với cộng đồng khỏa thân Việt Nam! 🌿\nHãy sống tự nhiên, tự do và hạnh phúc.",
  Indonesia:
    "🇮🇩 Selamat datang di komunitas naturis Indonesia! 🌴\nNikmati kebebasan dan alam yang indah.",
  Australia:
    "🇦🇺 Welcome to the Australian naturist community! 🐚\nSun, sand, and serenity — the naturist way of life!",
  "New Zealand":
    "🇳🇿 Kia ora! Welcome to the NZ naturist community! 🌿\nEmbrace the spirit of nature and open freedom.",
  "South Africa":
    "🇿🇦 Welcome to the South African naturist community! 🌞\nFeel the sun and the freedom of the open land.",
  Egypt:
    "🇪🇬 مرحبًا بكم في مجتمع الطبيعة المصري! 🌅\nاستمتعوا بالشمس والحرية والنقاء.",
  Morocco:
    "🇲🇦 Bienvenue dans la communauté naturiste marocaine! 🌞\nCélébrons la nature et la liberté ensemble.",
  Belgium:
    "🇧🇪 **Bienvenue dans la communauté naturiste belge!** 🌻\nPartagez la chaleur, la nature et la joie de vivre.\n\n🇳🇱 **Welkom in de Belgische naturistencommunity!** ☀️\nVoel de vrijheid van de natuur en deel je ervaringen met anderen.",
  Switzerland:
    "🇨🇭 Willkommen in der Schweizer Naturisten-Community! 🏔️\nGenieße Ruhe, Natur und Gemeinschaft.",
  Austria:
    "🇦🇹 Willkommen in der österreichischen Naturisten-Community! 🌲\nErlebe Freiheit und Natur im Einklang.",
  Ireland:
    "🇮🇪 Welcome to the Irish naturist community! 🍀\nFeel the freshness of nature and the joy of togetherness.",
  Portugal:
    "🇵🇹 Bem-vindo à comunidade naturista portuguesa! 🌊\nViva a liberdade e a beleza natural do corpo e da alma.",

  default:
    "🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.",
};

const WELCOME_MESSAGES = {};
for (const [emoji, name] of Object.entries(countries)) {
  const key = name.replace(/\s+/g, "");
  WELCOME_MESSAGES[key] = {
    lang: localizedTexts[name] ? "native" : "en",
    text: localizedTexts[name] || localizedTexts.default,
  };
}

module.exports = { WELCOME_MESSAGES };
