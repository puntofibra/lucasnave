/* LUCAS Y LA NAVE PERDIDA · aventura de Lucas para niños de 6 y 7 años: se anda y se salta como en un plataformas, pero sin malos */
(() => {
'use strict';
const VERSION = '0.3';
const API = 'https://script.google.com/macros/s/AKfycby5_qNFSRwDK-qZmzTWTD-O4p7XpdF2zgezm-8PM7xad66uavF7OS4sWafVRWQzN3pI/exec';
const GOOGLE_ID = '454055120059-nuhaop4r62urc3u036cc3grpqo71ulg7.apps.googleusercontent.com';
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const VW = 1280, VH = 720;
let SC = 1, DPR = 1;

/* ---------- pantalla: 1280x720 virtual, se escala al hueco disponible ---------- */
function resize() {
  const w = innerWidth, h = innerHeight; SC = Math.min(w / VW, h / VH); DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.style.width = VW * SC + 'px'; cv.style.height = VH * SC + 'px'; cv.width = Math.round(VW * SC * DPR); cv.height = Math.round(VH * SC * DPR);
  const ui = $('ui'), r = cv.getBoundingClientRect(); Object.assign(ui.style, { left: r.left + 'px', top: r.top + 'px', width: VW + 'px', height: VH + 'px', transform: 'scale(' + SC + ')', transformOrigin: '0 0' });
  $('rot').classList.add('need');
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));

/* ---------- imágenes ---------- */
const IMG = {};
function img(n, src) { if (!IMG[n]) { const im = new Image(); im.src = src || ('img/' + n + '.webp?v=' + VERSION); im.onerror = () => { im._bad = true; }; IMG[n] = im; } return IMG[n]; }
const ok = im => im && im.complete && im.naturalWidth && !im._bad;
['lucas-quieto', 'lucas-avanzando', 'lucas-celebrando', 'lucas-saltando', 'suelo', 'obj-puerta', 'obj-chip'].forEach(n => img(n));
// imágenes nuevas (PNG sin fondo que irán llegando): mientras no existan, se dibuja una versión provisional por código
function opt(n) { const im = img(n, 'img/' + n + '.png?v=' + VERSION); return ok(im) ? im : null; }

/* ---------- opciones ---------- */
let sndOn = true, musOn = true, VOZ_ON = true;
try { const p = JSON.parse(localStorage.getItem('ln_opt') || '{}'); if (p.snd === false) sndOn = false; if (p.mus === false) musOn = false; if (p.voz === false) VOZ_ON = false; } catch (e) {}
function saveOpt() { try { localStorage.setItem('ln_opt', JSON.stringify({ snd: sndOn, mus: musOn, voz: VOZ_ON })); } catch (e) {} }

/* ---------- sonido sintetizado ---------- */
let AC = null, master = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); }
function tone(f0, f1, dur, type = 'sine', vol = 0.1, delay = 0) {
  if (!sndOn || !AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol = 0.1, freq = 1200) {
  if (!sndOn || !AC) return; const n = AC.sampleRate * dur, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(master); s.start();
}
const SFX = {
  blip: () => tone(700 + Math.random() * 300, 600, 0.04, 'square', 0.03),
  pick: () => [880, 1175, 1568].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.09, i * 0.07)),
  door: () => { noise(0.45, 0.12, 900); tone(240, 110, 0.4, 'sawtooth', 0.035); },
  click: () => tone(1200, 900, 0.05, 'square', 0.04),
  bad: () => { tone(220, 160, 0.18, 'square', 0.06); tone(180, 120, 0.2, 'square', 0.05, 0.12); },
  chip: () => [1319, 1760, 2093, 2637].forEach((f, i) => tone(f, f, 0.1, 'sine', 0.07, i * 0.05)),
  coin: () => { tone(1568, 1568, 0.06, 'square', 0.04); tone(2093, 2093, 0.14, 'square', 0.04, 0.06); },
  jump: () => tone(300, 760, 0.18, 'square', 0.035),
  land: () => tone(120, 60, 0.08, 'sine', 0.05),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.09, i * 0.11)),
  power: () => { tone(80, 900, 1.4, 'sawtooth', 0.06); noise(1.2, 0.06, 400); },
  honk: () => { tone(330, 330, 0.5, 'square', 0.12); tone(415, 415, 0.5, 'square', 0.1); },
  grow: () => { for (let i = 0; i < 8; i++) tone(300 + i * 90, 400 + i * 90, 0.12, 'sine', 0.06, i * 0.09); },
  warp: () => { tone(200, 1400, 0.7, 'sawtooth', 0.04); noise(0.8, 0.08, 2400); },
  warpIn: () => { tone(1200, 200, 0.6, 'sine', 0.05); },
  buy: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, f, 0.1, 'square', 0.04, i * 0.06))
};
let musT = null;
function startMusic() {
  if (musT || !AC) return; const notes = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 330]]; let i = 0;
  musT = setInterval(() => { if (!musOn || !sndOn) return; const ch = notes[i++ % notes.length]; ch.forEach((f, k) => tone(f, f * 1.001, 2.8, 'sine', 0.018, k * 0.25)); tone(ch[0] / 2, ch[0] / 2, 3, 'triangle', 0.02); }, 3000);
}

/* ---------- voz del narrador ---------- */
let VOICE = null;
function pickVoice() { try { const vs = speechSynthesis.getVoices(); VOICE = vs.find(v => /es[-_]ES/i.test(v.lang) && /female|mujer|helena|elvira|monica|lucia|google/i.test(v.name)) || vs.find(v => /es[-_]ES/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null; } catch (e) {} }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
function speak(t, pitch = 1.05, rate = 0.92, cb) {
  try { speechSynthesis.cancel(); } catch (e) {}
  if (!VOZ_ON || !window.speechSynthesis) { if (cb) setTimeout(cb, 400); return; }
  try { const u = new SpeechSynthesisUtterance(t.replace(/[¡¿]/g, '')); u.lang = 'es-ES'; if (VOICE) u.voice = VOICE; u.pitch = pitch; u.rate = rate; u.onend = () => cb && cb(); u.onerror = () => cb && cb(); speechSynthesis.speak(u); } catch (e) { if (cb) cb(); }
}
function shutUp() { try { speechSynthesis.cancel(); } catch (e) {} }

/* ---------- estado de la partida ---------- */
const NEW = () => ({ v: 2, room: 'camarote', x: 520, inv: [], flags: {}, chips: {}, got: {}, coins: 0, seen: {}, t0: Date.now() });
let G = NEW();
function save() { try { localStorage.setItem('ln_save', JSON.stringify(G)); } catch (e) {} cloudSave(); }
function load() { try { const s = JSON.parse(localStorage.getItem('ln_save') || 'null'); if (s && s.v === 2) return s; } catch (e) {} return null; }
const F = k => !!G.flags[k];
function setF(k, v = true) { G.flags[k] = v; save(); }
const has = it => G.inv.includes(it);

/* ---------- objetos ---------- */
const ITEMS = {
  tarjeta: { n: 'Tarjeta', e: '💳', d: 'Una tarjeta para abrir puertas.' },
  linterna: { n: 'Linterna', e: '🔦', d: 'Una linterna. ¡Da mucha luz!' },
  regadera: { n: 'Regadera', e: '🪣', d: 'Una regadera vacía.' },
  'regadera-llena': { n: 'Regadera con agua', e: '💧', d: 'La regadera está llena de agua.' },
  manzana: { n: 'Manzana espacial', e: '🍎', d: 'Una manzana espacial. ¡Brilla un poquito!' },
  llave: { n: 'Llave inglesa', e: '🔧', d: 'Sirve para apretar tuercas.' },
  escoba: { n: 'Escoba', e: '🧹', d: 'La escoba de Bolita.' },
  fusible: { n: 'Fusible', e: '🔋', d: 'Un fusible. Lleva energía a las máquinas.' },
  botas: { n: 'Botas saltarinas', e: '👢', d: '¡Con estas botas Lucas salta muchísimo más!' },
  martillo: { n: 'Martillo', e: '🔨', d: 'Un martillo. ¡Rompe cosas duras!' },
  gorro: { n: 'Gorro de hélice', e: '🧢', d: '¡Un gorro con hélice! Lucas está guapísimo.' }
};
function give(it) { if (!has(it)) G.inv.push(it); SFX.pick(); invNew = it; paintInv(); save(); L.cheer = 1.4; }
function take(it) { G.inv = G.inv.filter(x => x !== it); paintInv(); save(); }
let invNew = null;
function paintInv() {
  const b = $('inv'); b.innerHTML = '';
  if (!G.inv.length) { b.innerHTML = '<span class="empty">Tu mochila está vacía</span>'; return; }
  G.inv.forEach(it => { const d = document.createElement('div'); d.className = 'slot' + (invNew === it ? ' new' : ''); const pi = opt('item-' + it);
    d.innerHTML = pi ? '<img src="' + pi.src + '" alt="">' : ITEMS[it].e; d.title = ITEMS[it].n;
    d.onpointerdown = e => { e.stopPropagation(); audio(); if (busy()) { advance(); return; } SFX.click(); invNew = null; paintInv(); say([['narr', ITEMS[it].d]]); };
    b.appendChild(d); });
}
function paintCoins() { $('coinN').textContent = G.coins; $('chipN').textContent = Object.keys(G.chips).length; }

/* ---------- Lucas: anda y salta (física de plataformas, sin caerse nunca a ningún hueco) ---------- */
const L = { x: 520, y: 620, vy: 0, face: 1, ground: true, cheer: 0, talk: 0, auto: null, then: null, enter: 0, land: 0 };
const LUCAS_H = 220, SPEED = 340, GRAV = 2400;
const jumpV = () => F('botas') ? 1150 : 950;          // 188 px de salto normal, 275 con las botas
const KEY = { l: 0, r: 0, j: 0 };
let jumpBuf = 0;

/* ---------- salas ---------- */
let R = null, camX = 0, time = 0, PREVIEW = false;
const ROOMS = {};
function room(id, o) { ROOMS[id] = Object.assign({ id, W: 1600, floor: 620, plat: [], coins: [], hot: [] }, o); }
const plats = () => (typeof R.plat === 'function' ? R.plat() : R.plat);

/* ---------- dibujo ---------- */
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function lg(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function stroke(c = '#0a0e22', w = 4) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); }
function glow(x, y, r, col, a = 0.6) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
const STARS = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.5, t: Math.random() * 6 }));
function space(par, hue = 230, planet = true) {
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'hsl(' + hue + ',60%,6%)'); g.addColorStop(1, 'hsl(' + (hue + 30) + ',55%,14%)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) { const x = ((i * 520 + 200 - camX * par * 0.5) % 1800 + 1800) % 1800 - 300, y = 160 + i * 120; glow(x, y, 260, 'rgba(' + ['120,60,220', '40,140,255', '255,60,160'][i] + ',A)', 0.16); }
  for (const s of STARS) { const x = ((s.x * 2200 - camX * par) % 2200 + 2200) % 2200 - 400; if (x < -5 || x > VW + 5) continue; ctx.globalAlpha = 0.45 + 0.45 * Math.sin(time * 2 + s.t); ctx.fillStyle = '#fff'; ctx.fillRect(x, s.y * VH, s.s, s.s); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (planet) { const px = 980 - camX * par * 0.7, py = 190; const pg = ctx.createRadialGradient(px - 40, py - 40, 10, px, py, 120); pg.addColorStop(0, '#ffb070'); pg.addColorStop(0.6, '#c04a6a'); pg.addColorStop(1, '#3a1040'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 110, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,160,.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(px, py, 190, 36, -0.3, 0, 7); ctx.stroke(); }
}
function wall(c1, c2, wins, accent = '#29e6ff') {
  ctx.save(); ctx.beginPath(); ctx.rect(-camX, 0, R.W, R.floor); for (const w of wins) rr(w[0] - camX, w[1], w[2], w[3], 26); ctx.fillStyle = lg(0, 0, 0, R.floor, [c1, c2]); ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3; for (let x = 0; x < R.W; x += 160) { if (x - camX < -10 || x - camX > VW + 10) continue; ctx.beginPath(); ctx.moveTo(x - camX, 40); ctx.lineTo(x - camX, R.floor - 30); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(-camX, 70, R.W, 8); ctx.fillRect(-camX, R.floor - 90, R.W, 6);
  ctx.fillStyle = accent; ctx.globalAlpha = 0.55 + 0.2 * Math.sin(time * 2); ctx.fillRect(-camX, R.floor - 84, R.W, 3); ctx.globalAlpha = 1;
  for (const w of wins) { rr(w[0] - camX, w[1], w[2], w[3], 26); ctx.lineWidth = 12; ctx.strokeStyle = '#3a4a7a'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#0a0e22'; ctx.stroke();
    ctx.fillStyle = 'rgba(160,220,255,.06)'; ctx.beginPath(); ctx.moveTo(w[0] - camX + 30, w[1] + 20); ctx.lineTo(w[0] - camX + 90, w[1] + 20); ctx.lineTo(w[0] - camX + 40, w[1] + w[3] - 20); ctx.lineTo(w[0] - camX - 20, w[1] + w[3] - 20); ctx.fill(); }
  ctx.fillStyle = lg(0, 0, 0, 60, ['#141a3a', '#242c5a']); ctx.fillRect(-camX, 0, R.W, 46); ctx.fillStyle = '#0a0e22'; ctx.fillRect(-camX, 44, R.W, 4);
  for (let x = 80; x < R.W; x += 300) { if (x - camX < -200 || x - camX > VW + 50) continue; ctx.fillStyle = '#fff6c0'; rr(x - camX, 10, 120, 16, 8); ctx.fill(); if (!PREVIEW) glow(x - camX + 60, 30, 120, 'rgba(255,240,180,A)', 0.18); }
  ctx.restore();
}
function floorDraw(tint) {
  const S = IMG.suelo, y = R.floor - 14;
  if (ok(S)) { const tw = S.naturalWidth / 8, th = S.naturalHeight / 2, h = VH - y, w = tw * h / th; for (let i = Math.floor(camX / w) - 1; i * w - camX < VW; i++) ctx.drawImage(S, ((i % 8 + 8) % 8) * tw, 0, tw, th, i * w - camX, y, w + 1, h); }
  else { ctx.fillStyle = '#3a4466'; ctx.fillRect(0, y, VW, VH - y); }
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, y, VW, VH - y); }
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, y, VW, 10);
}
function frontPipes(seed, col = '#2a3460') {
  const off = camX * 1.3;
  for (let i = 0; i < 4; i++) { const x = ((seed * 977 + i * 820) % 3400) - off; if (x < -200 || x > VW + 200) continue;
    const h = 120 + (i * 37) % 110; ctx.fillStyle = lg(x, 0, x + 60, 0, ['#0a0e22', col, '#0a0e22']); ctx.fillRect(x, 0, 60, h); ctx.fillStyle = '#0a0e22'; ctx.fillRect(x - 8, h - 16, 76, 16); ctx.fillRect(x - 8, 50, 76, 12); }
}

/* ---------- plataformas ---------- */
function drawPlat(p) {
  const [x, y, w, k] = p, sx = x - camX - w / 2; if (k === 'none' || sx > VW + 20 || sx + w < -20) return;
  const im = opt('plat-' + (k || 'metal')); if (im) { const h = w * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, sx, y - 10, w, h); return; }
  if (k === 'caja') { const h = R.floor - y; ctx.fillStyle = lg(sx, 0, sx + w, 0, ['#8a5a2a', '#c88a4a', '#8a5a2a']); rr(sx, y, w, h, 6); ctx.fill(); stroke(); ctx.strokeStyle = 'rgba(40,20,0,.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx + 8, y + 8); ctx.lineTo(sx + w - 8, y + h - 8); ctx.moveTo(sx + w - 8, y + 8); ctx.lineTo(sx + 8, y + h - 8); ctx.stroke(); ctx.fillStyle = '#ffd23c'; ctx.font = '900 20px Orbitron'; ctx.textAlign = 'center'; return; }
  if (k === 'hoja') { ctx.save(); ctx.translate(x - camX, y + 8); ctx.fillStyle = lg(0, -20, 0, 20, ['#6aff7a', '#1a8a3a']); ctx.beginPath(); ctx.ellipse(0, 0, w / 2 + 10, 20, 0, 0, 7); ctx.fill(); stroke('#0a3a1a', 4); ctx.strokeStyle = '#0a5a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke(); ctx.restore(); return; }
  if (k === 'estante') { ctx.fillStyle = lg(0, y, 0, y + 18, ['#c8a070', '#6a4a2a']); rr(sx, y, w, 18, 4); ctx.fill(); stroke('#2a1a0a', 3); ctx.fillStyle = '#4a3420'; ctx.fillRect(sx + 14, y + 18, 10, 26); ctx.fillRect(sx + w - 24, y + 18, 10, 26); return; }
  if (k === 'tubo') { ctx.fillStyle = lg(0, y, 0, y + 36, ['#9aa8d0', '#4a5a8a', '#1a2450']); rr(sx, y, w, 36, 18); ctx.fill(); stroke(); for (let i = sx + 30; i < sx + w - 20; i += 70) { ctx.fillStyle = '#2a3460'; ctx.fillRect(i, y - 3, 14, 42); } return; }
  ctx.fillStyle = lg(0, y, 0, y + 26, ['#aab8e0', '#4a5a8a', '#1a2450']); rr(sx, y, w, 26, 8); ctx.fill(); stroke();
  ctx.fillStyle = 'rgba(41,230,255,' + (0.5 + 0.3 * Math.sin(time * 3 + x)) + ')'; ctx.fillRect(sx + 10, y + 22, w - 20, 4); if (!PREVIEW) glow(x - camX, y + 30, w * 0.5, 'rgba(41,230,255,A)', 0.12);
  ctx.fillStyle = '#0a0e22'; for (let i = sx + 16; i < sx + w - 10; i += 36) { ctx.beginPath(); ctx.arc(i, y + 12, 3, 0, 7); ctx.fill(); }
}
function drawCoin(x, y, i) { const im = opt('obj-moneda'), sx = x - camX, w = Math.abs(Math.cos(time * 3 + i)) * 30 + 4, b = Math.sin(time * 3 + i) * 4;
  if (!PREVIEW) glow(sx, y + b, 34, 'rgba(255,220,80,A)', 0.3);
  if (im) { ctx.drawImage(im, sx - w / 2 - 2, y + b - 18, w + 4, 36); return; }
  ctx.fillStyle = lg(sx - w / 2, 0, sx + w / 2, 0, ['#a86a00', '#ffe680', '#ffc21a', '#a86a00']); ctx.beginPath(); ctx.ellipse(sx, y + b, w / 2 + 2, 18, 0, 0, 7); ctx.fill(); stroke('#5a3400', 3);
  if (w > 18) { ctx.fillStyle = '#a86a00'; ctx.font = '900 18px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('L', sx, y + b + 7); } }
function drawChip(id, x, y) { if (G.chips[id]) return; const C = IMG['obj-chip'], s = 48 + Math.sin(time * 4) * 3, sx = x - camX; if (!PREVIEW) glow(sx, y, 56, 'rgba(255,210,60,A)', 0.35 + 0.2 * Math.sin(time * 5)); if (ok(C)) ctx.drawImage(C, sx - s / 2, y - s / 2, s, s); else { ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(sx, y, s / 2, 0, 7); ctx.fill(); } }

/* ---------- puertas: se abren deslizando sus dos mitades y dejan ver lo que hay dentro ---------- */
const DOORS = {};
const door = id => DOORS[id] || (DOORS[id] = { o: 0, to: 0 });
function drawDoor(h) {
  const D = h.door, d = door(D.id), P = IMG['obj-puerta'], dh = D.h || 330, w = D.w || 220, y = R.floor - dh, sx = h.x - w / 2 - camX, locked = D.locked && D.locked();
  if (sx > VW + 60 || sx + w < -60) return;
  const op = Math.min(1, Math.max(0, d.o)), half = w / 2, sh = half * op;
  if (op > 0.02 && !PREVIEW) { preview(D.to, sx + 6, y + 6, w - 12, dh - 6, D.tx); glow(sx + w / 2, y + dh - 60, 180, 'rgba(160,240,255,A)', 0.22 * op); }
  else { ctx.fillStyle = '#05060f'; rr(sx + 6, y + 6, w - 12, dh - 6, 14); ctx.fill(); }
  ctx.save(); ctx.beginPath(); ctx.rect(sx, y, w, dh); ctx.clip();
  if (ok(P)) { const iw = P.naturalWidth, ih = P.naturalHeight; ctx.drawImage(P, 0, 0, iw / 2, ih, sx - sh, y, half, dh); ctx.drawImage(P, iw / 2, 0, iw / 2, ih, sx + half + sh, y, half, dh); }
  else { ctx.fillStyle = '#6a7a9a'; ctx.fillRect(sx - sh, y, half, dh); ctx.fillRect(sx + half + sh, y, half, dh); }
  ctx.restore();
  ctx.lineWidth = 14; ctx.strokeStyle = '#2a3460'; rr(sx - 8, y - 10, w + 16, dh + 10, 18); ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#0a0e22'; ctx.stroke();
  ctx.fillStyle = locked ? (Math.floor(time * 3) % 2 ? '#ff3a4a' : '#7a1020') : '#35ff8a'; ctx.beginPath(); ctx.arc(sx + w / 2, y - 26, 9, 0, 7); ctx.fill(); if (!PREVIEW) glow(sx + w / 2, y - 26, 30, locked ? 'rgba(255,60,80,A)' : 'rgba(53,255,138,A)', 0.6);
  if (D.label) { ctx.font = '800 22px "Baloo 2",system-ui'; ctx.textAlign = 'center'; const tw = Math.max(120, ctx.measureText(D.label).width + 30); ctx.fillStyle = '#0a0e22'; rr(sx + w / 2 - tw / 2, y - 64, tw, 30, 10); ctx.fill(); ctx.fillStyle = '#9ff0ff'; ctx.fillText(D.label, sx + w / 2, y - 41); }
}
// interior de otra sala dibujado en pequeño dentro de un hueco (puerta abierta o escaparate)
function preview(to, x, y, w, h, tx) {
  const T = ROOMS[to]; if (!T || PREVIEW) { ctx.fillStyle = '#05060f'; ctx.fillRect(x, y, w, h); return; }
  const sR = R, sC = camX; PREVIEW = true;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  R = T; const s = h / (T.floor + 60 - 120); camX = Math.max(0, Math.min(T.W - VW, (tx || 300) - VW / 2));
  ctx.translate(x + w / 2, y + h); ctx.scale(s, s); ctx.translate(-((tx || 300) - camX), -(T.floor + 60));
  try { T.paint('lejos'); T.paint('pared'); T.paint('suelo'); plats().forEach(drawPlat); for (const k of T.hot) if (k.draw && !k.door && (!k.vis || k.vis())) k.draw(); } catch (e) {}
  if (T.dark && !F('energia')) { ctx.fillStyle = 'rgba(0,0,6,.9)'; ctx.fillRect(-5000, -5000, 10000, 10000); }
  ctx.restore(); R = sR; camX = sC; PREVIEW = false;
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, y, w, h);
}
function animDoors(dt) { for (const k in DOORS) { const d = DOORS[k]; d.o += Math.sign(d.to - d.o) * Math.min(Math.abs(d.to - d.o), dt * 2.6); } }

/* ---------- personajes provisionales (robots dibujados) ---------- */
const CH = {};
function drawBot(id, x, o) {
  const c = CH[id] || (CH[id] = { talk: 0 }); c.x = x; c.top = R.floor - (o.h || 260);
  const t = time + x * 0.01, y = R.floor + 4, bob = Math.sin(t * 2.4) * 5, sx = x - camX, mouth = c.talk > 0 ? Math.abs(Math.sin(time * 18)) : 0.15;
  if (sx < -200 || sx > VW + 200) return;
  const base = 'pj-' + id + (o.sleep ? '-dormida' : ''), fr = [opt(base), opt(base + '-2'), opt(base + '-3')].filter(Boolean), pi = fr.length ? fr[Math.floor(time * (c.talk > 0 ? 8 : 3) + x) % fr.length] : null;
  if (pi) { const h = o.h || 260, w = h * pi.naturalWidth / pi.naturalHeight; ctx.save(); ctx.translate(sx, y + bob * 0.4); if (o.flip) ctx.scale(-1, 1); ctx.scale(1, 1 + mouth * 0.015); ctx.drawImage(pi, -w / 2, -h, w, h); ctx.restore(); return; }
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, y, 70, 14, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(sx, y - 20 + bob); const col = o.col || '#4a8aff';
  if (o.kind === 'bola') { ctx.fillStyle = lg(-60, -120, 60, 0, ['#fff', col, '#1a2a6a']); ctx.beginPath(); ctx.arc(0, -70, 70, 0, 7); ctx.fill(); stroke(); }
  else { ctx.fillStyle = lg(-50, -170, 50, 0, ['#e8f0ff', col, '#1a2050']); rr(-55, -150, 110, 140, 30); ctx.fill(); stroke();
    ctx.fillStyle = lg(-60, -260, 60, -150, ['#ffffff', '#b8c8e8']); rr(-62, -262, 124, 110, 46); ctx.fill(); stroke(); }
  const ey = o.kind === 'bola' ? -90 : -215;
  if (o.sleep) { ctx.strokeStyle = '#0a0e22'; ctx.lineWidth = 6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 24, ey, 13, 0.2, Math.PI - 0.2); ctx.stroke(); } ctx.font = '900 34px Orbitron'; ctx.fillStyle = '#9ff0ff'; ctx.textAlign = 'center'; ctx.fillText('Z', 60 + Math.sin(time * 2) * 6, ey - 60 - (time * 20) % 30); }
  else { for (const s of [-1, 1]) { ctx.fillStyle = '#0a0e22'; ctx.beginPath(); ctx.ellipse(s * 24, ey, 16, 20, 0, 0, 7); ctx.fill(); ctx.fillStyle = o.eye || '#35ff8a'; ctx.beginPath(); ctx.arc(s * 24 + 3, ey - 2, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 24 + 6, ey - 7, 4, 0, 7); ctx.fill(); } }
  ctx.fillStyle = '#0a0e22'; rr(-18, ey + 26, 36, 6 + mouth * 16, 6); ctx.fill();
  if (o.hat === 'chef') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-26, -280, 26, 0, 7); ctx.arc(0, -296, 30, 0, 7); ctx.arc(26, -280, 26, 0, 7); ctx.fill(); ctx.fillRect(-44, -282, 88, 24); stroke('#0a0e22', 3); }
  if (o.hat === 'capi') { ctx.fillStyle = '#1a2a6a'; rr(-58, -290, 116, 34, 12); ctx.fill(); stroke(); ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(0, -273, 10, 0, 7); ctx.fill(); }
  if (o.hat === 'antena') { ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -262); ctx.lineTo(0, -300); ctx.stroke(); ctx.fillStyle = '#ff5ad8'; ctx.beginPath(); ctx.arc(0, -304, 10 + Math.sin(time * 6) * 2, 0, 7); ctx.fill(); }
  if (o.kind === 'bola') { ctx.fillStyle = '#9ff0ff'; ctx.fillRect(-4, -150, 8, 22); ctx.beginPath(); ctx.arc(0, -154, 8, 0, 7); ctx.fill(); }
  ctx.restore();
}

/* ---------- objetos provisionales ---------- */
const PROP_H = { cama: 170, taquilla: 310, nevera: 320, cocina: 150, grifo: 240, planta: 440, generador: 320, ascensor: 400, panel: 170, pantalla: 480, escoba: 210, regadera: 90, manzana: 60, mostrador: 150, rejilla: 110 };
function drawProp(kind, x, st, yy) {
  const pi = opt('obj-' + kind + (st ? '-' + st : '')), sx = x - camX, y = yy != null ? yy : R.floor;
  if (sx < -400 || sx > VW + 400) return;
  if (pi) { const h = PROP_H[kind] || 200, w = h * pi.naturalWidth / pi.naturalHeight; ctx.drawImage(pi, sx - w / 2, y - h + 8, w, h); return; }
  ctx.save(); ctx.translate(sx, y);
  if (kind === 'cama') { ctx.fillStyle = lg(0, -120, 0, 0, ['#5a6aa0', '#2a3460']); rr(-160, -110, 320, 100, 20); ctx.fill(); stroke(); ctx.fillStyle = '#9fb4ff'; rr(-150, -130, 300, 40, 16); ctx.fill(); stroke(); ctx.fillStyle = '#fff'; rr(-140, -150, 90, 36, 16); ctx.fill(); stroke(); }
  else if (kind === 'taquilla') { ctx.fillStyle = lg(-70, 0, 70, 0, ['#3a4a7a', '#6a7ab0', '#3a4a7a']); rr(-70, -300, 140, 300, 12); ctx.fill(); stroke(); if (st === 'abierta') { ctx.fillStyle = '#0a0e22'; rr(-60, -290, 120, 280, 8); ctx.fill(); ctx.fillStyle = '#5a6aa0'; ctx.fillRect(-60, -170, 120, 8); } else { ctx.fillStyle = '#0a0e22'; for (let i = 0; i < 4; i++) ctx.fillRect(-40, -270 + i * 14, 80, 6); ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(50, -150, 7, 0, 7); ctx.fill(); } }
  else if (kind === 'nevera') { ctx.fillStyle = lg(-80, 0, 80, 0, ['#c8d8f0', '#ffffff', '#a8b8d8']); rr(-80, -320, 160, 320, 18); ctx.fill(); stroke(); ctx.fillStyle = '#0a0e22'; ctx.fillRect(-80, -200, 160, 5); ctx.fillRect(56, -290, 8, 60); ctx.fillRect(56, -170, 8, 60); }
  else if (kind === 'cocina') { ctx.fillStyle = lg(0, -120, 0, 0, ['#8a9ac8', '#3a4a7a']); rr(-200, -120, 400, 120, 10); ctx.fill(); stroke(); for (const s of [-1, 1]) { ctx.fillStyle = '#0a0e22'; ctx.beginPath(); ctx.ellipse(s * 90, -122, 50, 10, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,90,40,' + (0.5 + 0.4 * Math.sin(time * 6 + s)) + ')'; ctx.lineWidth = 3; ctx.stroke(); } }
  else if (kind === 'mostrador') { ctx.fillStyle = lg(0, -150, 0, 0, ['#8a5ad0', '#3a1a6a']); rr(-230, -150, 460, 150, 14); ctx.fill(); stroke(); ctx.fillStyle = '#ffd23c'; ctx.fillRect(-230, -150, 460, 10); ctx.font = '900 30px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe680'; ctx.fillText('★ TIENDA ★', 0, -70); }
  else if (kind === 'grifo') { ctx.fillStyle = '#6a7ab0'; rr(-60, -150, 120, 150, 10); ctx.fill(); stroke(); ctx.fillStyle = '#aab8e0'; ctx.fillRect(-10, -210, 20, 60); ctx.fillRect(-10, -210, 60, 18); stroke(); ctx.fillStyle = '#29a8ff'; if (st === 'agua') ctx.fillRect(38, -190, 8, 40 + 6 * Math.sin(time * 20)); ctx.beginPath(); ctx.arc(0, -224, 12, 0, 7); ctx.fillStyle = '#ff5a6a'; ctx.fill(); stroke('#0a0e22', 3); }
  else if (kind === 'planta') { const gr = st === 'grande'; ctx.fillStyle = '#7a4a2a'; rr(-80, -90, 160, 90, 14); ctx.fill(); stroke(); ctx.strokeStyle = gr ? '#2a9a3a' : '#7a6a3a'; ctx.lineWidth = gr ? 22 : 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -90); if (gr) { ctx.bezierCurveTo(60, -200, -60, -320, 20, -470); } else ctx.quadraticCurveTo(50, -160, 70, -150); ctx.stroke();
    if (!gr) { ctx.fillStyle = '#9a8a4a'; for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(30 + i * 8, -120 - i * 14); ctx.rotate((i % 2 ? 1 : -1) * 1.4); ctx.beginPath(); ctx.ellipse(0, 0, 20, 7, 0, 0, 7); ctx.fill(); ctx.restore(); } }
    else { ctx.fillStyle = '#ff5ad8'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.sin(i * 2.1) * 40, -140 - i * 70, 9, 0, 7); ctx.fill(); } } }
  else if (kind === 'generador') { const on = F('energia'); ctx.fillStyle = lg(-150, 0, 150, 0, ['#2a3460', '#5a6aa0', '#2a3460']); rr(-150, -300, 300, 300, 20); ctx.fill(); stroke(); ctx.fillStyle = '#0a0e22'; rr(-110, -260, 220, 120, 14); ctx.fill();
    ctx.fillStyle = on ? '#35ff8a' : '#3a1a20'; for (let i = 0; i < 5; i++) { ctx.globalAlpha = on ? 0.5 + 0.5 * Math.sin(time * 6 + i) : 1; rr(-95 + i * 40, -245, 30, 90, 6); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.fillStyle = F('tuerca') ? '#9aa' : '#c88a3a'; ctx.beginPath(); ctx.arc(-80, -80, 18, 0, 7); ctx.fill(); stroke('#0a0e22', 3); ctx.fillStyle = F('fusibleOk') ? '#35ff8a' : '#0a0e22'; rr(40, -110, 70, 50, 8); ctx.fill(); stroke('#ffd23c', 3);
    if (on && !PREVIEW) glow(0, -200, 220, 'rgba(53,255,138,A)', 0.2); }
  else if (kind === 'ascensor') { const on = F('energia'); ctx.fillStyle = '#2a3460'; rr(-150, -380, 300, 380, 20); ctx.fill(); stroke(); ctx.font = '900 40px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = on ? '#35ff8a' : '#5a2a2a'; ctx.fillText(on ? '▲' : '✖', 0, -400); }
  else if (kind === 'panel') { ctx.fillStyle = lg(0, -160, 0, 0, ['#5a6aa0', '#1a2050']); ctx.beginPath(); ctx.moveTo(-220, 0); ctx.lineTo(-180, -150); ctx.lineTo(180, -150); ctx.lineTo(220, 0); ctx.closePath(); ctx.fill(); stroke();
    const cols = ['#ff5a6a', '#35ff8a', '#ffd23c', '#29e6ff']; for (let i = 0; i < 10; i++) { ctx.fillStyle = cols[i % 4]; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 4 + i); ctx.beginPath(); ctx.arc(-150 + i * 34, -110 + (i % 2) * 30, 9, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff2a3a'; ctx.beginPath(); ctx.arc(120, -60, 26, 0, 7); ctx.fill(); stroke(); }
  else if (kind === 'pantalla') { ctx.fillStyle = '#0a0e22'; rr(-220, -470, 440, 240, 20); ctx.fill(); stroke('#3a4a7a', 10); ctx.save(); rr(-205, -455, 410, 210, 14); ctx.clip(); ctx.fillStyle = '#04102a'; ctx.fillRect(-205, -455, 410, 210); ctx.strokeStyle = 'rgba(41,230,255,.3)'; ctx.lineWidth = 1; for (let i = -200; i < 210; i += 30) { ctx.beginPath(); ctx.moveTo(i, -455); ctx.lineTo(i, -245); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-205, -455 + (i + 200) / 2); ctx.lineTo(205, -455 + (i + 200) / 2); ctx.stroke(); }
    ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(Math.sin(time) * 120, -350, 8, 0, 7); ctx.fill(); ctx.restore(); }
  else if (kind === 'escoba') { ctx.rotate(-0.25); ctx.fillStyle = '#c8943a'; ctx.fillRect(-6, -200, 12, 170); ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(40, 0); ctx.fill(); stroke(); }
  else if (kind === 'regadera') { ctx.fillStyle = '#3a9aff'; rr(-40, -70, 80, 70, 12); ctx.fill(); stroke(); ctx.beginPath(); ctx.moveTo(38, -50); ctx.lineTo(80, -90); ctx.lineWidth = 10; ctx.strokeStyle = '#3a9aff'; ctx.stroke(); }
  else if (kind === 'manzana') { if (!PREVIEW) glow(0, -30, 60, 'rgba(255,120,80,A)', 0.4); ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(0, -30 + Math.sin(time * 3) * 3, 28, 0, 7); ctx.fill(); stroke(); ctx.fillStyle = '#3ad04a'; ctx.beginPath(); ctx.ellipse(10, -62, 14, 6, -0.5, 0, 7); ctx.fill(); }
  else if (kind === 'rejilla') { ctx.fillStyle = '#0a0e22'; rr(-70, -110, 140, 110, 12); ctx.fill(); stroke('#5a6aa0', 8); ctx.fillStyle = '#5a6aa0'; for (let i = 0; i < 5; i++) ctx.fillRect(-60, -100 + i * 22, 120, 6); if (st === 'abierta') { ctx.fillStyle = 'rgba(41,230,255,.25)'; ctx.fillRect(-60, -100, 120, 96); } }
  ctx.restore();
}

function drawCajon(x) { const im = opt('obj-cajon'), sx = x - camX, y = R.floor; if (im) { const h = 150, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, sx - w / 2, y - h + 6, w, h); return; }
  ctx.fillStyle = lg(sx - 80, 0, sx + 80, 0, ['#4a5068', '#8a90a8', '#4a5068']); rr(sx - 80, y - 140, 160, 140, 10); ctx.fill(); stroke(); ctx.fillStyle = '#2a2e40'; ctx.fillRect(sx - 80, y - 100, 160, 10); ctx.fillRect(sx - 80, y - 46, 160, 10);
  ctx.fillStyle = '#ffd23c'; ctx.font = '900 18px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('NO ABRIR', sx, y - 62); ctx.fillStyle = '#0a0e22'; for (const [a, b] of [[-66, -126], [66, -126], [-66, -14], [66, -14]]) { ctx.beginPath(); ctx.arc(sx + a, y + b, 5, 0, 7); ctx.fill(); } }
/* ---------- fachada de la tienda: escaparate con el interior a la vista ---------- */
function drawShopFront(x) {
  const sx = x - camX, top = R.floor - 470; if (sx < -500 || sx > VW + 500) return;
  ctx.fillStyle = lg(0, top, 0, R.floor, ['#4a2a8a', '#1a0a3a']); rr(sx - 330, top, 660, 470, 20); ctx.fill(); stroke('#0a0e22', 5);
  // escaparate: se ve la tienda por dentro
  preview('tienda', sx - 300, top + 120, 160, 260, 860); preview('tienda', sx + 140, top + 120, 160, 260, 1150);
  for (const wx of [sx - 300, sx + 140]) { ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23c'; rr(wx, top + 120, 160, 260, 10); ctx.stroke(); ctx.fillStyle = 'rgba(200,240,255,.10)'; ctx.beginPath(); ctx.moveTo(wx + 20, top + 130); ctx.lineTo(wx + 70, top + 130); ctx.lineTo(wx + 30, top + 370); ctx.lineTo(wx - 10 + 20, top + 370); ctx.fill(); }
  // letrero de neón que parpadea
  const on = Math.sin(time * 9) > -0.85 || Math.random() > 0.3; ctx.font = '900 40px Orbitron'; ctx.textAlign = 'center';
  ctx.fillStyle = '#0a0e22'; rr(sx - 280, top + 22, 560, 70, 16); ctx.fill(); stroke('#ff5ad8', 4);
  if (on) { ctx.shadowColor = '#ff5ad8'; ctx.shadowBlur = PREVIEW ? 0 : 24; } ctx.fillStyle = on ? '#ffd0f4' : '#6a3a6a'; ctx.fillText('TIENDA DE CHISPA', sx, top + 72); ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) { ctx.fillStyle = ['#ff5ad8', '#ffd23c', '#29e6ff'][(i + Math.floor(time * 4)) % 3]; ctx.beginPath(); ctx.arc(sx - 310 + i * 56, top + 8, 7, 0, 7); ctx.fill(); }
}

/* =====================================================================
   CAPÍTULO 1: LA NAVE SIN ENERGÍA
   Caminos: el fusible se gana ayudando a Bolita o se compra en la tienda;
   al puente se sube en ascensor o trepando por la planta hasta el conducto.
   ===================================================================== */
const CHIP_ROOMS = ['camarote', 'pasillo', 'tienda', 'cocina', 'invernadero', 'maquinas', 'puente'];
const dk = (id, to, tx, label, locked, extra) => Object.assign({ id, to, tx, label, locked }, extra || {});
room('camarote', {
  name: 'EL CAMAROTE', W: 1750,
  plat: [[330, 492, 300, 'none'], [640, 400, 200, 'estante'], [1000, 470, 170], [1200, 340, 170]],
  coins: [[250, 440], [410, 440], [600, 350], [680, 350], [1000, 420], [1200, 290]],
  chip: [1290, 250],
  paint(l) { if (l === 'lejos') return space(0.15, 235); if (l === 'pared') return wall('#2a3a7a', '#141c44', [[860, 110, 400, 290]]); if (l === 'suelo') return floorDraw(); if (l === 'delante') return frontPipes(1); },
  hot: [
    { id: 'cama', x: 330, w: 320, h: 160, ic: '✋', draw: () => drawProp('cama', 330),
      act() { if (!F('tarjeta')) say([['lucas', '¿Qué hay debajo de la almohada?'], ['lucas', '¡Una tarjeta!']], () => { give('tarjeta'); setF('tarjeta'); say([['narr', '¡Lucas tiene una tarjeta! Mira tu mochila, abajo.']]); }); else say([['lucas', 'Mi cama. ¡Y se puede saltar encima!']]); } },
    { id: 'ventana', x: 1060, w: 400, h: 290, y: 110, ic: '👁', act() { say([['narr', 'Por la ventana se ven estrellas. ¡Y un planeta con anillos!'], ['lucas', 'No conozco ese planeta. ¡Estamos perdidos!']]); } },
    { id: 'taquilla', x: 1390, w: 150, h: 310, ic: '✋', draw: () => drawProp('taquilla', 1390, F('taquilla') ? 'abierta' : ''),
      act() { if (!F('taquilla')) { setF('taquilla'); SFX.door(); say([['lucas', '¡Mi taquilla! Voy a abrirla.'], ['lucas', '¡Una linterna!']], () => { give('linterna'); say([['narr', 'La linterna sirve para ver en sitios oscuros.']]); }); } else say([['lucas', 'Ya está vacía.']]); } },
    { id: 'puerta', x: 1610, w: 220, h: 330, ic: '🚪', door: dk('cam', 'pasillo', 180, 'PASILLO', () => !F('camAbierta')), draw() { drawDoor(this); },
      act() { if (has('tarjeta')) say([['lucas', '¡Uso la tarjeta! Bip.']], () => { take('tarjeta'); setF('camAbierta'); door('cam').to = 1; SFX.door(); }); else { SFX.bad(); say([['lucas', 'La puerta está cerrada.'], ['lucas', 'Necesito algo para abrirla.']]); } } }
  ],
  enter() { if (!G.seen.intro) { G.seen.intro = 1; save(); intro(); } }
});
room('pasillo', {
  name: 'EL PASILLO', W: 3300,
  plat: [[2000, 530, 120, 'caja'], [2120, 440, 120, 'caja'], [2330, 330, 240, 'tubo']],
  coins: [[700, 560], [1080, 560], [2000, 480], [2120, 390], [2260, 280], [2400, 280], [3150, 560]],
  chip: [2330, 250],
  paint(l) { if (l === 'lejos') return space(0.2, 250); if (l === 'pared') return wall('#24346a', '#10183a', [[2780, 130, 140, 180], [3080, 130, 140, 180]], F('energia') ? '#35ff8a' : '#ff5a6a'); if (l === 'suelo') return floorDraw(); if (l === 'delante') return frontPipes(5); },
  hot: [
    { id: 'pCam', x: 180, w: 220, h: 330, ic: '🚪', door: dk('pcam', 'camarote', 1460, 'CAMAROTE'), draw() { drawDoor(this); } },
    { id: 'pCoc', x: 620, w: 220, h: 330, ic: '🚪', door: dk('pcoc', 'cocina', 220, 'COCINA'), draw() { drawDoor(this); } },
    { id: 'bolita', x: 920, w: 170, h: 200, ic: '👋', ch: true, draw: () => drawBot('bolita', 920, { kind: 'bola', col: '#ff9a3a', eye: '#29e6ff', h: 180 }), act: bolita },
    { id: 'pInv', x: 1300, w: 220, h: 330, ic: '🚪', door: dk('pinv', 'invernadero', 220, 'INVERNADERO'), draw() { drawDoor(this); } },
    { id: 'pTie', x: 1700, w: 220, h: 330, ic: '🚪', door: dk('ptie', 'tienda', 200, ''), draw() { drawShopFront(1700); drawDoor(this); } },
    { id: 'cajon', x: 2830, w: 170, h: 150, ic: '🔨', vis: () => !F('cajaRota'), draw: () => drawCajon(2830),
      act() { if (has('martillo')) say([['lucas', '¡Uso el martillo! ¡Pum, pum!']], () => { take('martillo'); setF('cajaRota'); FX.shake = 0.6; SFX.door(); addCoins(8); (FX.pop = FX.pop || []).push({ x: 2830, y: 420, t: 1.4, s: '+8' }); say([['narr', '¡La caja se rompe! ¡Dentro había ocho monedas!']]); });
        else say([['lucas', 'Una caja de hierro muy dura.'], ['lucas', 'Pone: NO ABRIR. ¡Je, je!'], ['lucas', 'Necesito algo para romperla.']]); } },
    { id: 'pMaq', x: 2620, w: 220, h: 330, ic: '🚪', door: dk('pmaq', 'maquinas', 220, 'MÁQUINAS'), draw() { drawDoor(this); } },
    { id: 'asc', x: 3000, w: 260, h: 380, ic: '🛗', door: dk('asc', '__subir', 0, 'ASCENSOR', () => !F('energia')), draw() { drawProp('ascensor', 3000); drawDoor(this); },
      act() { SFX.bad(); say([['lucas', 'El ascensor no funciona.'], ['lucas', '¡La nave no tiene energía!']]); } }
  ],
  enter() { if (!G.seen.pasillo) { G.seen.pasillo = 1; save(); say([['narr', 'Este es el pasillo de la nave. ¡Tiene muchas puertas!'], ['narr', '¡Y hay una tienda! Se ve por el escaparate.']]); } }
});
function bolita() {
  if (F('bolitaFeliz')) return say([['bolita', '¡Gracias por mi escoba, Lucas!'], ['bolita', 'Ahora todo brilla. ¡Fiu, fiu!']]);
  if (has('escoba')) return say([['lucas', '¡Bolita! ¡He encontrado tu escoba!'], ['bolita', '¡Mi escoba! ¡Bieeen!'], ['bolita', 'Te quiero dar un regalo.']], () => {
    take('escoba'); setF('bolitaFeliz');
    choose('¿Qué regalo eliges?', [{ e: '🔋', t: 'Un fusible' }, { e: '🪙', t: '6 monedas' }], i => {
      if (i === 0) { give('fusible'); say([['bolita', '¡Toma! Lo encontré en el suelo.'], ['narr', 'Las máquinas necesitan el fusible.']]); }
      else { addCoins(6); say([['bolita', '¡Toma, seis monedas!'], ['bolita', 'En la tienda de Chispa venden cosas chulas.']]); } }); });
  if (!F('bolitaHola')) { setF('bolitaHola'); return say([['bolita', '¡Lucas! ¡Ya te has despertado!'], ['bolita', 'Soy Bolita, el robot que limpia.'], ['bolita', 'La nave está sin energía.'], ['bolita', 'La capitana está arriba, en el puente.'], ['bolita', 'Pero el ascensor no funciona.'], ['bolita', 'Y yo... ¡he perdido mi escoba! Buaaa.']]); }
  say([['bolita', 'Sin mi escoba no puedo limpiar.'], ['bolita', '¡Seguro que está en un sitio oscuro!']]);
}
room('tienda', {
  name: 'LA TIENDA DE CHISPA', W: 1400,
  plat: [[480, 460, 200, 'estante'], [700, 330, 160, 'estante'], [1250, 250, 170, 'estante'], [1080, 460, 160, 'estante']],
  coins: [[480, 410], [700, 280], [1250, 200]],
  chip: [1300, 170],
  paint(l) { if (l === 'lejos') return space(0.1, 290, false);
    if (l === 'pared') { wall('#5a2a8a', '#22103e', [], '#ff5ad8'); for (let i = 0; i < 6; i++) { const x = 200 + i * 200 - camX; ctx.fillStyle = ['#ff5ad8', '#ffd23c', '#29e6ff'][i % 3]; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x - 60, R.floor - 90); ctx.lineTo(x + 60, R.floor - 90); ctx.fill(); ctx.globalAlpha = 1; } return; }
    if (l === 'suelo') { floorDraw('rgba(140,60,200,.25)'); return; } if (l === 'delante') return frontPipes(21, '#5a2a8a'); },
  hot: [
    { id: 'tDoor', x: 200, w: 220, h: 330, ic: '🚪', door: dk('tdoor', 'pasillo', 1700, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'mostr', x: 880, w: 460, h: 150, draw: () => { drawBot('chispa', 880, { col: '#b04aff', eye: '#ffd23c', hat: 'antena', h: 290 }); drawProp('mostrador', 880); }, ic: '🛒', act: () => shop() }
  ],
  enter() { if (!G.seen.tienda) { G.seen.tienda = 1; save(); say([['chispa', '¡Bienvenido a mi tienda, Lucas!'], ['chispa', 'Soy Chispa. Tengo cosas geniales.'], ['chispa', 'Trae monedas y te las vendo.']]); } }
});
room('cocina', {
  name: 'LA COCINA', W: 1800,
  plat: [[470, 500, 240, 'estante'], [470, 380, 240, 'estante'], [1330, 470, 160], [1560, 300, 170, 'none']],
  coins: [[420, 450], [520, 450], [1330, 420], [1520, 250], [1600, 250]],
  chip: [1680, 220],
  paint(l) { if (l === 'lejos') return space(0.15, 300, false); if (l === 'pared') return wall('#4a2a5a', '#20102e', [[760, 120, 300, 220]], '#ffd23c'); if (l === 'suelo') return floorDraw('rgba(120,60,40,.25)'); if (l === 'delante') return frontPipes(9, '#4a2a5a'); },
  hot: [
    { id: 'cDoor', x: 150, w: 220, h: 330, ic: '🚪', door: dk('cdoor', 'pasillo', 620, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'regadera', x: 470, w: 120, h: 90, y: 290, ic: '✋', vis: () => !F('regadera'), draw: () => drawProp('regadera', 470, '', 380),
      act() { say([['lucas', '¡Una regadera!']], () => { setF('regadera'); give('regadera'); }); } },
    { id: 'estanteria', x: 470, w: 240, h: 200, y: 420, ic: '👁', vis: () => !F('regadera') && !F('vioEst'), act() { setF('vioEst'); say([['lucas', 'Arriba del todo hay una regadera.'], ['lucas', '¡Tengo que saltar por las baldas!']]); } },
    { id: 'cocinaF', x: 860, w: 400, h: 150, ic: '👁', draw: () => drawProp('cocina', 860), act() { say([['lucas', '¡Cuidado, quema!']]); } },
    { id: 'chef', x: 1100, w: 170, h: 300, ic: '👋', ch: true, draw: () => drawBot('chef', 1100, { col: '#ff5a6a', eye: '#ffd23c', hat: 'chef', h: 300 }), act: chef },
    { id: 'nevera', x: 1560, w: 160, h: 320, ic: '👁', draw: () => drawProp('nevera', 1560), act() { say([['lucas', 'La nevera está vacía.'], ['lucas', '¡No hay ni una manzana!']]); } }
  ],
  enter() { if (!G.seen.cocina) { G.seen.cocina = 1; save(); say([['narr', 'La cocina huele a tornillos tostados.']]); } }
});
function chef() {
  if (F('chefFeliz')) return say([['chef', '¡Qué manzana tan rica!'], ['chef', 'Usa mi llave inglesa para arreglar cosas.']]);
  if (has('manzana')) return say([['lucas', 'Chef, ¡te traigo una manzana!'], ['chef', '¡Ñam, ñam! ¡Qué rica!'], ['chef', 'Toma mi llave inglesa.'], ['chef', 'Sirve para apretar tuercas.']], () => { take('manzana'); setF('chefFeliz'); give('llave'); });
  if (!F('chefHola')) { setF('chefHola'); return say([['chef', '¡Hola, Lucas! Soy el Chef Tuercas.'], ['chef', '¡Ay, qué hambre tengo!'], ['chef', 'Tráeme una manzana espacial.'], ['chef', 'Y te daré un regalo.']]); }
  say([['chef', '¡Tengo hambre! ¿Y mi manzana?']]);
}
room('invernadero', {
  name: 'EL INVERNADERO', W: 2300,
  plat: () => F('plantaRegada') ? [[1050, 480, 140, 'hoja'], [1250, 360, 140, 'hoja'], [1060, 240, 140, 'hoja'], [1850, 470, 200]] : [[1850, 470, 200]],
  coins: [[700, 560], [1050, 430], [1250, 310], [1800, 420], [1900, 420], [2150, 560]],
  chip: [1060, 180],
  paint(l) { if (l === 'lejos') return space(0.12, 170);
    if (l === 'pared') { wall('#1a4a3a', '#0a2018', [[400, 90, 1300, 300]], '#35ff8a'); for (let x = 450; x < 1700; x += 140) { ctx.fillStyle = '#2a6a4a'; ctx.fillRect(x - camX, 90, 8, 300); } return; }
    if (l === 'suelo') { floorDraw('rgba(40,120,60,.25)'); for (let x = 60; x < R.W; x += 230) { ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(x - camX, R.floor - 6, 60, 18, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = ['#ff5ad8', '#ffd23c', '#5ad8ff'][x % 3]; ctx.beginPath(); ctx.arc(x - camX + 20, R.floor - 24, 8, 0, 7); ctx.fill(); } return; }
    if (l === 'delante') { for (let i = 0; i < 4; i++) { const x = i * 700 + 300 - camX * 1.3; ctx.fillStyle = '#0e3a1e'; ctx.beginPath(); ctx.ellipse(x, VH + 30, 160, 120, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1a5a2a'; ctx.beginPath(); ctx.ellipse(x + 60, VH + 10, 90, 80, 0.4, 0, 7); ctx.fill(); } } },
  hot: [
    { id: 'iDoor', x: 150, w: 220, h: 330, ic: '🚪', door: dk('idoor', 'pasillo', 1300, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'grifo', x: 520, w: 140, h: 240, ic: '✋', draw: () => drawProp('grifo', 520, FX.agua > 0 ? 'agua' : ''),
      act() { if (has('regadera')) { FX.agua = 1.6; SFX.grow(); say([['lucas', '¡Lleno la regadera de agua!']], () => { take('regadera'); give('regadera-llena'); }); } else if (has('regadera-llena')) say([['lucas', 'La regadera ya está llena.']]); else say([['lucas', 'Es un grifo de agua.'], ['lucas', 'Si tuviera algo para llevar agua...']]); } },
    { id: 'planta', x: 1150, w: 200, h: 200, ic: '✋', draw: () => drawProp('planta', 1150, F('plantaRegada') ? 'grande' : ''),
      act() {
        if (F('plantaRegada')) return say([['lucas', '¡Qué planta tan grande!'], ['lucas', '¡Sus hojas parecen escaleras!']]);
        if (has('regadera-llena')) return say([['lucas', '¡Agua para ti, plantita!']], () => { take('regadera-llena'); SFX.grow(); setF('plantaRegada'); FX.grow = 1; FX.shake = 0.5; say([['narr', '¡La planta crece y crece hasta el techo!'], ['narr', '¡Y se cae una manzana!']]); });
        say([['lucas', 'Esta planta está muy triste.'], ['lucas', 'Creo que tiene sed.']]); } },
    { id: 'manzana', x: 1290, w: 90, h: 80, ic: '✋', vis: () => F('plantaRegada') && !F('manzana'), draw: () => drawProp('manzana', 1290), act() { setF('manzana'); give('manzana'); say([['lucas', '¡Una manzana espacial!']]); } },
    { id: 'rejilla', x: 1260, w: 150, h: 120, y: 120, ic: '🕳', draw: () => drawProp('rejilla', 1260, F('plantaRegada') ? 'abierta' : '', 240),
      act() { if (!G.seen.rej) { G.seen.rej = 1; save(); say([['lucas', '¡Un conducto de aire!'], ['lucas', '¿Adónde llevará?']]); return; } choose('¿Entras en el conducto?', [{ e: '🕳', t: '¡Sí, a gatas!' }, { e: '✋', t: 'Mejor no' }], i => { if (i === 0) enterVent(this); }); } }
  ],
  enter() { if (!G.seen.inv) { G.seen.inv = 1; save(); say([['narr', 'El invernadero. Aquí crecen las plantas de la nave.']]); } }
});
room('maquinas', {
  name: 'LAS MÁQUINAS', W: 2300, dark: true,
  plat: [[700, 460, 300], [1100, 350, 240]],
  coins: [[640, 410], [760, 410], [1060, 300], [1140, 300], [1400, 560]],
  chip: [2180, 520],
  paint(l) { if (l === 'lejos') { ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, VW, VH); return; }
    if (l === 'pared') { wall('#2a2a3a', '#101018', [], F('energia') ? '#35ff8a' : '#ff5a6a'); for (let x = 300; x < R.W; x += 260) { if (x - camX < -150 || x - camX > VW + 20) continue; ctx.fillStyle = '#1a1a2a'; rr(x - camX, 140, 120, 330, 14); ctx.fill(); ctx.fillStyle = F('energia') ? '#35ff8a' : '#3a1a1a'; for (let i = 0; i < 6; i++) { ctx.globalAlpha = F('energia') ? 0.4 + 0.6 * Math.abs(Math.sin(time * 3 + i + x)) : 1; ctx.fillRect(x - camX + 20, 170 + i * 45, 80, 20); } ctx.globalAlpha = 1; } return; }
    if (l === 'suelo') return floorDraw('rgba(0,0,0,.25)'); if (l === 'delante') return frontPipes(13, '#3a3a4a'); },
  hot: [
    { id: 'mDoor', x: 150, w: 220, h: 330, ic: '🚪', door: dk('mdoor', 'pasillo', 2620, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'escoba', x: 950, w: 120, h: 210, ic: '✋', vis: () => !F('escoba'), draw: () => drawProp('escoba', 950), act() { say([['lucas', '¡Una escoba!'], ['lucas', '¿Será la escoba de Bolita?']], () => { setF('escoba'); give('escoba'); }); } },
    { id: 'gen', x: 1700, w: 300, h: 320, ic: '🔧', draw: () => drawProp('generador', 1700), act: generador }
  ],
  enter() { if (!F('energia') && !has('linterna')) say([['lucas', '¡Qué oscuro está esto!'], ['lucas', 'No veo nada. Necesito luz.']]); else if (!G.seen.maq) { G.seen.maq = 1; save(); say([['narr', 'Lucas enciende la linterna. ¡Ahora sí se ve!']]); } }
});
function generador() {
  if (F('energia')) return say([['lucas', '¡El generador funciona!']]);
  if (!F('tuerca')) { if (has('llave')) { say([['lucas', 'Hay una tuerca suelta.'], ['lucas', '¡Uso la llave inglesa! Clonc, clonc.']], () => { setF('tuerca'); take('llave'); SFX.door(); generador(); }); return; } say([['lucas', 'Es el generador de la nave.'], ['lucas', 'Tiene una tuerca suelta.'], ['lucas', 'Necesito algo para apretarla.']]); return; }
  if (has('fusible')) { say([['lucas', 'Y ahora... ¡pongo el fusible!']], () => { take('fusible'); setF('fusibleOk'); powerOn(); }); return; }
  say([['lucas', 'La tuerca ya está bien.'], ['lucas', 'Pero falta un fusible.']]);
}
function powerOn() { SFX.power(); setF('energia'); FX.flash = 1.5; setTimeout(() => { SFX.win(); say([['narr', '¡Bien! ¡La nave tiene energía otra vez!'], ['lucas', '¡Ahora funcionará el ascensor!']]); }, 1400); }
room('puente', {
  name: 'EL PUENTE DE MANDO', W: 2100,
  plat: [[1880, 420, 220], [1650, 300, 140]],
  coins: [[1820, 370], [1940, 370], [800, 560], [1650, 250]],
  chip: [2020, 330],
  paint(l) { if (l === 'lejos') return space(0.18, 215); if (l === 'pared') { wall('#1a2a5a', '#0a1030', [[220, 110, 560, 300], [1180, 110, 400, 300]], '#29e6ff'); drawProp('rejilla', 1880, 'abierta', 170); return; } if (l === 'suelo') return floorDraw('rgba(20,40,120,.2)'); if (l === 'delante') return frontPipes(17); },
  hot: [
    { id: 'uAsc', x: 150, w: 220, h: 330, ic: '🛗', door: dk('uasc', '__bajar', 0, 'ASCENSOR'), draw() { drawDoor(this); } },
    { id: 'panel', x: 660, w: 440, h: 170, ic: '✋', draw: () => drawProp('panel', 660), act: panel },
    { id: 'pantalla', x: 1040, w: 440, h: 260, y: 150, ic: '👁', draw: () => drawProp('pantalla', 1040), act() { say([['narr', 'En la pantalla hay un mapa de estrellas.'], ['narr', 'Pero no sale nuestro planeta.']]); } },
    { id: 'capi', x: 1420, w: 170, h: 300, ic: '👋', ch: true, draw: () => drawBot('capi', 1420, { col: '#29e6ff', eye: '#ffd23c', hat: 'capi', sleep: !F('capiDespierta'), h: 300 }), act: capi }
  ],
  enter() { if (!G.seen.puente) { G.seen.puente = 1; save(); say([['narr', '¡El puente de mando! Desde aquí se conduce la nave.'], ['lucas', '¡Ahí está la capitana! Pero... ¿está dormida?']]); } }
});
function panel() {
  if (F('capiDespierta')) return say([['lucas', 'Muchos botones. ¡Mejor no tocar!']]);
  if (!F('capiIntento')) return say([['lucas', 'Cuántos botones...'], ['lucas', 'Hay uno rojo muy grande.'], ['lucas', 'Mejor primero hablo con la capitana.']]);
  choose('¿Qué botón tocas?', [{ e: '🔴', t: 'El rojo grande' }, { e: '🟢', t: 'El verde' }, { e: '🟡', t: 'El amarillo' }], i => {
    if (i === 1) { FX.flash = 0.5; return say([['narr', '¡Se encienden todas las luces de colores!'], ['narr', 'Pero la capitana sigue durmiendo.']]); }
    if (i === 2) { SFX.grow(); return say([['narr', 'Suena una musiquita muy suave.'], ['narr', 'La capitana ronca más fuerte. ¡Zzzz!']]); }
    SFX.honk(); FX.shake = 0.8; say([['narr', '¡MOOOC! ¡La bocina suena muy fuerte!']], () => { setF('capiDespierta'); capi(); }); });
}
function capi() {
  if (!F('capiDespierta')) { setF('capiIntento'); return say([['lucas', '¡Capitana! ¡Despierte!'], ['narr', 'La capitana ronca. ¡Zzzz!'], ['lucas', 'Necesito un ruido muy fuerte.']]); }
  if (F('fin1')) return say([['capi', '¡Rumbo al planeta ' + (G.flags.planeta || 'azul') + ', Lucas!']]);
  if (!F('energia')) { if (!F('capiSinLuz')) { setF('capiSinLuz'); return say([['capi', '¡Uy! ¿Quién toca la bocina?'], ['capi', '¡Lucas! ¡La nave no tiene energía!'], ['capi', 'Arregla el generador, en las máquinas.'], ['capi', 'El ascensor puede bajar. ¡Corre!']]); } return say([['capi', 'Sin energía no podemos volar.'], ['capi', 'Arregla el generador de las máquinas.']]); }
  say([[F('capiSinLuz') ? 'capi' : 'capi', F('capiSinLuz') ? '¡Lo has conseguido! ¡Hay energía!' : '¡Uy! ¿Qué pasa? ¿Quién toca la bocina?'], ['capi', '¡Lucas! ¡Has arreglado la nave!'], ['capi', 'Pero estamos perdidos en el espacio.'], ['capi', 'Para volver a casa necesitamos...'], ['capi', '¡tres cristales de energía!'], ['capi', 'Están en tres planetas lejanos.'], ['lucas', '¡Yo los encontraré!'], ['capi', '¿Adónde vamos primero?']], () => {
    choose('¿A qué planeta vamos primero?', [{ e: '🧊', t: 'Planeta de hielo' }, { e: '🌋', t: 'Planeta de fuego' }, { e: '🌴', t: 'Planeta selva' }], i => { G.flags.planeta = ['de hielo', 'de fuego', 'selva'][i]; setF('fin1'); say([['capi', '¡Rumbo al planeta ' + G.flags.planeta + '!']], finChapter); }); });
}

/* ---------- tienda ---------- */
const SHOP = [
  { id: 'fusible', e: '🔋', t: 'Fusible', p: 10, d: 'Da energía a las máquinas.', show: () => !has('fusible') && !F('fusibleOk') },
  { id: 'botas', e: '👢', t: 'Botas saltarinas', p: 8, d: '¡Saltas muchísimo más alto!', show: () => !F('botas') },
  { id: 'martillo', e: '🔨', t: 'Martillo', p: 4, d: 'Sirve para romper cosas.', show: () => !has('martillo') && !F('cajaRota') },
  { id: 'gorro', e: '🧢', t: 'Gorro de hélice', p: 5, d: '¡Lucas lleva un gorro chulísimo!', show: () => !F('gorro') }
];
let SHOPPING = false;
function shop() {
  SHOPPING = true; const m = $('modal'), list = SHOP.filter(s => s.show());
  if (!list.length) return say([['chispa', '¡Me lo has comprado todo!'], ['chispa', 'Vuelve en el próximo capítulo.']]);
  m.innerHTML = '<div class="card wide" style="border-color:#ff5ad8"><h2 style="color:#ff5ad8">TIENDA DE CHISPA</h2><div style="font:900 22px Orbitron;color:#ffe680">Tienes ' + G.coins + ' 🪙</div><div class="choice">' + list.map((s, i) => '<button data-i="' + i + '"' + (G.coins < s.p ? ' disabled' : '') + '><b>' + s.e + '</b>' + s.t + '<span class="pr">' + s.p + ' 🪙</span><small style="font-size:15px;color:#9fb4ff">' + s.d + '</small></button>').join('') + '</div><button class="btn" id="shX">ADIÓS</button></div>';
  m.classList.add('on'); speak('¿Qué quieres comprar? Tienes ' + G.coins + ' monedas.');
  $('shX').onclick = () => { SHOPPING = false; m.classList.remove('on'); shutUp(); say([['chispa', '¡Hasta pronto, Lucas!']]); };
  m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const s = list[+b.dataset.i]; if (G.coins < s.p) return; SHOPPING = false; G.coins -= s.p; paintCoins(); SFX.buy(); m.classList.remove('on'); shutUp();
    if (s.id === 'botas' || s.id === 'gorro') setF(s.id); give(s.id); evt('compra', s.id);
    say([['chispa', '¡Gracias! ¡Es tuyo!'], ['narr', s.id === 'botas' ? '¡Con las botas Lucas salta altísimo! Prueba a llegar a sitios muy altos.' : s.id === 'gorro' ? '¡Qué guapo está Lucas con su gorro!' : s.id === 'martillo' ? 'Un martillo. ¿Habrá algo para romper en la nave?' : 'Un fusible. Llévalo al generador de las máquinas.']]); });
}
function addCoins(n) { G.coins += n; paintCoins(); save(); for (let i = 0; i < Math.min(n, 6); i++) setTimeout(SFX.coin, i * 90); }

/* ---------- elegir entre varias cosas ---------- */
function choose(q, opts, cb) {
  const m = $('modal'); m.innerHTML = '<div class="card wide"><h2>' + esc(q) + '</h2><div class="choice">' + opts.map((o, i) => '<button data-i="' + i + '"><b>' + o.e + '</b>' + esc(o.t) + '</button>').join('') + '</div></div>';
  m.classList.add('on'); speak(q + ' ' + opts.map(o => o.t).join('. ¿O ') + (opts.length > 1 ? '?' : ''));
  m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { m.classList.remove('on'); shutUp(); SFX.click(); cb(+b.dataset.i); });
}
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- pistas (bombilla) ---------- */
function hint() {
  let h;
  if (!F('tarjeta')) h = 'Mira en la cama. ¡Algo hay debajo de la almohada!';
  else if (!F('camAbierta')) h = 'Ve a la puerta y toca la mano amarilla.';
  else if (!F('bolitaHola')) h = 'Sal al pasillo y habla con Bolita, el robot naranja.';
  else if (!F('energia')) {
    if (!F('tuerca') && !has('llave')) h = !F('chefHola') ? 'Entra en la cocina. ¡Alguien tiene mucha hambre!' : !F('regadera') ? 'En la cocina, la regadera está arriba de la estantería. ¡Salta por las baldas!' : !F('plantaRegada') ? (has('regadera-llena') ? '¡Riega la planta del invernadero!' : 'Llena la regadera en el grifo del invernadero.') : !F('manzana') ? 'Coge la manzana que cayó de la planta.' : 'Lleva la manzana al Chef de la cocina.';
    else if (!F('tuerca')) h = 'Aprieta la tuerca del generador con la llave inglesa. Está en las máquinas.';
    else if (!has('fusible') && !F('fusibleOk')) h = F('bolitaFeliz') ? (G.coins >= 10 ? 'Compra un fusible en la tienda de Chispa.' : 'El fusible cuesta 10 monedas. ¡Busca más saltando por las plataformas!') : !F('escoba') ? 'Bolita perdió su escoba en las máquinas. ¡Lleva la linterna!' : 'Devuélvele la escoba a Bolita.';
    else h = 'Pon el fusible en el generador de las máquinas.';
  }
  else if (!F('cajaRota') && G.coins < 4 && Math.random() < 0.3) h = 'En el pasillo hay una caja de hierro. ¡Con un martillo de la tienda podrías romperla!';
  else if (!G.seen.puente) h = '¡Ya hay energía! Sube al puente en el ascensor del pasillo.';
  else if (!F('capiDespierta')) h = F('capiIntento') ? 'Prueba los botones del panel. ¡Alguno hace mucho ruido!' : 'Habla con la capitana.';
  else h = '¡Habla con la capitana!';
  say([['narr', h]]);
}

/* ---------- escenas ---------- */
function intro() {
  FX.shake = 1.2; noise(1.2, 0.2, 300);
  say([['narr', 'Esta es la nave Estrella Azul.'], ['narr', 'Una lluvia de meteoritos la ha golpeado.'], ['narr', 'Ahora está perdida en el espacio.'], ['narr', 'Lucas, el pequeño robot, se despierta.'], ['lucas', '¿Qué ha pasado? ¡Todo está muy raro!'], ['narr', 'Usa las flechas para andar. Y la flecha grande para saltar.'], ['narr', 'Cuando salga la mano amarilla, tócala.'], ['narr', 'Coge las monedas. ¡Sirven para comprar!'], ['narr', 'Si no sabes qué hacer, toca la bombilla.']]);
}
function finChapter() {
  evt('fin'); SFX.win(); const n = Object.keys(G.chips).length;
  setTimeout(() => { const m = $('modal'); m.innerHTML = '<div class="card" style="border-color:var(--gold)"><h2 style="color:var(--gold)">¡CAPÍTULO 1 COMPLETADO!</h2><img src="img/lucas-celebrando.webp" style="height:170px"><div style="font-size:24px">Lucas ha arreglado la nave.<br>¡Rumbo al planeta ' + esc(G.flags.planeta || '') + '!</div><div style="font-size:22px;color:var(--gold)">Chips: ' + n + ' / ' + CHIP_ROOMS.length + ' · Monedas: ' + G.coins + '</div><div style="color:#9fb4ff">El capítulo 2 llegará muy pronto…</div><button class="btn gold" id="finOk">¡GENIAL!</button></div>'; m.classList.add('on'); $('finOk').onclick = () => m.classList.remove('on'); speak('¡Capítulo uno completado! El capítulo dos llegará muy pronto.'); }, 600);
}

/* ---------- diálogos: narrador arriba con voz, personajes con bocadillo de cómic que se escribe ---------- */
const NAMES = { lucas: 'LUCAS', bolita: 'BOLITA', chef: 'CHEF TUERCAS', capi: 'CAPITANA ESTRELLA', chispa: 'CHISPA' };
let DQ = [], DCB = null, DCUR = null;
function say(lines, cb) { if (DCUR) { DQ.push(...lines); if (cb) { const prev = DCB; DCB = () => { prev && prev(); cb(); }; } return; } DQ = lines.slice(); DCB = cb || null; nextLine(); }
const busy = () => !!DCUR;
function nextLine() {
  hideTalk(); for (const k in CH) CH[k].talk = 0;
  if (!DQ.length) { DCUR = null; const cb = DCB; DCB = null; if (cb) cb(); return; }
  const [who, text] = DQ.shift(); DCUR = { who, text, i: 0, done: false, t0: time, spoke: false };
  if (who === 'narr') { $('narr').classList.add('on'); $('narrT').textContent = ''; speak(text, 1.0, 0.9, () => { if (DCUR && DCUR.text === text) DCUR.spoke = true; }); }
  else { $('bubN').textContent = NAMES[who] || ''; $('bubT').textContent = ''; $('bub').classList.add('on'); if (CH[who]) CH[who].talk = 1; if (who === 'lucas') L.talk = 1; placeBubble(); DCUR.spoke = true; }
}
function hideTalk() { $('narr').classList.remove('on'); $('bub').classList.remove('on'); L.talk = 0; }
function typeTick() {
  if (!DCUR || DCUR.done) return; const sp = DCUR.who === 'narr' ? 26 : 22, n = Math.min(DCUR.text.length, Math.floor((time - DCUR.t0) * sp));
  if (n > DCUR.i) { DCUR.i = n; const s = DCUR.text.slice(0, n); if (DCUR.who === 'narr') $('narrT').textContent = s; else { $('bubT').textContent = s; placeBubble(); if (n % 2) SFX.blip(); } }
  if (n >= DCUR.text.length) { DCUR.done = true; DCUR.tEnd = time; if (CH[DCUR.who]) CH[DCUR.who].talk = 0; L.talk = 0; }
}
function placeBubble() {
  if (!DCUR || DCUR.who === 'narr') return; const b = $('bub'), c = CH[DCUR.who], x = (DCUR.who === 'lucas' || !c ? L.x : c.x) - camX, top = DCUR.who === 'lucas' || !c ? L.y - LUCAS_H - 10 : c.top - 10;
  const w = b.offsetWidth, h = b.offsetHeight, left = Math.max(12, Math.min(VW - w - 12, x - w / 2)); b.style.left = left + 'px'; b.style.top = Math.max(84, top - h - 20) + 'px'; b.style.setProperty('--tx', Math.max(30, Math.min(w - 30, x - left)) + 'px');
}
function advance() {
  if (!DCUR) return; if (!DCUR.done) { DCUR.t0 = -999; typeTick(); return; }
  if (DCUR.who === 'narr' && !DCUR.spoke && time - DCUR.tEnd < 0.4) return; shutUp(); SFX.click(); nextLine();
}
$('narrS').onpointerdown = e => { e.stopPropagation(); if (DCUR) speak(DCUR.text); };
$('bubS').onpointerdown = e => { e.stopPropagation(); if (DCUR) speak(DCUR.text, DCUR.who === 'lucas' ? 1.5 : DCUR.who === 'chef' ? 0.8 : 1.2, 1); };
$('narr').onpointerdown = e => { e.stopPropagation(); advance(); };
$('bub').onpointerdown = e => { e.stopPropagation(); advance(); };

/* ---------- entrar en sitios: Lucas se mete por la puerta, la cámara se zambulle dentro con desenfoque y aparece la sala nueva ---------- */
let FX = {}, TR = null, SCENE = null;
function enterRoom(id, x, y) {
  R = ROOMS[id]; G.room = id; G.x = x; L.x = x; L.y = y != null ? y : R.floor; L.vy = 0; L.auto = null; L.then = null; L.enter = 0; FX = {};
  camX = Math.max(0, Math.min(R.W - VW, L.x - VW / 2));
  for (const k in DOORS) DOORS[k].o = DOORS[k].to = 0; for (const h of R.hot) if (h.door && Math.abs(h.x - x) < 200) { const d = door(h.door.id); d.o = 1; d.to = 1; }
  save(); evt('sala', id); if (R.enter) setTimeout(() => { if (R && R.id === id) R.enter(); }, 700);
}
function enterDoor(h) {
  if (TR || SCENE) return; const D = h.door;
  L.auto = h.x; L.then = () => { L.face = 1; door(D.id).to = 1; L.enter = 0.001; SFX.door();
    setTimeout(() => { SFX.warp(); TR = { ph: 'out', t: 0, cx: h.x - camX, cy: R.floor - 160, D }; }, 380); };
}
function enterVent(h) { if (TR || SCENE) return; L.enter = 0.001; SFX.door(); setTimeout(() => { SFX.warp(); TR = { ph: 'out', t: 0, cx: h.x - camX, cy: 180, D: { to: '__conducto' } }; }, 380); }
function trMid() {
  const D = TR.D;
  if (D.to === '__subir' || D.to === '__bajar') { SCENE = { k: 'elev', t: 0, up: D.to === '__subir', dur: 2.6, then: D.to === '__subir' ? ['puente', 300] : ['pasillo', 3000] }; TR = null; return; }
  if (D.to === '__conducto') { SCENE = { k: 'vent', t: 0, dur: 3, then: ['puente', 1880, 100] }; TR = null; return; }
  enterRoom(D.to, D.tx); TR = { ph: 'in', t: 0 }; SFX.warpIn();
}
function sceneEnd() { const [to, x, y] = SCENE.then; SCENE = null; enterRoom(to, x, y); TR = { ph: 'in', t: 0 }; SFX.warpIn(); }

/* ---------- controles: flechas, saltar, mano de acción, y tocar la pantalla ---------- */
function near(h) { if (h.vis && !h.vis()) return false; const top = h.y != null ? h.y : R.floor - h.h, bot = h.y != null ? h.y + h.h : R.floor; return Math.abs(L.x - h.x) < h.w / 2 + 40 && L.y >= top - 20 && L.y <= bot + 34; }
function nearest() { let b = null, bd = 1e9; for (const h of R.hot) { if (!h.act && !h.door) continue; if (!near(h)) continue; const d = Math.abs(L.x - h.x); if (d < bd) { bd = d; b = h; } } return b; }
function act(h) { if (!h || TR || SCENE) return; SFX.click(); L.face = h.x >= L.x ? 1 : -1; if (h.door && !(h.door.locked && h.door.locked())) return enterDoor(h); if (h.act) h.act(); }
function doJump() { if (L.ground) { L.vy = -jumpV(); L.ground = false; SFX.jump(); } else jumpBuf = 0.15; }
function hotAt(wx, wy) { for (let i = R.hot.length - 1; i >= 0; i--) { const h = R.hot[i]; if (h.vis && !h.vis()) continue; if (!h.act && !h.door) continue; const top = h.y != null ? h.y : R.floor - h.h, bot = h.y != null ? h.y + h.h : R.floor + 30; if (wx > h.x - h.w / 2 && wx < h.x + h.w / 2 && wy > top && wy < bot) return h; } return null; }
function tapWorld(sx, sy) {
  if (TR || SCENE || L.enter) return; if (busy()) { advance(); return; }
  const wx = sx + camX, wy = sy, h = hotAt(wx, wy);
  if (h && canSee(h.x)) { if (near(h)) return act(h); L.auto = h.x; L.then = () => { if (near(h)) act(h); else say([['lucas', '¡Está muy alto! Tengo que saltar.']]); }; return; }
  for (const p of plats()) if (Math.abs(wy - p[1]) < 50 && Math.abs(wx - p[0]) < p[2] / 2 && p[1] < L.y - 20) { L.auto = Math.max(p[0] - p[2] / 2 + 30, Math.min(p[0] + p[2] / 2 - 30, wx)); L.then = doJump; return; }
  if (wy < L.y - LUCAS_H && Math.abs(wx - L.x) < 120) return doJump();
  L.auto = Math.max(70, Math.min(R.W - 70, wx)); L.then = null;
}
const canSee = x => !R.dark || F('energia') || (has('linterna') && Math.abs(x - L.x) < 520) || x < 440;
cv.addEventListener('pointerdown', e => { if (!R || state !== 'play') return; audio(); const r = cv.getBoundingClientRect(); tapWorld((e.clientX - r.left) / SC, (e.clientY - r.top) / SC); });
const KMAP = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
addEventListener('keydown', e => {
  if (state !== 'play' || $('con').classList.contains('on') || $('modal').classList.contains('on')) return; audio();
  if (KMAP[e.key]) { KEY[KMAP[e.key]] = 1; L.auto = null; L.then = null; e.preventDefault(); return; }
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); if (busy()) return advance(); return doJump(); }
  if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); if (busy()) return advance(); act(nearest()); }
});
addEventListener('keyup', e => { if (KMAP[e.key]) KEY[KMAP[e.key]] = 0; });
function holdBtn(id, k) { const b = $(id); const on = e => { e.preventDefault(); e.stopPropagation(); audio(); if (busy()) { advance(); return; } KEY[k] = 1; L.auto = null; L.then = null; b.classList.add('on'); }, off = () => { KEY[k] = 0; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); }
holdBtn('bL', 'l'); holdBtn('bR', 'r');
$('bJ').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audio(); if (busy()) return advance(); doJump(); $('bJ').classList.add('on'); setTimeout(() => $('bJ').classList.remove('on'), 120); });
$('bAct').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audio(); if (busy()) return advance(); act(nearest()); });

/* ---------- bucle ---------- */
let last = performance.now(), state = 'title', darkSaid = 0;
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt; if (state === 'play' && R) update(dt); render(); requestAnimationFrame(loop); }
function update(dt) {
  animDoors(dt); typeTick();
  if (DCUR && DCUR.who !== 'narr') placeBubble();
  for (const k in FX) if (typeof FX[k] === 'number') FX[k] = Math.max(0, FX[k] - dt);
  if (FX.pop) { FX.pop = FX.pop.filter(p => (p.t -= dt) > 0); }
  if (SCENE) { SCENE.t += dt; if (SCENE.k === 'elev' && Math.random() < 0.1) tone(150, 160, 0.1, 'sine', 0.01); if (SCENE.t >= SCENE.dur) sceneEnd(); return; }
  if (TR) { TR.t += dt; if (TR.ph === 'out' && TR.t >= 0.75) trMid(); else if (TR && TR.ph === 'in' && TR.t >= 0.7) TR = null; if (TR && TR.ph === 'out') return; }
  if (L.enter) { L.enter = Math.min(1, L.enter + dt * 2.6); return; }
  // andar
  let dir = 0; const frozen = busy() || $('modal').classList.contains('on');
  if (!frozen) { dir = KEY.r - KEY.l; if (!dir && L.auto != null) { const d = L.auto - L.x; if (Math.abs(d) > 8) dir = Math.sign(d); else { L.auto = null; const f = L.then; L.then = null; if (f) f(); } } }
  if (dir) L.face = dir;
  let nx = L.x + dir * SPEED * dt; nx = Math.max(60, Math.min(R.W - 60, nx));
  if (R.dark && !F('energia') && !has('linterna') && nx > 440) { nx = 440; L.auto = null; if (time - darkSaid > 6 && !busy()) { darkSaid = time; say([['lucas', '¡Está muy oscuro! No veo nada.']]); } }
  L.x = nx; if (dir && L.ground) { L.walk = (L.walk || 0) + dt; if (Math.floor(L.walk * 4) !== Math.floor((L.walk - dt) * 4)) tone(90, 60, 0.05, 'sine', 0.02); }
  // saltar y caer sobre las plataformas (se atraviesan desde abajo)
  jumpBuf = Math.max(0, jumpBuf - dt);
  const wasG = L.ground; L.vy += GRAV * dt; let ny = L.y + L.vy * dt; L.ground = false;
  if (L.vy >= 0) { let best = null; for (const p of plats()) if (Math.abs(L.x - p[0]) <= p[2] / 2 + 6 && L.y <= p[1] + 2 && ny >= p[1] && (best === null || p[1] < best)) best = p[1];
    if (ny >= R.floor && (best === null || R.floor < best)) best = R.floor; if (best !== null) { ny = best; if (!wasG && L.vy > 500) { SFX.land(); L.land = 0.15; } L.vy = 0; L.ground = true; } }
  L.y = ny; if (L.ground && jumpBuf > 0 && !frozen) { jumpBuf = 0; doJump(); }
  L.cheer = Math.max(0, L.cheer - dt); L.land = Math.max(0, L.land - dt);
  // monedas y chips: se cogen al tocarlos
  const cx = L.x, cy = L.y - LUCAS_H * 0.5;
  R.coins.forEach((c, i) => { const k = R.id + i; if (G.got[k] || !canSee(c[0])) return; if (Math.abs(c[0] - cx) < 60 && Math.abs(c[1] - cy) < LUCAS_H * 0.6) { G.got[k] = 1; G.coins++; paintCoins(); SFX.coin(); (FX.pop = FX.pop || []).push({ x: c[0], y: c[1], t: 0.8, s: '+1' }); save(); } });
  if (R.chip && !G.chips[R.id] && canSee(R.chip[0]) && Math.abs(R.chip[0] - cx) < 60 && Math.abs(R.chip[1] - cy) < LUCAS_H * 0.6) { G.chips[R.id] = 1; paintCoins(); SFX.chip(); (FX.pop = FX.pop || []).push({ x: R.chip[0], y: R.chip[1], t: 1.2, s: '¡CHIP!' }); save(); }
  // puertas que se abren solas al acercarse
  for (const h of R.hot) if (h.door) { const D = h.door, d = door(D.id), lk = D.locked && D.locked(); if (!lk && D.to.indexOf('__') !== 0) d.to = Math.abs(L.x - h.x) < 260 && L.y > R.floor - 200 ? 1 : 0; else if (lk) d.to = 0; }
  // mano de acción
  const nh = busy() ? null : nearest(), ba = $('bAct'); ba.classList.toggle('show', !!nh); if (nh) ba.textContent = nh.ic || '✋';
  camX += (Math.max(0, Math.min(R.W - VW, L.x - VW / 2 + L.face * 80)) - camX) * Math.min(1, dt * 4);
  G.x = L.x;
}

/* ---------- pintar ---------- */
function drawWorld() {
  for (const ly of ['lejos', 'pared']) { const im = opt(R.id + '-' + ly); if (im) { if (ly === 'lejos') { const w = Math.max(VW + 300, VH * im.naturalWidth / im.naturalHeight); ctx.drawImage(im, -camX / Math.max(1, R.W - VW) * (w - VW), 0, w, VH); } else ctx.drawImage(im, -camX, 0, R.W, R.floor + 40); } else R.paint(ly); }
  { const im = opt(R.id + '-suelo'); if (im) ctx.drawImage(im, -camX, R.floor - 30, R.W, VH - R.floor + 30); else R.paint('suelo'); }
  plats().forEach(drawPlat);
  for (const h of R.hot) if (h.draw && (!h.vis || h.vis()) && !h.ch) h.draw();
  R.coins.forEach((c, i) => { if (!G.got[R.id + i]) drawCoin(c[0], c[1], i); });
  if (R.chip) drawChip(R.id, R.chip[0], R.chip[1]);
  for (const h of R.hot) if (h.draw && h.ch && (!h.vis || h.vis())) h.draw();
  drawLucas();
  { const im = opt(R.id + '-delante'); if (im) ctx.drawImage(im, -camX * 1.3, 0, R.W * 1.3, VH); else R.paint('delante'); }
  if (R.dark && !F('energia')) drawDark();
  if (FX.flash) { ctx.fillStyle = 'rgba(200,255,220,' + Math.min(0.8, FX.flash / 1.5) + ')'; ctx.fillRect(0, 0, VW, VH); }
  if (FX.pop) for (const p of FX.pop) { ctx.font = '900 30px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,220,80,' + Math.min(1, p.t * 2) + ')'; ctx.fillText(p.s, p.x - camX, p.y - 40 - (1.2 - p.t) * 50); }
}
function render() {
  ctx.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0); ctx.clearRect(0, 0, VW, VH);
  if (state !== 'play' || !R) { space(0.05, 230); return; }
  if (SCENE) return SCENE.k === 'elev' ? drawElevator() : drawVent();
  ctx.save(); const sh = (FX.shake || 0) * 10; if (sh) ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
  let k = 0, cx = VW / 2, cy = VH / 2;
  if (TR) { if (TR.ph === 'out') { k = Math.min(1, TR.t / 0.75); k = k * k; cx = TR.cx; cy = TR.cy; const s = 1 + k * 2.6; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
    else { k = 1 - Math.min(1, TR.t / 0.7); k = k * k; cx = L.x - camX; cy = L.y - 120; const s = 1 + k * 0.4; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
  }
  drawWorld(); ctx.restore();
  if (TR && k > 0.03) softBlur(k);
  if (TR && k > 0) warpFx(k, TR.ph === 'out' ? TR.cx : VW / 2, TR.ph === 'out' ? TR.cy : VH / 2);
}
// desenfoque barato (sirve en móviles sencillos): se encoge la imagen y se vuelve a estirar por encima
const BL1 = document.createElement('canvas'), BL2 = document.createElement('canvas'); BL1.width = 256; BL1.height = 144; BL2.width = 64; BL2.height = 36;
function softBlur(k) {
  const a = BL1.getContext('2d'), b = BL2.getContext('2d'); a.imageSmoothingQuality = b.imageSmoothingQuality = 'low';
  a.drawImage(cv, 0, 0, 256, 144); b.drawImage(BL1, 0, 0, 64, 36);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = Math.min(1, k * 1.6); ctx.drawImage(BL1, 0, 0, cv.width, cv.height); ctx.globalAlpha = Math.min(1, k * 1.2); ctx.drawImage(BL2, 0, 0, cv.width, cv.height); ctx.restore();
}
// destello con rayos de luz que salen del centro (efecto de "zambullirse" en la sala)
function warpFx(k, cx, cy) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) { const a = i * 2.39996 + time * 0.3, r0 = 40 + (i * 37 % 120), r1 = r0 + 200 + k * 900; ctx.strokeStyle = 'rgba(' + (i % 3 ? '160,240,255' : '255,220,140') + ',' + (0.55 * k) + ')'; ctx.lineWidth = 2 + (i % 4); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900); g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * k) + ')'); g.addColorStop(0.35, 'rgba(180,240,255,' + (0.6 * k) + ')'); g.addColorStop(1, 'rgba(10,20,60,' + (0.85 * k) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  ctx.restore();
}
function drawLucas() {
  const back = (SHOPPING || (DCUR && DCUR.who === 'chispa')) && opt('lucas-espaldas');
  const air = !L.ground, moving = (KEY.l || KEY.r || L.auto != null) && !busy(), name = L.cheer > 0 ? 'lucas-celebrando' : air ? 'lucas-saltando' : moving ? 'lucas-avanzando' : 'lucas-quieto';
  let im = back || IMG[name]; if (!ok(im)) im = IMG['lucas-quieto'];
  const sx = L.x - camX, y = L.y + 4, bob = air ? 0 : Math.sin(time * (moving ? 9 : 2.5)) * (moving ? 4 : 3), en = L.enter || 0;
  if (!air) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(sx, y, 64, 12, 0, 0, 7); ctx.fill(); }
  if (F('botas') && air) { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) glow(sx + (Math.random() - 0.5) * 50, y - 10 + Math.random() * 40, 16, 'rgba(120,255,140,A)', 0.6); ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalCompositeOperation = 'lighter'; for (const s of [-1, 1]) { const fx = sx + s * 26, fl = 18 + Math.random() * 10 + (moving ? 8 : 0) + (air && L.vy < 0 ? 30 : 0); const g = ctx.createLinearGradient(0, y - 22, 0, y - 22 + fl); g.addColorStop(0, 'rgba(120,255,220,.9)'); g.addColorStop(1, 'rgba(41,160,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - 9, y - 22); ctx.lineTo(fx + 9, y - 22); ctx.lineTo(fx, y - 22 + fl); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  if (!ok(im)) return; const sq = L.land > 0 ? 1 - L.land * 0.6 : 1, h = LUCAS_H * (L.talk ? 1 + Math.abs(Math.sin(time * 16)) * 0.012 : 1) * sq * (1 - en * 0.25), w = h * im.naturalWidth / im.naturalHeight / sq;
  ctx.save(); ctx.globalAlpha = 1 - en * 0.9; ctx.translate(sx, y - 18 + bob - en * 30); if (L.face < 0) ctx.scale(-1, 1); ctx.drawImage(im, -w * (name === 'lucas-avanzando' ? 0.47 : 0.5), -h, w, h);
  if (F('gorro')) { const hy = -h + 4; ctx.fillStyle = '#ff3a6a'; ctx.beginPath(); ctx.arc(0, hy + 6, 30, Math.PI, 0); ctx.fill(); stroke('#0a0e22', 3); ctx.fillStyle = '#ffd23c'; ctx.fillRect(-36, hy + 2, 72, 8); ctx.fillRect(-2, hy - 34, 4, 14); const pw = Math.cos(time * 20) * 34; ctx.fillStyle = '#29e6ff'; ctx.fillRect(-Math.abs(pw), hy - 38, Math.abs(pw) * 2, 6); }
  ctx.restore();
}
const DK = document.createElement('canvas'); DK.width = 640; DK.height = 360;
function drawDark() {          // oscuridad con agujeros de luz: la linterna de Lucas y la luz que entra por la puerta
  const d = DK.getContext('2d'), sx = (L.x - camX) / 2, y = (L.y - 110) / 2;
  d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, 640, 360); d.fillStyle = 'rgba(0,0,6,.97)'; d.fillRect(0, 0, 640, 360); d.globalCompositeOperation = 'destination-out';
  const hole = (x, yy, r) => { const g = d.createRadialGradient(x, yy, r * 0.45, x, yy, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.fillRect(x - r, yy - r, r * 2, r * 2); };
  if (has('linterna')) hole(sx + L.face * 30, y, 230); hole((300 - camX) / 2, 180, 150);
  ctx.drawImage(DK, 0, 0, VW, VH);
}
function drawElevator() {
  const t = SCENE.t, up = SCENE.up; ctx.fillStyle = '#0a0e22'; ctx.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 12; i++) { const y = ((i * 90 + (up ? t : -t) * 600) % 1080 + 1080) % 1080 - 180; ctx.fillStyle = '#1a2450'; ctx.fillRect(0, y, VW, 30); ctx.fillStyle = 'rgba(41,230,255,.4)'; ctx.fillRect(0, y + 30, VW, 3); }
  ctx.fillStyle = lg(0, 150, 0, 650, ['#3a4a7a', '#1a2450']); rr(340, 120, 600, 520, 30); ctx.fill(); stroke('#29e6ff', 6);
  const im = IMG['lucas-quieto']; if (ok(im)) { const h = 300, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, 640 - w / 2, 600 - h + Math.sin(t * 10) * 3, w, h); }
  ctx.font = '900 60px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = '#35ff8a'; ctx.fillText(up ? '▲' : '▼', 640, 200);
  const k = Math.max(0, 1 - t * 2); if (k > 0) { ctx.fillStyle = 'rgba(255,255,255,' + k + ')'; ctx.fillRect(0, 0, VW, VH); }
}
function drawVent() {          // Lucas avanza a gatas por el conducto de aire
  const t = SCENE.t; ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = lg(0, 200, 0, 520, ['#5a6aa0', '#2a3460', '#141a3a']); ctx.fillRect(0, 200, VW, 320); ctx.strokeStyle = '#0a0e22'; ctx.lineWidth = 6;
  for (let i = 0; i < 10; i++) { const x = ((i * 180 - t * 400) % 1800 + 1800) % 1800 - 200; ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x, 520); ctx.stroke(); ctx.fillStyle = '#0a0e22'; ctx.beginPath(); ctx.arc(x + 20, 220, 5, 0, 7); ctx.arc(x + 20, 500, 5, 0, 7); ctx.fill(); }
  for (let i = 0; i < 20; i++) { ctx.fillStyle = 'rgba(200,220,255,.4)'; const x = ((i * 97 - t * 900) % 1400 + 1400) % 1400 - 60; ctx.fillRect(x, 260 + (i * 53) % 220, 30, 2); }
  const im = IMG['lucas-avanzando']; if (ok(im)) { const h = 200, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, 560 - w / 2, 510 - h + Math.abs(Math.sin(t * 8)) * -8, w, h); }
  ctx.font = '800 30px "Baloo 2"'; ctx.textAlign = 'center'; ctx.fillStyle = '#9ff0ff'; ctx.fillText('¡Lucas va por el conducto de aire!', 640, 140);
  const k = Math.max(0, 1 - t * 2); if (k > 0) { ctx.fillStyle = 'rgba(255,255,255,' + k + ')'; ctx.fillRect(0, 0, VW, VH); }
}

function go(id, x) { enterRoom(id, x); TR = { ph: 'in', t: 0 }; }
/* ---------- servidor ---------- */
function api(d) { if (API === 'PENDIENTE') return Promise.resolve({ ok: false, error: 'Servidor no listo' }); return fetch(API, { method: 'POST', body: JSON.stringify(d) }).then(r => r.json()).catch(() => ({ ok: false, error: 'Sin conexión. Inténtalo otra vez.' })); }
function evt(e, f) { try { api({ a: 'evt', e, f }); } catch (x) {} }
try { const k = 'ln_vis_' + new Date().toISOString().slice(0, 10); if (!localStorage.getItem(k)) { localStorage.setItem(k, '1'); setTimeout(() => evt('visita'), 3000); } } catch (e) {}
let ACC = null; try { ACC = JSON.parse(localStorage.getItem('ln_acc') || 'null'); } catch (e) {}
let cloudT = 0;
function cloudSave() { if (!ACC) return; clearTimeout(cloudT); cloudT = setTimeout(() => api({ a: 'guardar', ses: ACC.ses, progreso: G }), 2500); }

/* ---------- portada, cuenta y menús ---------- */
function show(id, on) { $(id).classList.toggle('on', on); }
function paintTitle() {
  const s = load(), b = $('tBtns'); b.innerHTML = '';
  const bt = (t, cls, fn) => { const x = document.createElement('button'); x.className = 'btn ' + cls; x.innerHTML = t; x.onclick = () => { audio(); fn(); }; b.appendChild(x); };
  if (s && (s.room !== 'camarote' || Object.keys(s.flags).length)) { bt('▶ CONTINUAR', 'green', () => startGame(s)); bt('NUEVA PARTIDA', '', () => askNew()); }
  else bt('▶ JUGAR', 'green', () => accFirst(() => startGame(null)));
  $('acc').innerHTML = ACC ? '👤 ' + esc(ACC.nombre || ACC.email) + ' <button class="btn sm" id="accOut">SALIR</button>' : '<button class="btn sm" id="accIn">👤 ENTRAR</button>';
  if ($('accOut')) $('accOut').onclick = () => { api({ a: 'salir', ses: ACC.ses }); ACC = null; try { localStorage.removeItem('ln_acc'); } catch (e) {} paintTitle(); };
  if ($('accIn')) $('accIn').onclick = () => accOpen();
}
function askNew() { const m = $('modal'); m.innerHTML = '<div class="card"><h2>¿NUEVA PARTIDA?</h2><div style="font-size:20px">Se empezará la aventura desde el principio.</div><div class="row" style="display:flex;gap:10px"><button class="btn green" id="nYes">SÍ, EMPEZAR</button><button class="btn" id="nNo">NO</button></div></div>'; m.classList.add('on'); $('nNo').onclick = () => m.classList.remove('on'); $('nYes').onclick = () => { m.classList.remove('on'); try { localStorage.removeItem('ln_save'); } catch (e) {} startGame(null); }; }
function accFirst(cb) { if (ACC || localStorage.getItem('ln_anon')) return cb(); accOpen(cb, true); }
let gsiOk = false;
function gsiLoad(cb) { if (window.google && google.accounts) return cb(); if (gsiOk) return setTimeout(() => gsiLoad(cb), 300); gsiOk = true; const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.onload = cb; document.head.appendChild(sc); }
function accOpen(cb, first) {
  const m = $('modal'); m.classList.add('on');
  m.innerHTML = '<div class="card"><h2>¿CÓMO QUIERES JUGAR?</h2>' + (first ? '<button class="btn green" id="aAnon">🚀 JUGAR SIN CUENTA</button><div style="color:#9fb4ff;font-size:15px">Sin cuenta, la partida solo se guarda en este aparato.</div>' : '') +
    '<div id="gBtn" style="min-height:44px"></div><div style="color:#9fb4ff">o con tu correo:</div><input id="aMail" type="email" placeholder="correo" autocomplete="email"><input id="aPass" type="password" placeholder="contraseña" autocomplete="current-password"><input id="aName" placeholder="nombre del jugador" style="display:none"><div class="msg" id="aMsg"></div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn" id="aGo">ENTRAR</button><button class="btn" id="aReg">CREAR CUENTA</button><button class="btn sm" id="aX">CERRAR</button></div><a id="aForgot">He olvidado mi contraseña</a></div>';
  const msg = t => $('aMsg').textContent = t, done = r => { ACC = { ses: r.ses, email: r.email, nombre: r.nombre }; try { localStorage.setItem('ln_acc', JSON.stringify(ACC)); } catch (e) {} if (r.progreso && r.progreso.v === 2) { const l2 = load(); if (!l2 || Object.keys(r.progreso.flags || {}).length >= Object.keys(l2.flags || {}).length) try { localStorage.setItem('ln_save', JSON.stringify(r.progreso)); } catch (e) {} } m.classList.remove('on'); paintTitle(); SFX.win(); if (cb) cb(); };
  if ($('aAnon')) $('aAnon').onclick = () => { try { localStorage.setItem('ln_anon', '1'); } catch (e) {} m.classList.remove('on'); cb && cb(); };
  $('aX').onclick = () => m.classList.remove('on');
  let reg = false; $('aReg').onclick = async () => { if (!reg) { reg = true; $('aName').style.display = ''; $('aPass').autocomplete = 'new-password'; msg('Escribe tu nombre y pulsa otra vez CREAR CUENTA'); return; } msg('Creando…'); const r = await api({ a: 'registro', email: $('aMail').value, pass: $('aPass').value, nombre: $('aName').value }); r.ok ? done(r) : msg(r.error); };
  $('aGo').onclick = async () => { msg('Entrando…'); const r = await api({ a: 'entrar', email: $('aMail').value, pass: $('aPass').value }); r.ok ? done(r) : msg(r.error); };
  $('aForgot').onclick = async () => { if (!$('aMail').value) return msg('Escribe tu correo primero'); const r = await api({ a: 'recuperar', email: $('aMail').value }); if (!r.ok) return msg(r.error); const c = prompt('Te hemos enviado un código al correo. Escríbelo:'); if (!c) return; const p = prompt('Escribe tu nueva contraseña:'); if (!p) return; const r2 = await api({ a: 'restablecer', email: $('aMail').value, codigo: c, pass: p }); r2.ok ? done(r2) : msg(r2.error); };
  gsiLoad(() => { try { google.accounts.id.initialize({ client_id: GOOGLE_ID, ux_mode: 'popup', callback: async r => { msg('Comprobando tu cuenta de Google…'); const x = await api({ a: 'google', credential: r.credential }); x.ok ? done(x) : msg(x.error); } }); google.accounts.id.renderButton($('gBtn'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 300 }); } catch (e) {} });
}
function startGame(s) {
  G = s || NEW(); if (!s) evt('partida'); state = 'play'; show('title', false); $('hud').style.display = 'flex'; $('inv').style.display = 'flex'; $('ctl').style.display = 'block'; paintInv(); paintCoins();
  startMusic(); goFull(); enterRoom(G.room, G.x || 520); TR = { ph: 'in', t: 0 };
}
function goFull() { try { if (matchMedia('(pointer:coarse)').matches && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().then(() => { try { screen.orientation.lock('landscape'); } catch (e) {} }).catch(() => {}); } catch (e) {} }
$('bHint').onpointerdown = e => { e.stopPropagation(); audio(); if (busy()) return; hint(); };
$('bMenu').onpointerdown = e => { e.stopPropagation(); audio(); openMenu(); };
function openMenu() {
  shutUp(); const m = $('modal'); m.classList.add('on');
  const draw = () => { m.innerHTML = '<div class="card"><h2>MENÚ</h2><button class="btn green" id="mGo">▶ SEGUIR JUGANDO</button><button class="btn" id="mVoz">🗣️ NARRADOR: ' + (VOZ_ON ? 'SÍ' : 'NO') + '</button><button class="btn" id="mSnd">🔊 SONIDOS: ' + (sndOn ? 'SÍ' : 'NO') + '</button><button class="btn" id="mMus">🎵 MÚSICA: ' + (musOn ? 'SÍ' : 'NO') + '</button><button class="btn" id="mOut">🏠 SALIR A LA PORTADA</button></div>';
    $('mGo').onclick = () => m.classList.remove('on'); $('mVoz').onclick = () => { VOZ_ON = !VOZ_ON; saveOpt(); draw(); }; $('mSnd').onclick = () => { sndOn = !sndOn; saveOpt(); draw(); }; $('mMus').onclick = () => { musOn = !musOn; saveOpt(); draw(); };
    $('mOut').onclick = () => { m.classList.remove('on'); state = 'title'; DQ = []; DCUR = null; hideTalk(); $('hud').style.display = 'none'; $('inv').style.display = 'none'; $('ctl').style.display = 'none'; paintTitle(); show('title', true); }; };
  draw();
}
// instalar como app y compartir (WhatsApp saca la tarjeta con la imagen)
let instEv = null; addEventListener('beforeinstallprompt', e => { e.preventDefault(); instEv = e; $('bInstall').style.display = ''; });
const IOS = /iphone|ipad|ipod/i.test(navigator.userAgent); if (IOS && !navigator.standalone) $('bInstall').style.display = '';
$('bInstall').onclick = () => { if (instEv) { instEv.prompt(); instEv = null; } else { const m = $('modal'); m.innerHTML = '<div class="card"><h2>INSTALAR EN IPHONE</h2><div style="font-size:20px">1. Pulsa el botón compartir ⬆️ de Safari.<br>2. Elige «Añadir a pantalla de inicio».<br>3. ¡Listo! Lucas te espera en tu pantalla.</div><button class="btn" id="iOk">VALE</button></div>'; m.classList.add('on'); $('iOk').onclick = () => m.classList.remove('on'); } };
$('bShare').onclick = () => { const url = 'https://puntofibra.github.io/lucasnave/', t = '🚀 ¡Juega a LUCAS Y LA NAVE PERDIDA! Una aventura espacial para peques: ' + url; if (navigator.share) navigator.share({ title: 'LUCAS Y LA NAVE PERDIDA', text: t }).catch(() => {}); else window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank'); };
$('bWeb').onclick = () => { location.href = 'https://puntofibra.github.io/web/'; };

/* ---------- consola secreta: escribir CONSOLA en cualquier sitio o 10 toques rápidos sobre el título ---------- */
let conWord = '', logoTaps = [];
addEventListener('keydown', e => { if ($('con').classList.contains('on') || !e.key || e.key.length !== 1) return; conWord = (conWord + e.key.toUpperCase()).slice(-7); if (conWord === 'CONSOLA') { conWord = ''; openConsole(); } });
$('logo').addEventListener('pointerdown', () => { const n = performance.now(); logoTaps = logoTaps.filter(t => n - t < 3000); logoTaps.push(n); if (logoTaps.length >= 10) { logoTaps = []; openConsole(); } });
function say2(t, cls = '') { const d = document.createElement('div'); d.className = cls; d.textContent = t; $('conOut').appendChild(d); $('conOut').scrollTop = 1e9; }
function openConsole() { $('con').classList.add('on'); $('conOut').innerHTML = ''; say2('LUCAS-OS v' + VERSION + ' · TERMINAL DE LA NAVE ESTRELLA AZUL', 'g big'); say2('_'); setTimeout(() => $('conIn').focus(), 100); }
function closeConsole() { $('con').classList.remove('on'); nfcStop(); }
$('conX').onclick = closeConsole;
$('conIn').addEventListener('keydown', e => { if (e.key !== 'Enter') return; const c = $('conIn').value.trim().toUpperCase(); $('conIn').value = ''; if (!c) return; say2('> ' + c, 'y'); conRun(c); });
function conRun(c) {
  const [cmd, arg] = c.split(/\s+/);
  if (cmd === 'ADMIN') return conAdmin();
  if (cmd === 'SALIR' || cmd === 'EXIT') return closeConsole();
  if (cmd === 'CLS') { $('conOut').innerHTML = ''; return; }
  if (cmd === 'SALA') { const id = (arg || '').toLowerCase(); if (!ROOMS[id]) return say2('SALAS: ' + Object.keys(ROOMS).join(', '), 'r'); closeConsole(); if (state !== 'play') startGame(load() || null); setTimeout(() => go(id, 300), 600); return; }
  if (cmd === 'TODO') { Object.keys(ITEMS).forEach(i => { if (!has(i)) G.inv.push(i); }); G.coins += 50; paintCoins(); paintInv(); save(); return say2('TODOS LOS OBJETOS EN LA MOCHILA ✔', 'g'); }
  if (cmd === 'LUZ') { setF('energia', !F('energia')); return say2('ENERGÍA: ' + (F('energia') ? 'SÍ' : 'NO'), 'g'); }
  if (cmd === 'RESET') { try { localStorage.removeItem('ln_save'); } catch (e) {} G = NEW(); return say2('PARTIDA BORRADA', 'g'); }
  say2('COMANDO DESCONOCIDO', 'r');
}
/* ---------- admin con la llave NFC (o QR desde un Android si este aparato no lee NFC) ---------- */
let ADM = null, nfcCtl = null, admQrT = 0;
const HAY_NFC = 'NDEFReader' in window;
const NFC_HTML = '<div class="nfcw"><svg viewBox="0 0 64 64" width="54" height="54"><rect x="14" y="6" width="36" height="52" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M27 24a9 9 0 0 1 0 16M33 19a16 16 0 0 1 0 26M39 14a23 23 0 0 1 0 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg><i></i><i></i></div>';
function nfcStop() { if (nfcCtl) { try { nfcCtl.abort(); } catch (e) {} nfcCtl = null; } }
async function nfcRead(onSerial, onErr) {
  nfcStop(); let b = false;
  try { nfcCtl = new AbortController(); const r = new NDEFReader(); await r.scan({ signal: nfcCtl.signal });
    r.onreading = async ev => { if (b) return; b = true; try { navigator.vibrate && navigator.vibrate(80); } catch (e) {} const s = String(ev.serialNumber || '').replace(/:/g, '').toUpperCase(); try { await onSerial(s); nfcStop(); } catch (e) { onErr(e.message || String(e)); b = false; } };
    r.onreadingerror = () => { if (!b) onErr('No pude leer la llave. Vuelve a acercarla.'); }; return true;
  } catch (e) { nfcStop(); onErr('Activa el NFC del móvil y vuelve a intentarlo.'); return false; }
}
function conAdmin() {
  say2('*** ACCESO RESTRINGIDO ***', 'r big'); say2('IDENTIFICACIÓN POR LLAVE REQUERIDA');
  const okk = r => { clearInterval(admQrT); const qb = $('conQr'); if (qb) qb.remove(); ADM = r.adm; say2(r.nueva ? 'LLAVE MAESTRA REGISTRADA ✔' : 'LLAVE RECONOCIDA ✔', 'g big'); SFX.win(); setTimeout(() => { closeConsole(); openAdmin(); }, 1500); };
  if (HAY_NFC) { const box = document.createElement('div'); box.innerHTML = NFC_HTML + '<div id="cnfc" class="y">ACERCA TU LLAVE A LA PARTE DE ATRÁS DEL MÓVIL…</div>'; $('conOut').appendChild(box);
    nfcRead(async k => { const r = await api({ a: 'llave', k }); if (!r.ok) throw new Error(r.error); okk(r); }, t => { const c = $('cnfc'); if (c) { c.textContent = '✖ ' + t.toUpperCase(); c.className = 'r'; } }); }
  else { say2('ESTE APARATO NO LEE NFC. ESCANEA EL CÓDIGO CON TU MÓVIL ANDROID Y ACERCA LA LLAVE:', 'y');
    api({ a: 'qr' }).then(r => { if (!r.ok) return say2('ERROR: ' + r.error, 'r'); const url = location.origin + location.pathname + '?admq=' + r.q, box = document.createElement('div'); box.id = 'conQr';
      try { const q = qrcode(0, 'M'); q.addData(url); q.make(); box.innerHTML = '<img src="' + q.createDataURL(8, 4) + '" alt="QR"><div>ESCANÉALO CON TU MÓVIL</div>'; } catch (e) { box.textContent = url; } $('con').appendChild(box);
      admQrT = setInterval(async () => { if (!$('con').classList.contains('on')) return clearInterval(admQrT); const s = await api({ a: 'qrEst', q: r.q }); if (s.estado === 'ok') okk(s); else if (s.estado === 'caducado') { clearInterval(admQrT); say2('EL CÓDIGO HA CADUCADO. ESCRIBE ADMIN OTRA VEZ.', 'r'); } }, 2000); }); }
}
(() => { const q = new URLSearchParams(location.search).get('admq'); if (!q) return; history.replaceState(null, '', location.pathname); const a = $('adm'); a.classList.add('on');
  a.innerHTML = '<div class="abody" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"><h1>AUTORIZAR ACCESO</h1>' + NFC_HTML + '<div class="amsg" id="amsg">' + (HAY_NFC ? 'Acerca tu llave a la parte de atrás del móvil…' : 'Este móvil no lee NFC. Usa un Android con Chrome.') + '</div></div>';
  if (HAY_NFC) nfcRead(async k => { const r = await api({ a: 'qrOk', q, k }); if (!r.ok) throw new Error(r.error); a.innerHTML = '<div class="abody" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:24px">✅<h1 style="color:#35ff8a">ACCESO CONCEDIDO</h1>Ya puedes cerrar esta pestaña.</div>'; }, t => { $('amsg').textContent = '✖ ' + t; }); })();
async function admOp(op, d) { const r = await api(Object.assign({ a: 'adm', t: ADM, op }, d || {})); if (!r.ok) { if (r.error === 'ADMIN') { ADM = null; $('adm').classList.remove('on'); } throw new Error(r.error || 'Error'); } return r; }
let admTab = 'ESTADÍSTICAS';
function openAdmin() { $('adm').classList.add('on'); admPaint(); }
function admMsg(t) { const m = $('amsg'); if (m) m.textContent = t; }
function admPaint() {
  const tabs = ['ESTADÍSTICAS', 'SALAS', 'LLAVES', 'SISTEMA'];
  $('adm').innerHTML = '<div class="ahead"><h1>▌ PANEL SECRETO · LUCAS Y LA NAVE PERDIDA</h1><button class="btn sm" id="admX">SALIR</button></div><div class="atabs">' + tabs.map(t => '<button class="btn sm' + (t === admTab ? ' on' : '') + '" data-a="' + t + '">' + t + '</button>').join('') + '</div><div class="amsg" id="amsg"></div><div class="abody" id="abody">Cargando…</div>';
  $('admX').onclick = () => { $('adm').classList.remove('on'); ADM = null; };
  $('adm').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { admTab = b.dataset.a; admPaint(); });
  const B = $('abody');
  if (admTab === 'ESTADÍSTICAS') admOp('stats').then(r => { const s = r.stats || {}, t = s.tot || {}; B.innerHTML = '<div class="akey">Jugadores con cuenta: <b>' + r.jugadores + '</b><br>Visitas: <b>' + (t.visitas || 0) + '</b> · Partidas empezadas: <b>' + (t.partidas || 0) + '</b> · Capítulo 1 terminado: <b>' + (t.fin || 0) + '</b></div><h3>Salas a las que han llegado</h3><div class="akey">' + Object.keys(ROOMS).map(k => ROOMS[k].name + ': <b>' + ((s.salas || {})[k] || 0) + '</b>').join('<br>') + '</div><h3>Visitas por día</h3><div class="akey">' + Object.keys(s.dias || {}).sort().reverse().slice(0, 14).map(d => d + ': <b>' + s.dias[d] + '</b>').join('<br>') + '</div>'; }).catch(e => admMsg(e.message));
  else if (admTab === 'SALAS') { B.innerHTML = '<div>Ir directamente a una sala (con tu partida de este aparato):</div><div class="arow">' + Object.keys(ROOMS).map(k => '<button class="btn sm" data-r="' + k + '">' + ROOMS[k].name + '</button>').join('') + '</div><div class="arow"><button class="btn sm" id="aTodo">DAR TODOS LOS OBJETOS</button><button class="btn sm" id="aLuz">ENCENDER / APAGAR ENERGÍA</button><button class="btn sm" id="aRes">BORRAR MI PARTIDA</button></div>';
    B.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { $('adm').classList.remove('on'); if (state !== 'play') startGame(load() || null); setTimeout(() => go(b.dataset.r, 300), 600); });
    $('aTodo').onclick = () => { conRun('TODO'); admMsg('✔ Objetos dados'); }; $('aLuz').onclick = () => { conRun('LUZ'); admMsg('✔ Energía: ' + (F('energia') ? 'SÍ' : 'NO')); }; $('aRes').onclick = () => { conRun('RESET'); admMsg('✔ Partida borrada'); }; }
  else if (admTab === 'LLAVES') admOp('llaves').then(r => { const paint = l => { B.innerHTML = l.map(x => '<div class="akey"><b>' + esc(x.n) + '</b><br>' + x.k.replace(/(..)/g, '$1 ') + '<div class="arow"><button class="btn sm" data-d="' + x.k + '">BORRAR</button></div></div>').join('') + '<h3>AÑADIR LLAVE</h3><div class="arow"><button class="btn sm" id="kAdd">' + (HAY_NFC ? 'LEER LLAVE NUEVA' : 'ESCRIBIR CÓDIGO') + '</button></div>';
      B.querySelectorAll('[data-d]').forEach(b => b.onclick = () => admOp('llaveDel', { k: b.dataset.d }).then(x => paint(x.llaves)).catch(e => admMsg(e.message)));
      $('kAdd').onclick = () => { if (HAY_NFC) { admMsg('Acerca la llave nueva…'); nfcRead(async k => { const x = await admOp('llaveAdd', { k, n: prompt('Nombre de la llave:') || 'Llave' }); paint(x.llaves); admMsg('✔ Llave añadida'); }, t => admMsg(t)); } else { const k = prompt('Código de la llave:'); if (k) admOp('llaveAdd', { k, n: prompt('Nombre:') || 'Llave' }).then(x => paint(x.llaves)).catch(e => admMsg(e.message)); } }; }; paint(r.llaves); }).catch(e => admMsg(e.message));
  else if (admTab === 'SISTEMA') { B.innerHTML = '<div class="akey">Versión del juego: <b style="color:#35ff8a">v' + VERSION + '</b><br>Voz del narrador: <b>' + (VOICE ? esc(VOICE.name) : 'la del navegador') + '</b><br>NFC en este aparato: <b>' + (HAY_NFC ? 'SÍ' : 'NO') + '</b></div><div class="arow"><button class="btn sm" id="aUpd">BUSCAR ACTUALIZACIÓN</button></div>'; $('aUpd').onclick = () => location.reload(); }
}

/* ---------- arranque ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
setInterval(() => { if (state !== 'play') fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(j => { if (j.v && j.v !== VERSION) location.reload(); }).catch(() => {}); }, 60000);
resize(); paintTitle(); show('title', true); requestAnimationFrame(loop);
window.__LN = { get G() { return G; }, get R() { return R; }, get L() { return L; }, get TR() { return TR; }, get SCENE() { return SCENE; }, go, say, tapWorld, get state() { return state; }, startGame, advance, busy: () => busy(), hint, F, KEY, doJump, act, nearest, enterRoom, setF, give };
})();
