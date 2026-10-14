# Nightlist invitation replica

An editable, responsive Diwali Night invitation based on the public Nightlist design at `https://nightlist.framer.website/`. It includes the foil ticket opening, event poster, rotating Diwali celebration photos, map QR code, the uploaded Diwali Mix, and RSVP modal. The front end is plain HTML, CSS, and JavaScript.

## Run locally

```bash
node scripts/build-site.mjs
cd dist && python3 -m http.server 8080
```

Open `http://localhost:8080`. Deploy the generated `dist/` output when publishing. A static server does not run the pending RSVP endpoint.

## Edit the invitation

- Change the event text, organiser names, contribution note, map link, photo order, and RSVP URL in `content.js`.
- Replace images in `assets/` and update their paths in `content.js`. The city image is referenced in `index.html`.
- Change the color variables and layout in `styles.css`.
- Edit the HTML structure and form fields in `index.html`. The QR image in `assets/location-qr.svg` encodes the map URL; regenerate it when the location changes.
- The three MP3s are stored as 6 MiB chunks in `assets/audio-chunks/`. `node scripts/build-site.mjs` verifies their checksums and reassembles the original MP3s in `dist/assets/`. The `Publish Diwali Mix audio` GitHub Action also copies the assembled MP3s into `assets/` on `main`, the GitHub Pages source branch. Wait for that action and the subsequent Pages deployment before testing music at the GitHub Pages URL. To change the mix, split the replacement MP3s into chunks, update their checksums in `scripts/build-site.mjs`, and update paths and durations in `content.js`. Each assembled MP3 must stay below the host’s 25 MiB static asset limit.

The ticket tap starts the uploaded 57 minute Diwali Mix through the browser’s built-in audio player. Visitors can pause, resume, and seek through the set. It advances to the next MP3 part automatically. If a browser blocks playback or a part cannot load, the player shows a tap-to-play message. No music service or login is involved.

## RSVP to Google Sheets

The response sheet is [Diwali Night 2026 · Guest List RSVPs](https://docs.google.com/spreadsheets/d/17eTG3PZ0L_HZR9MJJTKnV9LYUyKryPpMPZxCWLNfZHY/edit). It has a private `RSVPs` tab with columns for IST submission time, name, email/Instagram, alcohol preference, and a duplicate-protection ID.

The Google Apps Script project files are in `integrations/google-apps-script/`. Its deployed `/exec` URL is set in `content.js`. The guest list card embeds the Google-hosted form, which writes to the private sheet without a guest login. The script validates each RSVP, escapes formula-like input, appends a timestamped row, and ignores repeated submission IDs. Use `node scripts/test-apps-script.mjs` to check its write logic locally. If you change the script, publish a new Apps Script deployment version; keep the Web app set to execute as the sheet owner and allow anyone to access.

The separate Worker bridge prototype in `worker/` is an optional future alternative. It can be checked with `node scripts/build-rsvp-worker.mjs && node scripts/test-worker.mjs`, but it cannot replace the static site as-is because its bundle does not include the large audio files.

If the Web app URL is removed, the form displays a clear setup message and does not claim to have saved a guest. The original Framer submission backend is not included. The current Sites audience is owner-private; guest access must be changed deliberately before sharing the invite outside the owner's account.

The invitation uses a generated Diwali night backdrop. The rotating postcard photos are the six images supplied by the host. Their order is controlled by `content.js`; the postcard frame size and shuffle animation are defined in `styles.css` and `app.js`. The original template’s purchase button and Framer attribution badge are service overlays, so they are excluded from this standalone code version.
