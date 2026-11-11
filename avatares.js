// Avatares: cada persona tiene un icono y un color.
// Algunos nombres tienen uno fijo. Los nombres no se guardan tal cual (el repositorio es público):
// solo una «huella» del nombre, que la página compara con lo que escribe cada uno.
// El resto recibe un icono friki y un color al azar, pero siempre el mismo para el mismo nombre.
(function (raiz) {
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
  const huella = (s) => { let h = 0x811c9dc5; for (const c of 'dividir:' + s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
  const azar = (s) => { let h = 7; for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };

  const FIJOS = {"uzcq59":"gatoNegro","uxrgzu":"gatoMorado","1g1jmvl":"gatoMorado","10r69k8":"gatoMorado","13xf8nq":"martillo","86v0ye":"martillo","7el538":"martillo","l6g8md":"escudoW","40ncqg":"escudoW","16cn2oj":"escudoW","e6fq6u":"hada","1ms3v61":"hada","1ky1p89":"hada","1lsn9l8":"hada","1ud3tl1":"murcielago","14ecaqm":"murcielago","f2guk8":"murcielago","1gwzwz1":"murcielago","f7pxoj":"tiara","11vduoc":"tiara","7o2wbp":"mancuerna","7u6qz7":"mancuerna","ehx7mj":"mancuerna"};

  const gato = (ojos = '#fff', pupila = '#1f2937') => `<path d="M5.2 15.5 6.4 4.6l7 5.1Q16 9 18.6 9.7l7-5.1 1.2 10.9Q29 19 27 23q-3.2 5.2-11 5.2T5 23q-2-4 .2-7.5Z" fill="var(--c)"/><path d="m8 7.7.6 5 3.3-2.6Zm16 0-.6 5-3.3-2.6Z" fill="#fff" opacity=".35"/><ellipse cx="11.6" cy="17.6" rx="2.2" ry="2.5" fill="${ojos}"/><ellipse cx="20.4" cy="17.6" rx="2.2" ry="2.5" fill="${ojos}"/><ellipse cx="12" cy="18" rx=".9" ry="1.6" fill="${pupila}"/><ellipse cx="20.8" cy="18" rx=".9" ry="1.6" fill="${pupila}"/><path d="M14.8 21.2h2.4L16 22.6Z" fill="#fda4af"/><path d="M16 22.6q-.4 1.4-2 1.4M16 22.6q.4 1.4 2 1.4M3.5 20.5l6 .8M3.8 23.8l5.8-1.4M28.5 20.5l-6 .8M28.2 23.8l-5.8-1.4" stroke="#fff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".8"/>`;
  const estrella = (cx, cy, R, r, fill) => {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const q = i % 2 ? r : R; p.push(`${(cx + q * Math.cos(a)).toFixed(2)},${(cy + q * Math.sin(a)).toFixed(2)}`); }
    return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
  };

  // Iconos fijos (dibujos propios, inspirados; no son logos oficiales)
  const ESPECIALES = {
    gatoNegro: { c: '#1f2937', svg: gato('#facc15', '#111827') },
    gatoMorado: { c: '#8b5cf6', svg: gato() },
    martillo: { c: '#f97316', svg: `<rect x="14.4" y="12" width="3.2" height="17.5" rx="1.4" fill="var(--c)"/><path d="M16 1.5 18.6 5h-5.2Z" fill="var(--c)"/><rect x="5" y="5" width="22" height="9.5" rx="2.2" fill="var(--c)"/><path d="M5 7.5h-1.6v4.5H5M27 7.5h1.6v4.5H27" fill="var(--c)"/><circle cx="16" cy="9.4" r="3.1" fill="#fff"/><circle cx="14.9" cy="9.1" r=".85" fill="#1f2937"/><circle cx="17.1" cy="9.1" r=".85" fill="#1f2937"/><path d="M15.2 11.6h1.6" stroke="#1f2937" stroke-width=".7"/><rect x="13.4" y="27" width="5.2" height="3" rx="1.2" fill="var(--c)"/>` },
    escudoW: { c: '#16a34a', svg: `<path d="M16 2.5 27 6.5V15c0 7-4.8 11.7-11 14.3C9.8 26.7 5 22 5 15V6.5Z" fill="var(--c)"/><path d="M16 5.2 24.5 8.3V15c0 5.5-3.6 9.3-8.5 11.6C11.1 24.3 7.5 20.5 7.5 15V8.3Z" fill="none" stroke="#fff" stroke-width=".9" opacity=".5"/><path d="m9.3 11 3.1 10.2 3.6-7.6 3.6 7.6L22.7 11" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>` },
    hada: { c: '#ec4899', svg: `<ellipse cx="10" cy="14.5" rx="4.6" ry="7.5" transform="rotate(-28 10 14.5)" fill="var(--c)" opacity=".45"/><ellipse cx="22" cy="14.5" rx="4.6" ry="7.5" transform="rotate(28 22 14.5)" fill="var(--c)" opacity=".45"/><circle cx="16" cy="8" r="3.4" fill="var(--c)"/><path d="M16 11.6 21.8 26H10.2Z" fill="var(--c)"/><path d="M20.6 13.5 25.6 7" stroke="var(--c)" stroke-width="1.2" stroke-linecap="round"/>${estrella(26.2, 6.2, 2.6, 1.1, '#facc15')}<circle cx="6" cy="25" r=".9" fill="#facc15"/><circle cx="26" cy="22" r=".7" fill="#facc15"/>` },
    murcielago: { c: '#eab308', svg: `<path transform="translate(0 -5.4) scale(1 1.32)" d="M1.5 14.5c3-.8 5-2.6 6.2-5.2.9 2.7 3 4 5.2 4l1.4-3.4 1 2h1.4l1-2 1.4 3.4c2.2 0 4.3-1.3 5.2-4 1.2 2.6 3.2 4.4 6.2 5.2-3 1-4.6 3-4.6 6-2-1.5-4.3-1.4-5.8.8-1.4-1.5-3-.8-4.1 3-1.1-3.8-2.7-4.5-4.1-3-1.5-2.2-3.8-2.3-5.8-.8 0-3-1.6-5-4.6-6Z" fill="var(--c)"/>` },
    tiara: { c: '#2563eb', svg: `<path d="M3.5 21.5Q16 7.5 28.5 21.5l-2.2 4.2Q16 15 5.7 25.7Z" fill="var(--c)"/>${estrella(16, 14, 6.2, 2.6, 'var(--c)')}${estrella(16, 14, 3.4, 1.4, '#fff')}<circle cx="8.5" cy="20.5" r="1.1" fill="#fff" opacity=".8"/><circle cx="23.5" cy="20.5" r="1.1" fill="#fff" opacity=".8"/>` },
    mancuerna: { c: '#dc2626', svg: `<rect x="9" y="14.4" width="14" height="3.2" rx="1.2" fill="#64748b"/><rect x="4.5" y="8" width="5" height="16" rx="1.6" fill="var(--c)"/><rect x="22.5" y="8" width="5" height="16" rx="1.6" fill="var(--c)"/><rect x="1.5" y="11" width="3.5" height="10" rx="1.2" fill="var(--c)"/><rect x="27" y="11" width="3.5" height="10" rx="1.2" fill="var(--c)"/><path d="M6 10v12M24 10v12" stroke="#fff" stroke-width=".9" opacity=".45"/>` },
  };

  // Iconos frikis para el resto (dibujos propios)
  const FRIKIS = [
    `<path d="M18.5 2 7 18h8.2L13 30l12-17h-8.3Z" fill="var(--c)"/>`, // rayo
    `<circle cx="16" cy="16" r="13" fill="var(--c)"/><circle cx="16" cy="16" r="9.2" fill="#fff" opacity=".35"/><circle cx="16" cy="16" r="6" fill="var(--c)"/>${estrella(16, 16, 5.2, 2.1, '#fff')}`, // escudo con estrella
    `<path d="M16 1.5 19 5.5V20h-6V5.5Z" fill="var(--c)"/><path d="M16 4v15" stroke="#fff" stroke-width=".9" opacity=".6"/><rect x="8.5" y="19.5" width="15" height="3.2" rx="1.4" fill="var(--c)"/><rect x="14.4" y="22.5" width="3.2" height="6" rx="1" fill="#475569"/><circle cx="16" cy="29.6" r="1.8" fill="var(--c)"/>`, // espada
    `<path d="M9 10h14c4 0 6.5 3.4 7 8.5.5 4.6-1.7 7.5-4.4 7.5-2.2 0-3.4-2-4.6-4H11c-1.2 2-2.4 4-4.6 4C3.7 26 1.5 23.1 2 18.5 2.5 13.4 5 10 9 10Z" fill="var(--c)"/><path d="M8.5 14.5v5M6 17h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="22" cy="15.5" r="1.4" fill="#fff"/><circle cx="25" cy="18.5" r="1.4" fill="#fff"/>`, // mando
    `<path d="M16 2 28.1 9v14L16 30 3.9 23V9Z" fill="var(--c)"/><path d="M16 8.5 22.8 20.5H9.2Z M16 2v6.5M3.9 9l5.3 11.5M28.1 9l-5.3 11.5M9.2 20.5 16 30l6.8-9.5M3.9 23l5.3-2.5M28.1 23l-5.3-2.5" fill="none" stroke="#fff" stroke-width=".9" opacity=".75" stroke-linejoin="round"/><text x="16" y="18.6" font-size="6.5" font-weight="800" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">20</text>`, // dado de 20
    `<path d="M5.5 29V14.5a10.5 10.5 0 0 1 21 0V29l-3.5-3-3.5 3-3.5-3-3.5 3-3.5-3Z" fill="var(--c)"/><ellipse cx="12.3" cy="15" rx="2.4" ry="3" fill="#fff"/><ellipse cx="20.3" cy="15" rx="2.4" ry="3" fill="#fff"/><circle cx="13" cy="15.8" r="1.3" fill="#1e3a8a"/><circle cx="21" cy="15.8" r="1.3" fill="#1e3a8a"/>`, // fantasma
    `<rect x="10.5" y="15" width="11" height="12" rx="3.5" fill="#f3e8d6"/><circle cx="14" cy="20.5" r="1" fill="#1f2937"/><circle cx="18" cy="20.5" r="1" fill="#1f2937"/><path d="M2.5 17a13.5 12 0 0 1 27 0Z" fill="var(--c)"/><circle cx="16" cy="9" r="2.8" fill="#fff"/><circle cx="8" cy="13.4" r="2.1" fill="#fff"/><circle cx="24" cy="13.4" r="2.1" fill="#fff"/>`, // seta
    `<path d="M9 23 25.5 6.5" stroke="var(--c)" stroke-width="3.4" stroke-linecap="round"/><path d="M9 23 25.5 6.5" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".8"/><path d="m4 28 5.5-5.5" stroke="#475569" stroke-width="4.4" stroke-linecap="round"/><path d="m8.1 21.5 2.4 2.4" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/>`, // sable de luz
    `<path d="M16 1.5c5.5 4.5 7 12.5 5.2 20.5H10.8C9 14 10.5 6 16 1.5Z" fill="var(--c)"/><circle cx="16" cy="11.5" r="2.6" fill="#fff"/><path d="M10.8 16.5 6.5 22.5h5ZM21.2 16.5l4.3 6h-5Z" fill="var(--c)"/><path d="M13 23h6l-1.2 4.5L16 30.5l-1.8-3Z" fill="#fb923c"/>`, // cohete
    `<path d="M16 3c7 0 11.5 4.8 11.5 11.2C27.5 22 20.5 29 16 29S4.5 22 4.5 14.2C4.5 7.8 9 3 16 3Z" fill="var(--c)"/><path d="M8.5 14.5c2.8-.6 5.2 1 5.8 4-2.8.6-5.4-.8-5.8-4ZM23.5 14.5c-2.8-.6-5.2 1-5.8 4 2.8.6 5.4-.8 5.8-4Z" fill="#111827"/><path d="M14 23.5h4" stroke="#111827" stroke-width="1" stroke-linecap="round"/>`, // alien
    `<path d="M12.5 3h7v2.2h-1.2v6.2c4.4 1.5 7.2 5.2 7.2 9.6 0 5-4.3 8.5-9.5 8.5S6.5 26 6.5 21c0-4.4 2.8-8.1 7.2-9.6V5.2h-1.2Z" fill="#e2e8f0"/><path d="M7.6 19.5c3-1.5 6.5 1 9.6-.4 2.6-1.1 5-.8 7.3.3.4 4.6-3.8 8.1-8.5 8.1s-8.8-3.4-8.4-8Z" fill="var(--c)"/><circle cx="13" cy="23" r="1.1" fill="#fff" opacity=".8"/><circle cx="18" cy="21.6" r=".7" fill="#fff" opacity=".8"/>`, // poción
    `<path d="M3.5 11 9.5 16 16 6l6.5 10 6-5-2.5 15H6Z" fill="var(--c)"/><rect x="6" y="24" width="20" height="3.5" rx="1" fill="var(--c)"/><circle cx="16" cy="18.5" r="1.8" fill="#fff"/><circle cx="10.5" cy="19.8" r="1.2" fill="#fff"/><circle cx="21.5" cy="19.8" r="1.2" fill="#fff"/>`, // corona
  ];
  const COLORES = ['#f97316', '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#14b8a6', '#6366f1', '#a16207', '#64748b', '#d946ef'];

  // Para elegir a mano: 10 iconos y 10 colores. Se guarda como un número: 1000 + icono × 100 + color.
  const ELEGIBLES = [
    ESPECIALES.gatoMorado.svg, FRIKIS[0], FRIKIS[1], FRIKIS[2], FRIKIS[3], FRIKIS[4], FRIKIS[5], FRIKIS[6], FRIKIS[8], FRIKIS[11],
  ];
  const COLORES_ELEGIR = ['#f97316', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6', '#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#1f2937'];
  const codigo = (icono, color) => 1000 + icono * 100 + color;
  const decodificar = (n) => (n >= 1000 ? { icono: Math.floor((n - 1000) / 100), color: (n - 1000) % 100 } : null);

  function avatarDe(nombre, elegido) {
    const e = decodificar(Number(elegido) || 0);
    if (e && ELEGIBLES[e.icono] && COLORES_ELEGIR[e.color]) return { c: COLORES_ELEGIR[e.color], svg: ELEGIBLES[e.icono] };
    const n = norm(nombre);
    const fijo = FIJOS[huella(n)];
    if (fijo) return ESPECIALES[fijo];
    const h = azar(n || '?');
    return { c: COLORES[h % COLORES.length], svg: FRIKIS[Math.floor(h / COLORES.length) % FRIKIS.length] };
  }

  raiz.Avatares = { avatarDe, ELEGIBLES, COLORES_ELEGIR, codigo, decodificar };
})(window);
