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
- The three MP3s are stored as 6 MiB chunks in `assets/audio-chunks/` so the complete mix fits in this repository. `node scripts/build-site.mjs` verifies their checksums and reassembles the original MP3s in `dist/assets/`. To change the mix, split the replacement MP3s into chunks, update their checksums in `scripts/build-site.mjs`, and update paths and durations in `content.js`. Each assembled MP3 must stay below the host’s 25 MiB static asset limit.

The ticket tap starts the uploaded 57 minute Diwali Mix through the browser’s built-in audio player. Visitors can pause, resume, and seek through the set. It advances to the next MP3 part automatically. If a browser blocks playback or a part cannot load, the player shows a tap-to-play message. No music service or login is involved.

## RSVP to Google Sheets

The response sheet is [Diwali Night 2026 · Guest List RSVPs](https://docs.google.com/spreadsheets/d/17eTG3PZ0L_HZR9MJJTKnV9LYUyKryPpMPZxCWLNfZHY/edit). It has a private `RSVPs` tab with columns for IST submission time, name, email/Instagram, alcohol preference, and a duplicate-protection ID.

The Google Apps Script code is in `integrations/google-apps-script/`. It has not yet been deployed, so RSVP submission is not live. The separate Worker bridge prototype in `worker/` can be checked with `node scripts/build-rsvp-worker.mjs && node scripts/test-worker.mjs`; it must not replace the static site as-is, because its bundle does not include these large audio files. A production backend needs to keep the audio on the same static host or in a file store while adding the `/api/rsvp` route. The web app then needs to execute as the sheet owner and allow anonymous access, and `content.js` needs `rsvpEndpoint: "/api/rsvp"` after the bridge is deployed. The bridge validates the request and confirms Google's success response before telling a guest their RSVP was received. The script appends a timestamped row and ignores repeated submission IDs.

Until the web app URL is configured, the form displays a clear setup message and does not claim to have saved a guest. The original Framer submission backend is not included. The current Sites audience is owner-private; guest access must be changed deliberately before sharing the invite outside the owner's account.

The invitation uses a generated Diwali night backdrop. The rotating postcard photos are the six images supplied by the host. Their order is controlled by `content.js`; the postcard frame size and shuffle animation are defined in `styles.css` and `app.js`. The original template’s purchase button and Framer attribution badge are service overlays, so they are excluded from this standalone code version.
