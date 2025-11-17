(() => {
  const scriptNode = document.currentScript;
  const dataUrl = scriptNode?.dataset.eventsUrl || 'https://script.google.com/macros/s/AKfycbx99pMR1HjhR84bfVosjKGR3lm0HomSpETeshO_-1NgmfEAMj5sCE3cucCPjg7H9zYM/exec';

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const shortFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatRange = (start, end) => {
    if (start && end) {
      const sameDay = start.toDateString() === end.toDateString();
      if (sameDay) {
        return dateFormatter.format(start);
      }
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      if (sameMonth) {
        return `${shortFormatter.format(start)} – ${shortFormatter.format(end)} ${start.getFullYear()}`;
      }
      return `${shortFormatter.format(start)} – ${shortFormatter.format(end)} ${end.getFullYear()}`;
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
    const today = new Date();

    const isUpcoming = (event) => {
      const end = event.endDate ?? event.startDate;
      if (!end) return true;
      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);
      return endDay >= today;
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
