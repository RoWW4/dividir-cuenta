// Dividir la cuenta · lógica de la página
const CFG = {
  url: 'https://lvsjvdpxnuydtwajlvsv.supabase.co',
  key: 'sb_publishable_9XIhDkRWUeUjFY0qvk7Jhg_hgBc93wo',
};
const { calcular, leerTicket } = window.Calculo;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const eur = (c) => (c / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const cts = (n) => Math.round((Number(n) || 0) * 100);
const dec = (n) => (n === '' || n == null ? '' : (Number(n) || 0).toFixed(2).replace('.', ','));
const num = (s) => Number(String(s).replace(/\s|€/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
const nuevoId = () => Math.random().toString(36).slice(2, 9);
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// Colores e iniciales de cada persona
// Cada persona: un gatito de un color distinto (según el orden en que entró)
const COLORES = ['#f97316', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#a16207', '#64748b', '#d946ef'];
function color(n) {
  const i = C ? C.personas.indexOf(n) : -1;
  if (i >= 0) return COLORES[i % COLORES.length];
  let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}
const GATO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5.2 15.5 6.4 4.6l7 5.1Q16 9 18.6 9.7l7-5.1 1.2 10.9Q29 19 27 23q-3.2 5.2-11 5.2T5 23q-2-4 .2-7.5Z" fill="var(--c)"/><path d="m8 7.7.6 5 3.3-2.6Zm16 0-.6 5-3.3-2.6Z" fill="#fff" opacity=".35"/><ellipse cx="11.6" cy="17.6" rx="2.2" ry="2.5" fill="#fff"/><ellipse cx="20.4" cy="17.6" rx="2.2" ry="2.5" fill="#fff"/><circle cx="12" cy="18" r="1.3" fill="#1f2937"/><circle cx="20.8" cy="18" r="1.3" fill="#1f2937"/><path d="M14.8 21.2h2.4L16 22.6Z" fill="#fda4af"/><path d="M16 22.6q-.4 1.4-2 1.4M16 22.6q.4 1.4 2 1.4M3.5 20.5l6 .8M3.8 23.8l5.8-1.4M28.5 20.5l-6 .8M28.2 23.8l-5.8-1.4" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;
const av = (n, cl = '') => `<span class="av ${cl}" style="--c:${color(n)}" title="${esc(n)}">${GATO}</span>`;
const ICO = {
  compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  lapiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
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
let yo = null; // quien marca ahora mismo
let yoReal = null; // quien eres tú (en este móvil)
let editando = false;
let pendientes = 0; // llamadas en curso (para no pisar con el refresco)
let guardarT = null;
let recienCreada = null;

function aviso(txt) {
  const t = $('#aviso');
  t.textContent = txt;
  t.classList.add('ver');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => t.classList.remove('ver'), 2400);
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
  } catch (e) {
    aviso('No se ha podido guardar. ¿Hay internet?');
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

// ---------- portada ----------
function pintarInicio() {
  document.title = 'Dividir la cuenta';
  const lista = ls.get('cuentas', []);
  $('#app').innerHTML = `
    <section class="hero">
      <div class="logo">🧾</div>
      <h1>Dividir la cuenta</h1>
      <p>Cada uno paga lo que ha tomado, sin líos.</p>
      <div class="pasos">
        <div><b>1</b>Apunta el ticket</div>
        <div><b>2</b>Pasa el enlace</div>
        <div><b>3</b>Cada uno marca lo suyo</div>
      </div>
    </section>
    <section class="tarjeta">
      <h2 style="margin-bottom:14px">Nueva cuenta</h2>
      <form id="fNueva">
        <label class="campo"><span>¿Qué es?</span><input name="titulo" placeholder="Cena del viernes" maxlength="60" required></label>
        <label class="campo"><span>Tu nombre</span><input name="yo" placeholder="Cómo te conocen en el grupo" maxlength="30" required autocomplete="given-name" value="${esc(ls.get('nombre', ''))}"></label>
        <label class="casilla"><input type="checkbox" name="pago" checked><span>He pagado yo</span></label>
        <button class="prim ancho">Crear y apuntar el ticket</button>
      </form>
    </section>
    ${lista.length ? `<section class="tarjeta"><h2 style="margin-bottom:6px">Cuentas recientes</h2>
      ${lista.map((x) => `<a class="reciente" href="#${esc(x.id)}"><span class="ic">🧾</span><span class="t">${esc(x.titulo)}</span><span class="suave peq">${new Date(x.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></a>`).join('')}
    </section>` : ''}`;
  $('#fNueva').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nombre = f.get('yo').trim();
    const titulo = f.get('titulo').trim();
    if (!nombre || !titulo) return;
    const b = e.target.querySelector('button');
    b.disabled = true;
    b.textContent = 'Creando…';
    try {
      const nid = await rpc('split_create', {
        p_data: { titulo, personas: [nombre], pagador: f.get('pago') ? nombre : '', items: [], extra: { tipo: 'pct', valor: 0 } },
      });
      ls.set('nombre', nombre);
      ls.set('yo:' + nid, nombre);
      ls.set('creada:' + nid, true);
      recienCreada = nid;
      location.hash = nid;
    } catch {
      aviso('No se ha podido crear. ¿Hay internet?');
      b.disabled = false;
      b.textContent = 'Crear y apuntar el ticket';
    }
  };
}

function pintarError(txt) {
  $('#app').innerHTML = `<div class="cabecera"><a href="#" class="icono" aria-label="Inicio">${ICO.atras}</a><h1>Dividir la cuenta</h1></div>
    <section class="tarjeta centro"><p style="margin-bottom:14px">${esc(txt)}</p><a class="prim" href="#">Ir al inicio</a></section>`;
  quitarBarra();
}

// ---------- cuenta ----------
function pintar() {
  if (!C) return;
  document.title = C.titulo + ' · Dividir';
  if (!yoReal || !C.personas.includes(yoReal)) return pintarQuienEres();
  if (!yo || !C.personas.includes(yo)) yo = yoReal;
  const R = calcular(C);
  const soloYo = C.personas.length === 1;
  const sinMarcar = !porOtro() && !editando && C.items.length && !C.items.some((it) => it.todos || (C.marcas[it.id] || {})[yo]);
  $('#app').innerHTML = `
    <div class="cabecera">
      <a href="#" class="icono" aria-label="Inicio">${ICO.atras}</a>
      <h1>${esc(C.titulo)}</h1>
      <button class="icono" data-a="compartir" aria-label="Pasar enlace al grupo">${ICO.compartir}</button>
    </div>
    <div id="sinred" class="sinred">Sin conexión: los cambios no se guardan</div>

    <div class="gente">
      ${C.personas.map((p) => `<span class="persona ${p === yo ? 'yo' : ''}" role="button" data-a="${p === yoReal ? 'cambiarYo' : 'porOtro'}" data-p="${esc(p)}">${av(p)}${esc(p)}${p === yoReal ? ' (tú)' : ''}</span>`).join('')}
      <span class="persona mas" data-a="persona" role="button">+ Añadir</span>
    </div>

    ${porOtro() ? `<div class="banda alerta"><p>Estás marcando lo de <b>${esc(yo)}</b>.</p><button class="prim" data-a="volver">Volver a ${esc(yoReal)}</button></div>` : ''}
    ${!editando && soloYo && C.items.length ? `<div class="banda info"><p>Ahora <b>pasa el enlace</b> al grupo para que cada uno marque lo suyo.</p><button class="prim" data-a="compartir">Pasar</button></div>` : ''}
    ${sinMarcar ? `<div class="banda info"><p>👆 <b>Toca lo que has tomado.</b> Si lo compartiste, la otra persona también lo toca y se divide.</p></div>` : ''}

    <section class="tarjeta">
      <div class="cab">
        <h2>${editando ? 'Apuntar el ticket' : 'Ticket'}</h2>
        ${editando ? '' : C.items.length ? `<button class="btn peq" data-a="editar">${ICO.lapiz.replace('<svg', '<svg width="16" height="16"')} Editar</button>` : ''}
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
    <div class="gr">🍽️</div>
    <p class="suave">Todavía no hay nada apuntado.</p>
    <div class="fotos">
      <button class="btn" data-a="fotoCam">📷 Hacer foto</button>
      <button class="btn" data-a="fotoSubir">🖼️ Subir foto</button>
    </div>
    <button class="prim ancho" data-a="editar">✍️ Escribirlo a mano</button>
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
      <span class="check">${marcado ? '✓' : ''}</span>
      <span class="nom">${uds > 1 ? `<span class="uds">${uds}×</span>` : ''}${esc(it.nombre)}</span>
      <span class="pre">${eur(cts(it.precio))}</span>
    </div>
    <div class="quien">${pintarQuien(it, m, quien, reparto, uds)}</div>
    ${!it.todos && uds > 1 ? `<div class="pie"><span class="suave peq">${mio ? `${porOtro() ? esc(yo) : 'Tú'}: <b>${mio} de ${uds}</b>` : `Hay ${uds} · ${eur(cts(it.precio / uds))} c/u`}</span><button class="btn peq" data-a="marcar">${mio ? 'Cambiar' : 'Marcar cuántas'}</button></div>` : ''}
  </li>`;
}

// Quién lo ha tomado, en una línea: caras + nombres + lo que paga cada uno
function pintarQuien(it, m, quien, reparto, uds) {
  if (it.todos) return `<span class="chip todos">👥 Para todos · ${eur(reparto[yo] || 0)} cada uno</span>`;
  if (!quien.length) return `<span class="sinmarcar">Nadie lo ha marcado todavía</span>`;
  const caras = `<span class="caras">${quien.slice(0, 5).map((p) => av(p)).join('')}</span>`;
  const pesos = quien.map((p) => m[p]);
  const iguales = pesos.every((w) => w === pesos[0]);
  const nombres = quien.map((p) => `${p === yo ? '<b>' + esc(p) + '</b>' : esc(p)}${!iguales || (uds > 1 && pesos[0] > 1) ? ' ×' + m[p] : ''}`).join(', ');
  let cuanto;
  if (quien.length === 1) cuanto = '';
  else if (iguales) cuanto = ` · ${eur(reparto[quien[0]] || 0)} c/u`;
  else cuanto = ` · ${eur(cts(it.precio / uds))} la unidad`;
  return `${caras}<span class="nombres">${nombres}${cuanto}</span>`;
}

function pintarResumen(R) {
  const nada = (p) => !C.items.some((it) => it.todos || (C.marcas[it.id] || {})[p]);
  return `<section class="tarjeta">
    <h2>Lo que paga cada uno</h2>
    ${C.personas.length > 1 ? '<p class="suave peq" style="margin:2px 0 8px">Toca a alguien sin móvil para marcar lo suyo.</p>' : ''}
    <ul class="resumen">
      ${C.personas.map((p) => `<li class="${p === yo ? 'yo' : ''}" ${p !== yoReal ? `data-a="porOtro" data-p="${esc(p)}" role="button"` : ''}>${av(p)}<span class="n">${esc(p)}${p === C.pagador ? '<span class="etiqueta">PAGÓ</span>' : ''}${nada(p) ? '<small>Aún no ha marcado nada</small>' : ''}</span><b>${eur(R.total[p] || 0)}</b></li>`).join('')}
    </ul>
    ${R.sinAsignar
      ? `<div class="banda alerta"><p>Falta por marcar <b>${eur(R.sinAsignar)}</b></p></div>`
      : '<div class="banda ok"><p>✓ Todo el ticket está repartido</p></div>'}
    ${C.totalTicket && cts(C.totalTicket) !== R.totalPlatos ? `<div class="banda alerta"><p>Lo apuntado (${eur(R.totalPlatos)}) no coincide con el ticket (${eur(cts(C.totalTicket))}).</p></div>` : ''}
    <div class="totales"><span>Platos ${eur(R.totalPlatos)}</span>${R.totalCuenta !== R.totalPlatos ? `<span>Con propina <b>${eur(R.totalCuenta)}</b></span>` : `<span>Total <b>${eur(R.totalCuenta)}</b></span>`}</div>
    <div class="ajustes">
      <button class="btn" data-a="extra"><small>Propina</small><span>${C.extra.valor ? (C.extra.tipo === 'pct' ? C.extra.valor + ' %' : eur(cts(C.extra.valor))) : 'Sin propina'}</span></button>
      <button class="btn" data-a="pagador"><small>Ha pagado</small><span>${esc(C.pagador || 'Elegir…')}</span></button>
    </div>
  </section>`;
}

function pintarBarra(R) {
  let b = $('#barraInf');
  if (!b) {
    b = document.createElement('div');
    b.id = 'barraInf';
    b.className = 'barra-inf';
    document.body.appendChild(b);
  }
  if (editando) {
    b.innerHTML = `<div><span class="tt"><small>${C.items.length} ${C.items.length === 1 ? 'línea' : 'líneas'}</small><b>${eur(R.totalPlatos)}</b></span>
      <button class="prim" data-a="editar" ${C.items.length ? '' : 'disabled style="opacity:.5"'}>Listo, a repartir ✓</button></div>`;
  } else if (C.items.length) {
    b.innerHTML = `<div><span class="tt"><small>${porOtro() ? `Le toca a ${esc(yo)}` : yo === C.pagador ? `Tu parte · te deben ${eur(Object.entries(R.total).reduce((a, [p, c]) => a + (p === yo ? 0 : c), 0))}` : C.pagador ? `Te toca pagar a ${esc(C.pagador)}` : 'Te toca'}</small><b>${eur(R.total[yo] || 0)}</b></span>
      <button class="prim" data-a="enviar">Enviar resumen</button></div>`;
  } else b.remove();
}
function quitarBarra() { $('#barraInf')?.remove(); }

function pintarEdicion() {
  return `
    <div class="fotos">
      <button class="btn" data-a="fotoCam">📷 Hacer foto</button>
      <button class="btn" data-a="fotoSubir">🖼️ Subir foto</button>
    </div>
    <form id="fPlato" class="anadir">
      <input name="nombre" placeholder="Plato o bebida (ej. Croquetas)" required maxlength="60" autocomplete="off" enterkeyhint="next">
      <div class="fila">
        <span class="minis"><input name="uds" value="1" inputmode="numeric" aria-label="Unidades"><small>uds</small></span>
        <span class="eurIn"><input name="precio" placeholder="0,00" inputmode="decimal" required aria-label="Precio de la línea" enterkeyhint="done"></span>
        <button class="prim" aria-label="Añadir">Añadir</button>
      </div>
    </form>
    ${C.items.length ? `<ul id="platos" class="platos ed-lista">${C.items.map((it) => `<li class="plato ed" data-id="${esc(it.id)}">
        <input class="nomIn" value="${esc(it.nombre)}" aria-label="Plato" data-c="nombre">
        <div class="fila">
          <span class="minis"><input value="${esc(Number(it.uds) > 1 ? it.uds : 1)}" inputmode="numeric" aria-label="Unidades" data-c="uds"><small>uds</small></span>
          <span class="eurIn"><input value="${dec(it.precio)}" inputmode="decimal" aria-label="Precio de la línea" data-c="precio"></span>
        </div>
        <button type="button" class="entreTodos ${it.todos ? 'on' : ''}" data-a="todos" aria-pressed="${it.todos ? 'true' : 'false'}"><span class="caja">${it.todos ? '✓' : ''}</span>Lo pagan todos a partes iguales</button>
        <button class="x" data-a="borrar" aria-label="Quitar ${esc(it.nombre)}">✕</button>
      </li>`).join('')}</ul>` : '<p class="suave peq centro" style="padding:6px 0 12px">Añade cada línea del ticket. Si son 3 cañas, pon 3 uds y lo que cuestan las 3.</p>'}

    <label class="campo mt"><span>Total del ticket (opcional, para comprobar)</span><span class="eurIn"><input id="totalTicket" inputmode="decimal" value="${dec(C.totalTicket)}" placeholder="0,00"></span></label>
    <label class="campo"><span>Nombre de la cuenta</span><input id="titulo" value="${esc(C.titulo)}" maxlength="60"></label>`;
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
  const app = $('#app');
  app.oninput = (e) => {
    const t = e.target;
    if (t.id === 'totalTicket') C.totalTicket = num(t.value) || '';
    else if (t.id === 'titulo') { C.titulo = t.value.trim() || 'Cuenta'; $('.cabecera h1').textContent = C.titulo; }
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
  const uds = Number(it.uds) || 1;
  if (a !== 'marcar') return;
  if (it.todos) return preguntarTodos(it);
  if (uds > 1) return preguntarCuantas(it);
  await ponerPeso(it, m[yo] ? 0 : 1);
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
  const quien = porOtro() ? esc(yo) : 'tú';
  const v = ventana(`<h2>¿Cuántas unidades de ${esc(it.nombre)} ${porOtro() ? 'ha tomado ' + quien : 'has tomado'}?</h2>
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

// Plato puesto «para todos»: ¿que cada uno marque lo suyo?
function preguntarTodos(it) {
  const v = ventana(`<h2>${esc(it.nombre)} se paga entre todos</h2>
    <p class="suave peq">Ahora se divide a partes iguales entre las ${C.personas.length} personas (${eur(cts(it.precio / C.personas.length))} cada una).</p>
    <div class="grid2"><button class="btn" data-cerrar>Dejarlo así</button><button class="prim" id="cadaUno">Que cada uno marque lo suyo</button></div>`);
  $('#cadaUno', v).onclick = () => {
    it.todos = false;
    guardar();
    cerrarVentana();
    if ((Number(it.uds) || 1) > 1) preguntarCuantas(it);
    else ponerPeso(it, 1);
  };
}

function pintarQuienEres() {
  quitarBarra();
  const guardado = ls.get('nombre', '');
  $('#app').innerHTML = `
    <div class="cabecera"><a href="#" class="icono" aria-label="Inicio">${ICO.atras}</a><h1>${esc(C.titulo)}</h1></div>
    <section class="tarjeta">
      <h2>¿Quién eres?</h2>
      <p class="suave peq" style="margin:4px 0 14px">Después tocas lo que has tomado y ves cuánto te toca.</p>
      ${C.personas.length ? `<div class="lista-personas">${C.personas.map((p) => `<button data-p="${esc(p)}">${av(p, 'gr')}${esc(p)}</button>`).join('')}</div>
      <p class="suave peq" style="margin-bottom:8px">¿No sales? Escribe tu nombre:</p>` : ''}
      <form id="fYo" class="fila" style="display:flex;gap:8px">
        <input name="n" placeholder="Tu nombre" maxlength="30" required autocomplete="given-name" value="${esc(C.personas.includes(guardado) ? '' : guardado)}">
        <button class="prim">Entrar</button>
      </form>
    </section>`;
  $('.lista-personas') && ($('.lista-personas').onclick = (e) => { const p = e.target.closest('[data-p]')?.dataset.p; if (p) elegirYo(p); });
  $('#fYo').onsubmit = async (e) => {
    e.preventDefault();
    const n = new FormData(e.target).get('n').trim();
    if (!n) return;
    await anadirPersona(n);
    elegirYo(n);
  };
}

async function anadirPersona(n) {
  if (C.personas.includes(n)) return;
  C.personas.push(n);
  await llamar('split_join', { p_id: id, p_persona: n }).catch(() => {});
}

const porOtro = () => yo !== yoReal;
function marcarPor(p) {
  if (editando) { editando = false; }
  yo = p;
  pintar();
  window.scrollTo(0, 0);
  if (porOtro()) aviso(`Ahora tocas lo que ha tomado ${p}`);
}

function elegirYo(p) {
  yoReal = yo = p;
  ls.set('yo:' + id, p);
  ls.set('nombre', p);
  pintar();
  window.scrollTo(0, 0);
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
  if (!editando) { editando = true; pintar(); }
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
      <ul class="leidos">${leidos.map((x, i) => `<li><label><input type="checkbox" checked data-i="${i}"><span>${x.uds > 1 ? `<span class="uds">${x.uds}×</span>` : ''}${esc(x.nombre)}${x.revisar ? ' <small class="alerta">⚠️ revisa el precio</small>' : ''}</span><b class="pre">${eur(cts(x.precio))}</b></label></li>`).join('')}</ul>
      <div id="cuadre" class="banda" style="margin-bottom:12px"></div>
      <div class="grid2"><button class="btn" data-cerrar>Cancelar</button><button class="prim" id="anadir">Añadir al ticket</button></div>`;
    v.onchange = () => {
      const sm = suma(), t = cts(total);
      const c = $('#cuadre', v);
      if (!total) { c.className = 'banda info'; c.innerHTML = `<p>Suma: <b>${eur(sm)}</b>. Compárala con el total del ticket.</p>`; }
      else if (sm === t) { c.className = 'banda ok'; c.innerHTML = `<p>✓ Suma <b>${eur(sm)}</b>, igual que el total del ticket.</p>`; }
      else { c.className = 'banda alerta'; c.innerHTML = `<p>Suma <b>${eur(sm)}</b> pero el ticket dice <b>${eur(t)}</b> (${sm > t ? 'sobran' : 'faltan'} ${eur(Math.abs(sm - t))}). Revisa las líneas después.</p>`; }
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
  if (a === 'editar') {
    editando = !editando;
    if (!editando) cerrarVentana();
    pintar();
    window.scrollTo(0, 0);
  }
  if (a === 'fotoCam') $('#fotoCam').click();
  if (a === 'fotoSubir') $('#fotoSubir').click();
  if (a === 'compartir') compartir(`Marca lo que has tomado en «${C.titulo}»:`, location.href);
  if (a === 'enviar') compartir(textoResumen());
  if (a === 'cambiarYo') {
    if (porOtro()) return marcarPor(yoReal);
    yo = yoReal = null; ls.set('yo:' + id, null); pintar();
  }
  if (a === 'porOtro') marcarPor(b.dataset.p);
  if (a === 'volver') marcarPor(yoReal);
  if (a === 'persona') {
    const v = ventana(`<h2>Añadir a alguien</h2><p class="suave peq">Para alguien que no va a abrir el enlace. Después tocas lo que ha tomado y vuelves a ti.</p>
      <form id="fPersona" style="display:flex;gap:8px"><input name="n" placeholder="Nombre" maxlength="30" required><button class="prim">Añadir</button></form>`);
    $('#fPersona', v).onsubmit = async (ev) => {
      ev.preventDefault();
      const n = new FormData(ev.target).get('n').trim();
      if (!n) return;
      cerrarVentana();
      await anadirPersona(n);
      marcarPor(n);
    };
    setTimeout(() => $('#fPersona input', v)?.focus(), 50);
  }
  if (a === 'pagador') {
    const v = ventana(`<h2>¿Quién ha pagado?</h2><p class="suave peq">A esa persona le pasan el dinero los demás.</p>
      <div class="lista-personas">${C.personas.map((p) => `<button class="${p === C.pagador ? 'sel' : ''}" data-p="${esc(p)}">${av(p, 'gr')}${esc(p)}</button>`).join('')}</div>`);
    v.onclick = (ev) => { const p = ev.target.closest('[data-p]')?.dataset.p; if (p) { C.pagador = p; guardar(); cerrarVentana(); pintar(); } };
  }
  if (a === 'extra') {
    const ex = C.extra;
    const v = ventana(`<h2>Propina</h2><p class="suave peq">Se reparte según lo que ha tomado cada uno.</p>
      <div class="grid3">${[0, 5, 10].map((n) => `<button class="btn ${ex.tipo === 'pct' && Number(ex.valor) === n ? 'sel' : ''}" data-pct="${n}">${n ? n + ' %' : 'Nada'}</button>`).join('')}</div>
      <p class="suave peq" style="margin:14px 0 6px">O una cantidad fija:</p>
      <form id="fExtra" style="display:flex;gap:8px"><span class="eurIn"><input name="v" inputmode="decimal" placeholder="0,00" value="${ex.tipo === 'eur' && ex.valor ? dec(ex.valor) : ''}"></span><button class="prim">Poner</button></form>`);
    v.onclick = (ev) => {
      const n = ev.target.closest('[data-pct]')?.dataset.pct;
      if (n != null) { C.extra = { tipo: 'pct', valor: Number(n) }; guardar(); cerrarVentana(); pintar(); }
    };
    $('#fExtra', v).onsubmit = (ev) => {
      ev.preventDefault();
      C.extra = { tipo: 'eur', valor: num(new FormData(ev.target).get('v')) || 0 };
      guardar(); cerrarVentana(); pintar();
    };
  }
});
// Al salir de un precio, dejarlo con dos decimales
document.addEventListener('focusout', (e) => {
  const t = e.target;
  if ((t.dataset?.c === 'precio' || t.id === 'totalTicket') && t.value.trim()) t.value = dec(num(t.value) || 0);
});
// Teclado: Enter o espacio sobre un plato lo marca
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.pp')) { e.preventDefault(); e.target.click(); }
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
