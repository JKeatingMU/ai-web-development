/* deck-extras.js — quiz system, HUD overlay, icon support
   Requires: deck has .slide elements, #progress, #nav, #app-link, #index-link, #hint
   Optional: window.DECK_QUESTIONS array and window.DECK_CONFIG object
*/

(function () {
  'use strict';

  // Apply saved theme immediately — script runs at end of <body>, before first paint
  if (localStorage.getItem('svl_theme') === 'light') {
    document.body.classList.add('light-theme');
  }

  // Apply saved text size immediately (avoids a flash of default-size content)
  var savedTextSize = localStorage.getItem('svl_textsize');
  if (savedTextSize === 'lg' || savedTextSize === 'xl') {
    document.body.classList.add('text-' + savedTextSize);
  }

  // Detect reduced-motion preference once, for JS-driven animation guards
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window._reduceMotion = !!prefersReducedMotion;

  /* ── Progress persistence (localStorage) ──────────────────── */
  function getDeckKey() {
    return 'svl_' + window.location.pathname.split('/').pop().replace('.html', '');
  }

  // Saves current position only — _max is updated separately after dwell
  function saveProgress(n) {
    var key = getDeckKey();
    localStorage.setItem(key + '_pos', n);
    var total = document.querySelectorAll('.slide').length;
    localStorage.setItem(key + '_total', total);
  }

  // Called after dwell time — only advances _max, never decreases it
  function saveDwellMax(n) {
    var key = getDeckKey();
    var max = parseInt(localStorage.getItem(key + '_max') || '-1', 10);
    if (n > max) localStorage.setItem(key + '_max', n);
  }

  // Enable >> only after learner has reached the last slide via normal navigation
  function updateNavLastState() {
    var lastBtn = document.getElementById('nav-last');
    if (!lastBtn) return;
    var key = getDeckKey();
    var max = parseInt(localStorage.getItem(key + '_max') || '-1', 10);
    var count = document.querySelectorAll('.slide').length;
    var locked = max < count - 1;
    lastBtn.disabled = locked;
    lastBtn.title = locked ? 'Navigate to the end to unlock' : 'Last slide (End)';
  }

  /* ── Navigation helper ─────────────────────────────────────── */
  function navigateTo(n) {
    // Prefer the deck's own show() so its internal `current` stays in sync
    if (typeof window.deckShow === 'function') {
      window.deckShow(n);
      updateBackToQuiz(n);
      saveProgress(n);
      return;
    }
    // Fallback: class-only toggle (no inline style.display — avoids overriding CSS)
    const slides = document.querySelectorAll('.slide');
    if (n < 0 || n >= slides.length) return;
    slides.forEach((s, i) => s.classList.toggle('active', i === n));
    const progress = document.getElementById('progress');
    if (progress) progress.style.width = ((n + 1) / slides.length * 100) + '%';
    const counter = document.getElementById('counter') || document.querySelector('#nav span');
    if (counter) counter.textContent = (n + 1) + ' / ' + slides.length;
    // Update back-to-quiz visibility
    updateBackToQuiz(n);
    saveProgress(n);
  }

  /* ── Controls group (houses ⓘ and ★ buttons) ──────────────── */
  function initHUD() {
    const controls = document.createElement('div');
    controls.id = 'deck-controls';
    document.body.appendChild(controls);
  }

  /* ── Theme toggle (light / dark) ──────────────────────────── */
  function initTheme() {
    var btn = document.createElement('button');
    btn.id = 'theme-btn';
    btn.title = 'Toggle light / dark theme';

    function applyTheme(t) {
      var isLight = t === 'light';
      document.body.classList.toggle('light-theme', isLight);
      btn.textContent = isLight ? '\u263D' : '\u2600'; // ☽ or ☀
      localStorage.setItem('svl_theme', t);
    }

    btn.addEventListener('click', function () {
      applyTheme(document.body.classList.contains('light-theme') ? 'dark' : 'light');
    });

    // Sync button label to current state
    btn.textContent = document.body.classList.contains('light-theme') ? '\u263D' : '\u2600';

    document.getElementById('deck-controls').appendChild(btn);
  }

  /* ── Back-to-Quiz breadcrumb ───────────────────────────────── */
  const backBtn = document.createElement('button');
  backBtn.id = 'back-to-quiz';
  backBtn.textContent = '← Back to quiz';
  document.body.appendChild(backBtn);

  backBtn.addEventListener('click', function () {
    const idx = parseInt(sessionStorage.getItem('quizReturn') || '-1', 10);
    sessionStorage.removeItem('quizReturn');
    if (idx >= 0) navigateTo(idx);
    backBtn.classList.remove('visible');
  });

  function updateBackToQuiz(currentIdx) {
    const stored = sessionStorage.getItem('quizReturn');
    if (stored !== null && parseInt(stored, 10) !== currentIdx) {
      backBtn.classList.add('visible');
    } else {
      backBtn.classList.remove('visible');
    }
  }

  /* ── Quiz Engine ───────────────────────────────────────────── */
  function initQuiz() {
    const questions = window.DECK_QUESTIONS;
    if (!questions || !questions.length) return;

    const quizSlides = document.querySelectorAll('.quiz-slide');
    quizSlides.forEach(function (slide, slideIdx) {
      const checkpoint = parseInt(slide.dataset.checkpoint || '0', 10);
      const pickCount  = parseInt(slide.dataset.pick || '3', 10);

      // Filter questions for this checkpoint
      const pool = questions.filter(function (q) {
        return !q.checkpoint || q.checkpoint === checkpoint;
      });

      // Shuffle and pick
      const shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
      const chosen   = shuffled.slice(0, Math.min(pickCount, shuffled.length));

      if (!chosen.length) {
        slide.innerHTML = '<p style="color:#8b949e;font-size:14px;text-align:center;margin:auto;">No questions available for this checkpoint.</p>';
        return;
      }

      let currentQ = 0;
      const results = new Array(chosen.length).fill(null); // null | 'correct' | 'missed'

      function render() {
        slide.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'quiz-header';
        header.innerHTML = '<div class="quiz-icon">&#x2713;</div><h2>Check Your Understanding</h2>';

        const dots = document.createElement('div');
        dots.className = 'quiz-dots';
        chosen.forEach(function (_, i) {
          const d = document.createElement('div');
          d.className = 'quiz-dot' +
            (i === currentQ ? ' active' : '') +
            (results[i] === 'correct' ? ' correct' : '') +
            (results[i] === 'missed'  ? ' missed'  : '');
          dots.appendChild(d);
        });
        header.appendChild(dots);
        slide.appendChild(header);

        const q = chosen[currentQ];

        if (q.type === 'mcq') {
          renderMCQ(slide, q, currentQ, chosen.length);
        } else {
          renderSelf(slide, q, currentQ, chosen.length);
        }
      }

      function findSlideIndex(titleText) {
        if (!titleText) return -1;
        const allSlides = document.querySelectorAll('.slide');
        for (let i = 0; i < allSlides.length; i++) {
          const h2 = allSlides[i].querySelector('h2');
          if (h2 && h2.textContent.trim().toLowerCase().includes(titleText.toLowerCase())) return i;
        }
        return -1;
      }

      function getSlideIndexOfThisQuizSlide() {
        const allSlides = document.querySelectorAll('.slide');
        for (let i = 0; i < allSlides.length; i++) {
          if (allSlides[i] === slide) return i;
        }
        return -1;
      }

      function nextOrFinish(isLast) {
        if (isLast) {
          renderSummary(slide, results, getSlideIndexOfThisQuizSlide());
        } else {
          currentQ++;
          render();
        }
      }

      function renderMCQ(container, q, qIdx, total) {
        const card = document.createElement('div');
        card.className = 'quiz-card';

        const qText = document.createElement('p');
        qText.className = 'quiz-q';
        qText.textContent = q.q;
        card.appendChild(qText);

        const opts = document.createElement('div');
        opts.className = 'quiz-options';

        // Shuffle options but track correct
        const indices = q.options.map(function (_, i) { return i; });
        indices.sort(function () { return Math.random() - 0.5; });
        const shuffledOpts = indices.map(function (i) { return q.options[i]; });
        const newCorrectIdx = indices.indexOf(q.correct);

        shuffledOpts.forEach(function (optText, i) {
          const btn = document.createElement('button');
          btn.className = 'quiz-opt';
          btn.textContent = optText;
          btn.addEventListener('click', function () {
            if (btn.disabled) return;
            opts.querySelectorAll('.quiz-opt').forEach(function (b) { b.disabled = true; });

            const isCorrect = i === newCorrectIdx;
            btn.classList.add(isCorrect ? 'correct' : 'wrong');
            if (!isCorrect) {
              opts.querySelectorAll('.quiz-opt')[newCorrectIdx].classList.add('correct');
            }
            results[qIdx] = isCorrect ? 'correct' : 'missed';

            feedback.style.display = 'flex';
            feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
            expl.textContent = (isCorrect ? '\u2713 Correct. ' : '\u2717 Not quite. ') + (q.explanation || '');
            if (!isCorrect && q.reviewSlide) {
              const slideIdx = findSlideIndex(q.reviewSlide);
              if (slideIdx >= 0) {
                revLink.style.display = 'inline-flex';
                revLink.textContent = 'Review: ' + q.reviewSlide + ' \u2192';
                revLink.onclick = function (e) {
                  e.preventDefault();
                  sessionStorage.setItem('quizReturn', getSlideIndexOfThisQuizSlide());
                  navigateTo(slideIdx);
                };
              }
            }
            navBtn.style.display = 'block';
          });
          opts.appendChild(btn);
        });
        card.appendChild(opts);

        // Feedback
        const feedback = document.createElement('div');
        feedback.className = 'quiz-feedback';
        const expl = document.createElement('p');
        expl.style.margin = '0 0 6px';
        const revLink = document.createElement('a');
        revLink.className = 'quiz-review-link';
        revLink.style.display = 'none';
        revLink.href = '#';
        feedback.appendChild(expl);
        feedback.appendChild(revLink);
        card.appendChild(feedback);

        const quizNav = document.createElement('div');
        quizNav.className = 'quiz-nav';
        const navBtn = document.createElement('button');
        navBtn.className = 'quiz-btn ' + (qIdx + 1 === total ? 'quiz-btn-finish' : 'quiz-btn-next');
        navBtn.textContent = qIdx + 1 === total ? 'See results \u2192' : 'Next question \u2192';
        navBtn.style.display = 'none';
        navBtn.addEventListener('click', function () { nextOrFinish(qIdx + 1 === total); });
        quizNav.appendChild(navBtn);
        card.appendChild(quizNav);

        container.appendChild(card);
      }

      function renderSelf(container, q, qIdx, total) {
        const card = document.createElement('div');
        card.className = 'quiz-card';

        const qText = document.createElement('p');
        qText.className = 'quiz-q';
        qText.textContent = q.q;
        card.appendChild(qText);

        const ta = document.createElement('textarea');
        ta.className = 'quiz-textarea';
        ta.placeholder = 'Write your answer here, then reveal the model answer to compare\u2026';
        card.appendChild(ta);

        const revealBtn = document.createElement('button');
        revealBtn.className = 'quiz-btn quiz-btn-next';
        revealBtn.style.display = 'block';
        revealBtn.style.marginTop = '6px';
        revealBtn.textContent = 'Reveal model answer';
        card.appendChild(revealBtn);

        const modelDiv = document.createElement('div');
        modelDiv.className = 'quiz-model-answer';
        modelDiv.textContent = q.model || '';
        card.appendChild(modelDiv);

        const selfMark = document.createElement('div');
        selfMark.className = 'quiz-self-mark';

        const yesBtn = document.createElement('button');
        yesBtn.className = 'quiz-mark-yes';
        yesBtn.textContent = '\u2713  Got it';

        const noBtn = document.createElement('button');
        noBtn.className = 'quiz-mark-no';
        noBtn.textContent = '\u25b3  Need to revisit';

        selfMark.appendChild(yesBtn);
        selfMark.appendChild(noBtn);
        card.appendChild(selfMark);

        revealBtn.addEventListener('click', function () {
          modelDiv.style.display = 'block';
          selfMark.style.display = 'flex';
          revealBtn.style.display = 'none';
          ta.disabled = true;
        });

        function markAndContinue(got) {
          results[qIdx] = got ? 'correct' : 'missed';
          if (!got && q.reviewSlide) {
            const slideIdx = findSlideIndex(q.reviewSlide);
            if (slideIdx >= 0) {
              const revLink = document.createElement('a');
              revLink.className = 'quiz-review-link';
              revLink.textContent = 'Review: ' + q.reviewSlide + ' \u2192';
              revLink.href = '#';
              revLink.style.marginTop = '8px';
              revLink.onclick = function (e) {
                e.preventDefault();
                sessionStorage.setItem('quizReturn', getSlideIndexOfThisQuizSlide());
                navigateTo(slideIdx);
              };
              selfMark.after(revLink);
            }
          }
          selfMark.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
          nextOrFinish(qIdx + 1 === total);
        }

        yesBtn.addEventListener('click', function () { markAndContinue(true); });
        noBtn.addEventListener('click', function () { markAndContinue(false); });

        container.appendChild(card);
      }

      function renderSummary(container, results, quizIdx) {
        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'quiz-header';
        header.innerHTML = '<div class="quiz-icon">\u2605</div><h2>Results</h2>';
        container.appendChild(header);

        const correct = results.filter(function (r) { return r === 'correct'; }).length;
        const total   = results.length;

        const summary = document.createElement('div');
        summary.className = 'quiz-summary';
        summary.style.display = 'flex';

        const score = document.createElement('div');
        score.className = 'quiz-score';
        score.textContent = correct + ' / ' + total;
        summary.appendChild(score);

        const msg = document.createElement('p');
        msg.style.margin = '0';
        msg.style.color = '#8b949e';
        if (correct === total) {
          msg.textContent = 'Excellent \u2014 all correct. Ready to continue.';
        } else if (correct >= Math.ceil(total / 2)) {
          msg.textContent = 'Good. Review the slides linked above for anything you missed.';
        } else {
          msg.textContent = 'Take your time \u2014 review the slides for any missed questions, then come back.';
        }
        summary.appendChild(msg);

        const contBtn = document.createElement('button');
        contBtn.className = 'quiz-btn-continue';
        contBtn.textContent = 'Continue \u2192';
        contBtn.addEventListener('click', function () {
          const allSlides = document.querySelectorAll('.slide');
          for (let i = 0; i < allSlides.length; i++) {
            if (allSlides[i] === container && i + 1 < allSlides.length) {
              navigateTo(i + 1);
              break;
            }
          }
        });
        summary.appendChild(contBtn);
        container.appendChild(summary);
      }

      render();
    });
  }

  /* ── Assessments Panel ─────────────────────────────────────── */
  function initAssessments() {
    var assessments = window.DECK_ASSESSMENTS;
    if (!assessments || !assessments.length) return;
    var controls = document.getElementById('deck-controls');
    if (!controls) return;

    var key = getDeckKey();

    var btn = document.createElement('button');
    btn.id = 'assess-btn';
    btn.title = 'Optional assessments for this module';
    btn.textContent = '\u2605';
    controls.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'assess-panel';

    var header = document.createElement('div');
    header.id = 'assess-panel-header';
    var titleWrap = document.createElement('div');
    titleWrap.id = 'assess-panel-title-wrap';
    var titleEl = document.createElement('div');
    titleEl.id = 'assess-panel-title';
    titleEl.textContent = 'Optional Assessments';
    titleWrap.appendChild(titleEl);
    var countEl = document.createElement('span');
    countEl.id = 'assess-panel-count';
    titleWrap.appendChild(countEl);
    header.appendChild(titleWrap);
    var sizeBtn = document.createElement('button');
    sizeBtn.id = 'assess-size-btn';
    sizeBtn.title = 'Toggle larger text';
    sizeBtn.textContent = 'A+';
    if (localStorage.getItem('svl_assess_large') === '1') {
      panel.classList.add('assess-large');
      sizeBtn.classList.add('active');
    }
    sizeBtn.addEventListener('click', function() {
      var large = panel.classList.toggle('assess-large');
      sizeBtn.classList.toggle('active', large);
      localStorage.setItem('svl_assess_large', large ? '1' : '0');
    });
    header.appendChild(sizeBtn);
    var closeBtn = document.createElement('button');
    closeBtn.id = 'assess-panel-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var list = document.createElement('div');
    list.className = 'assess-list';

    function updateCount() {
      var done = assessments.filter(function(a) {
        return localStorage.getItem(key + '_assess_' + a.id) === '1';
      }).length;
      countEl.textContent = done + '\u202f/\u202f' + assessments.length;
      localStorage.setItem(key + '_assess_done', done);
      localStorage.setItem(key + '_assess_total', assessments.length);
    }

    assessments.forEach(function(a) {
      var item = document.createElement('div');
      item.className = 'assess-item';
      var isChecked = localStorage.getItem(key + '_assess_' + a.id) === '1';
      if (isChecked) item.classList.add('done');

      var top = document.createElement('div');
      top.className = 'assess-item-top';
      var badge = document.createElement('span');
      badge.className = 'assess-type assess-type-' + a.type;
      badge.textContent = a.type === 'reflect' ? 'Reflect' : 'Practical';
      top.appendChild(badge);
      var titleDiv = document.createElement('div');
      titleDiv.className = 'assess-item-title';
      titleDiv.textContent = a.title;
      top.appendChild(titleDiv);
      item.appendChild(top);

      var desc = document.createElement('div');
      desc.className = 'assess-item-desc';
      desc.textContent = a.desc;
      item.appendChild(desc);

      if (a.criteria && a.criteria.length) {
        var cWrap = document.createElement('div');
        cWrap.className = 'assess-criteria';
        var cLbl = document.createElement('div');
        cLbl.className = 'assess-criteria-label';
        cLbl.textContent = 'You\u2019ve done this well if\u2026';
        cWrap.appendChild(cLbl);
        var cList = document.createElement('ul');
        cList.className = 'assess-criteria-list';
        a.criteria.forEach(function(c) {
          var li = document.createElement('li');
          li.className = 'assess-criteria-item';
          li.textContent = c;
          cList.appendChild(li);
        });
        cWrap.appendChild(cList);
        item.appendChild(cWrap);
      }

      if (a.type === 'reflect') {
        var hint = document.createElement('div');
        hint.className = 'assess-reflect-hint';
        hint.textContent = 'Write your response below — it will appear on your certificate:';
        item.appendChild(hint);
        var ta = document.createElement('textarea');
        ta.className = 'assess-reflect-ta';
        ta.placeholder = 'Your reflection\u2026';
        ta.value = localStorage.getItem(key + '_reflect') || '';
        ta.addEventListener('input', function() {
          localStorage.setItem(key + '_reflect', ta.value);
        });
        ta.addEventListener('paste', function(e) {
          e.preventDefault();
          var msg = item.querySelector('.assess-paste-msg');
          if (!msg) {
            msg = document.createElement('div');
            msg.className = 'assess-paste-msg';
            msg.textContent = 'Please write your reflection — pasting is disabled.';
            ta.after(msg);
          }
          msg.classList.add('visible');
          clearTimeout(msg._t);
          msg._t = setTimeout(function() { msg.classList.remove('visible'); }, 2800);
        });
        item.appendChild(ta);
      }

      var checkRow = document.createElement('div');
      checkRow.className = 'assess-check-row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'assess-checkbox';
      cb.id = 'assess-cb-' + a.id;
      cb.checked = isChecked;
      var lbl = document.createElement('label');
      lbl.htmlFor = 'assess-cb-' + a.id;
      lbl.className = 'assess-check-label';
      lbl.textContent = isChecked ? 'Completed \u2713' : 'Mark as complete';
      cb.addEventListener('change', function() {
        localStorage.setItem(key + '_assess_' + a.id, cb.checked ? '1' : '0');
        item.classList.toggle('done', cb.checked);
        lbl.textContent = cb.checked ? 'Completed \u2713' : 'Mark as complete';
        updateCount();
      });
      checkRow.appendChild(cb);
      checkRow.appendChild(lbl);
      item.appendChild(checkRow);
      list.appendChild(item);
    });

    panel.appendChild(list);
    document.body.appendChild(panel);
    updateCount();

    function showAssess() {
      var hud = document.getElementById('hud-overlay');
      if (hud) hud.classList.remove('active');
      var lo = document.getElementById('lo-panel');
      if (lo) lo.classList.remove('active');
      var loBtn = document.getElementById('lo-btn');
      if (loBtn) loBtn.classList.remove('active');
      panel.classList.add('active');
      btn.classList.add('active');
    }
    function hideAssess() { panel.classList.remove('active'); btn.classList.remove('active'); }

    btn.addEventListener('click', function() {
      if (panel.classList.contains('active')) hideAssess(); else showAssess();
    });
    closeBtn.addEventListener('click', hideAssess);
    document.addEventListener('click', function(e) {
      if (panel.classList.contains('active') && !panel.contains(e.target) && e.target !== btn) {
        hideAssess();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.classList.contains('active')) hideAssess();
    });
  }

  /* ── LO Panel (learning objectives) ───────────────────────── */
  function initLO() {
    var objectives = window.DECK_OBJECTIVES;
    if (!objectives || !objectives.length) return;

    var controls = document.getElementById('deck-controls');
    if (!controls) return;

    var btn = document.createElement('button');
    btn.id = 'lo-btn';
    btn.title = 'Learning objectives for this module';
    btn.textContent = '\u2726'; // ✦
    controls.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'lo-panel';

    var header = document.createElement('div');
    header.id = 'lo-panel-header';

    var titleEl = document.createElement('div');
    titleEl.id = 'lo-panel-title';
    titleEl.textContent = 'What you will learn';
    header.appendChild(titleEl);

    var sizeBtn = document.createElement('button');
    sizeBtn.id = 'lo-size-btn';
    sizeBtn.title = 'Toggle larger text';
    sizeBtn.textContent = 'A+';
    if (localStorage.getItem('svl_lo_large') === '1') {
      panel.classList.add('lo-large');
      sizeBtn.classList.add('active');
    }
    sizeBtn.addEventListener('click', function() {
      var large = panel.classList.toggle('lo-large');
      sizeBtn.classList.toggle('active', large);
      localStorage.setItem('svl_lo_large', large ? '1' : '0');
    });
    header.appendChild(sizeBtn);

    var closeBtn = document.createElement('button');
    closeBtn.id = 'lo-panel-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var intro = document.createElement('div');
    intro.id = 'lo-panel-intro';
    intro.textContent = 'By the end of this module, you will be able to:';
    panel.appendChild(intro);

    var list = document.createElement('div');
    list.className = 'lo-list';
    objectives.forEach(function (text, i) {
      var item = document.createElement('div');
      item.className = 'lo-item';
      var num = document.createElement('span');
      num.className = 'lo-num';
      num.textContent = String(i + 1).padStart(2, '0');
      var txt = document.createElement('span');
      txt.textContent = text;
      item.appendChild(num);
      item.appendChild(txt);
      list.appendChild(item);
    });
    panel.appendChild(list);
    document.body.appendChild(panel);

    function showLO() {
      var hud = document.getElementById('hud-overlay');
      if (hud) hud.classList.remove('active');
      var assessBtn = document.getElementById('assess-btn');
      if (assessBtn) assessBtn.classList.remove('active');
      var assessPanel = document.getElementById('assess-panel');
      if (assessPanel) assessPanel.classList.remove('active');
      panel.classList.add('active');
      btn.classList.add('active');
    }
    function hideLO() { panel.classList.remove('active'); btn.classList.remove('active'); }

    btn.addEventListener('click', function() {
      if (panel.classList.contains('active')) hideLO(); else showLO();
    });
    closeBtn.addEventListener('click', hideLO);
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('active') && !panel.contains(e.target) && e.target !== btn) {
        hideLO();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('active')) hideLO();
    });
  }

  /* ── Suppress nav shortcuts when typing ───────────────────── */
  document.addEventListener('keydown', function (e) {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') e.stopPropagation();
  }, true); // capture phase — runs before deck's own keydown handler

  /* ── Audio Autoplay + Spotlight ────────────────────────────── */
  function initAudio() {
    if (!window.DECK_SCRIPTS || !window.DECK_SCRIPTS.has_audio) return;
    var controls = document.getElementById('deck-controls');
    if (!controls) return;

    var deck = window.DECK_SCRIPTS.deck;
    var player = new Audio();
    window._audioPlayer = player;
    player.preload = 'none';

    var autoplay = localStorage.getItem('svl_autoplay') === '1';
    var currentSlideIdx = null;
    var lastSegmentTarget = null;
    var lastSegmentLine   = null;
    var lastZoomKey = null;

    // Maps generator target names → CSS selectors (scoped to active slide)
    var SPOTLIGHT_MAP = {
      code:    '.terminal',
      callout: '.callout',
      title:   'h2',
      list:    '.annot-list',
      diagram: 'svg',
      table:   'table',
      columns: '.cols',
    };
    // All selectors that can receive .spotlight-dimmed
    var DIMMABLE = '.terminal, .callout, h2, .annot-list, svg, table, .cols, p';

    function clearAllSpotlights() {
      document.querySelectorAll('.spotlight-dimmed, .spotlight-active, .line-highlighted').forEach(function (el) {
        el.classList.remove('spotlight-dimmed', 'spotlight-active', 'line-highlighted');
      });
    }
    window._clearAllSpotlights = clearAllSpotlights;

    function highlightCodeLine(slideEl, blockIndex, lineNum) {
      slideEl.querySelectorAll('.line-highlighted').forEach(function(el) {
        el.classList.remove('line-highlighted');
      });
      if (!lineNum) return;
      var bodies = slideEl.querySelectorAll('.terminal-body');
      var body = bodies[blockIndex || 0];
      if (!body) return;
      var lineEl = body.querySelector('.code-line[data-line="' + lineNum + '"]');
      if (lineEl) lineEl.classList.add('line-highlighted');
    }

    function applySpotlight(target) {
      var slideEl = document.querySelector('.slide.active');
      if (!slideEl) return;

      // Clear previous state on this slide
      slideEl.querySelectorAll('.spotlight-dimmed, .spotlight-active').forEach(function (el) {
        el.classList.remove('spotlight-dimmed', 'spotlight-active');
      });

      if (!target || target === 'full') return;

      var selector = SPOTLIGHT_MAP[target];
      if (!selector) return;

      var targets = slideEl.querySelectorAll(selector);
      if (!targets.length) return; // target not present on this slide — no-op

      // Dim everything dimmable
      slideEl.querySelectorAll(DIMMABLE).forEach(function (el) {
        el.classList.add('spotlight-dimmed');
      });

      // Un-dim and activate the target(s) and any ancestor dimmable containers
      targets.forEach(function (el) {
        el.classList.remove('spotlight-dimmed');
        el.classList.add('spotlight-active');
        // Walk up: un-dim any dimmable parent so nested elements aren't hidden
        var parent = el.parentElement;
        while (parent && parent !== slideEl) {
          parent.classList.remove('spotlight-dimmed');
          parent = parent.parentElement;
        }
      });
    }

    function getActiveSegments(idx) {
      if (!window.DECK_SCRIPTS) return { segs: [], useTimeS: false };
      var entry = window.DECK_SCRIPTS.scripts.find(function(s) { return s.slide === idx; });
      if (!entry) return { segs: [], useTimeS: false };
      if (!window._forceAISegments && entry.human_segments && entry.human_segments.length)
        return { segs: entry.human_segments, useTimeS: true };
      return { segs: entry.segments || [], useTimeS: false };
    }

    // ── AI / Human source toggle (only when human_segments exist) ─
    var hasHumanSegs = window.DECK_SCRIPTS.scripts.some(function(s) {
      return s.human_segments && s.human_segments.length;
    });
    if (hasHumanSegs) {
      var srcBtn = document.createElement('button');
      srcBtn.id = 'annot-src-btn';
      srcBtn.title = 'Spotlight source: Human annotations active — click to switch to AI';
      srcBtn.textContent = 'HU';
      srcBtn.classList.add('active');
      controls.appendChild(srcBtn);
      srcBtn.addEventListener('click', function() {
        window._forceAISegments = !window._forceAISegments;
        srcBtn.textContent = window._forceAISegments ? 'AI' : 'HU';
        srcBtn.classList.toggle('active', !window._forceAISegments);
        srcBtn.title = window._forceAISegments
          ? 'Spotlight source: AI annotations active — click to switch to Human'
          : 'Spotlight source: Human annotations active — click to switch to AI';
        lastSegmentTarget = null;
        clearAllSpotlights();
      });
    }

    // ── Buttons ──────────────────────────────────────────────────
    var btn = document.createElement('button');
    btn.id = 'audio-btn';
    btn.title = 'Play narration through all slides \u2014 Space to pause, R to replay slide';
    btn.textContent = '\u266B'; // ♫
    btn.classList.toggle('active', autoplay);
    controls.appendChild(btn);

    // ── Audio events ─────────────────────────────────────────────
    function playSlide(idx) {
      player.pause();
      player.src = 'audio/' + deck + '/slide-' + idx + '.mp3';
      lastSegmentTarget = null;
      lastSegmentLine   = null;
      var p = player.play();
      if (p) p.catch(function () {});
    }

    player.addEventListener('playing', function () { btn.classList.add('playing'); });
    player.addEventListener('pause',   function () { btn.classList.remove('playing'); });
    player.addEventListener('error',   function () { btn.classList.remove('playing'); });
    player.addEventListener('ended', function () {
      btn.classList.remove('playing');
      clearAllSpotlights();
      if (window._zoomLens) window._zoomLens.hide();
      if (autoplay && currentSlideIdx !== null) {
        var slides = document.querySelectorAll('.slide');
        var nextIdx = currentSlideIdx + 1;
        if (nextIdx < slides.length) {
          navigateTo(nextIdx);
          if (window._updateScriptPanel) window._updateScriptPanel(nextIdx);
          window._playAudioSlide(nextIdx);
        }
      }
    });

    // ── Spotlight via timeupdate ──────────────────────────────────
    player.addEventListener('timeupdate', function () {
      if (currentSlideIdx === null) return;
      if (window._annotating) return;
      var result = getActiveSegments(currentSlideIdx);
      var segments = result.segs;
      var useTimeS = result.useTimeS;
      if (!segments.length) return;

      // Find the last spotlight segment whose threshold has been passed (skip zoom entries)
      var activeTarget = 'full';
      var activeLine   = null;
      var activeBlockIndex = 0;
      for (var i = segments.length - 1; i >= 0; i--) {
        if (segments[i].type === 'zoom') continue;
        var threshold = useTimeS ? segments[i].time_s : (segments[i].start_word / 140 * 60);
        if (player.currentTime >= threshold) {
          activeTarget     = segments[i].target;
          activeLine       = segments[i].line       || null;
          activeBlockIndex = segments[i].blockIndex || 0;
          break;
        }
      }

      if (activeTarget !== lastSegmentTarget || activeLine !== lastSegmentLine) {
        lastSegmentTarget = activeTarget;
        lastSegmentLine   = activeLine;
        applySpotlight(activeTarget);
        var slideEl = document.querySelector('.slide.active');
        if (slideEl) highlightCodeLine(slideEl, activeBlockIndex, activeLine);
      }

      // ── Zoom playback (human_segments in scripts file) ───────────
      if (useTimeS && window._zoomLens) {
        var zoomEntry = null;
        for (var j = 0; j < segments.length; j++) {
          var z = segments[j];
          if (z.type === 'zoom' &&
              player.currentTime >= z.time_s &&
              player.currentTime <  z.time_s + (z.duration_s || 0.5)) {
            zoomEntry = z; break;
          }
        }
        var newZoomKey = zoomEntry ? zoomEntry.time_s : null;
        if (newZoomKey !== lastZoomKey) {
          lastZoomKey = newZoomKey;
          if (zoomEntry) {
            window._zoomLens.showAt(zoomEntry.x, zoomEntry.y);
            window._zoomLens.startPan(zoomEntry);
          } else {
            window._zoomLens.hide();
          }
        }
      }
    });

    // ── Toggle button ─────────────────────────────────────────────
    btn.addEventListener('click', function () {
      autoplay = !autoplay;
      localStorage.setItem('svl_autoplay', autoplay ? '1' : '0');
      btn.classList.toggle('active', autoplay);
      if (!autoplay) {
        player.pause();
        clearAllSpotlights();
      } else {
        var idx = parseInt(localStorage.getItem(getDeckKey() + '_pos') || '0', 10);
        currentSlideIdx = idx;
        playSlide(idx);
      }
    });

    // ── Space bar — pause / resume (capture phase to beat deck nav) ─
    document.addEventListener('keydown', function(e) {
      if (e.key !== ' ') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (player.src && !player.error) {
        e.preventDefault();
        e.stopPropagation();
        if (player.paused) {
          var p = player.play();
          if (p) p.catch(function() {});
        } else {
          player.pause();
        }
      }
    }, true);

    // ── R key — replay current slide from start ───────────────────
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'r' && e.key !== 'R') return;
      if (e.repeat) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (currentSlideIdx === null) return;
      lastZoomKey = null;
      clearAllSpotlights();
      if (window._zoomLens) window._zoomLens.hide();
      playSlide(currentSlideIdx);
    });

    // ── Called from startDwell on every slide change ──────────────
    window._playAudioSlide = function (idx) {
      currentSlideIdx = idx;
      lastSegmentTarget = null;
      lastSegmentLine   = null;
      lastZoomKey = null;
      clearAllSpotlights();
      if (window._zoomLens) window._zoomLens.hide();
      if (autoplay) playSlide(idx);
    };
  }

  /* ── Scripts Panel (voiceover) ─────────────────────────────── */
  function initScripts() {
    if (!window.DECK_SCRIPTS || !window.DECK_SCRIPTS.scripts) return;
    var controls = document.getElementById('deck-controls');
    if (!controls) return;

    var btn = document.createElement('button');
    btn.id = 'scripts-btn';
    btn.title = 'Voiceover script for this slide';
    btn.textContent = '\u2630'; // ☰
    controls.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'scripts-panel';

    var header = document.createElement('div');
    header.id = 'scripts-panel-header';
    var titleEl = document.createElement('div');
    titleEl.id = 'scripts-panel-title';
    titleEl.textContent = 'Voiceover Script';
    var wc = document.createElement('span');
    wc.id = 'scripts-wordcount';
    header.appendChild(titleEl);
    header.appendChild(wc);
    var sizeBtn = document.createElement('button');
    sizeBtn.id = 'scripts-size-btn';
    sizeBtn.title = 'Toggle larger text';
    sizeBtn.textContent = 'A+';
    if (localStorage.getItem('svl_scripts_large') === '1') {
      panel.classList.add('scripts-large');
      sizeBtn.classList.add('active');
    }
    sizeBtn.addEventListener('click', function() {
      var large = panel.classList.toggle('scripts-large');
      sizeBtn.classList.toggle('active', large);
      localStorage.setItem('svl_scripts_large', large ? '1' : '0');
    });
    header.appendChild(sizeBtn);
    var closeBtn = document.createElement('button');
    closeBtn.id = 'scripts-panel-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var body = document.createElement('div');
    body.id = 'scripts-text';
    panel.appendChild(body);
    document.body.appendChild(panel);

    function updateScript(slideIndex) {
      var entry = window.DECK_SCRIPTS.scripts.find(function(s) { return s.slide === slideIndex; });
      body.textContent = entry ? entry.script : '(No script for this slide)';
      wc.textContent = entry
        ? entry.word_count + ' words \u00b7 ~' + Math.round(entry.word_count / 140 * 60) + 's'
        : '';
    }

    btn.addEventListener('click', function () {
      panel.classList.toggle('active');
      btn.classList.toggle('active', panel.classList.contains('active'));
      if (panel.classList.contains('active')) {
        var idx = parseInt(localStorage.getItem(getDeckKey() + '_pos') || '0', 10);
        updateScript(idx);
      }
    });
    closeBtn.addEventListener('click', function () { panel.classList.remove('active'); btn.classList.remove('active'); });
    document.addEventListener('click', function(e) {
      if (panel.classList.contains('active') && !panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('active'); btn.classList.remove('active');
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.classList.contains('active')) { panel.classList.remove('active'); btn.classList.remove('active'); }
    });

    window._updateScriptPanel = function(idx) {
      if (panel.classList.contains('active')) updateScript(idx);
    };
  }

  /* ── Conductor Annotation Mode ─────────────────────────────── */
  function initAnnotation() {
    if (!window.DECK_SCRIPTS) return;
    var controls = document.getElementById('deck-controls');
    if (!controls) return;

    var annotating = false;
    var currentHoverEl = null;
    var currentHoverTarget = null;
    var currentHoverLine = null;
    var currentHoverLineEl = null;
    var currentHoverBlockIndex = 0;
    var baseName = window.location.pathname.split('/').pop().replace('.html', '');
    var STORAGE_KEY = 'svl_annot_' + baseName;

    var TARGET_MAP = [
      { selector: '.terminal',  target: 'code' },
      { selector: '.callout',   target: 'callout' },
      { selector: 'h2',         target: 'title' },
      { selector: '.annot-list', target: 'list' },
      { selector: 'svg',        target: 'diagram' },
      { selector: 'table',      target: 'table' },
      { selector: '.cols',      target: 'columns' },
    ];

    function getAnnotations() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
      catch (e) { return []; }
    }
    function saveAnnotations(annots) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(annots));
    }

    var ZOOM_KEY = 'svl_zoom_' + baseName;
    function getZoomAnnotations() {
      try { return JSON.parse(localStorage.getItem(ZOOM_KEY) || '[]'); }
      catch (e) { return []; }
    }
    function saveZoomAnnotations(zooms) {
      localStorage.setItem(ZOOM_KEY, JSON.stringify(zooms));
    }
    window._getLocalZooms = function(slideIdx) {
      return getZoomAnnotations().filter(function(z) { return z.slide === slideIdx; });
    };
    window._recordZoom = function(slideIdx, time_s, x, y, x2, y2, duration_s) {
      var zooms = getZoomAnnotations();
      zooms.push({
        slide: slideIdx,
        time_s: Math.round(time_s * 100) / 100,
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        x2: Math.round(x2 * 1000) / 1000,
        y2: Math.round(y2 * 1000) / 1000,
        duration_s: Math.round(duration_s * 100) / 100
      });
      zooms.sort(function(a, b) { return a.slide - b.slide || a.time_s - b.time_s; });
      saveZoomAnnotations(zooms);
      updatePanel();
    };

    function getCurrentSlideIdx() {
      var slides = document.querySelectorAll('.slide');
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) return i;
      }
      return 0;
    }
    function findSpotlightable(el) {
      var slideEl = document.querySelector('.slide.active');
      if (!slideEl) return null;
      var node = el;
      while (node && node !== slideEl) {
        for (var i = 0; i < TARGET_MAP.length; i++) {
          if (node.matches && node.matches(TARGET_MAP[i].selector)) {
            var result = { el: node, target: TARGET_MAP[i].target, line: null, blockIndex: 0 };
            // For code blocks, detect which line and which block index
            if (TARGET_MAP[i].target === 'code') {
              var lineEl = el;
              while (lineEl && lineEl !== node) {
                if (lineEl.classList && lineEl.classList.contains('code-line')) {
                  result.line   = parseInt(lineEl.dataset.line, 10) || null;
                  result.lineEl = lineEl;
                  break;
                }
                lineEl = lineEl.parentElement;
              }
              // Block index: which .terminal is this among siblings on the slide
              var allTerminals = slideEl.querySelectorAll('.terminal');
              var terminalEl = node.closest('.terminal');
              result.blockIndex = Array.from(allTerminals).indexOf(terminalEl);
              if (result.blockIndex < 0) result.blockIndex = 0;
            }
            return result;
          }
        }
        node = node.parentElement;
      }
      return null;
    }

    var btn = document.createElement('button');
    btn.id = 'annot-btn';
    btn.title = 'Conductor annotation mode \u2014 hover an element and click to capture';
    btn.textContent = '\u270e'; // ✎
    controls.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'annot-panel';
    panel.innerHTML =
      '<div id="annot-panel-mode">\u270f Annotation Mode</div>' +
      '<div id="annot-panel-info"></div>' +
      '<div id="annot-panel-hover"></div>' +
      '<div id="annot-panel-list"></div>' +
      '<div id="annot-panel-actions">' +
        '<button id="annot-clear-btn">Clear slide</button>' +
        '<button id="annot-export-btn">Export \u2193</button>' +
      '</div>';
    document.body.appendChild(panel);

    var panelInfo  = document.getElementById('annot-panel-info');
    var panelHover = document.getElementById('annot-panel-hover');
    var panelList  = document.getElementById('annot-panel-list');

    function updatePanel() {
      if (!annotating) return;
      var idx  = getCurrentSlideIdx();
      var time = window._audioPlayer ? window._audioPlayer.currentTime : 0;
      panelInfo.textContent  = 'Slide ' + (idx + 1) + ' \u00b7 ' + time.toFixed(1) + 's';
      var hoverLabel = currentHoverTarget
        ? '\u25bc ' + currentHoverTarget + (currentHoverLine ? ':' + currentHoverLine : '')
        : '(hover an element)';
      panelHover.textContent = hoverLabel;
      var slideAnnots = getAnnotations().filter(function(a) { return a.slide === idx; });
      var slideZooms  = getZoomAnnotations().filter(function(z) { return z.slide === idx; });
      var allEntries  = slideAnnots.map(function(a) {
          var label = a.line ? a.target + ':' + a.line : a.target;
          return { time_s: a.time_s, label: label };
        })
        .concat(slideZooms.map(function(z) { return { time_s: z.time_s, label: '\u26b2 ' + z.x.toFixed(2) + ',' + z.y.toFixed(2) }; }))
        .sort(function(a, b) { return a.time_s - b.time_s; });
      panelList.innerHTML = allEntries.length
        ? allEntries.map(function(entry) {
            return '<div class="annot-entry">' + entry.time_s.toFixed(1) + 's \u2192 ' + entry.label + '</div>';
          }).join('')
        : '<div class="annot-entry annot-entry-empty">No captures yet</div>';
    }

    var panelInterval = null;
    function enterAnnotation() {
      annotating = true;
      window._annotating = true;
      btn.classList.add('active');
      panel.classList.add('active');
      document.body.classList.add('annotating');
      if (window._clearAllSpotlights) window._clearAllSpotlights();
      panelInterval = setInterval(updatePanel, 250);
      updatePanel();
    }
    function exitAnnotation() {
      annotating = false;
      window._annotating = false;
      btn.classList.remove('active');
      panel.classList.remove('active');
      document.body.classList.remove('annotating');
      if (panelInterval) { clearInterval(panelInterval); panelInterval = null; }
      if (currentHoverEl)     currentHoverEl.classList.remove('annot-hover');
      if (currentHoverLineEl) currentHoverLineEl.classList.remove('code-line-hover');
      currentHoverEl         = null;
      currentHoverTarget     = null;
      currentHoverLine       = null;
      currentHoverLineEl     = null;
    }

    btn.addEventListener('click', function() {
      if (annotating) exitAnnotation(); else enterAnnotation();
    });
    document.getElementById('annot-clear-btn').addEventListener('click', function() {
      var idx = getCurrentSlideIdx();
      saveAnnotations(getAnnotations().filter(function(a) { return a.slide !== idx; }));
      saveZoomAnnotations(getZoomAnnotations().filter(function(z) { return z.slide !== idx; }));
      updatePanel();
    });
    document.getElementById('annot-export-btn').addEventListener('click', showExportModal);

    document.addEventListener('mousemove', function(e) {
      if (!annotating) return;
      var result = findSpotlightable(e.target);
      var newEl         = result ? result.el         : null;
      var newTarget     = result ? result.target     : null;
      var newLine       = result ? result.line       : null;
      var newLineEl     = result ? result.lineEl     : null;
      var newBlockIndex = result ? result.blockIndex : 0;
      if (newEl !== currentHoverEl || newLine !== currentHoverLine) {
        if (currentHoverEl)     currentHoverEl.classList.remove('annot-hover');
        if (currentHoverLineEl) currentHoverLineEl.classList.remove('code-line-hover');
        currentHoverEl         = newEl;
        currentHoverTarget     = newTarget;
        currentHoverLine       = newLine;
        currentHoverLineEl     = newLineEl;
        currentHoverBlockIndex = newBlockIndex;
        if (currentHoverEl)     currentHoverEl.classList.add('annot-hover');
        if (currentHoverLineEl) currentHoverLineEl.classList.add('code-line-hover');
      }
    });

    document.addEventListener('keydown', function(e) {
      if (!annotating) return;
      if (e.key === 'Escape') { exitAnnotation(); return; }
    });

    document.addEventListener('click', function(e) {
      if (!annotating) return;
      if (panel.contains(e.target) || e.target === btn) return;
      if (!currentHoverEl || !currentHoverTarget) return;
      var idx    = getCurrentSlideIdx();
      var time_s = window._audioPlayer ? window._audioPlayer.currentTime : 0;
      var annots = getAnnotations();
      var entry  = { slide: idx, time_s: Math.round(time_s * 100) / 100, target: currentHoverTarget };
      if (currentHoverLine)       entry.line       = currentHoverLine;
      if (currentHoverBlockIndex) entry.blockIndex = currentHoverBlockIndex;
      annots.push(entry);
      annots.sort(function(a, b) { return a.slide - b.slide || a.time_s - b.time_s; });
      saveAnnotations(annots);
      var flashEl = currentHoverEl;
      flashEl.classList.add('annot-flash');
      setTimeout(function() { flashEl.classList.remove('annot-flash'); }, 400);
      updatePanel();
    });

    function showExportModal() {
      var existing = document.getElementById('annot-export-modal');
      if (existing) existing.remove();

      var modal = document.createElement('div');
      modal.id = 'annot-export-modal';
      var box = document.createElement('div');
      box.id = 'annot-export-box';

      var hdr = document.createElement('div');
      hdr.id = 'annot-export-header';
      var titleEl = document.createElement('span');
      titleEl.textContent = 'Annotation Export';
      var closeX = document.createElement('button');
      closeX.id = 'annot-export-close';
      closeX.innerHTML = '&times;';
      closeX.addEventListener('click', function() { modal.remove(); });
      hdr.appendChild(titleEl);
      hdr.appendChild(closeX);
      box.appendChild(hdr);

      var annots   = getAnnotations();
      var zooms    = getZoomAnnotations();
      var slideMap = {};
      annots.forEach(function(a) { slideMap[a.slide] = true; });
      zooms.forEach(function(z) { slideMap[z.slide] = true; });
      var slideIdxs = Object.keys(slideMap).map(Number).sort(function(a, b) { return a - b; });

      var wrap = document.createElement('div');
      wrap.id = 'annot-compare-wrap';

      if (!slideIdxs.length) {
        wrap.innerHTML = '<p style="color:#8b949e;text-align:center;padding:20px 0;">No annotations yet.</p>';
      } else {
        var table = document.createElement('table');
        table.id = 'annot-compare-table';
        table.innerHTML =
          '<thead><tr><th>Slide</th><th>AI elements</th><th>Human elements</th>' +
          '<th>Jaccard</th><th>Avg \u0394t</th><th>Zooms</th></tr></thead>';
        var tbody = document.createElement('tbody');
        var totalJ = 0, jN = 0, totalDt = 0, dtN = 0;

        slideIdxs.forEach(function(sIdx) {
          var entry     = window.DECK_SCRIPTS.scripts.find(function(s) { return s.slide === sIdx; });
          var aiSegs    = (entry && entry.segments) ? entry.segments.filter(function(s) { return s.target !== 'full'; }) : [];
          var humSegs   = annots.filter(function(a) { return a.slide === sIdx; });
          var slideZooms = zooms.filter(function(z) { return z.slide === sIdx; });
          var aiSet   = new Set(aiSegs.map(function(s) { return s.target; }));
          var humSet  = new Set(humSegs.map(function(a) { return a.target; }));
          var inter = 0;
          humSet.forEach(function(t) { if (aiSet.has(t)) inter++; });
          var union   = aiSet.size + humSet.size - inter;
          var jaccard = union > 0 ? inter / union : 1;
          if (humSet.size > 0 || aiSet.size > 0) { totalJ += jaccard; jN++; }

          var dtSum = 0, dtCount = 0;
          humSegs.forEach(function(h) {
            var match = aiSegs.find(function(a) { return a.target === h.target; });
            if (match) { dtSum += Math.abs(h.time_s - match.start_word / 140 * 60); dtCount++; }
          });
          var avgDt = dtCount ? (dtSum / dtCount).toFixed(1) + 's' : '\u2014';
          if (dtCount) { totalDt += dtSum / dtCount; dtN++; }

          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + (sIdx + 1) + '</td>' +
            '<td>' + (Array.from(aiSet).join(', ')  || '\u2014') + '</td>' +
            '<td>' + (Array.from(humSet).join(', ') || '\u2014') + '</td>' +
            '<td>' + (humSet.size || aiSet.size ? (jaccard * 100).toFixed(0) + '%' : '\u2014') + '</td>' +
            '<td>' + avgDt + '</td>' +
            '<td>' + (slideZooms.length || '\u2014') + '</td>';
          tbody.appendChild(tr);
        });

        var totalZooms = zooms.length;
        var sumTr = document.createElement('tr');
        sumTr.id = 'annot-summary-row';
        sumTr.innerHTML =
          '<td colspan="3"><strong>' + slideIdxs.length + ' slide(s) annotated</strong></td>' +
          '<td>' + (jN  ? (totalJ  / jN  * 100).toFixed(0) + '%' : '\u2014') + '</td>' +
          '<td>' + (dtN ? (totalDt / dtN).toFixed(1) + 's'        : '\u2014') + '</td>' +
          '<td>' + (totalZooms || '\u2014') + '</td>';
        tbody.appendChild(sumTr);
        table.appendChild(tbody);
        wrap.appendChild(table);
      }
      box.appendChild(wrap);

      var actions = document.createElement('div');
      actions.id = 'annot-export-actions';
      var dlBtn = document.createElement('button');
      dlBtn.className = 'annot-action-btn';
      dlBtn.textContent = 'Download scripts.js';
      dlBtn.addEventListener('click', downloadScripts);
      var copyBtn = document.createElement('button');
      copyBtn.className = 'annot-action-btn annot-action-secondary';
      copyBtn.textContent = 'Copy JSON';
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(JSON.stringify({ spotlights: getAnnotations(), zooms: getZoomAnnotations() }, null, 2))
          .then(function() {
            copyBtn.textContent = 'Copied!';
            setTimeout(function() { copyBtn.textContent = 'Copy JSON'; }, 1500);
          });
      });
      actions.appendChild(dlBtn);
      actions.appendChild(copyBtn);
      box.appendChild(actions);
      modal.appendChild(box);
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    }

    function downloadScripts() {
      var annots = getAnnotations();
      var zooms  = getZoomAnnotations();
      var scripts = window.DECK_SCRIPTS.scripts.map(function(entry) {
        var clone = Object.assign({}, entry);
        clone.segments = (clone.segments || []).map(function(s) {
          return Object.assign({}, s, { source: 'ai' });
        });
        var slideAnnots = annots.filter(function(a) { return a.slide === entry.slide; });
        var slideZooms  = zooms.filter(function(z) { return z.slide === entry.slide; });
        if (slideAnnots.length || slideZooms.length) {
          var humanSegs = slideAnnots.map(function(a) {
            var seg = { time_s: a.time_s, target: a.target, source: 'human' };
            if (a.line != null)   seg.line       = a.line;
            if (a.blockIndex)     seg.blockIndex = a.blockIndex;
            return seg;
          });
          var zoomSegs = slideZooms.map(function(z) {
            var seg = { type: 'zoom', time_s: z.time_s, x: z.x, y: z.y, x2: z.x2, y2: z.y2, duration_s: z.duration_s, source: 'human' };
            return seg;
          });
          clone.human_segments = humanSegs.concat(zoomSegs)
            .sort(function(a, b) { return a.time_s - b.time_s; });
        }
        return clone;
      });
      var updated = Object.assign({}, window.DECK_SCRIPTS, { scripts: scripts });
      var content = 'window.DECK_SCRIPTS = ' + JSON.stringify(updated, null, 2) + ';\n';
      var blob = new Blob([content], { type: 'text/javascript' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = window.DECK_SCRIPTS.deck + '.scripts.js';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /* ── Zoom Lens (right-click hold) ──────────────────────────── */
  function initZoomLens() {
    var lensEl         = null;
    var isPlaybackZoom = false;
    var rafId          = null;
    var activeZoomEntry = null;
    var SCALE  = 2.5;
    var LENS_W = 360;
    var LENS_H = 240;
    var zoomStartTime  = null;
    var zoomStartNormX = null;
    var zoomStartNormY = null;
    var currentMouseX  = 0;
    var currentMouseY  = 0;

    function createLens(e) {
      var slideEl = document.querySelector('.slide.active');
      if (!slideEl) return;
      var sr = slideEl.getBoundingClientRect();

      lensEl = document.createElement('div');
      lensEl.id = 'zoom-lens';

      var stage = document.createElement('div');
      stage.id = 'zoom-stage';
      stage.style.position      = 'absolute';
      stage.style.transformOrigin = '0 0';
      stage.style.transform     = 'scale(' + SCALE + ')';
      stage.style.width         = sr.width  + 'px';
      stage.style.height        = sr.height + 'px';

      var clone = slideEl.cloneNode(true);
      clone.style.cssText =
        'position:relative;display:flex;margin:0;inset:auto;border-radius:0;' +
        'width:'  + sr.width  + 'px;' +
        'height:' + sr.height + 'px;';

      stage.appendChild(clone);
      lensEl.appendChild(stage);
      document.body.appendChild(lensEl);
      positionLens(e, sr);
    }

    function positionLens(e, sr) {
      if (!lensEl) return;
      if (!sr) {
        var slideEl = document.querySelector('.slide.active');
        sr = slideEl ? slideEl.getBoundingClientRect() : null;
      }

      // Centre lens on cursor, clamp to viewport edges
      var lx = e.clientX - LENS_W / 2;
      var ly = e.clientY - LENS_H / 2;
      lx = Math.max(10, Math.min(lx, window.innerWidth  - LENS_W  - 10));
      ly = Math.max(10, Math.min(ly, window.innerHeight - LENS_H - 10));
      lensEl.style.left = lx + 'px';
      lensEl.style.top  = ly + 'px';

      // Stage offset: cursor point → lens centre
      if (sr) {
        var cx = e.clientX - sr.left;
        var cy = e.clientY - sr.top;
        var stage = document.getElementById('zoom-stage');
        if (stage) {
          stage.style.left = (LENS_W / 2 - cx * SCALE) + 'px';
          stage.style.top  = (LENS_H / 2 - cy * SCALE) + 'px';
        }
      }
    }

    function stopPan() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      activeZoomEntry = null;
    }

    function removeLens() {
      stopPan();
      if (lensEl) { lensEl.remove(); lensEl = null; }
      isPlaybackZoom = false;
    }

    function startPan(entry) {
      activeZoomEntry = entry;
      if (rafId) cancelAnimationFrame(rafId);
      function frame() {
        if (!lensEl || !activeZoomEntry || !window._audioPlayer) return;
        if (activeZoomEntry.x2 !== undefined) {
          var elapsed  = window._audioPlayer.currentTime - activeZoomEntry.time_s;
          var progress = activeZoomEntry.duration_s > 0
            ? Math.min(1, elapsed / activeZoomEntry.duration_s) : 0;
          moveTo(
            activeZoomEntry.x + (activeZoomEntry.x2 - activeZoomEntry.x) * progress,
            activeZoomEntry.y + (activeZoomEntry.y2 - activeZoomEntry.y) * progress
          );
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    }

    // Playback API: show lens at normalised slide coords (0–1)
    function showAt(normX, normY) {
      isPlaybackZoom = true;
      removeLens();
      isPlaybackZoom = true; // removeLens clears it — restore
      var slideEl = document.querySelector('.slide.active');
      if (!slideEl) return;
      var sr = slideEl.getBoundingClientRect();
      createLens({ clientX: sr.left + normX * sr.width, clientY: sr.top + normY * sr.height });
    }

    // Move existing lens to normalised coords without recreating it
    function moveTo(normX, normY) {
      if (!lensEl) return;
      var slideEl = document.querySelector('.slide.active');
      if (!slideEl) return;
      var sr = slideEl.getBoundingClientRect();
      positionLens({ clientX: sr.left + normX * sr.width, clientY: sr.top + normY * sr.height }, sr);
    }

    window._zoomLens = { showAt: showAt, moveTo: moveTo, startPan: startPan, hide: removeLens };

    document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);
    document.addEventListener('mousedown', function(e) {
      if (e.button !== 2) return;
      createLens(e);
      if (window._annotating) {
        var slideEl = document.querySelector('.slide.active');
        var sr = slideEl ? slideEl.getBoundingClientRect() : null;
        if (sr) {
          zoomStartTime  = window._audioPlayer ? window._audioPlayer.currentTime : 0;
          zoomStartNormX = (e.clientX - sr.left) / sr.width;
          zoomStartNormY = (e.clientY - sr.top)  / sr.height;
        }
      }
    });
    document.addEventListener('mousemove', function(e) {
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;
      if (lensEl && !isPlaybackZoom) positionLens(e, null);
    });

    // Z key — hold to zoom (show on keydown, hide + record on keyup)
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'z' && e.key !== 'Z') return;
      if (e.repeat || lensEl) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      var slideEl = document.querySelector('.slide.active');
      var sr = slideEl ? slideEl.getBoundingClientRect() : null;
      createLens({ clientX: currentMouseX, clientY: currentMouseY });
      if (window._annotating && sr) {
        zoomStartTime  = window._audioPlayer ? window._audioPlayer.currentTime : 0;
        zoomStartNormX = (currentMouseX - sr.left) / sr.width;
        zoomStartNormY = (currentMouseY - sr.top)  / sr.height;
      }
    });
    document.addEventListener('keyup', function(e) {
      if (e.key !== 'z' && e.key !== 'Z') return;
      if (!lensEl) return;
      e.preventDefault();
      if (window._annotating && zoomStartTime !== null && window._recordZoom) {
        var slides = document.querySelectorAll('.slide');
        var slideIdx = 0;
        for (var i = 0; i < slides.length; i++) {
          if (slides[i].classList.contains('active')) { slideIdx = i; break; }
        }
        var endSlideEl = document.querySelector('.slide.active');
        var endSr = endSlideEl ? endSlideEl.getBoundingClientRect() : null;
        var endNormX = endSr ? (currentMouseX - endSr.left) / endSr.width  : zoomStartNormX;
        var endNormY = endSr ? (currentMouseY - endSr.top)  / endSr.height : zoomStartNormY;
        var duration = window._audioPlayer
          ? Math.max(0.1, window._audioPlayer.currentTime - zoomStartTime)
          : 1;
        window._recordZoom(slideIdx, zoomStartTime, zoomStartNormX, zoomStartNormY, endNormX, endNormY, duration);
      }
      zoomStartTime = null;
      removeLens();
    });

    // Right-click hold (mouse users)
    document.addEventListener('mousedown', function(e) {
      if (e.button !== 2) return;
      createLens(e);
      if (window._annotating) {
        var slideEl = document.querySelector('.slide.active');
        var sr = slideEl ? slideEl.getBoundingClientRect() : null;
        if (sr) {
          zoomStartTime  = window._audioPlayer ? window._audioPlayer.currentTime : 0;
          zoomStartNormX = (e.clientX - sr.left) / sr.width;
          zoomStartNormY = (e.clientY - sr.top)  / sr.height;
        }
      }
    });
    document.addEventListener('mouseup', function(e) {
      if (e.button !== 2) return;
      if (window._annotating && zoomStartTime !== null && window._recordZoom) {
        var slides = document.querySelectorAll('.slide');
        var slideIdx = 0;
        for (var i = 0; i < slides.length; i++) {
          if (slides[i].classList.contains('active')) { slideIdx = i; break; }
        }
        var endSlideEl = document.querySelector('.slide.active');
        var endSr = endSlideEl ? endSlideEl.getBoundingClientRect() : null;
        var endNormX = endSr ? (e.clientX - endSr.left) / endSr.width  : zoomStartNormX;
        var endNormY = endSr ? (e.clientY - endSr.top)  / endSr.height : zoomStartNormY;
        var duration = window._audioPlayer
          ? Math.max(0.1, window._audioPlayer.currentTime - zoomStartTime)
          : 1;
        window._recordZoom(slideIdx, zoomStartTime, zoomStartNormX, zoomStartNormY, endNormX, endNormY, duration);
      }
      zoomStartTime = null;
      removeLens();
    });
  }

  /* ── Sticky Notes ──────────────────────────────────────────── */
  function initNotes() {
    var baseName   = window.location.pathname.split('/').pop().replace('.html', '');
    var NOTES_KEY  = 'svl_notes_' + baseName;
    var SIZE_KEY   = 'svl_notes_large';
    var controls   = document.getElementById('deck-controls');
    var panelOpen  = false;
    var notesLarge = localStorage.getItem(SIZE_KEY) === '1';

    function getNotes() {
      try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); }
      catch(e) { return []; }
    }
    function saveNotes(notes) { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }
    function getCurrentIdx() {
      var slides = document.querySelectorAll('.slide');
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) return i;
      }
      return 0;
    }

    // Controls button
    var btn = document.createElement('button');
    btn.id = 'notes-btn';
    btn.textContent = '\u270d'; // ✍
    btn.title = 'Slide notes (N)';
    controls.appendChild(btn);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'notes-panel';
    if (notesLarge) panel.classList.add('notes-large');
    document.body.appendChild(panel);

    // focusTa: true = focus the textarea after render (only on explicit open/save)
    function renderPanel(focusTa) {
      var idx = getCurrentIdx();
      var slideNotes = getNotes().filter(function(n) { return n.slide === idx; });

      btn.classList.toggle('active', slideNotes.length > 0);
      btn.title = slideNotes.length
        ? slideNotes.length + ' note(s) \u2014 N to toggle'
        : 'Slide notes (N)';

      if (!panelOpen) return;

      panel.innerHTML = '';
      if (notesLarge) panel.classList.add('notes-large');

      // Header
      var hdr = document.createElement('div');
      hdr.className = 'notes-panel-hdr';

      var title = document.createElement('span');
      title.className = 'notes-panel-title';
      title.textContent = 'Notes \u2014 Slide ' + (idx + 1);

      var sizeBtn = document.createElement('button');
      sizeBtn.className = 'notes-size-btn';
      sizeBtn.textContent = 'A+';
      sizeBtn.title = 'Toggle larger text';
      if (notesLarge) sizeBtn.classList.add('active');
      sizeBtn.addEventListener('click', function() {
        notesLarge = !notesLarge;
        localStorage.setItem(SIZE_KEY, notesLarge ? '1' : '0');
        panel.classList.toggle('notes-large', notesLarge);
        sizeBtn.classList.toggle('active', notesLarge);
      });

      var closeBtn = document.createElement('button');
      closeBtn.className = 'notes-panel-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = 'Close notes panel';
      closeBtn.addEventListener('click', closePanel);

      hdr.appendChild(title);
      hdr.appendChild(sizeBtn);
      hdr.appendChild(closeBtn);
      panel.appendChild(hdr);

      // Notes list
      var list = document.createElement('div');
      list.className = 'notes-list';
      if (slideNotes.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'notes-empty';
        empty.textContent = 'No notes for this slide yet.';
        list.appendChild(empty);
      } else {
        slideNotes.forEach(function(note) {
          var item = document.createElement('div');
          item.className = 'notes-item';
          var meta = document.createElement('div');
          meta.className = 'notes-item-meta';
          var dateSpan = document.createElement('span');
          dateSpan.textContent = note.created;
          var delBtn = document.createElement('button');
          delBtn.className = 'notes-item-del';
          delBtn.textContent = '\u{1F5D1}'; // 🗑 trash
          delBtn.title = 'Delete this note';
          delBtn.addEventListener('click', function() {
            saveNotes(getNotes().filter(function(n) { return n.id !== note.id; }));
            renderPanel(false);
          });
          meta.appendChild(dateSpan);
          meta.appendChild(delBtn);
          var text = document.createElement('div');
          text.className = 'notes-item-text';
          text.textContent = note.text;
          item.appendChild(meta);
          item.appendChild(text);
          list.appendChild(item);
        });
      }
      panel.appendChild(list);

      // Add note area
      var addArea = document.createElement('div');
      addArea.className = 'notes-add-area';
      var ta = document.createElement('textarea');
      ta.className = 'notes-ta';
      ta.placeholder = 'Type a note\u2026 (Ctrl+Enter to save)';
      var actions = document.createElement('div');
      actions.className = 'notes-actions';
      var saveNoteBtn = document.createElement('button');
      saveNoteBtn.className = 'notes-save-btn';
      saveNoteBtn.textContent = 'Save';
      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'notes-cancel-btn';
      cancelBtn.textContent = 'Clear';

      function saveNote() {
        var text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        var notes = getNotes();
        notes.push({ id: Date.now(), slide: getCurrentIdx(), text: text,
          created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        saveNotes(notes);
        renderPanel(true);
      }

      saveNoteBtn.addEventListener('click', saveNote);
      cancelBtn.addEventListener('click', function() { ta.value = ''; ta.focus(); });
      ta.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { e.stopPropagation(); ta.value = ''; ta.blur(); }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote();
      });

      actions.appendChild(saveNoteBtn);
      actions.appendChild(cancelBtn);
      addArea.appendChild(ta);
      addArea.appendChild(actions);
      panel.appendChild(addArea);

      panel.classList.add('active');
      if (focusTa) ta.focus();
    }

    function openPanel()  { panelOpen = true;  renderPanel(true); }
    function closePanel() { panelOpen = false; panel.classList.remove('active'); renderPanel(false); }
    function togglePanel() { if (panelOpen) closePanel(); else openPanel(); }

    btn.addEventListener('click', togglePanel);

    // N key
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'n' && e.key !== 'N') return;
      if (e.repeat) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      togglePanel();
    });

    // Watch for slide changes — re-render without stealing focus
    document.querySelectorAll('.slide').forEach(function(slide) {
      new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.target.classList.contains('active')) renderPanel(false);
        });
      }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    });

    renderPanel(false);
  }

  /* ── Human Voiceover Recorder ─────────────────────────────── */
  function initRecorder() {
    if (!navigator.mediaDevices || !window.MediaRecorder) return;

    var recordings   = {};      // slideIdx → { blob, url, ext, duration }
    var mediaRecorder = null;
    var stream        = null;
    var chunks        = [];
    var recState      = 'idle'; // idle | requesting | recording
    var recSlide      = 0;
    var recStart      = 0;
    var timerInterval = null;
    var panelOpen     = false;

    var deckName = window.DECK_SCRIPTS ? window.DECK_SCRIPTS.deck : getDeckKey();

    // ── Controls button ───────────────────────────────────────
    var btn = document.createElement('button');
    btn.id    = 'rec-btn';
    btn.title = 'Record human voiceover for this slide';
    btn.textContent = '\uD83C\uDFA4'; // 🎤
    document.getElementById('deck-controls').appendChild(btn);

    // ── Panel ─────────────────────────────────────────────────
    var panel = document.createElement('div');
    panel.id = 'rec-panel';

    var hdr = document.createElement('div');
    hdr.id = 'rec-panel-header';
    var titleEl = document.createElement('span');
    titleEl.id = 'rec-panel-title';
    titleEl.textContent = 'Human Voiceover';
    var closeBtn = document.createElement('button');
    closeBtn.id = 'rec-panel-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';
    hdr.appendChild(titleEl);
    hdr.appendChild(closeBtn);
    panel.appendChild(hdr);

    var statusEl = document.createElement('div');
    statusEl.id = 'rec-status';
    panel.appendChild(statusEl);

    var recActionBtn = document.createElement('button');
    recActionBtn.id = 'rec-action-btn';
    panel.appendChild(recActionBtn);

    var listEl = document.createElement('div');
    listEl.id = 'rec-list';
    panel.appendChild(listEl);

    document.body.appendChild(panel);

    // ── Helpers ───────────────────────────────────────────────
    function currentSlideIdx() {
      var slides = document.querySelectorAll('.slide');
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) return i;
      }
      return 0;
    }

    function fmtTime(s) {
      var m = Math.floor(s / 60), sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function getExt(mime) {
      if (!mime) return 'webm';
      if (mime.includes('ogg'))  return 'ogg';
      if (mime.includes('mp4'))  return 'mp4';
      return 'webm';
    }

    // ── Render ────────────────────────────────────────────────
    function updateUI() {
      var idx     = currentSlideIdx();
      var elapsed = recState === 'recording' ? (Date.now() - recStart) / 1000 : 0;

      // Status
      if (recState === 'requesting') {
        statusEl.textContent = 'Requesting microphone\u2026';
      } else if (recState === 'recording') {
        statusEl.textContent = 'Recording slide ' + (recSlide + 1) + ' \u2022 ' + fmtTime(elapsed);
      } else {
        statusEl.textContent = 'Slide ' + (idx + 1) + (recordings[idx] ? ' \u2022 recorded \u2713' : ' \u2022 ready');
      }

      // Record / Stop button
      if (recState === 'idle') {
        recActionBtn.textContent = recordings[idx] ? '\u25CF Re-record' : '\u25CF Record';
        recActionBtn.dataset.mode = 'record';
        recActionBtn.disabled = false;
      } else if (recState === 'requesting') {
        recActionBtn.textContent = '\u2026';
        recActionBtn.dataset.mode = '';
        recActionBtn.disabled = true;
      } else {
        recActionBtn.textContent = '\u25A0 Stop';
        recActionBtn.dataset.mode = 'stop';
        recActionBtn.disabled = false;
      }
      recActionBtn.className = 'rec-action-' + (recState === 'recording' ? 'stop' : 'record');

      // Recordings list
      listEl.innerHTML = '';
      var keys = Object.keys(recordings).map(Number).sort(function(a,b){return a-b;});
      if (!keys.length) {
        var empty = document.createElement('p');
        empty.id = 'rec-empty';
        empty.textContent = 'No recordings yet.';
        listEl.appendChild(empty);
      } else {
        keys.forEach(function(k) {
          var r = recordings[k];
          var item = document.createElement('div');
          item.className = 'rec-item';

          var label = document.createElement('span');
          label.className = 'rec-item-label';
          label.textContent = 'Slide ' + (k + 1) + ' \u00B7 ' + fmtTime(r.duration);

          var playBtn = document.createElement('button');
          playBtn.className = 'rec-item-btn';
          playBtn.title = 'Preview';
          playBtn.textContent = '\u25B6';
          (function(url) {
            var aud = new Audio(url);
            playBtn.addEventListener('click', function() { aud.currentTime = 0; aud.play(); });
          }(r.url));

          var dlLink = document.createElement('a');
          dlLink.className = 'rec-item-btn';
          dlLink.title = 'Download';
          dlLink.textContent = '\u2193';
          dlLink.href = r.url;
          dlLink.download = deckName + '-slide-' + (k + 1) + '.' + r.ext;

          item.appendChild(label);
          item.appendChild(playBtn);
          item.appendChild(dlLink);
          listEl.appendChild(item);
        });

        // Download all button if more than one recording
        if (keys.length > 1) {
          var dlAll = document.createElement('button');
          dlAll.id = 'rec-dl-all';
          dlAll.textContent = '\u2193 Download all (' + keys.length + ')';
          dlAll.addEventListener('click', function() {
            keys.forEach(function(k, i) {
              setTimeout(function() {
                var a = document.createElement('a');
                a.href = recordings[k].url;
                a.download = deckName + '-slide-' + (k + 1) + '.' + recordings[k].ext;
                a.click();
              }, i * 400);
            });
          });
          listEl.appendChild(dlAll);
        }
      }
    }

    // ── Recording logic ───────────────────────────────────────
    function startRecording() {
      recState = 'requesting';
      recSlide = currentSlideIdx();
      updateUI();

      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(function(s) {
          stream = s;
          chunks = [];

          var opts = {};
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            opts.mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            opts.mimeType = 'audio/ogg;codecs=opus';
          }

          mediaRecorder = new MediaRecorder(stream, opts);
          mediaRecorder.ondataavailable = function(e) {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };
          mediaRecorder.onstop = function() {
            var mime = mediaRecorder.mimeType;
            var blob = new Blob(chunks, { type: mime });
            var duration = (Date.now() - recStart) / 1000;
            if (recordings[recSlide]) URL.revokeObjectURL(recordings[recSlide].url);
            recordings[recSlide] = { blob: blob, url: URL.createObjectURL(blob),
                                     ext: getExt(mime), duration: duration };
            clearInterval(timerInterval);
            recState = 'idle';
            btn.classList.remove('recording');
            stream.getTracks().forEach(function(t) { t.stop(); });
            updateUI();
          };

          recState = 'recording';
          recStart = Date.now();
          btn.classList.add('recording');
          mediaRecorder.start(100);
          timerInterval = setInterval(updateUI, 500);
          updateUI();
        })
        .catch(function() {
          recState = 'idle';
          statusEl.textContent = 'Microphone access denied.';
          updateUI();
        });
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    }

    // ── Events ────────────────────────────────────────────────
    recActionBtn.addEventListener('click', function() {
      if (recState === 'idle')      startRecording();
      else if (recState === 'recording') stopRecording();
    });

    btn.addEventListener('click', function() {
      if (recState === 'recording') { stopRecording(); return; }
      panelOpen = !panelOpen;
      panel.classList.toggle('active', panelOpen);
      btn.classList.toggle('active', panelOpen);
      if (panelOpen) updateUI();
    });

    closeBtn.addEventListener('click', function() {
      panelOpen = false;
      panel.classList.remove('active');
      btn.classList.remove('active');
    });

    // Stop recording if user navigates to a different slide
    document.querySelectorAll('.slide').forEach(function(s) {
      new MutationObserver(function(muts) {
        muts.forEach(function(m) {
          if (m.attributeName === 'class' && m.target.classList.contains('active')) {
            if (recState === 'recording') stopRecording();
            if (panelOpen) updateUI();
          }
        });
      }).observe(s, { attributes: true, attributeFilter: ['class'] });
    });

    updateUI();
  }

  /* ── Code Line Wrapping ────────────────────────────────────── */
  function initCodeLines() {
    document.querySelectorAll('.terminal-body').forEach(function(body) {
      if (body.querySelector('.code-line')) return; // already wrapped
      var lines = body.innerHTML.split('\n');
      body.innerHTML = lines.map(function(line, i) {
        return '<span class="code-line" data-line="' + (i + 1) + '">' + line + '</span>';
      }).join('');
    });
  }
  // deck-extras.js loads at end of <body> — DOM is already ready, run immediately
  initCodeLines();

  /* ── Text size control (A− / A+) ──────────────────────────────
     Three global levels applied as a body class; deck-extras.css
     enlarges the shared slide selectors and lets slides scroll.   */
  function initTextSize() {
    var LEVELS = ['', 'lg', 'xl'];
    var LABELS = { '': '100%', 'lg': '125%', 'xl': '150%' };

    function current() {
      if (document.body.classList.contains('text-xl')) return 2;
      if (document.body.classList.contains('text-lg')) return 1;
      return 0;
    }
    function apply(i) {
      i = Math.max(0, Math.min(LEVELS.length - 1, i));
      document.body.classList.remove('text-lg', 'text-xl');
      if (LEVELS[i]) document.body.classList.add('text-' + LEVELS[i]);
      try { localStorage.setItem('svl_textsize', LEVELS[i]); } catch (e) {}
      var pct = LABELS[LEVELS[i]];
      minus.disabled = (i === 0);
      plus.disabled = (i === LEVELS.length - 1);
      label.textContent = pct;
      live.textContent = 'Text size ' + pct;
      // Keep the current slide in view after reflow
      var act = document.querySelector('.slide.active');
      if (act) act.scrollTop = 0;
    }

    var wrap = document.createElement('div');
    wrap.id = 'textsize-ctrl';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Text size');

    var minus = document.createElement('button');
    minus.type = 'button';
    minus.id = 'textsize-minus';
    minus.textContent = 'A−';
    minus.setAttribute('aria-label', 'Decrease text size');

    var label = document.createElement('span');
    label.id = 'textsize-label';
    label.setAttribute('aria-hidden', 'true');

    var plus = document.createElement('button');
    plus.type = 'button';
    plus.id = 'textsize-plus';
    plus.textContent = 'A+';
    plus.setAttribute('aria-label', 'Increase text size');

    var live = document.createElement('span');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');

    minus.addEventListener('click', function () { apply(current() - 1); });
    plus.addEventListener('click', function () { apply(current() + 1); });

    wrap.appendChild(minus);
    wrap.appendChild(label);
    wrap.appendChild(plus);
    wrap.appendChild(live);

    var controls = document.getElementById('deck-controls');
    if (controls) controls.appendChild(wrap);
    apply(current());
  }

  /* ── Screen-reader / keyboard accessibility scaffolding ─────── */
  function initA11y() {
    var slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    var total = slides.length;

    // Each slide is a labelled group and programmatically focusable
    slides.forEach(function (s, i) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      if (!s.hasAttribute('tabindex')) s.setAttribute('tabindex', '-1');
      if (!s.id) s.id = 'slide-' + (i + 1);
    });

    // Navigation landmark + button labels
    var nav = document.getElementById('nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Slide navigation');
    }
    var LBL = {
      'prev': 'Previous slide', 'next': 'Next slide',
      'nav-first': 'First slide', 'nav-last': 'Last slide'
    };
    Object.keys(LBL).forEach(function (id) {
      var b = document.getElementById(id);
      if (b) { b.setAttribute('aria-label', LBL[id]); }
    });

    // Live region: announces "Slide N of T: <heading>" on change
    var live = document.createElement('div');
    live.id = 'a11y-live';
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    document.body.appendChild(live);

    // Skip link: jump keyboard focus straight to the active slide
    var skip = document.createElement('a');
    skip.id = 'a11y-skip';
    skip.href = '#';
    skip.textContent = 'Skip to slide content';
    skip.addEventListener('click', function (e) {
      e.preventDefault();
      var act = document.querySelector('.slide.active');
      if (act) act.focus();
    });
    document.body.insertBefore(skip, document.body.firstChild);

    window._announceSlide = function (idx) {
      var s = slides[idx];
      if (!s) return;
      var h = s.querySelector('h1, h2, h3');
      var lbl = s.querySelector('.slide-label');
      var name = (h && h.textContent.trim()) ||
                 (lbl && lbl.textContent.trim()) || '';
      live.textContent = 'Slide ' + (idx + 1) + ' of ' + total +
                         (name ? ': ' + name : '');
    };

    // Announce whichever slide is active now
    var act = document.querySelector('.slide.active');
    if (act) window._announceSlide(Array.prototype.indexOf.call(slides, act));
  }

  /* ── Initialise on DOMContentLoaded ───────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initHUD();
    initTheme();
    initLO();
    initCodeLines(); // no-op if already ran above
    initAudio();
    initAssessments();
    initAnnotation();
    initScripts();
    initZoomLens();
    initNotes();
    initRecorder();
    initQuiz();
    initTextSize();

    // ── "Demo App" link text ──────────────────────────────────
    var appLink = document.getElementById('app-link');
    if (appLink) appLink.textContent = 'Demo App \u2197';

    // ── First/last slide buttons in nav ──────────────────────
    var nav = document.getElementById('nav');
    if (nav) {
      var prevBtn = nav.querySelector('button');
      if (prevBtn) {
        var firstBtn = document.createElement('button');
        firstBtn.id = 'nav-first';
        firstBtn.className = 'nav-btn';
        firstBtn.textContent = '<<';
        firstBtn.title = 'First slide (Home)';
        firstBtn.addEventListener('click', function () { navigateTo(0); });
        nav.insertBefore(firstBtn, prevBtn);
      }
      var lastBtn = document.createElement('button');
      lastBtn.id = 'nav-last';
      lastBtn.className = 'nav-btn';
      lastBtn.textContent = '>>';
      lastBtn.title = 'Last slide (End)';
      lastBtn.addEventListener('click', function () {
        if (lastBtn.disabled) return;
        var s = document.querySelectorAll('.slide');
        if (s.length) navigateTo(s.length - 1);
      });
      nav.appendChild(lastBtn);
    }

    initA11y();

    document.addEventListener('keydown', function (e) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (e.key === 'Home') { navigateTo(0); e.preventDefault(); }
      if (e.key === 'End') {
        var lb = document.getElementById('nav-last');
        if (lb && !lb.disabled) {
          var s = document.querySelectorAll('.slide');
          if (s.length) { navigateTo(s.length - 1); e.preventDefault(); }
        }
      }
    });

    // ── MutationObserver: dwell-gated progress tracking ───────
    // _pos saved immediately (for restore); _max only after 4s dwell (for index.html progress)
    var slides = document.querySelectorAll('.slide');
    var key = getDeckKey();
    if (slides.length) {
      localStorage.setItem(key + '_total', slides.length);
      var dwellTimer = null;

      function startDwell(idx) {
        saveProgress(idx);
        if (window._announceSlide) window._announceSlide(idx);
        if (window._updateScriptPanel) window._updateScriptPanel(idx);
        if (window._playAudioSlide) window._playAudioSlide(idx);
        if (dwellTimer) clearTimeout(dwellTimer);
        dwellTimer = setTimeout(function () {
          saveDwellMax(idx);
          updateNavLastState();
        }, 4000);
      }

      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === 'class' && m.target.classList.contains('active')) {
            var idx = Array.prototype.indexOf.call(slides, m.target);
            if (idx >= 0) startDwell(idx);
          }
        });
      });
      slides.forEach(function (s) {
        observer.observe(s, { attributes: true, attributeFilter: ['class'] });
      });

      // Kick off dwell for whichever slide is already active at load time
      var active = document.querySelector('.slide.active');
      if (active) {
        var ai = Array.prototype.indexOf.call(slides, active);
        if (ai >= 0) startDwell(ai);
      }

      updateNavLastState();
    }

    // ── Restore saved slide position ──────────────────────────
    var savedPos = parseInt(localStorage.getItem(key + '_pos') || '0', 10);
    if (savedPos > 0) {
      setTimeout(function () { navigateTo(savedPos); }, 50);
    }
  });

})();
