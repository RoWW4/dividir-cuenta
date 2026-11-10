// Dividir la cuenta · lógica de la página
const CFG = {
  url: 'https://lvsjvdpxnuydtwajlvsv.supabase.co',
  key: 'sb_publishable_9XIhDkRWUeUjFY0qvk7Jhg_hgBc93wo',
};
const { calcular, leerTicket } = window.Calculo;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const eur = (c) => (c / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const nuevoId = () => Math.random().toString(36).slice(2, 9);
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

async function rpc(fn, args) {
  const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: CFG.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error((await r.text()) || r.status);
  return r.json();
}

// ---------- estado ----------
let id = null; // id de la cuenta abierta
let C = null; // datos de la cuenta
let ver = 0;
let yo = null;
let editando = false;
let pendientes = 0; // llamadas en curso (para no pisar con el refresco)
let guardarT = null;

function aviso(txt) {
  const t = $('#aviso');
  t.textContent = txt;
  t.classList.add('ver');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => t.classList.remove('ver'), 2200);
}

async function cargar() {
  if (pendientes || guardarT) return;
  try {
    const r = await rpc('split_get', { p_id: id });
    if (!r) { pintarError('No encuentro esta cuenta. Revisa el enlace.'); return; }
    if (pendientes || guardarT) return;
    if (r.ver !== ver) {
      ver = r.ver;
      C = normalizar(r.data);
      recordar();
      if (!(editando && document.activeElement?.matches('input'))) pintar();
    }
    $('#sinred')?.classList.remove('ver');
  } catch (e) {
    $('#sinred')?.classList.add('ver');
  }
}

function normalizar(d) {
  return {
    titulo: d.titulo || 'Cuenta',
    pagador: d.pagador || '',
    items: Array.isArray(d.items) ? d.items : [],
    personas: Array.isArray(d.personas) ? d.personas : [],
    marcas: d.marcas && typeof d.marcas === 'object' ? d.marcas : {},
    extra: d.extra || { tipo: 'pct', valor: 0 },
    totalTicket: d.totalTicket || '',
  };
}

function recordar() {
  const lista = ls.get('cuentas', []).filter((x) => x.id !== id);
  lista.unshift({ id, titulo: C.titulo, fecha: Date.now() });
  ls.set('cuentas', lista.slice(0, 20));
}

async function llamar(fn, args) {
  pendientes++;
  try {
    const v = await rpc(fn, args);
    // Solo damos por buena la versión si nadie más ha cambiado nada entre medias.
    if (typeof v === 'number' && v === ver + 1) ver = v;
    else ver = -1;
    return v;
  }
  catch (e) { aviso('No se ha podido guardar. ¿Hay internet?'); throw e; }
  finally { pendientes--; }
}

function guardar() {
  clearTimeout(guardarT);
  guardarT = setTimeout(async () => {
    guardarT = null;
    const { marcas, personas, ...datos } = C;
    await llamar('split_save', { p_id: id, p_data: datos }).catch(() => {});
  }, 600);
}

// ---------- inicio ----------
function pintarInicio() {
  document.title = 'Dividir la cuenta';
  const lista = ls.get('cuentas', []);
  $('#app').innerHTML = `
    <header><h1>🧾 Dividir la cuenta</h1></header>
    <section class="tarjeta">
      <p class="suave">Apunta lo del ticket, pasa el enlace al grupo y cada uno marca lo que ha tomado.</p>
      <form id="fNueva">
        <label>¿Qué es?<input name="titulo" placeholder="Cena del viernes" maxlength="60" required></label>
        <label>¿Cómo te llamas?<input name="yo" placeholder="Tu nombre" maxlength="30" required value="${esc(ls.get('nombre', ''))}"></label>
        <label class="fila"><input type="checkbox" name="pago" checked> He pagado yo</label>
        <button class="prim">Crear cuenta</button>
      </form>
    </section>
    ${lista.length ? `<section class="tarjeta"><h2>Cuentas recientes</h2>
      ${lista.map((x) => `<a class="reciente" href="#${esc(x.id)}">${esc(x.titulo)}<span class="suave">${new Date(x.fecha).toLocaleDateString('es-ES')}</span></a>`).join('')}
    </section>` : ''}`;
  $('#fNueva').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nombre = f.get('yo').trim();
    e.target.querySelector('button').disabled = true;
    try {
      const nid = await rpc('split_create', {
        p_data: { titulo: f.get('titulo').trim(), personas: [nombre], pagador: f.get('pago') ? nombre : '', items: [], extra: { tipo: 'pct', valor: 0 } },
      });
      ls.set('nombre', nombre);
      ls.set('yo:' + nid, nombre);
      editando = true;
      location.hash = nid;
    } catch {
      aviso('No se ha podido crear. ¿Hay internet?');
      e.target.querySelector('button').disabled = false;
    }
  };
}

function pintarError(txt) {
  $('#app').innerHTML = `<section class="tarjeta"><p>${esc(txt)}</p><a class="btn" href="#">Volver</a></section>`;
}

// ---------- cuenta ----------
function pintar() {
  if (!C) return;
  document.title = C.titulo + ' · Dividir';
  if (!yo || !C.personas.includes(yo)) return pintarQuienEres();
  const R = calcular(C);
  const mio = C.marcas;
  $('#app').innerHTML = `
    <header>
      <a href="#" class="atras" aria-label="Inicio">‹</a>
      <h1>${esc(C.titulo)}</h1>
      <button class="btn peq" data-a="compartir">Pasar enlace</button>
    </header>
    <div id="sinred" class="sinred">Sin conexión: los cambios no se guardan</div>
    <p class="suave centro">Eres <b>${esc(yo)}</b> · <a href="#" data-a="cambiarYo">cambiar</a></p>

    <section class="tarjeta">
      <div class="cab">
        <h2>Ticket</h2>
        <button class="btn peq ${editando ? 'prim' : ''}" data-a="editar">${editando ? 'Listo' : 'Editar'}</button>
      </div>
      ${editando ? pintarEdicion() : ''}
      <ul id="platos" class="platos">
        ${C.items.map((it) => pintarPlato(it, R)).join('') || `<li class="vacio">Aún no hay platos. ${editando ? '' : 'Pulsa «Editar» para añadirlos.'}</li>`}
      </ul>
      ${!editando && C.items.length ? '<p class="suave peq">Toca lo que has tomado. Si lo compartiste, que lo toque también la otra persona y se divide.</p>' : ''}
    </section>

    <section class="tarjeta">
      <h2>Lo que paga cada uno</h2>
      <ul class="resumen">
        ${C.personas.map((p) => `<li class="${p === yo ? 'yo' : ''}"><span>${esc(p)}${p === C.pagador ? ' <small>pagó</small>' : ''}</span><b>${eur(R.total[p] || 0)}</b></li>`).join('')}
      </ul>
      ${R.sinAsignar ? `<p class="alerta">Falta por marcar: <b>${eur(R.sinAsignar)}</b></p>` : C.items.length ? '<p class="ok">✓ Todo el ticket está repartido</p>' : ''}
      <div class="totales">
        <span>Platos: ${eur(R.totalPlatos)}</span>
        ${R.totalCuenta !== R.totalPlatos ? `<span>Con propina: ${eur(R.totalCuenta)}</span>` : ''}
        ${C.totalTicket && Math.round(C.totalTicket * 100) !== R.totalPlatos ? `<span class="alerta">El ticket dice ${eur(Math.round(C.totalTicket * 100))}</span>` : ''}
      </div>
      <div class="filaBtns">
        <button class="btn" data-a="extra">Propina: ${C.extra.valor ? (C.extra.tipo === 'pct' ? C.extra.valor + ' %' : eur(Math.round(C.extra.valor * 100))) : 'no'}</button>
        <button class="btn" data-a="pagador">Pagó: ${esc(C.pagador || '¿quién?')}</button>
      </div>
      <button class="prim ancho" data-a="enviar">Enviar resumen al grupo</button>
    </section>`;
  $('#platos').onclick = clicPlato;
  if (editando) prepararEdicion();
}

function pintarPlato(it, R) {
  const m = C.marcas[it.id] || {};
  const mio = m[yo] || 0;
  const uds = Number(it.uds) || 1;
  const quien = it.todos ? C.personas : Object.keys(m).filter((p) => m[p] > 0 && C.personas.includes(p));
  const reparto = R.porPlato[it.id] || {};
  if (editando)
    return `<li class="plato ed" data-id="${esc(it.id)}">
      <input class="n" value="${esc(it.uds > 1 ? it.uds : 1)}" inputmode="numeric" aria-label="Cantidad" data-c="uds">
      <input class="nom" value="${esc(it.nombre)}" aria-label="Plato" data-c="nombre">
      <input class="pre" value="${esc(String(it.precio).replace('.', ','))}" inputmode="decimal" aria-label="Precio total" data-c="precio">
      <button class="x" data-a="borrar" aria-label="Quitar">✕</button>
    </li>`;
  return `<li class="plato ${mio || it.todos ? 'mio' : ''} ${quien.length ? '' : 'libre'}" data-id="${esc(it.id)}">
    <div class="pp" data-a="marcar">
      <span class="nom">${uds > 1 ? `<span class="uds">${uds}×</span>` : ''}${esc(it.nombre)}</span>
      <span class="pre">${eur(Math.round(it.precio * 100))}</span>
    </div>
    <div class="quien">
      ${it.todos ? '<span class="chip todos">Para todos</span>' : quien.map((p) => `<span class="chip ${p === yo ? 'yo' : ''}">${esc(p)}${m[p] > 1 || uds > 1 ? ` ×${m[p]}` : ''} · ${eur(reparto[p] || 0)}</span>`).join('')}
      ${!it.todos && uds > 1 && mio ? `<span class="mas"><button data-a="menos" aria-label="Una menos">−</button><button data-a="mas" aria-label="Una más">+</button></span>` : ''}
      <button class="enlace" data-a="todos">${it.todos ? 'quitar «para todos»' : 'para todos'}</button>
    </div>
  </li>`;
}

function pintarEdicion() {
  return `
    <div class="edicion">
      <button class="btn ancho" data-a="foto">📷 Leer ticket de una foto</button>
      <input type="file" id="foto" accept="image/*" capture="environment" hidden>
      <form id="fPlato" class="nuevo">
        <input name="uds" class="n" value="1" inputmode="numeric" aria-label="Cantidad">
        <input name="nombre" class="nom" placeholder="Plato o bebida" required maxlength="60">
        <input name="precio" class="pre" placeholder="€ total" inputmode="decimal" required>
        <button class="prim" aria-label="Añadir">+</button>
      </form>
      <label class="fila peq">Total del ticket (para comprobar)
        <input id="totalTicket" class="pre" inputmode="decimal" value="${esc(C.totalTicket ? String(C.totalTicket).replace('.', ',') : '')}" placeholder="opcional"></label>
      <label class="fila peq">Nombre de la cuenta <input id="titulo" value="${esc(C.titulo)}" maxlength="60"></label>
      <p class="suave peq">Pon el precio de la línea entera (si son 3 cañas, lo que cuestan las 3).</p>
    </div>`;
}

const num = (s) => Number(String(s).replace(/\s|€/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));

function prepararEdicion() {
  $('#fPlato').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const precio = num(f.get('precio'));
    if (!(precio >= 0)) return aviso('Precio no válido');
    C.items.push({ id: nuevoId(), nombre: f.get('nombre').trim(), precio, uds: Math.max(1, parseInt(f.get('uds')) || 1) });
    guardar();
    pintar();
    $('#fPlato [name=nombre]').focus();
  };
  $('#platos').oninput = (e) => {
    const li = e.target.closest('li');
    const it = C.items.find((x) => x.id === li?.dataset.id);
    if (!it) return;
    const c = e.target.dataset.c;
    if (c === 'nombre') it.nombre = e.target.value;
    if (c === 'precio') { const v = num(e.target.value); if (v >= 0) it.precio = v; }
    if (c === 'uds') it.uds = Math.max(1, parseInt(e.target.value) || 1);
    guardar();
  };
  $('#totalTicket').oninput = (e) => { C.totalTicket = num(e.target.value) || ''; guardar(); };
  $('#titulo').oninput = (e) => { C.titulo = e.target.value.trim() || 'Cuenta'; guardar(); };
  $('#foto').onchange = (e) => e.target.files[0] && leerFoto(e.target.files[0]);
}

async function clicPlato(e) {
  const b = e.target.closest('[data-a]');
  const li = e.target.closest('li.plato');
  if (!b || !li) return;
  const it = C.items.find((x) => x.id === li.dataset.id);
  if (!it) return;
  const m = (C.marcas[it.id] ||= {});
  const a = b.dataset.a;
  if (a === 'borrar') {
    C.items = C.items.filter((x) => x !== it);
    guardar();
    return pintar();
  }
  if (a === 'todos') {
    it.todos = !it.todos;
    guardar();
    return pintar();
  }
  let peso = m[yo] || 0;
  const uds = Number(it.uds) || 1;
  if (a === 'marcar') {
    if (it.todos) return aviso('Está «para todos». Quítalo para marcarlo solo para algunos.');
    peso = peso ? 0 : 1;
  }
  if (a === 'mas') peso = Math.min(uds, peso + 1);
  if (a === 'menos') peso = Math.max(0, peso - 1);
  if (peso) m[yo] = peso; else delete m[yo];
  pintar();
  if (navigator.vibrate) navigator.vibrate(10);
  await llamar('split_mark', { p_id: id, p_item: it.id, p_persona: yo, p_peso: peso }).catch(() => {});
}

function pintarQuienEres() {
  $('#app').innerHTML = `
    <header><h1>${esc(C.titulo)}</h1></header>
    <section class="tarjeta">
      <h2>¿Quién eres?</h2>
      <div class="personas">
        ${C.personas.map((p) => `<button class="btn" data-p="${esc(p)}">${esc(p)}</button>`).join('')}
      </div>
      <form id="fYo" class="nuevo">
        <input name="n" placeholder="Si no sales, escribe tu nombre" maxlength="30" required value="${esc(C.personas.includes(ls.get('nombre', '')) ? '' : ls.get('nombre', ''))}">
        <button class="prim">Entrar</button>
      </form>
      <p class="suave peq">Luego tocas lo que has tomado y ves cuánto te toca.</p>
    </section>`;
  $('.personas').onclick = (e) => { const p = e.target.dataset.p; if (p) elegirYo(p); };
  $('#fYo').onsubmit = async (e) => {
    e.preventDefault();
    const n = new FormData(e.target).get('n').trim();
    if (!n) return;
    if (!C.personas.includes(n)) {
      C.personas.push(n);
      await llamar('split_join', { p_id: id, p_persona: n }).catch(() => {});
    }
    elegirYo(n);
  };
}

function elegirYo(p) {
  yo = p;
  ls.set('yo:' + id, p);
  ls.set('nombre', p);
  pintar();
}

// ---------- foto del ticket ----------
let tesseract = null;
function cargarTesseract() {
  if (window.Tesseract) return Promise.resolve();
  return (tesseract ||= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = ok;
    s.onerror = () => { tesseract = null; mal(new Error('No se pudo cargar el lector')); };
    document.head.appendChild(s);
  }));
}

async function leerFoto(archivo) {
  const v = ventana(`<h2>Leyendo el ticket…</h2><p class="suave" id="prog">Preparando (la primera vez tarda un poco)</p><div class="barra"><i id="barra"></i></div>`);
  try {
    await cargarTesseract();
    const img = await reducir(archivo);
    const r = await Tesseract.recognize(img, 'spa', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          $('#prog', v).textContent = 'Leyendo…';
          $('#barra', v).style.width = Math.round(m.progress * 100) + '%';
        }
      },
    });
    const leidos = leerTicket(r.data.text);
    if (!leidos.length) {
      v.innerHTML = `<h2>No he sabido leerlo</h2><p class="suave">Prueba con más luz y el ticket estirado, o apúntalo a mano.</p><button class="prim ancho" data-cerrar>Vale</button>`;
      return;
    }
    v.innerHTML = `<h2>He leído esto</h2><p class="suave peq">Quita lo que no sea un plato y corrige lo que esté mal después.</p>
      <ul class="leidos">${leidos.map((x, i) => `<li><label><input type="checkbox" checked data-i="${i}"> <span>${x.uds > 1 ? x.uds + '× ' : ''}${esc(x.nombre)}</span><b>${eur(Math.round(x.precio * 100))}</b></label></li>`).join('')}</ul>
      <p class="suave peq">Suma: ${eur(leidos.reduce((a, x) => a + Math.round(x.precio * 100), 0))}</p>
      <div class="filaBtns"><button class="btn" data-cerrar>Cancelar</button><button class="prim" id="anadir">Añadir</button></div>`;
    $('#anadir', v).onclick = () => {
      v.querySelectorAll('input:checked').forEach((c) => {
        const x = leidos[c.dataset.i];
        C.items.push({ id: nuevoId(), nombre: x.nombre, precio: x.precio, uds: x.uds });
      });
      cerrarVentana();
      guardar();
      pintar();
    };
  } catch (e) {
    v.innerHTML = `<h2>Algo ha fallado</h2><p class="suave">${esc(e.message)}</p><button class="prim ancho" data-cerrar>Vale</button>`;
  }
}

// Reduce la foto para que lea más rápido, y la pasa a gris con contraste.
async function reducir(archivo) {
  const bmp = await createImageBitmap(archivo);
  const max = 1800;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  const g = cv.getContext('2d');
  g.filter = 'grayscale(1) contrast(1.4)';
  g.drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv;
}

// ---------- ventanas ----------
function ventana(html) {
  cerrarVentana();
  const fondo = document.createElement('div');
  fondo.className = 'fondo';
  fondo.innerHTML = `<div class="ventana">${html}</div>`;
  fondo.onclick = (e) => { if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrarVentana(); };
  document.body.appendChild(fondo);
  return $('.ventana', fondo);
}
function cerrarVentana() { document.querySelector('.fondo')?.remove(); }

function textoResumen() {
  const R = calcular(C);
  const lineas = C.personas.map((p) => `• ${p}: ${eur(R.total[p] || 0)}`);
  let t = `🧾 ${C.titulo}\n${lineas.join('\n')}\nTotal: ${eur(R.totalCuenta)}`;
  if (R.sinAsignar) t += `\n⚠️ Falta por marcar: ${eur(R.sinAsignar)}`;
  if (C.pagador) t += `\n💸 Pagó ${C.pagador}: cada uno le pasa lo suyo.`;
  return t + `\n${location.href}`;
}

async function compartir(texto, url) {
  if (navigator.share) {
    try { await navigator.share(url ? { title: C.titulo, text: texto, url } : { text: texto }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const todo = url ? `${texto} ${url}` : texto;
  try { await navigator.clipboard.writeText(todo); aviso('Copiado. Pégalo en el grupo.'); }
  catch { window.open('https://wa.me/?text=' + encodeURIComponent(todo)); }
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b || b.closest('#platos')) return;
  const a = b.dataset.a;
  if (a === 'editar') { editando = !editando; pintar(); }
  if (a === 'foto') $('#foto').click();
  if (a === 'compartir') compartir(`Marca lo que has tomado en «${C.titulo}»:`, location.href);
  if (a === 'enviar') compartir(textoResumen());
  if (a === 'cambiarYo') { e.preventDefault(); yo = null; ls.set('yo:' + id, null); pintar(); }
  if (a === 'pagador') {
    const v = ventana(`<h2>¿Quién pagó?</h2><div class="personas">${C.personas.map((p) => `<button class="btn ${p === C.pagador ? 'prim' : ''}" data-p="${esc(p)}">${esc(p)}</button>`).join('')}</div>`);
    v.onclick = (ev) => { const p = ev.target.dataset.p; if (p) { C.pagador = p; guardar(); cerrarVentana(); pintar(); } };
  }
  if (a === 'extra') {
    const v = ventana(`<h2>Propina o extra</h2>
      <p class="suave peq">Se reparte según lo que ha tomado cada uno.</p>
      <div class="personas">${[0, 5, 10].map((n) => `<button class="btn" data-pct="${n}">${n ? n + ' %' : 'Sin propina'}</button>`).join('')}</div>
      <form id="fExtra" class="nuevo"><input name="v" class="pre" inputmode="decimal" placeholder="€ fijos" value="${C.extra.tipo === 'eur' ? esc(C.extra.valor) : ''}"><button class="prim">Poner €</button></form>`);
    v.onclick = (ev) => {
      const n = ev.target.dataset.pct;
      if (n != null) { C.extra = { tipo: 'pct', valor: Number(n) }; guardar(); cerrarVentana(); pintar(); }
    };
    $('#fExtra', v).onsubmit = (ev) => {
      ev.preventDefault();
      C.extra = { tipo: 'eur', valor: num(new FormData(ev.target).get('v')) || 0 };
      guardar(); cerrarVentana(); pintar();
    };
  }
});

// ---------- arranque ----------
let reloj = null;
function ruta() {
  clearInterval(reloj);
  cerrarVentana();
  id = location.hash.slice(1) || null;
  C = null; ver = 0;
  if (!id) return pintarInicio();
  yo = ls.get('yo:' + id, null);
  $('#app').innerHTML = '<p class="suave centro">Cargando…</p>';
  cargar();
  reloj = setInterval(() => document.visibilityState === 'visible' && cargar(), 3000);
}
window.addEventListener('hashchange', ruta);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && id && cargar());
ruta();
