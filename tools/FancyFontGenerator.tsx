import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Pin, Search, Sparkles } from 'lucide-react';
import { db, STORES } from '../utils/db';

const BASE_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const STYLES_DATA = [
  { name: "Bold Serif", map: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗" },
  { name: "Bold Sans", map: "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵" },
  { name: "Italic Serif", map: "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍0123456789" },
  { name: "Italic Sans", map: "𝘢𝘣𝘤𝘥𝗲𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡0123456789" },
  { name: "Bold Italic Serif", map: "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗" },
  { name: "Bold Italic Sans", map: "𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵" },
  { name: "Script Normal", map: "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789" },
  { name: "Script Bold", map: "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗" }, 
  { name: "Fraktur Normal", map: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ0123456789" },
  { name: "Fraktur Bold", map: "𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖙𝖚𝖛𝖜𝖝𝖞𝖟𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅0123456789" },
  { name: "Monospace", map: "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９" },
  { name: "Double Struck", map: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡" },
  { name: "Circled", map: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ0①②③④⑤⑥⑦⑧⑨" },
  { name: "Circled Dark", map: "🅐𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁🅐𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁⓿❶❷❸❹❺❻❼❽❾" },
  { name: "Parenthesized", map: "⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵🄐🄑🄒🄓🄔🄕🄖🄗🄘🄙🄚🄛🄜🄝🄞🄟🄠🄡🄢🄣🄤🄥🄦🄧🄨🄩⑴⑵⑶⑷⑸⑹⑺⑻⑼" },
  { name: "Squared", map: "a𝐛c𝐝e𝐟g𝐡i𝐣k𝐥m𝐧o𝐩q𝐫s𝐭u𝐯w𝐱y𝐳🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉0123456789" }, 
  { name: "Squared Dark", map: "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉0123456789" }, 
  { name: "Small Caps", map: "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ0123456789" },
  { name: "Tiny (Superscript)", map: "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ⁰¹²³⁴⁵⁶⁷⁸⁹" },
  { name: "Subscript", map: "ₐbcdₑfgₕᵢjklmₙₒpqᵣₛₜᵤᵥwxyzABCDₑFGₕᵢJKLMₙₒPQᵣₛₜᵤᵥWXYZ₀₁₂₃₄₅₆₇₈₉" }, 
  { name: "Inverted", type: "inverted" },
  { name: "Reversed", type: "reversed" },
  { name: "Strikethrough", type: "combining", char: "\u0336" },
  { name: "Slash Through", type: "combining", char: "\u0338" },
  { name: "Underline", type: "combining", char: "\u0332" },
  { name: "Double Underline", type: "combining", char: "\u0333" },
  { name: "Overline", type: "combining", char: "\u0305" },
  { name: "Wiggle Under", type: "combining", char: "\u0330" },
  { name: "Arrow Below", type: "combining", char: "\u034e" },
  { name: "Cross Above", type: "combining", char: "\u033d" },
  { name: "Greekish", map: "αвcdεfgнιjκlмησpqяѕтυνωxуzΑΒCDΕFGΗΙJΚLΜΝΟΡQЯЅΤ𝚄VΩΧΥΖ0123456789" },
  { name: "Cyrillicish", map: "аъсdеfgнiјкlмиорqгsтцvшхyzАБСDЕFGНIЈКLМИОРQГSТЦVШХYZ0123456789" },
  { name: "Runes", map: "ᚪᛒᚳᛞᛖᚠᚷᚻᛁᛃᚲᛚᛗᚾᚩᛈᛩᚱᛋᛏᚢᚡᚹᛪᚣᛎᚪᛒᚳᛞᛖᚠᚷᚻᛁᛃᚲᛚᛗᚾᚩᛈᛩᚱᛋᛏᚢᚡᚹᛪᚣᛎ0123456789" }, 
  { name: "Wide Text", type: "spacing", sep: " " },
  { name: "W i d e r", type: "spacing", sep: "  " },
  { name: "Dotted", type: "spacing", sep: "." },
  { name: "Dashed", type: "spacing", sep: "-" },
  { name: "Slashed", type: "spacing", sep: "/" },
  { name: "Arrowed", type: "spacing", sep: "→" },
  { name: "Starry", type: "spacing", sep: "★" },
  { name: "Sparkles", type: "spacing", sep: "✨" },
  { name: "Hearts", type: "spacing", sep: "♥" },
  { name: "Plus", type: "spacing", sep: "+" },
  { name: "Wavy", type: "spacing", sep: "〰" },
  { name: "[Boxed]", type: "wrapper", left: "[", right: "]" },
  { name: "(Parens)", type: "wrapper", left: "(", right: ")" },
  { name: "{Braces}", type: "wrapper", left: "{", right: "}" },
  { name: "<Angles>", type: "wrapper", left: "<", right: ">" },
  { name: "||Lines||", type: "wrapper", left: "||", right: "||" },
  { name: "/Slashes/", type: "wrapper", left: "/", right: "/" },
  { name: "L33t Speak", type: "replace", map: {'a':'4','e':'3','i':'1','o':'0','s':'5','t':'7','l':'1'} },
  { name: "Upside Down", type: "inverted" },
  { name: "Mirror", type: "reversed" },
  { name: "Currency", map: "₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩Ӿ¥Ⱬ₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩Ӿ¥Ⱬ0123456789" },
  { name: "Thai-ish", map: "ภ๒ς๔єŦﻮђเןкl๓ภ๏קợгรtยשฬץչค๒ς๔єŦﻮђเןкl๓ภ๏קợгรtยשฬץչ0123456789" },
  { name: "Sorcerer", map: "ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ0123456789" },
  { name: "Special", map: "Ⱥƀ↻ժeƒǥhìʝҠlmñօԹqɾstմѵա×վzȺƀ↻ժeƒǥhìʝҠlmñօԹqɾstմѵա×վz0123456789" },
  { name: "Blurry", type: "combining", char: "\u0489" }, 
  { name: "Noisy", type: "combining", char: "\u0324" }, 
  { name: "Cloudy", type: "combining", char: "\u0311" }, 
  { name: "Hacker", type: "combining", char: "\u033f" }, 
  { name: "Ant", type: "combining", char: "\u0488" }, 
  { name: "Aboriginal", map: "ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭQᖇᔕTᑌᐯᗯ᙭YᘔᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭQᖇᔕTᑌᐯᗯ᙭Yᘔ0123456789" },
  { name: "Symbols", map: "ꍏb☾ᖗ€Ϝ❡h|♪Ϗ↳♔♫⊙ρᕘ®$†☋✓ω⌘¥☡ꍏb☾ᖗ€Ϝ❡h|♪Ϗ↳♔♫⊙ρᕘ®$†☋✓ω⌘¥☡0123456789" },
  { name: "Math Bold", map: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗" },
  { name: "Math Italic", map: "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍0123456789" },
  { name: "Neon", type: "spacing", sep: " ░ " },
  { name: "Blocks", type: "spacing", sep: " █ " },
  { name: "Japanese", map: "ﾑbᄃdΣfgΉijΚlmПӨpQЯƧƬЦVЩXΥZﾑbᄃdΣfgΉijΚlmПӨpQЯƧƬЦVЩXΥZ0123456789" },
];

const INVERTED_MAP: Record<string, string> = {
  'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ', 
  'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 
  's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
  'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ', 'H': 'H', 'I': 'I',
  'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'd', 'Q': 'b', 'R': 'R',
  'S': 'S', 'T': '┴', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
  '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0',
  '.': '˙', ',': "'", '?': '¿', '!': '¡', '"': '„', "'": ','
};

export const FancyFontGenerator: React.FC = () => {
  const [inputText, setInputText] = useState("Hello World");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load pinned IDs from IDB
  useEffect(() => {
    const loadPinned = async () => {
      try {
        const saved = await db.get<number[]>(STORES.TOOL_STATE, 'fancy_fonts_pinned');
        if (saved) setPinnedIds(saved);
      } catch (e) {
        console.error(e);
      }
    };
    loadPinned();
  }, []);

  const handlePin = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = prev.includes(id) 
        ? prev.filter(pid => pid !== id)
        : [...prev, id];
      
      db.set(STORES.TOOL_STATE, 'fancy_fonts_pinned', next).catch(console.error);
      return next;
    });
  };

  const transformText = (text: string, style: any) => {
    const chars = Array.from(text);

    if (style.type === "inverted") {
       return text.split('').reverse().map(char => INVERTED_MAP[char] || char).join('');
    }
    
    if (style.type === "reversed") {
       return chars.reverse().join('');
    }

    if (style.type === "spacing" && style.sep) {
       return chars.join(style.sep);
    }
    
    if (style.type === "wrapper") {
        return chars.map(c => c === ' ' ? ' ' : `${style.left}${c}${style.right}`).join('');
    }

    if (style.type === "combining" && style.char) {
        return chars.map(c => c + style.char).join('');
    }

    if (style.type === "replace" && style.map) {
        return chars.map(c => style.map[c.toLowerCase()] || c).join('');
    }

    if (style.map && typeof style.map === 'string') {
         const mapSymbols = Array.from(style.map);
         return chars.map(char => {
             const index = BASE_ALPHABET.indexOf(char);
             if (index === -1) return char;
             if (index < mapSymbols.length) return mapSymbols[index];
             return char;
         }).join('');
    }

    return text;
  };

  const generatedStyles = useMemo(() => {
    const textToConvert = inputText || "Hello World"; 
    
    const allStyles = STYLES_DATA.map((style, idx) => ({ 
      id: idx, 
      name: style.name, 
      content: transformText(textToConvert, style) 
    }));

    const filtered = allStyles.filter(s => 
       s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
        const aPinned = pinnedIds.includes(a.id);
        const bPinned = pinnedIds.includes(b.id);
        if (aPinned === bPinned) return a.id - b.id;
        return aPinned ? -1 : 1;
    });

  }, [inputText, pinnedIds, searchTerm]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-6">
      {/* Input Area - Sticky */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl z-20 shrink-0">
          <div className="relative">
             <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type something magical..."
                className="w-full bg-transparent border-none focus:ring-0 px-6 py-5 text-2xl font-medium text-white placeholder-slate-600 outline-none"
             />
             <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <div className="relative hidden md:block group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
                    <input 
                      type="text" 
                      placeholder="Filter styles..." 
                      className="w-40 bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:w-56 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
             </div>
          </div>
      </div>

      {/* Grid Output */}
      <div className="flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar">
         <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
            {generatedStyles.map((item) => {
                const isPinned = pinnedIds.includes(item.id);
                const isCopied = copiedIndex === item.id;
                return (
                <div 
                    key={item.id} 
                    className={`break-inside-avoid group relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                        isPinned 
                        ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
                        : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-white/20'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-indigo-300 transition-colors">
                            {item.name}
                        </span>
                        <button
                            onClick={(e) => handlePin(e, item.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                                isPinned 
                                ? 'text-indigo-400 bg-indigo-500/20' 
                                : 'text-slate-600 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                            }`}
                        >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    
                    <div 
                        className="py-3 text-xl text-slate-200 font-medium break-all leading-relaxed cursor-pointer select-all"
                        onClick={() => handleCopy(item.content, item.id)}
                    >
                        {item.content}
                    </div>

                    <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                           onClick={() => handleCopy(item.content, item.id)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                               isCopied 
                               ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                               : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                           }`}
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            )})}
            
            {generatedStyles.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <Sparkles className="w-12 h-12 text-slate-700" />
                    <p>No magical styles found.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};