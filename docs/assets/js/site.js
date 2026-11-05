// Black Gumbo Entertainment — mobile menu, click-to-load video, contact form.
(function () {
  'use strict';

  // ---------- Mobile menu: focus trapped while open; Escape or Close returns focus ----------
  var button = document.querySelector('.menu-button');
  var menu = document.getElementById('mobile-menu');
  if (button && menu) {
    var closeBtn = menu.querySelector('.menu-close');
    var focusables = function () {
      return Array.prototype.filter.call(
        menu.querySelectorAll('a[href], button'),
        function (el) { return el.getAttribute('tabindex') !== '-1'; }
      );
    };
    var open = function () {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      closeBtn.focus();
    };
    var close = function () {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      button.focus();
    };
    button.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // If the viewport grows past the breakpoint while open, close the overlay.
    window.matchMedia('(min-width: 980px)').addEventListener('change', function (m) {
      if (m.matches && !menu.hidden) close();
    });
  }

  // ---------- Video: YouTube loads only when the visitor presses play ----------
  Array.prototype.forEach.call(document.querySelectorAll('.player[data-youtube]'), function (player) {
    var start = player.querySelector('.player-start');
    start.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(player.dataset.youtube) +
        '?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1';
      iframe.title = player.dataset.title;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      player.replaceChild(iframe, start);
      iframe.focus();
    });
  });

  // ---------- Contact form ----------
  var form = document.querySelector('form.inquiry');
  if (!form) return;
  var params = new URLSearchParams(location.search);
  var projectSel = form.querySelector('#f-project');
  var typeSel = form.querySelector('#f-type');
  if (params.get('project') && projectSel.querySelector('option[value="' + CSS.escape(params.get('project')) + '"]')) {
    projectSel.value = params.get('project');
    typeSel.value = 'Film & Television';
    if (projectSel.value === 'jolly-time-animation-concept') typeSel.value = 'Music';
  }
  if (params.get('type') === 'screener') {
    var msg = form.querySelector('#f-message');
    if (!msg.value) msg.value = 'I would like to request a screener.';
  }

  var status = form.querySelector('.form-status');
  var summary = form.querySelector('.error-summary');
  var submit = form.querySelector('button[type="submit"]');
  var endpoint = form.dataset.endpoint;

  function setError(input, text) {
    var err = document.getElementById(input.id + '-err');
    if (text) {
      input.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = text; err.hidden = false; input.setAttribute('aria-describedby', err.id); }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) { err.hidden = true; input.removeAttribute('aria-describedby'); }
    }
  }

  function validate() {
    var problems = [];
    var name = form.querySelector('#f-name');
    var email = form.querySelector('#f-email');
    var message = form.querySelector('#f-message');
    var nameBad = !name.value.trim();
    var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    var msgBad = !message.value.trim();
    if (nameBad) { name.setAttribute('aria-invalid', 'true'); problems.push([name, 'Name']); } else name.removeAttribute('aria-invalid');
    setError(email, emailBad ? 'Enter a valid email address so we can reply.' : '');
    if (emailBad) problems.push([email, 'Email']);
    setError(message, msgBad ? 'Add a short message.' : '');
    if (msgBad) problems.push([message, 'Message']);
    return problems;
  }

  function showStatus(html) { status.innerHTML = html; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showStatus('');
    var problems = validate();
    if (problems.length) {
      summary.innerHTML = '<p>Please fix ' + problems.length + (problems.length === 1 ? ' field: ' : ' fields: ') +
        problems.map(function (p) { return '<a href="#' + p[0].id + '">' + p[1] + '</a>'; }).join(' · ') + '</p>';
      summary.hidden = false;
      problems[0][0].focus();
      return;
    }
    summary.hidden = true;

    if (!endpoint) {
      // Review demonstration: nothing is sent, and the page never claims otherwise.
      showStatus('<p><strong>Not sent — this is a review preview.</strong></p>' +
        '<p class="muted">The contact form is not connected yet, so your message was not delivered. Your text is still in the form.</p>');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        showStatus('<p><strong>Thank you — your inquiry was sent.</strong></p>');
      })
      .catch(function () {
        showStatus('<p><strong>We couldn’t send your message.</strong></p><p class="muted">Your text is still in the form. Please try again.</p>');
      })
      .then(function () { submit.disabled = false; submit.textContent = 'Send inquiry'; });
  });
})();
