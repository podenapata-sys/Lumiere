(function () {
  const S = window.SITE, C = window.CATALOG;
  const KEY = 'lumiere-cart';
  const money = n => S.currency + Number(n).toLocaleString('en-US');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = location.pathname.includes('/p/') ? '../' : '';
  const track = (ev, data) => { try { window.fbq && fbq('track', ev, data); } catch (e) {} };
  const wa = text => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;

  // ---------- cart state ----------
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  for (const id in cart) if (!C[id] || C[id].price == null) delete cart[id];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} render(); };
  const items = () => Object.entries(cart).map(([id, q]) => ({ id, q, ...C[id] }));
  const subtotal = () => items().reduce((s, i) => s + i.price * i.q, 0);

  function add(id, q = 1) {
    cart[id] = (cart[id] || 0) + q;
    save();
    track('AddToCart', { content_ids: [id], content_name: C[id].name, value: C[id].price * q, currency: 'BDT' });
  }

  // ---------- drawer ----------
  const drawer = $('[data-drawer]'), body = $('[data-cart-body]');
  let step = 'cart', area = 'inside';
  const open = (s = 'cart') => { step = s; render(); drawer.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { drawer.hidden = true; document.body.style.overflow = ''; };

  function delivery(sub) {
    if (S.freeDeliveryOver && sub >= S.freeDeliveryOver) return 0;
    return area === 'inside' ? S.deliveryInsideDhaka : S.deliveryOutsideDhaka;
  }

  function render() {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    $$('[data-cart-count]').forEach(el => { el.textContent = count; el.hidden = !count; });
    if (!body) return;
    const list = items();
    if (!list.length) {
      body.innerHTML = `<p class="cart-empty">Your bag is empty.</p><a class="btn full" href="${root}index.html#shop" data-close-cart>Start shopping</a>`;
      return;
    }
    const sub = subtotal(), del = delivery(sub);
    const lines = list.map(i => `
      <div class="line">
        <img src="${root}img/${i.img}.jpg" alt="">
        <div class="line-info">
          <a href="${root}p/${i.slug}.html">${i.name}</a>
          <small>${i.size || ''}</small>
          <div class="qty sm"><button type="button" data-line="${i.id}" data-d="-1" aria-label="Decrease">−</button><span>${i.q}</span><button type="button" data-line="${i.id}" data-d="1" aria-label="Increase">+</button></div>
        </div>
        <div class="line-price">${money(i.price * i.q)}<button type="button" class="rm" data-rm="${i.id}">Remove</button></div>
      </div>`).join('');
    const totals = `
      <div class="totals">
        <div><span>Subtotal</span><span>${money(sub)}</span></div>
        <div><span>Delivery ${del === 0 ? '' : area === 'inside' ? '(inside Dhaka)' : '(outside Dhaka)'}</span><span>${del === 0 ? 'Free' : money(del)}</span></div>
        <div class="grand"><span>Total</span><span>${money(sub + del)}</span></div>
        ${S.freeDeliveryOver && sub < S.freeDeliveryOver ? `<p class="hint">Add ${money(S.freeDeliveryOver - sub)} more for free delivery.</p>` : ''}
      </div>`;
    if (step === 'cart') {
      body.innerHTML = lines + totals + `<button class="btn lg full" type="button" data-checkout>Checkout · Cash on delivery</button>`;
    } else {
      body.innerHTML = `
        <button type="button" class="back" data-back>← Back to bag</button>
        <form class="checkout" data-form novalidate>
          <label>Full name<input name="name" required autocomplete="name"></label>
          <label>Phone number<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX"></label>
          <label>Full address<textarea name="address" required rows="3" autocomplete="street-address" placeholder="House, road, area, thana, district"></textarea></label>
          <fieldset class="area"><legend>Delivery area</legend>
            <label><input type="radio" name="area" value="inside" ${area === 'inside' ? 'checked' : ''}> Inside Dhaka</label>
            <label><input type="radio" name="area" value="outside" ${area === 'outside' ? 'checked' : ''}> Outside Dhaka</label>
          </fieldset>
          <label>Note (optional)<input name="note" placeholder="Skin type, preferred time…"></label>
          ${totals}
          <p class="form-err" data-err hidden></p>
          <button class="btn lg full" type="submit">Place order on WhatsApp</button>
          <p class="hint">You pay cash when it arrives. We confirm every order on WhatsApp.</p>
        </form>`;
    }
  }

  function placeOrder(form) {
    const f = Object.fromEntries(new FormData(form));
    const err = $('[data-err]', form);
    const phone = (f.phone || '').replace(/[^\d+]/g, '');
    if (!f.name.trim() || !f.address.trim() || !/^(\+?88)?01\d{9}$/.test(phone)) {
      err.textContent = !/^(\+?88)?01\d{9}$/.test(phone) && f.name.trim() && f.address.trim()
        ? 'Please enter a valid Bangladeshi mobile number (01XXXXXXXXX).'
        : 'Please fill in your name, phone and address.';
      err.hidden = false;
      return;
    }
    const list = items(), sub = subtotal(), del = delivery(sub), total = sub + del;
    const orderId = 'LM' + Date.now().toString().slice(-6);
    const msg = [
      `🛍️ New order ${orderId}`,
      '',
      ...list.map(i => `• ${i.name}${i.size ? ' (' + i.size + ')' : ''} × ${i.q} = ${money(i.price * i.q)}`),
      '',
      `Subtotal: ${money(sub)}`,
      `Delivery: ${del === 0 ? 'Free' : money(del)} (${area === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'})`,
      `Total (COD): ${money(total)}`,
      '',
      `Name: ${f.name.trim()}`,
      `Phone: ${phone}`,
      `Address: ${f.address.trim()}`,
      f.note ? `Note: ${f.note.trim()}` : '',
    ].filter(l => l !== '').join('\n').replace(/\n(Subtotal|Name)/g, '\n\n$1').replace('\n•', '\n\n•');

    if (S.orderWebhook) {
      const payload = {
        orderId, createdAt: new Date().toISOString(), name: f.name.trim(), phone, address: f.address.trim(),
        area, note: f.note || '', items: list.map(i => ({ id: i.id, name: i.name, qty: i.q, price: i.price })),
        subtotal: sub, delivery: del, total, page: location.href,
      };
      try {
        navigator.sendBeacon
          ? navigator.sendBeacon(S.orderWebhook, new Blob([JSON.stringify(payload)], { type: 'text/plain' }))
          : fetch(S.orderWebhook, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      } catch (e) {}
    }
    track('Purchase', { value: total, currency: 'BDT', content_ids: list.map(i => i.id), num_items: list.length });

    cart = {};
    save();
    body.innerHTML = `
      <div class="done">
        <h3>Almost done!</h3>
        <p>Your order <strong>${orderId}</strong> is ready. Tap below to send it to us on WhatsApp. We'll confirm within minutes.</p>
        <a class="btn lg full" href="${wa(msg)}" rel="noopener" target="_blank">Send order on WhatsApp</a>
        <p class="hint">WhatsApp didn't open? Call or message ${S.phoneDisplay}.</p>
      </div>`;
    window.open(wa(msg), '_blank');
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.matches('[data-open-cart]')) return open();
    if (t.matches('[data-close-cart]')) return close();
    if (t.matches('[data-add]')) {
      const q = t.hasAttribute('data-with-qty') ? Math.max(1, parseInt($('[data-qty-input]').value, 10) || 1) : 1;
      add(t.dataset.add, q);
      const old = t.textContent;
      t.textContent = 'Added ✓';
      setTimeout(() => { t.textContent = old; }, 1200);
      if (t.hasAttribute('data-with-qty')) open();
      return;
    }
    if (t.matches('[data-buy-now]')) { add(t.dataset.buyNow, Math.max(1, parseInt($('[data-qty-input]').value, 10) || 1)); return open('form'); }
    if (t.matches('[data-qty]')) { const i = $('[data-qty-input]'); i.value = Math.max(1, (parseInt(i.value, 10) || 1) + +t.dataset.qty); return; }
    if (t.matches('[data-line]')) { const id = t.dataset.line; cart[id] += +t.dataset.d; if (cart[id] < 1) delete cart[id]; return save(); }
    if (t.matches('[data-rm]')) { delete cart[t.dataset.rm]; return save(); }
    if (t.matches('[data-checkout]')) { track('InitiateCheckout', { value: subtotal(), currency: 'BDT' }); step = 'form'; return render(); }
    if (t.matches('[data-back]')) { step = 'cart'; return render(); }
    if (t.matches('[data-ask]')) {
      e.preventDefault();
      const p = C[t.dataset.ask];
      track('Contact', { content_name: p.name });
      window.open(wa(`Hi! What's the price of ${p.name}${p.size ? ' (' + p.size + ')' : ''}? Is it in stock?\n${S.url.replace(/\/$/, '')}/p/${p.slug}.html`), '_blank');
      return;
    }
    if (t.matches('[data-wa-general]')) {
      e.preventDefault();
      track('Contact');
      window.open(wa(`Hi ${S.name}! I'd like to know more about your products.`), '_blank');
    }
  });
  document.addEventListener('change', e => {
    if (e.target.name === 'area') { area = e.target.value; const f = $('[data-form]'); const vals = f && Object.fromEntries(new FormData(f)); render(); if (vals) for (const k in vals) { const el = $(`[data-form] [name="${k}"]`); if (el && el.type !== 'radio') el.value = vals[k]; } }
  });
  document.addEventListener('submit', e => { if (e.target.matches('[data-form]')) { e.preventDefault(); placeOrder(e.target); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer && !drawer.hidden) close(); });

  // ---------- shop filters ----------
  const grid = $('[data-grid]');
  if (grid) {
    let cat = 'all', brand = 'all', q = '';
    const apply = () => {
      let shown = 0;
      $$('.card', grid).forEach(c => {
        const ok = (cat === 'all' || c.dataset.cat === cat) && (brand === 'all' || c.dataset.brand === brand) && (!q || q.split(/\s+/).every(w => c.dataset.search.includes(w)));
        c.hidden = !ok; if (ok) shown++;
      });
      $('[data-empty]').hidden = shown > 0;
    };
    $$('[data-filter]').forEach(b => b.addEventListener('click', () => { cat = b.dataset.filter; $$('[data-filter]').forEach(x => x.classList.toggle('on', x === b)); apply(); }));
    $$('[data-brand-filter]').forEach(b => b.addEventListener('click', () => { brand = b.dataset.brandFilter; $$('[data-brand-filter]').forEach(x => x.classList.toggle('on', x === b)); apply(); }));
    $('[data-search-input]').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
  }

  const pid = document.body.dataset.product;
  if (pid && C[pid]) track('ViewContent', { content_ids: [pid], content_name: C[pid].name, content_type: 'product', ...(C[pid].price != null && { value: C[pid].price, currency: 'BDT' }) });

  render();
})();
