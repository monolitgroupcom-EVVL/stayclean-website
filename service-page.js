/* =========================================================
   STAY CLEAN — скрипт сторінок послуг
   Підключається тільки на сторінках послуг, не на головній.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- мобільне меню ---------- */
  var burger = document.getElementById('hamburger');
  var mmenu = document.getElementById('mobileMenu');
  if (burger && mmenu) {
    burger.addEventListener('click', function () {
      var open = mmenu.classList.toggle('active');
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mmenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mmenu.classList.remove('active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- FAQ ---------- */
  document.querySelectorAll('.sp-faq__q').forEach(function (q) {
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', function () {
      var item = q.parentElement;
      var body = item.querySelector('.sp-faq__a');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.sp-faq__item').forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.sp-faq__a').style.maxHeight = null;
        i.querySelector('.sp-faq__q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- слайдер До / Після ---------- */
  document.querySelectorAll('[data-sp-ba]').forEach(function (view) {
    var after = view.querySelector('.sp-ba__after');
    var line = view.querySelector('.sp-ba__line');
    if (!after || !line) return;

    var set = function (pct) {
      pct = Math.max(2, Math.min(98, pct));
      after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      line.style.left = pct + '%';
    };
    set(50);

    var dragging = false;
    var moveTo = function (clientX) {
      var r = view.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
    };

    view.addEventListener('pointerdown', function (e) {
      dragging = true;
      view.setPointerCapture && view.setPointerCapture(e.pointerId);
      moveTo(e.clientX);
      e.preventDefault();
    });
    view.addEventListener('pointermove', function (e) {
      if (dragging) { moveTo(e.clientX); e.preventDefault(); }
    });
    var stop = function () { dragging = false; };
    view.addEventListener('pointerup', stop);
    view.addEventListener('pointercancel', stop);
    view.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* доступність з клавіатури */
    view.setAttribute('tabindex', '0');
    view.setAttribute('role', 'slider');
    view.setAttribute('aria-label', 'Порівняння до і після чистки');
    var pos = 50;
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { pos = Math.max(2, pos - 5); set(pos); e.preventDefault(); }
      if (e.key === 'ArrowRight') { pos = Math.min(98, pos + 5); set(pos); e.preventDefault(); }
    });
  });

  /* ---------- плаваючі кнопки: ховаємо над формою заявки ---------- */
  var floats = document.getElementById('floatingContact');
  var orderBlock = document.getElementById('order');
  if (floats && orderBlock && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { floats.classList.toggle('is-hidden', en.isIntersecting); });
    }, { threshold: 0.15 });
    io.observe(orderBlock);
  }

  /* ---------- відстеження кліків по контактах ---------- */
  function trackContactClick(selector, channel) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('click', function () {
        if (typeof gtag !== 'undefined') { gtag('event', 'contact', { event_category: 'Contact', event_label: channel }); }
        if (typeof fbq !== 'undefined') { fbq('track', 'Contact'); }
      });
    });
  }
  trackContactClick('a[href^="tel:"]', 'Phone');
  trackContactClick('a[href^="viber:"]', 'Viber');
  trackContactClick('a[href*="t.me"]', 'Telegram');
  trackContactClick('a[href*="instagram.com"]', 'Instagram');

  /* ---------- форма заявки ---------- */
  var form = document.getElementById('spForm');
  if (form) {
    var phone = form.querySelector('#spPhone');
    if (phone) {
      phone.addEventListener('input', function () {
        phone.value = phone.value.replace(/\D/g, '').slice(0, 9);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Надсилаємо…'; }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('bad response');
          form.style.display = 'none';
          var ok = document.getElementById('spFormOk');
          if (ok) ok.classList.add('on');
          if (window.fbq) window.fbq('track', 'Lead');
          if (window.gtag) window.gtag('event', 'conversion', { send_to: 'AW-18392652062/xONRCNSUuuwcEJ6ypsJE' });
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = original; }
          alert('Не вдалося надіслати заявку. Зателефонуйте, будь ласка: +38 (067) 708-84-25');
        });
    });
  }
})();
