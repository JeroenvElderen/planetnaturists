-- Countries
create table if not exists public.countries (
  emoji text primary key,
  name text not null
);
truncate table public.countries;
insert into public.countries (emoji, name) values
  ('🇺🇸', 'United States'),
  ('🇨🇦', 'Canada'),
  ('🇲🇽', 'Mexico'),
  ('🇧🇷', 'Brazil'),
  ('🇬🇧', 'United Kingdom'),
  ('🇫🇷', 'France'),
  ('🇩🇪', 'Germany'),
  ('🇳🇱', 'Netherlands'),
  ('🇸🇪', 'Sweden'),
  ('🇳🇴', 'Norway'),
  ('🇩🇰', 'Denmark'),
  ('🇫🇮', 'Finland'),
  ('🇪🇸', 'Spain'),
  ('🇮🇹', 'Italy'),
  ('🇵🇱', 'Poland'),
  ('🇨🇿', 'Czech Republic'),
  ('🇭🇺', 'Hungary'),
  ('🇷🇴', 'Romania'),
  ('🇷🇺', 'Russia'),
  ('🇺🇦', 'Ukraine'),
  ('🇬🇷', 'Greece'),
  ('🇹🇷', 'Turkey'),
  ('🇮🇱', 'Israel'),
  ('🇮🇳', 'India'),
  ('🇨🇳', 'China'),
  ('🇯🇵', 'Japan'),
  ('🇰🇷', 'South Korea'),
  ('🇸🇬', 'Singapore'),
  ('🇹🇭', 'Thailand'),
  ('🇻🇳', 'Vietnam'),
  ('🇮🇩', 'Indonesia'),
  ('🇦🇺', 'Australia'),
  ('🇳🇿', 'New Zealand'),
  ('🇿🇦', 'South Africa'),
  ('🇪🇬', 'Egypt'),
  ('🇲🇦', 'Morocco'),
  ('🇩🇿', 'Algeria'),
  ('🇳🇬', 'Nigeria'),
  ('🇰🇪', 'Kenya'),
  ('🇧🇪', 'Belgium'),
  ('🇨🇭', 'Switzerland'),
  ('🇦🇹', 'Austria'),
  ('🇮🇪', 'Ireland'),
  ('🇵🇹', 'Portugal'),
  ('🇸🇰', 'Slovakia'),
  ('🇸🇮', 'Slovenia'),
  ('🇭🇷', 'Croatia'),
  ('🇧🇬', 'Bulgaria'),
  ('🇨🇷', 'Costa Rica'),
  ('🇨🇱', 'Chile'),
  ('🇦🇷', 'Argentina'),
  ('🇨🇴', 'Colombia'),
  ('🇵🇪', 'Peru'),
  ('🇻🇪', 'Venezuela'),
  ('🇨🇺', 'Cuba'),
  ('🇯🇲', 'Jamaica'),
  ('🇸🇦', 'Saudi Arabia'),
  ('🇦🇪', 'United Arab Emirates'),
  ('🇶🇦', 'Qatar'),
  ('🇧🇭', 'Bahrain'),
  ('🇰🇼', 'Kuwait'),
  ('🇴🇲', 'Oman'),
  ('🇮🇷', 'Iran'),
  ('🇮🇶', 'Iraq'),
  ('🇱🇧', 'Lebanon'),
  ('🇯🇴', 'Jordan'),
  ('🇵🇰', 'Pakistan'),
  ('🇧🇩', 'Bangladesh'),
  ('🇱🇰', 'Sri Lanka'),
  ('🇳🇵', 'Nepal'),
  ('🇵🇭', 'Philippines'),
  ('🇲🇾', 'Malaysia'),
  ('🇭🇰', 'Hong Kong'),
  ('🇹🇼', 'Taiwan'),
  ('🇲🇳', 'Mongolia'),
  ('🇰🇭', 'Cambodia'),
  ('🇱🇦', 'Laos'),
  ('🇧🇳', 'Brunei'),
  ('🇲🇲', 'Myanmar'),
  ('🇨🇾', 'Cyprus'),
  ('🇪🇪', 'Estonia'),
  ('🇱🇻', 'Latvia'),
  ('🇱🇹', 'Lithuania'),
  ('🇧🇾', 'Belarus'),
  ('🇷🇸', 'Serbia'),
  ('🇧🇦', 'Bosnia and Herzegovina'),
  ('🇲🇰', 'North Macedonia'),
  ('🇦🇱', 'Albania'),
  ('🇬🇪', 'Georgia'),
  ('🇦🇲', 'Armenia'),
  ('🇦🇿', 'Azerbaijan');

-- Country aliases
create table if not exists public.country_aliases (
  alias text primary key,
  emoji text not null references public.countries(emoji) on delete cascade
);
truncate table public.country_aliases;
insert into public.country_aliases (alias, emoji) values
  (':england:', '🇬🇧'),
  (':scotland', '🇬🇧'),
  (':wales:', '🇬🇧'),
  (':scotland:', '🇬🇧');

-- Channel naming presets
create table if not exists public.channel_names (
  country_name text primary key,
  chat text not null,
  locations text not null,
  offtopic text not null,
  experiences text not null
);
truncate table public.channel_names;
insert into public.channel_names (country_name, chat, locations, offtopic, experiences) values
  ('France', 'discussion-naturiste', 'lieux-naturistes', 'hors-sujet', 'expériences-naturistes'),
  ('Germany', 'naturisten-chat', 'naturisten-orte', 'plauderecke', 'naturisten-erfahrungen'),
  ('Netherlands', 'naturisten-chat', 'naturisten-locaties', 'off-topic', 'naturisten-ervaringen'),
  ('Spain', 'charla-naturista', 'lugares-naturistas', 'off-topic', 'experiencias-naturistas'),
  ('Italy', 'chat-naturista', 'luoghi-naturisti', 'fuori-tema', 'esperienze-naturiste'),
  ('Portugal', 'chat-naturista', 'locais-naturistas', 'conversas', 'experiencias-naturistas'),
  ('Sweden', 'naturist-chat', 'naturistplatser', 'off-topic', 'naturistupplevelser'),
  ('Norway', 'naturistprat', 'naturiststeder', 'off-topic', 'naturistopplevelser'),
  ('Finland', 'naturistikeskustelu', 'naturistipaikat', 'aiheeton', 'naturistikokemuksia'),
  ('Greece', 'συζήτηση-γυμνιστών', 'τοποθεσίες-γυμνιστών', 'εκτός-θέματος', 'εμπειρίες-γυμνιστών'),
  ('Turkey', 'doğal-sohbet', 'doğal-mekanlar', 'konu-dışı', 'doğal-deneyimler'),
  ('Japan', 'ヌーディストチャット', 'ヌーディストスポット', '雑談', '体験談'),
  ('China', '天体聊天', '天体地点', '闲聊', '天体体验'),
  ('Russia', 'натуристы-чат', 'места-натуристов', 'о-разном', 'опыт-натуристов'),
  ('Poland', 'czat-naturystów', 'miejsca-naturystów', 'luźne-tematy', 'doświadczenia-naturystów'),
  ('United States', 'naturist-chat', 'naturist-locations', 'off-topic', 'naturist-experiences'),
  ('Brazil', 'bate-papo-naturista', 'locais-naturistas', 'assuntos-gerais', 'experiencias-naturistas'),
  ('India', 'नेचरिस्ट-चैट', 'नेचरिस्ट-स्थान', 'अन्य-विषय', 'नेचरिस्ट-अनुभव'),
  ('Thailand', 'แชท-ธรรมชาติ', 'สถานที่-ธรรมชาติ', 'พูดคุยทั่วไป', 'ประสบการณ์-ธรรมชาติ'),
  ('Australia', 'naturist-chat', 'naturist-locations', 'off-topic', 'naturist-experiences'),
  ('South Africa', 'naturist-chat', 'naturist-locations', 'off-topic', 'naturist-experiences'),
  ('default', 'naturist-chat', 'naturist-locations', 'off-topic', 'naturist-experiences');

-- Welcome messages
create table if not exists public.welcome_messages (
  country_key text primary key,
  language text not null,
  message text not null
);
truncate table public.welcome_messages;
insert into public.welcome_messages (country_key, language, message) values
  ('UnitedStates', 'native', E'🌞 Welcome to the American naturist community! 🇺🇸\nLet the sun and freedom embrace you — share your stories and connect with open hearts!'),
  ('Canada', 'native', E'🍁 Bienvenue / Welcome to the Canadian naturist community! 🇨🇦\nEmbrace nature, friendship, and freedom in the great outdoors!'),
  ('Mexico', 'native', E'🌵 ¡Bienvenido a la comunidad naturista de México! 🇲🇽\nDisfruta del sol, la libertad y la conexión con la naturaleza.'),
  ('Brazil', 'native', E'🌴 Bem-vindo à comunidade naturista do Brasil! 🇧🇷\nSinta a energia do sol e compartilhe suas experiências livres e naturais.'),
  ('UnitedKingdom', 'native', E'🌤️ Welcome to the UK naturist community! 🇬🇧\nBe yourself — free, social, and natural!'),
  ('Scotland', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('France', 'native', E'🇫🇷 Bienvenue dans la communauté naturiste française! 🌞\nIci, le soleil, la liberté et la nature s’unissent pour une vie plus authentique.'),
  ('Germany', 'native', E'🇩🇪 Willkommen in der deutschen Naturisten-Community! 🌻\nGenieße die Sonne, das Wasser und die Freiheit, du selbst zu sein!'),
  ('Netherlands', 'native', E'🇳🇱 Welkom in de Nederlandse naturisten-community! 🌞\nVoel de vrijheid, deel je ervaringen en geniet van de zon zonder grenzen!'),
  ('Sweden', 'native', E'🇸🇪 Välkommen till den svenska naturistgemenskapen! 🌿\nKänn vinden, solen och friheten av att vara naturlig.'),
  ('Norway', 'native', E'🇳🇴 Velkommen til det norske naturistsamfunnet! ❄️\nNyt naturens frihet og fellesskapet med åpne sinn.'),
  ('Denmark', 'native', E'🇩🇰 Velkommen til det danske naturistsamfund! 🌊\nHer fejrer vi natur, frihed og fællesskab.'),
  ('Finland', 'native', E'🇫🇮 Tervetuloa suomalaiseen naturistiyhteisöön! 🌲\nNauti hiljaisuudesta, luonnosta ja vapaudesta.'),
  ('Spain', 'native', E'🇪🇸 ¡Bienvenido a la comunidad naturista española! ☀️\nVive el sol, el mar y la libertad de ser tú mismo.'),
  ('Italy', 'native', E'🇮🇹 Benvenuto nella comunità naturista italiana! 🌺\nVivi la natura, la bellezza e la libertà con serenità.'),
  ('Poland', 'native', E'🇵🇱 Witamy w polskiej społeczności naturystów! 🌞\nCiesz się wolnością i naturą w jej czystej formie.'),
  ('CzechRepublic', 'native', E'🇨🇿 Vítejte v české naturistické komunitě! 🌻\nPřipojte se k nám a sdílejte svou přirozenost a radost.'),
  ('Hungary', 'native', E'🇭🇺 Üdvözöljük a magyar naturista közösségben! 🌞\nÉrezd a természet szabadságát és a közösség melegségét.'),
  ('Romania', 'native', E'🇷🇴 Bine ai venit în comunitatea naturistă din România! 🌼\nSimte libertatea și natura în forma sa pură.'),
  ('Russia', 'native', E'🇷🇺 Добро пожаловать в российское сообщество натуристов! 🌞\nБудь собой — естественным и свободным.'),
  ('Ukraine', 'native', E'🇺🇦 Ласкаво просимо до української спільноти натуристів! 🌻\nВідчуйте свободу, природу та справжню гармонію.'),
  ('Greece', 'native', E'🇬🇷 Καλώς ήρθατε στην ελληνική κοινότητα γυμνιστών! 🏛️\nΑπολαύστε τη φύση, τη θάλασσα και την ελευθερία του σώματος.'),
  ('Turkey', 'native', E'🇹🇷 Türk naturist topluluğuna hoş geldiniz! 🌅\nDoğayı ve özgürlüğü kucaklayın.'),
  ('Israel', 'native', E'🇮🇱 ברוכים הבאים לקהילת הטבעונים של ישראל! 🌞\nתחוו חופש, טבע ואחדות אמיתית.'),
  ('India', 'native', E'🇮🇳 भारतीय नेचुरिस्ट समुदाय में आपका स्वागत है! 🌄\nस्वाभाविक रहें, स्वतंत्र रहें और अपनी ऊर्जा साझा करें।'),
  ('China', 'native', E'🇨🇳 欢迎加入中国天体社区！ 🌞\n感受阳光，自然与自由的力量。'),
  ('Japan', 'native', E'🇯🇵 日本のヌーディストコミュニティへようこそ！ 🌸\n自然との調和を楽しみ、自由に過ごしてください。'),
  ('SouthKorea', 'native', E'🇰🇷 한국 누디스트 커뮤니티에 오신 것을 환영합니다! 🌿\n자연과 함께 자유를 느껴보세요.'),
  ('Singapore', 'native', E'🇸🇬 Welcome to Singapore’s naturist community! 🌴\nEmbrace balance, respect, and the warmth of the tropics.'),
  ('Thailand', 'native', E'🇹🇭 ยินดีต้อนรับสู่ชุมชนธรรมชาตินิยมของประเทศไทย! 🌺\nรู้สึกอิสระและเป็นหนึ่งเดียวกับธรรมชาติ.'),
  ('Vietnam', 'native', E'🇻🇳 Chào mừng đến với cộng đồng khỏa thân Việt Nam! 🌿\nHãy sống tự nhiên, tự do và hạnh phúc.'),
  ('Indonesia', 'native', E'🇮🇩 Selamat datang di komunitas naturis Indonesia! 🌴\nNikmati kebebasan dan alam yang indah.'),
  ('Australia', 'native', E'🇦🇺 Welcome to the Australian naturist community! 🐚\nSun, sand, and serenity — the naturist way of life!'),
  ('NewZealand', 'native', E'🇳🇿 Kia ora! Welcome to the NZ naturist community! 🌿\nEmbrace the spirit of nature and open freedom.'),
  ('SouthAfrica', 'native', E'🇿🇦 Welcome to the South African naturist community! 🌞\nFeel the sun and the freedom of the open land.'),
  ('Egypt', 'native', E'🇪🇬 مرحبًا بكم في مجتمع الطبيعة المصري! 🌅\nاستمتعوا بالشمس والحرية والنقاء.'),
  ('Morocco', 'native', E'🇲🇦 Bienvenue dans la communauté naturiste marocaine! 🌞\nCélébrons la nature et la liberté ensemble.'),
  ('Algeria', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Nigeria', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Kenya', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Belgium', 'native', E'🇧🇪 **Bienvenue dans la communauté naturiste belge!** 🌻\nPartagez la chaleur, la nature et la joie de vivre.\n\n🇳🇱 **Welkom in de Belgische naturistencommunity!** ☀️\nVoel de vrijheid van de natuur en deel je ervaringen met anderen.'),
  ('Switzerland', 'native', E'🇨🇭 Willkommen in der Schweizer Naturisten-Community! 🏔️\nGenieße Ruhe, Natur und Gemeinschaft.'),
  ('Austria', 'native', E'🇦🇹 Willkommen in der österreichischen Naturisten-Community! 🌲\nErlebe Freiheit und Natur im Einklang.'),
  ('Ireland', 'native', E'🇮🇪 Welcome to the Irish naturist community! 🍀\nFeel the freshness of nature and the joy of togetherness.'),
  ('Portugal', 'native', E'🇵🇹 Bem-vindo à comunidade naturista portuguesa! 🌊\nViva a liberdade e a beleza natural do corpo e da alma.'),
  ('Slovakia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Slovenia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Croatia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Bulgaria', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('CostaRica', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Chile', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Argentina', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Colombia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Peru', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Venezuela', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Cuba', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Jamaica', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('SaudiArabia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('UnitedArabEmirates', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Qatar', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Bahrain', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Kuwait', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Oman', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Iran', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Iraq', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Lebanon', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Jordan', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Pakistan', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Bangladesh', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('SriLanka', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Nepal', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Philippines', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Malaysia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('HongKong', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Taiwan', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Mongolia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Cambodia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Laos', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Brunei', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Myanmar', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Cyprus', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Estonia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Latvia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Lithuania', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Belarus', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Serbia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('BosniaandHerzegovina', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('NorthMacedonia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Albania', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Georgia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Armenia', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.'),
  ('Azerbaijan', 'en', E'🌍 Welcome to your local naturist community! 🌞\nFeel the sun, freedom, and connection with nature — wherever you are.');

-- Emoji role map
create table if not exists public.emoji_role_map (
  emoji text primary key,
  role_id text not null
);
truncate table public.emoji_role_map;
insert into public.emoji_role_map (emoji, role_id) values
  ('🇺🇸', '1429860689580916818'),
  ('🇨🇦', '1429860690411126896'),
  ('🇲🇽', '1429860691690389536'),
  ('🇧🇷', '1429860693967896606'),
  ('🇬🇧', '1429860695930961981'),
  (':england:', '1429860695930961981'),
  (':scotland:', '1429860695930961981'),
  (':wales:', '1429860695930961981'),
  ('🇫🇷', '1429860696941924362'),
  ('🇩🇪', '1429860699227689190'),
  ('🇳🇱', '1429845837705511004'),
  ('🇸🇪', '1429860701014458408'),
  ('🇳🇴', '1429860702956425256'),
  ('🇩🇰', '1429860706697740421'),
  ('🇫🇮', '1429860708178202674'),
  ('🇪🇸', '1429860709415518259'),
  ('🇮🇹', '1429860710472618166'),
  ('🇵🇱', '1429860712741867642'),
  ('🇨🇿', '1429860716994629663'),
  ('🇭🇺', '1429860718362099824'),
  ('🇷🇴', '1429860719888957652'),
  ('🇷🇺', '1429860721398780054'),
  ('🇺🇦', '1429860722279448768'),
  ('🇬🇷', '1429860722958925905'),
  ('🇹🇷', '1429860724456296480'),
  ('🇮🇱', '1429860725521780938'),
  ('🇮🇳', '1429860726864089221'),
  ('🇨🇳', '1429860727900082217'),
  ('🇯🇵', '1429860728969625761'),
  ('🇰🇷', '1429860731620429824'),
  ('🇸🇬', '1429860732660486320'),
  ('🇹🇭', '1429860733910388838'),
  ('🇻🇳', '1429860734644256800'),
  ('🇮🇩', '1429860736129175696'),
  ('🇦🇺', '1429860737563623637'),
  ('🇳🇿', '1429860739002404945'),
  ('🇿🇦', '1429860740147318826'),
  ('🇪🇬', '1429860741430640821'),
  ('🇲🇦', '1429860742680674425'),
  ('🇩🇿', '1429860744136097964'),
  ('🇳🇬', '1429860744723435601'),
  ('🇰🇪', '1429860746203762809'),
  ('🇧🇪', '1429860747307126825'),
  ('🇨🇭', '1429860748473012298'),
  ('🇦🇹', '1429860749760532624'),
  ('🇮🇪', '1429860750641598627'),
  ('🇵🇹', '1429860751123812463'),
  ('🇸🇰', '1429860752378040411'),
  ('🇸🇮', '1429860753451778148'),
  ('🇭🇷', '1429860754391171188'),
  ('🇧🇬', '1429860755788009593'),
  ('🇨🇷', '1429860756647710802'),
  ('🇨🇱', '1429860757738229842'),
  ('🇦🇷', '1429860758724022333'),
  ('🇨🇴', '1429860759722000608'),
  ('🇵🇪', '1429860761379012730'),
  ('🇻🇪', '1429860762465206464'),
  ('🇨🇺', '1429860763673038913'),
  ('🇯🇲', '1429860766332485893'),
  ('🇸🇦', '1429860767225745480'),
  ('🇦🇪', '1429860768035373130'),
  ('🇶🇦', '1429860769662636062'),
  ('🇧🇭', '1429860770807808101'),
  ('🇰🇼', '1429860771889811537'),
  ('🇴🇲', '1429860772913221802'),
  ('🇮🇷', '1429860774058393750'),
  ('🇮🇶', '1429860775211569152'),
  ('🇱🇧', '1429860776218202203'),
  ('🇯🇴', '1429860777107652769'),
  ('🇵🇰', '1429860779183706112'),
  ('🇧🇩', '1429860781591236679'),
  ('🇱🇰', '1429860784112144464'),
  ('🇳🇵', '1429860785110388776'),
  ('🇵🇭', '1429860786657956003'),
  ('🇲🇾', '1429860787584897028'),
  ('🇭🇰', '1429860789283586221'),
  ('🇹🇼', '1429860790449733707'),
  ('🇲🇳', '1429860792358142044'),
  ('🇰🇭', '1429860794530791505'),
  ('🇱🇦', '1429860795809927359'),
  ('🇧🇳', '1429860797462483085'),
  ('🇲🇲', '1429860798594945166'),
  ('🇨🇾', '1429860800146964703'),
  ('🇪🇪', '1429860801694666883'),
  ('🇱🇻', '1429860804215439513'),
  ('🇱🇹', '1429860805079470172'),
  ('🇧🇾', '1429860806799003688'),
  ('🇷🇸', '1429860809085030450'),
  ('🇧🇦', '1429860810561421322'),
  ('🇲🇰', '1429860811815522315'),
  ('🇦🇱', '1429860814084378677'),
  ('🇬🇪', '1429860816613671083'),
  ('🇦🇲', '1429860817985077319'),
  ('🇦🇿', '1429860819092373665');

-- Story state
create table if not exists public.story_state (
  id text primary key,
  last_user_id text,
  story_message_id text
);
create table if not exists public.story_words (
  position integer primary key,
  word text not null
);
truncate table public.story_state;
truncate table public.story_words;
insert into public.story_state (id, last_user_id, story_message_id) values ('main', '1243913169043197953', '1431964755177897986');
insert into public.story_words (position, word) values
  (0, 'once'),
  (1, 'upon'),
  (2, 'a'),
  (3, 'day'),
  (4, 'there'),
  (5, 'was'),
  (6, 'the'),
  (7, 'naked'),
  (8, 'woman'),
  (9, 'called'),
  (10, 'chantellinda'),
  (11, 'she'),
  (12, 'was'),
  (13, 'the'),
  (14, 'naturist'),
  (15, 'from'),
  (16, 'the'),
  (17, 'planet,'),
  (18, 'nudeworld.'),
  (19, 'she'),
  (20, 'spreads'),
  (21, 'words'),
  (22, 'about'),
  (23, 'nudist'),
  (24, 'living'),
  (25, 'around'),
  (26, 'the'),
  (27, 'globe'),
  (28, 'and'),
  (29, 'she'),
  (30, 'found'),
  (31, 'that'),
  (32, 'the'),
  (33, 'majority'),
  (34, 'already'),
  (35, 'knew'),
  (36, 'but'),
  (37, 'she'),
  (38, 'was'),
  (39, 'surprised'),
  (40, 'nobody'),
  (41, 'actively'),
  (42, 'participated.'),
  (43, 'nudeworld'),
  (44, 'would'),
  (45, 'be'),
  (46, 'so'),
  (47, 'much'),
  (48, 'more'),
  (49, 'for'),
  (50, 'people'),
  (51, 'to'),
  (52, 'enjoy'),
  (53, 'and'),
  (54, 'better');

-- Eco village data
create table if not exists public.eco_village (
  id text primary key,
  level integer not null,
  xp integer not null,
  xp_to_next integer,
  next_level_requirement integer,
  xp_remaining integer,
  calmness integer,
  weather jsonb,
  season text,
  season_change_at bigint,
  season_changed_at bigint,
  time text,
  time_change_at bigint,
  time_changed_at bigint,
  resources jsonb,
  structures jsonb,
  progress jsonb,
  storage_level integer,
  storage_capacity integer,
  metrics jsonb
);
create table if not exists public.eco_players (
  player_id text primary key,
  xp integer not null default 0,
  calm integer not null default 0,
  money integer not null default 0
);
create table if not exists public.eco_player_inventory (
  player_id text not null references public.eco_players(player_id) on delete cascade,
  item_name text not null,
  quantity integer not null default 0,
  primary key (player_id, item_name)
);
create table if not exists public.eco_player_garden (
  plot_id text primary key,
  player_id text not null references public.eco_players(player_id) on delete cascade,
  seed text not null,
  planted_at bigint not null,
  growth_time bigint not null,
  notified_stages jsonb not null default '[]'::jsonb
);
create table if not exists public.eco_player_gathers (
  player_id text not null references public.eco_players(player_id) on delete cascade,
  gathered_at bigint not null,
  primary key (player_id, gathered_at)
);
truncate table public.eco_player_garden;
truncate table public.eco_player_inventory;
truncate table public.eco_player_gathers;
truncate table public.eco_players;
truncate table public.eco_village;
insert into public.eco_village (id, level, xp, xp_to_next, next_level_requirement, xp_remaining, calmness, weather, season, season_change_at, season_changed_at, time, time_change_at, time_changed_at, resources, structures, progress, storage_level, storage_capacity, metrics) values ('main', 1, 2, 2, 100, 98, 2, '{"type":"Cloudy","nextChange":1762466711877,"changedAt":1762448711877}', 'Spring', 1762472622132, 1762386222132, 'Night', 1762470402938, 1762448802938, '{}', '{}', '{}', 1, 100, '{"totalDonations":0,"unlockedBuildings":5,"rareEvents":0,"lastGrowthScore":2}');
insert into public.eco_players (player_id, xp, calm, money) values
  ('946346329783803945', 28, 8, 0);
insert into public.eco_player_inventory (player_id, item_name, quantity) values
  ('946346329783803945', 'herbs', 3),
  ('946346329783803945', 'sunflower', 3);
insert into public.eco_player_garden (plot_id, player_id, seed, planted_at, growth_time, notified_stages) values
  ('lavender-1762449881004', '946346329783803945', 'lavender', 1762449881004, 49572000, '[]'::jsonb);
insert into public.eco_player_gathers (player_id, gathered_at) values
  ('946346329783803945', 1762448816254);

-- Daily poll history
create table if not exists public.would_you_rather_history (
  date_key text primary key,
  message_id text,
  option_a text,
  option_b text,
  posted_at bigint
);
create table if not exists public.would_you_rather_state (
  id text primary key,
  last_post_date text,
  last_message_id text,
  last_posted_at bigint
);
create table if not exists public.this_or_that_history (
  date_key text primary key,
  message_id text,
  option_a text,
  option_b text,
  posted_at bigint
);
create table if not exists public.this_or_that_state (
  id text primary key,
  last_post_date text,
  last_message_id text,
  last_posted_at bigint
);
truncate table public.would_you_rather_history;
truncate table public.this_or_that_history;
truncate table public.would_you_rather_state;
truncate table public.this_or_that_state;
insert into public.would_you_rather_state (id, last_post_date, last_message_id, last_posted_at) values ('main', '2025-11-06', '1436038727976751357', 1762448712757);
insert into public.this_or_that_state (id, last_post_date, last_message_id, last_posted_at) values ('main', '2025-11-06', '1436038746435883080', 1762448717073);
