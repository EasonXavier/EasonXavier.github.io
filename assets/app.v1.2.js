(() => {
  const parallaxNodes = Array.from(document.querySelectorAll('[data-parallax]'));
  const fadeCards = Array.from(document.querySelectorAll('.tool-card'));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabletQuery = window.matchMedia('(min-width: 768px)');

  let frameRequested = false;
  let viewportHeight = window.innerHeight;
  let viewportWidth = window.innerWidth;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function intensityScale() {
    if (viewportWidth < 768) return 0.42;
    if (viewportWidth < 1200) return 0.72;
    return 1;
  }

  function resetParallax() {
    parallaxNodes.forEach((node) => node.style.setProperty('--parallax-y', '0px'));
  }

  function resetFades() {
    fadeCards.forEach((card) => {
      card.style.setProperty('--scroll-visibility', '1');
      card.style.setProperty('--scroll-shift', '0px');
    });
  }

  function renderParallax() {
    if (!parallaxNodes.length) return;

    const viewportCenter = viewportHeight / 2;
    const scale = intensityScale();

    parallaxNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const speed = Number.parseFloat(node.dataset.parallaxSpeed || '0');
      const maxOffset = Number.parseFloat(node.dataset.parallaxMax || '80') * scale;
      const nodeCenter = rect.top + rect.height / 2;
      const rawOffset = (nodeCenter - viewportCenter) * speed * scale;
      const offset = clamp(rawOffset, -maxOffset, maxOffset);

      node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  }

  function renderFades() {
    if (!fadeCards.length || !tabletQuery.matches) {
      resetFades();
      return;
    }

    const upperEdge = viewportHeight * 0.13;
    const lowerEdge = viewportHeight * 0.90;
    const fadeDistance = Math.max(120, viewportHeight * 0.19);

    fadeCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const enteringFromBottom = clamp((lowerEdge - rect.top) / fadeDistance, 0, 1);
      const leavingAtTop = clamp((rect.bottom - upperEdge) / fadeDistance, 0, 1);
      const visibility = Math.min(enteringFromBottom, leavingAtTop);

      let shift = 0;
      if (rect.top > lowerEdge - fadeDistance) {
        shift = (1 - enteringFromBottom) * 26;
      } else if (rect.bottom < upperEdge + fadeDistance) {
        shift = -(1 - leavingAtTop) * 26;
      }

      card.style.setProperty('--scroll-visibility', visibility.toFixed(3));
      card.style.setProperty('--scroll-shift', `${shift.toFixed(2)}px`);
    });
  }

  function render() {
    frameRequested = false;

    if (motionQuery.matches) {
      resetParallax();
      resetFades();
      return;
    }

    renderParallax();
    renderFades();
  }

  function requestRender() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(render);
  }

  function handleResize() {
    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
    requestRender();
  }

  function handleMotionPreference() {
    if (motionQuery.matches) {
      resetParallax();
      resetFades();
    } else {
      requestRender();
    }
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  motionQuery.addEventListener?.('change', handleMotionPreference);
  tabletQuery.addEventListener?.('change', requestRender);

  document.documentElement.classList.add('motion-ready');
  requestRender();
})();
