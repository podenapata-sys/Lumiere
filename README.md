# Lumière

Online store for authentic Medicube and Celimax skincare in Bangladesh. It's a plain static site (no server, no database, free to host). Customers add products to a bag, enter their address, and the order arrives on your WhatsApp. Payment is cash on delivery.

## Before you share the link: 3 edits

1. **`data/site.json`**: set `whatsapp` (international format, no `+`, e.g. `8801712345678`), `phoneDisplay`, `facebookPage`, and your real `url` once you have a domain. Change the delivery charges if needed.
2. **`data/products.json`**: set `"price"` for every product (in taka, number only, e.g. `"price": 1850`). Optional: `"oldPrice"` shows a crossed-out price, and `"inStock": false` marks an item sold out. Products with no price show "Price on request" and an "Ask price" WhatsApp button.
3. Rebuild: `node build.mjs`. The build prints a warning for anything still missing.

Then commit and push. Every edit follows the same steps: change the JSON, run `node build.mjs`, push.

## Go live for free

- **Netlify** or **Cloudflare Pages**: "Import from GitHub", pick this repo, leave the build command empty, and set the publish directory to `/`. Every push redeploys.
- **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / root. This is free only if the repo is public.

A `.com` domain costs about $10/year. Point it at the host, then update `url` in `site.json` and rebuild.

## Turning on ad tracking and order logging

- **Meta Pixel**: put your Pixel ID in `metaPixelId`. The site sends `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` and `Contact` events, so Facebook ads can optimise for orders instead of clicks.
- **Order log in Google Sheets**: create a Make.com scenario that starts with a Custom Webhook and adds a Google Sheets row, then paste the webhook URL into `orderWebhook`. Every order is posted as JSON (order ID, customer, items, total) before WhatsApp opens. That way an order is recorded even if the customer never presses send.

## Files

| Path | What it is |
|---|---|
| `data/site.json` | Shop settings |
| `data/products.json` | 57 products (brand, name, size, category, tags, key ingredients, price) |
| `img/` | Product photos |
| `build.mjs` | Generates `index.html`, one SEO page per product in `p/`, `sitemap.xml`, `robots.txt` |
| `assets/` | Styles, cart/checkout script, generated catalog |

Generated files (`index.html`, `p/`, `assets/catalog.js`, `sitemap.xml`, `robots.txt`) are overwritten by every build. Edit the JSON, not those files.
