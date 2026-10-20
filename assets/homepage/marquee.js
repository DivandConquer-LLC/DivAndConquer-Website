/* Div & Conquer — drag-to-scroll marquee (synced from live site).
   Replaces the CSS keyframe scroll with a rAF loop so the /more-work rail
   can be grabbed and dragged; pauses on hover, honors data-motion + reduced-motion. */
(function(){
  "use strict";
  var mq = document.querySelector(".marquee");
  var track = document.querySelector(".marquee-track");
  if(!mq || !track || mq.dataset.dragReady) return;
  mq.dataset.dragReady = "1";
  mq.classList.add("marquee-drag-ready");
  var root = document.documentElement;
  var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var halfWidth = 0, x = 0, lastTime = 0;
  var hovering = false, dragging = false, moved = false, suppressClick = false;
  var startClientX = 0, startX = 0;
  function motionOff(){ return root.getAttribute("data-motion") === "off" || (reduceQuery && reduceQuery.matches); }
  function wrap(v){ if(!halfWidth) return v; v = v % halfWidth; if(v > 0) v -= halfWidth; return v; }
  function apply(){ track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)"; }
  function measure(){ halfWidth = track.scrollWidth / (track.dataset.dup === "1" ? 2 : 1); x = wrap(x); apply(); }
  function tick(ts){
    if(!lastTime) lastTime = ts;
    var dt = Math.min(80, ts - lastTime); lastTime = ts;
    if(!dragging && !hovering && !motionOff() && halfWidth > 0){ x = wrap(x - (halfWidth / 46) * (dt / 1000)); apply(); }
    requestAnimationFrame(tick);
  }
  function begin(e){
    if(e.button !== undefined && e.button !== 0) return;
    measure(); dragging = true; moved = false; startClientX = e.clientX; startX = x; lastTime = 0;
    mq.classList.add("is-dragging");
    if(mq.setPointerCapture){ try{ mq.setPointerCapture(e.pointerId); }catch(err){} }
  }
  function move(e){
    if(!dragging) return;
    var dx = e.clientX - startClientX;
    if(Math.abs(dx) > 4){ moved = true; suppressClick = true; }
    x = wrap(startX + dx); apply();
    if(moved) e.preventDefault();
  }
  function end(e){
    if(!dragging) return;
    dragging = false; mq.classList.remove("is-dragging"); lastTime = 0;
    if(mq.releasePointerCapture){ try{ mq.releasePointerCapture(e.pointerId); }catch(err){} }
  }
  mq.addEventListener("mouseenter", function(){ hovering = true; });
  mq.addEventListener("mouseleave", function(){ hovering = false; });
  mq.addEventListener("pointerdown", begin);
  mq.addEventListener("pointermove", move);
  mq.addEventListener("pointerup", end);
  mq.addEventListener("pointercancel", end);
  mq.addEventListener("dragstart", function(e){ e.preventDefault(); });
  mq.addEventListener("click", function(e){ if(suppressClick){ e.preventDefault(); e.stopPropagation(); suppressClick = false; } }, true);
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("pageshow", function(){ dragging = false; moved = false; suppressClick = false; hovering = mq.matches(":hover"); mq.classList.remove("is-dragging"); lastTime = 0; measure(); });
  document.addEventListener("visibilitychange", function(){ lastTime = 0; });
  if(reduceQuery && reduceQuery.addEventListener){ reduceQuery.addEventListener("change", function(){ lastTime = 0; }); }
  measure();
  requestAnimationFrame(tick);
})();
