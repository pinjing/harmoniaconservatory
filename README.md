# Harmonia Conservatory static site

A modern, lightweight rebuild of [harmoniaconservatory.com](https://harmoniaconservatory.com) designed for GitHub Pages hosting. The project contains plain HTML, CSS, JavaScript, and JSON so it can be edited directly from the GitHub web interface without a build step.

## Project structure

```
.
├── assets/
│   ├── css/styles.css         # Global typography, layout, and components
│   ├── js/events.js           # Renders events from the Google Sheets endpoint
│   ├── js/site.js             # Navigation toggle + footer helpers
│   └── images/                # Local copies of hero + portrait photography
├── tools/apps-script/         # Google Apps Script source for the events feed
├── *.html                     # Individual static pages
└── README.md
```

Open any of the `.html` files in a browser (double-clicking works) to preview locally. When deployed, drop the contents of this folder into the root of a GitHub Pages repository (for example `username.github.io` or the `/docs` folder of another repo).

## Editing events via Google Sheets

Events now live in a shared Google Sheet so updates do not require Git changes. Workflow:

1. Create or open a Google Sheet tab named **Events** with headers: `title`, `start`, `end`, `time`, `location`, `details`, `displayDate`, `category`, `tags`. You can paste data from any CSV export using those columns.
2. Use the Apps Script in `tools/apps-script/events-webapp.js` (paste into **Extensions → Apps Script**) and deploy it as a Web App. Keep **Execute as** "Me" and set access to "Anyone" or "Anyone with Google account". Copy the `/exec` URL.
3. Update each page’s `<script src="assets/js/events.js" data-events-url="...">` to point at that Web App URL (already wired up in this repo to `https://script.google.com/macros/s/AKfycbx99pMR1HjhR84bfVosjKGR3lm0HomSpETeshO_-1NgmfEAMj5sCE3cucCPjg7H9zYM/exec`).
4. Share the sheet with the studio owner as an Editor. To add or edit an event, they simply update the sheet row—columns correspond to the JSON keys (`title`, `start`, `end`, `time`, `location`, `details`, `displayDate`, `category`, `tags`). Multiple tags can be comma-separated in one cell.

Apps Script caches the serialized JSON for 60 seconds, so updates appear roughly in real time without redeploying the static site. The script also includes a fallback message if the feed can’t load.

## Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g., `harmonia-conservatory-site`).
2. Copy these files into the repo root.
3. Enable Pages (Settings → Pages → Deploy from `main` branch `/root` or `/docs`).
4. Visit the provided URL once the deployment completes.

## Local tweaks

- **Navigation**: links are hard-coded in each page so you can update them with any text editor.
- **Styling**: adjust palettes, fonts, or spacing in `assets/css/styles.css`.
- **Images**: replace the photos inside `assets/images/` and update the `img` tags or hero styles if needed.

Need to reconfigure the Apps Script later? Reuse the code in `tools/apps-script/events-webapp.js`, redeploy the web app, and swap the `data-events-url` attributes with the new endpoint.

Feel free to open an issue or reach out through email if you want to extend the site with forms, analytics, or a blog in the future.
