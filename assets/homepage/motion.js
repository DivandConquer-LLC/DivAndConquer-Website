/* ============================================================
   Div & Conquer — motion. One easing curve. Every move is a
   slide, a turn, or a mask. Scroll-driven, intensity-aware.
   ============================================================ */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function motionOff(){ return reduce || root.getAttribute('data-motion') === 'off'; }
  function mo(){ var m = window.__dcMotion; return (typeof m === 'number') ? m : 1; }

  /* cubelet idle-solve gate */
  function syncSolve(){ document.body.classList.toggle('solve-on', !motionOff()); }
  syncSolve();
  window.addEventListener('tweakchange', function(){ setTimeout(syncSolve, 0); });

  /* ---- reveals ---- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.16 });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---- count-up credentials ---- */
  function countUp(el){
    var to = parseFloat(el.getAttribute('data-to')) || 0;
    var suf = el.getAttribute('data-suf') || '';
    var pre = el.getAttribute('data-pre') || '';
    if(motionOff()){ el.textContent = pre + to + suf; return; }
    var dur = 1100, t0 = null;
    function step(ts){
      if(t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(to * eased) + suf;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var creditObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ countUp(e.target); creditObs.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.n[data-to]').forEach(function(el){ creditObs.observe(el); });

  /* ---- scroll progress + spine draw + parallax (single rAF) ---- */
  var bar = document.querySelector('.progress');
  var spine = document.querySelector('.beats .spine');
  var beats = document.querySelector('.beats');
  var parallaxEls = [].slice.call(document.querySelectorAll('.ph-img'));
  var ticking = false;

  function frame(){
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 1;
    var p = h.scrollTop / max;
    if(bar) bar.style.transform = 'scaleX(' + p + ')';

    if(!motionOff()){
      // spine scroll-linked draw
      if(spine && beats){
        var r = beats.getBoundingClientRect();
        var vh = window.innerHeight;
        var prog = (vh * 0.85 - r.top) / (r.height + vh * 0.2);
        prog = Math.max(0, Math.min(1, prog));
        spine.style.transition = 'none';
        spine.style.transform = 'scaleY(' + prog + ')';
        spine.style.transformOrigin = 'top';
        spine.style.opacity = '1';
      }
      // gentle parallax on designed placeholders
      var f = 0.05 * mo();
      var vh2 = window.innerHeight;
      for(var i = 0; i < parallaxEls.length; i++){
        var el = parallaxEls[i];
        var rect = el.getBoundingClientRect();
        if(rect.bottom < -200 || rect.top > vh2 + 200) continue;
        var center = rect.top + rect.height / 2 - vh2 / 2;
        el.style.setProperty('--par', (-center * f).toFixed(1) + 'px');
        el.style.translate = '0 var(--par)';
      }
    } else {
      if(spine){ spine.style.transform = 'scaleY(1)'; spine.style.opacity = '1'; }
    }
    ticking = false;
  }
  function onScroll(){ if(!ticking){ requestAnimationFrame(frame); ticking = true; } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();

  /* ---- accordion (who we're for) ---- */
  var items = [].slice.call(document.querySelectorAll('.acc-item'));
  function openItem(item){
    items.forEach(function(i){
      var on = i === item;
      i.classList.toggle('open', on);
      i.querySelector('.head').setAttribute('aria-expanded', on);
    });
  }
  items.forEach(function(i){
    i.querySelector('.head').addEventListener('click', function(){ openItem(i); });
  });
  if(window.matchMedia('(hover: hover)').matches){
    items.forEach(function(i){ i.addEventListener('mouseenter', function(){ openItem(i); }); });
  }

  /* ---- nav mark: one-shot turn on click ---- */
  var mark = document.querySelector('.mark svg');
  if(mark){
    document.querySelector('.mark').addEventListener('click', function(){
      if(motionOff()) return;
      mark.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
    });
  }

  /* ---- team cubes: tap to flip on touch, Enter/Space on keyboard ---- */
  var members = [].slice.call(document.querySelectorAll('.member'));
  var noHover = window.matchMedia('(hover: none)').matches;
  members.forEach(function(m){
    m.setAttribute('tabindex', '0');
    m.addEventListener('click', function(){
      if(!noHover) return;
      var on = !m.classList.contains('flipped');
      members.forEach(function(o){ o.classList.remove('flipped'); });
      if(on) m.classList.add('flipped');
    });
    m.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); m.classList.toggle('flipped'); }
    });
  });

  /* ---- /what-we-do planes: tap to open on touch, Enter/Space on keyboard ---- */
  var planes = [].slice.call(document.querySelectorAll('.plane-c'));
  planes.forEach(function(p){
    p.addEventListener('click', function(){
      if(window.matchMedia('(hover: hover)').matches) return;
      var on = !p.classList.contains('open');
      planes.forEach(function(o){ o.classList.remove('open'); });
      if(on) p.classList.add('open');
    });
    p.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); p.classList.toggle('open'); }
      if(e.key === 'Escape'){ p.classList.remove('open'); }
    });
  });

  /* ---- reel: skip ranges declared as data-skip="a-b,c-d" (seconds) ---- */
  var reel = document.querySelector('video[data-skip]');
  if(reel){
    var skips = reel.getAttribute('data-skip').split(',').map(function(s){ var p = s.split('-').map(parseFloat); return p.length === 2 && p[0] < p[1] ? p : null; }).filter(Boolean);
    var checking = false;
    function checkSkip(){
      if(!reel.paused && !reel.seeking){
        var t = reel.currentTime;
        for(var i = 0; i < skips.length; i++){ if(t >= skips[i][0] && t < skips[i][1]){ reel.currentTime = skips[i][1]; break; } }
      }
      if(reel.paused || reel.ended){ checking = false; return; }
      requestAnimationFrame(checkSkip);
    }
    reel.addEventListener('play', function(){ if(!checking){ checking = true; requestAnimationFrame(checkSkip); } });
    if(!reel.paused){ checking = true; requestAnimationFrame(checkSkip); }
  }

  /* ---- loader removal ---- */
  var ldr = document.querySelector('.ldr');
  if(ldr){
    if(root.getAttribute('data-loader') === 'off'){ ldr.remove(); }
    else { setTimeout(function(){ if(ldr && ldr.parentNode) ldr.remove(); }, 2500); }
  }

  /* ---- marquee: duplicate track for a seamless infinite loop ---- */
  var mt = document.querySelector('.marquee-track');
  if(mt && !mt.dataset.dup){
    var clone = mt.innerHTML;
    [].slice.call(mt.children).forEach(function(el){ el.setAttribute('aria-hidden','false'); });
    mt.insertAdjacentHTML('beforeend', clone);
    // mark the second copy decorative for a11y
    var kids = mt.children, half = kids.length / 2;
    for(var i = half; i < kids.length; i++){ kids[i].setAttribute('aria-hidden','true'); kids[i].tabIndex = -1; }
    mt.dataset.dup = '1';
  }
})();
