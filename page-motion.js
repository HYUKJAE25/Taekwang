(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('tk-motion-ready');

  const revealSelectors = [
    'header',
    'main > section',
    'section > div',
    'article',
    '.cert-card-modern',
    '.equipment-item'
  ].join(',');

  const seen = new WeakSet();
  let observer = null;
  let curtain = null;

  function ensureCurtain() {
    if (reduceMotion) return null;
    if (curtain && document.body.contains(curtain)) return curtain;
    curtain = document.createElement('div');
    curtain.className = 'tk-page-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    Object.assign(curtain.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483000',
      background: '#fff',
      opacity: '1',
      pointerEvents: 'none',
      transition: 'opacity 320ms ease'
    });
    document.body.appendChild(curtain);
    return curtain;
  }

  function shouldReveal(el) {
    if (!el || seen.has(el)) return false;
    if (el.closest('nav')) return false;
    if (el.id === '__bundler_loading' || el.id === '__bundler_thumbnail' || el.id === '__bundler_err') return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 40 && rect.height >= 24;
  }

  function prepareReveal(root) {
    if (reduceMotion || !observer) return;
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = Array.from(scope.querySelectorAll(revealSelectors)).filter(shouldReveal);
    nodes.forEach((el, index) => {
      seen.add(el);
      el.classList.add('tk-reveal');
      el.style.setProperty('--tk-delay', `${Math.min(index % 6, 5) * 45}ms`);
      observer.observe(el);
    });
  }

  function setupReveal() {
    if (reduceMotion || observer) return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('tk-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    prepareReveal(document);
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) prepareReveal(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  function setupPageTransitions() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

      const url = new URL(href, window.location.href);
      const samePageHash = url.pathname === window.location.pathname && url.search === window.location.search && url.hash;
      if (samePageHash) return;
      if (url.origin !== window.location.origin && window.location.protocol !== 'file:') return;

      event.preventDefault();
      const curtainEl = ensureCurtain();
      if (curtainEl) curtainEl.style.opacity = '1';
      document.documentElement.classList.add('tk-page-leaving');
      window.setTimeout(() => {
        window.location.href = url.href;
      }, reduceMotion ? 0 : 220);
    }, true);
  }

  function boot() {
    const curtainEl = ensureCurtain();
    window.requestAnimationFrame(() => {
      document.documentElement.classList.add('tk-motion-ready', 'tk-page-loaded');
      if (curtainEl) curtainEl.style.opacity = '0';
      setupReveal();
      setupPageTransitions();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
