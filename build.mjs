// Generates the static site from data/site.json + data/products.json.
// Run after editing either file:  node build.mjs
import fs from 'node:fs';

const site = JSON.parse(fs.readFileSync('data/site.json', 'utf8'));
const raw = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

const CATS = {
  serums: 'Serums & Ampoules',
  moisturizers: 'Moisturizers',
  cleansers: 'Cleansers',
  sunscreen: 'Sunscreen',
  masks: 'Masks',
  pads: 'Toner Pads',
  'eye-lip': 'Eye & Lip',
  body: 'Body',
};

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = n => site.currency + Number(n).toLocaleString('en-US');

const products = raw.map(p => ({
  ...p,
  id: p.img,
  slug: slugify(`${p.brand} ${p.name}`),
  full: `${p.brand} ${p.name}`,
}));

const missing = products.filter(p => p.price == null);

function priceHtml(p) {
  if (p.price == null) return '<span class="price ask">Price on request</span>';
  const old = p.oldPrice && p.oldPrice > p.price ? ` <s>${money(p.oldPrice)}</s>` : '';
  return `<span class="price">${money(p.price)}${old}</span>`;
}

function describe(p) {
  const ing = p.ing.slice(0, 3).join(', ');
  return `${p.full}${p.size ? ` (${p.size})` : ''}: 100% authentic Korean skincare for ${p.tags.join(' & ').toLowerCase()}. Key ingredients: ${ing}. Cash on delivery across Bangladesh.`;
}

function head({ title, desc, path, image, depth, extra = '' }) {
  const r = depth ? '../' : '';
  const url = site.url.replace(/\/$/, '') + '/' + path;
  const pixel = site.metaPixelId ? `
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(site.metaPixelId)}');fbq('track','PageView');</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(site.url.replace(/\/$/, '') + '/' + image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fbf7f4">
<link rel="icon" href="${r}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}assets/style.css">${pixel}${extra}
</head>`;
}

function header(r) {
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="${r}index.html">${esc(site.name)}</a>
    <nav class="top-nav">
      <a href="${r}index.html#shop">Shop</a>
      <a href="${r}index.html#how">How to order</a>
    </nav>
    <button class="cart-btn" type="button" data-open-cart aria-label="Open cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
      <span class="cart-count" data-cart-count hidden>0</span>
    </button>
  </div>
</header>`;
}

function footer(r) {
  const social = [
    site.facebookPage && `<a href="${esc(site.facebookPage)}" rel="noopener">Facebook</a>`,
    site.instagram && `<a href="${esc(site.instagram)}" rel="noopener">Instagram</a>`,
    site.whatsapp && `<a href="https://wa.me/${esc(site.whatsapp)}" rel="noopener">WhatsApp</a>`,
  ].filter(Boolean).join(' · ');
  return `
<footer class="foot">
  <div class="wrap foot-in">
    <div>
      <div class="logo">${esc(site.name)}</div>
      <p>${esc(site.tagline)}.</p>
    </div>
    <div>
      <p>${social}</p>
      <p>${esc(site.phoneDisplay)}</p>
    </div>
  </div>
  <p class="wrap fine">© ${new Date().getFullYear()} ${esc(site.name)}. Medicube and Celimax are trademarks of their respective owners. ${esc(site.name)} is an independent reseller.</p>
</footer>

<a class="wa-float" href="https://wa.me/${esc(site.whatsapp)}" data-wa-general rel="noopener" aria-label="Chat on WhatsApp">
  <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.7c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7Zm5.9-8c-.3-.2-1.9-1-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6 0-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.2 1.3 3.4c.2.2 2.3 3.5 5.6 4.9 2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.6-.3Z"/></svg>
</a>

<div class="drawer" data-drawer hidden>
  <div class="drawer-bg" data-close-cart></div>
  <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
    <div class="drawer-head">
      <h2 id="cart-title">Your bag</h2>
      <button type="button" class="x" data-close-cart aria-label="Close">×</button>
    </div>
    <div class="drawer-body" data-cart-body></div>
  </aside>
</div>

<script>window.SITE=${JSON.stringify(site)};</script>
<script src="${r}assets/catalog.js"></script>
<script src="${r}assets/app.js"></script>
</body>
</html>`;
}

function card(p) {
  const action = p.price == null
    ? `<a class="btn ghost" href="https://wa.me/${esc(site.whatsapp)}" data-ask="${esc(p.id)}" rel="noopener">Ask price</a>`
    : p.inStock === false
      ? `<button class="btn ghost" type="button" disabled>Sold out</button>`
      : `<button class="btn" type="button" data-add="${esc(p.id)}">Add to bag</button>`;
  return `
    <article class="card" data-cat="${esc(p.cat)}" data-brand="${esc(p.brand.toLowerCase())}" data-search="${esc((p.full + ' ' + CATS[p.cat] + ' ' + (p.cat === 'sunscreen' ? 'sun cream spf ' : '') + p.tags.join(' ') + ' ' + p.ing.join(' ')).toLowerCase())}">
      <a class="card-img" href="p/${p.slug}.html"><img src="img/${p.img}.jpg" alt="${esc(p.full)}" loading="lazy" width="400" height="400"></a>
      <div class="card-body">
        <div class="brand">${esc(p.brand)}</div>
        <h3><a href="p/${p.slug}.html">${esc(p.name)}</a></h3>
        <div class="meta">${esc(p.size)}${p.size ? ' · ' : ''}${esc(p.tags[0])}</div>
        <div class="card-foot">${priceHtml(p)}${action}</div>
      </div>
    </article>`;
}

// ---------- index.html ----------
const usedCats = Object.keys(CATS).filter(c => products.some(p => p.cat === c));
const chips = ['<button class="chip on" type="button" data-filter="all">All</button>']
  .concat(usedCats.map(c => `<button class="chip" type="button" data-filter="${c}">${CATS[c]}</button>`))
  .join('');

const orgLd = { '@context': 'https://schema.org', '@type': 'Store', name: site.name, url: site.url, description: site.tagline };

const index = head({
  title: `${site.name} | Authentic Medicube & Celimax in Bangladesh`,
  desc: `${site.tagline}. Shop ${products.length}+ Medicube and Celimax serums, sunscreens, creams and masks. Cash on delivery.`,
  path: '',
  image: `img/${products[10].img}.jpg`,
  depth: 0,
  extra: `\n<script type="application/ld+json">${JSON.stringify(orgLd)}</script>`,
}) + `
<body>${header('')}
<main id="main">
  <section class="hero">
    <div class="wrap hero-in">
      <div class="hero-copy">
        <p class="eyebrow">Medicube · Celimax · 100% authentic</p>
        <h1>Korean skincare that actually reaches your door.</h1>
        <p class="lead">${products.length} bestsellers, from PDRN serums to SPF 50+ sunscreens. Order in two minutes and pay cash on delivery anywhere in Bangladesh.</p>
        <div class="hero-cta">
          <a class="btn lg" href="#shop">Shop now</a>
          <a class="btn lg ghost" href="https://wa.me/${esc(site.whatsapp)}" data-wa-general rel="noopener">Ask on WhatsApp</a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <img src="img/p11.jpg" alt="" class="h1i">
        <img src="img/p19.jpg" alt="" class="h2i">
        <img src="img/p31.jpg" alt="" class="h3i">
      </div>
    </div>
  </section>

  <section class="trust">
    <div class="wrap trust-in">
      <div><strong>100% authentic</strong><span>Sourced from verified suppliers</span></div>
      <div><strong>Cash on delivery</strong><span>Pay when it arrives</span></div>
      <div><strong>Dhaka 1–2 days</strong><span>Outside Dhaka 3–5 days</span></div>
      <div><strong>Free delivery</strong><span>On orders over ${money(site.freeDeliveryOver)}</span></div>
    </div>
  </section>

  <section id="shop" class="shop wrap">
    <div class="shop-head">
      <h2>Shop the collection</h2>
      <label class="search"><span class="sr">Search products</span>
        <input type="search" placeholder="Search: sunscreen, PDRN, dark spots…" data-search-input>
      </label>
    </div>
    <div class="chips" role="group" aria-label="Filter by category">${chips}</div>
    <div class="chips brands" role="group" aria-label="Filter by brand">
      <button class="chip sm on" type="button" data-brand-filter="all">All brands</button>
      <button class="chip sm" type="button" data-brand-filter="medicube">Medicube</button>
      <button class="chip sm" type="button" data-brand-filter="celimax">Celimax</button>
    </div>
    <div class="grid" data-grid>${products.map(card).join('')}
    </div>
    <p class="empty" data-empty hidden>No products match. Try another word, or <a href="https://wa.me/${esc(site.whatsapp)}" data-wa-general>ask us on WhatsApp</a>.</p>
  </section>

  <section id="how" class="how">
    <div class="wrap">
      <h2>How to order</h2>
      <ol class="steps">
        <li><strong>Add to bag</strong><span>Pick your products and tap “Add to bag”.</span></li>
        <li><strong>Enter your address</strong><span>Name, phone and delivery address. No account needed.</span></li>
        <li><strong>Confirm on WhatsApp</strong><span>We confirm your order in minutes and ship it out.</span></li>
        <li><strong>Pay on delivery</strong><span>Cash on delivery, or bKash/Nagad if you prefer.</span></li>
      </ol>
    </div>
  </section>
</main>
${footer('')}`;

fs.writeFileSync('index.html', index);

// ---------- product pages ----------
fs.rmSync('p', { recursive: true, force: true });
fs.mkdirSync('p');
for (const p of products) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.full,
    image: site.url.replace(/\/$/, '') + `/img/${p.img}.jpg`,
    brand: { '@type': 'Brand', name: p.brand }, description: describe(p),
    ...(p.price != null && {
      offers: {
        '@type': 'Offer', price: p.price, priceCurrency: 'BDT',
        availability: p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: site.url.replace(/\/$/, '') + `/p/${p.slug}.html`,
      },
    }),
  };
  const related = products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const buy = p.price == null
    ? `<a class="btn lg" href="https://wa.me/${esc(site.whatsapp)}" data-ask="${esc(p.id)}" rel="noopener">Ask price on WhatsApp</a>`
    : p.inStock === false
      ? `<button class="btn lg ghost" type="button" disabled>Sold out</button>`
      : `<div class="qty-row">
          <div class="qty"><button type="button" data-qty="-1" aria-label="Decrease">−</button><input type="number" min="1" value="1" data-qty-input aria-label="Quantity"><button type="button" data-qty="1" aria-label="Increase">+</button></div>
          <button class="btn lg" type="button" data-add="${esc(p.id)}" data-with-qty>Add to bag</button>
        </div>
        <button class="btn lg ghost full" type="button" data-buy-now="${esc(p.id)}">Buy now</button>`;

  const html = head({
    title: `${p.full}${p.size ? ' ' + p.size : ''} | ${site.name} Bangladesh`,
    desc: describe(p), path: `p/${p.slug}.html`, image: `img/${p.img}.jpg`, depth: 1,
    extra: `\n<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
  }) + `
<body data-product="${esc(p.id)}">${header('../')}
<main id="main" class="wrap pdp">
  <nav class="crumbs"><a href="../index.html">Home</a> / <a href="../index.html#shop">${esc(CATS[p.cat])}</a></nav>
  <div class="pdp-in">
    <div class="pdp-img"><img src="../img/${p.img}.jpg" alt="${esc(p.full)}" width="800" height="800"></div>
    <div class="pdp-info">
      <div class="brand">${esc(p.brand)}</div>
      <h1>${esc(p.name)}</h1>
      ${p.size ? `<div class="meta">${esc(p.size)}</div>` : ''}
      <div class="pdp-price">${priceHtml(p)}</div>
      <div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      ${buy}
      <ul class="perks">
        <li>100% authentic, sourced from verified suppliers</li>
        <li>Cash on delivery all over Bangladesh</li>
        <li>Delivery ${money(site.deliveryInsideDhaka)} inside Dhaka · ${money(site.deliveryOutsideDhaka)} outside</li>
      </ul>
      <h2>Key ingredients</h2>
      <ul class="ing">${p.ing.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <p class="note">Patch test before first use. For sensitive skin or active ingredients like retinol and acids, start 2–3 times a week and always wear sunscreen in the day.</p>
    </div>
  </div>
  ${related.length ? `<section class="related"><h2>You may also like</h2><div class="grid">${related.map(card).join('').replaceAll('href="p/', 'href="').replaceAll('src="img/', 'src="../img/')}</div></section>` : ''}
</main>
${footer('../')}`;
  fs.writeFileSync(`p/${p.slug}.html`, html);
}

// ---------- client catalog, sitemap, robots ----------
const catalog = Object.fromEntries(products.map(p => [p.id, {
  name: p.full, size: p.size, price: p.price, img: p.img, slug: p.slug, inStock: p.inStock !== false,
}]));
fs.writeFileSync('assets/catalog.js', `window.CATALOG=${JSON.stringify(catalog)};\n`);

const base = site.url.replace(/\/$/, '');
const urls = [`${base}/`, ...products.map(p => `${base}/p/${p.slug}.html`)];
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

console.log(`Built index + ${products.length} product pages.`);
if (missing.length) console.log(`⚠ ${missing.length} products have no price yet (shown as "Price on request"). Set "price" in data/products.json.`);
if (site.whatsapp.includes('X')) console.log('⚠ Set your WhatsApp number in data/site.json');
if (site.url.includes('example.com')) console.log('⚠ Set your real domain in data/site.json ("url") for link previews and SEO');
