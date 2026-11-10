// Cálculo del reparto. Sin dependencias: se usa en la página y en las pruebas (node).
(function (raiz) {
  const cent = (n) => Math.round((Number(n) || 0) * 100);

  // Reparte "total" (en céntimos) según pesos, sin perder ni sobrar céntimos.
  function repartir(total, pesos) {
    const nombres = Object.keys(pesos).filter((k) => pesos[k] > 0);
    const suma = nombres.reduce((a, k) => a + pesos[k], 0);
    const out = {};
    if (!suma) return out;
    let usado = 0;
    const restos = nombres.map((k) => {
      const exacto = (total * pesos[k]) / suma;
      const base = Math.floor(exacto);
      out[k] = base;
      usado += base;
      return { k, r: exacto - base };
    });
    restos.sort((a, b) => b.r - a.r || a.k.localeCompare(b.k));
    for (let i = 0; i < total - usado; i++) out[restos[i % restos.length].k]++;
    return out;
  }

  // cuenta: { items:[{id,nombre,precio,todos}], personas:[...], marcas:{itemId:{persona:peso}}, extra:{tipo:'pct'|'eur', valor} }
  // Devuelve importes en céntimos.
  function calcular(cuenta) {
    const personas = cuenta.personas || [];
    const marcas = cuenta.marcas || {};
    const sub = Object.fromEntries(personas.map((p) => [p, 0]));
    let sinAsignar = 0;
    let totalPlatos = 0;
    const porPlato = {};
    for (const it of cuenta.items || []) {
      const t = cent(it.precio);
      totalPlatos += t;
      let pesos = {};
      if (it.todos) personas.forEach((p) => (pesos[p] = 1));
      else
        for (const [p, w] of Object.entries(marcas[it.id] || {}))
          if (personas.includes(p) && w > 0) pesos[p] = Number(w);
      const r = repartir(t, pesos);
      porPlato[it.id] = r;
      if (!Object.keys(r).length) sinAsignar += t;
      for (const [p, c] of Object.entries(r)) sub[p] += c;
    }
    // Propina / extra: se reparte en proporción a lo que ha tomado cada uno.
    const ex = cuenta.extra || {};
    const asignado = totalPlatos - sinAsignar;
    let extra = 0;
    if (ex.tipo === 'pct') extra = Math.round((totalPlatos * (Number(ex.valor) || 0)) / 100);
    else if (ex.tipo === 'eur') extra = cent(ex.valor);
    const extraAsignado = totalPlatos ? Math.round((extra * asignado) / totalPlatos) : 0;
    const repExtra = repartir(extraAsignado, asignado ? sub : {});
    const total = {};
    for (const p of personas) total[p] = sub[p] + (repExtra[p] || 0);
    return { sub, extra: repExtra, total, sinAsignar, totalPlatos, totalCuenta: totalPlatos + extra, porPlato };
  }

  // Lee las líneas de un ticket (texto de la foto) y saca platos con precio.
  function leerTicket(texto) {
    const fuera = /(total|subtotal|sub-total|iva|i\.v\.a|base|imponible|cambio|efectivo|tarjeta|visa|entregado|cuota|nif|cif|tel[eé]f|fecha|mesa|camarero|factura|ticket|gracias|propina|importe|pago)/i;
    const items = [];
    for (let linea of String(texto).split(/\r?\n/)) {
      linea = linea.replace(/\s+/g, ' ').trim();
      if (linea.length < 3 || fuera.test(linea)) continue;
      const m = linea.match(/^(.*?)[\s€]*(-?\d{1,4}(?:[.,]\d{3})*[.,]\d{2})\s*(?:€|eur|e)?\s*[a-z]?$/i);
      if (!m) continue;
      let nombre = m[1].trim();
      let precio = Number(m[2].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
      // Quitar precio unitario intermedio ("2 CAÑA 2,50 5,00")
      nombre = nombre.replace(/\s+\d{1,4}[.,]\d{2}\s*€?$/, '').trim();
      let uds = 1;
      const q = nombre.match(/^(\d{1,2})\s*[xX*]?\s+(.+)$/) || nombre.match(/^(.+?)\s+[xX*]\s*(\d{1,2})$/);
      if (q) {
        if (/^\d/.test(q[1])) { uds = Number(q[1]); nombre = q[2]; }
        else { nombre = q[1]; uds = Number(q[2]); }
      }
      nombre = nombre.replace(/^[^\p{L}\d]+|[^\p{L}\d)]+$/gu, '').trim();
      if (!nombre || !/\p{L}{2}/u.test(nombre) || !(precio > 0) || precio > 2000) continue;
      items.push({ nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase(), precio, uds });
    }
    return items;
  }

  raiz.Calculo = { calcular, repartir, leerTicket, cent };
  if (typeof module !== 'undefined') module.exports = raiz.Calculo;
})(typeof window !== 'undefined' ? window : globalThis);
