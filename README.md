# Abdulsamad Aliyu — Portfolio

A static portfolio site (plain HTML, CSS and JavaScript — no build step, no dependencies). The home page is the **Departures** concept. Two other concepts, Catalogue and Mixtape, sit alongside it and show the same content, which lives in one file.

| Folder | Concept | Feel | Interactive parts |
|---|---|---|---|
| `departures/` | **A · Departures** — an airport split-flap board | Dark, dramatic | Flip-in letter tiles, status filters, clickable "flights" that open a boarding-pass case study, live local clock |
| `catalogue/` | **B · Card catalogue** — a library index-card drawer | Calm, editorial | Lettered tabs + prev/next pull a project card to the front, spinning "available" stamp with the current month |
| `mixtape/` | **C · Mixtape** — a cassette with your projects as tracks | Bright, playful | Play/pause/skip spins the reels and runs the progress bar, auto-advances, tracklist loads notes, equaliser on current track |

`index.html` at the root is the home page: a copy of the home concept, written by `tools/sync-html.js`. Edit `departures/index.html`, not the root copy. `concepts.html` is a small picker linking to all three. Only the home page is offered to search engines; the other concepts and the picker are marked `noindex`.

To switch the home page to another concept, set `meta.home` in `shared/content.js` and run `node tools/sync-html.js`.

## Preview locally

Open `index.html` in a browser, or run a tiny local server from this folder:

```bash
python3 -m http.server 8000
# or
npx serve .
```

A local server is needed for the offline mode (service worker) and for the content check below. Everything else works straight from the file. (Opened from the file, the browser console shows a font preload warning. The fonts still load.)

## How to edit content

| To change | Edit |
|---|---|
| Any fact: projects, about, skills, contact, experience | `shared/content.js`, then run `node tools/sync-html.js` to write it into the pages |
| Wording that isn't in `content.js` (headings, button labels, the name in the hero, page title) | Each concept's `index.html`, then run `node tools/sync-html.js` so the home page picks it up |
| A link that isn't ready (GitHub, CV, a project link) | Leave it `null` in `shared/content.js` and its button stays hidden. Set it and the button appears |
| Colours and fonts | The `:root` tokens at the top of each concept's `styles.css` |
| How a project maps onto a flight, card or track | The small mapping function at the top of each concept's `script.js` |

The text and the project lists are kept in the HTML as well as in `content.js`, so that search engines and visitors without JavaScript still see them. `tools/sync-html.js` does the copying: text, project markup, the structured data in each `<head>` and the home page. After any content change, run it, then start a local server and open `/tools/check.html`. That confirms the HTML matches `content.js`, that every project renders, and that no placeholder or unwanted wording has slipped in. Every row should say PASS.

Still to supply:

- `contact.github`
- The CV is `assets/Abdulsamad_Aliyu_CV.pdf`, exported from the Word master. To replace it, export a new PDF over that file (or save another file in `assets/` and set `contact.cv` to its path)
- Each project's `link`, where there is a public repo or write-up
- The site's final address (see "Before deploying")

## What each page does

- **Deep links.** Every project has its own address, for example `/#text-to-sql` on the home page. Back and Forward step through what was opened. The Departures filter is in the address too (`?status=departed`).
- **Keyboard.** Departures: Up/Down move through the board, Enter opens a boarding pass, Esc closes it. Catalogue: Left/Right flip cards, A–E jump to a tab. Mixtape: Space plays or pauses, J and L skip, 1–5 play a track, Up/Down move through the tracklist. Hovering a control shows its shortcut.
- **Touch.** Swipe left or right on the catalogue card or the cassette deck. The catalogue card follows the finger. Tapping a flight on a phone scrolls to its boarding pass.
- **Split-flap.** Changing the Departures filter spins the letters and digits on the board before they settle.
- **Departures motion.** A power-on intro on the first visit, an announcements ticker, a flip clock, rows that roll in on scroll, a boarding-pass printer that tears off the old pass, a plane that follows the scroll down the right edge (wide screens), a preview pass that follows the mouse, a "Copy email" stamp, a contact block that lands like a runway, and optional sound (off until switched on, bottom right). The footer has a Motion switch (Full or Calm) and "Replay intro". Add `?intro` to the address to see the intro again.
- **Tape.** In Mixtape the progress bar can be clicked or dragged, the reels show how much tape is left, and the "Press play" sticker starts playback.
- **Copy a link.** Clicking a flight code, card code or "Track 01 · notes" copies that project's link.
- **Memory.** Each page remembers the last project (and the Departures filter) until the tab is closed.
- **Print.** Printing any concept gives a plain black-on-white summary (a backup CV), built from `content.js`.
- **Without JavaScript.** Every project is still listed, with the first one's details.
- **Not found.** `404.html` is shown for any address that doesn't exist, in the Departures style.
- **Offline.** After one visit over https the site loads without a connection (`sw.js`). Bump `VERSION` in `sw.js` if a visitor ever seems stuck on old files.
- **Reduced motion.** All animation and auto-advance stop when the visitor's system asks for reduced motion. On Departures the footer switch overrides the system setting either way, and the choice is remembered.

## Files

- `departures/boot.js` — runs before the page is drawn (Calm mode and the intro). `departures/extras.js` — the Departures effects, one commented block each; delete a block to remove that effect.
- `shared/content.js` — all content. `shared/site.js` — behaviour common to the three concepts. `shared/print.css` — the print summary.
- `assets/` — favicons, app icons and share images per concept, plus `picker.css` for `concepts.html`.
- `assets/fonts/` — the font files, served from the site itself (no requests to Google), one stylesheet per concept, and their licence.
- `index.html` — the home page (generated). `concepts.html` — the picker. `404.html` — the not-found page.
- `manifest.webmanifest` (root and one per concept), `sw.js` — installable and offline.
- `_headers`, `robots.txt` — deployment files.
- `tools/sync-html.js` — writes `content.js` into the pages. `tools/check.html` — the content check. `tools/set-domain.js` — writes the site address into the pages.

## Before deploying

Once the address is known, run this once from the folder:

```bash
node tools/set-domain.js https://your-address
```

It writes the canonical link, `og:url` and absolute share-image URLs into each page, points `404.html` at the site folder, creates `sitemap.xml` (the home page only) and adds it to `robots.txt`.

## Deploying

Any static host works. Deploy the whole folder so the pages can find `shared/` and `assets/`. GitHub Pages, Netlify and Cloudflare Pages all serve `404.html` for missing addresses without any setup.

- **GitHub Pages** — free, and gives a public GitHub profile at the same time. It ignores `_headers`, so the Content-Security-Policy in each page's `<meta>` tag does that job; the other three headers (`Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`) can't be set there.
- **Netlify or Cloudflare Pages** — `_headers` works as is and sends all four security headers.

The policy allows the site's own files only, with no inline scripts or styles. Keep any new JavaScript or CSS in files.
