(() => {
  function trapFocus(element) {
    const focusable = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    return (event) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-site-nav]');
    const toggle = document.querySelector('[data-nav-toggle]');
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';

    if (nav && toggle) {
      let releaseFocus = () => {};
      const closeNav = () => {
        nav.dataset.open = 'false';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        overlay.remove();
        document.removeEventListener('keydown', releaseFocus);
      };

      const openNav = () => {
        nav.dataset.open = 'true';
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        document.body.appendChild(overlay);
        releaseFocus = trapFocus(nav);
        document.addEventListener('keydown', releaseFocus);
        const focusTarget = nav.querySelector('a, button');
        focusTarget?.focus();
      };

      toggle.addEventListener('click', () => {
        const isOpen = nav.dataset.open === 'true';
        if (isOpen) {
          closeNav();
        } else {
          openNav();
        }
      });

      overlay.addEventListener('click', closeNav);
      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 900) {
            closeNav();
          }
        });
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
          closeNav();
        }
      });
    }

    const yearTarget = document.querySelector('[data-year]');
    if (yearTarget) {
      yearTarget.textContent = new Date().getFullYear();
    }
  });
})();
