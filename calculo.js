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

  // Lee un número de ticket: "7,95", "7.95", "3:95" y también "795" (la foto se comió la coma).
  function numTicket(t) {
    t = t.replace(/[€]/g, '');
    if (/^\d{1,4}[.,:]\d{2}$/.test(t)) return Number(t.replace(/[,:]/, '.'));
    if (/^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(t)) return Number(t.replace(/\./g, '').replace(',', '.'));
    if (/^\d{3,6}$/.test(t)) return Number(t) / 100;
    return NaN;
  }
  const casi = (a, b) => Math.abs(a - b) < 0.015;

  // Lee el texto de la foto de un ticket. Devuelve { items:[{nombre,precio,uds,revisar}], total }
  function leerTicket(texto) {
    const fuera = /(total|subtotal|sub-total|i\.?v\.?a|base|imponible|cambio|efectivo|tarjeta|visa|entregado|cuota|nif|cif|tel[eé]?f|fecha|mesa|camarero|\d{3} ?\d{2} ?\d{2} ?\d{2}|factura|comprobante|gracias|propina|importe|pendiente|cobro|bruto|descripci)/i;
    const items = [];
    let total = null;
    let lineas = String(texto).split(/\r?\n/);
    // Si hay cabecera de la tabla (Unid / Descripción / Cant.), los platos empiezan después
    const cab = lineas.findIndex((l) => /descrip|\bunid|\bcant\.?\b|concepto|art[ií]culo/i.test(l));
    if (cab >= 0) lineas = lineas.slice(cab + 1);
    let acabado = false;
    for (let linea of lineas) {
      linea = linea.replace(/[«»"“”—_]/g, ' ').replace(/\s+/g, ' ').trim();
      // El total del ticket (para comprobar)
      const mt = linea.match(/\btotal\b(?!\s*(?:bruto|iva|neto))[^\d]*(\d{1,4}(?:[.,:]\d{2})|\d{3,6})\b/i);
      if (mt && !/i\.?v\.?a|base|bruto/i.test(linea)) { const v = numTicket(mt[1]); if (v > 0 && total == null) total = v; }
      // Al llegar a la base, el IVA o el total, se acaban los platos
      if (items.length && /\b(total|base|subtotal|i\.?v\.?a)\b/i.test(linea)) acabado = true;
      if (acabado || linea.length < 4 || fuera.test(linea)) continue;
      // "7 95" al final = 7,95 (la foto se comió la coma)
      linea = linea.replace(/(\d[.,:]\d{2} )(\d{1,3}) (\d{2})\s*$/, '$1$2,$3');
      // Quitar basura del final (letras sueltas que no son del plato)
      let tok = linea.split(' ');
      while (tok.length && isNaN(numTicket(tok[tok.length - 1])) && tok[tok.length - 1].length <= 3 && !/\p{L}{3}/u.test(tok[tok.length - 1])) tok.pop();
      // Números del final: [precio unidad] [importe]
      const nums = [];
      while (tok.length && nums.length < 2 && !isNaN(numTicket(tok[tok.length - 1]))) nums.unshift(numTicket(tok.pop()));
      if (!nums.length) continue;
      // Cantidad delante: "2", o "|", "l", "I" que suelen ser un 1 mal leído. Se ignora basura anterior.
      let resto = tok.join(' ');
      let uds = null;
      const mq = resto.match(/(?:^|\s)(\d{1,2}|[|lI!\]])\s*[xX*]?\s+(?=\p{L})(.*)$/u);
      if (mq) { uds = /\d/.test(mq[1]) ? Number(mq[1]) : 1; resto = mq[2]; }
      else { const mx = resto.match(/^(.*\p{L}.*?)\s+[xX*]\s*(\d{1,2})$/u); if (mx) { resto = mx[1]; uds = Number(mx[2]); } }
      let precio, revisar = false;
      if (nums.length === 2) {
        const [u, imp] = nums;
        if (uds && casi(uds * u, imp)) precio = imp;
        else if (u > 0 && Number.isInteger(Math.round(imp / u)) && casi(Math.round(imp / u) * u, imp) && imp / u <= 60) { uds = Math.round(imp / u); precio = imp; }
        else { precio = imp; revisar = !(uds && imp / uds > 0.2); } // manda el importe (lo que se paga)
      } else {
        precio = nums[0];
        if (uds > 1) revisar = true; // ¿es el precio de una o de todas?
      }
      uds = uds || 1;
      resto = resto.replace(/(?:\s+\S{0,2}\d\S{0,2})+$/u, '').replace(/(\p{L}{3,})\d+$/u, '$1');
      let nombre = resto.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/^[^\p{L}\d(]+|[^\p{L}\d)]+$/gu, '').replace(/\s+[>|]\s*$/, '').trim();
      if (!nombre || !/\p{L}{3}/u.test(nombre) || !(precio > 0) || precio > 2000) continue;
      items.push({ nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase(), precio, uds, revisar });
    }
    return { items, total };
  }

  raiz.Calculo = { calcular, repartir, leerTicket, cent };
  if (typeof module !== 'undefined') module.exports = raiz.Calculo;
})(typeof window !== 'undefined' ? window : globalThis);
