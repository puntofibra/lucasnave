/* LUCAS Y LA NAVE PERDIDA · backend. Responde JSON a POST con el cuerpo {a:'accion', ...} */
const PROPS = PropertiesService.getScriptProperties();
const CACHE = CacheService.getScriptCache();
const SHEET_ID = '1pN8S7ZQ_1oCTHPWrgFZkYCjpwmElNNtPnF4rdM6pqCw';
const GOOGLE_ID = '454055120059-nuhaop4r62urc3u036cc3grpqo71ulg7.apps.googleusercontent.com';
const JUEGO = 'LUCAS Y LA NAVE PERDIDA';

function doGet() { return out({ ok: true, juego: JUEGO }); }
function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents || '{}'); } catch (x) { return out({ ok: false, error: 'Petición no válida' }); }
  try { return out(Object.assign({ ok: true }, accion(d))); }
  catch (x) { return out({ ok: false, error: String(x.message || x) }); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- llaves NFC de admin ---------- */
function llaves() { try { return JSON.parse(PROPS.getProperty('llaves') || '[]'); } catch (e) { return []; } }
function guardaLlaves(l) { PROPS.setProperty('llaves', JSON.stringify(l)); }
const limpia = k => String(k || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 40);
function nuevoToken() { const t = Utilities.getUuid(); CACHE.put('adm_' + t, '1', 21600); return t; }
function tokenOk(t) { return t && CACHE.get('adm_' + t) === '1'; }
function intentoMalo() { const n = +(CACHE.get('malos') || 0) + 1; CACHE.put('malos', String(n), 600); }
function bloqueado() { return +(CACHE.get('malos') || 0) >= 8; }
function entrarConLlave(k) {
  k = limpia(k); if (k.length < 6) throw new Error('No se ha podido leer la llave');
  if (bloqueado()) throw new Error('Demasiados intentos. Espera 10 minutos.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const l = llaves();
    if (!l.length) { l.push({ k, n: 'Llave maestra', f: new Date().toISOString() }); guardaLlaves(l); return { adm: nuevoToken(), nueva: true }; }
    if (l.some(x => x.k === k)) return { adm: nuevoToken() };
    intentoMalo(); throw new Error('Llave no autorizada');
  } finally { lock.releaseLock(); }
}

function accion(d) {
  const a = d.a;
  if (a === 'llave') return entrarConLlave(d.k);
  if (a === 'qr') { const q = Utilities.getUuid().replace(/-/g, '').slice(0, 16); CACHE.put('qr_' + q, 'pend', 300); return { q }; }
  if (a === 'qrOk') { const q = String(d.q || ''); if (CACHE.get('qr_' + q) !== 'pend') throw new Error('El QR ha caducado'); const r = entrarConLlave(d.k); CACHE.put('qr_' + q, 'ok:' + r.adm, 300); return { nueva: !!r.nueva }; }
  if (a === 'qrEst') { const v = CACHE.get('qr_' + String(d.q || '')); if (!v) return { estado: 'caducado' }; if (v.indexOf('ok:') === 0) { CACHE.remove('qr_' + d.q); return { estado: 'ok', adm: v.slice(3) }; } return { estado: 'pend' }; }
  if (a === 'evt') return evento(d);
  if (a === 'registro') return registro(d);
  if (a === 'entrar') return entrar(d);
  if (a === 'google') return entrarGoogle(d);
  if (a === 'cargar') return cargar(d);
  if (a === 'guardar') return guardar(d);
  if (a === 'salir') return salir(d);
  if (a === 'recuperar') return recuperar(d);
  if (a === 'restablecer') return restablecer(d);
  if (a === 'adm') {
    if (!tokenOk(d.t)) throw new Error('ADMIN');
    const op = d.op, lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      let l = llaves();
      if (op === 'llaves') return { llaves: l };
      if (op === 'llaveAdd') { const k = limpia(d.k); if (k.length < 6) throw new Error('Código de llave no válido'); if (l.some(x => x.k === k)) throw new Error('Esa llave ya está guardada'); l.push({ k, n: String(d.n || 'Llave').slice(0, 30), f: new Date().toISOString() }); guardaLlaves(l); return { llaves: l }; }
      if (op === 'llaveDel') { if (l.length <= 1) throw new Error('No puedes borrar la última llave: te quedarías sin acceso'); l = l.filter(x => x.k !== limpia(d.k)); guardaLlaves(l); return { llaves: l }; }
      if (op === 'stats') return { stats: stats(), jugadores: Math.max(0, hoja().getLastRow() - 1) };
      if (op === 'statsReset') { PROPS.deleteProperty('stats'); return { stats: stats() }; }
      throw new Error('Operación desconocida');
    } finally { lock.releaseLock(); }
  }
  throw new Error('Acción desconocida');
}

/* ---------- estadísticas: visitas por día, partidas empezadas, salas alcanzadas y capítulos terminados ---------- */
function stats() { try { return JSON.parse(PROPS.getProperty('stats') || '{}'); } catch (e) { return {}; } }
function evento(d) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return {};
  try {
    const s = stats(), dia = Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd'), f = String(d.f || '').slice(0, 20);
    s.dias = s.dias || {}; s.salas = s.salas || {}; s.tot = s.tot || { visitas: 0, partidas: 0, fin: 0 };
    if (d.e === 'visita') { s.dias[dia] = (s.dias[dia] || 0) + 1; s.tot.visitas++; const ks = Object.keys(s.dias).sort(); while (ks.length > 60) delete s.dias[ks.shift()]; }
    else if (d.e === 'partida') s.tot.partidas++;
    else if (d.e === 'sala' && f) s.salas[f] = (s.salas[f] || 0) + 1;
    else if (d.e === 'fin') s.tot.fin++;
    PROPS.setProperty('stats', JSON.stringify(s)); return {};
  } finally { lock.releaseLock(); }
}

/* ---------- cuentas: correo y contraseña, o Google ---------- */
const COLS = ['email', 'nombre', 'hash', 'sal', 'google', 'creado', 'ultimo', 'progreso', 'sesiones'];
function hoja() {
  const ss = SpreadsheetApp.openById(SHEET_ID); let sh = ss.getSheetByName('jugadores');
  if (!sh) { sh = ss.insertSheet('jugadores'); sh.appendRow(COLS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#0b1430').setFontColor('#29e6ff'); const h1 = ss.getSheetByName('Hoja 1'); if (h1 && ss.getSheets().length > 1) try { ss.deleteSheet(h1); } catch (e) {} }
  return sh;
}
function filas() { const sh = hoja(), v = sh.getDataRange().getValues(); return { sh, v }; }
function buscar(email) { const { sh, v } = filas(); email = String(email || '').trim().toLowerCase(); for (let i = 1; i < v.length; i++) if (String(v[i][0]).toLowerCase() === email) return { sh, row: i + 1, r: v[i] }; return { sh, row: 0, r: null }; }
function sha(t) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
function nuevaSesion(sh, row, r) {
  const t = Utilities.getUuid(); let ss = []; try { ss = JSON.parse(r[8] || '[]'); } catch (e) {} ss.push(t); while (ss.length > 8) ss.shift();
  sh.getRange(row, 9).setValue(JSON.stringify(ss)); sh.getRange(row, 7).setValue(new Date()); return t;
}
function perfil(r, ses) { let pg = {}; try { pg = JSON.parse(r[7] || '{}'); } catch (e) {} return { ses, email: r[0], nombre: r[1], progreso: pg }; }
function registro(d) {
  const email = String(d.email || '').trim().toLowerCase(), nombre = String(d.nombre || '').trim().slice(0, 24), pass = String(d.pass || '');
  if (!emailOk(email)) throw new Error('Escribe un correo válido'); if (nombre.length < 2) throw new Error('Escribe tu nombre'); if (pass.length < 6) throw new Error('La contraseña debe tener al menos 6 letras o números');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const f = buscar(email); if (f.row) throw new Error('Ese correo ya tiene cuenta: entra con él');
    const sal = Utilities.getUuid(), now = new Date(); f.sh.appendRow([email, nombre, sha(sal + pass), sal, '', now, now, '{}', '[]']);
    const g = buscar(email); return perfil(g.r, nuevaSesion(g.sh, g.row, g.r)); } finally { lock.releaseLock(); }
}
function entrar(d) {
  const f = buscar(d.email); if (!f.row) throw new Error('No hay ninguna cuenta con ese correo');
  if (!f.r[2]) throw new Error('Esta cuenta se creó con Google: entra con el botón de Google');
  if (sha(f.r[3] + String(d.pass || '')) !== f.r[2]) throw new Error('Contraseña incorrecta');
  return perfil(f.r, nuevaSesion(f.sh, f.row, f.r));
}
function entrarGoogle(d) {
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(d.credential || ''), { muteHttpExceptions: true });
  const j = JSON.parse(res.getContentText() || '{}'); if (j.aud !== GOOGLE_ID || String(j.email_verified) !== 'true') throw new Error('No se pudo comprobar tu cuenta de Google');
  const email = String(j.email).toLowerCase(), lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { let f = buscar(email); if (!f.row) { const now = new Date(); f.sh.appendRow([email, String(j.given_name || j.name || email.split('@')[0]).slice(0, 24), '', '', j.sub, now, now, '{}', '[]']); f = buscar(email); }
    return perfil(f.r, nuevaSesion(f.sh, f.row, f.r)); } finally { lock.releaseLock(); }
}
function porSesion(ses) { const { sh, v } = filas(); if (!ses) throw new Error('SESION'); for (let i = 1; i < v.length; i++) { if (String(v[i][8] || '').indexOf(ses) >= 0) return { sh, row: i + 1, r: v[i] }; } throw new Error('SESION'); }
function cargar(d) { const f = porSesion(d.ses); return perfil(f.r, d.ses); }
function guardar(d) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const f = porSesion(d.ses); const data = JSON.stringify(d.progreso || {}); if (data.length > 45000) throw new Error('Progreso demasiado grande');
    f.sh.getRange(f.row, 8).setValue(data); f.sh.getRange(f.row, 7).setValue(new Date()); return {}; } finally { lock.releaseLock(); }
}
function salir(d) { try { const f = porSesion(d.ses); let ss = JSON.parse(f.r[8] || '[]').filter(x => x !== d.ses); f.sh.getRange(f.row, 9).setValue(JSON.stringify(ss)); } catch (e) {} return {}; }
function recuperar(d) {
  const f = buscar(d.email); if (!f.row) throw new Error('No hay ninguna cuenta con ese correo');
  const cod = String(Math.floor(100000 + Math.random() * 900000)); CACHE.put('rec_' + f.r[0], cod, 900);
  MailApp.sendEmail({ to: f.r[0], subject: JUEGO + ' · código para cambiar tu contraseña', htmlBody: '<div style="font-family:Arial;background:#070a1e;color:#fff;padding:24px;border-radius:12px"><h2 style="color:#29e6ff">' + JUEGO + '</h2><p>Tu código para cambiar la contraseña es:</p><p style="font-size:32px;letter-spacing:8px;color:#35ff8a"><b>' + cod + '</b></p><p style="color:#9fb4ff">Caduca en 15 minutos. Si no lo has pedido tú, ignora este correo.</p></div>' });
  return {};
}
function restablecer(d) {
  const f = buscar(d.email); if (!f.row) throw new Error('No hay ninguna cuenta con ese correo');
  const c = CACHE.get('rec_' + f.r[0]); if (!c || c !== String(d.codigo || '').trim()) throw new Error('Código incorrecto o caducado');
  const pass = String(d.pass || ''); if (pass.length < 6) throw new Error('La contraseña debe tener al menos 6 letras o números');
  const sal = Utilities.getUuid(); f.sh.getRange(f.row, 3, 1, 2).setValues([[sha(sal + pass), sal]]); CACHE.remove('rec_' + f.r[0]);
  const g = buscar(d.email); return perfil(g.r, nuevaSesion(g.sh, g.row, g.r));
}
/* Ejecuta esta función UNA vez desde el editor (botón ▶ Ejecutar) para dar los permisos de la hoja, el correo y Google */
function autorizar() { hoja(); UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true }); MailApp.getRemainingDailyQuota(); Logger.log('Permisos listos ✔'); }
