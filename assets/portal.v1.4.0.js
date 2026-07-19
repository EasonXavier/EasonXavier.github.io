(() => {
  const root = document.documentElement;
  const themeColor = document.querySelector('#theme-color');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = document.querySelector('.theme-toggle-icon');
  const themeStorageKey = 'eason-tools-theme';
  const themes = new Set(['dark', 'light']);

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;

    if (themeColor) {
      themeColor.content = theme === 'dark' ? '#0f0f11' : '#f5f5f7';
    }

    if (themeToggle) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      themeToggle.setAttribute('aria-label', `切换为${nextTheme === 'light' ? '亮色' : '暗色'}主题`);
      themeToggle.setAttribute('title', `切换为${nextTheme === 'light' ? '亮色' : '暗色'}主题`);
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    }

    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '\u2600' : '\u263e';
    }

    if (persist) {
      try {
        localStorage.setItem(themeStorageKey, theme);
      } catch {
        // Theme selection still works when storage is unavailable.
      }
    }
  }

  let initialTheme = 'dark';

  try {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (themes.has(savedTheme)) {
      initialTheme = savedTheme;
    }
  } catch {
    // Keep the documented dark default when storage is unavailable.
  }

  applyTheme(initialTheme, false);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabletQuery = window.matchMedia('(min-width: 768px)');
  const parallaxNodes = Array.from(document.querySelectorAll('[data-parallax]'));
  const cards = Array.from(document.querySelectorAll('.tool-card'));
  let frameRequested = false;
  let viewportHeight = window.innerHeight;
  let viewportWidth = window.innerWidth;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function resetParallax() {
    parallaxNodes.forEach((node) => node.style.setProperty('--parallax-y', '0px'));
  }

  function resetCardFade() {
    cards.forEach((card) => {
      card.style.setProperty('--scroll-visibility', '1');
      card.style.setProperty('--scroll-shift', '0px');
    });
  }

  function render() {
    frameRequested = false;

    if (motionQuery.matches) {
      resetParallax();
      resetCardFade();
      return;
    }

    const intensity = viewportWidth < 768 ? 0.42 : viewportWidth < 1200 ? 0.72 : 1;
    const viewportCenter = viewportHeight / 2;

    parallaxNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const speed = Number.parseFloat(node.dataset.parallaxSpeed || '0');
      const maxOffset = Number.parseFloat(node.dataset.parallaxMax || '80') * intensity;
      const nodeCenter = rect.top + rect.height / 2;
      const offset = clamp((nodeCenter - viewportCenter) * speed * intensity, -maxOffset, maxOffset);
      node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });

    if (!tabletQuery.matches) {
      resetCardFade();
      return;
    }

    const upperEdge = viewportHeight * 0.13;
    const lowerEdge = viewportHeight * 0.9;
    const fadeDistance = Math.max(120, viewportHeight * 0.19);

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const entering = clamp((lowerEdge - rect.top) / fadeDistance, 0, 1);
      const leaving = clamp((rect.bottom - upperEdge) / fadeDistance, 0, 1);
      const visibility = Math.min(entering, leaving);
      let shift = 0;

      if (rect.top > lowerEdge - fadeDistance) {
        shift = (1 - entering) * 26;
      } else if (rect.bottom < upperEdge + fadeDistance) {
        shift = -(1 - leaving) * 26;
      }

      card.style.setProperty('--scroll-visibility', visibility.toFixed(3));
      card.style.setProperty('--scroll-shift', `${shift.toFixed(2)}px`);
    });
  }

  function requestRender() {
    if (frameRequested) {
      return;
    }

    frameRequested = true;
    window.requestAnimationFrame(render);
  }

  function handleResize() {
    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  motionQuery.addEventListener?.('change', requestRender);
  tabletQuery.addEventListener?.('change', requestRender);
  requestRender();
})();
