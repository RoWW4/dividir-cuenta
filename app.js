// Dividir la cuenta · lógica de la página
const CFG = {
  url: 'https://lvsjvdpxnuydtwajlvsv.supabase.co',
  key: 'sb_publishable_9XIhDkRWUeUjFY0qvk7Jhg_hgBc93wo',
};
const { calcular, leerTicket, cabezas } = window.Calculo;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const eur = (c) => (c / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const cts = (n) => Math.round((Number(n) || 0) * 100);
const dec = (n) => (n === '' || n == null ? '' : (Number(n) || 0).toFixed(2).replace('.', ','));
const num = (s) => Number(String(s).replace(/\s|€/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
const nuevoId = () => Math.random().toString(36).slice(2, 9);
const clave = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- iconos (trazos sencillos) ----------
const P = {
  recibo: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  camara: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  imagen: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  enviar: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  enlace: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  gente: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  papelera: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  mas: '<path d="M5 12h14M12 5v14"/>',
  menos: '<path d="M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  atras: '<path d="m15 18-6-6 6-6"/>',
  cubiertos: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  aviso: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  dedo: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  cartera: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
};
const ico = (n, t = 20) => `<svg class="i" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

// ---------- gatitos: uno por persona, cada uno de un color ----------
const COLORES = ['#f97316', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#a16207', '#64748b', '#d946ef'];
function color(n, k = 0) {
  const i = C ? C.personas.indexOf(n) : -1;
  if (i >= 0) return COLORES[(i + k * 5) % COLORES.length];
  let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[(h + k * 5) % COLORES.length];
}
const GATO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5.2 15.5 6.4 4.6l7 5.1Q16 9 18.6 9.7l7-5.1 1.2 10.9Q29 19 27 23q-3.2 5.2-11 5.2T5 23q-2-4 .2-7.5Z" fill="var(--c)"/><path d="m8 7.7.6 5 3.3-2.6Zm16 0-.6 5-3.3-2.6Z" fill="#fff" opacity=".35"/><ellipse cx="11.6" cy="17.6" rx="2.2" ry="2.5" fill="#fff"/><ellipse cx="20.4" cy="17.6" rx="2.2" ry="2.5" fill="#fff"/><circle cx="12" cy="18" r="1.3" fill="#1f2937"/><circle cx="20.8" cy="18" r="1.3" fill="#1f2937"/><path d="M14.8 21.2h2.4L16 22.6Z" fill="#fda4af"/><path d="M16 22.6q-.4 1.4-2 1.4M16 22.6q.4 1.4 2 1.4M3.5 20.5l6 .8M3.8 23.8l5.8-1.4M28.5 20.5l-6 .8M28.2 23.8l-5.8-1.4" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;
// Una persona = un gatito. Una pareja ("Ana y Salvi") = dos gatitos juntos.
function av(n, cl = '') {
  const k = Math.min(cabezas(n), 3);
  if (k === 1) return `<span class="av ${cl}" style="--c:${color(n)}" title="${esc(n)}">${GATO}</span>`;
  return `<span class="av grupo g${k} ${cl}" title="${esc(n)}">${Array.from({ length: k }, (_, j) => `<span class="av" style="--c:${color(n, j)}">${GATO}</span>`).join('')}</span>`;
}

async function rpc(fn, args) {
  const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: CFG.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const t = await r.text();
    const e = new Error(t || r.status);
    e.lleno = /lleno/.test(t);
    throw e;
  }
  return r.json();
}

// ---------- estado ----------
let id = null; // cuenta abierta
let C = null; // sus datos
let ver = 0;
let yo = null; // quien marca ahora mismo
let yoReal = null; // quien eres tú en este móvil
let editando = false;
let pendientes = 0; // llamadas en curso (para no pisar con el refresco)
let guardarT = null;
let recienCreada = null;

const porOtro = () => yo !== yoReal;
const hay = () => C.personas.reduce((a, p) => a + cabezas(p), 0); // personas que ya han entrado (una pareja = 2)
const tope = () => Number(C.comensales) || 0;
const faltan = () => Math.max(0, tope() - hay());
const esCreador = () => !!ls.get('clave:' + id, null);

function aviso(txt) {
  const t = $('#aviso');
  t.textContent = txt;
  t.classList.add('ver');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => t.classList.remove('ver'), 2600);
}

async function cargar() {
  if (pendientes || guardarT) return;
  try {
    const r = await rpc('split_get', { p_id: id });
    if (!r) { olvidar(id); pintarError('Esta cuenta no existe o la han borrado.'); return; }
    if (pendientes || guardarT) return;
    if (r.ver !== ver) {
      ver = r.ver;
      C = normalizar(r.data);
      recordar();
      const escribiendo = document.activeElement?.matches('input') && document.activeElement.closest('#app');
      if (!(editando && escribiendo) && !document.querySelector('.fondo')) pintar();
    }
    $('#sinred')?.classList.remove('ver');
  } catch (e) {
    if (!C) pintarError('No se puede cargar la cuenta. ¿Hay internet?');
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
    comensales: Number(d.comensales) || '',
    totalTicket: d.totalTicket || '',
  };
}

function recordar() {
  const lista = ls.get('cuentas', []).filter((x) => x.id !== id);
  lista.unshift({ id, titulo: C.titulo, fecha: Date.now() });
  ls.set('cuentas', lista.slice(0, 30));
}
function olvidar(cid) {
  ls.set('cuentas', ls.get('cuentas', []).filter((x) => x.id !== cid));
  ['yo:', 'clave:'].forEach((k) => ls.set(k + cid, null));
}

async function llamar(fn, args) {
  pendientes++;
  try {
    const v = await rpc(fn, args);
    // Solo damos por buena la versión si nadie más ha cambiado nada entre medias.
    if (typeof v === 'number' && v === ver + 1) ver = v;
    else ver = -1;
    return v;
  } catch (e) {
    if (!e.lleno) aviso('No se ha podido guardar. ¿Hay internet?');
    throw e;
  } finally {
    pendientes--;
  }
}

function guardar() {
  clearTimeout(guardarT);
  guardarT = setTimeout(async () => {
    guardarT = null;
    const { marcas, personas, ...datos } = C;
    await llamar('split_save', { p_id: id, p_data: datos }).catch(() => {});
  }, 600);
}

const contador = (nombre, valor, min = 1, max = 99) => `<div class="stepper" data-min="${min}" data-max="${max}">
  <button type="button" data-paso="-1" aria-label="Uno menos">${ico('menos', 18)}</button>
  <input name="${nombre}" value="${valor}" inputmode="numeric" aria-label="Número de personas">
  <button type="button" data-paso="1" aria-label="Uno más">${ico('mas', 18)}</button></div>`;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-paso]');
  if (!b) return;
  const st = b.closest('.stepper');
  const inp = st.querySelector('input');
  const v = Math.min(Number(st.dataset.max), Math.max(Number(st.dataset.min), (parseInt(inp.value) || 0) + Number(b.dataset.paso)));
  inp.value = v;
  inp.dispatchEvent(new Event('input', { bubbles: true }));
});

// ---------- portada ----------
function pintarInicio() {
  document.title = 'Dividir la cuenta';
  quitarBarra();
  const lista = ls.get('cuentas', []);
  $('#app').innerHTML = `
    <section class="hero">
      <div class="logo">${ico('recibo', 34)}</div>
      <h1>Dividir la cuenta</h1>
      <p>Cada uno paga lo que ha tomado, sin líos.</p>
      <div class="pasos">
        <div>${ico('camara', 22)}<span>Apunta el ticket</span></div>
        <div>${ico('enlace', 22)}<span>Pasa el enlace</span></div>
        <div>${ico('dedo', 22)}<span>Cada uno marca lo suyo</span></div>
      </div>
    </section>
    <section class="tarjeta">
      <h2 class="titulo-sec">Nueva cuenta</h2>
      <form id="fNueva">
        <label class="campo"><span>¿Qué es?</span><input name="titulo" placeholder="Cena del viernes" maxlength="60" required></label>
        <label class="campo"><span>Tu nombre</span><input name="yo" placeholder="Ej. Ana · en pareja: Ana y Salvi" maxlength="40" required autocomplete="given-name" value="${esc(ls.get('nombre', ''))}"></label>
        <div class="campo"><span>¿Cuántos sois en total?</span>
          <div class="fila-num">${contador('comensales', 1, 1, 99)}<small class="suave">Contándote a ti. Una pareja cuenta como 2. Se puede cambiar después.</small></div></div>
        <label class="casilla"><input type="checkbox" name="pago" checked><span>He pagado yo</span></label>
        <button class="prim ancho">Crear y apuntar el ticket</button>
      </form>
    </section>
    ${lista.length ? `<section class="tarjeta"><h2 class="titulo-sec">Tus cuentas</h2>
      ${lista.map((x) => `<div class="reciente"><a href="#${esc(x.id)}"><span class="ic">${ico('recibo', 18)}</span><span class="t">${esc(x.titulo)}<small>${new Date(x.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</small></span></a>
        <button class="icono plano" data-a="borrarReciente" data-id="${esc(x.id)}" aria-label="Borrar ${esc(x.titulo)}">${ico('papelera', 18)}</button></div>`).join('')}
    </section>` : ''}`;
  $('#fNueva').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nombre = f.get('yo').trim();
    const titulo = f.get('titulo').trim();
    const comensales = Math.max(1, parseInt(f.get('comensales')) || 1);
    if (!nombre || !titulo) return;
    if (cabezas(nombre) > comensales) return aviso(`«${nombre}» son ${cabezas(nombre)} personas: sube el número de personas.`);
    const b = e.target.querySelector('button.prim');
    b.disabled = true;
    b.textContent = 'Creando…';
    const k = clave();
    try {
      const nid = await rpc('split_create', {
        p_data: { titulo, comensales, personas: [nombre], pagador: f.get('pago') ? nombre : '', items: [] },
        p_clave: k,
      });
      ls.set('nombre', nombre);
      ls.set('yo:' + nid, nombre);
      ls.set('clave:' + nid, k);
      recienCreada = nid;
      location.hash = nid;
    } catch {
      aviso('No se ha podido crear. ¿Hay internet?');
      b.disabled = false;
      b.textContent = 'Crear y apuntar el ticket';
    }
  };
}

function preguntarBorrar(cid, titulo) {
  const mia = !!ls.get('clave:' + cid, null);
  const v = ventana(`<h2>Borrar «${esc(titulo)}»</h2>
    <p class="suave peq">${mia ? 'La creaste tú: puedes borrarla para todos (el enlace dejará de funcionar) o solo quitarla de tu lista.' : 'Se quita de tu lista. Los demás la seguirán viendo con el enlace: solo quien la creó puede borrarla para todos.'}</p>
    <div class="botones">
      ${mia ? `<button class="peligro ancho" data-b="todos">${ico('papelera', 18)} Borrar para todos</button>` : ''}
      <button class="${mia ? 'btn' : 'peligro'} ancho" data-b="lista">Quitar de mi lista</button>
      <button class="btn ancho" data-cerrar>Cancelar</button>
    </div>`);
  v.onclick = async (e) => {
    const q = e.target.closest('[data-b]')?.dataset.b;
    if (!q) return;
    if (q === 'todos') {
      try {
        const ok = await rpc('split_delete', { p_id: cid, p_clave: ls.get('clave:' + cid, '') });
        if (!ok) return aviso('No se ha podido borrar.');
      } catch { return aviso('No se ha podido borrar. ¿Hay internet?'); }
    }
    olvidar(cid);
    cerrarVentana();
    aviso(q === 'todos' ? 'Cuenta borrada' : 'Quitada de tu lista');
    if (location.hash.slice(1) === cid) location.hash = '';
    else pintarInicio();
  };
}

function pintarError(txt) {
  quitarBarra();
  $('#app').innerHTML = `<div class="cabecera"><a href="#" class="icono" aria-label="Inicio">${ico('atras')}</a><h1>Dividir la cuenta</h1></div>
    <section class="tarjeta centro"><p style="margin-bottom:14px">${esc(txt)}</p><a class="prim" href="#">Ir al inicio</a></section>`;
}

// ---------- cuenta ----------
function pintar() {
  if (!C) return;
  document.title = C.titulo + ' · Dividir';
  if (!yoReal || !C.personas.includes(yoReal)) return pintarQuienEres();
  if (!yo || !C.personas.includes(yo)) yo = yoReal;
  const R = calcular(C);
  const sinMarcar = !porOtro() && !editando && C.items.length && !C.items.some((it) => it.todos || (C.marcas[it.id] || {})[yo]);
  $('#app').innerHTML = `
    <div class="cabecera">
      <a href="#" class="icono" aria-label="Inicio">${ico('atras')}</a>
      <h1>${esc(C.titulo)}</h1>
      <button class="icono" data-a="compartir" aria-label="Pasar enlace al grupo">${ico('compartir')}</button>
    </div>
    <div id="sinred" class="sinred">Sin conexión: los cambios no se guardan</div>

    <div class="gente">
      ${C.personas.map((p) => `<button class="persona ${p === yo ? 'yo' : ''}" data-a="${p === yoReal ? 'cambiarYo' : 'porOtro'}" data-p="${esc(p)}">${av(p)}<span>${esc(p)}${p === yoReal ? ' <small>(tú)</small>' : ''}</span></button>`).join('')}
      <button class="persona mas" data-a="persona">${ico('mas', 16)} Añadir</button>
    </div>
    <button class="aforo ${tope() && !faltan() ? 'completo' : ''}" data-a="aforo">${!tope() ? `${hay()} ${hay() === 1 ? 'persona' : 'personas'}` : faltan() ? `${hay()} de ${tope()} personas · faltan ${faltan()} por entrar` : `${ico('check', 14)} Estáis todos (${tope()})`}<span>${ico('lapiz', 13)} Cambiar</span></button>

    ${porOtro() ? `<div class="banda alerta"><p>Estás marcando lo de <b>${esc(yo)}</b>.</p><button class="btn peq" data-a="quitar" data-p="${esc(yo)}">Quitar</button><button class="prim" data-a="volver">Volver a mí</button></div>` : ''}
    ${!editando && C.personas.length === 1 && C.items.length ? `<div class="banda info">${ico('enlace')}<p>Ahora <b>pasa el enlace</b> al grupo. Lo verán al momento; no tienen que registrarse, solo elegir su nombre.</p></div>` : ''}
    ${sinMarcar ? `<div class="banda info">${ico('dedo')}<p><b>Toca lo que has tomado.</b> Si lo compartiste, la otra persona también lo toca y se divide.</p></div>` : ''}

    ${!editando && C.items.length ? pintarPagador(R) : ''}

    <section class="tarjeta">
      <div class="cab">
        <h2>${editando ? 'Apuntar el ticket' : 'Ticket'}</h2>
        ${editando || !C.items.length ? '' : `<button class="btn peq" data-a="editar">${ico('lapiz', 16)} Editar</button>`}
      </div>
      ${editando ? pintarEdicion() : C.items.length ? `<ul id="platos" class="platos">${C.items.map((it) => pintarPlato(it, R)).join('')}</ul>` : pintarVacio()}
    </section>

    ${C.items.length && !editando ? pintarResumen(R) : ''}`;
  pintarBarra(R);
  $('#app').oninput = null;
  if (editando) prepararEdicion();
  else if ($('#platos')) $('#platos').onclick = clicPlato;
}

function pintarVacio() {
  return `<div class="vacio">
    <div class="gr">${ico('cubiertos', 30)}</div>
    <p class="suave">Todavía no hay nada apuntado.</p>
    <div class="fotos">
      <button class="btn" data-a="fotoCam">${ico('camara')} Hacer foto</button>
      <button class="btn" data-a="fotoSubir">${ico('imagen')} Subir foto</button>
    </div>
    <button class="prim ancho" data-a="editar">${ico('lapiz')} Escribirlo a mano</button>
  </div>`;
}

function pintarPlato(it, R) {
  const m = C.marcas[it.id] || {};
  const mio = m[yo] || 0;
  const uds = Number(it.uds) || 1;
  const quien = it.todos ? C.personas : Object.keys(m).filter((p) => m[p] > 0 && C.personas.includes(p));
  const reparto = R.porPlato[it.id] || {};
  const marcado = mio || it.todos;
  return `<li class="plato ${marcado ? 'mio' : ''} ${quien.length ? '' : 'libre'}" data-id="${esc(it.id)}">
    <div class="pp" data-a="marcar" role="checkbox" aria-checked="${marcado ? 'true' : 'false'}" tabindex="0">
      <span class="check">${marcado ? ico('check', 14) : ''}</span>
      <span class="nom">${uds > 1 ? `<span class="uds">${uds}×</span>` : ''}${esc(it.nombre)}</span>
      <span class="pre">${eur(cts(it.precio))}</span>
    </div>
    <div class="quien">${pintarQuien(it, m, quien, reparto, uds, R.faltaPlato[it.id] || 0)}</div>
    ${!it.todos && uds === 1 && mio ? `<div class="pie"><span class="suave peq">${mio < 1 ? `${porOtro() ? esc(yo) : 'Tú'}: <b>${fraccion(yo, mio)} · ${eur(reparto[yo] || 0)}</b>` : '¿Lo compartiste con alguien?'}</span><button class="btn peq" data-a="repartir">${ico('gente', 15)} ${mio < 1 ? 'Cambiar' : 'Dividir'}</button></div>` : ''}
    ${!it.todos && uds > 1 ? `<div class="pie"><span class="suave peq">${mio ? `${porOtro() ? esc(yo) : 'Tú'}: <b>${mio} de ${uds}</b>` : `Hay ${uds} · ${eur(cts(it.precio / uds))} c/u`}</span><button class="btn peq" data-a="marcar">${mio ? 'Cambiar' : 'Marcar cuántas'}</button></div>` : ''}
  </li>`;
}

// Quién lo ha tomado, en una línea: gatitos + nombres + lo que paga cada uno
function pintarQuien(it, m, quien, reparto, uds, falta = 0) {
  const nom = (p) => (p === yo ? '<b>' + esc(p) + '</b>' : esc(p));
  if (it.todos) {
    const cab = Math.max(tope(), hay()) || 1;
    return `<span class="chip todos">${ico('gente', 14)} Entre todos · ${eur(Math.round(cts(it.precio) / cab))} c/u</span>`;
  }
  if (!quien.length) return `<span class="sinmarcar">Nadie lo ha marcado todavía</span>`;
  const caras = `<span class="caras">${quien.slice(0, 5).map((p) => av(p)).join('')}</span>`;
  let txt;
  if (uds > 1) txt = quien.map((p) => `${nom(p)} ×${m[p]}`).join(', ') + ` · ${eur(cts(it.precio / uds))} c/u`;
  else if (quien.some((p) => m[p] < 1)) {
    // Alguien lo ha marcado como compartido: se ve la parte de cada uno y lo que falta
    const partes = quien.reduce((a, p) => a + (m[p] < 1 ? m[p] : 0), 0);
    txt = quien.map((p) => `${nom(p)}${m[p] < 1 ? ` (${fraccion(p, m[p])})` : ''} ${eur(reparto[p] || 0)}`).join(' · ');
    if (falta) txt += ` · <span class="alerta">falta ${eur(falta)}</span>`;
    if (partes > 1.001) txt += ` · <span class="alerta">ojo: hay más partes marcadas que el plato</span>`;
  } else if (quien.length === 1) txt = nom(quien[0]);
  else {
    const vals = quien.map((p) => reparto[p] || 0);
    txt = vals.every((v) => Math.abs(v - vals[0]) <= 1)
      ? quien.map(nom).join(', ') + ` · ${eur(vals[0])} c/u`
      : quien.map((p) => `${nom(p)} ${eur(reparto[p] || 0)}`).join(' · ');
  }
  return `${caras}<span class="nombres">${txt}</span>`;
}

// Quién ha pagado y cuánto hay que pasarle (bien visible)
function pintarPagador(R) {
  if (!C.pagador || !C.personas.includes(C.pagador))
    return `<button class="pagador sin" data-a="pagador">${ico('cartera', 26)}<span class="t"><small>Falta saberlo</small><b>¿Quién ha pagado?</b></span><span class="btn peq">Elegir</span></button>`;
  const aPagador = Object.entries(R.total).reduce((a, [p, c]) => a + (p === C.pagador ? 0 : c), 0);
  const soyYo = C.pagador === yoReal;
  return `<div class="pagador">
    ${av(C.pagador, 'gr')}
    <span class="t"><small>Ha pagado</small><b>${esc(C.pagador)}${soyYo ? ' (tú)' : ''}</b>
      <span>${soyYo ? `Te tienen que pasar <b>${eur(aPagador)}</b>` : `Cada uno le pasa lo suyo · <b>${eur(aPagador)}</b> en total`}</span></span>
    <button class="btn peq" data-a="pagador">Cambiar</button>
  </div>`;
}

function pintarResumen(R) {
  const nada = (p) => !C.items.some((it) => it.todos || (C.marcas[it.id] || {})[p]);
  const aPagador = C.pagador ? Object.entries(R.total).reduce((a, [p, c]) => a + (p === C.pagador ? 0 : c), 0) : 0;
  const repartido = R.totalCuenta - R.sinAsignar;
  return `<section class="tarjeta">
    <h2>Lo que paga cada uno</h2>
    ${C.personas.length > 1 ? '<p class="suave peq" style="margin:2px 0 8px">Toca a alguien sin móvil para marcar lo suyo.</p>' : ''}
    <ul class="resumen">
      ${C.personas.map((p) => `<li class="${p === yo ? 'yo' : ''}" ${p !== yoReal ? `data-a="porOtro" data-p="${esc(p)}" role="button"` : ''}>${av(p)}<span class="n">${esc(p)}${p === C.pagador ? '<span class="etiqueta">PAGÓ</span>' : ''}${nada(p) ? '<small>Aún no ha marcado nada</small>' : p === C.pagador ? '<small>Su parte (ya está pagada)</small>' : C.pagador ? `<small class="a-quien">${ico('enviar', 12)} Se lo pasa a ${esc(C.pagador)}</small>` : ''}</span><b>${eur(R.total[p] || 0)}</b></li>`).join('')}
      ${faltan() ? `<li class="falta" data-a="compartir" role="button"><span class="av hueco">?</span><span class="n">Faltan ${faltan()} por entrar<small>Pásales el enlace</small></span>${ico('enlace', 18)}</li>` : ''}
    </ul>
    <dl class="cuentas">
      <div><dt>Total del ticket</dt><dd>${eur(R.totalCuenta)}</dd></div>
      ${R.sinAsignar
        ? `<div><dt>Ya repartido</dt><dd>${eur(repartido)}</dd></div><div class="alerta"><dt>Falta por marcar</dt><dd>${eur(R.sinAsignar)}</dd></div>`
        : `<div class="ok"><dt>${ico('check', 16)} Todo repartido</dt><dd></dd></div>`}
      ${C.pagador && C.personas.length > 1 ? `<div class="destacar"><dt>Hay que pasarle a ${esc(C.pagador)}</dt><dd>${eur(aPagador)}</dd></div>` : ''}
    </dl>
    ${C.totalTicket && cts(C.totalTicket) !== R.totalPlatos ? `<div class="banda alerta">${ico('aviso')}<p>Lo apuntado (${eur(R.totalPlatos)}) no coincide con el total del ticket (${eur(cts(C.totalTicket))}). Revisa los platos.</p></div>` : ''}
  </section>`;
}

function pintarBarra(R) {
  let b = $('#barraInf');
  if (!b) {
    b = document.createElement('div');
    b.id = 'barraInf';
    document.body.appendChild(b);
  }
  if (editando) {
    b.className = 'barra-inf';
    b.innerHTML = `<div><span class="tt"><small>${C.items.length} ${C.items.length === 1 ? 'línea' : 'líneas'} apuntadas</small><b>${eur(R.totalPlatos)}</b></span>
      <button class="prim" data-a="editar" ${C.items.length ? '' : 'disabled'}>Listo, a repartir ${ico('check', 18)}</button></div>`;
  } else if (C.items.length) {
    const completo = !R.sinAsignar && !faltan();
    const etiqueta = porOtro() ? `Le toca a ${esc(yo)}` : yo === C.pagador ? 'Tu parte (pagaste tú)' : C.pagador ? `Te toca pagar a ${esc(C.pagador)}` : 'Te toca pagar';
    b.className = 'barra-inf resaltada';
    b.innerHTML = `<div><span class="tt"><small>${etiqueta}</small><b>${eur(R.total[yo] || 0)}</b></span>
      ${completo
        ? `<button class="blanco" data-a="enviar">${ico('enviar', 18)} Enviar resumen</button>`
        : `<button class="blanco" data-a="compartir">${ico('enlace', 18)} Pasar enlace</button>`}</div>`;
  } else b.remove();
}
function quitarBarra() { $('#barraInf')?.remove(); }

function pintarEdicion() {
  return `
    <div class="fotos">
      <button class="btn" data-a="fotoCam">${ico('camara')} Hacer foto</button>
      <button class="btn" data-a="fotoSubir">${ico('imagen')} Subir foto</button>
    </div>
    <form id="fPlato" class="anadir">
      <input name="nombre" placeholder="Plato o bebida (ej. Croquetas)" required maxlength="60" autocomplete="off" enterkeyhint="next">
      <div class="fila">
        <span class="minis"><input name="uds" value="1" inputmode="numeric" aria-label="Unidades"><small>uds</small></span>
        <span class="eurIn"><input name="precio" placeholder="0,00" inputmode="decimal" required aria-label="Precio de la línea" enterkeyhint="done"></span>
        <button class="prim" aria-label="Añadir">${ico('mas', 18)}</button>
      </div>
      <p class="suave peq" style="margin-top:8px">Pon el precio de la línea entera: si son 3 cañas, lo que cuestan las 3.</p>
    </form>
    ${C.items.length ? `<ul id="platos" class="platos ed-lista">${C.items.map((it) => `<li class="plato ed" data-id="${esc(it.id)}">
        <input class="nomIn" value="${esc(it.nombre)}" aria-label="Plato" data-c="nombre">
        <div class="fila">
          <span class="minis"><input value="${esc(Number(it.uds) > 1 ? it.uds : 1)}" inputmode="numeric" aria-label="Unidades" data-c="uds"><small>uds</small></span>
          <span class="eurIn"><input value="${dec(it.precio)}" inputmode="decimal" aria-label="Precio de la línea" data-c="precio"></span>
        </div>
        <button class="x" data-a="borrar" aria-label="Quitar ${esc(it.nombre)}">${ico('x', 18)}</button>
        <button type="button" class="entreTodos ${it.todos ? 'on' : ''}" data-a="todos" aria-pressed="${it.todos ? 'true' : 'false'}"><span class="caja">${it.todos ? ico('check', 14) : ''}</span>Lo pagan todos a partes iguales</button>
      </li>`).join('')}</ul>` : ''}
    <div class="ajustes-ed">
      <label class="campo"><span>Total del ticket (para comprobar)</span><span class="eurIn"><input id="totalTicket" inputmode="decimal" value="${dec(C.totalTicket)}" placeholder="0,00"></span></label>
      <div class="campo"><span>¿Cuántos sois?</span><div class="fila-num">${contador('comensalesEd', tope() || hay(), Math.max(1, hay()), 99)}<small class="suave">Ya han entrado ${hay()}.</small></div></div>
      <label class="campo"><span>Nombre de la cuenta</span><input id="titulo" value="${esc(C.titulo)}" maxlength="60"></label>
      ${esCreador() ? `<button class="peligro-texto" data-a="borrarCuenta">${ico('papelera', 16)} Borrar esta cuenta</button>` : ''}
    </div>`;
}

function prepararEdicion() {
  $('#fPlato').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const precio = num(f.get('precio'));
    const nombre = f.get('nombre').trim();
    if (!nombre) return;
    if (!(precio >= 0)) return aviso('Ese precio no es válido');
    C.items.push({ id: nuevoId(), nombre, precio, uds: Math.max(1, parseInt(f.get('uds')) || 1) });
    guardar();
    pintar();
    $('#fPlato [name=nombre]').focus();
  };
  $('#app').oninput = (e) => {
    const t = e.target;
    if (t.id === 'totalTicket') C.totalTicket = num(t.value) || '';
    else if (t.id === 'titulo') { C.titulo = t.value.trim() || 'Cuenta'; $('.cabecera h1').textContent = C.titulo; }
    else if (t.name === 'comensalesEd') { const v = parseInt(t.value); if (v >= hay()) C.comensales = v; else return; }
    else {
      const it = C.items.find((x) => x.id === t.closest('li.plato')?.dataset.id);
      if (!it) return;
      const c = t.dataset.c;
      if (c === 'nombre') it.nombre = t.value;
      if (c === 'precio') { const v = num(t.value); if (v >= 0) it.precio = v; }
      if (c === 'uds') it.uds = Math.max(1, parseInt(t.value) || 1);
    }
    guardar();
    pintarBarra(calcular(C));
  };
  $('#platos') && ($('#platos').onclick = clicPlato);
}

async function clicPlato(e) {
  const b = e.target.closest('[data-a]');
  const li = e.target.closest('li.plato');
  if (!b || !li) return;
  const it = C.items.find((x) => x.id === li.dataset.id);
  if (!it) return;
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
  if (a === 'repartir') return preguntarEntreCuantos(it);
  if (a !== 'marcar') return;
  if (it.todos) return preguntarTodos(it);
  if ((Number(it.uds) || 1) > 1) return preguntarCuantas(it);
  // Un plato suelto: una pareja cuenta como 2 al compartirlo
  await ponerPeso(it, (C.marcas[it.id] || {})[yo] ? 0 : cabezas(yo));
}

async function ponerPeso(it, peso) {
  const m = (C.marcas[it.id] ||= {});
  if (peso) m[yo] = peso; else delete m[yo];
  pintar();
  if (navigator.vibrate) navigator.vibrate(10);
  await llamar('split_mark', { p_id: id, p_item: it.id, p_persona: yo, p_peso: peso }).catch(() => {});
}

// Plato con varias unidades: ¿cuántas has tomado?
function preguntarCuantas(it) {
  const uds = Number(it.uds) || 1;
  const m = C.marcas[it.id] || {};
  const mias = m[yo] || 0;
  const otros = Object.entries(m).filter(([p, w]) => p !== yo && w > 0 && C.personas.includes(p));
  const deOtros = otros.reduce((a, [, w]) => a + Number(w), 0);
  const libres = Math.max(0, uds - deOtros);
  const max = Math.min(uds, 24);
  const v = ventana(`<h2>¿Cuántas unidades de ${esc(it.nombre)} ${porOtro() ? 'ha tomado ' + esc(yo) : cabezas(yo) > 1 ? 'habéis tomado' : 'has tomado'}?</h2>
    <p class="suave peq">En el ticket hay ${uds} · ${eur(cts(it.precio / uds))} cada unidad.
    ${otros.length ? `<br>Ya marcadas: ${otros.map(([p, w]) => `${esc(p)} ${w}`).join(', ')} · quedan ${libres}.` : ''}</p>
    <div class="numeros">${Array.from({ length: max + 1 }, (_, n) => `<button class="btn ${n === mias ? 'sel' : ''} ${n > libres && n !== mias ? 'pasa' : ''}" data-n="${n}">${n === 0 ? 'Ninguna' : n}</button>`).join('')}</div>`);
  v.onclick = async (e) => {
    const n = e.target.closest('[data-n]')?.dataset.n;
    if (n == null) return;
    cerrarVentana();
    await ponerPeso(it, Number(n));
  };
}

// Plato de 1 unidad compartido: ¿entre cuántos? Solo cuenta tu parte; el resto lo marcan los demás.
const partesDe = (p, w) => Math.round(cabezas(p) / w); // peso 0,5 → «entre 2»
const fraccion = (p, w) => `${cabezas(p)}/${partesDe(p, w)}`;
function preguntarEntreCuantos(it) {
  const m = C.marcas[it.id] || {};
  const w = m[yo] || 0;
  const k = cabezas(yo);
  const actual = w > 0 && w < 1 ? partesDe(yo, w) : k;
  const quien = porOtro() ? esc(yo) : k > 1 ? 'vosotros' : 'tú';
  const opciones = Array.from({ length: 7 }, (_, i) => k + i);
  const v = ventana(`<h2>¿Entre cuántas personas lo compartisteis?</h2>
    <p class="suave peq">${esc(it.nombre)} · ${eur(cts(it.precio))}. Solo se te cuenta tu parte; los demás marcan la suya con el nombre que usen.</p>
    <div class="numeros partes">${opciones.map((n) => `<button class="btn ${n === actual ? 'sel' : ''}" data-n="${n}"><span>${n === k ? (k > 1 ? 'Solo nosotros' : 'Solo yo') : `Entre ${n}`}</span><small>${n === k ? 'entero' : `${quien === 'tú' ? 'tu' : 'su'} parte ${eur(Math.round((cts(it.precio) * k) / n))}`}</small></button>`).join('')}
      <button class="btn ${actual > k + 6 ? 'sel' : ''}" id="otroN"><span>${actual > k + 6 ? `Entre ${actual}` : 'Otro número'}</span><small>${actual > k + 6 ? `parte ${eur(Math.round((cts(it.precio) * k) / actual))}` : 'más personas'}</small></button></div>
    <div id="cajaOtro" class="fila-num oculto" style="justify-content:center;margin-top:14px">${contador('otroN', Math.max(actual, k + 7), k + 1, 99)}<button class="prim" id="okOtro">Aplicar</button></div>`);
  $('#otroN', v).onclick = (e) => { e.stopPropagation(); $('#cajaOtro', v).classList.remove('oculto'); $('#cajaOtro input', v).focus(); };
  $('#okOtro', v).onclick = async (e) => {
    e.stopPropagation();
    const n = Math.min(99, Math.max(k + 1, parseInt($('#cajaOtro input', v).value) || 0));
    cerrarVentana();
    await ponerPeso(it, Math.round((k / n) * 1e6) / 1e6);
  };
  v.onclick = async (e) => {
    const n = Number(e.target.closest('[data-n]')?.dataset.n);
    if (!n) return;
    cerrarVentana();
    await ponerPeso(it, n === k ? k : Math.round((k / n) * 1e6) / 1e6);
  };
}

// Cambiar cuántos sois (cualquiera puede, nunca por debajo de los que ya han entrado)
async function guardarComensales(n) {
  C.comensales = n;
  clearTimeout(guardarT);
  guardarT = null;
  const { marcas, personas, ...datos } = C;
  await llamar('split_save', { p_id: id, p_data: datos });
}
function preguntarAforo() {
  const v = ventana(`<h2>¿Cuántos sois?</h2>
    <p class="suave peq">Contando a todos. Una pareja cuenta como 2. Ya han entrado ${hay()}.</p>
    <div class="fila-num" style="justify-content:center;margin:6px 0 16px">${contador('aforoN', tope() || hay(), Math.max(1, hay()), 99)}</div>
    <div class="grid2"><button class="btn" data-cerrar>Cancelar</button><button class="prim" id="okAforo">Guardar</button></div>`);
  $('#okAforo', v).onclick = async () => {
    const n = Math.max(hay(), parseInt($('[name=aforoN]', v).value) || 1);
    cerrarVentana();
    try { await guardarComensales(n); } catch { return; }
    pintar();
    aviso(`Ahora sois ${n}`);
  };
}

// Plato puesto «para todos»: ¿que cada uno marque lo suyo?
function preguntarTodos(it) {
  const cab = Math.max(tope(), hay()) || 1;
  const v = ventana(`<h2>${esc(it.nombre)} se paga entre todos</h2>
    <p class="suave peq">Ahora se divide a partes iguales entre las ${cab} personas (${eur(Math.round(cts(it.precio) / cab))} cada una).</p>
    <div class="grid2"><button class="btn" data-cerrar>Dejarlo así</button><button class="prim" id="cadaUno">Que cada uno marque lo suyo</button></div>`);
  $('#cadaUno', v).onclick = () => {
    it.todos = false;
    guardar();
    cerrarVentana();
    if ((Number(it.uds) || 1) > 1) preguntarCuantas(it);
    else ponerPeso(it, cabezas(yo));
  };
}

function pintarQuienEres() {
  quitarBarra();
  const guardado = ls.get('nombre', '');
  const lleno = tope() && !faltan();
  $('#app').innerHTML = `
    <div class="cabecera"><a href="#" class="icono" aria-label="Inicio">${ico('atras')}</a><h1>${esc(C.titulo)}</h1></div>
    <section class="tarjeta">
      <h2>¿Quién eres?</h2>
      <p class="suave peq" style="margin:4px 0 14px">No hace falta registrarse: elige tu nombre y luego toca lo que has tomado.${tope() ? ` Sois ${tope()}${faltan() ? `; faltan ${faltan()} por entrar` : ''}.` : ''}</p>
      ${C.personas.length ? `<div class="lista-personas">${C.personas.map((p) => `<button data-p="${esc(p)}">${av(p, 'gr')}<span>${esc(p)}</span></button>`).join('')}</div>` : ''}
      ${lleno
        ? `<div class="banda info">${ico('gente')}<p>La cuenta es para ${tope()} y ya están. Si eres uno más, escribe tu nombre y se amplía.</p></div>`
        : C.personas.length ? '<p class="suave peq" style="margin-bottom:8px">¿No sales? Escribe tu nombre:</p>' : ''}
      <form id="fYo" style="display:flex;gap:8px">
        <input name="n" placeholder="Tu nombre · en pareja: Ana y Salvi" maxlength="40" required autocomplete="given-name" value="${esc(C.personas.includes(guardado) ? '' : guardado)}">
        <button class="prim">Entrar</button>
      </form>
    </section>`;
  $('.lista-personas') && ($('.lista-personas').onclick = (e) => { const p = e.target.closest('[data-p]')?.dataset.p; if (p) elegirYo(p); });
  $('#fYo') && ($('#fYo').onsubmit = async (e) => {
    e.preventDefault();
    const n = new FormData(e.target).get('n').trim();
    if (!n) return;
    if (await anadirPersona(n)) elegirYo(n);
  });
}

// Añade a alguien comprobando que no se pasa del número de personas
async function anadirPersona(n) {
  if (C.personas.includes(n)) return true;
  const k = cabezas(n);
  if (tope() && hay() + k > tope()) {
    // No cabe: preguntar si de verdad sois más y ampliar
    const nuevo = hay() + k;
    const si = await new Promise((ok) => {
      const v = ventana(`<h2>¿Sois ${nuevo}?</h2>
        <p class="suave peq">La cuenta es para ${tope()} ${tope() === 1 ? 'persona' : 'personas'}${faltan() ? ` y solo queda sitio para ${faltan()}` : ' y ya estáis todos'}. Si ${k > 1 ? 'sois' : 'eres'} ${k > 1 ? 'más' : 'uno más'}, se amplía a ${nuevo}.</p>
        <div class="grid2"><button class="btn" data-cerrar>No, me equivoqué</button><button class="prim" id="siMas">Sí, somos ${nuevo}</button></div>`);
      v.closest('.fondo').addEventListener('cerrar', () => ok(false));
      $('#siMas', v).onclick = () => { ok(true); cerrarVentana(); };
    });
    if (!si) return false;
    try { await guardarComensales(nuevo); } catch { return false; }
  }
  try {
    await llamar('split_join', { p_id: id, p_persona: n });
  } catch (e) {
    if (e.lleno) { aviso('Ya estáis todos: no cabe nadie más.'); ver = -1; cargar(); }
    return false;
  }
  C.personas.push(n);
  return true;
}

function elegirYo(p) {
  yoReal = yo = p;
  ls.set('yo:' + id, p);
  ls.set('nombre', p);
  pintar();
  window.scrollTo(0, 0);
}

function marcarPor(p) {
  editando = false;
  yo = p;
  pintar();
  window.scrollTo(0, 0);
  if (porOtro()) aviso(`Ahora tocas lo que ha tomado ${p}`);
}

// ---------- foto del ticket ----------
let tesseract = null;
function cargarTesseract() {
  if (window.Tesseract) return Promise.resolve();
  return (tesseract ||= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = ok;
    s.onerror = () => { tesseract = null; mal(new Error('No se pudo cargar el lector de tickets. ¿Hay internet?')); };
    document.head.appendChild(s);
  }));
}

async function leerFoto(archivo) {
  if (!archivo || !/^image\//.test(archivo.type)) return aviso('Eso no es una imagen');
  if (!editando) { editando = true; yo = yoReal; pintar(); }
  const urlVista = URL.createObjectURL(archivo);
  const v = ventana(`<img class="vista" src="${urlVista}" alt="">
    <h2>Leyendo el ticket…</h2><p class="suave peq" id="prog">Preparando (la primera vez tarda un poco)</p><div class="barra"><i id="barra"></i></div>
    <button class="btn ancho" data-cerrar>Cancelar</button>`);
  let cancelado = false;
  v.closest('.fondo').addEventListener('cerrar', () => (cancelado = true));
  try {
    await cargarTesseract();
    const img = await reducir(archivo);
    const worker = await Tesseract.createWorker('spa', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && $('#barra', v)) {
          $('#prog', v).textContent = 'Leyendo las líneas…';
          $('#barra', v).style.width = Math.max(3, Math.round(m.progress * 100)) + '%';
        }
      },
    });
    let texto;
    try {
      await worker.setParameters({ tessedit_pageseg_mode: '6' }); // el ticket es una tabla: leer línea a línea
      texto = (await worker.recognize(img)).data.text;
    } finally {
      worker.terminate();
    }
    if (cancelado) return;
    const { items: leidos, total } = leerTicket(texto);
    if (!leidos.length) {
      v.innerHTML = `<h2>No he sabido leerlo</h2><p class="suave">Prueba con más luz, el ticket estirado y de frente, o apúntalo a mano.</p><button class="prim ancho" data-cerrar>Vale</button>`;
      return;
    }
    const suma = () => [...v.querySelectorAll('.leidos input:checked')].reduce((a, c) => a + cts(leidos[c.dataset.i].precio), 0);
    v.innerHTML = `<h2>He leído ${leidos.length} ${leidos.length === 1 ? 'línea' : 'líneas'}</h2>
      <p class="suave peq">Desmarca lo que no sea un plato. Luego puedes corregir nombres y precios.</p>
      <ul class="leidos">${leidos.map((x, i) => `<li><label><input type="checkbox" checked data-i="${i}"><span>${x.uds > 1 ? `<span class="uds">${x.uds}×</span>` : ''}${esc(x.nombre)}${x.revisar ? ` <small class="alerta">revisa el precio</small>` : ''}</span><b class="pre">${eur(cts(x.precio))}</b></label></li>`).join('')}</ul>
      <div id="cuadre" class="banda" style="margin-bottom:12px"></div>
      <div class="grid2"><button class="btn" data-cerrar>Cancelar</button><button class="prim" id="anadir">Añadir al ticket</button></div>`;
    v.onchange = () => {
      const sm = suma(), t = cts(total);
      const c = $('#cuadre', v);
      if (!total) { c.className = 'banda info'; c.innerHTML = `<p>Suma: <b>${eur(sm)}</b>. Compárala con el total del ticket.</p>`; }
      else if (sm === t) { c.className = 'banda ok'; c.innerHTML = `${ico('check')}<p>Suma <b>${eur(sm)}</b>, igual que el total del ticket.</p>`; }
      else { c.className = 'banda alerta'; c.innerHTML = `${ico('aviso')}<p>Suma <b>${eur(sm)}</b> pero el ticket dice <b>${eur(t)}</b> (${sm > t ? 'sobran' : 'faltan'} ${eur(Math.abs(sm - t))}). Revisa las líneas después.</p>`; }
    };
    v.onchange();
    $('#anadir', v).onclick = () => {
      v.querySelectorAll('.leidos input:checked').forEach((c) => {
        const x = leidos[c.dataset.i];
        C.items.push({ id: nuevoId(), nombre: x.nombre, precio: x.precio, uds: x.uds });
      });
      if (total && !C.totalTicket) C.totalTicket = total;
      cerrarVentana();
      guardar();
      pintar();
      aviso('Añadido. Revisa que esté todo bien.');
    };
  } catch (e) {
    if (!cancelado) v.innerHTML = `<h2>Algo ha fallado</h2><p class="suave">${esc(e.message)}</p><button class="prim ancho" data-cerrar>Vale</button>`;
  } finally {
    URL.revokeObjectURL(urlVista);
  }
}

// Ajusta el tamaño de la foto (las pequeñas se agrandan: se leen mucho mejor) y la pasa a gris con contraste.
async function reducir(archivo) {
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(3, 3200 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  const g = cv.getContext('2d');
  g.filter = 'grayscale(1) contrast(1.6)';
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv;
}

for (const sel of ['#fotoCam', '#fotoSubir'])
  $(sel).onchange = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) leerFoto(f);
  };
// En el ordenador: arrastrar o pegar una imagen del ticket
document.addEventListener('dragover', (e) => { if (C && yo) e.preventDefault(); });
document.addEventListener('drop', (e) => {
  const f = e.dataTransfer?.files?.[0];
  if (C && yo && f) { e.preventDefault(); leerFoto(f); }
});
document.addEventListener('paste', (e) => {
  const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
  if (C && yo && f) { e.preventDefault(); leerFoto(f); }
});

// ---------- ventanas ----------
function ventana(html) {
  cerrarVentana();
  const fondo = document.createElement('div');
  fondo.className = 'fondo';
  fondo.innerHTML = `<div class="ventana" role="dialog" aria-modal="true">${html}</div>`;
  fondo.onclick = (e) => { if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrarVentana(); };
  document.body.appendChild(fondo);
  return $('.ventana', fondo);
}
function cerrarVentana() {
  const f = document.querySelector('.fondo');
  if (!f) return;
  f.dispatchEvent(new Event('cerrar'));
  f.remove();
}
document.addEventListener('keydown', (e) => e.key === 'Escape' && cerrarVentana());

function textoResumen() {
  const R = calcular(C);
  let t = `🧾 ${C.titulo} · Total del ticket: ${eur(R.totalCuenta)}\n`;
  if (C.pagador && C.personas.includes(C.pagador)) {
    const aPagador = Object.entries(R.total).reduce((a, [p, c]) => a + (p === C.pagador ? 0 : c), 0);
    t += `💳 Ha pagado ${C.pagador}. Pasadle:\n`;
    t += C.personas.filter((p) => p !== C.pagador).map((p) => `• ${p} → ${eur(R.total[p] || 0)}`).join('\n');
    t += `\n(${C.pagador}: su parte ${eur(R.total[C.pagador] || 0)} · le tienen que llegar ${eur(aPagador)})`;
  } else t += C.personas.map((p) => `• ${p}: ${eur(R.total[p] || 0)}`).join('\n');
  if (R.sinAsignar) t += `\n⚠️ Falta por marcar: ${eur(R.sinAsignar)}`;
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
  if (a === 'borrarReciente') {
    const x = ls.get('cuentas', []).find((c) => c.id === b.dataset.id);
    return preguntarBorrar(b.dataset.id, x?.titulo || 'Cuenta');
  }
  if (!C) return;
  if (a === 'editar') {
    editando = !editando;
    if (editando) yo = yoReal;
    cerrarVentana();
    pintar();
    window.scrollTo(0, 0);
  }
  if (a === 'borrarCuenta') preguntarBorrar(id, C.titulo);
  if (a === 'fotoCam') $('#fotoCam').click();
  if (a === 'fotoSubir') $('#fotoSubir').click();
  if (a === 'compartir') compartir(`Marca lo que has tomado en «${C.titulo}» (no hace falta registrarse):`, location.href);
  if (a === 'enviar') compartir(textoResumen());
  if (a === 'cambiarYo') {
    if (porOtro()) return marcarPor(yoReal);
    const v = ventana(`<h2>Eres ${esc(yoReal)}</h2><p class="suave peq">Si este móvil lo va a usar otra persona del grupo, cambia de nombre.</p>
      <div class="botones"><button class="prim ancho" id="cambiar">Soy otra persona</button><button class="btn ancho" data-cerrar>Cancelar</button></div>`);
    $('#cambiar', v).onclick = () => { cerrarVentana(); yo = yoReal = null; ls.set('yo:' + id, null); pintar(); };
  }
  if (a === 'porOtro') marcarPor(b.dataset.p);
  if (a === 'aforo') preguntarAforo();
  if (a === 'volver') marcarPor(yoReal);
  if (a === 'quitar') {
    const p = b.dataset.p;
    const v = ventana(`<h2>¿Quitar a ${esc(p)}?</h2><p class="suave peq">Se borra lo que haya marcado. Úsalo si alguien se apuntó por error.</p>
      <div class="grid2"><button class="btn" data-cerrar>Cancelar</button><button class="peligro" id="siQuitar">Quitar</button></div>`);
    $('#siQuitar', v).onclick = async () => {
      cerrarVentana();
      C.personas = C.personas.filter((x) => x !== p);
      Object.values(C.marcas).forEach((m) => delete m[p]);
      if (C.pagador === p) { C.pagador = ''; guardar(); }
      yo = yoReal;
      pintar();
      await llamar('split_leave', { p_id: id, p_persona: p }).catch(() => {});
    };
  }
  if (a === 'persona') {
    const v = ventana(`<h2>Añadir a alguien</h2><p class="suave peq">Para alguien que no va a abrir el enlace. Después marcas lo que ha tomado y vuelves a ti.${tope() ? (faltan() ? ` Queda sitio para ${faltan()}.` : ` Ya estáis ${tope()}: al añadir a alguien se amplía.`) : ''}</p>
      <form id="fPersona" style="display:flex;gap:8px"><input name="n" placeholder="Nombre · en pareja: Ana y Salvi" maxlength="40" required><button class="prim">Añadir</button></form>`);
    $('#fPersona', v).onsubmit = async (ev) => {
      ev.preventDefault();
      const n = new FormData(ev.target).get('n').trim();
      if (!n) return;
      if (!(await anadirPersona(n))) return;
      cerrarVentana();
      marcarPor(n);
    };
    setTimeout(() => $('#fPersona input', v)?.focus(), 50);
  }
  if (a === 'pagador') {
    const v = ventana(`<h2>¿Quién ha pagado?</h2><p class="suave peq">A esa persona le pasan el dinero los demás.</p>
      <div class="lista-personas">${C.personas.map((p) => `<button class="${p === C.pagador ? 'sel' : ''}" data-p="${esc(p)}">${av(p, 'gr')}<span>${esc(p)}</span></button>`).join('')}</div>`);
    v.onclick = (ev) => { const p = ev.target.closest('[data-p]')?.dataset.p; if (p) { C.pagador = p; guardar(); cerrarVentana(); pintar(); } };
  }
});
// Teclado: Enter o espacio sobre un plato lo marca
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.pp')) { e.preventDefault(); e.target.click(); }
});
// Al salir de un precio, dejarlo con dos decimales
document.addEventListener('focusout', (e) => {
  const t = e.target;
  if ((t.dataset?.c === 'precio' || t.id === 'totalTicket') && t.value.trim()) t.value = dec(num(t.value) || 0);
});

// ---------- arranque ----------
let reloj = null;
function ruta() {
  clearInterval(reloj);
  cerrarVentana();
  quitarBarra();
  id = location.hash.slice(1) || null;
  C = null; ver = 0;
  editando = !!id && id === recienCreada;
  if (!id) return pintarInicio();
  yo = yoReal = ls.get('yo:' + id, null);
  $('#app').innerHTML = '<p class="suave centro" style="padding-top:40vh">Cargando…</p>';
  cargar();
  reloj = setInterval(() => document.visibilityState === 'visible' && cargar(), 3000);
}
window.addEventListener('hashchange', ruta);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && id && cargar());
ruta();
