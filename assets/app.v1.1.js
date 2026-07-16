(() => {
  const nodes = Array.from(document.querySelectorAll('[data-parallax]'));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!nodes.length) return;

  let frameRequested = false;
  let viewportHeight = window.innerHeight;
  let viewportWidth = window.innerWidth;

  function intensityScale() {
    if (viewportWidth < 768) return 0.42;
    if (viewportWidth < 1200) return 0.72;
    return 1;
  }

  function resetParallax() {
    nodes.forEach((node) => node.style.setProperty('--parallax-y', '0px'));
  }

  function renderParallax() {
    frameRequested = false;

    if (motionQuery.matches) {
      resetParallax();
      return;
    }

    const viewportCenter = viewportHeight / 2;
    const scale = intensityScale();

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const speed = Number.parseFloat(node.dataset.parallaxSpeed || '0');
      const maxOffset = Number.parseFloat(node.dataset.parallaxMax || '80') * scale;
      const nodeCenter = rect.top + rect.height / 2;
      const rawOffset = (nodeCenter - viewportCenter) * speed * scale;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

      node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  }

  function requestRender() {
    if (frameRequested || motionQuery.matches) return;
    frameRequested = true;
    window.requestAnimationFrame(renderParallax);
  }

  function handleResize() {
    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
    requestRender();
  }

  function handleMotionPreference() {
    if (motionQuery.matches) {
      resetParallax();
    } else {
      requestRender();
    }
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  motionQuery.addEventListener?.('change', handleMotionPreference);

  document.documentElement.classList.add('parallax-ready');
  requestRender();
})();
