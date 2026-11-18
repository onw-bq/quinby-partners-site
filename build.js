// Quinby Partners — static site build. No dependencies: `node build.js` writes the site to ./dist.
// Cloudflare Pages settings: build command `node build.js`, output directory `dist`.
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.quinbypartners.com';
// Editable content lives in /content (JSON), edited in Pages CMS or by hand.
const load = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, 'content', n + '.json'), 'utf8'));
const SETTINGS = load('settings');
const HOME = load('home');
const COLLECTION = load('collection').homes || [];
const GIFTS = load('gifts').gifts || [];
const TESTIMONIALS = load('testimonials').testimonials || [];
const PUBLICATION = load('publication');
const PUB = SETTINGS.publicationName || '[Publication name]';
const PUB_PATH = '/journal';               // the publication's address on the site
const PUB_LIVE = SETTINGS.publicationLive === true; // off until the publication launches: hidden from menu, pages and copy
const PUBS = PUB_LIVE ? 'our publication, newsletter' : 'our newsletter'; // used in copy
const PHONE = SETTINGS.phone;
const EMAIL = SETTINGS.email;
const ADDRESS = ['1250 Wayzata Blvd E, Unit 1910', 'Wayzata, MN 55391'];
const BROKER_LICENSE = '40847796';

// B-roll clips: put files in src/video and list them here. Empty = the block shows its still colour and label.
// e.g. home: { src: '/video/staircase.mp4', small: '/video/staircase-small.mp4', poster: '/video/staircase.jpg' }
const VIDEO = {};

const OUT = path.join(__dirname, 'dist');
const pages = [];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const metaLine = (...xs) => xs.filter((x) => x && String(x).trim()).map(esc).join(' · ');
const photo = (src, alt, label) => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : `<span class="caps">${esc(label)}</span>`;
const realGifts = GIFTS.filter((g) => g.nonprofit && !String(g.nonprofit).startsWith('['));
const giftTotal = realGifts.reduce((s, g) => s + (Number(g.amount) || 0), 0);
const STATS = realGifts.length
  ? { given: '$' + giftTotal.toLocaleString('en-US'), closings: String(realGifts.length), nonprofits: String(new Set(realGifts.map((g) => g.nonprofit.trim().toLowerCase())).size) }
  : { given: '[$—]', closings: '[—]', nonprofits: '[—]' };
const giftRow = (g) => `<li><div class="row"><span class="n" style="font-size:22px">${esc(g.nonprofit)}</span><span class="m">${metaLine(g.cause, g.month)}</span></div></li>`;
const homeHref = (h) => `/the-collection/${esc(h.slug)}`;
const homeCard = (h, i) => `<a class="card" href="${homeHref(h)}"><div class="ph">${photo(h.photo, h.name, 'Photo')}</div><div style="display:flex;gap:16px;align-items:baseline"><span class="no">No. ${String(i + 1).padStart(2, '0')}</span><div><p class="name">${esc(h.name)}</p><p class="meta">${metaLine(h.neighborhood, h.style, h.status)}</p></div></div></a>`;
const featureHref = () => `${PUB_PATH}/${esc(PUBLICATION.feature.slug)}`;
const regCard = (r, tagLabel) => `<a class="card" href="${r === PUBLICATION.feature ? featureHref() : PUB_PATH}"><div class="ph wide">${photo(r.photo, r.name, '')}</div>${tagLabel ? `<p class="eyebrow" style="margin:0">${tagLabel}</p>` : ''}<p class="name">${esc(r.name)}</p><p class="meta">${metaLine(r.neighborhood, r.year, r.style)}</p></a>`;
const featureImg = (src, label) => `<div class="feature-img media plain">${src ? `<img class="poster" src="${esc(src)}" alt="">` : `<p class="label">${esc(label)}</p>`}</div>`;
const quote = (t) => `\u201c${esc(t.quote)}\u201d`;

const rollLine = (first, phrases, label) => `<section class="section we-sell" aria-label="${esc(label)}"><div class="wrap center">
<hr class="rule" style="margin:0 auto 40px">
<p class="first">${esc(first)}</p>
<p class="phrase" aria-live="polite" data-phrases='${esc(JSON.stringify(phrases))}'>${esc(phrases[phrases.length - 1])}</p>
</div></section>`;
// ---------- shared pieces ----------
const NAV = [
  ['The Collection', '/the-collection'],
  ['Neighborhoods', '/neighborhoods'],
  ['Architecture & Design', '/architecture-design'],
  ...(PUB_LIVE ? [[PUB, PUB_PATH]] : []),
  ['Why Quinby Partners', '/why-quinby-partners'],
  ['Giving', '/giving'],
];

function header(current) {
  const links = NAV.map(([t, h]) => `<a href="${h}"${current && (current === h || current.startsWith(h + '/')) ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('\n');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="/"><img src="/assets/qp-monogram-gold.png" alt="" width="46" height="33"><span>Quinby Partners</span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
<nav class="nav" id="site-nav" aria-label="Main">
${links}
<a class="contact" href="/work-with-us"${current === '/work-with-us' ? ' aria-current="page"' : ''}>Work with us</a>
</nav>
</div></header>`;
}

function media(key, label, cls = 'band', still) {
  const v = VIDEO[key];
  const data = v ? ` data-video="${v.src}"${v.small ? ` data-video-small="${v.small}"` : ''}${v.poster ? ` data-poster="${v.poster}"` : ''}` : '';
  const posterSrc = (v && v.poster) || still;
  const poster = posterSrc ? `<img class="poster" src="${esc(posterSrc)}" alt="">` : '';
  return { open: `<div class="media ${cls}"${data}>${poster}<p class="label" aria-hidden="true">B-roll · ${esc(label)}</p>`, close: '</div>' };
}

function hero(key, label, { eyebrow, title, sub, short, still } = {}) {
  const m = media(key, label, 'hero' + (short ? ' short' : ''), still);
  return `${m.open}<div class="wrap">
${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${title}</h1>
${sub ? `<p class="sub">${sub}</p>` : ''}</div>${m.close}`;
}

function band(key, label) { const m = media(key, label); return m.open + m.close; }

function bands() {
  const pubSection = PUB_LIVE ? `<section class="section white" aria-labelledby="pub-band">
<div class="wrap">
<div class="head-row"><div>
<p class="eyebrow">Our publication · Online</p>
<h2 id="pub-band">${esc(PUB)}</h2>
<p style="max-width:560px;margin-top:14px">Stories of the Twin Cities' most remarkable homes: their architecture, their makers and the people who care for them.</p>
</div><a class="link" href="${PUB_PATH}">Read the latest</a></div>
<div class="grid">
${[regCard(PUBLICATION.feature, 'This month\'s feature'), ...(PUBLICATION.register || []).slice(0, 2).map((r) => regCard(r, 'From the Register'))].join('\n')}
</div></div></section>` : '';
  return `${pubSection}
<section class="section pine tight" aria-labelledby="db-band">
<div class="wrap db-grid solo">
${dbSoon('db')}
</div></section>`;
}

// Doing Better is coming in 2027: one card, used in the band and on its page
const dbSoon = (id) => `<div class="soon-card">
<p class="eyebrow">Coming in 2027</p>
<h2 id="${id}-band">Doing Better</h2>
<p>A podcast with Becky Quinby: conversations with nonprofit leaders, purpose-driven professionals and community partners about building work that does well and does good.</p>
<form class="lead-form inline" action="/api/lead" method="post" data-thanks="You’re on the list. We’ll let you know when the first episode arrives.">
<input type="hidden" name="tags" value="doing better: waitlist"><input type="hidden" name="source" value="Doing Better waitlist">
<div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<label class="skip" for="${id}-email">Email address</label>
<input id="${id}-email" name="email" type="email" placeholder="Email address" autocomplete="email" required>
<button type="submit">Tell me when it launches</button>
<p class="form-status" role="status" aria-live="polite" style="flex-basis:100%;margin:0"></p>
</form></div>`;

function footer() {
  return `<footer class="site-footer"><div class="wrap">
<div class="cols">
<div class="col wide">
<p class="title">The Front Porch</p>
<p>Our monthly letter: homes, neighborhoods and giving.</p>
<form class="lead-form inline" action="/api/lead" method="post" data-thanks="You\u2019re on the list. Thank you.">
<input type="hidden" name="tags" value="newsletter: the front porch"><input type="hidden" name="source" value="Footer newsletter signup">
<div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<label class="skip" for="nl-email">Email address</label>
<input id="nl-email" name="email" type="email" placeholder="Email address" autocomplete="email" required>
<button type="submit">Subscribe</button>
<p class="form-status" role="status" aria-live="polite" style="flex-basis:100%;margin:0"></p>
</form>
</div>
<div class="col">
<p class="title" style="font-size:18px">Quinby Partners</p>
<p>${ADDRESS.join('<br>')}<br><a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a><br><a href="mailto:${EMAIL}">${EMAIL}</a></p>
</div>
<div class="col">
<p><a href="/work-with-us">Work with us</a><br><a href="/selling">Selling</a><br><a href="/buying">Buying</a><br><a href="/neighborhoods">Neighborhoods</a><br><a href="/doing-better">Doing Better</a> (coming 2027)<br><a href="/contact">Contact</a><br><a href="/about/becky-quinby">Becky Quinby</a> · <a href="/about/elena-quinby">Elena Quinby</a></p>
</div>
<div class="col">
<p>Onward Impact Partner<br>$1,000 to a nonprofit you choose at every closing</p>
</div>
</div>
<div class="legal">
<span class="eho">Equal Housing Opportunity</span>
<span>Quinby Partners · Minnesota real estate brokerage license ${BROKER_LICENSE}</span>
<span>Est. 2012 · © ${new Date().getFullYear()} Quinby Partners</span>
</div></div></footer>`;
}

const ORG = {
  '@type': 'RealEstateAgent',
  '@id': SITE + '/#org',
  name: 'Quinby Partners',
  url: SITE + '/',
  logo: SITE + '/assets/qp-monogram-gold.png',
  telephone: '+1-' + PHONE,
  email: EMAIL,
  slogan: 'We find passionate buyers for homes with character.',
  foundingDate: '2012',
  description: 'Quinby Partners is an independent, woman-owned real estate brokerage in the Twin Cities specializing in historic, architect-designed and original homes. At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses.',
  address: { '@type': 'PostalAddress', streetAddress: ADDRESS[0], addressLocality: 'Wayzata', addressRegion: 'MN', postalCode: '55391', addressCountry: 'US' },
  areaServed: ['Minneapolis, MN', 'St. Paul, MN', 'Edina, MN', 'Golden Valley, MN'].map((n) => ({ '@type': 'City', name: n })),
  knowsAbout: ['Historic homes', 'Architecturally significant homes', 'Mid-century modern homes', 'Architect-designed homes', 'Selling historic homes', 'Buying historic homes'],
  founder: { '@id': SITE + '/about/becky-quinby#person' },
};

function page({ path: p, title, description, body, faqs, schema = [], bandsOn = true, noindex = false }) {
  const url = SITE + (p === '/' ? '/' : p);
  const graph = [ORG, { '@type': 'WebPage', '@id': url + '#page', url, name: title, description, isPartOf: { '@id': SITE + '/#org' } }, ...schema];
  if (faqs && faqs.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const faqHtml = faqs && faqs.length ? `<section class="section tight" aria-labelledby="faq-h"><div class="wrap narrow"><p class="eyebrow">Questions</p><h2 id="faq-h" style="margin-bottom:24px">Frequently asked</h2>${faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}</div></section>` : '';
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Quinby Partners">
<link rel="icon" href="/assets/qp-monogram-gold.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300&family=Poppins:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body${body.trimStart().startsWith('<div class="media hero') ? ' class="has-hero"' : ''}>
${header(p)}
<main id="main">
${body}
${faqHtml}
${bandsOn ? bands() : ''}
</main>
${footer()}
<script src="/main.js" defer></script>
</body>
</html>
`;
  pages.push({ path: p, title, description, html, noindex });
}

const ctaBand = (title, text, href, label) => `<section class="section paper cta-band"><div class="wrap">
<div><h2>${title}</h2>${text ? `<p style="max-width:620px;margin-top:18px">${text}</p>` : ''}</div>
<a class="btn" href="${href}">${label}</a></div></section>`;

const values = `<div class="grid four">
<div class="value"><h3>Discretion</h3><p>Your plans, your finances, and your timeline stay between us.</p></div>
<div class="value"><h3>Candor</h3><p>We tell you what we see, clearly and early.</p></div>
<div class="value"><h3>Care</h3><p>We treat every move as the significant life event it is.</p></div>
<div class="value"><h3>Generosity</h3><p>Every transaction gives back, by design.</p></div>
</div>`;

// Lead forms post to /api/lead (functions/api/lead.js), which saves the contact and tags in Go High Level.
let formN = 0;
const FIELD = {
  name: (id) => `<label for="${id}-name">Name</label><input id="${id}-name" name="name" autocomplete="name" required>`,
  email: (id) => `<label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" required>`,
  phone: (id) => `<label for="${id}-phone">Phone (optional)</label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel">`,
  timeline: (id) => `<label for="${id}-when">When are you thinking?</label><select id="${id}-when" name="timeline"><option value="">Choose one</option><option>Now</option><option>In the next 6 months</option><option>6 to 12 months</option><option>Just exploring</option></select>`,
  message: (id) => `<label for="${id}-msg">Anything we should know?</label><textarea id="${id}-msg" name="message"></textarea>`,
  address: (id) => `<label for="${id}-addr">Mailing address</label><input id="${id}-addr" name="address" autocomplete="street-address" required>
<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px"><div><label for="${id}-city">City</label><input id="${id}-city" name="city" autocomplete="address-level2" required></div><div><label for="${id}-zip">ZIP</label><input id="${id}-zip" name="postalCode" autocomplete="postal-code" required></div></div>`,
};
function leadForm({ tags, source, fields = ['name', 'email', 'phone', 'message'], button = 'Send', thanks = 'Thank you. We\u2019ll be in touch within one business day.' }) {
  const id = 'f' + (++formN);
  return `<form class="form lead-form" action="/api/lead" method="post" data-thanks="${esc(thanks)}">
<input type="hidden" name="tags" value="${esc(tags)}"><input type="hidden" name="source" value="${esc(source)}">
<div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
${fields.map((f) => FIELD[f](id)).join('\n')}
<button class="btn" type="submit">${esc(button)}</button>
<p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}
const CONSULT = {
  'seller-consult': ['form: seller consult', 'Selling page', 'Request a consultation'],
  'buyer-consult': ['form: buyer consult', 'Buying page', 'Start the conversation'],
  consult: ['form: consult', 'Work with us page', 'Send'],
  contact: ['form: contact', 'Contact page', 'Send'],
};
const consultForm = (kind) => { const [tags, source, button] = CONSULT[kind]; return `${leadForm({ tags, source, button })}
<p class="small" style="margin-top:18px">Or call or text <a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a>, or email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`; };

// ---------- neighborhoods ----------
const AREAS = load('areas').areas.map((a) => ({ ...a, hoods: (a.neighborhoods || []).map((n) => [n.name, n.page ? '/neighborhoods/' + n.page : null, n.line]) }));

const HOODS = load('neighborhoods').neighborhoods.map((h) => ({ ...h, video: h.slug }));

// ---------- pages ----------

// Home
page({
  path: '/', title: 'Quinby Partners | Homes with Character: Historic, Architectural & Original Homes in the Twin Cities',
  description: 'Quinby Partners is an independent, woman-owned Twin Cities brokerage for historic, architect-designed and original homes. We find passionate buyers for homes with character.',
  body: `${hero('home', 'slow pan up a carved oak staircase, morning light', { eyebrow: esc(HOME.heroEyebrow), title: esc(HOME.heroTitle), sub: esc(HOME.heroSub) })}

<section class="section we-sell" aria-label="What we sell"><div class="wrap center">
<hr class="rule" style="margin:0 auto 40px">
<p class="first">We don't just sell homes. We sell</p>
<p class="phrase" aria-live="polite" data-phrases='${esc(JSON.stringify(HOME.phrases))}'>${esc(HOME.phrases[HOME.phrases.length - 1])}</p>
</div></section>

<section class="section"><div class="wrap">
<div class="split">
<div class="side"><p class="eyebrow">Our approach</p><hr class="rule"></div>
<div class="main"><p class="lede">Fewer clients, more attention. Honest advice, even when it isn't what someone hoped to hear. And a share of every transaction directed back into the community.</p>
<p style="margin-top:36px"><a class="link" href="/why-quinby-partners">Why Quinby Partners</a></p></div>
</div>
<div style="margin-top:80px">${values}</div>
</div></section>

${PUB_LIVE ? `<section class="feature" aria-labelledby="feat-h">
${featureImg(PUBLICATION.feature.photo, 'Photo · one editorial image of this month\'s featured home')}
<div class="wrap feature-cap">
<p class="eyebrow">From ${esc(PUB)} · This month</p>
<h2 id="feat-h">${esc(PUBLICATION.feature.name)}</h2>
<p class="meta caps">${metaLine(PUBLICATION.feature.neighborhood, PUBLICATION.feature.year, PUBLICATION.feature.style)}</p>
<p style="max-width:620px;margin-top:16px">${esc(PUBLICATION.feature.line)}</p>
<p><a class="link" href="${featureHref()}">Read the feature</a></p>
</div></section>` : ''}

<section class="section white"><div class="wrap">
<div class="head-row"><div><p class="eyebrow">Our listings &amp; recent sales</p><h2>The Collection</h2></div><a class="link" href="/the-collection">View the collection</a></div>
<div class="grid">
${COLLECTION.slice(0, 3).map((h, i) => homeCard(h, i)).join('\n')}
</div></div></section>

<section class="section testimonials" aria-labelledby="t-h"><div class="wrap">
<p class="eyebrow center" id="t-h">In our clients' words</p>
${(() => { const f = TESTIMONIALS.find((t) => t.featured) || TESTIMONIALS[0]; const rest = TESTIMONIALS.filter((t) => t !== f).slice(0, 2); return f ? `<blockquote class="pull" style="border:0;padding:24px 0 0"><p>${quote(f)}</p><footer>${metaLine(f.name, f.detail)}</footer></blockquote>
${rest.length ? `<div class="grid t-small">${rest.map((t) => `<blockquote><p>${quote(t)}</p><footer>${metaLine(t.name, t.detail)}</footer></blockquote>`).join('')}</div>` : ''}` : ''; })()}
</div></div></section>

${(() => { const m = media('architecture', 'a mix: leaded glass, a mid-century window wall, a gallery wall in a new build', 'navy-band'); return `<section class="section navy" style="position:relative;padding:0">${m.open}<div class="wrap" style="position:relative;z-index:1;padding-top:120px;padding-bottom:120px">
<p class="eyebrow">Architecture &amp; Design</p>
<h2 style="max-width:820px">Homes with a point of view, from 1905 to last year.</h2>
<p style="display:flex;flex-wrap:wrap;gap:14px 32px;margin-top:40px">
<a class="link" href="/architecture-design#historic">Historic</a>
<a class="link" href="/architecture-design#modern">Mid-century &amp; Modern</a>
<a class="link" href="/architecture-design#contemporary">Contemporary</a>
<a class="link" href="/architecture-design#architect-designed">Architect-designed</a>
<a class="link" href="/architecture-design#art-lovers">Homes for art lovers</a>
<a class="link" href="/architecture-design#craftsmanship">Original craftsmanship</a>
</p>
<p style="margin-top:36px;color:var(--stone)">Buying or selling one? <a href="/homes-with-character">Here's how it's different.</a></p>
</div>${m.close}</section>`; })()}

<section class="section"><div class="wrap">
<div class="head-row"><div><p class="eyebrow">Neighborhoods</p><h2>The neighborhoods we know best</h2>
<p style="max-width:600px;margin-top:14px">Homes with character are everywhere in the Twin Cities, from the lakes and Minnehaha Creek to the bluffs of St. Paul.</p></div>
<a class="link" href="/neighborhoods">All neighborhoods</a></div>
<ul class="rows">
${HOODS.map((h) => `<li><a href="/neighborhoods/${h.slug}"><span class="n">${h.name}</span><span class="m">${h.city}</span></a></li>`).join('\n')}
</ul></div></section>

<section class="section paper" aria-labelledby="give-h"><div class="wrap split">
<div class="main" style="flex:1 1 420px">
<p class="eyebrow">Giving</p>
<h2 id="give-h" style="font-size:clamp(32px,3.6vw,44px);line-height:1.25">At every closing, we give $1,000 to a nonprofit you choose.</h2>
<div style="display:flex;flex-wrap:wrap;gap:48px;margin-top:44px">
<div class="stat"><p class="big">${STATS.given}</p><p class="cap">Given so far</p></div>
<div class="stat"><p class="big">${STATS.nonprofits}</p><p class="cap">Nonprofits supported</p></div>
</div>
<p style="margin-top:40px"><a class="link" href="/giving">See every gift</a></p>
</div>
<div class="main" style="flex:1 1 420px">
<p class="eyebrow" style="margin-bottom:8px">Recent gifts</p>
<ul class="rows" style="border-top-color:var(--navy)">
${GIFTS.slice(0, 4).map(giftRow).join('\n')}
</ul></div></div></section>`,
  faqs: [
    ['What kinds of homes does Quinby Partners specialize in?', 'Homes with character, from every era: Craftsman bungalows and mid-century moderns, the Tudors and Mediterraneans that line Minnehaha Creek, artists’ lofts like the Bookmen Lofts, and pieces of history along Lake Minnetonka. We work with every kind of home and every price point.'],
    ['Where does Quinby Partners work?', 'Across the Twin Cities. Minneapolis, St. Paul, Edina and Golden Valley are especially rich in original architecture, and that’s where much of our work is.'],
    ['Does Quinby Partners give back?', 'Yes. At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses.'],
  ],
});

// Why Quinby Partners
page({
  path: '/why-quinby-partners', title: 'Why Quinby Partners | An Independent, Woman-Owned Boutique Brokerage',
  description: 'Quinby Partners is an independent, woman-owned boutique brokerage and the Twin Cities’ specialists in older, architectural and original homes: protecting original features, telling each home’s story and finding its next stewards.',
  body: `${hero('why', 'Becky and Elena walking a client through a historic home', { eyebrow: 'Why Quinby Partners', title: 'The Twin Cities’ specialists in homes with character.', short: true })}
<section class="section"><div class="wrap split">
<div class="side"><p class="eyebrow">Our story</p><hr class="rule"></div>
<div class="main prose">
<p class="lede">Becky Quinby founded Quinby Partners on a simple conviction: to leave everything better than she found it. That applies to the homes we sell, the clients we serve, and the community we share.</p>
<p>We built an independent brokerage so we could work the way we believe real estate should work. Fewer clients, more attention. Honest advice, even when it isn't what someone hoped to hear. And a share of every transaction directed back into the community.</p>
<h2>Experts in older and original homes</h2>
<p>Homes with character are our specialty, and we know them from the inside. Becky has bought, renovated and lived in homes across nearly a century of design, and cares for historic properties of her own. Since 2012 we’ve sold Craftsman bungalows, Tudors, Victorians, mid-century moderns and artists’ lofts across Minneapolis, St. Paul, Edina and Golden Valley.</p>
<p>We know what makes these homes valuable: the woodwork, leaded glass, tile, hardware and built-ins that can’t be replaced, and the updates that add value without erasing them. For sellers, that means advice on what to protect and what to fix, a home presented and priced for what it really is, and buyers who will care for it as well as you have. For buyers, it means knowing what’s original, what’s been changed, and what it will take to look after it.</p>
<h2>Independent by design</h2>
<p>We answer to our clients, not a franchise playbook. That independence lets us move quickly, tailor every strategy, and give each decision the care it deserves.</p>
<h2>Boutique, on purpose</h2>
<p>Hiring a boutique brokerage is a choice to work with the people whose names are on the door. You get the founder's attention, a strategy built for your home rather than a template, and a team small enough that nothing gets lost.</p>
<h2>Woman-owned</h2>
<p>Quinby Partners is owned and led by women. We built the kind of firm we'd want to hire.</p>
<h2>Rooted in community</h2>
<p>We live, work, and raise our families in the Twin Cities. That knowledge shows up in sharper pricing, stronger negotiations, and candid advice on the homes, streets, and market in every neighborhood we serve.</p>
<h2>Philanthropy driven</h2>
<p>Every time you buy or sell a home with us, Quinby Partners donates $1,000 to a nonprofit you choose, on your behalf. Your move becomes a way to support a cause that makes an impact. <a href="/giving">See every gift.</a></p>
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">What guides us</p><div style="margin-top:32px">${values}</div></div></section>
<section class="section"><div class="wrap grid">
<a class="card" href="/about/becky-quinby"><div class="ph"></div><p class="name">Becky Quinby</p><p class="meta">Founder and broker</p></a>
<a class="card" href="/about/elena-quinby"><div class="ph"></div><p class="name">Elena Quinby</p><p class="meta">Realtor</p></a>
</div></section>
${ctaBand('Let\'s talk about your home.', 'Whether you\'re buying, selling, or simply considering your options.', '/work-with-us', 'Work with us')}`,
  faqs: [
    ['Does Quinby Partners specialize in older homes?', 'Yes. Older, architectural and original homes are our specialty. We know which original features carry value and how to protect them through a sale, how to tell a home’s story, and how to find buyers who will care for it, across Minneapolis, St. Paul, Edina and Golden Valley.'],
    ['Is Quinby Partners an independent brokerage?', 'Yes. Quinby Partners is an independent, woman-owned boutique brokerage in the Twin Cities, not part of a franchise.'],
    ['Why choose a boutique brokerage over a large one?', 'You work directly with the people whose names are on the door, with a strategy built for your home and a small team where nothing gets lost.'],
  ],
});

// About pages (bios from the current site)
page({
  path: '/about/becky-quinby', title: 'Becky Quinby | Founder & Broker, Historic Home Specialist',
  description: 'Becky Quinby is the founder and broker of Quinby Partners, with more than 15 years guiding buyers and sellers of historic homes across the Twin Cities.',
  schema: [{ '@type': 'Person', '@id': SITE + '/about/becky-quinby#person', name: 'Becky Quinby', jobTitle: 'Founder and Broker', worksFor: { '@id': SITE + '/#org' }, knowsAbout: ['Historic homes', 'Home restoration', 'Twin Cities real estate'] }],
  body: `<section class="section"><div class="wrap split">
<div class="side"><div class="card"><div class="ph"></div></div></div>
<div class="main prose">
<p class="eyebrow">Founder and broker</p><h1 style="margin-bottom:32px">Becky Quinby</h1>
<p>For more than 15 years, Becky has guided buyers and sellers through the Twin Cities' most storied neighborhoods. Her particular expertise is historic homes and urban living: the craftsmanship, character, and city-rooted lifestyle that make these properties singular, and the nuances of buying, preparing, and marketing them well.</p>
<p>Her perspective is hands-on. Becky has bought, renovated, and lived in homes spanning nearly a century of Minneapolis architecture, from a 1938 two-story in Kingfield to a 1916 Craftsman in East Harriet to the 1928 Cape Cod in Edina she is restoring today. She also owns and restores a portfolio of historic investment properties, including a Shenandoah Terrace fourplex and a Nokomis duplex. She knows which details carry a home's value and which improvements earn their return at sale.</p>
<p>Becky is also the founder of Onward, a platform that amplifies businesses who give back through their work and partners with nonprofits to generate more fundraising for the causes they serve. It's the same conviction behind Quinby Partners' giving model, extended to professionals across industries.</p>
<p>In 2027 she launches <a href="/doing-better">Doing Better</a>, a podcast featuring conversations with nonprofit leaders, purpose-driven professionals, and community partners about building work that does well and does good.</p>
<p>Becky lives in Edina with her wife, Gracie, and their four children, Millie, Alma, Fitz, and Arthur. Away from work, you'll find her at every kids' activity imaginable, on the golf course, or pursuing her newest passion, tennis.</p>
<p style="margin-top:36px"><a class="btn" href="/work-with-us">Meet with Becky</a></p>
</div></div></section>`,
});
page({
  path: '/about/elena-quinby', title: 'Elena Quinby | Realtor, Quinby Partners',
  description: 'Elena Quinby is a realtor with Quinby Partners whose background in film and advertising shapes how Quinby markets every home.',
  schema: [{ '@type': 'Person', '@id': SITE + '/about/elena-quinby#person', name: 'Elena Quinby', jobTitle: 'Realtor', worksFor: { '@id': SITE + '/#org' } }],
  body: `<section class="section"><div class="wrap split">
<div class="side"><div class="card"><div class="ph"></div></div></div>
<div class="main prose">
<p class="eyebrow">Realtor</p><h1 style="margin-bottom:32px">Elena Quinby</h1>
<p>Elena's appreciation for homes with character began early, growing up in Deephaven among the lake country's original cabins and cottages. She earned her degree in film and photography in Bozeman, Montana, then returned to Minneapolis to build a career in advertising, producing commercials for a wide range of brands.</p>
<p>Elena pairs a designer's eye with an advisor's judgment. She sees the potential in every space, understands how thoughtful changes reshape the way a home lives, and guides clients through one of life's most significant decisions with empathy, patience, and a steady hand.</p>
<p>Elena believes a home is defined by how it feels: its flow, its light, and its emotional pull. Her background in film and advertising gives sellers a distinct advantage, with marketing that tells a property's story as compellingly as it shows it. Buyers value her just as highly, for her clear communication, close attention to detail, and skill at the negotiating table.</p>
<p>Elena lives near Bryant Lake with her partner, Scott, their daughter, Maria, and two rescue dogs. In the off-season, they spend their time restoring their cabin in Wisconsin and traveling the world.</p>
<p style="margin-top:36px"><a class="btn" href="/work-with-us">Meet with Elena</a></p>
</div></div></section>`,
});

// Selling
const step = (n, t, b) => `<li><span class="num">${n}</span><span class="t">${t}</span><span class="b">${b}</span></li>`;
const principle = (n, t, b) => `<div class="principle"><p class="num">${n}</p><h3>${t}</h3><p>${b}</p></div>`;
const compare = (a, b, rows) => `<div class="table-wrap"><table class="compare"><thead><tr><th scope="col">${a}</th><th scope="col">${b}</th></tr></thead><tbody>${rows.map(([x, y]) => `<tr><td class="typ">${x}</td><td class="ours">${y}</td></tr>`).join('')}</tbody></table></div>`;

page({
  path: '/selling', title: 'Selling a Home with Character | How Quinby Partners Markets Your Home',
  description: 'Quinby Partners markets homes with character like works of art: the home’s story, editorial photography and film, and a multi-week campaign to find the passionate buyer.',
  body: `${hero('selling', 'a hand on an original newel post, then light across a parquet floor', { eyebrow: 'Selling with Quinby Partners', title: 'Your home is a work of art. We market it like one.', sub: 'We tell its story, your life in it and its history, and we look for the buyer who will love it as much as you have.' })}
${rollLine(HOME.sellingLine.first, HOME.sellingLine.phrases, 'What we do for sellers')}
<section class="section"><div class="wrap"><p class="eyebrow" style="margin-bottom:48px">How we think about selling</p>
<div class="grid">
${principle('I.', 'A piece of art, not a listing', 'We present your home the way a museum presents a work: carefully lit, carefully framed, with the details given room to be seen.')}
${principle('II.', 'Your home’s story, told well', 'We’re storytellers. Your life in the house and the house’s own history, from the people who built it to the way you’ve lived in it, are what set a home like yours apart, so they lead.')}
${principle('III.', 'Its next stewards, not just any buyer', 'An original home needs people who see what it is and will care for it. We go looking for them, through our readers, our neighborhoods, and the architects and builders we work with.')}
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">The process</p><h2 style="margin-bottom:52px">From story to closing</h2>
<ol class="steps">
${step('I.', 'Learn its story', 'We start with you: what drew you to the house, how you’ve lived in it, the rooms and moments you love. Then we add what we can learn of its history: when it was built, its style, who made it.')}
${step('II.', 'Prepare it with care', 'We help you decide which repairs matter and which original features to protect. Some updates add value; some erase the thing buyers are looking for.')}
${step('III.', 'Photograph and film it like an editorial', 'Styled, editorial photography and short films of the details, light and rooms, shaped by Elena\'s background in film and advertising.')}
${step('IV.', 'Tell the story', 'Your home’s story becomes a printed piece at every showing, a story on our site and in The Front Porch, and the thread through every post.')}
${step('V.', 'Run a campaign, not a launch', 'Several weeks of fresh angles: the reveal, the history, the details, the house through the seasons, the neighborhood around it.')}
${step('VI.', 'Find its next stewards', 'Our readers and followers, buyers looking for homes like yours, and the architects and design-builders we partner with, plus every agent through the MLS. We look for the people who will love it and care for it.')}
${step('VII.', 'Close, and give back', 'At closing, Quinby Partners gives $1,000 to a nonprofit you choose.')}
</ol></div></section>
${band('listing-film', 'sample listing film, 30–60 seconds')}
<section class="section"><div class="wrap"><p class="eyebrow">The difference</p><h2 style="margin-bottom:44px">A typical listing, and ours</h2>
${compare('Most listings', 'A Quinby Partners listing', [
  ['Photos on day one, the same for every house', 'An editorial shoot and short films of the details'],
  ['Bedrooms, baths and square footage', 'The home’s story: the life lived there and its history'],
  ['A one-week launch, then waiting', 'A multi-week campaign with a new angle each week'],
  ['As many buyers as possible', 'Its next stewards: the people who will love it and care for it most'],
  ['Original features listed as “dated”', 'Original features presented as what they are: craftsmanship'],
])}</div></section>
<section class="section paper"><div class="wrap"><blockquote class="pull"><p>“[A seller's words about how their home was presented and who bought it.]”</p><footer>[Seller name, neighborhood]</footer></blockquote></div></section>
<section class="section"><div class="wrap split">
<div class="main"><h2>Tell us about your home.</h2><p style="margin-top:20px">Whether you're selling this season or years from now, we'd love to see it, hear its story, and talk through what it's worth and who its next stewards might be.</p>
<p><a class="link" href="/homes-with-character">Selling a home with character: what's different</a></p></div>
<div class="side">${consultForm('seller-consult')}</div>
</div></section>`,
  faqs: [
    ['How is selling an original or architectural home different?', 'There are few true comparables, so value lives in the details and in the story. It takes knowing which features to protect, which updates pay back, how to tell the home’s story (the life lived there and the history of the house), and how long it may take to find its next stewards.'],
    ['How does Quinby Partners market a home?', `With the home’s story, editorial photography and short films, and a multi-week campaign through ${PUBS}, social media and the MLS.`],
  ],
});

// Buying
page({
  path: '/buying', title: 'Buying a Home with Character | Quinby Partners',
  description: 'Buy a home with character with confidence. Search by photo for the details you love, and understand the real costs before you offer. Historic, mid-century and architect-designed homes.',
  body: `${hero('buying', 'a front door opening onto a sunlit entry hall', { eyebrow: 'Buying with Quinby Partners', title: 'Find the home you’ll love for its details.', sub: 'We help you find a home with character, see it clearly, and buy it with confidence, whether it was built in 1905, 1955 or last year.' })}
${rollLine(HOME.buyingLine.first, HOME.buyingLine.phrases, 'What we help buyers find')}
<section class="section"><div class="wrap"><p class="eyebrow" style="margin-bottom:48px">How we think about buying</p>
<div class="grid">
${principle('I.', 'We see what makes a home special', 'Original woodwork, a butler’s pantry, a mid-century window wall. We know which details are rare, which carry value, and which are worth protecting.')}
${principle('II.', 'We see what it will take', 'Older and architect-designed homes come with their own questions: systems, inspections, insurance, restoration costs and historic district rules. We help you walk in knowing the real picture.')}
${principle('III.', 'We hear about homes early', 'Through our newsletter, our neighborhoods and the architects and builders we work with, we often know owners who are thinking about selling.')}
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">The process</p><h2 style="margin-bottom:52px">From first showing to closing</h2>
<ol class="steps">
${step('I.', 'Start with what you love', 'Styles, eras, details and neighborhoods. Save photos of homes, rooms and details you love, and our photo search finds homes on the market that match them.')}
${step('II.', 'Hear about homes early', 'Owners we know through our newsletter, our neighborhoods and our architect and builder partners, plus everything on the MLS.')}
${step('III.', 'Tour with an expert eye', 'We point out what’s original, what’s been changed, and what each detail means for value and upkeep.')}
${step('IV.', 'Know the real costs', 'Inspectors who specialize in older homes, realistic restoration budgets, insurance questions and any historic district rules, before you write an offer.')}
${step('V.', 'Write a strong offer', 'Clear pricing advice for homes with few true comparables, and steady negotiation at the table.')}
${step('VI.', 'Become its next steward', 'Introductions to architects, design-builders and tradespeople who know homes like yours, so you can care for it well for years to come.')}
${step('VII.', 'Close, and give back', 'At closing, Quinby Partners gives $1,000 to a nonprofit you choose.')}
</ol></div></section>
<section class="section paper" aria-labelledby="photo-search-h"><div class="wrap split" style="align-items:center">
<div class="main"><p class="eyebrow">Search by photo</p>
<h2 id="photo-search-h">Search for the details you love, not just the numbers.</h2>
<p style="margin-top:22px;max-width:620px">Most searches stop at filters: price, bedrooms, square footage. Character doesn’t fit in a checkbox. Our buyers can search by image instead: a staircase, a kitchen, a window wall, a front porch. Save the photos that speak to you, and we’ll find homes on the market with the same feel.</p>
<p style="max-width:620px">It also becomes a living inspiration board for your search, and later for your renovations and design projects once you’ve moved in.</p>
<p style="margin-top:28px"><a class="link" href="#buyer-consult-h">Start a photo search with us</a></p></div>
<div class="side"><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
${['A staircase', 'A kitchen', 'A window wall', 'A front porch'].map((t) => `<div class="card"><div class="ph" style="aspect-ratio:1/1"><span class="caps">${t}</span></div></div>`).join('')}
</div></div>
</div></section>
${band('buying-walk', 'walking through a home, pointing out details')}
<section class="section"><div class="wrap"><p class="eyebrow">The difference</p><h2 style="margin-bottom:44px">A typical search, and ours</h2>
${compare('A typical search', 'Searching with Quinby Partners', [
  ['Filters for price, beds and square feet', 'Search by photo: find homes that match the details you love'],
  ['Only what’s already on the market', 'Owners we know, as well as everything listed'],
  ['A general home inspection', 'Specialists for older and architect-designed homes'],
  ['Original features called “dated”', 'Original features explained: what’s rare, what to keep, what it costs'],
  ['Keys at closing, and that’s it', 'Introductions to the people who can care for it, and a gift to a cause you choose'],
])}</div></section>
<section class="section paper"><div class="wrap"><blockquote class="pull"><p>“[A buyer's words about finding their home with us.]”</p><footer>[Buyer name, neighborhood]</footer></blockquote></div></section>
<section class="section"><div class="wrap split">
<div class="main"><h2 id="buyer-consult-h">Tell us what you're looking for.</h2><p style="margin-top:20px">A style, a neighborhood, a feeling you get walking through the door. Whether you're buying this season or just starting to look, we'd love to help you find it.</p>
<p><a class="link" href="/homes-with-character">Buying a home with character: what's different</a></p></div>
<div class="side">${consultForm('buyer-consult')}</div>
</div></section>`,
  faqs: [
    ['What should I know before buying an older home?', 'Plan for specialist inspections (sewer, wiring, roof, foundation, plaster), realistic upkeep and restoration budgets, insurance questions, and any historic district rules that limit exterior changes.'],
    ['Can I search for homes by photo?', 'Yes. Quinby Partners buyers can search by image: save photos of homes, rooms or details you love, and the search finds homes on the market with similar features, alongside the usual filters.'],
    ['Does Quinby Partners help with homes that aren’t historic?', 'Yes. We help buyers find homes with character of every era, from Craftsman bungalows to mid-century moderns to new architect-designed homes, at every price point.'],
  ],
});

// Work with us: pick a path, the copy and the form's tags follow
const PATHS = [
  ['selling', 'I’m selling', 'form: seller consult', 'Your home is a work of art.', 'We start with a walk through the house and your story in it. Then a plan: what to protect, what to fix, what it’s worth, and how we’ll find its next stewards.', [['A conversation', 'Your home, your timing, and what matters most to you.'], ['A walk-through', 'What’s original, what to protect, which updates pay back.'], ['A plan', 'Pricing, preparation, photography, film and a campaign built for your home.']], 'Tell us about your home, the neighborhood, and your timing.'],
  ['buying', 'I’m buying', 'form: buyer consult', 'Find the home you’ll love for its details.', 'Tell us what you’re drawn to. We’ll help you see what’s original, what’s been changed, and what a home will need, and we know many owners before they list.', [['A conversation', 'What you love, where you want to be, and your budget.'], ['A search', 'Homes on the market, and homes that aren’t yet.'], ['An expert eye', 'Every showing, every inspection, the real costs up front.']], 'What are you looking for? Styles, neighborhoods, timing.'],
  ['both', 'Both', 'form: seller consult, form: buyer consult', 'Selling one home, finding the next.', 'We plan the two together, so the timing, the money and the move fit, and neither home gets less care.', [['A conversation', 'Both homes, your timing, and what has to happen first.'], ['A sequence', 'Sell first, buy first, or both at once: the trade-offs, plainly.'], ['One team', 'The same people on both sides of your move.']], 'Tell us about the home you have and the one you want.'],
  ['exploring', 'Just exploring', 'form: consult', 'Questions are a fine place to start.', 'What’s my home worth? Is this the right time? What would it take to buy in Kenwood or Golden Valley? Ask us anything. There’s no cost and no obligation.', [['A conversation', 'Honest answers, even if they aren’t what you hoped.'], ['A point of view', 'The market in your neighborhood, right now.'], ['No pressure', 'We’ll be here when you’re ready.']], 'What’s on your mind?'],
];
page({
  path: '/work-with-us', title: 'Work With Us | Quinby Partners',
  description: 'Start a conversation with Quinby Partners about selling, buying or simply exploring a home with character in the Twin Cities. No cost and no obligation.',
  body: `${hero('work', 'a front door opening onto a sunlit entry hall', { eyebrow: 'Work with us', title: 'Let’s talk about your home, or the one you’re looking for.', sub: 'Every client works directly with Becky and Elena, from the first conversation to the day you get the keys.', short: true })}
<section class="section" aria-labelledby="path-h"><div class="wrap">
<p class="eyebrow">Where are you starting?</p><h2 id="path-h">Choose your path.</h2>
<div class="paths" role="tablist" aria-label="Where are you starting?">
${PATHS.map(([id, label], i) => `<button class="path-tab" role="tab" id="tab-${id}" aria-controls="path-panel" aria-selected="${i === 0}" data-path="${id}"><span class="n">${['I.', 'II.', 'III.', 'IV.'][i]}</span>${label}</button>`).join('')}
</div>
<div class="path-panel" id="path-panel" role="tabpanel" aria-labelledby="tab-${PATHS[0][0]}">
<div class="path-copy">
${PATHS.map(([id, , , h, p, steps], i) => `<div class="path-body" data-path="${id}"${i ? ' hidden' : ''}>
<h3>${h}</h3><p class="lede">${p}</p>
<ol class="mini-steps">${steps.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ol>
</div>`).join('')}
</div>
<div class="path-form" data-paths='${esc(JSON.stringify(Object.fromEntries(PATHS.map(([id, label, tags, , , , ph]) => [id, { tags, source: 'Work with us: ' + label, ph }]))))}'>
${leadForm({ tags: PATHS[0][2], source: 'Work with us: I’m selling', fields: ['name', 'email', 'phone', 'timeline', 'message'], button: 'Start the conversation' })}
<p class="small" style="margin-top:18px">Or call or text <a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a>, or email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
</div>
</div></div></section>
${band('work-detail', 'hands on original woodwork; a key turning in an old lock')}
<section class="section white"><div class="wrap">
<p class="eyebrow">Working together</p><h2 style="margin-bottom:52px">What it’s like with us</h2>
<div class="grid">
${principle('I.', 'The people on the door', 'You work with Becky and Elena directly, not a hand-off. Fewer clients means more attention for yours.')}
${principle('II.', 'Honest, always', 'Candid advice on price, condition and timing, even when it isn’t what you hoped to hear.')}
${principle('III.', 'Care for the home, too', 'We know older and original homes from the inside, and we treat every one, of any age, as something worth caring for.')}
</div></div></section>
${(() => { const f = TESTIMONIALS.find((t) => t.featured) || TESTIMONIALS[0]; return f ? `<section class="section tight"><div class="wrap narrow"><blockquote class="pull"><p>${quote(f)}</p><footer>${metaLine(f.name, f.detail)}</footer></blockquote></div></section>` : ''; })()}
<section class="section paper"><div class="wrap split" style="align-items:center">
<div class="main"><p class="eyebrow">And at every closing</p><h2>$1,000 to a nonprofit you choose.</h2><p style="margin-top:18px;max-width:560px">From our side of the transaction, never added to your costs. Your move becomes a gift to a cause you care about.</p><p style="margin-top:22px"><a class="link" href="/giving">See every gift</a></p></div>
<div class="side"><div class="stat"><p class="big">${STATS.given}</p><p class="cap">Given so far</p></div></div>
</div></section>
<section class="section"><div class="wrap grid">
<a class="card" href="/about/becky-quinby"><div class="ph"></div><p class="name">Becky Quinby</p><p class="meta">Founder and broker</p></a>
<a class="card" href="/about/elena-quinby"><div class="ph"></div><p class="name">Elena Quinby</p><p class="meta">Realtor</p></a>
</div></section>`,
  faqs: [
    ['Is there a cost to talk with Quinby Partners?', 'No. A first conversation is free, with no obligation. We’ll talk about your home or your search, your timing, and what we’d recommend.'],
    ['What happens after I reach out?', 'A member of our team will be in touch within one business day to set up a conversation, by phone, over coffee, or at your home.'],
    ['Can you help if my home isn’t historic?', 'Yes. We specialize in homes with character, but we represent buyers and sellers of every kind of home and price point, with the same care.'],
  ],
});

// Contact
page({
  path: '/contact', title: 'Contact Quinby Partners', description: `Contact Quinby Partners: call ${PHONE} or email ${EMAIL}.`, bandsOn: false,
  body: `<section class="section"><div class="wrap split">
<div class="main"><p class="eyebrow">Contact</p><h1>Let's connect.</h1>
<p style="margin-top:24px;max-width:560px">Whether you're buying, selling, or simply considering your options, we'd love to talk. Share a few details and a member of our team will be in touch within one business day.</p>
${consultForm('contact')}</div>
<div class="side"><p class="eyebrow">Quinby Partners</p><p>${ADDRESS.join('<br>')}</p><p><a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a><br><a href="mailto:${EMAIL}">${EMAIL}</a></p></div>
</div></section>`,
});

// Giving
page({
  path: '/giving', title: 'Giving | $1,000 to a Nonprofit You Choose at Every Closing',
  description: 'At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses. See every gift and the causes we celebrate.',
  body: `${hero('giving', 'keys handed over on a front porch', { eyebrow: 'Giving', title: 'Every home we sell gives back.', sub: 'At every closing, Quinby Partners gives $1,000 to a nonprofit you choose. Your move becomes a lasting investment in the community you call home.', short: true })}
<section class="section tight"><div class="wrap grid">
<div class="stat"><p class="big">${STATS.given}</p><p class="cap">Given so far</p></div>
<div class="stat"><p class="big">${STATS.closings}</p><p class="cap">Closings that gave back</p></div>
<div class="stat"><p class="big">${STATS.nonprofits}</p><p class="cap">Nonprofits supported</p></div>
</div></section>
<section class="section tight"><div class="wrap"><p class="eyebrow" style="margin-bottom:40px">How it works</p><div class="grid">
${principle('I.', 'You choose the cause', 'Any nonprofit that matters to you. If you are undecided, we suggest three to choose from.')}
${principle('II.', 'We give at closing', 'Quinby Partners gives $1,000 on your behalf, from our side of the transaction, never added to your costs.')}
${principle('III.', 'We share it, with your okay', 'The gift joins the record below, so your move is part of something bigger.')}
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">The record</p><h2 style="margin-bottom:44px">Every gift, every closing</h2>
<div class="table-wrap"><table class="compare"><thead><tr><th scope="col">Closed</th><th scope="col">Nonprofit</th><th scope="col">Cause</th><th scope="col">Home in</th><th scope="col" style="text-align:right">Gift</th></tr></thead><tbody>
${GIFTS.map((g) => `<tr><td class="typ">${esc(g.month)}</td><td class="ours">${esc(g.nonprofit)}</td><td>${esc(g.cause)}</td><td>${esc(g.neighborhood)}</td><td class="num">$${(Number(g.amount) || 0).toLocaleString('en-US')}</td></tr>`).join('')}
</tbody></table></div>
<p class="small" style="margin-top:22px">Shared with each client's permission. We never list names or addresses.</p></div></section>
<section class="section"><div class="wrap split" style="align-items:center">
<div class="main"><p class="eyebrow">Causes we celebrate</p><p class="lede">Beyond every closing, we champion local organizations that protect history, conservation and the arts: the places that make these neighborhoods what they are.</p></div>
<div class="side principle"><h3>Onward Impact Partner</h3><p>Our giving is shared through Onward, the platform that connects businesses who give back with the nonprofits they support.</p></div>
</div></section>`,
  faqs: [
    ['How does the Quinby Partners giving program work?', 'At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses, from Quinby’s side of the transaction and never added to the client’s costs.'],
    ['Can I choose any nonprofit?', 'Yes. If you are undecided, we suggest three to choose from.'],
  ],
});

// Architecture & Design hub
const cat = (id, t, b) => `<section id="${id}" class="principle" style="scroll-margin-top:24px"><h3>${t}</h3><p>${b}</p></section>`;
page({
  path: '/architecture-design', title: 'Architecture & Design | Historic, Mid-Century, Contemporary & Architect-Designed Homes',
  description: 'Quinby Partners specializes in homes with a point of view: historic, mid-century modern, contemporary, architect-designed and original homes across the Twin Cities.',
  body: `${hero('architecture-hub', 'details across eras: plaster, teak, glass', { eyebrow: 'Architecture & Design', title: 'Homes with a point of view, from 1905 to last year.', sub: 'It’s the architecture and character that make a home singular, not its age or its price.', short: true })}
<section class="section"><div class="wrap grid">
${cat('historic', 'Historic', 'Prewar homes that are strong examples of their style: Tudor Revival, Craftsman, Prairie School, Colonial Revival and Victorian homes, with the woodwork, plaster and leaded glass that make them singular.')}
${cat('modern', 'Mid-century & Modern', 'Homes from the 1940s to the 1970s and the modern homes that followed: open plans, window walls, natural materials and a close connection to the landscape. Golden Valley and Edina hold some of the region’s best.')}
${cat('contemporary', 'Contemporary', 'New homes with real design ambition: architect-led, carefully detailed and built to last.')}
${cat('architect-designed', 'Architect-designed', 'Homes from any era with a named architect behind them, and a design worth understanding before you buy or sell.')}
${cat('art-lovers', 'Homes for art lovers', 'Gallery walls, good natural light, studios, ceiling height and room to live with a collection.')}
${cat('craftsmanship', 'Original craftsmanship', 'Built-ins, tile, stained glass, a butler’s pantry, a hidden staircase: the details you won’t find twice.')}
</div></section>
${ctaBand('Buying or selling a home like this?', 'Pricing, preparing, marketing and inspecting these homes all work differently.', '/homes-with-character', 'How it’s different')}`,
  faqs: [
    ['Why is Quinby Partners the best at selling homes with original features?', 'Because we know these homes from the inside. Becky has bought, renovated and lived in homes across nearly a century of design, and we’ve sold homes with character across the Twin Cities since 2012. We know which original features carry value and how to protect them through a sale, we tell each home’s story (the life lived there and the history of the house), and we find the buyers who will care for it.'],
    ['Do I need a historic home to work with Quinby Partners?', 'No. We specialize in homes with character of every era, including mid-century, contemporary and architect-designed homes, and we work with every kind of home and price point.'],
    ['Do I need a lot of money to buy an old home?', 'No. Homes with character come at every price, from Craftsman bungalows and lofts in historic buildings to grand estates. What matters more is going in with clear eyes: we help you understand what’s original, what’s been updated, and what an older home may need over time, so you can buy with confidence at your budget.'],
    ['What if I want a newer home? Can Quinby Partners still help?', 'Yes! We may specialize in the nuances of historic homes, original features and defining architecture, but that only makes us better at representing clients across the spectrum. If you want an exceptional agent who will care for you deeply the minute you come into our world, Quinby Partners is the right fit.'],
  ],
});

// Homes with character guide
page({
  path: '/homes-with-character', title: 'Buying & Selling Homes with Character: One-of-a-Kind, Architectural and Historic Homes in the Twin Cities',
  description: 'What makes buying or selling a unique, architect-designed, mid-century or historic home different: pricing, preparation, marketing, inspections and costs.',
  body: `<section class="section"><div class="wrap split">
<div class="side"><p class="eyebrow">A guide</p><hr class="rule"></div>
<div class="main prose">
<h1 style="font-size:clamp(40px,5vw,64px)">Buying and selling homes with character</h1>
<p class="lede" style="margin-top:28px">Original homes don’t sell like other homes. Whether it was built in 1910, 1960 or last year, a house with real design and craftsmanship needs a different approach. Here’s what’s different, and how we help.</p>
<h2>What we mean by a home with character</h2>
<ul>
<li><strong>Architect-designed:</strong> homes from any era with a clear design vision behind them.</li>
<li><strong>Unique and one of a kind:</strong> a remarkable layout, an unexpected room, a setting or a detail you won’t find twice.</li>
<li><strong>Craftsmanship:</strong> woodwork, built-ins, tile, stone, glass and materials chosen with care.</li>
<li><strong>Modern and mid-century:</strong> window walls, open plans and a close connection to the landscape.</li>
<li><strong>Historic:</strong> older homes that are strong examples of their style.</li>
<li><strong>Homes for art lovers:</strong> light, wall space, ceiling height and room to live with a collection.</li>
</ul>
<p>It’s the design and character that make a home singular, not its age or its price.</p>
<h2>Selling one is different</h2>
<ul>
<li><strong>Pricing:</strong> an original home has few true comparables, so value lives in the details. It takes knowing which features carry value, and how to show buyers why.</li>
<li><strong>Preparing:</strong> some updates add value; others erase exactly what makes the home special. We help you decide what to fix, what to protect and how to present it.</li>
<li><strong>Marketing:</strong> the home’s story, editorial photography and film, and a multi-week campaign instead of a one-week launch. <a href="/selling">How we market your home.</a></li>
<li><strong>Its next stewards:</strong> an original home isn’t for everyone, and that’s the point. We look for the people who will love it and care for it, rather than cutting the price to reach everyone.</li>
<li><strong>Disclosures:</strong> including lead-based paint disclosure for homes built before 1978, and any rules that apply to the property.</li>
</ul>
<h2>Buying one is different</h2>
<ul>
<li><strong>Finding it:</strong> character doesn’t show up in a search filter. Our buyers can search by photo for the details they love. <a href="/buying">Buying with us.</a></li>
<li><strong>Seeing it clearly:</strong> what’s original, what’s been changed, which details are rare and what each means for value and upkeep.</li>
<li><strong>Inspections and costs:</strong> specialists for unusual construction, materials and systems, and realistic budgets for care and improvements. Older homes may need a sewer scope, wiring, plaster or roof review, and some neighborhoods have rules on exterior changes.</li>
<li><strong>Your team:</strong> introductions to architects, designers and builders who know homes like yours.</li>
</ul>
<h2>How we work with these homes</h2>
<p>Becky has bought, renovated and lived in homes across nearly a century of design, and Elena’s background in film and advertising shapes how we show every home.${PUB_LIVE ? ` Our publication, <a href="${PUB_PATH}">${esc(PUB)}</a>, reaches buyers who care about design and craftsmanship.` : ' Our newsletter reaches buyers who care about design and craftsmanship.'} And at every closing, we give $1,000 to a nonprofit you choose.</p>
</div></div></section>
${ctaBand('Let’s talk about your home.', null, '/work-with-us', 'Work with us')}`,
  faqs: [
    ['How do you price a one-of-a-kind home?', 'One-of-a-kind homes have few true comparables, so pricing depends on the details: the design, materials and craftsmanship, the condition of the home and its systems, and how it compares with the few homes like it. We price from that knowledge rather than square footage alone.'],
    ['What makes a home architecturally significant?', 'A clear design vision, often from a named architect, carried through in the layout, materials and details. It can be a home from any era, including mid-century and contemporary homes.'],
    ['How do you find buyers for unique homes?', `With the home’s story, editorial photography and film, and a multi-week campaign through ${PUBS}, social media, design partners and the MLS, aimed at the buyers who will value what makes it different.`],
    ['Should I update my home before selling?', 'Sometimes. Some updates add value; others remove the features buyers of homes with character are looking for. We help you decide what to fix and what to protect.'],
  ],
});

// The Collection
page({
  path: '/the-collection', title: 'The Collection | Quinby Partners Listings & Recent Sales',
  description: 'The Collection: historic, architect-designed and original homes represented by Quinby Partners, each with its own story.',
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">Our listings &amp; recent sales</p><h1>The Collection</h1>
<p class="lede" style="max-width:820px;margin-top:24px">The homes we’ve been trusted with. Each one comes with its own story: the people who lived there and the history of the house.</p>
</div></section>
<section class="feature" aria-label="Newest in the collection">
${featureImg(COLLECTION[0] && COLLECTION[0].photo, 'Photo · newest home in the collection')}
<div class="wrap feature-cap">
<p class="eyebrow">No. 01 · Newest</p>
<h2>${COLLECTION[0] ? `<a href="${homeHref(COLLECTION[0])}" style="text-decoration:none">${esc(COLLECTION[0].name)}</a>` : ''}</h2>
<p class="meta caps">${COLLECTION[0] ? metaLine(COLLECTION[0].neighborhood, COLLECTION[0].style, COLLECTION[0].status) : ''}</p>
${COLLECTION[0] ? `<p><a class="link" href="${homeHref(COLLECTION[0])}">See the home</a></p>` : ''}
</div></section>
<section class="section"><div class="wrap">
<div class="grid">
${COLLECTION.slice(1).map((h, i) => homeCard(h, i + 1)).join('\n')}
</div></div></section>
${ctaBand('Should your home be in the collection?', 'We’d love to see it, hear its story, and help find its next stewards: the people who will love it and care for it as much as you have.', '/selling', 'How we market your home')}`,
});

// Publication (built only once it launches)
if (PUB_LIVE) page({
  path: PUB_PATH, title: `${PUB} | Remarkable Homes of the Twin Cities`,
  description: 'Stories of the Twin Cities’ most remarkable homes, their architecture, their makers and the people who care for them, from Quinby Partners.',
  bandsOn: false,
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">A publication from Quinby Partners</p><h1>${esc(PUB)}</h1>
<p class="lede" style="max-width:820px;margin-top:24px">Stories of the Twin Cities’ most remarkable homes: their architecture, their makers and the people who care for them. Most aren’t for sale.</p>
</div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">This month’s feature</p>
<div class="split" style="margin-top:24px"><div class="main"><div class="card"><div class="ph wide">${photo(PUBLICATION.feature.photo, PUBLICATION.feature.name, '')}</div></div></div>
<div class="side"><h2><a href="${featureHref()}" style="text-decoration:none">${esc(PUBLICATION.feature.name)}</a></h2><p class="meta caps" style="color:var(--muted);margin-top:12px">${metaLine(PUBLICATION.feature.neighborhood, PUBLICATION.feature.year, PUBLICATION.feature.style)}</p><p style="margin-top:18px">${esc(PUBLICATION.feature.line)}</p><p><a class="link" href="${featureHref()}">Read the feature</a></p></div></div></div></section>
<section class="section"><div class="wrap"><p class="eyebrow">The Register</p><h2 style="margin-bottom:16px">Notable homes, one at a time</h2>
<p style="max-width:640px;margin-bottom:44px">A running catalog of remarkable homes across the Twin Cities: one great photo, the essentials, and a few lines of story.</p>
<div class="grid">${(PUBLICATION.register || []).map((r) => regCard(r)).join('')}</div></div></section>
${ctaBand('Know a home that belongs here?', 'We feature homes with their owners’ permission, and never share addresses.', '/contact', 'Nominate a home')}`,
});

// Doing Better
page({
  path: '/doing-better', title: 'Doing Better | A Podcast with Becky Quinby',
  description: 'Doing Better, coming in 2027, is Becky Quinby’s podcast with nonprofit leaders, purpose-driven professionals and community partners about building work that does well and does good.',
  bandsOn: false,
  body: `<section class="section pine"><div class="wrap db-grid solo">
${dbSoon('page')}
</div></section>`,
});

// Neighborhoods hub
page({
  path: '/neighborhoods', title: 'Neighborhoods | Historic & Architectural Homes in Minneapolis, St. Paul, Edina & Golden Valley',
  description: 'The Twin Cities neighborhoods Quinby Partners knows best, from South Minneapolis and the lakes to St. Paul, Edina and Golden Valley.',
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">Neighborhoods</p><h1 style="max-width:900px">Homes with character are everywhere in the Twin Cities.</h1>
</div></section>
${AREAS.map((a, i) => `<section class="section ${i % 2 ? '' : 'white'} tight"><div class="wrap split">
<div class="side"><h2><a href="/neighborhoods/${a.slug}" style="text-decoration:none">${a.name}</a></h2><p style="margin-top:16px">${a.lede}</p><p><a class="link" href="/neighborhoods/${a.slug}">Explore ${a.name}</a></p></div>
<div class="main"><ul class="rows">${a.hoods.map(([n, href]) => href ? `<li><a href="${href}"><span class="n">${n}</span><span class="m">Neighborhood guide</span></a></li>` : `<li><div class="row"><span class="n" style="font-size:22px">${n}</span></div></li>`).join('')}</ul></div>
</div></section>`).join('\n')}`,
});

// Area pages
for (const a of AREAS) {
  page({
    path: `/neighborhoods/${a.slug}`, title: `${a.name} Historic & Architectural Homes | Quinby Partners`,
    description: `${a.lede.split('. ')[0]}. Quinby Partners helps buyers and sellers of homes with character in ${a.name}.`,
    body: `${hero('area-' + a.slug, a.name + ': streets, parks and homes', { eyebrow: 'Neighborhoods', title: a.name, sub: a.lede, short: true })}
<section class="section"><div class="wrap"><ul class="rows">
${a.hoods.map(([n, href, line]) => href ? `<li><a href="${href}"><span class="n">${n}</span><span class="m">Neighborhood guide</span><p>${line}</p></a></li>` : `<li><div class="row"><span class="n">${n}</span><p>${line}</p></div></li>`).join('\n')}
</ul></div></section>
${ctaBand(`Buying or selling in ${a.name}?`, null, '/work-with-us', 'Work with us')}`,
    faqs: [[`Does Quinby Partners work in ${a.name}?`, `Yes. Quinby Partners helps buyers and sellers of historic, architect-designed and original homes throughout ${a.name}, including ${a.hoods.map((h) => h[0]).filter((n) => !n.startsWith('Mid-') && !n.startsWith('Around')).join(', ')}.`]],
  });
}

// Full neighborhood pages
for (const h of HOODS) {
  const area = AREAS.find((a) => a.slug === h.area);
  page({
    path: `/neighborhoods/${h.slug}`, title: `${h.name} Homes & Real Estate | ${h.city} | Quinby Partners`,
    description: h.summary,
    schema: [{ '@type': 'Place', name: `${h.name}, ${h.city}, MN`, description: h.summary }],
    body: `${hero(h.video, h.clip, { eyebrow: `Neighborhoods · ${h.city}`, title: h.name, short: true, still: h.photo })}
<section class="section"><div class="wrap split">
<div class="side"><p class="eyebrow">The neighborhood</p><hr class="rule"><p class="small">Part of <a href="/neighborhoods/${area.slug}">${area.name}</a></p></div>
<div class="main prose"><p class="lede">${h.summary}</p><h2>The architecture</h2><p>${h.architecture}</p><h2>The setting</h2><p>${h.setting}</p></div>
</div></section>
${band(h.video + '-2', h.clip)}
${ctaBand(`Own a home in ${h.name}?`, 'We’d love to hear its story and help find its next stewards, whether you’re selling now or someday.', '/selling', 'How we market your home')}`,
    faqs: [
      [`What kinds of homes are in ${h.name}?`, h.architecture.replace(/ \[.*?\]/g, '')],
      [`Who is a real estate agent for historic homes in ${h.name}?`, `Quinby Partners is an independent, woman-owned Twin Cities brokerage specializing in historic, architect-designed and original homes, including in ${h.name}.`],
    ],
  });
}

// ---------- home pages (The Collection) and the publication feature ----------
const paras = (t) => String(t || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const youtubeId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function storyPage(h, { pathPrefix, eyebrow, list, kind }) {
  const facts = [['Built', h.year], ['Style', h.style], ['Architect', h.architect], ['Neighborhood', h.neighborhood], ['Status', h.status], ['Details', h.details], ['Offered at', h.status === 'For sale' || h.status === 'Coming soon' ? h.price : '']].filter(([, v]) => v && String(v).trim());
  const hoodPage = HOODS.find((n) => n.name.toLowerCase() === String(h.neighborhood || '').toLowerCase());
  const factHtml = facts.map(([k, v]) => `<div><dt class="eyebrow" style="margin:0">${k}</dt><dd style="margin:6px 0 0;font-family:var(--serif);font-size:22px">${k === 'Neighborhood' && hoodPage ? `<a href="/neighborhoods/${hoodPage.slug}">${esc(v)}</a>` : esc(v)}</dd></div>`).join('');
  const ps = paras(h.story);
  const vid = youtubeId(h.video);
  const gallery = (h.gallery || []).filter((g) => g.photo || g.caption);
  const others = list.filter((x) => x !== h).slice(0, 2);
  const forSale = h.status === 'For sale' || h.status === 'Coming soon';
  const giving = kind === 'collection'
    ? `When this home changes hands with us, Quinby Partners gives $1,000 to a nonprofit the owners choose.`
    : `At every closing, Quinby Partners gives $1,000 to a nonprofit our clients choose.`;
  page({
    path: `${pathPrefix}/${h.slug}`,
    title: `${h.name} | ${metaLine(h.neighborhood, h.style).replace(/&amp;/g, '&')} | Quinby Partners`,
    description: (h.tagline || h.line || ps[0] || `${h.name}, ${h.neighborhood}`).replace(/\[|\]/g, '').slice(0, 155),
    schema: [{ '@type': kind === 'collection' ? 'SingleFamilyResidence' : 'Article', name: h.name, ...(kind === 'collection' ? { address: { '@type': 'PostalAddress', addressLocality: h.neighborhood, addressRegion: 'MN' } } : { headline: h.name, publisher: { '@id': SITE + '/#org' } }) }],
    body: `<section class="section tight center"><div class="wrap">
<p class="eyebrow">${eyebrow}</p>
<h1 style="max-width:980px;margin:0 auto">${esc(h.name)}</h1>
${(h.tagline || h.line) ? `<p class="lede" style="font-style:italic;color:var(--pine);max-width:680px;margin:26px auto 0">${esc(h.tagline || h.line)}</p>` : ''}
</div></section>
<div class="wrap" style="padding-bottom:0">${featureImg(h.photo, 'Photo or b-roll · the home\'s best view')}</div>
<section class="section"><div class="wrap split">
<aside class="side" aria-label="About this home"><div style="border-top:1px solid var(--brass);padding-top:26px"><dl style="margin:0;display:grid;gap:22px">${factHtml}</dl></div></aside>
<article class="main prose">${ps.map((p, i) => i === 0 ? `<p class="lede" style="font-size:clamp(22px,2.2vw,30px)">${esc(p)}</p>` : `<p>${esc(p)}</p>`).join('\n')}</article>
</div></section>
${vid ? `<section class="section tight"><div class="wrap"><div style="position:relative;aspect-ratio:16/9;background:var(--navy)"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="${esc(h.name)} film" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></div></section>` : ''}
${gallery.length ? `<section class="section tight"><div class="wrap grid">${gallery.map((g, i) => `<figure style="margin:0"><div class="card"><div class="ph">${photo(g.photo, g.caption, 'Photo')}</div></div><figcaption style="margin-top:14px;font-size:14px;color:var(--muted)"><span style="font-family:var(--serif);color:var(--brass-text)">${ROMAN[i] || i + 1}.</span> ${esc(g.caption)}</figcaption></figure>`).join('')}</div></section>` : ''}
${h.quote ? `<section class="section tight"><div class="wrap narrow"><blockquote class="pull"><p>${quote(h)}</p>${h.quoteBy ? `<footer>${esc(h.quoteBy)}</footer>` : ''}</blockquote></div></section>` : ''}
${h.credits ? `<section class="wrap"><p class="small">${esc(h.credits)}</p></section>` : ''}
<section class="section paper cta-band"><div class="wrap">
<div><p class="eyebrow">${kind === 'collection' ? 'This home\'s giving' : 'Giving'}</p><p class="lede" style="max-width:720px">${giving}</p></div>
${forSale ? `<a class="btn" href="/contact">Request a showing</a>` : `<a class="btn" href="/selling">Finding stewards for your home?</a>`}
</div></section>
${others.length ? `<section class="section"><div class="wrap"><p class="eyebrow" style="margin-bottom:32px">${kind === 'collection' ? 'Continue through the collection' : 'More from ' + esc(PUB)}</p><div class="grid">${others.map((o) => `<a class="card" href="${pathPrefix}/${esc(o.slug)}"><div class="ph wide">${photo(o.photo, o.name, '')}</div><p class="name">${esc(o.name)}</p><p class="meta">${metaLine(o.neighborhood, o.year, o.style)}</p></a>`).join('')}</div></div></section>` : ''}`,
  });
}

COLLECTION.filter((h) => h.slug).forEach((h, i) => storyPage(h, { pathPrefix: '/the-collection', eyebrow: `The Collection · No. ${String(i + 1).padStart(2, '0')}`, list: COLLECTION, kind: 'collection' }));
if (PUB_LIVE && PUBLICATION.feature && PUBLICATION.feature.slug) storyPage(PUBLICATION.feature, { pathPrefix: PUB_PATH, eyebrow: `${esc(PUB)} · This month’s feature`, list: [], kind: 'publication' });

// ---------- the flip book: private, full-screen pages (not in the sitemap, hidden from search) ----------
const BOOK = load('book');
const BOOKS = load('books').books || [];

function bookPage(pg, i, { cover, locked } = {}) {
  const media = pg.photo ? `<img src="${esc(pg.photo)}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}">` : `<p class="label">${pg.clip ? 'B-roll · ' + esc(pg.clip) : ''}</p>`;
  const body = paras(pg.body).map((p) => `<p>${esc(p)}</p>`).join('');
  if (cover) return `<section class="bpage cover" aria-label="Cover"><div class="bmedia">${media}</div><div class="btext"><p class="eyebrow">${esc(pg.eyebrow)}</p><h1>${esc(pg.title)}</h1>${body}<p class="hint">Swipe or use the arrows to turn the page</p></div></section>`;
  const textOnly = !pg.photo && !pg.clip;
  return `<section class="bpage${locked ? ' locked' : ''}${textOnly ? ' text-only' : ''}" aria-label="${esc(pg.title)}">${textOnly ? '' : `<div class="bmedia">${media}</div>`}<div class="btext"><p class="eyebrow">${esc(pg.eyebrow)}</p><h2>${esc(pg.title)}</h2>${body}</div></section>`;
}

function bookEnd(tags, source) {
  return `<section class="bpage end locked-end" aria-label="Next steps"><div class="btext wide">
<div class="end-grid">
<div><p class="eyebrow">The printed edition</p><h2>Would you like a printed copy?</h2><p>We’ll deliver a printed edition of this book to your door.</p>
${leadForm({ tags: tags + ', book-request: printed copy', source: source + ' · printed copy', fields: ['name', 'email', 'phone', 'address'], button: 'Send me the printed edition', thanks: 'Thank you. Your printed copy is on its way.' })}</div>
<div><p class="eyebrow">A private conversation</p><h2>Talk with Becky</h2><p>Whether you’re selling this season or years from now, we’d love to see your home and hear its story.</p>
${leadForm({ tags: tags + ', book-request: consultation', source: source + ' · consultation', fields: ['name', 'email', 'phone', 'message'], button: 'Request a conversation' })}
<p class="small">Or call or text <a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a> · <a href="mailto:${EMAIL}">${EMAIL}</a></p></div>
</div></div></section>`;
}

function bookGate(tags, source) {
  return `<section class="bpage gate" aria-label="Keep reading"><div class="btext">
<p class="eyebrow">Keep reading</p><h2>The rest of the book is yours.</h2>
<p>Add your name and email to read on. We’ll only send things worth your time, like our monthly letter, The Front Porch.</p>
${leadForm({ tags, source, fields: ['name', 'email', 'phone'], button: 'Keep reading', thanks: 'Thank you. Turn the page.' })}
</div></section>`;
}

function bookShell({ path: p, title, pagesHtml, gated }) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} | Quinby Partners</title>
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="A short book from Quinby Partners.">
<meta property="og:site_name" content="Quinby Partners">
<link rel="icon" href="/assets/qp-monogram-gold.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300&family=Poppins:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="book-body">
<header class="book-top"><a class="brand" href="/"><img src="/assets/qp-monogram-gold.png" alt="" width="40" height="29"><span>Quinby Partners</span></a>
<span class="book-count" aria-live="polite"></span>
<button type="button" class="book-print">Save as PDF</button></header>
<main class="book-track" data-gated="${gated ? 'true' : 'false'}" tabindex="0" aria-label="${esc(title)}">
${pagesHtml}
</main>
<nav class="book-nav" aria-label="Pages"><button type="button" class="prev" aria-label="Previous page">←</button><div class="book-progress"><span></span></div><button type="button" class="next" aria-label="Next page">→</button></nav>
<script src="/main.js" defer></script>
</body>
</html>
`;
  pages.push({ path: p, title, description: '', html, noindex: true });
}

// The master book: gated after a few pages
(() => {
  const n = Math.max(1, Number(BOOK.gateAfter) || 3);
  const tags = 'book: master';
  const src = 'Book: How we sell homes like yours';
  const ps = BOOK.pages.map((pg, i) => i === 0 ? bookPage(pg, i, { cover: true }) : bookPage(pg, i, { locked: i >= n }));
  ps.splice(n, 0, bookGate(tags, src));
  ps.push(bookEnd(tags, src).replace('locked-end', 'locked'));
  bookShell({ path: '/book', title: BOOK.title, pagesHtml: ps.join('\n'), gated: true });
})();

// Personalized copies for specific homes: not gated, each at its own private address
for (const pb of BOOKS.filter((x) => x.slug)) {
  const tags = ['book: personalized', pb.tag].filter(Boolean).join(', ');
  const src = `Book for ${pb.homeName}`;
  const cover = bookPage({ eyebrow: pb.recipients ? `Prepared for ${pb.recipients}` : 'Prepared for you', title: pb.homeName, body: 'How Quinby Partners would present and sell this home.', photo: pb.coverPhoto || BOOK.pages[0].photo, clip: BOOK.pages[0].clip }, 0, { cover: true });
  const note = bookPage({ eyebrow: 'A note from Becky', title: `Dear ${pb.recipients || 'friends'},`, body: `${pb.note}\n\nBecky Quinby, Founder and Broker`, photo: '', clip: '' }, 1);
  const middle = BOOK.pages.slice(1, -1).map((pg, i) => bookPage(pg, i + 2));
  bookShell({ path: `/book/${pb.slug}`, title: `${pb.homeName} | How we would sell it`, pagesHtml: [cover, note, ...middle, bookEnd(tags, src).replace(' locked-end', '')].join('\n'), gated: false });
}

// 404
page({ path: '/404', title: 'Page not found | Quinby Partners', description: 'This page could not be found.', bandsOn: false, noindex: true,
  body: `<section class="section"><div class="wrap"><p class="eyebrow">Not found</p><h1>This page has moved, or never was.</h1><p style="margin-top:24px"><a class="link" href="/">Return home</a></p></div></section>` });

// ---------- write ----------
fs.rmSync(OUT, { recursive: true, force: true });
const write = (rel, data) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
for (const p of pages) write(p.path === '/' ? 'index.html' : p.path === '/404' ? '404.html' : p.path.slice(1) + '/index.html', p.html);
const copyDir = (from, to) => { if (!fs.existsSync(from)) return; for (const e of fs.readdirSync(from, { withFileTypes: true })) { const s = path.join(from, e.name), d = path.join(to, e.name); if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d); } else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); } } };
copyDir(path.join(__dirname, 'src', 'assets'), path.join(OUT, 'assets'));
copyDir(path.join(__dirname, 'src', 'video'), path.join(OUT, 'video'));
copyDir(path.join(__dirname, 'src', 'fonts'), path.join(OUT, 'fonts'));
copyDir(path.join(__dirname, 'src', 'media'), path.join(OUT, 'media'));
copyDir(path.join(__dirname, 'public'), OUT);
fs.copyFileSync(path.join(__dirname, 'src', 'styles.css'), path.join(OUT, 'styles.css'));
fs.copyFileSync(path.join(__dirname, 'src', 'main.js'), path.join(OUT, 'main.js'));

// sitemap.xml
const today = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => !p.noindex).map((p) => `<url><loc>${SITE}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);

// llms.txt: a plain-language map of the site for AI tools
const line = (p) => `- [${p.title}](${SITE}${p.path === '/' ? '/' : p.path}): ${p.description}`;
const group = (pre) => pages.filter((p) => !p.noindex && pre(p.path)).map(line).join('\n');
write('llms.txt', `# Quinby Partners

> Quinby Partners is an independent, woman-owned boutique real estate brokerage in the Twin Cities (Minneapolis, St. Paul, Edina and Golden Valley, Minnesota), founded by broker Becky Quinby. It specializes in historic, architecturally significant, mid-century, architect-designed, unique and original homes, and works with every kind of home and price point. Positioning: "We find passionate buyers for homes with character," and the next stewards who will love and care for them. At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses. Contact: ${PHONE}, ${EMAIL}.

## About
${group((p) => p === '/' || p === '/why-quinby-partners' || p.startsWith('/about') || p === '/giving')}

## Selling and buying
${group((p) => ['/selling', '/buying', '/work-with-us', '/homes-with-character'].includes(p))}

## Architecture and homes
${group((p) => ['/architecture-design', '/the-collection', PUB_PATH].includes(p))}

## Neighborhoods
${group((p) => p.startsWith('/neighborhoods'))}

## Optional
${group((p) => p === '/doing-better' || p === '/contact')}
`);

console.log(`Built ${pages.length} pages to ${OUT}`);
