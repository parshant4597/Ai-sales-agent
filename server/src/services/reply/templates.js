// Deterministic reply writer. It is both the safety net (used when the AI
// reply is missing or fails the number check) and the reference for what a
// correct reply looks like. Every figure comes straight from the quote.
import { formatInr } from '../../utils/text.js';

const COPY = {
  english: {
    greeting: (name, returning) =>
      `Namaste${name ? ` ${name} ji` : ''}! ${returning ? 'Welcome back to Remedy Setu.' : 'Thank you for contacting Remedy Setu.'}`,
    quoteIntro: 'Here are the prices for you:',
    suggestIntro: 'We have these options, with prices:',
    unitLabel: { ratti: 'ratti', piece: 'pcs', mala: 'mala', puja: 'puja' },
    perUnit: 'per',
    total: 'Total',
    nextTier: (qty, unit, price) => `Order ${qty}+ ${unit} and the rate drops to ${formatInr(price)} per ${unit}.`,
    askQuantity: 'Please tell us how many you need and we will confirm the best rate.',
    otherRequest: 'About your other request:',
    otherHelp: 'For any other question, our team will be happy to help.',
    askProduct: 'Could you tell us the exact product you need (for example Neelam, 5 Mukhi Rudraksha)?',
    complaint:
      'We are very sorry for the trouble. Please share your order number and the details of the issue (a photo helps). Our team will look into it and get back to you.',
    orderStatus: 'Please share your order number or the phone number used for the order and our team will check the status for you.',
    pujaAsk: 'To book, please share the name of the person, gotra and your preferred date.',
    closing: 'Shall we go ahead? Reply YES to confirm your order.',
  },
  hinglish: {
    greeting: (name, returning) =>
      `Namaste${name ? ` ${name} ji` : ''}! ${returning ? 'Remedy Setu mein aapka dobara swagat hai.' : 'Remedy Setu se sampark karne ke liye dhanyavaad.'}`,
    quoteIntro: 'Aapke liye rate ye hain:',
    suggestIntro: 'Hamare paas ye options hain, rate ke saath:',
    unitLabel: { ratti: 'ratti', piece: 'pcs', mala: 'mala', puja: 'puja' },
    perUnit: 'per',
    total: 'Total',
    nextTier: (qty, unit, price) => `${qty}+ ${unit} order karne par rate ${formatInr(price)} per ${unit} ho jayega.`,
    askQuantity: 'Kitni quantity chahiye, bata dijiye, hum best rate confirm kar denge.',
    otherRequest: 'Aapki doosri requirement ke liye:',
    otherHelp: 'Kisi aur sawaal ke liye hamari team aapki madad karegi.',
    askProduct: 'Aapko kaun sa product chahiye, exact naam bata dijiye (jaise Neelam, 5 Mukhi Rudraksha)?',
    complaint:
      'Hume is takleef ke liye khed hai. Kripya apna order number aur problem ki detail (photo ke saath) bhej dijiye. Hamari team ise dekhkar aapko jawab degi.',
    orderStatus: 'Kripya apna order number ya order mein diya hua phone number bhej dijiye, hamari team status check karke batayegi.',
    pujaAsk: 'Booking ke liye kripya naam, gotra aur pasandida date bata dijiye.',
    closing: 'Kya hum aage badhein? Order confirm karne ke liye YES likh dijiye.',
  },
  hindi: {
    greeting: (name, returning) =>
      `नमस्ते${name ? ` ${name} जी` : ''}! ${returning ? 'रेमेडी सेतु में आपका फिर से स्वागत है।' : 'रेमेडी सेतु से संपर्क करने के लिए धन्यवाद।'}`,
    quoteIntro: 'आपके लिए रेट ये हैं:',
    suggestIntro: 'हमारे पास ये विकल्प हैं, रेट के साथ:',
    unitLabel: { ratti: 'रत्ती', piece: 'पीस', mala: 'माला', puja: 'पूजा' },
    perUnit: 'प्रति',
    total: 'कुल',
    nextTier: (qty, unit, price) => `${qty}+ ${unit} ऑर्डर करने पर रेट ${formatInr(price)} प्रति ${unit} हो जाएगा।`,
    askQuantity: 'कृपया बताइए कितनी मात्रा चाहिए, हम सबसे अच्छा रेट कन्फर्म कर देंगे।',
    otherRequest: 'आपकी दूसरी ज़रूरत के लिए:',
    otherHelp: 'किसी और सवाल के लिए हमारी टीम आपकी मदद करेगी।',
    askProduct: 'कृपया सही प्रोडक्ट का नाम बताइए (जैसे नीलम, 5 मुखी रुद्राक्ष)।',
    complaint:
      'असुविधा के लिए हमें खेद है। कृपया अपना ऑर्डर नंबर और समस्या की जानकारी (फोटो सहित) भेजिए। हमारी टीम जाँच करके आपको जवाब देगी।',
    orderStatus: 'कृपया अपना ऑर्डर नंबर या ऑर्डर में दिया गया फोन नंबर भेजिए, हमारी टीम स्थिति जाँचकर बताएगी।',
    pujaAsk: 'बुकिंग के लिए कृपया नाम, गोत्र और पसंदीदा तिथि बताइए।',
    closing: 'क्या हम आगे बढ़ें? ऑर्डर कन्फर्म करने के लिए YES लिखिए।',
  },
};

function lineText(line, copy, language) {
  const name = language === 'hindi' ? line.hindiName : line.name;
  const unit = copy.unitLabel[line.unit];
  const base = `• ${name}: ${formatInr(line.unitPrice)} ${copy.perUnit} ${unit}`;
  const priced = line.quantity !== null ? ` × ${line.quantity} = ${formatInr(line.lineTotal)}` : '';
  const hint = line.nextTier && line.quantity !== null ? `\n  ${copy.nextTier(line.nextTier.minQty, unit, line.nextTier.price)}` : '';
  return base + priced + hint;
}

function quoteBlock(quote, copy, language, intro) {
  const lines = quote.lines.map((line) => lineText(line, copy, language));
  const showTotal = quote.total !== null && quote.lines.filter((line) => line.lineTotal !== null).length > 1;
  const total = showTotal ? [`${copy.total}: ${formatInr(quote.total)}`] : [];
  return [intro, ...lines, ...total].join('\n');
}

/**
 * analysis: { intent, language } - quote: { lines, total, isSuggestion }
 */
export function buildTemplateReply({ intent, language, customerName, isReturning }, quote) {
  const copy = COPY[language] || COPY.english;
  const parts = [copy.greeting(customerName, isReturning)];

  const isSupport = intent === 'complaint' || intent === 'order_status';
  if (intent === 'complaint') parts.push(copy.complaint);
  else if (intent === 'order_status') parts.push(copy.orderStatus);

  if (quote.lines.length > 0) {
    // A complaint can carry a second, sales request. Answer the support part first, then the prices.
    if (isSupport) parts.push(copy.otherRequest);
    const intro = quote.isSuggestion ? copy.suggestIntro : copy.quoteIntro;
    parts.push(quoteBlock(quote, copy, language, intro));

    const missingQuantity = quote.lines.some((line) => line.quantity === null);
    if (intent === 'puja_booking') parts.push(copy.pujaAsk);
    else if (missingQuantity) parts.push(copy.askQuantity);
    else parts.push(copy.closing);
    if (intent === 'general') parts.push(copy.otherHelp); // a question about the product that prices cannot answer
  } else if (!isSupport) {
    if (intent === 'general') parts.push(copy.otherHelp); // e.g. delivery, payment or "hello"
    parts.push(copy.askProduct);
  }

  return parts.join('\n\n');
}
