/* ==========================================================================
   Backprop - motion layer.

   First-party, no dependencies, no storage, no network. Everything here is
   presentation: reveals, pointer tracking, tilt, counters, scroll rails.

   Two guarantees:
     1. Nothing is hidden unless this file runs. The `js` class it sets on
        <html> is what arms the CSS hide-then-reveal rules, so a failed or
        blocked script leaves every word on the page visible.
     2. prefers-reduced-motion switches the whole thing off - pointer and
        tilt listeners are never attached, and reveals fire immediately.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  var finePointer = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : false;

  // Arm the CSS. Do this first so there is no flash of laid-out content.
  root.classList.add('js');

  var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };

  /* ==================================================================
     1. Reveal on enter
     ================================================================== */

  var revealables = document.querySelectorAll('[data-reveal], .lines, .checks, .timeline');

  // Stagger index for children of anything marked data-stagger.
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-stagger]'),
    function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    }
  );

  // Elements whose own children stagger from their internal --i.
  Array.prototype.forEach.call(
    document.querySelectorAll('.checks, .timeline, .employers ul'),
    function (list) {
      Array.prototype.forEach.call(list.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    }
  );
  Array.prototype.forEach.call(document.querySelectorAll('.lines'), function (h) {
    Array.prototype.forEach.call(h.querySelectorAll('.line'), function (line, i) {
      line.style.setProperty('--i', i);
    });
  });

  var revealAll = function () {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  };

  if (!('IntersectionObserver' in window) || reduced) {
    revealAll();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);   // reveal once, then forget
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    // Anything already on screen is revealed directly instead of waiting for a
    // callback; only what is genuinely below the fold is handed to the
    // observer. Above-the-fold copy must never depend on an async callback.
    //
    // The catch: a tab opened in the background is never laid out, so every
    // rect reads as zero. Deciding from those numbers would file the whole
    // page under "off screen" and strand it. So prime() refuses to run until
    // layout exists, and is retried until it does.
    var primed = false;

    var prime = function () {
      if (primed) return true;

      var h = window.innerHeight || root.clientHeight;
      var laidOut = document.body.getBoundingClientRect().height > 0;
      if (!h || !laidOut) return false;          // no layout yet - try later

      primed = true;
      Array.prototype.forEach.call(revealables, function (el) {
        if (el.classList.contains('is-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > 0) el.classList.add('is-in');
        else revealObserver.observe(el);
      });
      return true;
    };

    // Two frames first, so the hidden state paints and the entrance transition
    // actually plays. Timers behind it, because a hidden document gets no
    // frames at all. Then visibilitychange, for the tab opened in the
    // background and read ten minutes later.
    raf(function () { raf(prime); });
    [60, 250, 800, 2500].forEach(function (delay) {
      window.setTimeout(prime, delay);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { raf(prime); prime(); }
    });
    window.addEventListener('pageshow', prime);
  }

  /* ==================================================================
     2. Pointer: bloom + tilt
     ================================================================== */

  if (finePointer && !reduced) {
    // The hero panel is deliberately absent here - its grid reveal is eased
    // rather than snapped, and is driven by easeStep() below.
    var glowing = Array.prototype.slice.call(
      document.querySelectorAll('.grid .cell, [data-glow]')
    );
    var tilting = Array.prototype.slice.call(document.querySelectorAll('.tilt'));
    var panel = document.querySelector('.hero-panel');

    if (glowing.length || tilting.length || panel) {
      var px = 0, py = 0, queued = false;

      /* --------------------------------------------------------------
         Eased hero grid.
         A reveal that tracks the cursor exactly is invisible: nothing ever
         appears to move, so the eye has no event to catch. Letting the lit
         patch lag and then catch up is the whole effect.
         -------------------------------------------------------------- */
      var ex = null, ey = null, easing = false;

      var easeStep = function () {
        var r = panel.getBoundingClientRect();
        var tx = px - r.left;
        var ty = py - r.top;

        if (ex === null) { ex = tx; ey = ty; }
        ex += (tx - ex) * 0.13;
        ey += (ty - ey) * 0.13;

        panel.style.setProperty('--mx', ex.toFixed(1) + 'px');
        panel.style.setProperty('--my', ey.toFixed(1) + 'px');

        if (Math.abs(tx - ex) > 0.4 || Math.abs(ty - ey) > 0.4) {
          raf(easeStep);
        } else {
          easing = false;
        }
      };

      var paint = function () {
        queued = false;

        // Read all geometry first, then write all styles - interleaving the
        // two forces a layout per element.
        var glowRects = glowing.map(function (el) { return el.getBoundingClientRect(); });
        var tiltRects = tilting.map(function (el) { return el.getBoundingClientRect(); });

        for (var i = 0; i < glowing.length; i++) {
          glowing[i].style.setProperty('--mx', (px - glowRects[i].left) + 'px');
          glowing[i].style.setProperty('--my', (py - glowRects[i].top) + 'px');
        }

        for (var j = 0; j < tilting.length; j++) {
          var r = tiltRects[j];
          var near = px > r.left - 60 && px < r.right + 60 &&
                     py > r.top - 60 && py < r.bottom + 60;

          if (near) {
            // -1..1 from center, capped at ~4 degrees.
            var dx = (px - (r.left + r.width / 2)) / (r.width / 2);
            var dy = (py - (r.top + r.height / 2)) / (r.height / 2);
            tilting[j].classList.add('is-tilting');
            tilting[j].style.setProperty('--ry', (dx * 4).toFixed(2) + 'deg');
            tilting[j].style.setProperty('--rx', (-dy * 4).toFixed(2) + 'deg');
          } else if (tilting[j].classList.contains('is-tilting')) {
            tilting[j].classList.remove('is-tilting');
            tilting[j].style.setProperty('--ry', '0deg');
            tilting[j].style.setProperty('--rx', '0deg');
          }
        }
      };

      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        px = e.clientX;
        py = e.clientY;
        if (!queued) { queued = true; raf(paint); }
        // Self-terminating: easeStep stops rescheduling once it has caught up.
        if (panel && !easing) { easing = true; raf(easeStep); }
      }, { passive: true });
    }
  }

  /* ==================================================================
     3. Scroll rails: page progress, timeline fill, sticky header
     ================================================================== */

  var progressBar = document.querySelector('.progress');
  var timelines = Array.prototype.slice.call(document.querySelectorAll('.timeline'));
  var header = document.querySelector('.site-header');
  var scrollQueued = false;

  var onScroll = function () {
    scrollQueued = false;
    var y = window.pageYOffset || root.scrollTop;

    if (progressBar) {
      var scrollable = root.scrollHeight - window.innerHeight;
      progressBar.style.setProperty('--p', scrollable > 0 ? Math.min(1, y / scrollable) : 0);
    }

    if (header) header.classList.toggle('is-stuck', y > 8);

    for (var i = 0; i < timelines.length; i++) {
      var r = timelines[i].getBoundingClientRect();
      // 0 when the top reaches 80% of the viewport, 1 when the bottom
      // passes 40% - so the rail fills as you read down it.
      var start = window.innerHeight * 0.8;
      var end = window.innerHeight * 0.4;
      var traveled = (start - r.top) / Math.max(1, r.height + (start - end));
      timelines[i].style.setProperty('--p', Math.max(0, Math.min(1, traveled)).toFixed(3));
    }
  };

  if (progressBar || timelines.length || header) {
    window.addEventListener('scroll', function () {
      if (!scrollQueued) { scrollQueued = true; raf(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ==================================================================
     4. Count-up
     The real value is already in the HTML; this only replays it.
     ================================================================== */

  var counters = document.querySelectorAll('[data-count]');

  if (counters.length && !reduced && 'IntersectionObserver' in window) {
    var format = function (n) { return n.toLocaleString('en-US'); };

    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        countObserver.unobserve(el);

        var target = parseFloat(el.getAttribute('data-count'));
        var prefix = el.getAttribute('data-prefix') || '';
        var final = el.textContent;
        var duration = 1100;
        var started = null;

        var step = function (now) {
          if (started === null) started = now;
          var t = Math.min(1, (now - started) / duration);
          var eased = 1 - Math.pow(1 - t, 4);          // easeOutQuart
          el.textContent = prefix + format(Math.round(target * eased));
          if (t < 1) raf(step);
          else el.textContent = final;                 // restore exact markup
        };

        el.textContent = prefix + '0';
        raf(step);
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(counters, function (el) { countObserver.observe(el); });
  }

  /* ==================================================================
     5. Email CTAs - copy on click
     A mailto link does nothing whatsoever when the OS has no handler
     registered: no error, no prompt, no tab. Every email CTA therefore also
     copies the address and says so, so a click is never silent and the
     address is always in hand.
     ================================================================== */

  var mailLinks = document.querySelectorAll('a[href^="mailto:"]');

  if (mailLinks.length) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    var hideTimer = null;

    var showToast = function (address, copied) {
      var head = document.createElement('b');
      head.textContent = copied ? address + ' copied' : address;

      var sub = document.createElement('span');
      sub.textContent = copied
        ? 'Paste it in if your mail app did not open.'
        : 'Copy this if your mail app did not open.';

      toast.textContent = '';
      toast.appendChild(head);
      toast.appendChild(sub);
      toast.classList.add('is-shown');

      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        toast.classList.remove('is-shown');
      }, 4500);
    };

    var copyText = function (text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      // Neither file:// nor plain http is a secure context, so the async
      // Clipboard API is unavailable there. Fall back to a scratch textarea.
      return new Promise(function (resolve, reject) {
        var scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly', '');
        scratch.style.position = 'fixed';
        scratch.style.top = '-1000px';
        document.body.appendChild(scratch);
        scratch.select();

        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(scratch);

        if (ok) { resolve(); } else { reject(); }
      });
    };

    Array.prototype.forEach.call(mailLinks, function (link) {
      link.addEventListener('click', function () {
        // Deliberately not preventDefault - a working mail client should
        // still get its chance to open. This only adds a second path.
        var address = link.getAttribute('href').slice(7).split('?')[0];
        copyText(address).then(
          function () { showToast(address, true); },
          function () { showToast(address, false); }
        );
      });
    });
  }

  /* ==================================================================
     6. Nav scroll-spy
     data-active, not aria-current - assistive tech should not be told the
     "current page" changed on every scroll.
     ================================================================== */

  if (!('IntersectionObserver' in window)) return;

  var linkFor = {};
  var sections = [];

  Array.prototype.forEach.call(
    document.querySelectorAll('.nav a[href*="#"]'),
    function (link) {
      var id = link.getAttribute('href').split('#')[1];
      var section = id && document.getElementById(id);
      if (section) { linkFor[id] = link; sections.push(section); }
    }
  );

  if (!sections.length) return;

  var active = null;
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var next = linkFor[entry.target.id];
      if (!next || next === active) return;
      if (active) active.removeAttribute('data-active');
      next.setAttribute('data-active', '');
      active = next;
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(function (section) { spy.observe(section); });
})();
