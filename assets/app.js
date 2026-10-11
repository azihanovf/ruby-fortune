/* Vanilla JS only: mobile navigation, policy dialogs, legacy popup URLs. */
(() => {
  'use strict';
  const header = document.getElementById('site-header');
  const nav = document.getElementById('main-nav');
  const menuButton = document.getElementById('menu-toggle');
  const dialog = document.getElementById('policy-dialog');
  const content = document.getElementById('policy-content');
  const closeButton = document.getElementById('policy-close');
  const knownPolicies = new Set(['cookie-policy', 'privacy-policy', 'terms-conditions', 'responsible-gambling']);
  let previouslyFocused = null;

  // Direct links to the original policy files open the corresponding popup.
  const legacyPolicy = document.body.dataset.policyPage;
  if (legacyPolicy && knownPolicies.has(legacyPolicy)) {
    const target = new URL('index.html', window.location.href);
    target.searchParams.set('policy', legacyPolicy);
    window.location.replace(target.href);
    return;
  }

  function syncHeader() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 28);
    }
  }
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  function closeNav() {
    if (!nav || !menuButton) return;
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Ouvrir le menu');
  }
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const opened = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', opened);
      menuButton.setAttribute('aria-expanded', String(opened));
      menuButton.setAttribute('aria-label', opened ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) closeNav();
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 1000) closeNav(); });
  }

  function modalOpen(name, focusSource) {
    if (!knownPolicies.has(name) || !dialog || !content) return false;
    const template = document.getElementById('policy-' + name);
    if (!template) return false;
    const clone = template.content.cloneNode(true);
    content.replaceChildren(clone);
    if (!dialog.open) {
      previouslyFocused = focusSource || document.activeElement;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    document.body.classList.add('modal-open');
    const scroller = dialog.querySelector('.policy-dialog__scroll');
    if (scroller) scroller.scrollTop = 0;
    if (closeButton) closeButton.focus({ preventScroll: true });
    return true;
  }
  function modalClose() {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }
  if (dialog) {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (previouslyFocused && previouslyFocused.isConnected && typeof previouslyFocused.focus === 'function') previouslyFocused.focus({preventScroll:true});
      previouslyFocused = null;
      const url = new URL(window.location.href);
      if (url.searchParams.has('policy')) {
        url.searchParams.delete('policy');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) modalClose();
    });
  }
  if (closeButton) closeButton.addEventListener('click', modalClose);

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    // Only intercept original policy filenames; preserve other links and anchors.
    const href = link.getAttribute('href') || '';
    const filename = href.split(/[?#]/, 1)[0].split('/').pop().replace(/\.html$/i, '');
    if (knownPolicies.has(filename) && /\.html(?:[?#]|$)/i.test(href)) {
      if (modalOpen(filename, link)) {
        event.preventDefault();
        closeNav();
      }
    } else if (dialog && dialog.open && /(?:^|\/)index\.html(?:[?#]|$)/i.test(href)) {
      event.preventDefault();
      modalClose();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeNav();
  });

  // Open a policy popup from a shareable legacy URL such as index.html?policy=privacy-policy.
  const requestedPolicy = new URLSearchParams(window.location.search).get('policy');
  if (requestedPolicy && knownPolicies.has(requestedPolicy)) {
    modalOpen(requestedPolicy, null);
  }
})();
