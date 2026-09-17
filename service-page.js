/* =========================================================
   STAY CLEAN — скрипт сторінок послуг
   Підключається тільки на сторінках послуг, не на головній.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- перемикач теми ---------- */
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#0a0f0c' : '#f7faf8');
      try { localStorage.setItem('sc_theme', next); } catch (e) {}
    });
  }

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

    // pos — єдине джерело правди про позицію повзунка.
    // Раніше перетягування його не оновлювало, тому після миші
    // стрілки на клавіатурі стрибали назад на 50%.
    var pos = 50;
    var set = function (pct) {
      pos = Math.max(2, Math.min(98, pct));
      after.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      line.style.left = pos + '%';
      view.setAttribute('aria-valuenow', Math.round(pos));
    };

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
    view.setAttribute('aria-label', document.documentElement.lang === 'ru'
      ? 'Сравнение до и после чистки'
      : 'Порівняння до і після чистки');
    // role="slider" без valuemin/valuemax/valuenow — невалідний ARIA:
    // зчитувач екрана оголошує повзунок без значення.
    view.setAttribute('aria-valuemin', '0');
    view.setAttribute('aria-valuemax', '100');
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { set(pos - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(pos + 5); e.preventDefault(); }
    });

    set(50);
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
    var isRu = document.documentElement.lang === 'ru';
    var nameInput = form.querySelector('#spName');
    var phone = form.querySelector('#spPhone');
    var honeypot = form.querySelector('#spWebsite');
    var nameGroup = nameInput ? nameInput.closest('.form-group') : null;
    var phoneGroup = phone ? phone.closest('.form-group') : null;

    function validateName(v) { return v.trim().length > 0 && !/\d/.test(v); }
    function validatePhone(v) { return /^\d{9}$/.test(v); }

    // Людина часто вставляє номер разом із кодом країни: "+380 50 037 84 62"
    // або в локальному форматі "050...". Прибираємо префікси, інакше код країни
    // залишиться в номері, а справжні цифри обріжуться — і номер стане чужим.
    function normalizePhone(raw) {
      var d = raw.replace(/\D/g, '');
      while (d.length > 9) {
        if (d.indexOf('380') === 0) { d = d.slice(3); }
        else if (d.charAt(0) === '0') { d = d.slice(1); }
        else { break; }
      }
      return d.slice(0, 9);
    }

    if (nameInput && nameGroup) {
      nameInput.addEventListener('input', function () {
        nameGroup.classList.toggle('error', !validateName(this.value));
      });
    }
    if (phone && phoneGroup) {
      // maxlength не ставимо: він ріже "сирий" рядок до очищення й ламає вставку
      phone.addEventListener('input', function () {
        this.value = normalizePhone(this.value);
        phoneGroup.classList.toggle('error', !validatePhone(this.value));
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (honeypot && honeypot.value.trim() !== '') { return; }

      var isValid = true;
      if (nameInput && nameGroup) {
        if (!validateName(nameInput.value)) { nameGroup.classList.add('error'); isValid = false; }
        else { nameGroup.classList.remove('error'); }
      }
      if (phone && phoneGroup) {
        if (!validatePhone(phone.value)) { phoneGroup.classList.add('error'); isValid = false; }
        else { phoneGroup.classList.remove('error'); }
      }
      if (!isValid) {
        if (nameGroup && nameGroup.classList.contains('error')) { nameInput.focus(); }
        else if (phone) { phone.focus(); }
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = isRu ? 'Отправляем…' : 'Надсилаємо…'; }

      // Код країни додаємо тільки у дані, що відправляються —
      // саме поле не чіпаємо, щоб не зіпсувалось при поверненні "назад".
      var data = new FormData(form);
      if (phone) { data.set(phone.name, '+380' + phone.value); }

      fetch(form.action, {
        method: 'POST',
        body: data,
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
          alert(isRu
            ? 'Не удалось отправить заявку. Позвоните, пожалуйста: +38 (067) 708-84-25'
            : 'Не вдалося надіслати заявку. Зателефонуйте, будь ласка: +38 (067) 708-84-25');
        });
    });
  }
})();
