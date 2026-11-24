(() => {
  const D = window.YAKKADEX;
  const $ = s => document.querySelector(s);
  const el = (tag, props = {}, ...hijos) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...hijos);
    return n;
  };
  const tipo = id => D.tipos.find(t => t.id === id);
  const chip = id => el('span', { className: 'chip', textContent: tipo(id).nombre, style: `background:${tipo(id).color}` });
  const miles = n => n.toLocaleString('es');

  const cartas = $('#cartas');
  for (const l of D.legendarios) {
    const c = el('article', { className: 'carta' });
    c.append(
      el('h3', {}, l.nombre, el('span', { className: 'viejo', textContent: `antes «${l.antes}»` })),
      chip(l.tipo),
      el('p', { className: 'efecto', textContent: l.efecto }),
      el('p', { className: 'dato', textContent: `Habilidad: ${l.habilidad || 'sin nombre oficial'} · alcance ${l.alcance}` }),
      el('p', { className: 'dato', textContent: `Existen ${miles(l.oferta)} · ${l.rangos}` }),
    );
    cartas.append(c);
  }

  $('#lista-tipos').append(...D.tipos.map(t => el('li', { className: 'tipo', textContent: `${t.nombre} · ${t.cantidad}`, style: `background:${t.color}` })));

  $('#dex-intro').textContent = `La Yakkadex oficial tiene ${D.dex.total} espacios: ${D.dex.comunes} comunes, ${D.dex.raros} raros y ${D.dex.legendarios} legendarios. Unos ${D.dex.cazablesEnAcceso} se podrán cazar en el early access. Por ahora se conocen estos; la tabla crece a medida que los descubramos.`;
  $('#tabla-monstruos tbody').append(...D.monstruos.map(m => el('tr', {},
    el('td', { textContent: m.nombre }), el('td', {}, chip(m.tipo)), el('td', { textContent: m.rareza }),
    el('td', { className: 'num', textContent: m.oferta ? miles(m.oferta) : '—' }), el('td', { textContent: m.nota }))));

  $('#mecanicas').append(...D.mecanicas.map(m => el('div', { className: 'mecanica' },
    el('h3', {}, m.tema, el('span', { className: 'origen ' + m.origen, textContent: m.origen === 'oficial' ? 'Oficial' : 'Stream' })),
    el('ul', {}, ...m.puntos.map(p => el('li', { textContent: p }))))));

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const horaLocal = (utc, horas) => {
    const d = new Date(Date.parse(utc) + horas * 3600000);
    return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  };
  const horarios = utc => el('table', { className: 'horarios' },
    el('caption', { textContent: `${horaLocal(utc, 0)} UTC` }),
    el('tbody', {}, ...D.zonas.map(z => el('tr', {}, el('th', { scope: 'row', textContent: horaLocal(utc, z.horas) }), el('td', { textContent: z.paises })))));
  $('#linea').append(...D.fechas.map(f => el('li', { className: f.dia === '30 nov' ? 'tuyo' : '' },
    el('span', { className: 'dia', textContent: f.dia }), f.que, ...(f.utc ? [horarios(f.utc)] : []))));

  const fuentes = $('#fuentes');
  D.fuentes.forEach((f, i) => { if (i) fuentes.append(' · '); fuentes.append(el('a', { href: f.url, textContent: f.nombre, rel: 'noopener', target: '_blank' })); });
  $('#actualizado').textContent = `Actualizado el ${D.actualizado}.`;

  const COLS = 10, FILAS = 7, CLAVE = 'yakkadex-granja-v2';
  const PIEZAS = [
    { id: 'Ondi', texto: 'Ondi', tipo: 'leg', aura: 'chica', img: 'sprites/ondi.png' },
    { id: 'Raigo', texto: 'Raigo', tipo: 'leg', aura: 'grande', img: 'sprites/raigo.png' },
    { id: 'Kova', texto: 'Kova', tipo: 'leg', aura: 'kova', img: 'sprites/kova.png' },
    { id: 'trab', texto: 'Trabajador', tipo: 'trab', img: 'sprites/brazito.png' },
    { id: 'borrar', texto: 'Quitar' },
  ];
  let pieza = 'trab';
  let celdas = new Array(COLS * FILAS).fill(null);
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (Array.isArray(guardado) && guardado.length === celdas.length) celdas = guardado;
    else throw 0;
  } catch {
    const centro = 3 * COLS + 4;
    celdas[centro] = 'Ondi';
    for (const d of [-1, 1, -COLS, COLS, COLS + 1]) celdas[centro + d] = 'trab';
    celdas[0] = 'trab';
  }

  const herramientas = $('.herramientas');
  for (const p of PIEZAS) {
    const b = el('button', { type: 'button', className: 'herramienta' }, ...(p.img ? [el('img', { className: 'icono', src: p.img, alt: '' })] : []), p.texto);
    b.setAttribute('role', 'radio');
    b.dataset.id = p.id;
    b.addEventListener('click', () => { pieza = p.id; pintarHerramientas(); });
    herramientas.append(b);
  }
  const pintarHerramientas = () => herramientas.querySelectorAll('.herramienta').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === pieza)));

  const granja = $('#granja');
  const botones = celdas.map((_, i) => {
    const b = el('button', { type: 'button', className: 'casilla-g' });
    b.setAttribute('role', 'gridcell');
    b.addEventListener('click', () => {
      celdas[i] = pieza === 'borrar' || celdas[i] === pieza ? null : pieza;
      try { localStorage.setItem(CLAVE, JSON.stringify(celdas)); } catch {}
      pintar();
    });
    granja.append(b);
    return b;
  });

  const dentro = (a, b, aura) => {
    const dx = Math.abs(a % COLS - b % COLS), dy = Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS));
    return aura === 'grande' ? Math.max(dx, dy) <= 3 : dx + dy <= 1;
  };
  const cubren = (i, id) => celdas.some((c, j) => c === id && j !== i && dentro(i, j, PIEZAS.find(p => p.id === id).aura));

  function pintar() {
    let trabajadores = 0, total = 0, sinCansancio = 0, conOndi = 0, conRaigo = 0, conAmbos = 0;
    celdas.forEach((c, i) => {
      const b = botones[i];
      b.className = 'casilla-g';
      if (cubren(i, 'Ondi')) b.classList.add('aura-chica');
      if (cubren(i, 'Raigo')) b.classList.add('aura-grande');
      if (cubren(i, 'Kova')) b.classList.add('aura-kova');
      b.replaceChildren();
      const fila = Math.floor(i / COLS) + 1, col = i % COLS + 1;
      if (!c) { b.setAttribute('aria-label', `Casilla ${col}, ${fila}: vacía`); return; }
      const p = PIEZAS.find(x => x.id === c);
      if (p.tipo === 'leg') {
        b.append(el('span', { className: 'pieza leg' }, el('img', { src: p.img, alt: '' }), el('span', { className: 'nombre', textContent: p.texto })));
        b.setAttribute('aria-label', `Casilla ${col}, ${fila}: ${p.texto}`);
        return;
      }
      const o = cubren(i, 'Ondi'), r = cubren(i, 'Raigo');
      const mult = (o ? 2 : 1) * (r ? 2 : 1);
      if (o && r) conAmbos++; else if (o) conOndi++; else if (r) conRaigo++;
      trabajadores++;
      total += mult;
      if (cubren(i, 'Kova')) sinCansancio++;
      b.append(el('span', { className: 'pieza trab' + (mult > 1 ? ' potenciado' : '') }, el('img', { src: p.img, alt: '' }), el('span', { className: 'mult', textContent: `×${mult}` })));
      b.setAttribute('aria-label', `Casilla ${col}, ${fila}: trabajador que rinde ×${mult}`);
    });
    const extra = total - trabajadores;
    $('.resultado').replaceChildren(trabajadores
      ? el('p', {}, el('strong', { textContent: trabajadores }), trabajadores === 1 ? ' trabajador produce lo mismo que ' : ' trabajadores producen lo mismo que ', el('strong', { className: 'grande', textContent: total }), ` sin auras${extra ? `: +${Math.round(extra / trabajadores * 100)} % de producción.` : `. ${trabajadores === 1 ? 'Acércalo' : 'Acércalos'} a un Legendario para potenciar${trabajadores === 1 ? 'lo' : 'los'}.`}`)
      : el('p', { textContent: 'Coloca trabajadores y Legendarios para ver cuánto rinde tu granja.' }));
    $('.resumen').replaceChildren(
      el('dt', { textContent: 'Con Ondi (×2 recursos)' }), el('dd', { textContent: conOndi }),
      el('dt', { textContent: 'Con Raigo (×2 velocidad)' }), el('dd', { textContent: conRaigo }),
      el('dt', { textContent: 'Con los dos (×4)' }), el('dd', { textContent: conAmbos }),
      el('dt', { textContent: 'Sin cansancio (Kova)' }), el('dd', { textContent: sinCansancio }),
    );
  }

  $('#limpiar').addEventListener('click', () => { celdas.fill(null); try { localStorage.removeItem(CLAVE); } catch {} pintar(); });
  pintarHerramientas();
  pintar();
})();
