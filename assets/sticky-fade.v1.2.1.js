(() => {
  const cards = Array.from(document.querySelectorAll('.tool-card'));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabletQuery = window.matchMedia('(min-width: 768px)');

  if (!cards.length) return;

  let frameRequested = false;
  let viewportHeight = window.innerHeight;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function reset() {
    cards.forEach((card) => {
      card.style.setProperty('--scroll-visibility', '1');
      card.style.setProperty('--scroll-shift', '0px');
    });
  }

  function render() {
    frameRequested = false;

    if (motionQuery.matches || !tabletQuery.matches) {
      reset();
      return;
    }

    const upperEdge = viewportHeight * 0.13;
    const lowerEdge = viewportHeight * 0.90;
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
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(render);
  }

  function handleResize() {
    viewportHeight = window.innerHeight;
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  motionQuery.addEventListener?.('change', requestRender);
  tabletQuery.addEventListener?.('change', requestRender);

  document.documentElement.classList.add('sticky-fade-ready');
  requestRender();
})();
