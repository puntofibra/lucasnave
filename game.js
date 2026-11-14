/* LUCAS Y LA NAVE PERDIDA · aventura de Lucas para niños de 6 y 7 años: se anda y se salta como en un plataformas, pero sin malos */
(() => {
'use strict';
const VERSION = '1.6';
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
const HAVE = new Set(['pj-capi', 'pj-capi-2', 'pj-capi-dormida', 'pj-chef', 'pj-chef-2', 'pj-bolita', 'pj-bolita-2', 'pj-chispa', 'pj-chispa-2', 'pj-chispa-3', 'lucas-espaldas', 'espacio-lejos', 'pared-camarote', 'pared-pasillo', 'pared-cocina', 'pared-invernadero', 'pared-maquinas', 'pared-puente', 'pared-tienda', 'obj-estanteria', 'obj-nevera', 'obj-cocina', 'obj-grifo', 'obj-panel', 'obj-mostrador', 'obj-moneda', 'obj-cama', 'suelo-borde-nave', 'suelo-relleno-nave', 'delante-plantas', 'delante-tuberias', 'puerta-1', 'puerta-2', 'puerta-3', 'puerta-4', 'obj-ascensor-1', 'obj-ascensor-2', 'obj-ascensor-3', 'obj-rejilla', 'obj-rejilla-abierta', 'obj-taquilla', 'obj-taquilla-medio', 'obj-taquilla-abierta', 'obj-generador', 'obj-generador-tuerca', 'obj-generador-on', 'obj-planta', 'obj-planta-media', 'obj-planta-grande', 'obj-teletransportador', 'casa-tienda-nave', 'item-gorro', 'obj-cajon', 'item-tarjeta', 'item-linterna', 'item-regadera', 'item-regadera-llena', 'item-manzana', 'item-llave', 'item-escoba', 'item-fusible', 'item-martillo', 'item-botas', 'obj-manzana', 'obj-regadera', 'obj-escoba', 'plat-metal', 'plat-estante', 'plat-tubo', 'plat-hoja']);   // imágenes nuevas que ya existen (las demás se dibujan provisionales)
function opt(n) { if (!HAVE.has(n)) return null; const im = img(n); return ok(im) ? im : null; }
HAVE.forEach(n => img(n));

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
const BADV = new Set();
// voces en orden de preferencia: las de Google primero (en algunos PC con Windows las voces de Microsoft fallan y no suenan)
function voiceList() { try { const vs = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang) && !BADV.has(v.name)), sc = v => (/google/i.test(v.name) ? 0 : 10) + (/es[-_]ES/i.test(v.lang) ? 0 : 3) + (/helena|laura|elvira|monica|lucia|female|mujer/i.test(v.name) ? 0 : 1); return vs.sort((a, b) => sc(a) - sc(b)); } catch (e) { return []; } }
function pickVoice() { VOICE = voiceList()[0] || null; }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
let UTT = null, speakT = 0, VOZ_OK = false;
// desbloquea la voz con el primer toque (los móviles no dejan hablar si no ha habido un toque antes)
function unlockVoice() { if (VOZ_OK || !window.speechSynthesis) return; VOZ_OK = true; try { pickVoice(); const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'es-ES'; speechSynthesis.speak(u); speechSynthesis.resume(); } catch (e) {} }
['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, unlockVoice, { capture: true }));
function speak(t, pitch = 1.05, rate = 0.92, cb) {
  clearTimeout(speakT);
  if (!VOZ_ON || !window.speechSynthesis) { if (cb) setTimeout(cb, 400); return; }
  try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch (e) {}
  // pequeña espera tras cancelar: en Chrome, hablar justo después de cancelar a veces no suena
  speakT = setTimeout(() => {
    let done = false, tries = 0; const fin = () => { if (!done) { done = true; cb && cb(); } };
    const go = () => { try { pickVoice(); const u = new SpeechSynthesisUtterance(t.replace(/[¡¿]/g, '')); u.lang = VOICE ? VOICE.lang : 'es-ES'; if (VOICE) u.voice = VOICE; u.pitch = pitch; u.rate = rate; u.volume = 1;
        u.onend = fin; u.onerror = e => { if (e && e.error === 'synthesis-failed' && VOICE && tries++ < 4) { BADV.add(VOICE.name); go(); } else if (!(e && (e.error === 'interrupted' || e.error === 'canceled'))) fin(); else fin(); };
        UTT = u; speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) { fin(); } };
    go(); setTimeout(fin, 2500 + t.length * 90);
  }, 80);
}
setInterval(() => { try { if (window.speechSynthesis && speechSynthesis.speaking) speechSynthesis.resume(); } catch (e) {} }, 5000);
function shutUp() { clearTimeout(speakT); try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch (e) {} }

/* ---------- estado de la partida ---------- */
const NEW = () => ({ v: 2, room: 'camarote', x: 520, inv: [], flags: {}, chips: {}, got: {}, coins: 0, seen: {}, t0: Date.now() });
let G = NEW();
function save() { try { localStorage.setItem('ln_save', JSON.stringify(G)); } catch (e) {} cloudSave(); }
function load() { try { const s = JSON.parse(localStorage.getItem('ln_save') || 'null'); if (s && s.v === 2) return s; } catch (e) {} return null; }
const F = k => !!G.flags[k];
const PEG_ON = { bolitaFeliz: 'bolita', chefFeliz: 'chef', fin1: 'capi' };
function setF(k, v = true) { G.flags[k] = v; save(); if (PEG_ON[k] && typeof givePeg === 'function') setTimeout(() => givePeg(PEG_ON[k], true), 1500); }
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
  const S = IMG.suelo, y = R.floor - 14, SR = opt('suelo-relleno-nave'), SB = opt('suelo-borde-nave');
  if (SR && SB) { const t = 150; for (let i = Math.floor(camX / t); i * t - camX < VW; i++) for (let yy = y + 30; yy < VH; yy += t) ctx.drawImage(SR, i * t - camX, yy, t + 1, t + 1);
    const bh = 64, bw = bh * SB.naturalWidth / SB.naturalHeight; for (let i = Math.floor(camX / bw); i * bw - camX < VW; i++) ctx.drawImage(SB, i * bw - camX, y - 6, bw + 1, bh); }
  else if (ok(S)) { const tw = S.naturalWidth / 8, th = S.naturalHeight / 2, h = VH - y, w = tw * h / th; for (let i = Math.floor(camX / w) - 1; i * w - camX < VW; i++) ctx.drawImage(S, ((i % 8 + 8) % 8) * tw, 0, tw, th, i * w - camX, y, w + 1, h); }
  else { ctx.fillStyle = '#3a4466'; ctx.fillRect(0, y, VW, VH - y); }
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, y, VW, VH - y); }
  if (!SB) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, y, VW, 10); }
}
function frontImg(im, top, H, seed) {      // capa delantera con imagen: trozos separados que pasan por delante más rápido
  const w = H * im.naturalWidth / im.naturalHeight, seg = w * 0.45, gap = 520, step = seg + gap, off = camX * 1.3 + (seed * 331) % step;
  for (let i = Math.floor(off / step) - 1; i * step - off < VW + step; i++) { const x = i * step - off, k = ((i % 3) + 3) % 3, srcx = k * (im.naturalWidth * 0.27); if (x + seg < -10 || x > VW + 10) continue; ctx.drawImage(im, srcx, 0, im.naturalWidth * 0.45, im.naturalHeight, x, top, seg, H); }
}
function frontPipes(seed, col = '#2a3460') {
  const TB = opt('delante-tuberias'); if (TB) return frontImg(TB, 0, 190, seed);
  const off = camX * 1.3;
  for (let i = 0; i < 4; i++) { const x = ((seed * 977 + i * 820) % 3400) - off; if (x < -200 || x > VW + 200) continue;
    const h = 120 + (i * 37) % 110; ctx.fillStyle = lg(x, 0, x + 60, 0, ['#0a0e22', col, '#0a0e22']); ctx.fillRect(x, 0, 60, h); ctx.fillStyle = '#0a0e22'; ctx.fillRect(x - 8, h - 16, 76, 16); ctx.fillRect(x - 8, 50, 76, 12); }
}

/* ---------- capas con imagen: el espacio lejano (se mueve despacio) y la pared de cada sala (se repite a lo largo, en espejo para que no se noten las juntas) ---------- */
function tile(im, H, par, y) { const w = H * im.naturalWidth / im.naturalHeight, off = camX * par; for (let i = Math.floor(off / w); i * w - off < VW; i++) { const x = i * w - off; if (i % 2) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w + 1, H); ctx.restore(); } else ctx.drawImage(im, x, y, w + 1, H); } }
function layer(T, ly) {
  if (ly === 'lejos') { const sp = T.id !== 'maquinas' && !T.pl && opt('espacio-lejos'); if (sp) return tile(sp, VH, 0.15, 0);
    const cielo = T.pl && T.paint.out && opt('cielo-' + T.pl); if (cielo) { tile(cielo, VH, 0.08, 0); const mo = opt('montes-' + T.pl); if (mo) { const h = VH * 0.55; tile(mo, h, 0.35, T.floor + 20 - h); } return; }
    return T.paint('lejos'); }
  if (ly === 'suelo' && T.pl && T.paint.out) { const sg = opt('suelo-' + T.pl); if (sg) { tile(sg, VH - T.floor + 40, 1, T.floor - 40); T.paint.extra && T.paint.extra(); return; } }
  if (ly === 'pared') { const im = opt('pared-' + T.id); if (im) { tile(im, T.floor + 12, 1, 0); if (T.id === 'maquinas') { ctx.fillStyle = F('energia') ? 'rgba(20,255,120,.05)' : 'rgba(40,0,10,.25)'; ctx.fillRect(0, 0, VW, T.floor); } return; } return T.paint('pared'); }
  T.paint(ly);
}
/* ---------- plataformas ---------- */
function drawPlat(p) {
  const [x, y, w, k] = p, sx = x - camX - w / 2; if (k === 'none' || sx > VW + 20 || sx + w < -20) return;
  const im = opt('plat-' + (k || 'metal')); if (im) { const h = w * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, sx, y - 10, w, h); return; }
  if (k === 'caja') { const h = R.floor + 6 - y; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x - camX, R.floor + 10, w * 0.55, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = lg(sx, 0, sx + w, 0, ['#4a5a88', '#7a8ab8', '#4a5a88']); rr(sx, y, w, h, 8); ctx.fill(); stroke();
    ctx.fillStyle = '#2a3460'; ctx.fillRect(sx + 6, y + 6, w - 12, 10); ctx.fillRect(sx + 6, y + h - 16, w - 12, 10);
    ctx.save(); rr(sx + 10, y + h / 2 - 12, w - 20, 24, 4); ctx.clip(); ctx.fillStyle = '#ffd23c'; ctx.fillRect(sx, y + h / 2 - 12, w, 24); ctx.fillStyle = '#1a1a1a'; for (let i = -30; i < w; i += 22) { ctx.beginPath(); ctx.moveTo(sx + i, y + h / 2 + 12); ctx.lineTo(sx + i + 12, y + h / 2 - 12); ctx.lineTo(sx + i + 22, y + h / 2 - 12); ctx.lineTo(sx + i + 10, y + h / 2 + 12); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#c8d4f0'; for (const [a, b] of [[12, 22], [w - 12, 22], [12, h - 22], [w - 12, h - 22]]) { ctx.beginPath(); ctx.arc(sx + a, y + b, 4, 0, 7); ctx.fill(); } return; }
  if (k === 'hielo') { ctx.fillStyle = lg(0, y, 0, y + 50, ['#ffffff', '#bfe4ff', '#7ab4e0']); rr(sx, y, w, 50, 10); ctx.fill(); stroke('#4a7ab0', 4); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(sx + 12, y + 8, w * 0.4, 6); return; }
  if (k === 'roca') { ctx.fillStyle = lg(0, y, 0, y + 46, ['#8a6a5a', '#4a3a30']); ctx.beginPath(); ctx.moveTo(sx + 10, y); ctx.lineTo(sx + w - 10, y); ctx.lineTo(sx + w, y + 30); ctx.lineTo(sx + w - 20, y + 46); ctx.lineTo(sx + 20, y + 46); ctx.lineTo(sx, y + 26); ctx.closePath(); ctx.fill(); stroke('#2a1a10', 4); return; }
  if (k === 'rama') { ctx.fillStyle = lg(0, y, 0, y + 30, ['#9a6a3a', '#5a3a1a']); rr(sx, y, w, 28, 14); ctx.fill(); stroke('#3a2010', 4); ctx.fillStyle = '#3aa04a'; ctx.beginPath(); ctx.ellipse(sx + w - 10, y - 6, 26, 12, -0.4, 0, 7); ctx.ellipse(sx + 14, y - 4, 20, 10, 0.4, 0, 7); ctx.fill(); return; }
  if (k === 'nenufar') { ctx.fillStyle = '#3ab04a'; ctx.beginPath(); ctx.ellipse(x - camX, y + 10, w / 2 + 8, 16, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(x - camX, y + 10); ctx.fill(); stroke('#1a5a20', 3); ctx.fillStyle = '#ff8ad8'; ctx.beginPath(); ctx.arc(x - camX + 20, y + 2, 9, 0, 7); ctx.fill(); return; }
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

function doorPanel(cx, y, dh, pw) {    // trozo de pared lisa (metal) alrededor de la puerta, hasta el techo
  const top = 48, x = cx - pw / 2, bot = R.floor + 2;
  ctx.fillStyle = lg(x, 0, x + pw, 0, ['#1a2448', '#33426e', '#2a3860', '#1a2448']); ctx.fillRect(x, top, pw, bot - top);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, top, 8, bot - top); ctx.fillRect(x + pw - 8, top, 8, bot - top);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x + 8, top, 4, bot - top); ctx.fillStyle = '#0a0e22'; ctx.fillRect(x, top, pw, 6);
  ctx.fillStyle = '#5a6a9a'; for (let yy = top + 30; yy < bot - 20; yy += 90) { ctx.beginPath(); ctx.arc(x + 20, yy, 4, 0, 7); ctx.arc(x + pw - 20, yy, 4, 0, 7); ctx.fill(); }
}
/* ---------- puertas: se abren deslizando sus dos mitades y dejan ver lo que hay dentro ---------- */
const DOORS = {};
const door = id => DOORS[id] || (DOORS[id] = { o: 0, to: 0 });
function drawDoor(h) {
  if (h.door.style === 'camino') return drawSign(h);
  const D = h.door, d = door(D.id), P = D.style ? null : IMG['obj-puerta'], dh = D.h || 330, w = D.w || 220, y = R.floor - dh, sx = h.x - w / 2 - camX, locked = D.locked && D.locked();
  if (sx > VW + 60 || sx + w < -60) return;
  const op = Math.min(1, Math.max(0, d.o)), half = w / 2, sh = half * op;
  if (!D.style) doorPanel(sx + w / 2, y, dh, D.id === 'asc' || D.id === 'uasc' ? 330 : 300);
  const fr = D.style ? null : (D.id === 'asc' || D.id === 'uasc') ? 'obj-ascensor-' : 'puerta-', fi = fr && opt(fr + (fr === 'puerta-' ? Math.min(4, 1 + Math.round(op * 3)) : Math.min(3, 1 + Math.round(op * 2))));
  { const ih = fr === 'puerta-' ? dh + 20 : dh, iw = fi ? ih * fi.naturalWidth / fi.naturalHeight * 0.74 : w - 12, px = sx + w / 2 - iw / 2, py = fi ? y + dh - ih * 0.88 : y + 6, ph = fi ? ih * 0.8 : dh - 6;
    if (fr !== 'obj-ascensor-' || !fi) { if (op > 0.02 && !PREVIEW) { preview(D.to, px, py, iw, ph, D.tx); glow(sx + w / 2, y + dh - 60, 180, 'rgba(160,240,255,A)', 0.22 * op); }
      else { ctx.fillStyle = '#05060f'; rr(px, py, iw, ph, 14); ctx.fill(); } } }
  if (fi) { const ih = fr === 'puerta-' ? dh + 20 : dh + 50, iw = ih * fi.naturalWidth / fi.naturalHeight; ctx.drawImage(fi, sx + w / 2 - iw / 2, y + dh - ih + 4, iw, ih);
    if (fr === 'puerta-') { ctx.fillStyle = locked ? (Math.floor(time * 3) % 2 ? '#ff3a4a' : '#7a1020') : '#35ff8a'; ctx.beginPath(); ctx.arc(sx + w / 2, y + dh - ih + ih * 0.05, 7, 0, 7); ctx.fill(); if (!PREVIEW) glow(sx + w / 2, y + dh - ih + 10, 30, locked ? 'rgba(255,60,80,A)' : 'rgba(53,255,138,A)', 0.6); }
    if (D.label) { ctx.font = '800 22px "Baloo 2",system-ui'; ctx.textAlign = 'center'; const tw = Math.max(120, ctx.measureText(D.label).width + 30), ly = y + dh - ih - 40; ctx.fillStyle = '#0a0e22'; rr(sx + w / 2 - tw / 2, ly, tw, 30, 10); ctx.fill(); ctx.fillStyle = '#9ff0ff'; ctx.fillText(D.label, sx + w / 2, ly + 23); }
    return; }
  ctx.save(); ctx.beginPath(); ctx.rect(sx, y, w, dh); ctx.clip();
  if (ok(P)) { const iw = P.naturalWidth, ih = P.naturalHeight; ctx.drawImage(P, 0, 0, iw / 2, ih, sx - sh, y, half, dh); ctx.drawImage(P, iw / 2, 0, iw / 2, ih, sx + half + sh, y, half, dh); }
  else { ctx.fillStyle = D.col2 || '#6a7a9a'; ctx.fillRect(sx - sh, y, half, dh); ctx.fillRect(sx + half + sh, y, half, dh); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; ctx.strokeRect(sx - sh + 10, y + 14, half - 20, dh - 28); ctx.strokeRect(sx + half + sh + 10, y + 14, half - 20, dh - 28); ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(sx + half - 14 - sh, y + dh / 2, 6, 0, 7); ctx.arc(sx + half + 14 + sh, y + dh / 2, 6, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.lineWidth = 14; ctx.strokeStyle = D.col || '#2a3460'; rr(sx - 8, y - 10, w + 16, dh + 10, 18); ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#0a0e22'; ctx.stroke();
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
  try { layer(T, 'lejos'); layer(T, 'pared'); T.paint('suelo'); plats().forEach(drawPlat); for (const k of T.hot) if (k.draw && !k.door && (!k.vis || k.vis())) k.draw(); } catch (e) {}
  if (T.dark && !F('energia')) { ctx.fillStyle = 'rgba(0,0,6,.9)'; ctx.fillRect(-5000, -5000, 10000, 10000); }
  ctx.restore(); R = sR; camX = sC; PREVIEW = false;
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, y, w, h);
}
function animDoors(dt) { for (const k in DOORS) { const d = DOORS[k]; d.o += Math.sign(d.to - d.o) * Math.min(Math.abs(d.to - d.o), dt * 2.6); } }

/* ---------- personajes provisionales (robots dibujados) ---------- */
const CH = {};
function drawBot(id, x, o) {
  const c = CH[id] || (CH[id] = { talk: 0 }); c.x = x; c.top = R.floor - (o.h || 260) + (o.img ? 0 : 0);
  const t = time + x * 0.01, y = R.floor + 4, bob = Math.sin(t * 2.4) * 5, sx = x - camX, mouth = c.talk > 0 ? Math.abs(Math.sin(time * 18)) : 0.15;
  if (sx < -200 || sx > VW + 200) return;
  const base = o.img || ('pj-' + id + (o.sleep ? '-dormida' : '')), f0 = opt(base), f2 = opt(base + '-2'), f3 = opt(base + '-3'), pi = !f0 ? null : c.talk > 0 && f2 ? (Math.floor(time * 7) % 2 ? f2 : f0) : f3 && (time + x * 0.01) % 4 > 3.3 ? f3 : f0;
  if (pi) { const h = o.h || 260, w = h * pi.naturalWidth / pi.naturalHeight, lf = o.lift || 0; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, y, w * 0.4, 12, 0, 0, 7); ctx.fill(); ctx.save(); ctx.translate(sx, y + (lf ? bob * 2 : bob * 0.3) - lf); if (o.flip) ctx.scale(-1, 1); ctx.scale(1, 1 + mouth * 0.02); ctx.drawImage(pi, -w / 2, -h, w, h); ctx.restore();
    if (o.sleep) { ctx.font = '900 40px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = '#9ff0ff'; const zt = (time * 0.6) % 1; ctx.globalAlpha = 1 - zt; ctx.fillText('Z', sx + 70 + zt * 30, y - h - zt * 60); ctx.font = '900 28px Orbitron'; ctx.fillText('z', sx + 50 + zt * 20, y - h + 30 - zt * 40); ctx.globalAlpha = 1; }
    return; }
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
const PROP_H = { cama: 270, taquilla: 330, nevera: 330, cocina: 230, grifo: 230, planta: 470, generador: 330, ascensor: 400, panel: 200, pantalla: 480, escoba: 210, regadera: 90, manzana: 64, mostrador: 185, rejilla: 120 };
const PROP_SINK = { cama: 46 }, PROP_FLIP = { cama: !HAVE.has('obj-cama-lado') };
function drawProp(kind, x, st, yy) {
  const pi = opt('obj-' + kind + (st ? '-' + st : '')) || (st === 'agua' ? opt('obj-' + kind) : null), sx = x - camX, y = yy != null ? yy : R.floor;
  if (sx < -400 || sx > VW + 400) return;
  if (pi) { const h = PROP_H[kind] || 200, w = h * pi.naturalWidth / pi.naturalHeight, sink = yy == null ? (PROP_SINK[kind] || 24) : 8; if (yy == null) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, y + sink - 4, w * 0.45, 14, 0, 0, 7); ctx.fill(); } if (PROP_FLIP[kind]) { ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.drawImage(pi, -w / 2, y - h + sink, w, h); ctx.restore(); } else ctx.drawImage(pi, sx - w / 2, y - h + sink, w, h); if (st === 'agua') { ctx.fillStyle = '#29a8ff'; ctx.fillRect(sx - 6, y - h * 0.18, 12, h * 0.18 + 6 * Math.sin(time * 20)); } return; }
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

function drawCajon(x) { const im = opt('obj-cajon'), sx = x - camX, y = R.floor; if (im) { const h = 150, w = h * im.naturalWidth / im.naturalHeight; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, y + 20, w * 0.45, 12, 0, 0, 7); ctx.fill(); ctx.drawImage(im, sx - w / 2, y - h + 22, w, h); return; }
  ctx.fillStyle = lg(sx - 80, 0, sx + 80, 0, ['#4a5068', '#8a90a8', '#4a5068']); rr(sx - 80, y - 140, 160, 140, 10); ctx.fill(); stroke(); ctx.fillStyle = '#2a2e40'; ctx.fillRect(sx - 80, y - 100, 160, 10); ctx.fillRect(sx - 80, y - 46, 160, 10);
  ctx.fillStyle = '#ffd23c'; ctx.font = '900 18px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('NO ABRIR', sx, y - 62); ctx.fillStyle = '#0a0e22'; for (const [a, b] of [[-66, -126], [66, -126], [-66, -14], [66, -14]]) { ctx.beginPath(); ctx.arc(sx + a, y + b, 5, 0, 7); ctx.fill(); } }
/* ---------- fachada de la tienda: escaparate con el interior a la vista ---------- */
function drawShopFront(x) {
  const sx = x - camX, top = R.floor - 470; if (sx < -500 || sx > VW + 500) return;
  const FI = opt('casa-tienda-nave'); if (FI) { const H = 470, W = H * FI.naturalWidth / FI.naturalHeight; doorPanel(sx, top, H, W + 40);
    preview('tienda', sx - W * 0.42, top + H * 0.3, W * 0.84, H * 0.62, 880); ctx.drawImage(FI, sx - W / 2, R.floor - H, W, H);
    const on = Math.sin(time * 9) > -0.85 || Math.random() > 0.3; ctx.font = '900 32px Orbitron'; ctx.textAlign = 'center'; if (on) { ctx.shadowColor = '#ff5ad8'; ctx.shadowBlur = PREVIEW ? 0 : 20; } ctx.fillStyle = on ? '#ffe6fa' : '#8a5a8a'; ctx.fillText('TIENDA DE CHISPA', sx, top + H * 0.15); ctx.shadowBlur = 0; return true; }
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
  plat: [[330, 500, 270, 'none'], [1100, 530, 110, 'caja'], [1235, 440, 110, 'caja'], [1390, 296, 140, 'none']],
  coins: [[250, 420], [410, 420], [1100, 480], [1235, 390], [700, 560], [900, 560]],
  chip: [1390, 230],
  paint(l) { if (l === 'lejos') return space(0.15, 235); if (l === 'pared') return wall('#2a3a7a', '#141c44', [[860, 110, 400, 290]]); if (l === 'suelo') return floorDraw(); if (l === 'delante') return frontPipes(1); },
  hot: [
    { id: 'cama', x: 330, w: 320, h: 160, ic: '✋', draw: () => drawProp('cama', 330),
      act() { if (!F('tarjeta')) say([['lucas', '¿Qué hay debajo de la almohada?'], ['lucas', '¡Una tarjeta!']], () => { give('tarjeta'); setF('tarjeta'); say([['narr', '¡Lucas tiene una tarjeta! Mira tu mochila, abajo.']]); }); else say([['lucas', 'Mi cama. ¡Y se puede saltar encima!']]); } },
    { id: 'ventana', x: 1060, w: 400, h: 290, y: 110, ic: '👁', act() { say([['narr', 'Por la ventana se ven estrellas. ¡Y un planeta con anillos!'], ['lucas', 'No conozco ese planeta. ¡Estamos perdidos!']]); } },
    { id: 'taquilla', x: 1390, w: 150, h: 310, ic: '✋', draw: () => drawProp('taquilla', 1390, F('taquilla') ? 'abierta' : ''),
      act() { if (!F('taquilla')) { setF('taquilla'); SFX.door(); say([['lucas', '¡Mi taquilla! Voy a abrirla.'], ['lucas', '¡Una linterna!']], () => { give('linterna'); say([['narr', 'La linterna sirve para ver en sitios oscuros.']]); }); } else say([['lucas', 'Ya está vacía.']]); } },
    { id: 'puerta', x: 1610, w: 220, h: 330, ic: '🚪', door: dk('cam', 'pasillo', 180, 'PASILLO', () => !F('camAbierta')), draw() { drawDoor(this); },
      act() { if (has('tarjeta')) say([['lucas', '¡Uso la tarjeta!']], () => { take('tarjeta'); setF('camAbierta'); door('cam').to = 1; SFX.door(); }); else { SFX.bad(); say([['lucas', 'La puerta está cerrada.'], ['lucas', 'Necesito algo para abrirla.']]); } } }
  ],
  enter() { if (!G.seen.intro) { G.seen.intro = 1; save(); intro(); } }
});
room('pasillo', {
  name: 'EL PASILLO', W: 3700,
  plat: [[2360, 530, 110, 'caja'], [2475, 440, 110, 'caja'], [2590, 350, 110, 'caja']],
  coins: [[760, 560], [1040, 560], [2360, 480], [2475, 390], [2590, 300], [2750, 560], [3600, 560]],
  chip: [2590, 240],
  paint(l) { if (l === 'lejos') return space(0.2, 250); if (l === 'pared') return wall('#24346a', '#10183a', [[2780, 130, 140, 180], [3080, 130, 140, 180]], F('energia') ? '#35ff8a' : '#ff5a6a'); if (l === 'suelo') return floorDraw(); if (l === 'delante') return frontPipes(5); },
  hot: [
    { id: 'pCam', x: 180, w: 220, h: 330, ic: '🚪', door: dk('pcam', 'camarote', 1460, 'CAMAROTE'), draw() { drawDoor(this); } },
    { id: 'pCoc', x: 620, w: 220, h: 330, ic: '🚪', door: dk('pcoc', 'cocina', 220, 'COCINA'), draw() { drawDoor(this); } },
    { id: 'bolita', x: 900, w: 170, h: 200, ic: '👋', ch: true, draw: () => drawBot('bolita', 900, { kind: 'bola', col: '#ff9a3a', eye: '#29e6ff', h: 215, lift: 34, img: F('bolitaFeliz') ? 'pj-bolita-2' : 'pj-bolita' }), act: bolita },
    { id: 'pInv', x: 1200, w: 220, h: 330, ic: '🚪', door: dk('pinv', 'invernadero', 220, 'INVERNADERO'), draw() { drawDoor(this); } },
    { id: 'pTie', x: 1800, w: 220, h: 330, ic: '🚪', door: dk('ptie', 'tienda', 200, ''), draw() { if (!drawShopFront(1800)) drawDoor(this); } },
    { id: 'cajon', x: 3220, w: 170, h: 150, ic: '🔨', vis: () => !F('cajaRota'), draw: () => drawCajon(3220),
      act() { if (has('martillo')) say([['lucas', '¡Uso el martillo!']], () => { take('martillo'); setF('cajaRota'); FX.shake = 0.6; SFX.door(); addCoins(8); (FX.pop = FX.pop || []).push({ x: 3220, y: 420, t: 1.4, s: '+8' }); say([['narr', '¡La caja se rompe! ¡Dentro había ocho monedas!']]); });
        else say([['lucas', 'Una caja de hierro muy dura.'], ['lucas', 'Pone que no se puede abrir.'], ['lucas', 'Necesito algo para romperla.']]); } },
    { id: 'pMaq', x: 3000, w: 220, h: 330, ic: '🚪', door: dk('pmaq', 'maquinas', 220, 'MÁQUINAS'), draw() { drawDoor(this); } },
    { id: 'asc', x: 3480, w: 260, h: 380, ic: '🛗', door: dk('asc', '__subir', 0, 'ASCENSOR', () => !F('energia')), draw() { if (!opt('obj-ascensor-1')) drawProp('ascensor', 3480); drawDoor(this); },
      act() { SFX.bad(); say([['lucas', 'El ascensor no funciona.'], ['lucas', '¡La nave no tiene energía!']]); } }
  ],
  enter() { if (!G.seen.pasillo) { G.seen.pasillo = 1; save(); say([['narr', 'Este es el pasillo de la nave. ¡Tiene muchas puertas!'], ['narr', '¡Y hay una tienda! Se ve por el escaparate.']]); } }
});
function bolita() {
  if (F('bolitaFeliz')) return say([['bolita', '¡Gracias por mi escoba, Lucas!'], ['bolita', 'Ahora todo brilla mucho.']]);
  if (has('escoba')) return say([['lucas', '¡Bolita! ¡He encontrado tu escoba!'], ['bolita', '¡Mi escoba! ¡Bieeen!'], ['bolita', 'Te quiero dar un regalo.']], () => {
    take('escoba'); setF('bolitaFeliz');
    choose('¿Qué regalo eliges?', [{ e: '🔋', t: 'Un fusible' }, { e: '🪙', t: '6 monedas' }], i => {
      if (i === 0) { give('fusible'); say([['bolita', '¡Toma! Lo encontré en el suelo.'], ['narr', 'Las máquinas necesitan el fusible.']]); }
      else { addCoins(6); say([['bolita', '¡Toma, seis monedas!'], ['bolita', 'En la tienda de Chispa venden cosas chulas.']]); } }); });
  if (!F('bolitaHola')) { setF('bolitaHola'); return say([['bolita', '¡Lucas! ¡Ya te has despertado!'], ['bolita', 'Soy Bolita, el robot que limpia.'], ['bolita', 'La nave está sin energía.'], ['bolita', 'La capitana está arriba, en el puente.'], ['bolita', 'Pero el ascensor no funciona.'], ['bolita', 'Y yo... ¡he perdido mi escoba!']]); }
  say([['bolita', 'Sin mi escoba no puedo limpiar.'], ['bolita', '¡Seguro que está en un sitio oscuro!']]);
}
room('tienda', {
  name: 'LA TIENDA DE CHISPA', W: 1400,
  plat: [[1155, 530, 100, 'caja'], [1260, 440, 100, 'caja']],
  coins: [[1155, 480], [1260, 390], [480, 560]],
  chip: [1260, 330],
  paint(l) { if (l === 'lejos') return space(0.1, 290, false);
    if (l === 'pared') { wall('#5a2a8a', '#22103e', [], '#ff5ad8'); for (let i = 0; i < 6; i++) { const x = 200 + i * 200 - camX; ctx.fillStyle = ['#ff5ad8', '#ffd23c', '#29e6ff'][i % 3]; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x - 60, R.floor - 90); ctx.lineTo(x + 60, R.floor - 90); ctx.fill(); ctx.globalAlpha = 1; } return; }
    if (l === 'suelo') { floorDraw('rgba(140,60,200,.25)'); return; } if (l === 'delante') return frontPipes(21, '#5a2a8a'); },
  hot: [
    { id: 'tDoor', x: 200, w: 220, h: 330, ic: '🚪', door: dk('tdoor', 'pasillo', 1800, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'mostr', x: 880, w: 460, h: 150, draw: () => { drawBot('chispa', 880, { col: '#b04aff', eye: '#ffd23c', hat: 'antena', h: 330 }); drawProp('mostrador', 880); }, ic: '🛒', act: () => shop() }
  ],
  enter() { if (!G.seen.tienda) { G.seen.tienda = 1; save(); say([['chispa', '¡Bienvenido a mi tienda, Lucas!'], ['chispa', 'Soy Chispa. Tengo cosas geniales.'], ['chispa', 'Trae monedas y te las vendo.']]); } }
});
room('cocina', {
  name: 'LA COCINA', W: 1800,
  plat: () => opt('obj-estanteria') ? [[470, 461, 280, 'none'], [470, 359, 280, 'none'], [470, 263, 300, 'none'], [1300, 530, 100, 'caja'], [1400, 440, 100, 'caja'], [1560, 300, 140, 'none']] : [[470, 500, 240, 'estante'], [470, 380, 240, 'estante'], [1330, 470, 160], [1560, 300, 170, 'none']],
  coins: [[420, 410], [520, 410], [1300, 480], [1400, 390], [1520, 250], [1600, 250]],
  chip: [1560, 220],
  paint(l) { if (l === 'lejos') return space(0.15, 300, false); if (l === 'pared') return wall('#4a2a5a', '#20102e', [[760, 120, 300, 220]], '#ffd23c'); if (l === 'suelo') return floorDraw('rgba(120,60,40,.25)'); if (l === 'delante') return frontPipes(9, '#4a2a5a'); },
  hot: [
    { id: 'cDoor', x: 150, w: 220, h: 330, ic: '🚪', door: dk('cdoor', 'pasillo', 620, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'regadera', x: 520, w: 120, h: 90, y: 270, ic: '✋', vis: () => !F('regadera'), draw: () => { const E = opt('obj-estanteria'); if (E) { const H = 360, W = H * E.naturalWidth / E.naturalHeight; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(470 - camX, R.floor + 20, W * 0.45, 12, 0, 0, 7); ctx.fill(); ctx.drawImage(E, 470 - camX - W / 2, R.floor - H + 18, W, H); } drawProp('regadera', 520, '', E ? 359 : 380); },
      act() { say([['lucas', '¡Una regadera!']], () => { setF('regadera'); give('regadera'); }); } },
    { id: 'estanteria', x: 470, w: 240, h: 200, y: 420, ic: '👁', vis: () => !F('regadera') && !F('vioEst'), act() { setF('vioEst'); say([['lucas', 'Arriba del todo hay una regadera.'], ['lucas', '¡Tengo que saltar por las baldas!']]); } },
    { id: 'cocinaF', x: 860, w: 400, h: 150, ic: '👁', draw: () => drawProp('cocina', 860), act() { say([['lucas', '¡Cuidado, quema!']]); } },
    { id: 'chef', x: 1100, w: 170, h: 300, ic: '👋', ch: true, draw: () => drawBot('chef', 1100, { col: '#ff5a6a', eye: '#ffd23c', hat: 'chef', h: 345 }), act: chef },
    { id: 'nevera', x: 1560, w: 160, h: 320, ic: '👁', draw: () => drawProp('nevera', 1560), act() { say([['lucas', 'La nevera está vacía.'], ['lucas', '¡No hay ni una manzana!']]); } }
  ],
  enter() { if (!G.seen.cocina) { G.seen.cocina = 1; save(); say([['narr', 'La cocina huele a tornillos tostados.']]); } }
});
function chef() {
  if (F('chefFeliz')) return say([['chef', '¡Qué manzana tan rica!'], ['chef', 'Usa mi llave inglesa para arreglar cosas.']]);
  if (has('manzana')) return say([['lucas', 'Chef, ¡te traigo una manzana!'], ['chef', '¡Qué rica está!'], ['chef', 'Toma mi llave inglesa.'], ['chef', 'Sirve para apretar tuercas.']], () => { take('manzana'); setF('chefFeliz'); give('llave'); });
  if (!F('chefHola')) { setF('chefHola'); return say([['chef', '¡Hola, Lucas! Soy el Chef Tuercas.'], ['chef', '¡Ay, qué hambre tengo!'], ['chef', 'Tráeme una manzana espacial.'], ['chef', 'Y te daré un regalo.']]); }
  say([['chef', '¡Tengo hambre! ¿Y mi manzana?']]);
}
room('invernadero', {
  name: 'EL INVERNADERO', W: 2300,
  plat: () => F('plantaRegada') ? [[1050, 480, 140, 'hoja'], [1250, 360, 140, 'hoja'], [1060, 240, 140, 'hoja'], [1850, 520, 120, 'caja']] : [[1850, 520, 120, 'caja']],
  coins: [[700, 560], [1050, 430], [1250, 310], [1820, 470], [1880, 470], [2150, 560]],
  chip: [1060, 180],
  paint(l) { if (l === 'lejos') return space(0.12, 170);
    if (l === 'pared') { wall('#1a4a3a', '#0a2018', [[400, 90, 1300, 300]], '#35ff8a'); for (let x = 450; x < 1700; x += 140) { ctx.fillStyle = '#2a6a4a'; ctx.fillRect(x - camX, 90, 8, 300); } return; }
    if (l === 'suelo') { floorDraw('rgba(40,120,60,.25)'); for (let x = 60; x < R.W; x += 230) { ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(x - camX, R.floor - 6, 60, 18, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = ['#ff5ad8', '#ffd23c', '#5ad8ff'][x % 3]; ctx.beginPath(); ctx.arc(x - camX + 20, R.floor - 24, 8, 0, 7); ctx.fill(); } return; }
    if (l === 'delante') { const PL2 = opt('delante-plantas'); if (PL2) return frontImg(PL2, VH - 150, 170, 3); for (let i = 0; i < 4; i++) { const x = i * 700 + 300 - camX * 1.3; ctx.fillStyle = '#0e3a1e'; ctx.beginPath(); ctx.ellipse(x, VH + 30, 160, 120, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1a5a2a'; ctx.beginPath(); ctx.ellipse(x + 60, VH + 10, 90, 80, 0.4, 0, 7); ctx.fill(); } } },
  hot: [
    { id: 'iDoor', x: 150, w: 220, h: 330, ic: '🚪', door: dk('idoor', 'pasillo', 1200, 'PASILLO'), draw() { drawDoor(this); } },
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
  plat: [[700, 530, 110, 'caja'], [815, 440, 110, 'caja'], [930, 350, 110, 'caja']],
  coins: [[700, 480], [815, 390], [930, 300], [600, 560], [1400, 560]],
  chip: [2180, 520],
  paint(l) { if (l === 'lejos') { ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, VW, VH); return; }
    if (l === 'pared') { wall('#2a2a3a', '#101018', [], F('energia') ? '#35ff8a' : '#ff5a6a'); for (let x = 300; x < R.W; x += 260) { if (x - camX < -150 || x - camX > VW + 20) continue; ctx.fillStyle = '#1a1a2a'; rr(x - camX, 140, 120, 330, 14); ctx.fill(); ctx.fillStyle = F('energia') ? '#35ff8a' : '#3a1a1a'; for (let i = 0; i < 6; i++) { ctx.globalAlpha = F('energia') ? 0.4 + 0.6 * Math.abs(Math.sin(time * 3 + i + x)) : 1; ctx.fillRect(x - camX + 20, 170 + i * 45, 80, 20); } ctx.globalAlpha = 1; } return; }
    if (l === 'suelo') return floorDraw('rgba(0,0,0,.25)'); if (l === 'delante') return frontPipes(13, '#3a3a4a'); },
  hot: [
    { id: 'mDoor', x: 150, w: 220, h: 330, ic: '🚪', door: dk('mdoor', 'pasillo', 3000, 'PASILLO'), draw() { drawDoor(this); } },
    { id: 'escoba', x: 950, w: 120, h: 210, ic: '✋', vis: () => !F('escoba'), draw: () => drawProp('escoba', 950), act() { say([['lucas', '¡Una escoba!'], ['lucas', '¿Será la escoba de Bolita?']], () => { setF('escoba'); give('escoba'); }); } },
    { id: 'gen', x: 1700, w: 300, h: 320, ic: '🔧', draw: () => drawProp('generador', 1700, F('energia') ? 'on' : F('tuerca') ? 'tuerca' : ''), act: generador }
  ],
  enter() { if (!F('energia') && !has('linterna')) say([['lucas', '¡Qué oscuro está esto!'], ['lucas', 'No veo nada. Necesito luz.']]); else if (!G.seen.maq) { G.seen.maq = 1; save(); say([['narr', 'Lucas enciende la linterna. ¡Ahora sí se ve!']]); } }
});
function generador() {
  if (F('energia')) return say([['lucas', '¡El generador funciona!']]);
  if (!F('tuerca')) { if (has('llave')) { say([['lucas', 'Hay una tuerca suelta.'], ['lucas', '¡Uso la llave inglesa!']], () => { setF('tuerca'); take('llave'); SFX.door(); generador(); }); return; } say([['lucas', 'Es el generador de la nave.'], ['lucas', 'Tiene una tuerca suelta.'], ['lucas', 'Necesito algo para apretarla.']]); return; }
  if (has('fusible')) { say([['lucas', 'Y ahora... ¡pongo el fusible!']], () => { take('fusible'); setF('fusibleOk'); powerOn(); }); return; }
  say([['lucas', 'La tuerca ya está bien.'], ['lucas', 'Pero falta un fusible.']]);
}
function powerOn() { SFX.power(); setF('energia'); FX.flash = 1.5; setTimeout(() => { SFX.win(); say([['narr', '¡Bien! ¡La nave tiene energía otra vez!'], ['lucas', '¡Ahora funcionará el ascensor!']]); }, 1400); }
room('puente', {
  name: 'EL PUENTE DE MANDO', W: 2100,
  plat: [[1760, 530, 110, 'caja'], [1880, 440, 110, 'caja']],
  coins: [[1760, 480], [1880, 390], [800, 560], [1650, 560]],
  chip: [1880, 360],
  paint(l) { if (l === 'lejos') return space(0.18, 215); if (l === 'pared') { wall('#1a2a5a', '#0a1030', [[220, 110, 560, 300], [1180, 110, 400, 300]], '#29e6ff'); drawProp('rejilla', 1880, 'abierta', 170); return; } if (l === 'suelo') return floorDraw('rgba(20,40,120,.2)'); if (l === 'delante') return frontPipes(17); },
  hot: [
    { id: 'uAsc', x: 150, w: 220, h: 330, ic: '🛗', door: dk('uasc', '__bajar', 0, 'ASCENSOR'), draw() { drawDoor(this); } },
    { id: 'panel', x: 660, w: 440, h: 170, ic: '✋', draw: () => drawProp('panel', 660), act: panel },
    { id: 'pantalla', x: 1040, w: 440, h: 260, y: 150, ic: '👁', draw: () => drawProp('pantalla', 1040), act() { if (F('fin1')) return planetMenu(); say([['narr', 'En la pantalla hay un mapa de estrellas.'], ['narr', 'Pero no sale nuestro planeta.']]); } },
    { id: 'capi', x: 1420, w: 170, h: 300, ic: '👋', ch: true, draw: () => drawBot('capi', 1420, { col: '#29e6ff', eye: '#ffd23c', hat: 'capi', sleep: !F('capiDespierta'), h: 345 }), act: capi }
  ],
  enter() { if (!G.seen.puente) { G.seen.puente = 1; save(); say([['narr', '¡El puente de mando! Desde aquí se conduce la nave.'], ['lucas', '¡Ahí está la capitana! Pero... ¿está dormida?']]); } }
});
function panel() {
  if (F('capiDespierta')) return say([['lucas', 'Muchos botones. ¡Mejor no tocar!']]);
  if (!F('capiIntento')) return say([['lucas', 'Cuántos botones...'], ['lucas', 'Hay uno rojo muy grande.'], ['lucas', 'Mejor primero hablo con la capitana.']]);
  choose('¿Qué botón tocas?', [{ e: '🔴', t: 'El rojo grande' }, { e: '🟢', t: 'El verde' }, { e: '🟡', t: 'El amarillo' }], i => {
    if (i === 1) { FX.flash = 0.5; return say([['narr', '¡Se encienden todas las luces de colores!'], ['narr', 'Pero la capitana sigue durmiendo.']]); }
    if (i === 2) { SFX.grow(); return say([['narr', 'Suena una musiquita muy suave.'], ['narr', 'La capitana sigue durmiendo.']]); }
    SFX.honk(); FX.shake = 0.8; say([['narr', 'La bocina suena muy fuerte.']], () => { setF('capiDespierta'); capi(); }); });
}
function capi() {
  if (!F('capiDespierta')) { setF('capiIntento'); return say([['lucas', '¡Capitana! ¡Despierte!'], ['narr', 'La capitana está roncando.'], ['lucas', 'Necesito un ruido muy fuerte.']]); }
  if (F('fin1')) return capiPlanetas();
  if (!F('energia')) { if (!F('capiSinLuz')) { setF('capiSinLuz'); return say([['capi', '¡Uy! ¿Quién toca la bocina?'], ['capi', '¡Lucas! ¡La nave no tiene energía!'], ['capi', 'Arregla el generador, en las máquinas.'], ['capi', 'El ascensor puede bajar. ¡Corre!']]); } return say([['capi', 'Sin energía no podemos volar.'], ['capi', 'Arregla el generador de las máquinas.']]); }
  say([[F('capiSinLuz') ? 'capi' : 'capi', F('capiSinLuz') ? '¡Lo has conseguido! ¡Hay energía!' : '¡Uy! ¿Qué pasa? ¿Quién toca la bocina?'], ['capi', '¡Lucas! ¡Has arreglado la nave!'], ['capi', 'Pero estamos perdidos en el espacio.'], ['capi', 'Para volver a casa necesitamos...'], ['capi', '¡tres cristales de energía!'], ['capi', 'Están en tres planetas lejanos.'], ['lucas', '¡Yo los encontraré!'], ['capi', '¿Adónde vamos primero?']], () => {
    choose('¿A qué planeta vamos primero?', [{ e: '🧊', t: 'Planeta de hielo' }, { e: '🌋', t: 'Planeta de fuego' }, { e: '🌴', t: 'Planeta selva' }], i => { G.flags.planeta = ['de hielo', 'de fuego', 'selva'][i]; G.flags.destino = ['hielo', 'fuego', 'selva'][i]; setF('fin1'); say([['capi', '¡Rumbo al planeta ' + G.flags.planeta + '!']], finChapter); }); });
}

/* ---------- tienda ---------- */
const SHOP = [
  { id: 'fusible', e: '🔋', t: 'Fusible', p: 10, d: 'Da energía a las máquinas.', show: () => !has('fusible') && !F('fusibleOk') },
  { id: 'botas', e: '👢', t: 'Botas saltarinas', p: 8, d: '¡Saltas muchísimo más alto!', show: () => !F('botas') },
  { id: 'martillo', e: '🔨', t: 'Martillo', p: 4, d: 'Sirve para romper cosas.', show: () => !has('martillo') && !F('cajaRota') },
  { id: 'gorro', e: '🧢', t: 'Gorro de hélice', p: 5, d: '¡Lucas lleva un gorro chulísimo!', show: () => !F('hat_gorro') && !F('gorro') }
];
let SHOPPING = false;
function shop() { shopOf('chispa', 'TIENDA DE CHISPA', SHOP); }
const COSMETIC = { gorro: '¡Qué guapo está Lucas con su gorro!', lana: '¡Qué calentito va Lucas con su gorro de lana!', gafas: '¡Lucas lleva gafas de sol! ¡Qué chulo!', sombrero: '¡Lucas parece un explorador con su sombrero!', corona: '¡Lucas lleva una corona de rey!' };
function shopOf(who, title, SHOP) {
  SHOPPING = true; L.serve = 1; const m = $('modal'), list = SHOP.filter(s => s.show());
  if (!list.length) { SHOPPING = false; return say([[who, '¡Me lo has comprado todo!'], [who, '¡Muchas gracias, Lucas!']]); }
  m.innerHTML = '<div class="card wide shopc" style="border-color:#ff5ad8"><h2 style="color:#ff5ad8">' + title + '</h2><div style="font:900 22px Orbitron;color:#ffe680">Tienes ' + G.coins + ' 🪙</div><div class="choice">' + list.map((s, i) => '<button data-i="' + i + '"' + (G.coins < s.p ? ' disabled' : '') + '><b>' + s.e + '</b>' + s.t + '<span class="pr">' + s.p + ' 🪙</span><small style="font-size:15px;color:#9fb4ff">' + s.d + '</small></button>').join('') + '</div><button class="btn" id="shX">ADIÓS</button></div>';
  m.classList.add('on'); speak('¿Qué quieres comprar? Tienes ' + G.coins + ' monedas.');
  $('shX').onclick = () => { SHOPPING = false; m.classList.remove('on'); shutUp(); say([[who, '¡Hasta pronto, Lucas!']]); };
  m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const s = list[+b.dataset.i]; if (G.coins < s.p) return; SHOPPING = false; G.coins -= s.p; paintCoins(); SFX.buy(); m.classList.remove('on'); shutUp();
    evt('compra', s.id);
    if (COSMETIC[s.id]) { setF('hat_' + s.id); G.hat = s.id; save(); SFX.pick(); L.cheer = 1.4; return say([[who, '¡Gracias! ¡Es tuyo!'], ['narr', COSMETIC[s.id]]]); }
    if (s.id === 'botas') setF('botas'); if (s.buy) { s.buy(); return; } give(s.id);
    say([[who, '¡Gracias! ¡Es tuyo!'], ['narr', s.msg || (s.id === 'botas' ? '¡Con las botas Lucas salta altísimo! Prueba a llegar a sitios muy altos.' : s.id === 'martillo' ? 'Un martillo. ¿Habrá algo para romper en la nave?' : 'Un fusible. Llévalo al generador de las máquinas.')]]); });
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
function hint1() {
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
  say([['narr', 'Esta es la nave Estrella Azul.'], ['narr', 'Una lluvia de meteoritos la ha golpeado.'], ['narr', 'Ahora está perdida en el espacio.'], ['narr', 'Lucas, el pequeño robot, se despierta.'], ['lucas', '¿Qué ha pasado? ¡Todo está muy raro!'], ...(TOUCH ? [['narr', 'Usa las flechas para andar. Y la flecha grande para saltar.'], ['narr', 'Cuando salga la mano amarilla, tócala.']] : [['narr', 'Anda con las flechas del teclado. Salta con la barra espaciadora.'], ['narr', 'Para entrar, coger o hablar, pulsa la tecla E. O haz clic encima.']]), ['narr', 'Coge las monedas. ¡Sirven para comprar!'], ['narr', 'Si no sabes qué hacer, toca la bombilla.']]);
}
function finChapter() {
  evt('fin'); SFX.win(); const n = Object.keys(G.chips).length;
  setTimeout(() => { const m = $('modal'); m.innerHTML = '<div class="card" style="border-color:var(--gold)"><h2 style="color:var(--gold)">¡CAPÍTULO 1 COMPLETADO!</h2><img src="img/lucas-celebrando.webp" style="height:170px"><div style="font-size:24px">Lucas ha arreglado la nave.<br>¡Rumbo al planeta ' + esc(G.flags.planeta || '') + '!</div><div style="font-size:22px;color:var(--gold)">Chips: ' + n + ' / ' + CHIP_ROOMS.length + ' · Monedas: ' + G.coins + '</div><div style="color:#9fb4ff">¡Ahora empieza el viaje a los planetas!</div><button class="btn gold" id="finOk">¡VAMOS!</button></div>'; m.classList.add('on'); $('finOk').onclick = () => { m.classList.remove('on'); travelTo(G.flags.destino || 'hielo'); }; speak('¡Capítulo uno completado! Ahora empieza el viaje a los planetas.'); }, 600);
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

/* =====================================================================
   CAPÍTULOS 2, 3 Y 4: LOS TRES PLANETAS · CAPÍTULO 5: VUELTA A CASA
   Todo se dibuja provisional (emojis y formas) hasta que lleguen las imágenes buenas:
   personajes pj-<id>, objetos item-<id>, fondos cielo-<planeta>, montes-<planeta>, suelo-<planeta>...
   ===================================================================== */
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
function emo(e, x, y, size, rot) { ctx.save(); ctx.translate(x - camX, y); if (rot) ctx.rotate(rot); ctx.font = size + 'px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(e, 0, 0); ctx.restore(); }
// personaje provisional con emoji (cuando llegue su imagen pj-<id> se usa la imagen)
function drawNPC(id, x, e, size, yy) {
  const c = CH[id] || (CH[id] = { talk: 0 }), y = yy != null ? yy : R.floor, h = size * 1.05; c.x = x; c.top = y - h;
  if (x - camX < -250 || x - camX > VW + 250) return;
  const pi = opt('pj-' + id), bob = Math.sin(time * 2.4 + x * 0.01) * 4, sq = c.talk > 0 ? 1 + Math.abs(Math.sin(time * 16)) * 0.05 : 1;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x - camX, y + 2, size * 0.38, 12, 0, 0, 7); ctx.fill();
  if (pi) { const w = h * pi.naturalWidth / pi.naturalHeight; ctx.drawImage(pi, x - camX - w / 2, y - h + bob * 0.3, w, h); return; }
  ctx.save(); ctx.translate(x - camX, y - 6 + bob); ctx.scale(1, sq); ctx.font = size + 'px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.fillText(e, 0, 0); ctx.restore();
}
function npc(id, name, x, e, size, actFn, extra) { NAMES[id] = name; return Object.assign({ id, x, w: size * 0.8, h: size, ic: '👋', ch: true, draw() { drawNPC(id, x, e, size); }, act: actFn }, extra || {}); }
// cosa que se puede mirar o coger dibujada con emoji
function thing(id, x, y, e, size, o) { return Object.assign({ id, x, w: size, h: size, y: y - size, ic: '👁', draw() { drawThingE(id, x, y, e, size); } }, o || {}); }
function drawThingE(id, x, y, e, size) { const im = opt('obj-' + id); if (im) { const w = size * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x - camX - w / 2, y - size, w, size); return; } emo(e, x, y - 4, size * 0.9); }

/* ---------- cielos, montañas y suelos de los planetas (capas con parallax) ---------- */
const PL = {
  hielo: { t: 'Planeta Escarcha', n: 'PLANETA ESCARCHA', sky: ['#4a8ae0', '#cfeeff'], far: '#a8c8f0', mid: '#e0f2ff', g1: '#f4fbff', g2: '#a8d0f0', fg: '#d8ecfa', e: '🧊', planet: '#bfe8ff' },
  fuego: { t: 'Planeta Volcán', n: 'PLANETA VOLCÁN', sky: ['#2a0610', '#ff7a3a'], far: '#5a1a1a', mid: '#3a1010', g1: '#6a2a1a', g2: '#2a0e08', fg: '#1a0604', e: '🌋', planet: '#ff6a3a' },
  selva: { t: 'Planeta Jungla', n: 'PLANETA JUNGLA', sky: ['#2aa0d0', '#d8f6c0'], far: '#5aa06a', mid: '#2a7a3a', g1: '#5aa03a', g2: '#2a5a1a', fg: '#0e3a14', e: '🌴', planet: '#6ad06a' },
  tierra: { t: 'la Tierra', n: 'LA TIERRA', sky: ['#3ab0ff', '#e6f8ff'], far: '#7ab8e0', mid: '#5ab04a', g1: '#6ac04a', g2: '#3a8a2a', fg: '#2a6a1a', e: '🌍', planet: '#3a8aff' }
};
function hillLine(col, base, amp, par, seed, step = 60) {
  const off = camX * par; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, VH);
  for (let sx = -step; sx <= VW + step; sx += step) { const wx = sx + off, y = base - amp * (0.55 + 0.25 * Math.sin(wx * 0.004 + seed) + 0.2 * Math.sin(wx * 0.011 + seed * 3)); ctx.lineTo(sx, y); }
  ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
}
function skyPaint(p) {
  const P = PL[p]; ctx.fillStyle = lg(0, 0, 0, VH, P.sky); ctx.fillRect(0, 0, VW, VH);
  if (p === 'hielo') { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { ctx.strokeStyle = ['rgba(80,255,180,.18)', 'rgba(120,160,255,.16)', 'rgba(200,120,255,.12)'][i]; ctx.lineWidth = 40; ctx.beginPath(); for (let x = -50; x < VW + 60; x += 40) { const y = 110 + i * 40 + Math.sin(x * 0.006 + time * 0.5 + i) * 30; x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); } ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 40; i++) { const x = (i * 197 + time * 20 * (1 + i % 3)) % (VW + 40) - 20, y = (i * 131 + time * 40 * (1 + i % 2)) % VH; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, 7); ctx.fill(); } }
  if (p === 'fuego') { for (let i = 0; i < 30; i++) { const x = (i * 211) % VW, y = VH - ((time * 30 * (1 + i % 3) + i * 97) % VH); ctx.fillStyle = 'rgba(255,' + (120 + i % 3 * 40) + ',40,.7)'; ctx.fillRect(x, y, 3, 3); } }
  if (p === 'selva' || p === 'tierra') { const sx = 1000 - camX * 0.05; glow(sx, 120, 160, 'rgba(255,250,200,A)', 0.6); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(sx, 120, 50, 0, 7); ctx.fill();
    for (let i = 0; i < 4; i++) { const cx = ((i * 380 - camX * 0.08 + time * 6) % 1700 + 1700) % 1700 - 200; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(cx, 90 + i * 30, 90, 26, 0, 0, 7); ctx.ellipse(cx + 50, 76 + i * 30, 60, 26, 0, 0, 7); ctx.fill(); } }
}
function farPaint(p) {
  const P = PL[p];
  if (p === 'fuego') { // volcán humeante al fondo
    const vx = 700 - camX * 0.1; ctx.fillStyle = '#3a0c0c'; ctx.beginPath(); ctx.moveTo(vx - 420, 560); ctx.lineTo(vx - 70, 220); ctx.lineTo(vx + 70, 220); ctx.lineTo(vx + 420, 560); ctx.fill(); ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(vx - 70, 220); ctx.lineTo(vx + 70, 220); ctx.lineTo(vx + 30, 260); ctx.lineTo(vx - 40, 250); ctx.fill();
    for (let i = 0; i < 5; i++) { const t = (time * 0.3 + i / 5) % 1; ctx.fillStyle = 'rgba(80,60,60,' + (0.5 * (1 - t)) + ')'; ctx.beginPath(); ctx.arc(vx + Math.sin(t * 6 + i) * 40, 210 - t * 200, 30 + t * 60, 0, 7); ctx.fill(); } }
  hillLine(P.far, 470, 220, 0.15, 1); hillLine(P.mid, 540, 150, 0.4, 4);
  if (p === 'hielo') { ctx.fillStyle = 'rgba(255,255,255,.6)'; hillLine('rgba(255,255,255,.55)', 480, 200, 0.15, 1, 120); }
  if (p === 'selva') { for (let i = 0; i < 9; i++) { const x = ((i * 260 - camX * 0.4) % 2340 + 2340) % 2340 - 200; emo('🌴', x + camX, 560, 150); } }
  if (p === 'tierra') { for (let i = 0; i < 6; i++) { const x = ((i * 320 - camX * 0.4) % 1920 + 1920) % 1920 - 200; emo('🌳', x + camX, 560, 130); } }
}
function groundPaint(p, lavaFrom, lavaTo, bridge, onlyLava) {
  const P = PL[p], y = R.floor - 10; if (!onlyLava) { ctx.fillStyle = lg(0, y, 0, VH, [P.g1, P.g2]); ctx.fillRect(0, y, VW, VH - y);
  ctx.fillStyle = 'rgba(255,255,255,' + (p === 'hielo' ? 0.8 : 0.12) + ')'; ctx.fillRect(0, y, VW, 8);
  for (let wx = Math.floor(camX / 90) * 90; wx < camX + VW + 90; wx += 90) { const sx = wx - camX, k = (wx / 90) % 5; ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(sx + 30, y + 40 + k * 12, 26 + k * 4, 6, 0, 0, 7); ctx.fill();
    if (p === 'selva' || p === 'tierra') { ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, y + 2); ctx.lineTo(sx - 4, y - 12); ctx.moveTo(sx + 8, y + 2); ctx.lineTo(sx + 10, y - 14); ctx.stroke(); } } }
  if (lavaFrom != null) { const a = lavaFrom - camX, b = lavaTo - camX; ctx.fillStyle = lg(0, y, 0, VH, ['#ffd23c', '#ff5a1a', '#a01a0a']); ctx.fillRect(a, y - 4, b - a, VH - y + 4);
    for (let i = 0; i < 12; i++) { const bx = a + ((i * 53 + time * 30) % (b - a)); ctx.fillStyle = 'rgba(255,240,150,.7)'; ctx.beginPath(); ctx.arc(bx, y + 20 + (i % 3) * 18, 6 + Math.sin(time * 4 + i) * 3, 0, 7); ctx.fill(); }
    if (!PREVIEW) glow((a + b) / 2, y, (b - a) * 0.6, 'rgba(255,120,40,A)', 0.35);
    if (bridge) { ctx.fillStyle = '#6a4a3a'; ctx.fillRect(a - 30, y - 18, b - a + 60, 22); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; for (let x = a - 30; x < b + 30; x += 40) ctx.strokeRect(x, y - 18, 40, 22); ctx.fillStyle = '#4a4a5a'; ctx.fillRect(a - 30, y - 60, 8, 44); ctx.fillRect(b + 22, y - 60, 8, 44); ctx.fillRect(a - 30, y - 60, b - a + 60, 5); }
    else { ctx.fillStyle = '#6a4a3a'; ctx.save(); ctx.translate(a + 10, y - 6); ctx.rotate(0.5); ctx.fillRect(0, 0, 90, 16); ctx.restore(); ctx.save(); ctx.translate(b - 10, y - 6); ctx.rotate(2.6); ctx.fillRect(0, 0, 90, 16); ctx.restore(); } }
}
function frontPaint(p, seed) {
  if ((p === 'selva' || p === 'tierra') && opt('delante-plantas')) return frontImg(opt('delante-plantas'), VH - 150, 170, seed);
  const P = PL[p];
  for (let i = 0; i < 4; i++) { const x = ((seed * 977 + i * 900) % 3600) - camX * 1.3; if (x < -300 || x > VW + 300) continue; ctx.fillStyle = P.fg;
    if (p === 'selva' || p === 'tierra') { for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x, VH + 20); ctx.rotate(-1.2 + k * 0.6); ctx.beginPath(); ctx.ellipse(0, -90, 34, 120, 0, 0, 7); ctx.fill(); ctx.restore(); } }
    else if (p === 'hielo') { ctx.beginPath(); ctx.ellipse(x, VH + 40, 200, 90, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - 40, VH + 10, 120, 40, 0, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x - 160, VH); ctx.lineTo(x - 60, VH - 140); ctx.lineTo(x + 20, VH - 90); ctx.lineTo(x + 120, VH - 170); ctx.lineTo(x + 200, VH); ctx.fill(); } }
}
function bricks(c1, c2, bw, bh, line) { ctx.fillStyle = lg(0, 0, 0, R.floor, [c1, c2]); ctx.fillRect(0, 0, VW, R.floor); ctx.strokeStyle = line; ctx.lineWidth = 3;
  for (let r = 0, y = 0; y < R.floor; r++, y += bh) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); const o = (r % 2) * bw / 2; for (let wx = Math.floor((camX - o) / bw) * bw + o; wx < camX + VW; wx += bw) { ctx.beginPath(); ctx.moveTo(wx - camX, y); ctx.lineTo(wx - camX, y + bh); ctx.stroke(); } } }
function interiorFloor(c1, c2) { const y = R.floor - 10; ctx.fillStyle = lg(0, y, 0, VH, [c1, c2]); ctx.fillRect(0, y, VW, VH - y); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 3; for (let wx = Math.floor(camX / 120) * 120; wx < camX + VW + 120; wx += 120) { ctx.beginPath(); ctx.moveTo(wx - camX, y); ctx.lineTo(wx - camX - 40, VH); ctx.stroke(); } ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, y, VW, 8); }
// pintor estándar de una sala de exterior de planeta
function outdoor(p, seed, extra) { const f = function (l) { if (l === 'lejos') { skyPaint(p); farPaint(p); return; } if (l === 'pared') { extra && extra.pared && extra.pared(); return; } if (l === 'suelo') { groundPaint(p, extra && extra.lava && extra.lava[0], extra && extra.lava && extra.lava[1], extra && extra.bridge && extra.bridge()); return; } if (l === 'delante') return frontPaint(p, seed); }; f.out = true; f.extra = extra && extra.lava ? () => groundPaint(p, extra.lava[0], extra.lava[1], extra.bridge && extra.bridge(), true) : null; return f; }

/* ---------- fachadas, carteles y la nave aterrizada ---------- */
function drawSign(h) { const D = h.door, sx = h.x - camX, y = R.floor; if (sx < -200 || sx > VW + 200) return; const left = D.dir < 0;
  ctx.fillStyle = '#7a4a2a'; ctx.fillRect(sx - 7, y - 190, 14, 190); ctx.save(); ctx.translate(sx, y - 170); ctx.fillStyle = '#c88a4a'; ctx.beginPath(); if (left) { ctx.moveTo(-110, 0); ctx.lineTo(-80, -34); ctx.lineTo(90, -34); ctx.lineTo(90, 34); ctx.lineTo(-80, 34); } else { ctx.moveTo(110, 0); ctx.lineTo(80, -34); ctx.lineTo(-90, -34); ctx.lineTo(-90, 34); ctx.lineTo(80, 34); } ctx.closePath(); ctx.fill(); stroke('#3a2010', 4);
  ctx.fillStyle = '#2a1408'; ctx.font = '800 22px "Baloo 2",system-ui'; ctx.textAlign = 'center'; ctx.fillText(D.label || '', left ? 5 : -5, 8); ctx.restore();
  const a = 0.5 + 0.5 * Math.sin(time * 5); ctx.fillStyle = 'rgba(255,230,80,' + a + ')'; ctx.font = '900 34px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(left ? '◀' : '▶', sx + (left ? -60 : 60), y - 230); }
function drawShip(x) { const sx = x - camX, y = R.floor, im = opt('obj-nave'); if (sx < -500 || sx > VW + 500) return;
  if (im) { const h = 420, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, sx - w / 2, y - h + 10, w, h); return; }
  ctx.fillStyle = '#4a5a8a'; ctx.fillRect(sx - 150, y - 60, 16, 60); ctx.fillRect(sx + 134, y - 60, 16, 60);
  ctx.fillStyle = lg(0, y - 330, 0, y - 60, ['#e8f0ff', '#8a9ac8', '#3a4a7a']); ctx.beginPath(); ctx.ellipse(sx, y - 170, 260, 120, 0, 0, 7); ctx.fill(); stroke();
  ctx.fillStyle = '#29e6ff'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.ellipse(sx, y - 250, 110, 60, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; stroke();
  ctx.fillStyle = '#ff5a6a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx + s * 230, y - 160); ctx.lineTo(sx + s * 320, y - 60); ctx.lineTo(sx + s * 200, y - 100); ctx.fill(); stroke(); }
  ctx.font = '900 30px Orbitron'; ctx.textAlign = 'center'; ctx.fillStyle = '#1a2a6a'; ctx.fillText('ESTRELLA AZUL', sx, y - 150);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#ffd23c', '#35ff8a', '#29e6ff'][(i + Math.floor(time * 3)) % 3]; ctx.beginPath(); ctx.arc(sx - 200 + i * 80, y - 110, 7, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#5a6aa0'; ctx.beginPath(); ctx.moveTo(sx - 60, y - 70); ctx.lineTo(sx + 60, y - 70); ctx.lineTo(sx + 90, y); ctx.lineTo(sx - 90, y); ctx.fill(); stroke(); }
function shipHot(x) { return { id: 'nave', x, w: 300, h: 300, ic: '🚀', draw: () => drawShip(x), act() { choose('¿Vuelves a la nave?', [{ e: '🚀', t: 'Sí, a la nave' }, { e: '✋', t: 'Me quedo aquí' }], i => { if (i === 0) travelTo('puente'); }); } }; }
function facade(kind, x, label) { const sx = x - camX, y = R.floor; if (sx < -500 || sx > VW + 500) return; const im = opt('casa-' + kind); if (im) { const h = 480, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, sx - w / 2, y - h + 6, w, h); return; }
  if (kind === 'iglu' || kind === 'iglu-tienda') { ctx.fillStyle = lg(0, y - 360, 0, y, ['#ffffff', '#cfe6f8']); ctx.beginPath(); ctx.ellipse(sx, y, 280, 330, 0, Math.PI, 0); ctx.fill(); stroke('#7aa0c8', 5); ctx.strokeStyle = 'rgba(120,160,200,.6)'; ctx.lineWidth = 3; for (let r = 1; r < 6; r++) { const yy = y - r * 58; const hw = 280 * Math.sqrt(1 - Math.pow((y - yy) / 330, 2)); ctx.beginPath(); ctx.moveTo(sx - hw, yy); ctx.lineTo(sx + hw, yy); ctx.stroke(); } }
  if (kind === 'iglu-tienda') { ctx.fillStyle = '#ff5ad8'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(sx - 210 + i * 60, y - 300); ctx.lineTo(sx - 180 + i * 60, y - 250); ctx.lineTo(sx - 150 + i * 60, y - 300); ctx.fill(); } }
  if (kind === 'forja' || kind === 'tienda-fuego') { ctx.fillStyle = kind === 'forja' ? '#5a4a4a' : '#6a3a5a'; ctx.fillRect(sx - 260, y - 360, 520, 360); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; for (let yy = y - 360; yy < y; yy += 45) { ctx.beginPath(); ctx.moveTo(sx - 260, yy); ctx.lineTo(sx + 260, yy); ctx.stroke(); }
    ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.moveTo(sx - 300, y - 360); ctx.lineTo(sx, y - 470); ctx.lineTo(sx + 300, y - 360); ctx.fill(); stroke();
    if (kind === 'forja') { ctx.fillStyle = '#3a3030'; ctx.fillRect(sx + 140, y - 520, 60, 120); for (let i = 0; i < 4; i++) { const t = (time * 0.4 + i / 4) % 1; ctx.fillStyle = 'rgba(90,80,80,' + (0.5 * (1 - t)) + ')'; ctx.beginPath(); ctx.arc(sx + 170 + Math.sin(t * 5) * 20, y - 530 - t * 160, 20 + t * 40, 0, 7); ctx.fill(); } } }
  if (kind === 'cabana' || kind === 'tienda-selva') { ctx.fillStyle = '#8a5a2a'; ctx.fillRect(sx - 250, y - 330, 500, 330); ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 4; for (let xx = sx - 250; xx < sx + 250; xx += 40) { ctx.beginPath(); ctx.moveTo(xx, y - 330); ctx.lineTo(xx, y); ctx.stroke(); }
    ctx.fillStyle = kind === 'cabana' ? '#c8a040' : '#d07a30'; ctx.beginPath(); ctx.moveTo(sx - 320, y - 320); ctx.lineTo(sx, y - 500); ctx.lineTo(sx + 320, y - 320); ctx.fill(); stroke('#5a3a10', 5); ctx.strokeStyle = 'rgba(90,60,10,.6)'; ctx.lineWidth = 3; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(sx - 320 + i * 53, y - 320); ctx.lineTo(sx, y - 500); ctx.stroke(); } }
  if (kind === 'templo') { ctx.fillStyle = '#8a8a6a'; for (let i = 0; i < 4; i++) { ctx.fillRect(sx - 360 + i * 40, y - 120 - i * 110, 720 - i * 80, 120); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; ctx.strokeRect(sx - 360 + i * 40, y - 120 - i * 110, 720 - i * 80, 120); } emo('🗿', x - 260, y - 10, 90); emo('🗿', x + 260, y - 10, 90); }
  if (label) { ctx.font = '800 26px "Baloo 2",system-ui'; ctx.textAlign = 'center'; const tw = ctx.measureText(label).width + 40; ctx.fillStyle = '#0a0e22'; rr(sx - tw / 2, y - 420, tw, 40, 12); ctx.fill(); stroke('#ffd23c', 3); ctx.fillStyle = '#ffe680'; ctx.fillText(label, sx, y - 391); } }
const casaDoor = (id, to, tx, col, col2, w = 170, h = 250) => dk(id, to, tx, '', null, { style: 'casa', col, col2, w, h });
const camino = (id, to, tx, label, dir) => dk(id, to, tx, label, null, { style: 'camino', dir });

/* ---------- gorros de Lucas ---------- */
function drawHat(h) { const k = G.hat || (F('gorro') ? 'gorro' : null); if (!k) return; const hy = -h + 4;
  const HI = k !== 'gafas' && opt('item-' + k); if (HI) { const W = h * 0.62, H2 = W * HI.naturalHeight / HI.naturalWidth; ctx.save(); ctx.translate(0, -h + h * 0.2 - H2 * 0.45); ctx.rotate(Math.sin(time * 2.5) * 0.03); ctx.scale(k === 'gorro' ? -1 : 1, 1); ctx.drawImage(HI, -W / 2, -H2 / 2, W, H2); ctx.restore(); return; }
  if (k === 'gorro') { ctx.fillStyle = '#ff3a6a'; ctx.beginPath(); ctx.arc(0, hy + 6, 30, Math.PI, 0); ctx.fill(); stroke('#0a0e22', 3); ctx.fillStyle = '#ffd23c'; ctx.fillRect(-36, hy + 2, 72, 8); ctx.fillRect(-2, hy - 34, 4, 14); const pw = Math.cos(time * 20) * 34; ctx.fillStyle = '#29e6ff'; ctx.fillRect(-Math.abs(pw), hy - 38, Math.abs(pw) * 2, 6); }
  else if (k === 'lana') { ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.arc(0, hy + 8, 34, Math.PI, 0); ctx.fill(); stroke('#0a0e22', 3); ctx.fillStyle = '#fff'; ctx.fillRect(-38, hy + 2, 76, 12); ctx.beginPath(); ctx.arc(0, hy - 28, 12, 0, 7); ctx.fill(); }
  else if (k === 'gafas') { ctx.fillStyle = '#0a0e22'; ctx.fillRect(-46, -h * 0.72, 92, 8); ctx.beginPath(); ctx.ellipse(-24, -h * 0.68, 22, 16, 0, 0, 7); ctx.ellipse(24, -h * 0.68, 22, 16, 0, 0, 7); ctx.fill(); }
  else if (k === 'sombrero') { ctx.fillStyle = '#c8943a'; ctx.beginPath(); ctx.ellipse(0, hy + 8, 62, 14, 0, 0, 7); ctx.fill(); stroke('#4a2a10', 3); ctx.beginPath(); ctx.ellipse(0, hy - 10, 32, 26, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-32, hy - 12, 64, 18); stroke('#4a2a10', 3); ctx.fillStyle = '#7a3a10'; ctx.fillRect(-32, hy - 2, 64, 8); }
  else if (k === 'corona') { ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.moveTo(-34, hy + 8); for (let i = 0; i < 5; i++) { ctx.lineTo(-34 + i * 17, hy - 22 + (i % 2) * 18); } ctx.lineTo(34, hy + 8); ctx.closePath(); ctx.fill(); stroke('#8a5a00', 3); ctx.fillStyle = '#ff3a6a'; ctx.beginPath(); ctx.arc(0, hy - 2, 6, 0, 7); ctx.fill(); } }

/* ---------- viajar entre la nave y los planetas ---------- */
function travelTo(dest, x) {
  const pl = dest === 'puente' ? null : dest, to = dest === 'puente' ? ['puente', 1000] : [dest + '-nave', x || 700];
  if (dest !== 'puente') { G.flags['visto_' + dest] = 1; save(); setTimeout(() => givePeg('nave', true), 4500); }
  SFX.warp(); TR = { ph: 'out', t: 0, cx: VW / 2, cy: VH / 2, D: { to: '__viaje', dest: to, pl } };
}
function drawViaje() {
  const t = SCENE.t, p = SCENE.pl, k = Math.min(1, t / SCENE.dur); ctx.fillStyle = '#03040e'; ctx.fillRect(0, 0, VW, VH);
  ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 120; i++) { const a = i * 2.4, sp = ((t * (0.6 + (i % 5) * 0.2) + i * 0.013) % 1), r = sp * 900; ctx.strokeStyle = 'rgba(200,230,255,' + sp + ')'; ctx.lineWidth = 1 + sp * 3; ctx.beginPath(); ctx.moveTo(640 + Math.cos(a) * r * 0.8, 360 + Math.sin(a) * r * 0.5); ctx.lineTo(640 + Math.cos(a) * (r * 0.8 + 40 * sp), 360 + Math.sin(a) * (r * 0.5 + 25 * sp)); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over';
  const col = p ? PL[p].planet : '#8a9ac8', pr = 30 + k * k * 420; const g = ctx.createRadialGradient(980 - pr * 0.3, 260 - pr * 0.3, pr * 0.1, 980, 260, pr); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, '#0a0a20'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(980, 260, pr, 0, 7); ctx.fill();
  const bx = 460 + Math.sin(t * 3) * 10, by = 400 + Math.sin(t * 2) * 14; ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.08);
  ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const fl = 80 + Math.random() * 40; const gg = ctx.createLinearGradient(-170, 0, -170 - fl, 0); gg.addColorStop(0, 'rgba(120,255,240,.9)'); gg.addColorStop(1, 'rgba(41,120,255,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-160, -20 + i * 20); ctx.lineTo(-170 - fl, -6 + i * 20); ctx.lineTo(-160, 8 + i * 20); ctx.fill(); } ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = lg(0, -80, 0, 80, ['#e8f0ff', '#8a9ac8', '#3a4a7a']); ctx.beginPath(); ctx.ellipse(0, 0, 180, 70, 0, 0, 7); ctx.fill(); stroke(); ctx.fillStyle = 'rgba(41,230,255,.8)'; ctx.beginPath(); ctx.ellipse(60, -30, 70, 34, 0, Math.PI, 0); ctx.fill(); stroke();
  const im = IMG['lucas-quieto']; if (ok(im)) { const h = 70, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, 60 - w / 2, -30 - h + 8, w, h); }
  ctx.restore();
  ctx.font = '800 34px "Baloo 2"'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe680'; ctx.fillText(p ? (p === 'tierra' ? 'Volviendo a casa…' : 'Viajando al ' + PL[p].t + '…') : 'Volviendo a la nave…', 640, 90);
  const w0 = Math.max(0, 1 - t * 2); if (w0 > 0) { ctx.fillStyle = 'rgba(255,255,255,' + w0 + ')'; ctx.fillRect(0, 0, VW, VH); }
}
function planetMenu() {
  const done = p => F('cr_' + p), opts = ['hielo', 'fuego', 'selva'].map(p => ({ e: done(p) ? '✅' : PL[p].e, t: PL[p].t }));
  if (crystals() === 3) opts.push({ e: '🌍', t: '¡A casa!' });
  choose('¿Adónde viajamos?', opts.concat([{ e: '✋', t: 'Ahora no' }]), i => { const list = ['hielo', 'fuego', 'selva']; if (i < 3) return travelTo(list[i]); if (crystals() === 3 && i === 3) return capiPlanetas(); });
}
const crystals = () => ['hielo', 'fuego', 'selva'].filter(p => F('cr_' + p)).length;
function capiPlanetas() {
  const n = crystals();
  if (F('fin5')) return say([['capi', '¡Gracias por traernos a casa, Lucas!'], ['capi', 'Puedes volver a los planetas cuando quieras.']]);
  if (n === 3) return say([['capi', '¡Lucas! ¡Tenemos los tres cristales!'], ['capi', 'Voy a ponerlos en el motor de la nave.'], ['narr', 'Los tres cristales brillan con mucha fuerza.'], ['capi', '¡Ya podemos volver a casa!']], () => { FX.flash = 1.2; SFX.power(); setTimeout(() => travelTo('tierra', 600), 1200); });
  const falta = ['hielo', 'fuego', 'selva'].filter(p => !F('cr_' + p)).map(p => 'el ' + PL[p].t).join(' y ');
  say([['capi', n === 0 ? 'Usa la pantalla grande para viajar a un planeta.' : '¡Muy bien! Ya tenemos ' + n + (n === 1 ? ' cristal.' : ' cristales.')], ['capi', 'Nos falta ' + falta + '.'], ['capi', 'Toca la pantalla grande para viajar.']]);
}
function getCrystal(p) {
  setF('cr_' + p); const cap = crystals() + 1; SFX.win(); FX.flash = 1; L.cheer = 2; evt('cristal', p);
  say([['narr', '¡Lucas ha encontrado el cristal de energía!'], ['lucas', '¡Bien! ¡Lo tengo!']], () => {
    const m = $('modal'), n = crystals(); m.innerHTML = '<div class="card" style="border-color:var(--gold)"><h2 style="color:var(--gold)">¡CAPÍTULO ' + cap + ' COMPLETADO!</h2><div style="font-size:80px">💎</div><div style="font-size:24px">Cristales: ' + n + ' de 3</div><div style="color:#9fb4ff">' + (n === 3 ? '¡Vuelve a la nave y habla con la capitana!' : 'Vuelve a la nave para viajar a otro planeta.') + '</div><button class="btn gold" id="finOk">¡GENIAL!</button></div>';
    m.classList.add('on'); speak('¡Capítulo ' + ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco'][cap] + ' completado! Ya tienes ' + n + (n === 1 ? ' cristal.' : ' cristales.')); $('finOk').onclick = () => { m.classList.remove('on'); shutUp(); };
  });
}
function crystalHot(p, x, y, cap) { return { id: 'cristal', x, w: 120, h: 130, y: y - 130, ic: '💎', vis: () => !F('cr_' + p), draw() { const im = opt('obj-cristal'), b = Math.sin(time * 3) * 8; if (!PREVIEW) glow(x - camX, y - 60 + b, 140, 'rgba(120,240,255,A)', 0.5 + 0.2 * Math.sin(time * 4)); if (im) { ctx.drawImage(im, x - camX - 50, y - 120 + b, 100, 110); return; } emo('💎', x, y - 10 + b, 100); }, act() { getCrystal(p); } }; }

/* ---------- pegatinas (álbum) y misiones (diario) ---------- */
const PEGS = [
  ['nave', '🚀', 'La nave'], ['bolita', '🧹', 'Bolita'], ['chef', '🍎', 'Chef Tuercas'], ['capi', '⭐', 'Capitana'],
  ['pinguino', '🐧', 'Pingo'], ['yeti', '🧣', 'Yeti Tito'], ['copo', '❄️', 'Copo de nieve'], ['muneco', '⛄', 'Muñeco de nieve'], ['pez', '🐟', 'Pez de hielo'],
  ['dragon', '🐲', 'Fueguito'], ['herrero', '🔨', 'Herrero Magma'], ['flor', '🌺', 'Flor de fuego'], ['volcan', '🌋', 'Volcán'], ['lava', '🔥', 'Lava'],
  ['mono', '🐒', 'Mono Sabio'], ['rana', '🐸', 'Rana Rita'], ['loro', '🦜', 'Loro Coco'], ['templo', '🗿', 'Templo'], ['platano', '🍌', 'Plátano dorado'],
  ['tierra', '🌍', 'La Tierra'], ['familia', '❤️', 'La familia'], ['secreto', '🦄', 'Unicornio secreto']
];
function givePeg(id, quiet) { G.peg = G.peg || {}; if (G.peg[id]) return false; G.peg[id] = 1; save(); SFX.chip(); const p = PEGS.find(x => x[0] === id); (FX.pop = FX.pop || []).push({ x: L.x, y: L.y - 260, t: 1.5, s: '¡PEGATINA!' }); if (!quiet) say([['narr', '¡Has conseguido una pegatina nueva para tu álbum! ' + (p ? p[2] + '.' : '')]]); return true; }
function album() {
  const m = $('modal'), got = G.peg || {}, n = PEGS.filter(p => got[p[0]]).length;
  m.innerHTML = '<div class="card wide"><h2>MI ÁLBUM DE PEGATINAS</h2><div style="font-size:20px;color:#ffe680">' + n + ' de ' + PEGS.length + '</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">' + PEGS.map(p => '<div style="width:96px;height:96px;border-radius:16px;border:3px solid ' + (got[p[0]] ? '#ffd23c' : '#2a3460') + ';display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + (got[p[0]] ? 'rgba(255,210,60,.12)' : 'rgba(0,0,0,.3)') + '"><span style="font-size:44px;' + (got[p[0]] ? '' : 'filter:brightness(0) opacity(.35)') + '">' + p[1] + '</span><small style="font-size:12px">' + (got[p[0]] ? p[2] : '?') + '</small></div>').join('') + '</div><button class="btn" id="alX">CERRAR</button></div>';
  m.classList.add('on'); speak('Tienes ' + n + ' pegatinas de ' + PEGS.length + '.'); $('alX').onclick = () => { m.classList.remove('on'); shutUp(); };
}
const INV_N = it => G.inv.filter(x => x === it).length;
const MIS = [
  ['1', 'Arreglar la nave', () => F('energia'), () => true],
  ['1', 'Despertar a la capitana', () => F('fin1'), () => F('energia') || F('capiIntento')],
  ['1', 'Devolver la escoba a Bolita', () => F('bolitaFeliz'), () => F('bolitaHola')],
  ['1', 'Romper la caja de hierro', () => F('cajaRota'), () => G.seen.pasillo],
  ['hielo', 'Conseguir el cristal del Planeta Escarcha', () => F('cr_hielo'), () => F('visto_hielo')],
  ['hielo', 'Tejer una bufanda para el yeti', () => F('yetiFeliz'), () => F('yetiHola')],
  ['hielo', 'Ponerle nariz al muñeco de nieve', () => F('munecoOk'), () => F('munecoHola')],
  ['hielo', 'Pescar un pez para Pingo', () => F('pingoFeliz'), () => F('pingoHola')],
  ['fuego', 'Conseguir el cristal del Planeta Volcán', () => F('cr_fuego'), () => F('visto_fuego')],
  ['fuego', 'Quitarle el hipo al herrero', () => F('hipoOk'), () => F('herreroHola')],
  ['fuego', 'Arreglar el puente de la lava', () => F('puenteOk'), () => F('vioPuente')],
  ['fuego', 'Dar una chuche a Fueguito', () => F('dragonFeliz'), () => F('dragonHola')],
  ['fuego', 'Buscar 5 flores de fuego para Florinda', () => F('floresOk'), () => F('florindaHola')],
  ['selva', 'Conseguir el cristal del Planeta Jungla', () => F('cr_selva'), () => F('visto_selva')],
  ['selva', 'Abrir la puerta del templo', () => F('temploOk'), () => F('vioTemplo')],
  ['selva', 'Llevar el plátano dorado al Mono Sabio', () => F('monoFeliz'), () => F('monoHola')],
  ['selva', 'Encontrar las 3 ranitas de Rita', () => F('ranaFeliz'), () => F('ranaHola')],
  ['selva', 'Jugar con el loro Coco', () => F('loroOk'), () => F('loroHola')],
  ['5', 'Volver a casa con los tres cristales', () => F('fin5'), () => crystals() > 0]
];
function diario() {
  const m = $('modal'), act = MIS.filter(x => x[3]()), sec = { '1': 'LA NAVE', hielo: 'PLANETA ESCARCHA', fuego: 'PLANETA VOLCÁN', selva: 'PLANETA JUNGLA', '5': 'VUELTA A CASA' };
  let html = '', last = ''; act.forEach(x => { if (x[0] !== last) { last = x[0]; html += '<div style="color:#29e6ff;font:900 16px Orbitron;margin-top:6px">' + sec[x[0]] + '</div>'; } html += '<div style="font-size:21px;text-align:left;width:100%;' + (x[2]() ? 'color:#35ff8a' : '') + '">' + (x[2]() ? '✅ ' : '⭐ ') + x[1] + '</div>'; });
  const todo = act.filter(x => !x[2]()).length;
  m.innerHTML = '<div class="card wide" style="align-items:flex-start"><h2 style="align-self:center">MIS MISIONES</h2>' + html + '<div style="align-self:center;color:#ffe680;font-size:18px">Chips: ' + Object.keys(G.chips).length + ' · Pegatinas: ' + Object.keys(G.peg || {}).length + ' de ' + PEGS.length + '</div><button class="btn" id="diX" style="align-self:center">CERRAR</button></div>';
  m.classList.add('on'); speak(todo ? 'Tienes ' + todo + (todo === 1 ? ' misión por hacer.' : ' misiones por hacer.') : '¡Has hecho todas las misiones que conoces!'); $('diX').onclick = () => { m.classList.remove('on'); shutUp(); };
}

/* =====================================================================
   CAPÍTULO 2 · PLANETA ESCARCHA (hielo)
   Misión: el yeti tiene frío y tapa la cueva del cristal. La abuela Pingüi teje una bufanda
   con 3 ovillos: azul (muñeco de nieve), verde (lago, en lo alto) y rojo (tienda o premio de Pingo).
   ===================================================================== */
const ovillos = () => ['ovillo-azul', 'ovillo-verde', 'ovillo-rojo'].filter(has).length;
room('hielo-nave', { pl: 'hielo', name: 'ATERRIZAJE', W: 2300,
  plat: [[1000, 520, 130, 'hielo'], [1160, 420, 130, 'hielo'], [1560, 470, 140, 'hielo'], [1760, 360, 140, 'hielo']],
  coins: [[1000, 470], [1160, 370], [1560, 420], [1760, 310], [600, 560], [2000, 560]], chip: [1830, 260],
  paint: outdoor('hielo', 3),
  hot: [shipHot(450),
    { id: 'muneco', x: 1350, w: 160, h: 230, ic: '👁', draw() { const sx = 1350; drawThingE('muneco' + (F('munecoOk') ? '-ok' : ''), sx, R.floor, '⛄', 220); if (!F('munecoOk')) { ctx.fillStyle = '#2a3460'; ctx.font = '800 20px "Baloo 2"'; ctx.textAlign = 'center'; } },
      act() { setF('munecoHola');
        if (F('munecoOk')) return say([['narr', 'El muñeco de nieve sonríe con su nariz nueva.']]);
        if (has('zanahoria')) return say([['lucas', '¡Te pongo una nariz de zanahoria!']], () => { take('zanahoria'); setF('munecoOk'); SFX.win(); say([['narr', '¡El muñeco de nieve está muy contento!'], ['narr', 'Dentro de su bufanda había un ovillo de lana azul.']], () => { give('ovillo-azul'); givePeg('muneco', true); }); });
        say([['lucas', 'Un muñeco de nieve.'], ['lucas', '¡Pero no tiene nariz! Qué triste.'], ['lucas', 'Le vendría bien una zanahoria.']]); } },
    { id: 'hNave2', x: 2200, w: 200, h: 220, ic: '🚶', door: camino('hn2', 'hielo-pueblo', 200, 'PUEBLO', 1), draw() { drawSign(this); } },
    thing('cartel', 760, 620, '🪧', 120, { act() { say([['narr', 'Bienvenido al Planeta Escarcha. Aquí siempre nieva.']]); } })
  ],
  enter() { if (!G.seen.hielo) { G.seen.hielo = 1; save(); say([['narr', '¡La nave ha aterrizado en el Planeta Escarcha!'], ['lucas', '¡Qué frío hace aquí!'], ['narr', 'En algún lugar de este planeta está el cristal de energía.']]); } }
});
room('hielo-pueblo', { pl: 'hielo', name: 'EL PUEBLO DE HIELO', W: 2900,
  plat: [[1900, 500, 130, 'hielo'], [2050, 400, 130, 'hielo']], coins: [[1900, 450], [2050, 350], [400, 560], [1300, 560], [2500, 560]], chip: [2050, 300],
  paint: outdoor('hielo', 7),
  hot: [{ id: 'hp1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('hp1', 'hielo-nave', 2050, 'NAVE', -1), draw() { drawSign(this); } },
    { id: 'hpIglu', x: 650, w: 170, h: 250, ic: '🚪', door: casaDoor('hpiglu', 'hielo-iglu', 220, '#9cc8e8', '#5a8ab8'), draw() { facade('iglu', 650, 'CASA DE LA ABUELA'); drawDoor(this); } },
    npc('pingo', 'PINGO', 1050, '🐧', 150, pingo),
    { id: 'hpTie', x: 1550, w: 170, h: 250, ic: '🚪', door: casaDoor('hptie', 'hielo-tienda', 220, '#ff5ad8', '#a03a8a'), draw() { facade('iglu-tienda', 1550, 'TIENDA DE COPO'); drawDoor(this); } },
    { id: 'hp2', x: 2350, w: 200, h: 220, ic: '🚶', door: camino('hp2', 'hielo-lago', 200, 'LAGO', 1), draw() { drawSign(this); } },
    { id: 'hp3', x: 2780, w: 200, h: 220, ic: '🚶', door: camino('hp3', 'hielo-cueva-fuera', 200, 'CUEVA', 1), draw() { drawSign(this); } }
  ],
  enter() { if (!G.seen.hpueblo) { G.seen.hpueblo = 1; save(); say([['narr', 'Este es el pueblo de hielo. ¡Las casas son iglús!']]); } }
});
function pingo() {
  setF('pingoHola');
  if (F('pingoFeliz')) return say([['pingo', '¡Gracias por el pez, Lucas!'], ['pingo', '¡Eres mi mejor amigo!']]);
  if (has('pez')) return say([['lucas', '¡Pingo! ¡Te traigo un pez!'], ['pingo', '¡Un pez! ¡Me encanta!'], ['pingo', 'Te doy un regalo. ¿Cuál quieres?']], () => { take('pez'); setF('pingoFeliz'); givePeg('pinguino', true);
    choose('¿Qué regalo eliges?', [{ e: '🧶', t: 'Ovillo rojo' }, { e: '🪙', t: '6 monedas' }], i => { if (i === 0) { give('ovillo-rojo'); say([['pingo', 'Es el ovillo de mi abuela. ¡Para ti!']]); } else { addCoins(6); say([['pingo', '¡Toma, seis monedas!']]); } }); });
  if (!F('pingoHablo')) { setF('pingoHablo'); return say([['pingo', '¡Hola! Soy Pingo.'], ['pingo', 'Tengo mucha hambre.'], ['pingo', 'Me encantan los peces del lago.'], ['pingo', 'Pero no sé pescar.']]); }
  say([['pingo', '¿Me traes un pez del lago?'], ['pingo', 'En la tienda venden cañas de pescar.']]);
}
room('hielo-iglu', { pl: 'hielo', name: 'CASA DE LA ABUELA PINGÜI', W: 1500,
  plat: [[1050, 420, 300, 'estante']], coins: [[1000, 370], [500, 560]], chip: [1150, 360],
  paint(l) { if (l === 'lejos') return; if (l === 'pared') { bricks('#e8f4ff', '#a8c8e8', 120, 60, 'rgba(120,160,200,.5)'); ctx.fillStyle = '#c8502a'; rr(700 - camX - 100, R.floor - 220, 200, 220, 20); ctx.fill(); stroke(); ctx.fillStyle = '#1a0a04'; rr(700 - camX - 60, R.floor - 150, 120, 150, 12); ctx.fill(); for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#ffd23c', '#ff7a2a', '#ff3a1a'][i % 3]; ctx.beginPath(); ctx.ellipse(700 - camX - 30 + i * 20, R.floor - 30 - Math.abs(Math.sin(time * 6 + i)) * 30, 14, 34, 0, 0, 7); ctx.fill(); } if (!PREVIEW) glow(700 - camX, R.floor - 60, 220, 'rgba(255,140,40,A)', 0.25); return; } if (l === 'suelo') return interiorFloor('#c89a6a', '#7a5a3a'); },
  hot: [{ id: 'hiDoor', x: 220, w: 170, h: 250, ic: '🚪', door: casaDoor('hidoor', 'hielo-pueblo', 650, '#9cc8e8', '#5a8ab8'), draw() { drawDoor(this); } },
    npc('abuela', 'ABUELA PINGÜI', 450, '🐧', 170, abuela),
    thing('tetera', 960, 420, '🫖', 70, { act() { say([['lucas', 'Una tetera. Huele a chocolate caliente.']]); } }),
    thing('libros', 1040, 420, '📚', 70, { act() { say([['lucas', 'Libros de recetas de pescado.']]); } }),
    thing('zanahoria', 1110, 420, '🥕', 60, { ic: '✋', vis: () => !F('zanahoria'), act() { setF('zanahoria'); give('zanahoria'); say([['lucas', '¡Una zanahoria escondida entre las cosas!']]); } }),
    thing('osito', 1180, 420, '🧸', 70, { act() { say([['lucas', 'Un osito de peluche muy blandito.']]); } }),
    thing('cuadro', 1350, 560, '🖼️', 90, { act() { if (givePeg('copo', true)) say([['lucas', '¡Detrás del cuadro había una pegatina!']]); else say([['lucas', 'Un cuadro de un copo de nieve.']]); } })
  ],
  enter() { if (!G.seen.higlu) { G.seen.higlu = 1; save(); say([['narr', 'Dentro del iglú se está muy calentito.']]); } }
});
function abuela() {
  if (F('bufanda') || F('yetiFeliz')) return say([['abuela', '¿Le gustó la bufanda al yeti?'], ['abuela', 'Vuelve cuando quieras, Lucas.']]);
  const n = ovillos();
  if (n === 3) return say([['lucas', '¡Abuela! ¡Tengo los tres ovillos!'], ['abuela', '¡Qué bien! Voy a tejer ahora mismo.'], ['narr', 'La abuela teje muy rápido.'], ['abuela', '¡Ya está! Una bufanda de colores.']], () => { ['ovillo-azul', 'ovillo-verde', 'ovillo-rojo'].forEach(take); setF('bufanda'); give('bufanda'); });
  if (!F('abuelaHola')) { setF('abuelaHola'); return say([['abuela', '¡Hola, pequeño robot! Soy la abuela Pingüi.'], ['abuela', 'Me encanta tejer bufandas.'], ['abuela', 'Si alguien tiene frío, puedo tejerle una.'], ['abuela', 'Pero necesito tres ovillos de lana.'], ['abuela', 'Uno azul, uno verde y uno rojo.']]); }
  say([['abuela', 'Tráeme tres ovillos de lana.'], ['abuela', 'Azul, verde y rojo. Ya tienes ' + n + '.']]);
}
room('hielo-tienda', { pl: 'hielo', name: 'TIENDA DE COPO', W: 1300,
  plat: [[1100, 380, 200, 'estante']], coins: [[1100, 330]], chip: [1180, 300],
  paint(l) { if (l === 'lejos') return; if (l === 'pared') { bricks('#f0e8ff', '#c8b0e8', 120, 60, 'rgba(160,120,200,.4)'); for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#ff5ad8', '#ffd23c', '#29e6ff'][i % 3]; ctx.beginPath(); ctx.moveTo(i * 170 - camX * 0.0, 40); ctx.lineTo(i * 170 + 40, 40); ctx.lineTo(i * 170 + 20, 90); ctx.fill(); } return; } if (l === 'suelo') return interiorFloor('#b0a0d0', '#6a5a8a'); },
  hot: [{ id: 'htDoor', x: 220, w: 170, h: 250, ic: '🚪', door: casaDoor('htdoor', 'hielo-pueblo', 1550, '#ff5ad8', '#a03a8a'), draw() { drawDoor(this); } },
    { id: 'mostrH', x: 760, w: 460, h: 150, ic: '🛒', draw() { drawNPC('copo', 760, '🐻‍❄️', 200, R.floor - 90); drawProp('mostrador', 760); }, act() { NAMES.copo = 'COPO'; if (!F('copoHola')) { setF('copoHola'); return say([['copo', '¡Hola! Soy Copo, el oso polar.'], ['copo', 'Mira qué cosas tengo.']], () => shopOf('copo', 'TIENDA DE COPO', SHOP_HIELO)); } shopOf('copo', 'TIENDA DE COPO', SHOP_HIELO); } }
  ]
});
const SHOP_HIELO = [
  { id: 'cana', e: '🎣', t: 'Caña de pescar', p: 6, d: 'Para pescar en el lago.', show: () => !has('cana') && !F('pescado'), msg: 'Una caña de pescar. ¡Prueba en el agujero del lago!' },
  { id: 'ovillo-rojo', e: '🧶', t: 'Ovillo rojo', p: 5, d: 'Lana roja para tejer.', show: () => !has('ovillo-rojo') && !F('bufanda'), msg: 'Un ovillo de lana roja.' },
  { id: 'lana', e: '🧢', t: 'Gorro de lana', p: 4, d: 'Un gorro calentito.', show: () => !F('hat_lana') }
];
room('hielo-lago', { pl: 'hielo', name: 'EL LAGO HELADO', W: 2500,
  plat: [[1500, 510, 130, 'hielo'], [1680, 410, 130, 'hielo'], [1860, 310, 130, 'hielo'], [2050, 230, 150, 'hielo']], coins: [[1500, 460], [1680, 360], [1860, 260], [700, 560], [900, 560]], chip: [2300, 560],
  paint: outdoor('hielo', 11, { pared() { const a = 500 - camX, b = 1350 - camX; ctx.fillStyle = 'rgba(160,220,255,.6)'; ctx.beginPath(); ctx.ellipse((a + b) / 2, R.floor + 20, (b - a) / 2, 40, 0, 0, 7); ctx.fill(); } }),
  hot: [{ id: 'hl1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('hl1', 'hielo-pueblo', 2250, 'PUEBLO', -1), draw() { drawSign(this); } },
    { id: 'agujero', x: 950, w: 200, h: 120, ic: '🎣', draw() { ctx.fillStyle = '#1a4a8a'; ctx.beginPath(); ctx.ellipse(950 - camX, R.floor + 4, 80, 18, 0, 0, 7); ctx.fill(); stroke('#ffffff', 4); },
      act() { if (has('cana')) return say([['lucas', '¡Voy a pescar!'], ['narr', 'Lucas espera un poquito...'], ['narr', '¡Ha picado un pez!']], () => { take('cana'); setF('pescado'); give('pez'); givePeg('pez', true); }); if (F('pescado')) return say([['lucas', 'Ya he pescado un pez.']]); say([['lucas', 'Un agujero en el hielo.'], ['lucas', 'Se ven peces nadando debajo.'], ['lucas', 'Necesito una caña para pescar.']]); } },
    thing('ovillo-verde', 2050, 230, '🧶', 64, { ic: '✋', vis: () => !F('ovVerde'), act() { setF('ovVerde'); give('ovillo-verde'); say([['lucas', '¡Un ovillo de lana verde!']]); } })
  ],
  enter() { if (!G.seen.hlago) { G.seen.hlago = 1; save(); say([['narr', 'El lago está congelado. ¡Mira qué bloques de hielo!']]); } }
});
room('hielo-cueva-fuera', { pl: 'hielo', name: 'LA ENTRADA DE LA CUEVA', W: 1900,
  plat: [[600, 500, 130, 'hielo']], coins: [[600, 450], [900, 560]], chip: [600, 380],
  paint: outdoor('hielo', 13, { pared() { const sx = 1450 - camX; ctx.fillStyle = '#7aa0c8'; ctx.beginPath(); ctx.moveTo(sx - 380, R.floor); ctx.lineTo(sx - 260, R.floor - 420); ctx.lineTo(sx + 240, R.floor - 460); ctx.lineTo(sx + 420, R.floor); ctx.fill(); stroke('#4a6a9a', 6); } }),
  hot: [{ id: 'hc1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('hc1', 'hielo-pueblo', 2650, 'PUEBLO', -1), draw() { drawSign(this); } },
    { id: 'hcDoor', x: 1450, w: 200, h: 300, ic: '🕳', door: dk('hcdoor', 'hielo-cueva', 220, 'CUEVA', () => !F('yetiFeliz'), { style: 'casa', col: '#4a6a9a', col2: '#1a2a4a', w: 200, h: 300 }), draw() { drawDoor(this); }, act() { say([['lucas', 'El yeti está tapando la entrada.']]); } },
    npc('yeti', 'YETI TITO', 1180, '🦍', 230, yeti, { vis: () => true })
  ],
  enter() { if (!G.seen.hcueva) { G.seen.hcueva = 1; save(); say([['narr', '¡Una cueva de hielo! Pero hay alguien en la puerta.']]); } }
});
function yeti() {
  setF('yetiHola'); const c = CH.yeti;
  if (F('yetiFeliz')) return say([['yeti', '¡Qué calentito estoy con mi bufanda!'], ['yeti', 'Pasa a la cueva, amigo.']]);
  if (has('bufanda')) return say([['lucas', '¡Yeti! ¡Te traigo una bufanda!'], ['yeti', '¿Para mí? ¡Qué bonita!'], ['yeti', '¡Ya no tengo frío! Muchas gracias.'], ['yeti', 'Puedes pasar a la cueva.'], ['yeti', 'Dentro hay una piedra que brilla mucho.']], () => { take('bufanda'); setF('yetiFeliz'); givePeg('yeti', true); SFX.win(); });
  if (!F('yetiHablo')) { setF('yetiHablo'); return say([['yeti', 'Hola... soy Tito, el yeti.'], ['yeti', 'Tengo muchísimo frío.'], ['yeti', 'Estoy tan frío que no me puedo mover.'], ['lucas', '¡Pero un yeti nunca tiene frío!'], ['yeti', 'Yo sí. Perdí mi bufanda.'], ['narr', 'Quizá alguien del pueblo pueda tejer una bufanda.']]); }
  say([['yeti', 'Tengo mucho frío...'], ['yeti', 'Si tuviera una bufanda...']]);
}
room('hielo-cueva', { pl: 'hielo', name: 'LA CUEVA DE CRISTAL', W: 2200,
  plat: [[700, 510, 140, 'hielo'], [900, 410, 140, 'hielo'], [1150, 330, 140, 'hielo'], [1420, 400, 140, 'hielo'], [1650, 310, 140, 'hielo'], [1900, 240, 200, 'hielo']],
  coins: [[700, 460], [900, 360], [1150, 280], [1420, 350], [1650, 260]], chip: [1150, 230],
  paint(l) { if (l === 'lejos') { ctx.fillStyle = lg(0, 0, 0, VH, ['#0a1a3a', '#2a5a8a']); ctx.fillRect(0, 0, VW, VH); return; } if (l === 'pared') { for (let i = 0; i < 14; i++) { const x = ((i * 190 - camX * 0.6) % 2600 + 2600) % 2600 - 200; ctx.fillStyle = 'rgba(160,220,255,.35)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 120 + (i % 4) * 40); ctx.lineTo(x + 80, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 30, R.floor); ctx.lineTo(x + 70, R.floor - 100 - (i % 3) * 50); ctx.lineTo(x + 110, R.floor); ctx.fill(); } return; } if (l === 'suelo') return groundPaint('hielo'); },
  hot: [{ id: 'hcuDoor', x: 220, w: 200, h: 300, ic: '🚪', door: dk('hcudoor', 'hielo-cueva-fuera', 1250, 'SALIDA', null, { style: 'casa', col: '#4a6a9a', col2: '#1a2a4a', w: 200, h: 300 }), draw() { drawDoor(this); } },
    crystalHot('hielo', 1900, 240, 2)
  ],
  enter() { if (!G.seen.hcuev2) { G.seen.hcuev2 = 1; save(); say([['narr', '¡Mira allí arriba! Algo brilla mucho.'], ['lucas', '¡Es el cristal! Tengo que subir saltando.']]); } }
});

/* =====================================================================
   CAPÍTULO 3 · PLANETA VOLCÁN (fuego)
   Misión: el puente sobre la lava está roto. El herrero Magma lo arregla con 2 rocas de hierro,
   pero primero hay que quitarle el hipo (con agua o dándole un susto). Roca 1: en lo alto del mercado.
   Roca 2: regalo de Fueguito (si le das una chuche) o comprada en la tienda. Dentro del volcán, un acertijo de colores.
   ===================================================================== */
const rocas = () => ['roca-1', 'roca-2'].filter(has).length;
function flor(n, x, y) { return thing('flor', x, y, '🌺', 56, { id: 'flor' + n, ic: '✋', vis: () => !F('flor' + n), act() { setF('flor' + n); G.flags.flores = (G.flags.flores || 0) + 1; save(); SFX.pick(); say([['lucas', '¡Una flor de fuego! Ya tengo ' + G.flags.flores + '.']]); } }); }
room('fuego-nave', { pl: 'fuego', name: 'ATERRIZAJE', W: 2300,
  plat: [[1250, 500, 130, 'roca'], [1420, 400, 130, 'roca']], coins: [[1250, 450], [1420, 350], [800, 560], [1800, 560]], chip: [1420, 300],
  paint: outdoor('fuego', 2, { lava: [1600, 1700] }),
  walls: () => [], hot: [shipHot(450), npc('florinda', 'FLORINDA', 1000, '🧚', 150, florinda), flor(1, 1900, 620), thing('secreto', 1420, 400, '🦄', 50, { ic: '✋', vis: () => !(G.peg || {}).secreto, act() { givePeg('secreto'); } }),
    { id: 'fn2', x: 2200, w: 200, h: 220, ic: '🚶', door: camino('fn2', 'fuego-mercado', 200, 'MERCADO', 1), draw() { drawSign(this); } }],
  enter() { if (!G.seen.fuego) { G.seen.fuego = 1; save(); say([['narr', '¡La nave ha aterrizado en el Planeta Volcán!'], ['lucas', '¡Qué calor hace aquí!'], ['narr', 'Cuidado con la lava. ¡Quema mucho!']]); } }
});
function florinda() {
  setF('florindaHola'); const n = G.flags.flores || 0;
  if (F('floresOk')) return say([['florinda', '¡Mis flores huelen de maravilla!'], ['florinda', 'Gracias, Lucas.']]);
  if (n >= 5) return say([['lucas', '¡Florinda! ¡Tengo cinco flores de fuego!'], ['florinda', '¡Qué bonitas! ¡Muchas gracias!'], ['florinda', 'Toma un regalo.']], () => { setF('floresOk'); addCoins(10); givePeg('flor', true); say([['narr', '¡Florinda te da diez monedas y una pegatina!']]); });
  if (!F('florindaHablo')) { setF('florindaHablo'); return say([['florinda', '¡Hola! Soy Florinda, el hada de las flores.'], ['florinda', 'Busco flores de fuego para mi jardín.'], ['florinda', 'Hay cinco escondidas por el planeta.'], ['florinda', '¿Me ayudas a encontrarlas?']]); }
  say([['florinda', 'Me faltan flores de fuego.'], ['florinda', 'Ya tienes ' + n + ' de 5.']]);
}
room('fuego-mercado', { pl: 'fuego', name: 'EL MERCADO DE LAVA', W: 2900,
  plat: [[2000, 510, 130, 'roca'], [2160, 410, 130, 'roca'], [2320, 310, 130, 'roca'], [2480, 230, 150, 'roca']], coins: [[2000, 460], [2160, 360], [2320, 260], [400, 560], [1300, 560]], chip: [2160, 300],
  paint: outdoor('fuego', 5),
  hot: [{ id: 'fm1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('fm1', 'fuego-nave', 2050, 'NAVE', -1), draw() { drawSign(this); } },
    { id: 'fmHer', x: 650, w: 170, h: 250, ic: '🚪', door: casaDoor('fmher', 'fuego-herreria', 220, '#3a3030', '#7a4a2a'), draw() { facade('forja', 650, 'HERRERÍA'); drawDoor(this); } },
    npc('dragon', 'FUEGUITO', 1080, '🐲', 150, dragon),
    { id: 'fmTie', x: 1550, w: 170, h: 250, ic: '🚪', door: casaDoor('fmtie', 'fuego-tienda', 220, '#3a1a3a', '#a03a8a'), draw() { facade('tienda-fuego', 1550, 'TIENDA DE LAVA'); drawDoor(this); } },
    thing('roca-1', 2480, 230, '🪨', 64, { ic: '✋', vis: () => !F('roca1'), act() { setF('roca1'); give('roca-1'); say([['lucas', '¡Una roca de hierro! Pesa mucho.']]); } }),
    flor(2, 1800, 620),
    { id: 'fm2', x: 2780, w: 200, h: 220, ic: '🚶', door: camino('fm2', 'fuego-rio', 200, 'RÍO DE LAVA', 1), draw() { drawSign(this); } }
  ],
  enter() { if (!G.seen.fmerc) { G.seen.fmerc = 1; save(); say([['narr', 'Este es el mercado del Planeta Volcán.']]); } }
});
function dragon() {
  setF('dragonHola');
  if (F('dragonFeliz')) return say([['dragon', '¡La chuche estaba buenísima!'], ['dragon', '¡Gracias, Lucas!']]);
  if (has('chuche')) return say([['lucas', 'Fueguito, ¡te traigo una chuche picante!'], ['dragon', '¡Mi favorita! ¡Qué rica!'], ['dragon', 'Toma, te doy mi piedra favorita.']], () => { take('chuche'); setF('dragonFeliz'); give('roca-2'); givePeg('dragon', true); say([['narr', '¡Es una roca de hierro!']]); });
  if (!F('dragonHablo')) { setF('dragonHablo'); return say([['dragon', '¡Hola! Soy Fueguito.'], ['dragon', 'Soy un dragón pequeñito.'], ['dragon', 'Me encantan las chuches picantes.'], ['dragon', 'Pero no tengo dinero.']]); }
  say([['dragon', '¿Me traes una chuche picante?'], ['dragon', 'Las venden en la tienda.']]);
}
room('fuego-herreria', { pl: 'fuego', name: 'LA HERRERÍA', W: 1500,
  plat: [[1150, 430, 220, 'estante']], coins: [[1100, 380], [700, 560]], chip: [1200, 360],
  paint(l) { if (l === 'lejos') return; if (l === 'pared') { bricks('#6a5050', '#3a2a2a', 110, 55, 'rgba(0,0,0,.35)'); const fx = 1100 - camX; ctx.fillStyle = '#3a2a2a'; rr(fx - 120, R.floor - 260, 240, 260, 14); ctx.fill(); stroke(); ctx.fillStyle = '#1a0a04'; rr(fx - 80, R.floor - 180, 160, 130, 10); ctx.fill(); for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#ffd23c', '#ff7a2a', '#ff3a1a'][i % 3]; ctx.beginPath(); ctx.ellipse(fx - 50 + i * 25, R.floor - 70 - Math.abs(Math.sin(time * 7 + i)) * 40, 14, 36, 0, 0, 7); ctx.fill(); } if (!PREVIEW) glow(fx, R.floor - 100, 240, 'rgba(255,120,40,A)', 0.3); return; } if (l === 'suelo') return interiorFloor('#5a4040', '#2a1a1a'); },
  hot: [{ id: 'fhDoor', x: 220, w: 170, h: 250, ic: '🚪', door: casaDoor('fhdoor', 'fuego-mercado', 650, '#3a3030', '#7a4a2a'), draw() { drawDoor(this); } },
    npc('herrero', 'HERRERO MAGMA', 650, '🧔', 190, herrero),
    thing('yunque', 860, 620, '⚒️', 90, { act() { say([['lucas', 'Un yunque para trabajar el metal.']]); } }),
    thing('casco', 1150, 430, '⛑️', 60, { act() { if (givePeg('herrero', true)) say([['lucas', '¡Dentro del casco había una pegatina!']]); else say([['lucas', 'Un casco de herrero.']]); } }),
    flor(3, 1250, 430)
  ],
  enter() { if (!G.seen.fherr) { G.seen.fherr = 1; save(); say([['narr', 'La herrería está llena de herramientas.']]); } }
});
function herrero() {
  setF('herreroHola');
  if (F('puenteOk')) return say([['herrero', '¡El puente ha quedado precioso!'], ['herrero', 'Ten cuidado en el volcán.']]);
  if (!F('hipoOk')) {
    if (!F('herreroHablo')) { setF('herreroHablo'); return say([['herrero', 'Hola, soy Magma, el herrero.'], ['narr', 'El herrero tiene hipo. No puede parar.'], ['herrero', 'Con este hipo no puedo trabajar.'], ['herrero', '¿Sabes cómo quitarlo?']], herreroOpciones); }
    return herreroOpciones();
  }
  if (rocas() === 2) return say([['lucas', '¡Tengo dos rocas de hierro!'], ['herrero', '¡Perfecto! Voy a hacer tablas de metal.'], ['narr', 'El herrero trabaja muy deprisa.'], ['herrero', '¡Listo! Con esto puedes arreglar el puente.']], () => { take('roca-1'); take('roca-2'); give('tablas'); });
  if (has('tablas')) return say([['herrero', 'Lleva las tablas al puente roto.']]);
  say([['herrero', 'Para arreglar el puente necesito hierro.'], ['herrero', 'Tráeme dos rocas de hierro.'], ['herrero', 'Ya tienes ' + rocas() + '.']]);
}
function herreroOpciones() {
  const o = [{ e: '💧', t: 'Darle agua' }, { e: '👻', t: 'Darle un susto' }, { e: '🎵', t: 'Cantarle' }];
  choose('¿Cómo le quitas el hipo?', o, i => {
    if (i === 0 && !has('agua')) return say([['lucas', 'No tengo agua.'], ['narr', 'En la tienda venden botellas de agua.']]);
    if (i === 2) return say([['narr', 'Lucas canta una canción muy bonita.'], ['herrero', 'Qué bonita. Pero sigo con hipo.']]);
    if (i === 0) take('agua');
    say([[i === 0 ? 'lucas' : 'narr', i === 0 ? '¡Bebe esta agua fresquita!' : 'Lucas da un salto y grita muy fuerte.'], ['herrero', '¡Uy! ¡Se me ha quitado el hipo!'], ['herrero', '¡Muchas gracias, pequeño!'], ['herrero', 'Ahora puedo trabajar otra vez.'], ['herrero', 'Si necesitas algo de metal, tráeme hierro.']], () => { setF('hipoOk'); SFX.win(); });
  });
}
room('fuego-tienda', { pl: 'fuego', name: 'TIENDA DE LAVA', W: 1300,
  plat: [[1100, 380, 200, 'estante']], coins: [[1100, 330]], chip: [1180, 300],
  paint(l) { if (l === 'lejos') return; if (l === 'pared') { bricks('#5a2a4a', '#2a0a2a', 120, 60, 'rgba(0,0,0,.35)'); return; } if (l === 'suelo') return interiorFloor('#5a3a4a', '#2a1a2a'); },
  hot: [{ id: 'ftDoor', x: 220, w: 170, h: 250, ic: '🚪', door: casaDoor('ftdoor', 'fuego-mercado', 1550, '#3a1a3a', '#a03a8a'), draw() { drawDoor(this); } },
    { id: 'mostrF', x: 760, w: 460, h: 150, ic: '🛒', draw() { drawNPC('lava', 760, '🦎', 190, R.floor - 90); drawProp('mostrador', 760); }, act() { NAMES.lava = 'LAVA'; if (!F('lavaHola')) { setF('lavaHola'); return say([['lava', '¡Hola! Soy Lava, la lagartija.'], ['lava', '¡Tengo cosas muy calentitas!']], () => shopOf('lava', 'TIENDA DE LAVA', SHOP_FUEGO)); } shopOf('lava', 'TIENDA DE LAVA', SHOP_FUEGO); } }
  ]
});
const SHOP_FUEGO = [
  { id: 'agua', e: '💧', t: 'Botella de agua', p: 3, d: 'Agua fresquita.', show: () => !has('agua') && !F('hipoOk'), msg: 'Una botella de agua fresquita.' },
  { id: 'chuche', e: '🍬', t: 'Chuche picante', p: 4, d: 'Muy picante.', show: () => !has('chuche') && !F('dragonFeliz'), msg: 'Una chuche picante. ¿A quién le gustará?' },
  { id: 'roca-2', e: '🪨', t: 'Roca de hierro', p: 9, d: 'Hierro del bueno.', show: () => !has('roca-2') && !F('dragonFeliz') && !has('tablas') && !F('puenteOk'), msg: 'Una roca de hierro. ¡Pesa mucho!' },
  { id: 'gafas', e: '🕶️', t: 'Gafas de sol', p: 5, d: 'Para el sol del volcán.', show: () => !F('hat_gafas') }
];
room('fuego-rio', { pl: 'fuego', name: 'EL RÍO DE LAVA', W: 2500,
  plat: [[700, 500, 130, 'roca'], [860, 400, 130, 'roca']], coins: [[700, 450], [860, 350], [1950, 560], [2150, 560]], chip: [860, 300],
  paint: outdoor('fuego', 9, { lava: [1100, 1600], bridge: () => F('puenteOk') }),
  walls: () => F('puenteOk') ? [] : [1060], wallSay() { say([['lucas', '¡Uy! ¡Lava! No puedo pasar.'], ['lucas', 'El puente está roto.']]); },
  hot: [{ id: 'fr1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('fr1', 'fuego-mercado', 2650, 'MERCADO', -1), draw() { drawSign(this); } },
    { id: 'puente', x: 1000, w: 140, h: 200, ic: '🔧', vis: () => !F('puenteOk'), act() { setF('vioPuente'); if (has('tablas')) return say([['lucas', '¡Pongo las tablas de metal!']], () => { take('tablas'); setF('puenteOk'); SFX.door(); FX.shake = 0.4; givePeg('lava', true); say([['narr', '¡El puente ya está arreglado!']]); }); say([['lucas', 'El puente está roto.'], ['lucas', 'Necesito algo para arreglarlo.'], ['narr', 'Quizá el herrero del mercado pueda ayudar.']]); } },
    flor(4, 2000, 620),
    { id: 'frVol', x: 2250, w: 220, h: 300, ic: '🌋', door: dk('frvol', 'fuego-volcan', 220, 'VOLCÁN', null, { style: 'casa', col: '#3a0c0c', col2: '#1a0404', w: 220, h: 300 }), draw() { const sx = 2250 - camX; ctx.fillStyle = '#3a0c0c'; ctx.beginPath(); ctx.moveTo(sx - 300, R.floor); ctx.lineTo(sx - 120, R.floor - 470); ctx.lineTo(sx + 120, R.floor - 470); ctx.lineTo(sx + 300, R.floor); ctx.fill(); drawDoor(this); } }
  ],
  enter() { if (!G.seen.frio) { G.seen.frio = 1; save(); say([['narr', 'Un río de lava cruza el camino.'], ['narr', 'Al otro lado está la entrada del volcán.']]); } }
});
room('fuego-volcan', { pl: 'fuego', name: 'DENTRO DEL VOLCÁN', W: 2200,
  plat: () => F('volcanOk') ? [[1300, 500, 140, 'roca'], [1500, 400, 140, 'roca'], [1720, 300, 140, 'roca'], [1950, 230, 200, 'roca']] : [], coins: [[1300, 450], [1500, 350], [1720, 250], [600, 560]], chip: [1500, 300],
  paint(l) { if (l === 'lejos') { ctx.fillStyle = lg(0, 0, 0, VH, ['#1a0404', '#5a1a0a']); ctx.fillRect(0, 0, VW, VH); return; } if (l === 'pared') { bricks('#4a1a10', '#2a0a04', 160, 80, 'rgba(0,0,0,.4)'); [['#ff3a3a', '🔴'], ['#3a8aff', '🔵'], ['#ffd23c', '🟡']].forEach((c, i) => { const x = 620 + i * 160; ctx.fillStyle = '#2a0a04'; rr(x - camX - 60, 200, 120, 140, 14); ctx.fill(); stroke(c[0], 6); emo(c[1], x, 300, 70); ctx.fillStyle = '#ffe680'; ctx.font = '900 28px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(i + 1, x - camX, 190); }); return; } if (l === 'suelo') return groundPaint('fuego', 1150, 2150); },
  hot: [{ id: 'fvDoor', x: 220, w: 220, h: 300, ic: '🚪', door: dk('fvdoor', 'fuego-rio', 2100, 'SALIDA', null, { style: 'casa', col: '#3a0c0c', col2: '#1a0404', w: 220, h: 300 }), draw() { drawDoor(this); } },
    { id: 'botones', x: 1000, w: 200, h: 160, ic: '✋', draw() { const sx = 1000 - camX; ctx.fillStyle = '#3a2a2a'; rr(sx - 90, R.floor - 150, 180, 150, 14); ctx.fill(); stroke(); ['#ff3a3a', '#3a8aff', '#ffd23c'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx - 50 + i * 50, R.floor - 90, 18, 0, 7); ctx.fill(); stroke('#0a0e22', 3); }); },
      act() { if (F('volcanOk')) return say([['lucas', 'Ya he abierto el camino.']]); volcanPuzzle([]); } }
  ].concat([crystalHot('fuego', 1950, 230, 3)]),
  enter() { if (!G.seen.fvol) { G.seen.fvol = 1; save(); say([['narr', 'Dentro del volcán hace muchísimo calor.'], ['narr', 'En la pared hay tres dibujos con números.'], ['lucas', 'Y aquí hay tres botones de colores.']]); } }
});
function volcanPuzzle(seq) {
  const opts = [{ e: '🔴', t: 'Rojo' }, { e: '🔵', t: 'Azul' }, { e: '🟡', t: 'Amarillo' }], ok = [0, 1, 2];
  choose(seq.length === 0 ? '¿Qué botón tocas primero?' : seq.length === 1 ? '¿Y el segundo?' : '¿Y el último?', opts, i => {
    seq.push(i); if (seq.length < 3) return volcanPuzzle(seq);
    if (seq.every((v, k) => v === ok[k])) { setF('volcanOk'); SFX.power(); FX.shake = 0.8; givePeg('volcan', true); return say([['narr', '¡Muy bien! Salen rocas de la lava.'], ['narr', '¡Ahora puedes subir saltando hasta el cristal!']]); }
    SFX.bad(); say([['narr', 'No pasa nada.'], ['narr', 'Mira los números de los dibujos de la pared.']]);
  });
}

/* =====================================================================
   CAPÍTULO 4 · PLANETA JUNGLA (selva)
   Misión: la puerta del templo necesita 3 piedras: sol (Mono Sabio, por el plátano dorado del árbol),
   luna (Rana Rita, por sus 3 ranitas) y estrella (escondida en la cabaña o comprada en la tienda).
   ===================================================================== */
const piedras = () => ['piedra-sol', 'piedra-luna', 'piedra-estrella'].filter(has).length;
room('selva-nave', { pl: 'selva', name: 'ATERRIZAJE', W: 2300,
  plat: [[1250, 500, 130, 'rama'], [1420, 400, 130, 'rama']], coins: [[1250, 450], [1420, 350], [800, 560], [1800, 560], [2000, 560]], chip: [1420, 300],
  paint: outdoor('selva', 4),
  hot: [shipHot(450), npc('loro', 'LORO COCO', 1000, '🦜', 130, loro),
    { id: 'sn2', x: 2200, w: 200, h: 220, ic: '🚶', door: camino('sn2', 'selva-poblado', 200, 'POBLADO', 1), draw() { drawSign(this); } }],
  enter() { if (!G.seen.selva) { G.seen.selva = 1; save(); say([['narr', '¡La nave ha aterrizado en el Planeta Jungla!'], ['lucas', '¡Cuántos árboles y plantas!']]); } }
});
function loro() {
  setF('loroHola');
  if (F('loroOk')) return say([['loro', '¡Lucas es mi amigo! ¡Lucas es mi amigo!']]);
  say([['loro', '¡Hola! ¡Hola! Soy Coco.'], ['loro', 'Me encanta aprender palabras.'], ['loro', '¿Me enseñas una palabra bonita?']], () => {
    choose('¿Qué palabra le enseñas?', [{ e: '🤝', t: 'Amigo' }, { e: '🌈', t: 'Arcoíris' }, { e: '🍌', t: 'Plátano' }], i => { const w = ['amigo', 'arcoíris', 'plátano'][i]; setF('loroOk'); addCoins(5); givePeg('loro', true); say([['loro', '¡' + w[0].toUpperCase() + w.slice(1) + '! ¡' + w[0].toUpperCase() + w.slice(1) + '!'], ['loro', '¡Qué palabra tan bonita! Toma, cinco monedas.']]); }); });
}
room('selva-poblado', { pl: 'selva', name: 'EL POBLADO', W: 2900,
  plat: [[2000, 500, 130, 'rama'], [2150, 400, 130, 'rama'], [2000, 300, 130, 'rama'], [2150, 210, 150, 'rama']], coins: [[2000, 450], [2150, 350], [2000, 250], [400, 560], [1300, 560]], chip: [2000, 200],
  paint: outdoor('selva', 6, { pared() { const tx = 2080 - camX; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(tx - 30, 140, 60, R.floor - 140); ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(tx, 140, 220, 90, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3aa04a'; ctx.beginPath(); ctx.ellipse(tx - 80, 110, 120, 60, 0, 0, 7); ctx.ellipse(tx + 90, 120, 120, 60, 0, 0, 7); ctx.fill(); } }),
  hot: [{ id: 'sp1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('sp1', 'selva-nave', 2050, 'NAVE', -1), draw() { drawSign(this); } },
    { id: 'spCab', x: 650, w: 170, h: 250, ic: '🚪', door: casaDoor('spcab', 'selva-cabana', 220, '#5a3a10', '#9a6a2a'), draw() { facade('cabana', 650, 'CABAÑA DEL MONO SABIO'); drawDoor(this); } },
    { id: 'spTie', x: 1450, w: 170, h: 250, ic: '🚪', door: casaDoor('sptie', 'selva-tienda', 220, '#5a3a10', '#d07a30'), draw() { facade('tienda-selva', 1450, 'TIENDA DE TUKI'); drawDoor(this); } },
    thing('platano', 2150, 210, '🍌', 64, { ic: '✋', vis: () => !F('platano'), act() { setF('platano'); give('platano'); givePeg('platano', true); say([['lucas', '¡Un plátano dorado! ¡Brilla mucho!']]); } }),
    { id: 'sp2', x: 2780, w: 200, h: 220, ic: '🚶', door: camino('sp2', 'selva-rio', 200, 'RÍO', 1), draw() { drawSign(this); } }
  ],
  enter() { if (!G.seen.spob) { G.seen.spob = 1; save(); say([['narr', 'Este es el poblado de la jungla.'], ['narr', 'Arriba del árbol grande hay algo amarillo.']]); } }
});
room('selva-cabana', { pl: 'selva', name: 'CABAÑA DEL MONO SABIO', W: 1500,
  plat: [[1080, 420, 380, 'estante']], coins: [[950, 370], [600, 560]], chip: [1180, 360],
  paint(l) { if (l === 'lejos') return; if (l === 'pared') { ctx.fillStyle = lg(0, 0, 0, R.floor, ['#a0703a', '#5a3a1a']); ctx.fillRect(0, 0, VW, R.floor); ctx.strokeStyle = 'rgba(60,30,10,.5)'; ctx.lineWidth = 4; for (let wx = Math.floor(camX / 60) * 60; wx < camX + VW; wx += 60) { ctx.beginPath(); ctx.moveTo(wx - camX, 0); ctx.lineTo(wx - camX, R.floor); ctx.stroke(); } emo('🎭', 700, 260, 80); return; } if (l === 'suelo') return interiorFloor('#8a6a3a', '#4a3a1a'); },
  hot: [{ id: 'scDoor', x: 220, w: 170, h: 250, ic: '🚪', door: casaDoor('scdoor', 'selva-poblado', 650, '#5a3a10', '#9a6a2a'), draw() { drawDoor(this); } },
    npc('mono', 'MONO SABIO', 480, '🐒', 170, mono),
    thing('mascara', 940, 420, '🗿', 64, { act() { say([['lucas', 'Una máscara de piedra muy antigua.']]); } }),
    thing('pluma', 1010, 420, '🪶', 60, { act() { say([['lucas', 'Una pluma de colores.']]); } }),
    thing('piedra-estrella', 1080, 420, '⭐', 56, { ic: '✋', vis: () => !F('estrella'), act() { setF('estrella'); give('piedra-estrella'); say([['lucas', '¡Una piedra con forma de estrella!'], ['lucas', 'Estaba escondida entre las cosas.']]); } }),
    thing('jarron', 1150, 420, '🏺', 64, { act() { if (givePeg('mono', true)) say([['lucas', '¡Dentro del jarrón había una pegatina!']]); else say([['lucas', 'Un jarrón vacío.']]); } }),
    thing('tambor', 1220, 420, '🪘', 60, { act() { say([['lucas', 'Un tambor. ¡Qué divertido!']]); } })
  ]
});
function mono() {
  setF('monoHola');
  if (F('monoFeliz')) return say([['mono', 'Gracias por el plátano dorado.'], ['mono', 'El templo guarda el cristal que buscas.']]);
  if (has('platano')) return say([['lucas', '¡Mono Sabio! ¡Te traigo el plátano dorado!'], ['mono', '¡Oh! ¡El plátano dorado!'], ['mono', 'Solo crece uno cada cien años.'], ['mono', 'Toma, la piedra del sol. Te ayudará en el templo.']], () => { take('platano'); setF('monoFeliz'); give('piedra-sol'); });
  if (!F('monoHablo')) { setF('monoHablo'); return say([['mono', 'Hola, pequeño viajero. Soy el Mono Sabio.'], ['mono', 'Sé que buscas el cristal de energía.'], ['mono', 'Está dentro del templo.'], ['mono', 'Para abrir la puerta necesitas tres piedras.'], ['mono', 'La del sol, la de la luna y la de la estrella.'], ['mono', 'Yo tengo la piedra del sol.'], ['mono', 'Te la daré si me traes el plátano dorado.']]); }
  say([['mono', 'Tráeme el plátano dorado.'], ['mono', 'Está en lo alto del árbol grande.']]);
}
room('selva-tienda', { pl: 'selva', name: 'TIENDA DE TUKI', W: 1300,
  plat: [[1100, 380, 200, 'estante']], coins: [[1100, 330]], chip: [1180, 300],
  paint(l) { if (l === 'lejos') return; if (l === 'pared') { ctx.fillStyle = lg(0, 0, 0, R.floor, ['#c88a3a', '#6a4a1a']); ctx.fillRect(0, 0, VW, R.floor); for (let i = 0; i < 10; i++) emo(['🍍', '🥥', '🍌', '🌺'][i % 4], 120 + i * 140, 140, 50); return; } if (l === 'suelo') return interiorFloor('#8a6a3a', '#4a3a1a'); },
  hot: [{ id: 'stDoor', x: 220, w: 170, h: 250, ic: '🚪', door: casaDoor('stdoor', 'selva-poblado', 1450, '#5a3a10', '#d07a30'), draw() { drawDoor(this); } },
    { id: 'mostrS', x: 760, w: 460, h: 150, ic: '🛒', draw() { drawNPC('tuki', 760, '🦥', 190, R.floor - 90); drawProp('mostrador', 760); }, act() { NAMES.tuki = 'TUKI'; if (!F('tukiHola')) { setF('tukiHola'); return say([['tuki', 'Hooola... soy Tuki, el perezoso.'], ['tuki', 'Mira mis cosas... sin prisa.']], () => shopOf('tuki', 'TIENDA DE TUKI', SHOP_SELVA)); } shopOf('tuki', 'TIENDA DE TUKI', SHOP_SELVA); } }
  ]
});
const SHOP_SELVA = [
  { id: 'piedra-estrella', e: '⭐', t: 'Piedra estrella', p: 12, d: 'Una piedra mágica.', show: () => !has('piedra-estrella') && !F('estrella') && !F('temploOk'), buy() { setF('estrella'); give('piedra-estrella'); say([['tuki', 'Gracias... es una piedra muy especial.']]); } },
  { id: 'sombrero', e: '🤠', t: 'Sombrero explorador', p: 5, d: 'Para explorar la jungla.', show: () => !F('hat_sombrero') },
  { id: 'corona', e: '👑', t: 'Corona de rey', p: 20, d: '¡Muy cara y muy chula!', show: () => !F('hat_corona') }
];
room('selva-rio', { pl: 'selva', name: 'EL RÍO', W: 2500,
  plat: [[900, 560, 140, 'nenufar'], [1150, 520, 140, 'nenufar'], [1400, 560, 140, 'nenufar'], [1650, 470, 130, 'rama'], [1820, 370, 130, 'rama']], coins: [[900, 510], [1150, 470], [1400, 510], [1650, 420], [1820, 320]], chip: [1820, 260],
  paint: outdoor('selva', 8, { pared() { const a = 750 - camX, b = 1550 - camX; ctx.fillStyle = 'rgba(60,160,220,.85)'; ctx.fillRect(a, R.floor - 14, b - a, 40); for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(a + ((i * 97 + time * 40) % (b - a)), R.floor - 4, 30, 3); } } }),
  hot: [{ id: 'sr1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('sr1', 'selva-poblado', 2650, 'POBLADO', -1), draw() { drawSign(this); } },
    npc('rana', 'RANA RITA', 600, '🐸', 130, rana),
    ...[[900, 560], [1400, 560], [1820, 370]].map((p, i) => thing('ranita', p[0], p[1], '🐸', 46, { id: 'ranita' + i, ic: '✋', vis: () => !F('ranita' + i) && F('ranaHablo'), act() { setF('ranita' + i); G.flags.ranitas = (G.flags.ranitas || 0) + 1; save(); SFX.pick(); say([['lucas', '¡He encontrado una ranita! Ya van ' + G.flags.ranitas + '.']]); } })),
    { id: 'sr2', x: 2380, w: 200, h: 220, ic: '🚶', door: camino('sr2', 'selva-templo', 200, 'TEMPLO', 1), draw() { drawSign(this); } }
  ],
  enter() { if (!G.seen.srio) { G.seen.srio = 1; save(); say([['narr', 'Un río muy tranquilo con nenúfares.']]); } }
});
function rana() {
  setF('ranaHola'); const n = G.flags.ranitas || 0;
  if (F('ranaFeliz')) return say([['rana', '¡Mis ranitas están conmigo otra vez!'], ['rana', 'Gracias, Lucas.']]);
  if (n >= 3) return say([['rana', '¡Mis tres ranitas! ¡Qué alegría!'], ['rana', 'Toma, la piedra de la luna.'], ['rana', 'La encontré en el fondo del río.']], () => { setF('ranaFeliz'); give('piedra-luna'); givePeg('rana', true); });
  if (!F('ranaHablo')) { setF('ranaHablo'); return say([['rana', '¡Ay, ay! Soy Rita, la rana.'], ['rana', 'Mis tres ranitas se han ido saltando.'], ['rana', 'Están por los nenúfares y los árboles.'], ['rana', '¿Me ayudas a encontrarlas?']]); }
  say([['rana', 'Busca a mis ranitas, por favor.'], ['rana', 'Ya has encontrado ' + n + ' de 3.']]);
}
room('selva-templo', { pl: 'selva', name: 'EL TEMPLO', W: 2000,
  plat: [[500, 500, 130, 'roca'], [660, 400, 130, 'roca']], coins: [[500, 450], [660, 350], [1600, 560]], chip: [660, 300],
  paint: outdoor('selva', 10),
  hot: [{ id: 'stp1', x: 110, w: 200, h: 220, ic: '🚶', door: camino('stp1', 'selva-rio', 2250, 'RÍO', -1), draw() { drawSign(this); } },
    { id: 'stpDoor', x: 1200, w: 220, h: 300, ic: '🗿', door: dk('stpdoor', 'selva-templo-dentro', 220, '', () => !F('temploOk'), { style: 'casa', col: '#6a6a4a', col2: '#4a4a3a', w: 220, h: 300 }),
      draw() { facade('templo', 1200); drawDoor(this); [['☀️', 'sol'], ['🌙', 'luna'], ['⭐', 'estrella']].forEach((s, i) => { const x = 1110 + i * 90, put = F('pone_' + s[1]); ctx.fillStyle = '#3a3a2a'; ctx.beginPath(); ctx.arc(x - camX, R.floor - 350, 32, 0, 7); ctx.fill(); if (put) emo(s[0], x, R.floor - 334, 44); }); },
      act() { setF('vioTemplo'); const names = { sol: 'piedra-sol', luna: 'piedra-luna', estrella: 'piedra-estrella' }; let puso = 0; for (const k in names) if (has(names[k])) { take(names[k]); setF('pone_' + k); puso++; }
        const n = ['sol', 'luna', 'estrella'].filter(k => F('pone_' + k)).length;
        if (n === 3) { setF('temploOk'); SFX.power(); FX.shake = 0.6; givePeg('templo', true); return say([['narr', '¡Las tres piedras brillan!'], ['narr', '¡La puerta del templo se abre!']]); }
        if (puso) return say([['lucas', '¡Pongo la piedra en su hueco!'], ['narr', 'Faltan ' + (3 - n) + (3 - n === 1 ? ' piedra.' : ' piedras.')]]);
        say([['lucas', 'La puerta tiene tres huecos.'], ['lucas', 'Un sol, una luna y una estrella.'], ['narr', 'Hay que encontrar las tres piedras.']]); } }
  ],
  enter() { if (!G.seen.stem) { G.seen.stem = 1; save(); say([['narr', '¡Un templo antiguo en medio de la jungla!']]); } }
});
room('selva-templo-dentro', { pl: 'selva', name: 'DENTRO DEL TEMPLO', W: 2200,
  plat: [[700, 500, 140, 'roca'], [920, 400, 140, 'roca'], [1150, 320, 140, 'roca'], [1400, 400, 140, 'roca'], [1650, 310, 140, 'roca'], [1900, 240, 200, 'roca']], coins: [[700, 450], [920, 350], [1150, 270], [1400, 350], [1650, 260]], chip: [1150, 220],
  paint(l) { if (l === 'lejos') { ctx.fillStyle = '#1a1a10'; ctx.fillRect(0, 0, VW, VH); return; } if (l === 'pared') { bricks('#6a6a4a', '#3a3a2a', 140, 70, 'rgba(0,0,0,.35)'); for (let i = 0; i < 6; i++) { const x = 350 + i * 330; emo('🗿', x, 330, 70); ctx.fillStyle = 'rgba(80,200,80,.5)'; ctx.fillRect(x - camX - 6, 0, 12, 120 + (i % 3) * 40); } return; } if (l === 'suelo') return interiorFloor('#5a5a3a', '#2a2a1a'); },
  hot: [{ id: 'stdDoor', x: 220, w: 220, h: 300, ic: '🚪', door: dk('stddoor', 'selva-templo', 1200, 'SALIDA', null, { style: 'casa', col: '#6a6a4a', col2: '#4a4a3a', w: 220, h: 300 }), draw() { drawDoor(this); } },
    crystalHot('selva', 1900, 240, 4)],
  enter() { if (!G.seen.stem2) { G.seen.stem2 = 1; save(); say([['narr', 'Dentro del templo hay escalones de piedra.'], ['lucas', '¡Allí arriba está el cristal!']]); } }
});

/* =====================================================================
   CAPÍTULO 5 · VUELTA A CASA
   ===================================================================== */
room('tierra-nave', { pl: 'tierra', name: 'CASA', W: 2200,
  plat: [[1700, 500, 130, 'rama'], [1860, 400, 130, 'rama']], coins: [[1700, 450], [1860, 350]], chip: [1860, 300],
  paint: outdoor('tierra', 12, { pared() { const hx = 1250 - camX; ctx.fillStyle = '#f0e0c8'; ctx.beginPath(); ctx.rect(hx - 220, R.floor - 300, 440, 300); ctx.fill(); stroke(); ctx.fillStyle = '#c8402a'; ctx.beginPath(); ctx.moveTo(hx - 260, R.floor - 300); ctx.lineTo(hx, R.floor - 460); ctx.lineTo(hx + 260, R.floor - 300); ctx.fill(); stroke(); ctx.fillStyle = '#6a3a1a'; ctx.fillRect(hx - 50, R.floor - 170, 100, 170); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(hx - 180, R.floor - 240, 90, 70); ctx.fillRect(hx + 90, R.floor - 240, 90, 70); } }),
  hot: [shipHot(450),
    npc('mama', 'MAMÁ ROBOT', 1050, '🤖', 170, familia), npc('papa', 'PAPÁ ROBOT', 1450, '🤖', 190, familia)],
  enter() { if (!F('fin5')) setTimeout(() => say([['narr', '¡La nave Estrella Azul ha vuelto a la Tierra!'], ['lucas', '¡Estoy en casa! ¡Mira, mamá y papá!']]), 400); }
});
function familia() {
  if (F('fin5')) return say([['mama', '¡Estamos muy orgullosos de ti, Lucas!'], ['papa', 'Eres el robot más valiente del espacio.']]);
  say([['mama', '¡Lucas! ¡Has vuelto!'], ['papa', '¡Te hemos echado mucho de menos!'], ['lucas', '¡He viajado a tres planetas!'], ['lucas', '¡Y he hecho muchos amigos!'], ['mama', '¡Qué aventura tan grande!'], ['papa', 'Vamos a celebrarlo con una fiesta.']], () => { setF('fin5'); givePeg('tierra', true); givePeg('familia', true); evt('fin5'); fin5(); });
}
function fin5() {
  SFX.win(); FX.flash = 1; const m = $('modal'), peg = Object.keys(G.peg || {}).length, ch = Object.keys(G.chips).length, tot = Object.keys(ROOMS).filter(k => ROOMS[k].chip).length;
  m.innerHTML = '<div class="card" style="border-color:var(--gold)"><h2 style="color:var(--gold)">¡FIN DE LA AVENTURA!</h2><img src="img/lucas-celebrando.webp" style="height:160px"><div style="font-size:24px">¡Lucas ha vuelto a casa!</div><div style="font-size:20px;color:#ffe680">Chips: ' + ch + ' de ' + tot + ' · Pegatinas: ' + peg + ' de ' + PEGS.length + '</div><div style="color:#9fb4ff;font-size:18px">Todavía puedes volver a los planetas<br>para buscar los chips y las pegatinas que faltan.</div><button class="btn gold" id="finOk">¡GENIAL!</button></div>';
  m.classList.add('on'); speak('¡Fin de la aventura! Lucas ha vuelto a casa. Todavía puedes buscar los chips y las pegatinas que faltan.'); $('finOk').onclick = () => { m.classList.remove('on'); shutUp(); };
}

/* ---------- objetos nuevos ---------- */
Object.assign(ITEMS, {
  zanahoria: { n: 'Zanahoria', e: '🥕', d: 'Una zanahoria. ¡Parece una nariz!' }, 'ovillo-azul': { n: 'Ovillo azul', e: '🧶', d: 'Un ovillo de lana azul.' }, 'ovillo-verde': { n: 'Ovillo verde', e: '🧶', d: 'Un ovillo de lana verde.' }, 'ovillo-rojo': { n: 'Ovillo rojo', e: '🧶', d: 'Un ovillo de lana roja.' },
  bufanda: { n: 'Bufanda', e: '🧣', d: 'Una bufanda de colores muy calentita.' }, cana: { n: 'Caña de pescar', e: '🎣', d: 'Para pescar en el lago.' }, pez: { n: 'Pez', e: '🐟', d: 'Un pez del lago helado.' },
  agua: { n: 'Botella de agua', e: '💧', d: 'Agua fresquita.' }, chuche: { n: 'Chuche picante', e: '🍬', d: 'Una chuche muy picante.' }, 'roca-1': { n: 'Roca de hierro', e: '🪨', d: 'Una roca de hierro.' }, 'roca-2': { n: 'Roca de hierro', e: '🪨', d: 'Otra roca de hierro.' }, tablas: { n: 'Tablas de metal', e: '🔩', d: 'Para arreglar el puente.' },
  platano: { n: 'Plátano dorado', e: '🍌', d: 'Un plátano que brilla.' }, 'piedra-sol': { n: 'Piedra del sol', e: '☀️', d: 'Una piedra con un sol.' }, 'piedra-luna': { n: 'Piedra de la luna', e: '🌙', d: 'Una piedra con una luna.' }, 'piedra-estrella': { n: 'Piedra estrella', e: '⭐', d: 'Una piedra con forma de estrella.' }
});

/* ---------- pistas de cada sitio (bombilla) ---------- */
function hint() {
  if (!F('fin1')) return hint1();
  const p = R && R.pl; let h;
  if (p === 'hielo') h = F('cr_hielo') ? '¡Ya tienes el cristal! Vuelve a la nave.' : F('yetiFeliz') ? 'Entra en la cueva y sube saltando hasta el cristal.' : has('bufanda') ? 'Lleva la bufanda al yeti de la cueva.' : ovillos() === 3 ? 'Lleva los tres ovillos a la abuela Pingüi.' : !F('yetiHola') ? 'Busca la cueva. Sigue los carteles.' : !F('abuelaHola') ? 'Visita a la abuela Pingüi en su iglú.'
    : !has('ovillo-azul') && !F('munecoOk') ? (has('zanahoria') ? 'Ponle la zanahoria al muñeco de nieve.' : 'Al muñeco de nieve le falta la nariz. Busca en casa de la abuela.') : !has('ovillo-verde') && !F('ovVerde') ? 'En el lago hay algo verde muy arriba. ¡Salta por los bloques de hielo!' : 'El ovillo rojo lo venden en la tienda de Copo. O Pingo te lo puede dar.';
  else if (p === 'fuego') h = F('cr_fuego') ? '¡Ya tienes el cristal! Vuelve a la nave.' : F('volcanOk') ? 'Sube saltando hasta el cristal.' : F('puenteOk') ? 'Entra en el volcán y mira los números de los dibujos.' : has('tablas') ? 'Lleva las tablas al puente roto.' : !F('hipoOk') ? 'Habla con el herrero. Tiene hipo.' : rocas() === 2 ? 'Lleva las dos rocas al herrero.'
    : !F('roca1') ? 'En lo alto del mercado hay una roca de hierro. ¡Salta!' : 'Fueguito tiene otra roca. Dale una chuche picante.';
  else if (p === 'selva') h = F('cr_selva') ? '¡Ya tienes el cristal! Vuelve a la nave.' : F('temploOk') ? 'Entra en el templo y sube hasta el cristal.' : piedras() > 0 ? 'Pon las piedras en la puerta del templo.' : !F('monoHola') ? 'Habla con el Mono Sabio en su cabaña.' : !F('pone_sol') && !F('monoFeliz') ? (has('platano') ? 'Lleva el plátano al Mono Sabio.' : 'El plátano dorado está en lo alto del árbol grande.')
    : !F('pone_luna') && !F('ranaFeliz') ? 'La rana Rita del río ha perdido a sus ranitas.' : 'La piedra estrella está escondida en la cabaña del Mono Sabio.';
  else if (p === 'tierra') h = '¡Habla con mamá y papá!';
  else h = crystals() === 3 ? 'Habla con la capitana en el puente.' : 'Sube al puente y toca la pantalla grande para viajar a un planeta.';
  say([['narr', h]]);
}
$('bMis').onpointerdown = e => { e.stopPropagation(); audio(); if (busy()) return; diario(); };
$('bAlb').onpointerdown = e => { e.stopPropagation(); audio(); if (busy()) return; album(); };


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
    setTimeout(() => { SFX.warp(); TR = { ph: "out", t: 0, cx: h.x - camX, cy: R.floor - 160, D }; }, 520); };
}
function enterVent(h) { if (TR || SCENE) return; L.enter = 0.001; SFX.door(); setTimeout(() => { SFX.warp(); TR = { ph: 'out', t: 0, cx: h.x - camX, cy: 180, D: { to: '__conducto' } }; }, 380); }
function trMid() {
  const D = TR.D;
  if (D.to === '__subir' || D.to === '__bajar') { SCENE = { k: 'elev', t: 0, up: D.to === '__subir', dur: 2.6, then: D.to === '__subir' ? ['puente', 300] : ['pasillo', 3360] }; TR = null; return; }
  if (D.to === '__viaje') { SCENE = { k: 'viaje', t: 0, dur: 3.4, pl: D.pl, then: D.dest }; TR = null; return; }
  if (D.to === '__conducto') { SCENE = { k: 'vent', t: 0, dur: 3, then: ['puente', 1880, 100] }; TR = null; return; }
  enterRoom(D.to, D.tx); TR = { ph: 'in', t: 0 }; SFX.warpIn();
}
function sceneEnd() { const [to, x, y] = SCENE.then; SCENE = null; enterRoom(to, x, y); TR = { ph: 'in', t: 0 }; SFX.warpIn(); }

/* ---------- controles: flechas, saltar, mano de acción, y tocar la pantalla ---------- */
function near(h) { if (h.vis && !h.vis()) return false; const top = h.y != null ? h.y : R.floor - h.h, bot = h.y != null ? h.y + h.h : R.floor; return Math.abs(L.x - h.x) < h.w / 2 + 40 && L.y >= top - 20 && L.y <= bot + 34; }
function nearest() { let b = null, bd = 1e9; for (const h of R.hot) { if (!h.act && !h.door) continue; if (!near(h)) continue; const d = Math.abs(L.x - h.x); if (d < bd) { bd = d; b = h; } } return b; }
// sitio donde se coloca Lucas para hablar: al lado del personaje (sin taparlo) o frente al mostrador, a un lado de Chispa
function stand(h) { if (h.ch) return Math.max(80, Math.min(R.W - 80, h.x + (L.x < h.x ? -175 : 175))); if (h.id === 'mostr') return 650; return null; }
function act(h) { if (!h || TR || SCENE) return; const sp = stand(h);
  if (sp != null && (Math.abs(L.x - sp) > 25 || !L.ground)) { L.auto = sp; L.then = () => act(h); return; }
  SFX.click(); L.face = h.x >= L.x ? 1 : -1; if (h.door && !(h.door.locked && h.door.locked())) return enterDoor(h); if (h.act) h.act(); }
function doJump() { if (L.ground) { L.vy = -jumpV(); L.ground = false; SFX.jump(); } else jumpBuf = 0.15; }
function hotAt(wx, wy) { for (let i = R.hot.length - 1; i >= 0; i--) { const h = R.hot[i]; if (h.vis && !h.vis()) continue; if (!h.act && !h.door) continue; const top = h.y != null ? h.y : R.floor - h.h, bot = h.y != null ? h.y + h.h : R.floor + 30; if (wx > h.x - h.w / 2 && wx < h.x + h.w / 2 && wy > top && wy < bot) return h; } return null; }
function tapWorld(sx, sy) {
  if (TR || SCENE || L.enter) return; if (busy()) { advance(); return; }
  const wx = sx + camX, wy = sy, h = hotAt(wx, wy);
  if (h && canSee(h.x)) { if (near(h) || stand(h) != null) return act(h); L.auto = h.x; L.then = () => { if (near(h)) act(h); else say([['lucas', '¡Está muy alto! Tengo que saltar.']]); }; return; }
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

let TOUCH = (() => { try { return matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0 && !matchMedia('(pointer:fine)').matches; } catch (e) { return false; } })();
addEventListener('touchstart', () => { if (!TOUCH) { TOUCH = true; $('ctl').classList.remove('pc'); } }, { passive: true });
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
  if (L.enter) { L.enter = Math.min(1, L.enter + dt * 1.8); return; }
  // andar
  let dir = 0; const frozen = busy() || $('modal').classList.contains('on');
  if (!frozen) { dir = KEY.r - KEY.l; if (!dir && L.auto != null) { const d = L.auto - L.x; if (Math.abs(d) > 8) dir = Math.sign(d); else { L.auto = null; const f = L.then; L.then = null; if (f) f(); } } }
  if (dir) { L.face = dir; L.serve = 0; }
  let nx = L.x + dir * SPEED * dt; nx = Math.max(60, Math.min(R.W - 60, nx));
  if (R.dark && !F('energia') && !has('linterna') && nx > 440) { nx = 440; L.auto = null; if (time - darkSaid > 6 && !busy()) { darkSaid = time; say([['lucas', '¡Está muy oscuro! No veo nada.']]); } }
  if (R.walls) for (const wx of R.walls()) { if (L.x <= wx && nx > wx) { nx = wx; L.auto = null; if (R.wallSay && time - darkSaid > 5 && !busy()) { darkSaid = time; R.wallSay(); } } else if (L.x >= wx && nx < wx) { nx = wx; L.auto = null; } }
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
  layer(R, 'lejos'); layer(R, 'pared');
  layer(R, 'suelo');
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
  if (SCENE) return SCENE.k === 'elev' ? drawElevator() : SCENE.k === 'viaje' ? drawViaje() : drawVent();
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
  const back = L.enter > 0 && opt('lucas-espaldas');   // de espaldas solo al cruzar una puerta
  const air = !L.ground, moving = (KEY.l || KEY.r || L.auto != null) && !busy(), name = L.cheer > 0 ? 'lucas-celebrando' : air ? 'lucas-saltando' : moving ? 'lucas-avanzando' : 'lucas-quieto';
  let im = back || IMG[name]; if (!ok(im)) im = IMG['lucas-quieto'];
  const sx = L.x - camX, y = L.y + 4, bob = air ? 0 : Math.sin(time * (moving ? 9 : 2.5)) * (moving ? 4 : 3), en = L.enter || 0;
  if (!air) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(sx, y, 64, 12, 0, 0, 7); ctx.fill(); }
  if (F('botas') && air) { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) glow(sx + (Math.random() - 0.5) * 50, y - 10 + Math.random() * 40, 16, 'rgba(120,255,140,A)', 0.6); ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalCompositeOperation = 'lighter'; for (const s of [-1, 1]) { const fx = sx + s * 26, fl = 18 + Math.random() * 10 + (moving ? 8 : 0) + (air && L.vy < 0 ? 30 : 0); const g = ctx.createLinearGradient(0, y - 22, 0, y - 22 + fl); g.addColorStop(0, 'rgba(120,255,220,.9)'); g.addColorStop(1, 'rgba(41,160,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - 9, y - 22); ctx.lineTo(fx + 9, y - 22); ctx.lineTo(fx, y - 22 + fl); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  if (!ok(im)) return; const sq = L.land > 0 ? 1 - L.land * 0.6 : 1, h = LUCAS_H * (L.talk ? 1 + Math.abs(Math.sin(time * 16)) * 0.012 : 1) * sq * (1 - en * 0.18), w = h * im.naturalWidth / im.naturalHeight / sq;
  ctx.save(); ctx.globalAlpha = en < 0.55 ? 1 : 1 - (en - 0.55) / 0.45 * 0.85; ctx.translate(sx, y - 18 + bob - en * 18); if (L.face < 0 && !back) ctx.scale(-1, 1); ctx.drawImage(im, -w * (name === 'lucas-avanzando' ? 0.47 : 0.5), -h, w, h);
  drawHat(h);
  if (false) { const hy = -h + 4; ctx.fillStyle = '#ff3a6a'; ctx.beginPath(); ctx.arc(0, hy + 6, 30, Math.PI, 0); ctx.fill(); stroke('#0a0e22', 3); ctx.fillStyle = '#ffd23c'; ctx.fillRect(-36, hy + 2, 72, 8); ctx.fillRect(-2, hy - 34, 4, 14); const pw = Math.cos(time * 20) * 34; ctx.fillStyle = '#29e6ff'; ctx.fillRect(-Math.abs(pw), hy - 38, Math.abs(pw) * 2, 6); }
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
  G = s || NEW(); G.peg = G.peg || {}; for (const k in PEG_ON) if (G.flags[k]) G.peg[PEG_ON[k]] = 1; if (!s) evt('partida'); state = 'play'; show('title', false); $('hud').style.display = 'flex'; $('inv').style.display = 'flex'; $('ctl').style.display = 'block'; $('ctl').classList.toggle('pc', !TOUCH); paintInv(); paintCoins();
  startMusic(); goFull(); enterRoom(G.room, G.x || 520); TR = { ph: 'in', t: 0 };
}
function goFull() { try { if (matchMedia('(pointer:coarse)').matches && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().then(() => { try { screen.orientation.lock('landscape'); } catch (e) {} }).catch(() => {}); } catch (e) {} }
$('bHint').onpointerdown = e => { e.stopPropagation(); audio(); if (busy()) return; hint(); };
$('bMenu').onpointerdown = e => { e.stopPropagation(); audio(); openMenu(); };
const HATS = () => ['gorro', 'lana', 'gafas', 'sombrero', 'corona'].filter(k => F('hat_' + k) || (k === 'gorro' && F('gorro')));
function openMenu() {
  shutUp(); const m = $('modal'); m.classList.add('on');
  const draw = () => { m.innerHTML = '<div class="card"><h2>MENÚ</h2><button class="btn green" id="mGo">▶ SEGUIR JUGANDO</button><button class="btn" id="mVoz">🗣️ NARRADOR: ' + (VOZ_ON ? 'SÍ' : 'NO') + '</button><button class="btn" id="mSnd">🔊 SONIDOS: ' + (sndOn ? 'SÍ' : 'NO') + '</button><button class="btn" id="mMus">🎵 MÚSICA: ' + (musOn ? 'SÍ' : 'NO') + '</button>' + (HATS().length ? '<button class="btn" id="mHat">🧢 CAMBIAR GORRO</button>' : '') + '<button class="btn" id="mOut">🏠 SALIR A LA PORTADA</button></div>';
    if ($('mHat')) $('mHat').onclick = () => { const l = [null].concat(HATS()), i = l.indexOf(G.hat || null); G.hat = l[(i + 1) % l.length]; save(); m.classList.remove('on'); L.cheer = 1; };
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
