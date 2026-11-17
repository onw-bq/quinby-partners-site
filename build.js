// Quinby Partners — static site build. No dependencies: `node build.js` writes the site to ./dist.
// Cloudflare Pages settings: build command `node build.js`, output directory `dist`.
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.quinbypartners.com';
const PUB = '[Publication name]';          // swap in the publication's name when chosen
const PUB_PATH = '/journal';               // the publication's address on the site
const PHONE = '612-232-3165';
const EMAIL = 'becky@quinbypartners.com';
const ADDRESS = ['1250 Wayzata Blvd E, Unit 1910', 'Wayzata, MN 55391'];
const BROKER_LICENSE = '40847796';

// B-roll clips: put files in src/video and list them here. Empty = the block shows its still colour and label.
// e.g. home: { src: '/video/staircase.mp4', small: '/video/staircase-small.mp4', poster: '/video/staircase.jpg' }
const VIDEO = {};

const OUT = path.join(__dirname, 'dist');
const pages = [];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- shared pieces ----------
const NAV = [
  ['Architecture & Design', '/architecture-design'],
  ['The Collection', '/the-collection'],
  [PUB, PUB_PATH],
  ['Neighborhoods', '/neighborhoods'],
  ['Giving', '/giving'],
  ['Why Quinby', '/why-quinby'],
];

function header(current) {
  const links = NAV.map(([t, h]) => `<a href="${h}"${current && (current === h || current.startsWith(h + '/')) ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('\n');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="/"><img src="/assets/qp-monogram-gold.png" alt="" width="46" height="33"><span>Quinby Partners</span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
<nav class="nav" id="site-nav" aria-label="Main">
${links}
<a class="contact" href="/contact"${current === '/contact' ? ' aria-current="page"' : ''}>Contact</a>
</nav>
</div></header>`;
}

function media(key, label, cls = 'band') {
  const v = VIDEO[key];
  const data = v ? ` data-video="${v.src}"${v.small ? ` data-video-small="${v.small}"` : ''}${v.poster ? ` data-poster="${v.poster}"` : ''}` : '';
  const poster = v && v.poster ? `<img class="poster" src="${v.poster}" alt="">` : '';
  return { open: `<div class="media ${cls}"${data}>${poster}<p class="label" aria-hidden="true">B-roll · ${esc(label)}</p>`, close: '</div>' };
}

function hero(key, label, { eyebrow, title, sub, short } = {}) {
  const m = media(key, label, 'hero' + (short ? ' short' : ''));
  return `${m.open}<div class="wrap">
${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${title}</h1>
${sub ? `<p class="sub">${sub}</p>` : ''}</div>${m.close}`;
}

function band(key, label) { const m = media(key, label); return m.open + m.close; }

function bands() {
  return `<section class="section white" aria-labelledby="pub-band">
<div class="wrap">
<div class="head-row"><div>
<p class="eyebrow">Our publication · Online</p>
<h2 id="pub-band">${esc(PUB)}</h2>
<p style="max-width:560px;margin-top:14px">Stories of the Twin Cities' most remarkable homes: their architecture, their makers and the people who care for them.</p>
</div><a class="link" href="${PUB_PATH}">Read the latest</a></div>
<div class="grid">
${['This month\'s feature', 'From the Register', 'From the Register'].map((t) => `<a class="card" href="${PUB_PATH}"><div class="ph wide"></div><p class="eyebrow" style="margin:0">${t}</p><p class="name">[Home name]</p><p class="meta">[Neighborhood] · [Year] · [Style]</p></a>`).join('\n')}
</div></div></section>
<section class="section pine tight" aria-labelledby="db-band">
<div class="wrap split" style="align-items:center">
<div class="side" style="flex:1 1 420px"><div class="media plain" style="aspect-ratio:16/9;background:var(--navy)"><p class="label">Latest episode · YouTube</p></div></div>
<div class="main" style="flex:1 1 420px">
<p class="eyebrow">The podcast</p>
<h2 id="db-band">Doing Better</h2>
<p style="margin-top:18px">Becky's conversations with nonprofit leaders, purpose-driven professionals and community partners about building work that does well and does good.</p>
<p style="margin-top:26px"><a class="link" href="/doing-better">Listen</a></p>
</div></div></section>`;
}

function footer() {
  return `<footer class="site-footer"><div class="wrap">
<div class="cols">
<div class="col wide">
<p class="title">The Front Porch</p>
<p>Our monthly letter: homes, neighborhoods and giving.</p>
<div class="ghl-form" data-form="newsletter"><p><a href="/contact">Sign up</a></p></div>
</div>
<div class="col">
<p class="title" style="font-size:18px">Quinby Partners</p>
<p>${ADDRESS.join('<br>')}<br><a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a><br><a href="mailto:${EMAIL}">${EMAIL}</a></p>
</div>
<div class="col">
<p><a href="/work-with-us">Work with us</a><br><a href="/selling">Selling</a><br><a href="/buying">Buying</a><br><a href="/neighborhoods">Neighborhoods</a><br><a href="/doing-better">Doing Better podcast</a><br><a href="/about/becky-quinby">Becky Quinby</a> · <a href="/about/elena-quinby">Elena Quinby</a></p>
</div>
<div class="col">
<p>Onward Impact Partner<br>$1,000 to a nonprofit you choose at every closing</p>
</div>
</div>
<div class="legal">
<span class="eho">Equal Housing Opportunity</span>
<span>Quinby Partners · Minnesota real estate brokerage license ${BROKER_LICENSE}</span>
<span>© ${new Date().getFullYear()} Quinby Partners</span>
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
  slogan: 'We find passionate buyers for unique homes.',
  description: 'Quinby Partners is an independent, woman-owned real estate brokerage in the Twin Cities specializing in historic, architect-designed and one-of-a-kind homes. At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses.',
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
<body>
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

const consultForm = (kind) => `<div class="ghl-form" data-form="${kind}">
<p>Call or text <a href="tel:+1${PHONE.replace(/-/g, '')}">${PHONE}</a>, or email <a href="mailto:${EMAIL}">${EMAIL}</a>. We reply within one business day.</p>
</div>`;

// ---------- neighborhoods ----------
const AREAS = [
  { slug: 'south-minneapolis', name: 'South Minneapolis', lede: 'Home base. Lakes, creeks and parkways, and street after street of bungalows, foursquares, Tudors and period-revival homes from the early twentieth century.',
    hoods: [
      ['East Harriet', '/neighborhoods/east-harriet', 'Early-twentieth-century homes beside Lake Harriet and the Lyndale Park gardens.'],
      ['Kingfield', null, 'Bungalows, foursquares and two-stories close to the shops of Nicollet Avenue.'],
      ['Lynnhurst', null, 'Period-revival and Tudor homes between Lake Harriet and Minnehaha Creek.'],
      ['Tangletown', null, 'Curving streets around the Washburn Water Tower, with Tudor and Arts and Crafts homes.'],
      ['Fulton', null, 'Craftsman and period-revival homes west of Lake Harriet, near 50th & France.'],
      ['Linden Hills', null, 'Craftsman homes and cottages between Lake Harriet and Bde Maka Ska, around a village of small shops.'],
      ['Armatage', null, 'Postwar and mid-century homes in the southwest corner of the city.'],
      ['Around Lake Nokomis', null, 'Bungalows and period homes near Lake Nokomis and Minnehaha Creek.'],
    ] },
  { slug: 'around-the-lakes', name: 'Around the Lakes', lede: 'The neighborhoods around Lake of the Isles, Bde Maka Ska and Cedar Lake, where many of the city\'s grandest early-1900s homes stand.',
    hoods: [
      ['Kenwood', '/neighborhoods/kenwood', 'Early-twentieth-century homes on winding streets between Lake of the Isles and Cedar Lake.'],
      ['East Isles', '/neighborhoods/east-isles', 'Early-1900s homes along the east shore of Lake of the Isles.'],
      ['Lowry Hill', null, 'Grand early-1900s homes on the hill above the Walker Art Center and the Sculpture Garden.'],
      ['ECCO', null, 'Early-twentieth-century homes between Bde Maka Ska and the shops of Uptown.'],
      ['CARAG', null, 'Early-1900s homes on walkable blocks near Bde Maka Ska and Uptown.'],
      ['Bryn Mawr', null, 'Craftsman and Tudor homes tucked beside Theodore Wirth Park.'],
    ] },
  { slug: 'st-paul', name: 'St. Paul', lede: 'Victorian and early-twentieth-century homes south of I-94, from the mansions of Summit Avenue to the tree-lined blocks around Grand Avenue.',
    hoods: [
      ['Summit Hill', '/neighborhoods/summit-hill', 'Victorian and early-twentieth-century homes along Summit and Grand Avenues.'],
      ['Macalester-Groveland', '/neighborhoods/macalester-groveland', 'Early-twentieth-century homes around Macalester College and Grand Avenue.'],
      ['Crocus Hill', null, 'Victorian and early-1900s homes on quiet streets just south of Summit Avenue.'],
      ['Ramsey Hill', null, 'Some of St. Paul\'s most ornate Victorian homes, near the Cathedral and the east end of Summit Avenue.'],
      ['Highland Park', null, 'Period-revival and mid-century homes near the Mississippi River bluffs.'],
    ] },
  { slug: 'edina', name: 'Edina', lede: 'From the 1920s period-revival homes of the Country Club District to the city\'s postwar and mid-century neighborhoods.',
    hoods: [
      ['Country Club', '/neighborhoods/country-club', 'A planned 1920s neighborhood of period-revival homes near 50th & France.'],
      ['Morningside', null, 'Cottage-scale 1920s to 1940s homes on the Minneapolis border.'],
      ['Mid-century Edina', null, 'Mid-century modern and postwar homes across the city\'s later neighborhoods.'],
    ] },
  { slug: 'golden-valley', name: 'Golden Valley', lede: 'Wooded hills and one of the Twin Cities\' strongest collections of mid-century modern homes.',
    hoods: [
      ['Tyrol Hills', null, 'Wooded hills and a notable collection of mid-century modern homes.'],
      ['Parkwood Knolls', null, 'Postwar and mid-century homes on wooded lots.'],
    ] },
];

const HOODS = [
  { slug: 'kenwood', name: 'Kenwood', city: 'Minneapolis', area: 'around-the-lakes', video: 'kenwood', clip: 'a quiet curved street under old trees, toward the lake',
    summary: 'Kenwood is a Minneapolis neighborhood between Lake of the Isles and Cedar Lake, known for its early-twentieth-century homes on winding, tree-lined streets.',
    architecture: 'Kenwood\'s homes date mostly from the early 1900s, when the neighborhood grew into one of the city\'s most sought-after addresses. You\'ll find Colonial Revival, Tudor Revival, Prairie School and Arts and Crafts homes, many architect-designed, with original woodwork, leaded glass and generous porches. [Add notable architects and streets.]',
    setting: 'Kenwood Park, the Kenwood Parkway and the shores of Lake of the Isles and Cedar Lake are all close by, along with the trails of the Chain of Lakes. [Add local landmarks and shops.]' },
  { slug: 'east-isles', name: 'East Isles', city: 'Minneapolis', area: 'around-the-lakes', video: 'east-isles', clip: 'Lake of the Isles shoreline at dusk',
    summary: 'East Isles is a Minneapolis neighborhood along the east shore of Lake of the Isles, known for its early-1900s homes near the lake and the shops of Uptown.',
    architecture: 'Most East Isles homes were built in the early twentieth century, from large lakefront houses to Craftsman and period-revival homes on the blocks behind them. [Add notable architects, styles and streets.]',
    setting: 'Lake of the Isles and its parkway and trails form the neighborhood\'s western edge, with the shops and restaurants of Uptown nearby. [Add local landmarks.]' },
  { slug: 'east-harriet', name: 'East Harriet', city: 'Minneapolis', area: 'south-minneapolis', video: 'east-harriet', clip: 'morning light through the Lyndale Park gardens',
    summary: 'East Harriet is a South Minneapolis neighborhood beside Lake Harriet, known for its early-twentieth-century homes and the Lyndale Park gardens.',
    architecture: 'East Harriet\'s streets hold Craftsman bungalows, Tudor and Colonial Revival homes and foursquares, most from the first decades of the twentieth century. Becky has lived here herself, in a 1916 Craftsman. [Add notable streets and details.]',
    setting: 'Lake Harriet, its bandshell and trails, and the rose and peace gardens of Lyndale Park are all close by. [Add local landmarks and shops.]' },
  { slug: 'country-club', name: 'Country Club', city: 'Edina', area: 'edina', video: 'country-club', clip: 'a tree-lined street of period-revival homes',
    summary: 'The Country Club District is an Edina neighborhood planned in the 1920s, known for its period-revival homes on tree-lined streets near 50th & France.',
    architecture: 'The Country Club District was planned and built largely in the 1920s and 1930s, with Colonial Revival, Tudor Revival and other period-revival homes. Becky is restoring a 1928 Cape Cod here. [Add history, notable homes and any design guidelines.]',
    setting: 'The shops and restaurants of 50th & France, Minnehaha Creek and nearby parks are all close by. [Add local landmarks.]' },
  { slug: 'summit-hill', name: 'Summit Hill', city: 'St. Paul', area: 'st-paul', video: 'summit-hill', clip: 'Summit Avenue in autumn',
    summary: 'Summit Hill is a St. Paul neighborhood along Summit and Grand Avenues, known for its Victorian-era and early-twentieth-century homes.',
    architecture: 'Summit Hill holds some of the Twin Cities\' finest Victorian and early-twentieth-century architecture, from grand homes on Summit Avenue to the smaller houses and rowhouses on the streets around it. [Add notable architects, homes and historic district details.]',
    setting: 'Summit Avenue\'s boulevard and the shops and restaurants of Grand Avenue are at the heart of the neighborhood. [Add local landmarks.]' },
  { slug: 'macalester-groveland', name: 'Macalester-Groveland', city: 'St. Paul', area: 'st-paul', video: 'mac-groveland', clip: 'a porch-lined block under old elms',
    summary: 'Macalester-Groveland is a St. Paul neighborhood around Macalester College and Grand Avenue, known for its early-twentieth-century homes on tree-lined streets.',
    architecture: 'Mac-Groveland\'s homes are mostly from the early twentieth century: Craftsman bungalows, foursquares, and Colonial and Tudor Revival homes. [Add notable streets and details.]',
    setting: 'Grand Avenue\'s shops, the campuses of Macalester College and the University of St. Thomas, and the Mississippi River bluffs are all nearby. [Add local landmarks.]' },
];

// ---------- pages ----------

// Home
page({
  path: '/', title: 'Quinby Partners | Historic, Architectural & Unique Homes in the Twin Cities',
  description: 'Quinby Partners is an independent, woman-owned Twin Cities brokerage for historic, architect-designed and one-of-a-kind homes. We find passionate buyers for unique homes.',
  body: `${hero('home', 'slow pan up a carved oak staircase, morning light', { eyebrow: 'Twin Cities Real Estate', title: 'We find passionate buyers for unique homes.', sub: 'Independent, woman-owned, and deeply rooted in the Twin Cities. Historic, architect-designed and one-of-a-kind homes, presented with the care they were built with.' })}

<section class="section we-sell" aria-label="What we sell"><div class="wrap center">
<hr class="rule" style="margin:0 auto 40px">
<p class="first">We don't just sell homes. We sell</p>
<p class="phrase" aria-live="polite" data-phrases='${esc(JSON.stringify(['works of art.', 'pieces of history.', 'the butler’s pantry you didn’t know you needed.', 'houses with a story.', 'good causes, too.', 'the right home to the right person.']))}'>the right home to the right person.</p>
</div></section>

<section class="section"><div class="wrap">
<div class="split">
<div class="side"><p class="eyebrow">Our approach</p><hr class="rule"></div>
<div class="main"><p class="lede">Fewer clients, more attention. Honest advice, even when it isn't what someone hoped to hear. And a share of every transaction directed back into the community.</p>
<p style="margin-top:36px"><a class="link" href="/why-quinby">Why Quinby</a></p></div>
</div>
<div style="margin-top:80px">${values}</div>
</div></section>

<section class="section white"><div class="wrap">
<div class="head-row"><div><p class="eyebrow">Our listings &amp; recent sales</p><h2>The Collection</h2></div><a class="link" href="/the-collection">View the collection</a></div>
<div class="grid">
${[1, 2, 3].map((n) => `<a class="card" href="/the-collection"><div class="ph"><span class="caps">Photo or b-roll still</span></div><div style="display:flex;gap:16px;align-items:baseline"><span class="no">No. 0${n}</span><div><p class="name">[Home name]</p><p class="meta">[Neighborhood] · [Style] · [For sale / Sold]</p></div></div></a>`).join('\n')}
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
<a class="link" href="/architecture-design#craftsmanship">One-of-a-kind craftsmanship</a>
</p>
<p style="margin-top:36px;color:var(--stone)">Buying or selling one? <a href="/historic-and-architectural-homes">Here's how it's different.</a></p>
</div>${m.close}</section>`; })()}

<section class="section"><div class="wrap">
<div class="head-row"><div><p class="eyebrow">Neighborhoods</p><h2>The neighborhoods we know best</h2>
<p style="max-width:600px;margin-top:14px">Historic homes are everywhere in the Twin Cities. South Minneapolis is home base.</p></div>
<a class="link" href="/neighborhoods">All neighborhoods</a></div>
<ul class="rows">
${HOODS.map((h) => `<li><a href="/neighborhoods/${h.slug}"><span class="n">${h.name}</span><span class="m">${h.city}</span></a></li>`).join('\n')}
</ul></div></section>

<section class="section paper" aria-labelledby="give-h"><div class="wrap split">
<div class="main" style="flex:1 1 420px">
<p class="eyebrow">Giving</p>
<h2 id="give-h" style="font-size:clamp(32px,3.6vw,44px);line-height:1.25">At every closing, we give $1,000 to a nonprofit you choose.</h2>
<div style="display:flex;flex-wrap:wrap;gap:48px;margin-top:44px">
<div class="stat"><p class="big">[$—]</p><p class="cap">Given so far</p></div>
<div class="stat"><p class="big">[—]</p><p class="cap">Nonprofits supported</p></div>
</div>
<p style="margin-top:40px"><a class="link" href="/giving">See every gift</a></p>
</div>
<div class="main" style="flex:1 1 420px">
<p class="eyebrow" style="margin-bottom:8px">Recent gifts</p>
<ul class="rows" style="border-top-color:var(--navy)">
${[1, 2, 3, 4].map(() => `<li><div class="row"><span class="n" style="font-size:22px">[Nonprofit name]</span><span class="m">[Cause area] · [Month Year]</span></div></li>`).join('\n')}
</ul></div></div></section>`,
  faqs: [
    ['What kinds of homes does Quinby Partners specialize in?', 'Historic, architect-designed and one-of-a-kind homes across Minneapolis, St. Paul, Edina and Golden Valley: prewar homes, mid-century modern homes, standout contemporary homes and homes with exceptional craftsmanship. We work with every kind of home and every price point.'],
    ['Where does Quinby Partners work?', 'Across the Twin Cities, with South Minneapolis as home base, plus the neighborhoods around the lakes, St. Paul south of I-94, Edina and Golden Valley.'],
    ['Does Quinby Partners give back?', 'Yes. At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses.'],
  ],
});

// Why Quinby
page({
  path: '/why-quinby', title: 'Why Quinby | An Independent, Woman-Owned Boutique Brokerage',
  description: 'Quinby Partners is an independent, woman-owned and queer-owned boutique brokerage in the Twin Cities. Fewer clients, more attention, honest advice, and $1,000 to charity at every closing.',
  body: `${hero('why', 'Becky and Elena walking a client through a historic home', { eyebrow: 'Why Quinby', title: 'Independent, woman-owned, and deeply rooted in the Twin Cities.', short: true })}
<section class="section"><div class="wrap split">
<div class="side"><p class="eyebrow">Our story</p><hr class="rule"></div>
<div class="main prose">
<p class="lede">Becky Quinby founded Quinby Partners on a simple conviction: to leave everything better than she found it. That applies to the homes we sell, the clients we serve, and the community we share.</p>
<p>We built an independent brokerage so we could work the way we believe real estate should work. Fewer clients, more attention. Honest advice, even when it isn't what someone hoped to hear. And a share of every transaction directed back into the community.</p>
<h2>Independent by design</h2>
<p>We answer to our clients, not a franchise playbook. That independence lets us move quickly, tailor every strategy, and give each decision the care it deserves.</p>
<h2>Boutique, on purpose</h2>
<p>Hiring a boutique brokerage is a choice to work with the people whose names are on the door. You get the founder's attention, a strategy built for your home rather than a template, and a team small enough that nothing gets lost.</p>
<h2>Woman-owned and queer-owned</h2>
<p>Quinby Partners is owned and led by women, and proudly queer-owned. We built the kind of firm we'd want to hire.</p>
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
<p>She is the host of <a href="/doing-better">Doing Better</a>, a podcast featuring conversations with nonprofit leaders, purpose-driven professionals, and community partners about building work that does well and does good.</p>
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
  path: '/selling', title: 'Selling a Historic or Unique Home | How Quinby Partners Markets Your Home',
  description: 'Quinby Partners markets historic, architect-designed and one-of-a-kind homes like works of art: house biographies, editorial photography and film, and a multi-week campaign to find the passionate buyer.',
  body: `${hero('selling', 'a hand on an original newel post, then light across a parquet floor', { eyebrow: 'Selling with Quinby Partners', title: 'Your home is a work of art. We market it like one.', sub: 'We tell the story of its craftsmanship and history, and we look for the buyer who will love it as much as you have.' })}
<section class="section"><div class="wrap"><p class="eyebrow" style="margin-bottom:48px">How we think about selling</p>
<div class="grid">
${principle('I.', 'A piece of art, not a listing', 'We present your home the way a museum presents a work: carefully lit, carefully framed, with the details given room to be seen.')}
${principle('II.', 'The house\'s story, told well', 'Who designed it, who built it, what has changed and what has been kept. Craftsmanship and history are what set a home like yours apart, so they lead.')}
${principle('III.', 'The passionate buyer, not just any buyer', 'A one-of-a-kind home needs the person who sees what it is. We go looking for them, through our readers, our neighborhoods, and the architects and builders we work with.')}
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">The process</p><h2 style="margin-bottom:52px">From history to closing</h2>
<ol class="steps">
${step('I.', 'Research the house', 'We dig into its history: the architect or builder, the year and style, original owners, and what has changed. That research becomes the house biography.')}
${step('II.', 'Prepare it with care', 'We help you decide which repairs matter and which original features to protect. Some updates add value; some erase the thing buyers are looking for.')}
${step('III.', 'Photograph and film it like an editorial', 'Styled, editorial photography and short films of the details, light and rooms, shaped by Elena\'s background in film and advertising.')}
${step('IV.', 'Write the house biography', 'A printed piece at every showing, a story on our site and in The Front Porch, and the backbone of every post.')}
${step('V.', 'Run a campaign, not a launch', 'Several weeks of fresh angles: the reveal, the history, the details, the house through the seasons, the neighborhood around it.')}
${step('VI.', 'Find the passionate buyer', 'Our readers and followers, buyers looking for homes like yours, and the architects and design-builders we partner with, plus every agent through the MLS.')}
${step('VII.', 'Close, and give back', 'At closing, Quinby Partners gives $1,000 to a nonprofit you choose.')}
</ol></div></section>
${band('listing-film', 'sample listing film, 30–60 seconds')}
<section class="section"><div class="wrap"><p class="eyebrow">The difference</p><h2 style="margin-bottom:44px">A typical listing, and ours</h2>
${compare('Most listings', 'A Quinby Partners listing', [
  ['Photos on day one, the same for every house', 'An editorial shoot and short films of the details'],
  ['Bedrooms, baths and square footage', 'The house\'s story: its design, its makers, its history'],
  ['A one-week launch, then waiting', 'A multi-week campaign with a new angle each week'],
  ['As many buyers as possible', 'The buyer who will love it most'],
  ['Original features listed as “dated”', 'Original features presented as what they are: craftsmanship'],
])}</div></section>
<section class="section paper"><div class="wrap"><blockquote class="pull"><p>“[A seller's words about how their home was presented and who bought it.]”</p><footer>[Seller name, neighborhood]</footer></blockquote></div></section>
<section class="section"><div class="wrap split">
<div class="main"><h2>Tell us about your home.</h2><p style="margin-top:20px">Whether you're selling this season or years from now, we'd love to see it, hear its story, and talk through what it's worth and who it's for.</p>
<p><a class="link" href="/historic-and-architectural-homes">Selling a historic or architectural home: what's different</a></p></div>
<div class="side">${consultForm('seller-consult')}</div>
</div></section>`,
  faqs: [
    ['How is selling a historic home different?', 'There are few true comparables, so value lives in the details. It takes knowing which original features to protect, which repairs pay back, how to tell the house\'s story, and how long it may take to find the right buyer.'],
    ['How does Quinby Partners market a home?', 'With a researched house biography, editorial photography and short films, and a multi-week campaign through our publication, newsletter, social media and the MLS.'],
  ],
});

// Buying
page({
  path: '/buying', title: 'Buying a Historic, Architectural or Unique Home | Quinby Partners',
  description: 'Buy a home with character with confidence. Quinby Partners helps buyers find historic, mid-century and architect-designed homes and understand the real costs before they offer.',
  body: `${hero('buying', 'a front door opening onto a sunlit entry hall', { eyebrow: 'Buying with Quinby Partners', title: 'Find the home you’ll love for its details.', sub: 'We help you find a home with character, see it clearly, and buy it with confidence, whether it was built in 1905, 1955 or last year.' })}
<section class="section"><div class="wrap"><p class="eyebrow" style="margin-bottom:48px">How we think about buying</p>
<div class="grid">
${principle('I.', 'We see what makes a home special', 'Original woodwork, a butler’s pantry, a mid-century window wall. We know which details are rare, which carry value, and which are worth protecting.')}
${principle('II.', 'We see what it will take', 'Older and architect-designed homes come with their own questions: systems, inspections, insurance, restoration costs and historic district rules. We help you walk in knowing the real picture.')}
${principle('III.', 'We hear about homes early', 'Through our publication, our neighborhoods and the architects and builders we work with, we often know owners who are thinking about selling.')}
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">The process</p><h2 style="margin-bottom:52px">From first showing to closing</h2>
<ol class="steps">
${step('I.', 'Start with what you love', 'Styles, eras, details and neighborhoods. We help you put words to it, and we keep an eye out for homes that fit.')}
${step('II.', 'Hear about homes early', 'Owners we know through our publication, our neighborhoods and our architect and builder partners, plus everything on the MLS.')}
${step('III.', 'Tour with an expert eye', 'We point out what’s original, what’s been changed, and what each detail means for value and upkeep.')}
${step('IV.', 'Know the real costs', 'Inspectors who specialize in older homes, realistic restoration budgets, insurance questions and any historic district rules, before you write an offer.')}
${step('V.', 'Write a strong offer', 'Clear pricing advice for homes with few true comparables, and steady negotiation at the table.')}
${step('VI.', 'Close with your team in place', 'Introductions to architects, design-builders and tradespeople who know homes like yours.')}
${step('VII.', 'Close, and give back', 'At closing, Quinby Partners gives $1,000 to a nonprofit you choose.')}
</ol></div></section>
${band('buying-walk', 'walking through a home, pointing out details')}
<section class="section"><div class="wrap"><p class="eyebrow">The difference</p><h2 style="margin-bottom:44px">A typical search, and ours</h2>
${compare('A typical search', 'Searching with Quinby Partners', [
  ['Alerts for whatever matches the filters', 'A search built around the details you love'],
  ['Only what’s already on the market', 'Owners we know, as well as everything listed'],
  ['A general home inspection', 'Specialists for older and architect-designed homes'],
  ['Original features called “dated”', 'Original features explained: what’s rare, what to keep, what it costs'],
  ['Keys at closing, and that’s it', 'Introductions to the people who can care for it, and a gift to a cause you choose'],
])}</div></section>
<section class="section paper"><div class="wrap"><blockquote class="pull"><p>“[A buyer's words about finding their home with us.]”</p><footer>[Buyer name, neighborhood]</footer></blockquote></div></section>
<section class="section"><div class="wrap split">
<div class="main"><h2>Tell us what you're looking for.</h2><p style="margin-top:20px">A style, a neighborhood, a feeling you get walking through the door. Whether you're buying this season or just starting to look, we'd love to help you find it.</p>
<p><a class="link" href="/historic-and-architectural-homes">Buying a historic or architectural home: what's different</a></p></div>
<div class="side">${consultForm('buyer-consult')}</div>
</div></section>`,
  faqs: [
    ['What should I know before buying an older home?', 'Plan for specialist inspections (sewer, wiring, roof, foundation, plaster), realistic upkeep and restoration budgets, insurance questions, and any historic district rules that limit exterior changes.'],
    ['Does Quinby Partners help with homes that aren’t historic?', 'Yes. We help buyers find homes with character of every era, from prewar to mid-century to contemporary, at every price point.'],
  ],
});

// Work with us
page({
  path: '/work-with-us', title: 'Work With Us | Quinby Partners',
  description: 'Start a conversation with Quinby Partners about selling or buying a home in the Twin Cities.',
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">Work with us</p><h1 style="max-width:900px">Let's talk about your home, or the one you're looking for.</h1>
<div class="grid" style="margin-top:72px">
<div class="principle"><p class="num">Selling</p><h3>Your home is a work of art.</h3><p>House biographies, editorial photography and film, and a campaign to find the passionate buyer.</p><p><a class="link" href="/selling">How we market your home</a></p></div>
<div class="principle"><p class="num">Buying</p><h3>Find the home you'll love for its details.</h3><p>An expert eye on every home, the real costs up front, and owners we know before they list.</p><p><a class="link" href="/buying">Buying with us</a></p></div>
</div>
<div style="margin-top:80px;max-width:640px">${consultForm('consult')}</div>
</div></section>
<section class="section white"><div class="wrap">${values}</div></section>`,
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
<div class="stat"><p class="big">[$—]</p><p class="cap">Given so far</p></div>
<div class="stat"><p class="big">[—]</p><p class="cap">Closings that gave back</p></div>
<div class="stat"><p class="big">[—]</p><p class="cap">Nonprofits supported</p></div>
</div></section>
<section class="section tight"><div class="wrap"><p class="eyebrow" style="margin-bottom:40px">How it works</p><div class="grid">
${principle('I.', 'You choose the cause', 'Any nonprofit that matters to you. If you are undecided, we suggest three to choose from.')}
${principle('II.', 'We give at closing', 'Quinby Partners gives $1,000 on your behalf, from our side of the transaction, never added to your costs.')}
${principle('III.', 'We share it, with your okay', 'The gift joins the record below, so your move is part of something bigger.')}
</div></div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">The record</p><h2 style="margin-bottom:44px">Every gift, every closing</h2>
<div class="table-wrap"><table class="compare"><thead><tr><th scope="col">Closed</th><th scope="col">Nonprofit</th><th scope="col">Cause</th><th scope="col">Home in</th><th scope="col" style="text-align:right">Gift</th></tr></thead><tbody>
${[1, 2, 3, 4, 5, 6].map(() => `<tr><td class="typ">[Month Year]</td><td class="ours">[Nonprofit name]</td><td>[Cause area]</td><td>[Neighborhood]</td><td class="num">$1,000</td></tr>`).join('')}
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
  description: 'Quinby Partners specializes in homes with a point of view: historic, mid-century modern, contemporary, architect-designed and one-of-a-kind homes across the Twin Cities.',
  body: `${hero('architecture-hub', 'details across eras: plaster, teak, glass', { eyebrow: 'Architecture & Design', title: 'Homes with a point of view, from 1905 to last year.', sub: 'It’s the architecture and character that make a home singular, not its age or its price.', short: true })}
<section class="section"><div class="wrap grid">
${cat('historic', 'Historic', 'Prewar homes that are strong examples of their style: Tudor Revival, Craftsman, Prairie School, Colonial Revival and Victorian homes, with the woodwork, plaster and leaded glass that make them singular.')}
${cat('modern', 'Mid-century & Modern', 'Homes from the 1940s to the 1970s and the modern homes that followed: open plans, window walls, natural materials and a close connection to the landscape. Golden Valley and Edina hold some of the region’s best.')}
${cat('contemporary', 'Contemporary', 'New homes with real design ambition: architect-led, carefully detailed and built to last.')}
${cat('architect-designed', 'Architect-designed', 'Homes from any era with a named architect behind them, and a design worth understanding before you buy or sell.')}
${cat('art-lovers', 'Homes for art lovers', 'Gallery walls, good natural light, studios, ceiling height and room to live with a collection.')}
${cat('craftsmanship', 'One-of-a-kind craftsmanship', 'Built-ins, tile, stained glass, a butler’s pantry, a hidden staircase: the details you won’t find twice.')}
</div></section>
${ctaBand('Buying or selling a home like this?', 'Pricing, preparing, marketing and inspecting these homes all work differently.', '/historic-and-architectural-homes', 'How it’s different')}`,
  faqs: [
    ['Do I need a historic home to work with Quinby Partners?', 'No. We specialize in homes with character of every era, including mid-century, contemporary and architect-designed homes, and we work with every kind of home and price point.'],
  ],
});

// Historic & architectural homes guide
page({
  path: '/historic-and-architectural-homes', title: 'Buying & Selling Historic and Architectural Homes in the Twin Cities',
  description: 'What makes buying or selling a historic, mid-century or architect-designed home different: pricing, preparation, marketing, inspections, costs and historic district rules.',
  body: `<section class="section"><div class="wrap split">
<div class="side"><p class="eyebrow">A guide</p><hr class="rule"></div>
<div class="main prose">
<h1 style="font-size:clamp(40px,5vw,64px)">Buying and selling historic and architectural homes</h1>
<p class="lede" style="margin-top:28px">Historic, mid-century and architect-designed homes don’t sell like other homes. Here’s what’s different, and how we help.</p>
<h2>What counts</h2>
<ul>
<li><strong>Historic:</strong> prewar homes that are strong examples of their style.</li>
<li><strong>Mid-century:</strong> 1940s to 1970s architect-designed or textbook modern homes.</li>
<li><strong>Contemporary:</strong> new homes with exceptional, architect-led design.</li>
<li><strong>One of a kind:</strong> any home with craftsmanship or features you won’t find twice.</li>
</ul>
<p>It’s the architecture and character, not the price.</p>
<h2>Selling one is different</h2>
<ul>
<li><strong>Pricing:</strong> there are few true comparables, so value lives in the details. It takes knowing which features carry value and which updates pay back at sale.</li>
<li><strong>Preparing:</strong> which repairs matter, and which original features to protect rather than “update.”</li>
<li><strong>Marketing:</strong> a house biography, editorial photography and film, and a multi-week campaign instead of a one-week launch. <a href="/selling">How we market your home.</a></li>
<li><strong>Timing:</strong> the right buyer can take longer to find, so we plan for it rather than cutting the price.</li>
<li><strong>Disclosures:</strong> including lead-based paint disclosure for homes built before 1978, older systems, and any historic district rules.</li>
</ul>
<h2>Buying one is different</h2>
<ul>
<li><strong>Inspections:</strong> specialists for older homes, such as sewer scopes, wiring, plaster, roofs and foundations.</li>
<li><strong>Costs:</strong> insurance and upkeep on older homes, and realistic restoration budgets.</li>
<li><strong>Rules:</strong> local historic districts in Minneapolis and St. Paul can limit exterior changes, so check before you plan a project.</li>
<li><strong>Partners:</strong> introductions to architects and design-builders who know older and architect-designed homes. <a href="/buying">Buying with us.</a></li>
</ul>
<h2>How we work with these homes</h2>
<p>Becky has bought, renovated and lived in homes spanning nearly a century of Minneapolis architecture, and restores historic investment properties of her own. Our publication, <a href="${PUB_PATH}">${esc(PUB)}</a>, reaches buyers who care about architecture. And at every closing, we give $1,000 to a nonprofit you choose; history, conservation and arts organizations are natural fits.</p>
</div></div></section>
${ctaBand('Let’s talk about your home.', null, '/work-with-us', 'Work with us')}`,
  faqs: [
    ['How do you price a historic home?', 'With few true comparables, pricing depends on the details: original features, quality of past restorations, condition of systems, and how the home compares with its era and style. We price from that knowledge rather than square footage alone.'],
    ['Do historic districts limit what I can change?', 'Local historic districts in Minneapolis and St. Paul can require approval for exterior changes. Check the rules for a specific property before planning a project.'],
    ['Do I need a special inspection for an older home?', 'A general inspection is a start. Older homes often warrant specialists for the sewer line, wiring, roof, foundation and plaster.'],
  ],
});

// The Collection
page({
  path: '/the-collection', title: 'The Collection | Quinby Partners Listings & Recent Sales',
  description: 'The Collection: historic, architect-designed and one-of-a-kind homes represented by Quinby Partners, each with its own house biography.',
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">Our listings &amp; recent sales</p><h1>The Collection</h1>
<p class="lede" style="max-width:820px;margin-top:24px">The homes we’ve been trusted with. Each one comes with its own house biography: its design, its makers and its story.</p>
<div class="grid" style="margin-top:64px">
${[1, 2, 3].map((n) => `<div class="card"><div class="ph"><span class="caps">Photo or b-roll still</span></div><div style="display:flex;gap:16px;align-items:baseline"><span class="no">No. 0${n}</span><div><p class="name">[Home name]</p><p class="meta">[Neighborhood] · [Style] · [For sale / Sold]</p></div></div></div>`).join('\n')}
</div></div></section>
${ctaBand('Should your home be in the collection?', 'We’d love to see it and hear its story.', '/selling', 'How we market your home')}`,
});

// Publication
page({
  path: PUB_PATH, title: `${PUB} | Remarkable Homes of the Twin Cities`,
  description: 'Stories of the Twin Cities’ most remarkable homes, their architecture, their makers and the people who care for them, from Quinby Partners.',
  bandsOn: false,
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">A publication from Quinby Partners</p><h1>${esc(PUB)}</h1>
<p class="lede" style="max-width:820px;margin-top:24px">Stories of the Twin Cities’ most remarkable homes: their architecture, their makers and the people who care for them. Most aren’t for sale.</p>
</div></section>
<section class="section white"><div class="wrap"><p class="eyebrow">This month’s feature</p>
<div class="split" style="margin-top:24px"><div class="main"><div class="card"><div class="ph wide"></div></div></div>
<div class="side"><p class="no" style="font-family:var(--serif);color:var(--brass-text)">Feature No. 01</p><h2>[Home name]</h2><p class="meta caps" style="color:var(--muted);margin-top:12px">[Neighborhood] · [Year] · [Style]</p><p style="margin-top:18px">[One line on what makes this house singular.]</p></div></div></div></section>
<section class="section"><div class="wrap"><p class="eyebrow">The Register</p><h2 style="margin-bottom:16px">Notable homes, one at a time</h2>
<p style="max-width:640px;margin-bottom:44px">A running catalog of remarkable homes across the Twin Cities: one great photo, the essentials, and a few lines of story.</p>
<div class="grid">${[1, 2, 3].map(() => `<div class="card"><div class="ph wide"></div><p class="name">[Home name]</p><p class="meta">[Neighborhood] · [Year] · [Style]</p></div>`).join('')}</div></div></section>
${ctaBand('Know a home that belongs here?', 'We feature homes with their owners’ permission, and never share addresses.', '/contact', 'Nominate a home')}`,
});

// Doing Better
page({
  path: '/doing-better', title: 'Doing Better | A Podcast with Becky Quinby',
  description: 'Doing Better is Becky Quinby’s podcast with nonprofit leaders, purpose-driven professionals and community partners about building work that does well and does good.',
  bandsOn: false,
  body: `<section class="section pine"><div class="wrap split" style="align-items:center">
<div class="main"><p class="eyebrow">The podcast</p><h1>Doing Better</h1><p style="margin-top:24px;max-width:600px">Conversations with nonprofit leaders, purpose-driven professionals and community partners about building work that does well and does good. Hosted by Becky Quinby.</p></div>
<div class="side"><div class="media plain" style="aspect-ratio:16/9;background:var(--navy)"><p class="label">Latest episode · YouTube embed</p></div></div>
</div></section>
<section class="section"><div class="wrap"><p class="eyebrow">Episodes</p><ul class="rows">${[1, 2, 3].map(() => `<li><div class="row"><span class="n">[Episode title]</span><span class="m">[Guest] · [Date]</span></div></li>`).join('')}</ul></div></section>`,
});

// Neighborhoods hub
page({
  path: '/neighborhoods', title: 'Neighborhoods | Historic & Architectural Homes in Minneapolis, St. Paul, Edina & Golden Valley',
  description: 'The Twin Cities neighborhoods Quinby Partners knows best, from South Minneapolis and the lakes to St. Paul, Edina and Golden Valley.',
  body: `<section class="section"><div class="wrap">
<p class="eyebrow">Neighborhoods</p><h1 style="max-width:900px">Historic homes are everywhere in the Twin Cities. South Minneapolis is home base.</h1>
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
    description: `${a.lede.split('. ')[0]}. Quinby Partners helps buyers and sellers of historic and unique homes in ${a.name}.`,
    body: `${hero('area-' + a.slug, a.name + ': streets, parks and homes', { eyebrow: 'Neighborhoods', title: a.name, sub: a.lede, short: true })}
<section class="section"><div class="wrap"><ul class="rows">
${a.hoods.map(([n, href, line]) => href ? `<li><a href="${href}"><span class="n">${n}</span><span class="m">Neighborhood guide</span><p>${line}</p></a></li>` : `<li><div class="row"><span class="n">${n}</span><p>${line}</p></div></li>`).join('\n')}
</ul></div></section>
${ctaBand(`Buying or selling in ${a.name}?`, null, '/work-with-us', 'Work with us')}`,
    faqs: [[`Does Quinby Partners work in ${a.name}?`, `Yes. Quinby Partners helps buyers and sellers of historic, architect-designed and one-of-a-kind homes throughout ${a.name}, including ${a.hoods.map((h) => h[0]).filter((n) => !n.startsWith('Mid-') && !n.startsWith('Around')).join(', ')}.`]],
  });
}

// Full neighborhood pages
for (const h of HOODS) {
  const area = AREAS.find((a) => a.slug === h.area);
  page({
    path: `/neighborhoods/${h.slug}`, title: `${h.name} Homes & Real Estate | ${h.city} | Quinby Partners`,
    description: h.summary,
    schema: [{ '@type': 'Place', name: `${h.name}, ${h.city}, MN`, description: h.summary }],
    body: `${hero(h.video, h.clip, { eyebrow: `Neighborhoods · ${h.city}`, title: h.name, short: true })}
<section class="section"><div class="wrap split">
<div class="side"><p class="eyebrow">The neighborhood</p><hr class="rule"><p class="small">Part of <a href="/neighborhoods/${area.slug}">${area.name}</a></p></div>
<div class="main prose"><p class="lede">${h.summary}</p><h2>The architecture</h2><p>${h.architecture}</p><h2>The setting</h2><p>${h.setting}</p></div>
</div></section>
${band(h.video + '-2', h.clip)}
${ctaBand(`Own a home in ${h.name}?`, 'We’d love to hear its story, whether you’re selling now or someday.', '/selling', 'How we market your home')}`,
    faqs: [
      [`What kinds of homes are in ${h.name}?`, h.architecture.replace(/ \[.*?\]/g, '')],
      [`Who is a real estate agent for historic homes in ${h.name}?`, `Quinby Partners is an independent, woman-owned Twin Cities brokerage specializing in historic, architect-designed and one-of-a-kind homes, including in ${h.name}.`],
    ],
  });
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

> Quinby Partners is an independent, woman-owned and queer-owned boutique real estate brokerage in the Twin Cities (Minneapolis, St. Paul, Edina and Golden Valley, Minnesota), founded by broker Becky Quinby. It specializes in historic, architecturally significant, mid-century, architect-designed and one-of-a-kind homes, and works with every kind of home and price point. Positioning: "We find passionate buyers for unique homes." At every closing, Quinby Partners gives $1,000 to a nonprofit the client chooses. Contact: ${PHONE}, ${EMAIL}.

## About
${group((p) => p === '/' || p === '/why-quinby' || p.startsWith('/about') || p === '/giving')}

## Selling and buying
${group((p) => ['/selling', '/buying', '/work-with-us', '/historic-and-architectural-homes'].includes(p))}

## Architecture and homes
${group((p) => ['/architecture-design', '/the-collection', PUB_PATH].includes(p))}

## Neighborhoods
${group((p) => p.startsWith('/neighborhoods'))}

## Optional
${group((p) => p === '/doing-better' || p === '/contact')}
`);

console.log(`Built ${pages.length} pages to ${OUT}`);
