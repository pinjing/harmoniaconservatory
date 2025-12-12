(() => {
  const scriptNode = document.currentScript;
  const dataUrl = scriptNode?.dataset.eventsUrl || 'https://script.google.com/macros/s/AKfycbx99pMR1HjhR84bfVosjKGR3lm0HomSpETeshO_-1NgmfEAMj5sCE3cucCPjg7H9zYM/exec';

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles'
  });

  const shortFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles'
  });

  const parseDate = (value) => {
    if (!value) return null;
    // Input is always YYYY-MM-DD format (date-only, no time component)
    const str = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return null;
    }
    
    // Parse as midnight Pacific time
    // Create date string with Pacific timezone offset (PST is UTC-8)
    // JavaScript Date will correctly handle DST when formatting
    const [year, month, day] = str.split('-').map(Number);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00-08:00`;
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  // Helper to get date components in Pacific timezone
  const getPacificDateParts = (date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
    const parts = formatter.formatToParts(date);
    return {
      year: parseInt(parts.find(p => p.type === 'year').value),
      month: parseInt(parts.find(p => p.type === 'month').value),
      day: parseInt(parts.find(p => p.type === 'day').value)
    };
  };

  const formatRange = (start, end) => {
    if (start && end) {
      const startParts = getPacificDateParts(start);
      const endParts = getPacificDateParts(end);
      const sameDay = startParts.year === endParts.year && 
                      startParts.month === endParts.month && 
                      startParts.day === endParts.day;
      if (sameDay) {
        return dateFormatter.format(start);
      }
      const sameMonth = startParts.year === endParts.year && startParts.month === endParts.month;
      if (sameMonth) {
        return `${shortFormatter.format(start)} – ${shortFormatter.format(end)} ${startParts.year}`;
      }
      return `${shortFormatter.format(start)} – ${shortFormatter.format(end)} ${endParts.year}`;
    }

    if (start) {
      return dateFormatter.format(start);
    }

    return null;
  };

  const buildCard = (event) => {
    const { title, location, details, tags = [] } = event;
    const rangeLabel = event.displayDate ?? formatRange(event.startDate, event.endDate) ?? 'Date TBA';
    const timeLabel = event.time ? ` · ${event.time}` : '';

    const meta = [location, event.time && !timeLabel.includes(event.time) ? event.time : null]
      .filter(Boolean)
      .join(' · ');

    const tagMarkup = tags
      .map((tag) => `<span class="event-card__tag">${tag}</span>`)
      .join('');

    return `
      <article class="event-card">
        <span class="event-card__date">${rangeLabel}${timeLabel}</span>
        <h3 class="event-card__title">${title}</h3>
        ${meta ? `<p class="event-card__meta">${meta}</p>` : ''}
        ${details ? `<p class="event-card__meta">${details}</p>` : ''}
        ${tagMarkup ? `<div class="event-card__tags">${tagMarkup}</div>` : ''}
      </article>
    `;
  };

  const classifyEvents = (events, scope) => {
    // Get today's date components in Pacific timezone
    const now = new Date();
    const todayParts = getPacificDateParts(now);

    const isUpcoming = (event) => {
      const end = event.endDate ?? event.startDate;
      if (!end) return true;
      // Get end date components in Pacific timezone
      const endParts = getPacificDateParts(end);
      // Compare date components (year, month, day)
      if (endParts.year > todayParts.year) return true;
      if (endParts.year < todayParts.year) return false;
      if (endParts.month > todayParts.month) return true;
      if (endParts.month < todayParts.month) return false;
      return endParts.day >= todayParts.day;
    };

    if (scope === 'past') {
      return events.filter((event) => !isUpcoming(event));
    }

    if (scope === 'all') {
      return events;
    }

    return events.filter((event) => isUpcoming(event));
  };

  const renderEvents = (container, events) => {
    if (!events.length) {
      const emptyMessage = container.dataset.eventsEmpty || 'New events will be posted soon.';
      container.innerHTML = `<p>${emptyMessage}</p>`;
      return;
    }

    const markup = events.map(buildCard).join('');
    container.innerHTML = `<div class="events-list">${markup}</div>`;
  };

  const renderLoading = (container) => {
    container.innerHTML = `
      <div class="events-panel__loading" aria-live="polite">
        <span class="events-panel__spinner" aria-hidden="true"></span>
        <span>Loading events…</span>
      </div>
    `;
  };

  const renderError = (container) => {
    container.innerHTML = '<p>We\'re having trouble loading events right now. Please refresh or try again later.</p>';
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const containers = document.querySelectorAll('[data-events]');
    if (!containers.length) return;

    containers.forEach((container) => renderLoading(container));

    let events = [];
    try {
      const response = await fetch(dataUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load events');
      const payload = await response.json();
      events = Array.isArray(payload) ? payload : payload.events ?? [];
    } catch (error) {
      console.error(error);
      containers.forEach((container) => renderError(container));
      return;
    }

    events = events
      .map((event) => ({
        ...event,
        startDate: parseDate(event.start),
        endDate: parseDate(event.end)
      }))
      .sort((a, b) => {
        const aTime = a.startDate ? a.startDate.getTime() : (a.endDate ? a.endDate.getTime() : Infinity);
        const bTime = b.startDate ? b.startDate.getTime() : (b.endDate ? b.endDate.getTime() : Infinity);
        return aTime - bTime;
      });

    containers.forEach((container) => {
      const scope = container.dataset.events || 'upcoming';
      const limit = Number(container.dataset.eventsCount) || null;
      const category = container.dataset.eventsCategory;
      const tag = container.dataset.eventsTag;

      let scopedEvents = classifyEvents(events, scope);

      if (category) {
        scopedEvents = scopedEvents.filter((event) =>
          (event.category || '').toLowerCase() === category.toLowerCase()
        );
      }

      if (tag) {
        scopedEvents = scopedEvents.filter((event) =>
          (event.tags || []).some((value) => value.toLowerCase() === tag.toLowerCase())
        );
      }

      if (limit) {
        scopedEvents = scopedEvents.slice(0, limit);
      }

      renderEvents(container, scopedEvents);
    });
  });
})();
