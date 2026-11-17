# Quinby Partners website

A fast, static site for quinbypartners.com. `node build.js` builds it into `dist/`. No other tools needed.

## Publish it (one-time setup)

1. Create an empty private GitHub repo, e.g. `quinby-partners-site`, and push this folder to it.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
   - Build command: `node build.js`
   - Build output directory: `dist`
3. It goes live on a `*.pages.dev` address first. Review it there.
4. When ready, add the custom domain `www.quinbypartners.com` in Cloudflare Pages and move the domain off Squarespace.
5. After launch: submit `https://www.quinbypartners.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools.

Every change pushed to GitHub republishes the site automatically.

## Editing content (Pages CMS)

Day-to-day content lives in `content/*.json` and is edited at **app.pagescms.org**:
The Collection, the giving record (totals add up automatically), testimonials, the publication feature and Register,
neighborhood pages and areas, the homepage hero and "We sell…" phrases, and site settings (including the publication name).
Photos uploaded there go to `src/media`. Saving commits to GitHub and the site republishes in a minute or two.
What appears in the editor is set in `.pages.yml`.

Longer page copy (Why Quinby, Selling, Buying, guides) stays in `build.js`; ask Claude to change it.

## Lead capture and the books

- Every form (consultations, contact, newsletter, books) posts to `/api/lead` (`functions/api/lead.js`), which creates or updates
  the contact in Go High Level and **adds** tags (never replaces them), plus a note with any message or mailing address.
- Cloudflare Pages environment variables: `GHL_LOCATION_ID` (Quinby Partners) and `GHL_TOKEN` (a GHL Private Integration token with
  contacts read/write; add it as an encrypted secret). Until the token is set, forms still thank the visitor but nothing is saved.
- Tags: `src: website`, plus `form: seller consult`, `form: buyer consult`, `form: consult`, `form: contact`,
  `newsletter: the front porch`, `book: master`, `book: personalized`, the book's own tag, `book-request: printed copy`, `book-request: consultation`.
- **Master book:** `/book`. Asks for name and email after `gateAfter` pages. Add `?known=1` to the link (e.g. in a GHL trigger link to
  existing contacts) to skip the ask.
- **Personalized books:** `/book/[slug]`, set in `content/books.json`. Never gated. Send through a GHL trigger link so clicks are recorded.
- Books are hidden from search (noindex) and left out of the sitemap and llms.txt. "Save as PDF" prints every page.

## Where things live

- `build.js`: every page's words, the menu, neighborhoods and areas (`HOODS`, `AREAS`), and the publication's name (`PUB`, currently a placeholder).
- `src/styles.css`, `src/main.js`: look and behavior (menu, b-roll loading, the "We sell…" line).
- `src/assets/`: logo. `src/video/`: b-roll clips (list them in `VIDEO` at the top of `build.js`).
- `src/fonts/`: add the licensed Larken files as `Larken-Light.woff2` and `Larken-Regular.woff2`. Until then headlines use Newsreader.
- `public/`: robots.txt, redirects from old Squarespace addresses, headers.
- Generated automatically: `sitemap.xml`, `llms.txt`, and schema labels on every page.

## Before launch

- [ ] Publication name (replace `[Publication name]` via `PUB`)
- [ ] B-roll clips: 10–20 sec, silent, compressed (~3–6 MB), plus a still and a small phone version for each
- [ ] Larken font files
- [ ] Go High Level forms: drop the embed code into each `ghl-form` slot (newsletter, contact, seller-consult, buyer-consult, consult). Until then they show phone and email.
- [ ] Giving totals and the gift record
- [ ] Collection homes, publication feature, testimonials (all `[bracketed]` placeholders)
- [ ] Photos of Becky and Elena
- [ ] Old Squarespace URLs: check Search Console for any with traffic and add them to `public/_redirects`

## Facts to check

Written from general knowledge; confirm before launch.

- Neighborhood summaries and one-liners in `HOODS` and `AREAS` (styles, eras, landmarks). Each full page also has `[bracketed]` spots for notable architects, streets and landmarks.
- Country Club District: 1920s planning and period-revival homes.
- Golden Valley: Tyrol Hills and Parkwood Knolls described as mid-century.
- Whether to call Quinby queer-owned on Why Quinby and in `llms.txt`.

## Fair Housing

Neighborhood and area pages describe places (homes, architecture, parks, landmarks), never people or who a neighborhood is "good for." Keep new copy that way.
