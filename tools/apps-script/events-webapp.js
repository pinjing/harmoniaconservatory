/**
 * Publishes the Events sheet as JSON for the static site.
 * GET https://script.google.com/macros/s/DEPLOYMENT_ID/exec
 */
const SHEET_NAME = 'Events';
const CACHE_SECONDS = 60; // adjust for freshness/perf balance

function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('events');
  if (cached) {
    return buildResponse(cached);
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return buildResponse(JSON.stringify([]));
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) {
    return buildResponse(JSON.stringify([]));
  }

  const [headers, ...rows] = values;
  const events = rows
    .filter((row) => row[0])
    .map((row) => {
      const entry = {};
      headers.forEach((header, idx) => {
        const key = header.trim();
        if (!key) return;
        const value = row[idx]?.trim();
        if (!value) return;
        entry[key] = key === 'tags'
          ? value.split(',').map((tag) => tag.trim()).filter(Boolean)
          : value;
      });
      return entry;
    });

  const payload = JSON.stringify(events);
  cache.put('events', payload, CACHE_SECONDS);
  return buildResponse(payload);
}

function buildResponse(payload) {
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}
