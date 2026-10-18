'use strict';
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  header.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Відкрити меню');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  header.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});
const wideLayout = window.matchMedia('(min-width: 1001px)');
wideLayout.addEventListener('change', () => closeMenu());
function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Progressive enhancement: content remains visible without JavaScript or observers.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = document.querySelectorAll(
  '.intro-grid, .feature-grid article, .audience-grid article, .chapters article, .editor-grid, .author-grid article, .partner-grid, .order-inner'
);
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        reveals.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealElements.forEach(element => {
    element.classList.add('reveal-ready');
    reveals.observe(element);
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      reveals.disconnect();
      revealElements.forEach(element => element.classList.add('is-visible'));
    }
  });
}

const videoSection = document.querySelector('#knowledge');
const backgroundVideo = document.querySelector('#knowledge-video');
const videoToggle = document.querySelector('.video-toggle');
let videoVisible = false;
let videoPaused = reducedMotion.matches;
let videoLoaded = false;
function updateVideoControl() {
  const paused = backgroundVideo.paused;
  videoToggle.setAttribute('aria-label', paused ? 'Відтворити фонове відео' : 'Призупинити фонове відео');
  videoToggle.querySelector('[aria-hidden]').textContent = paused ? '▶' : 'Ⅱ';
  videoToggle.querySelector('.video-toggle-label').textContent = paused ? 'Відтворити відео' : 'Призупинити відео';
}
function renderVideo() {
  const playing = videoVisible && !videoPaused && !document.hidden;
  if (playing) {
    if (!videoLoaded) {
      backgroundVideo.src = backgroundVideo.dataset.src;
      backgroundVideo.muted = true;
      videoLoaded = true;
    }
    // Autoplay can be refused by the browser; the visible control allows a retry.
    backgroundVideo.play().catch(() => {
      if (videoVisible && !document.hidden && !videoPaused) {
        videoPaused = true;
        updateVideoControl();
      }
    });
  } else {
    backgroundVideo.pause();
  }
  updateVideoControl();
}
videoToggle.hidden = false;
videoToggle.addEventListener('click', () => {
  videoPaused = !backgroundVideo.paused;
  renderVideo();
});
backgroundVideo.addEventListener('play', updateVideoControl);
backgroundVideo.addEventListener('pause', updateVideoControl);
backgroundVideo.addEventListener('error', () => {
  videoPaused = true;
  updateVideoControl();
});
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    videoPaused = true;
    renderVideo();
  }
});
document.addEventListener('visibilitychange', renderVideo);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    videoVisible = entries[0].isIntersecting;
    renderVideo();
  }, { threshold: 0 }).observe(videoSection);
} else {
  videoVisible = true;
  videoPaused = true;
}
renderVideo();

// Roll each digit once on first view; the final values remain accessible as text.
const statNumbers = document.querySelectorAll('.stat-number');
const digitAnimations = [];
function rollNumber(element) {
  if (reducedMotion.matches || typeof element.animate !== 'function') return;
  const digits = document.createDocumentFragment();
  [...element.dataset.number].forEach((digit, index) => {
    const window = document.createElement('span');
    window.className = 'digit-window';
    const strip = document.createElement('span');
    strip.className = 'digit-strip';
    const steps = 10 + Number(digit);
    for (let step = 0; step <= steps; step++) {
      const row = document.createElement('span');
      row.textContent = String(step % 10);
      strip.append(row);
    }
    const end = `translateY(-${steps}em)`;
    strip.style.transform = end;
    window.append(strip);
    digits.append(window);
    const animation = strip.animate([
      { transform: 'translateY(0)' }, { transform: end }
    ], { duration: 1500 + index * 220, easing: 'cubic-bezier(.16,1,.3,1)' });
    digitAnimations.push(animation);
    animation.finished.then(() => { strip.style.willChange = 'auto'; });
  });
  if (element.dataset.suffix) digits.append(document.createTextNode(element.dataset.suffix));
  element.replaceChildren(digits);
}
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const numberObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        rollNumber(entry.target);
        numberObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(element => numberObserver.observe(element));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      numberObserver.disconnect();
      digitAnimations.forEach(animation => animation.finish());
    }
  });
}
