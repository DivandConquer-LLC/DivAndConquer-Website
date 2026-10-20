/* ============================================================
   Div & Conquer — self-playing minimalist Tetris.
   Runs quietly behind the hero's deep (prussian) plane:
   a heuristic AI places pieces and clears lines forever.
   Blocks render in the plane's text colour at low opacity so
   the caption stays readable. Respects motion settings.
   ============================================================ */
(function(){
  'use strict';
  var canvas = document.querySelector('.comp .blue-plane .tetris');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  var COLS = 0, ROWS = 0, CELL = 0, W = 0, H = 0;
  var OFFX = 0, OFFY = 0;            // grid offset: bottom-aligned, horizontally centred
  var board = [], cur = null, raf = 0, lastStep = 0;
  var inputBound = false;
  var DROP_MS = 190, pauseUntil = 0;
  var onDeep = '#FEFAE0';

  function reduced(){ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function motionOff(){ return reduced() || document.documentElement.getAttribute('data-motion') === 'off'; }

  /* ---- tetrominoes ---- */
  var BASE = {
    I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[1,1,1],[0,1,0]],
    S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]], J: [[1,0,0],[1,1,1]], L: [[0,0,1],[1,1,1]]
  };
  var TYPES = Object.keys(BASE);
  function rotateCW(m){
    var R = m.length, C = m[0].length, out = [];
    for(var c = 0; c < C; c++){ var row = []; for(var r = R - 1; r >= 0; r--) row.push(m[r][c]); out.push(row); }
    return out;
  }
  function rotateCCW(m){ return rotateCW(rotateCW(rotateCW(m))); }
  function same(a, b){
    if(a.length !== b.length || a[0].length !== b[0].length) return false;
    for(var r = 0; r < a.length; r++) for(var c = 0; c < a[0].length; c++) if(a[r][c] !== b[r][c]) return false;
    return true;
  }
  function rotations(m){
    var states = [m], cur = m;
    for(var i = 0; i < 3; i++){ cur = rotateCW(cur); if(!states.some(function(s){ return same(s, cur); })) states.push(cur); }
    return states;
  }
  var PIECES = {}; TYPES.forEach(function(t){ PIECES[t] = rotations(BASE[t]); });

  /* ---- board helpers ---- */
  function newBoard(){ var b = []; for(var r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(0)); return b; }
  function valid(b, mat, x, y){
    for(var r = 0; r < mat.length; r++) for(var c = 0; c < mat[0].length; c++){
      if(!mat[r][c]) continue;
      var X = x + c, Y = y + r;
      if(X < 0 || X >= COLS || Y >= ROWS) return false;
      if(Y >= 0 && b[Y][X]) return false;
    }
    return true;
  }
  function landing(b, mat, x){
    var y = -mat.length;
    while(valid(b, mat, x, y + 1)) y++;
    return y;
  }
  function merge(b, mat, x, y){
    for(var r = 0; r < mat.length; r++) for(var c = 0; c < mat[0].length; c++){
      if(mat[r][c]){ var Y = y + r; if(Y >= 0) b[Y][x + c] = 1; }
    }
  }
  function clearLines(b){
    var n = 0;
    for(var r = ROWS - 1; r >= 0; r--){
      if(b[r].every(function(v){ return v; })){ b.splice(r, 1); b.unshift(new Array(COLS).fill(0)); n++; r++; }
    }
    return n;
  }
  function metrics(b){
    var heights = new Array(COLS).fill(0), holes = 0;
    for(var c = 0; c < COLS; c++){
      var seen = false;
      for(var r = 0; r < ROWS; r++){
        if(b[r][c]){ if(!seen){ heights[c] = ROWS - r; seen = true; } }
        else if(seen) holes++;
      }
    }
    var agg = 0, bump = 0;
    for(var i = 0; i < COLS; i++) agg += heights[i];
    for(var j = 0; j < COLS - 1; j++) bump += Math.abs(heights[j] - heights[j + 1]);
    return { agg: agg, holes: holes, bump: bump };
  }
  function best(b, type){
    var states = PIECES[type], bestScore = -1e9, pick = null;
    for(var s = 0; s < states.length; s++){
      var mat = states[s], w = mat[0].length;
      for(var x = 0; x + w <= COLS; x++){
        var y = landing(b, mat, x);
        var nb = b.map(function(row){ return row.slice(); });
        if(!valid(nb, mat, x, y)) continue;
        merge(nb, mat, x, y);
        var lines = clearLines(nb);
        var m = metrics(nb);
        var score = 0.95 * lines - 0.50 * m.agg - 0.46 * m.holes - 0.18 * m.bump + 0.015 * y;
        if(score > bestScore){ bestScore = score; pick = { mat: mat, x: x, landY: y }; }
      }
    }
    return pick;
  }

  /* ---- play loop ---- */
  function spawn(){
    var type = TYPES[(Math.random() * TYPES.length) | 0];
    var p = best(board, type);
    if(!p || p.landY < 0){ board = newBoard(); p = best(board, type); }
    cur = { mat: p.mat, x: p.x, landY: p.landY, y: -p.mat.length };
  }
  function step(){
    if(!cur){ spawn(); return false; }
    if(cur.y < cur.landY){ cur.y++; return false; }
    merge(board, cur.mat, cur.x, cur.landY); clearLines(board); cur = null; spawn(); return true;
  }
  function runStatic(count){
    board = newBoard();
    var fills = count != null ? count : Math.floor(ROWS * 0.85);
    for(var i = 0; i < fills; i++){
      var t = TYPES[(Math.random() * TYPES.length) | 0];
      var p = best(board, t);
      if(!p || p.landY < 0) break;
      merge(board, p.mat, p.x, p.landY); clearLines(board);
    }
    cur = null;
  }

  /* ---- render ---- */
  function draw(){
    ctx.clearRect(0, 0, W, H);
    var g = Math.max(1, Math.round(CELL * 0.12));
    function block(cx, cy, a){
      ctx.globalAlpha = a; ctx.fillStyle = onDeep;
      ctx.fillRect(cx * CELL + OFFX + g, cy * CELL + OFFY + g, CELL - 2 * g, CELL - 2 * g);
    }
    for(var r = 0; r < ROWS; r++) for(var c = 0; c < COLS; c++) if(board[r][c]) block(c, r, 0.13);
    if(cur){
      for(var rr = 0; rr < cur.mat.length; rr++) for(var cc = 0; cc < cur.mat[0].length; cc++){
        if(cur.mat[rr][cc]){ var Y = cur.y + rr; if(Y >= 0) block(cur.x + cc, Y, 0.32); }
      }
    }
    ctx.globalAlpha = 1;
  }

  function refreshColor(){
    var v = getComputedStyle(document.documentElement).getPropertyValue('--on-deep');
    if(v) onDeep = v.trim();
  }

  function resize(){
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if(W < 2 || H < 2) return;
    var cell = Math.max(14, Math.round(W / 8));
    var cols = Math.max(4, Math.floor(W / cell));
    var rows = Math.max(6, Math.floor(H / cell));
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var changed = (cols !== COLS || rows !== ROWS);
    CELL = cell; COLS = cols; ROWS = rows;
    OFFX = Math.max(0, Math.round((W - COLS * CELL) / 2));
    OFFY = Math.max(0, H - ROWS * CELL);   // rest pieces flush against the bottom edge
    refreshColor();
    if(changed || !board.length){
      if(motionOff()){ runStatic(); } else { runStatic(Math.floor(ROWS * 0.4)); }
    }
    draw();
  }

  function frame(t){
    raf = requestAnimationFrame(frame);
    if(document.hidden) return;
    if(motionOff()) return;
    if(t < pauseUntil) return;
    if(t - lastStep >= DROP_MS){ lastStep = t; var locked = step(); draw(); if(locked) pauseUntil = t + 500; }
  }

  /* ---- player input: rotate the falling piece (click / arrow keys) ---- */
  function tryRotate(dir){
    if(motionOff() || !cur) return false;
    var nm = dir > 0 ? rotateCW(cur.mat) : rotateCCW(cur.mat);
    var kicks = [0, -1, 1, -2, 2];
    for(var k = 0; k < kicks.length; k++){
      var nx = cur.x + kicks[k];
      if(valid(board, nm, nx, cur.y)){
        cur.mat = nm; cur.x = nx;
        cur.landY = landing(board, nm, nx);
        if(cur.landY < cur.y) cur.landY = cur.y;
        draw();
        return true;
      }
    }
    return false;
  }

  function tryMove(dir){
    if(motionOff() || !cur) return false;
    var nx = cur.x + dir;
    if(valid(board, cur.mat, nx, cur.y)){
      cur.x = nx;
      cur.landY = landing(board, cur.mat, nx);
      if(cur.landY < cur.y) cur.landY = cur.y;
      draw();
      return true;
    }
    return false;
  }

  function bindInput(){
    if(inputBound) return;
    inputBound = true;
    var hover = false;
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Tetris — click or up/down to rotate, left/right to move the falling piece');
    canvas.style.cursor = 'pointer';
    canvas.style.outline = 'none';
    canvas.style.touchAction = 'manipulation';

    function inView(){
      var r = canvas.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
    }

    canvas.addEventListener('pointerdown', function(e){
      if(motionOff() || !cur) return;
      canvas.focus({ preventScroll: true });
      tryRotate(1);
      e.preventDefault();
    });
    canvas.addEventListener('pointerenter', function(){ hover = true; });
    canvas.addEventListener('pointerleave', function(){ hover = false; });

    window.addEventListener('keydown', function(e){
      if(motionOff() || !cur) return;
      // respond whenever the hero/game is on screen (or hovered/focused) — no click needed
      if(!inView() && !hover && document.activeElement !== canvas) return;
      switch(e.key){
        case 'ArrowUp': case 'x': case 'X':
          tryRotate(1); e.preventDefault(); break;
        case 'ArrowDown': case 'z': case 'Z':
          tryRotate(-1); e.preventDefault(); break;
        case 'ArrowLeft':
          tryMove(-1); e.preventDefault(); break;
        case 'ArrowRight':
          tryMove(1); e.preventDefault(); break;
      }
    });
  }

  function start(){
    resize();
    bindInput();
    if(!raf) raf = requestAnimationFrame(frame);
  }

  if(window.ResizeObserver){
    var ro = new ResizeObserver(function(){ resize(); });
    ro.observe(canvas);
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('tweakchange', function(){ setTimeout(function(){ refreshColor(); if(motionOff()){ runStatic(); } draw(); }, 0); });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
