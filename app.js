/* PixelBoy · lógica do app (galeria, biblioteca, player, controles e gestos) */
const CDN = 'https://cdn.emulatorjs.org/stable/data/';
const ANALOG = 0x7fff;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ext = n => (n.split('.').pop() || '').toLowerCase();
const consolePorExt = n => Object.keys(CONSOLES).find(c => CONSOLES[c].ext.includes(ext(n))) || null;
const info = c => CONSOLES[c] || { nome: c, sigla: c.toUpperCase(), cor: '#555', layout: '4', gestos: CONSOLES.snes.gestos };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const semExt = n => n.replace(/\.[^.]+$/, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const limparNome = n => semExt(n).replace(/[\(\[].*?[\)\]]/g, '').replace(/[_.]+/g, ' ').replace(/\s+/g, ' ').trim() || semExt(n);
const iniciais = n => limparNome(n).split(' ').filter(p => /[a-z0-9]/i.test(p)).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

/* ================= Som sempre funcionando =================
   Navegadores (principalmente no celular) criam o áudio "suspenso" até o primeiro toque,
   e o suspendem de novo quando o app vai para o fundo. Aqui registramos todo AudioContext
   criado (inclusive o do EmulatorJS) e religamos todos a cada toque e ao voltar para o app. */
const contextosAudio = new Set();
(() => {
  const Orig = window.AudioContext || window.webkitAudioContext;
  if (!Orig) return;
  function Rastreado(...args) { const c = new Orig(...args); contextosAudio.add(c); return c; }
  Rastreado.prototype = Orig.prototype;
  Object.setPrototypeOf(Rastreado, Orig);
  window.AudioContext = Rastreado;
  if (window.webkitAudioContext) window.webkitAudioContext = Rastreado;
  // iOS: toca mesmo com a chave de silencioso ligada
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
})();
function destravarAudio() {
  for (const c of contextosAudio) if (c.state !== 'running' && c.state !== 'closed') c.resume().catch(() => {});
}
['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, destravarAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) { destravarAudio(); setTimeout(destravarAudio, 300); } });
window.addEventListener('focus', destravarAudio);
window.addEventListener('pageshow', destravarAudio);

/* ================= Configurações ================= */
const CFG_PADRAO = { modo: 'auto', vibrar: true, sons: true, legendaVista: {} };
let cfg = { ...CFG_PADRAO };
try { cfg = { ...CFG_PADRAO, ...JSON.parse(localStorage.getItem('pb-config') || '{}') }; } catch (e) {}
const salvarCfg = () => { try { localStorage.setItem('pb-config', JSON.stringify(cfg)); } catch (e) {} };
const vib = (ms = 8) => { if (cfg.vibrar) try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* ================= Efeitos sonoros (sintetizados, estilo 8 bits) ================= */
const SFX = (() => {
  let ctx = null, mestre = null;
  const pegar = () => {
    if (!ctx) { ctx = new AudioContext(); mestre = ctx.createGain(); mestre.gain.value = 0.5; mestre.connect(ctx.destination); }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  };
  function tom(f, dur, tipo = 'square', vol = 0.12, atraso = 0, fFinal = null) {
    const c = pegar(), t = c.currentTime + atraso;
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (fFinal) o.frequency.exponentialRampToValueAtTime(fFinal, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + 0.02);
  }
  const sons = {
    toque:   () => tom(1046, 0.04, 'square', 0.08),
    nav:     () => { tom(660, 0.05); tom(990, 0.07, 'square', 0.1, 0.05); },
    abrir:   () => { tom(523, 0.05, 'triangle', 0.16); tom(784, 0.08, 'triangle', 0.16, 0.05); },
    fechar:  () => { tom(784, 0.05, 'triangle', 0.16); tom(523, 0.08, 'triangle', 0.16, 0.05); },
    ok:      () => [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.09, 'square', 0.09, i * 0.07)),
    salvar:  () => { tom(880, 0.06, 'square', 0.09); tom(1318, 0.12, 'square', 0.09, 0.07); },
    carregar:() => { tom(1318, 0.06, 'square', 0.09); tom(880, 0.12, 'square', 0.09, 0.07); },
    erro:    () => { tom(220, 0.12, 'sawtooth', 0.07); tom(147, 0.2, 'sawtooth', 0.07, 0.11); },
    apagar:  () => tom(500, 0.25, 'triangle', 0.14, 0, 90),
    iniciar: () => [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => tom(f, i === 6 ? 0.25 : 0.08, 'square', 0.08, i * 0.075)),
  };
  return { tocar(n) { if (!cfg.sons || !sons[n]) return; try { sons[n](); } catch (e) {} } };
})();

// sons automáticos nos botões da interface (os controles do jogo ficam só com vibração)
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.closest('#controles, #gestos')) return;
  if (b.matches('.console')) SFX.tocar('nav');
  else if (b.matches('[data-jogar]')) SFX.tocar('iniciar');
  else if (b.matches('#voltar, [data-fechar], [data-m="fechar"], [data-o="fechar"], [data-c=""]')) SFX.tocar('fechar');
  else if (b.matches('[data-mais], #abrir-config, #b-add, [data-g], [data-ver-gestos]')) SFX.tocar('abrir');
  else SFX.tocar('toque');
}, true);

function aviso(txt, ms = 2200, som = null) {
  if (som) SFX.tocar(som);
  const a = $('#aviso'); a.textContent = txt; a.classList.add('mostrar');
  clearTimeout(aviso.t); aviso.t = setTimeout(() => a.classList.remove('mostrar'), ms);
}
const abrir = id => $(id).classList.add('aberto');
const fechar = id => $(id).classList.remove('aberto');
$$('.fundo').forEach(f => f.addEventListener('click', e => { if (e.target === f) f.classList.remove('aberto'); }));

/* ================= IndexedDB ================= */
const DB = (() => {
  let p;
  const abrirDB = () => p ||= new Promise((ok, erro) => {
    const r = indexedDB.open('pixelboy', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('jogos', { keyPath: 'id' });
      r.result.createObjectStore('saves', { keyPath: 'id' });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
  const tx = async (loja, modo, fn) => {
    const db = await abrirDB();
    return new Promise((ok, erro) => {
      const t = db.transaction(loja, modo);
      const req = fn(t.objectStore(loja));
      t.oncomplete = () => ok(req && req.result);
      t.onerror = () => erro(t.error);
    });
  };
  return {
    get: (l, k) => tx(l, 'readonly', o => o.get(k)),
    all: l => tx(l, 'readonly', o => o.getAll()),
    put: (l, v) => tx(l, 'readwrite', o => o.put(v)),
    del: (l, k) => tx(l, 'readwrite', o => o.delete(k)),
  };
})();
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

/* ================= Jogos do servidor (pasta roms/) ================= */
let servidor = [];
async function carregarServidor() {
  try {
    const r = await fetch('roms/lista.json', { cache: 'no-cache' });
    const lista = r.ok ? await r.json() : [];
    servidor = lista.filter(j => j && j.arquivo).map(j => {
      const pasta = j.arquivo.split('/')[0];
      return {
        id: 'srv-' + slug(j.arquivo),
        nome: j.nome || limparNome(j.arquivo.split('/').pop()),
        arquivo: j.arquivo.split('/').pop(),
        console: j.console || (CONSOLES[pasta] ? pasta : null) || consolePorExt(j.arquivo) || 'snes',
        url: 'roms/' + j.arquivo.split('/').map(encodeURIComponent).join('/'),
        servidor: true,
      };
    });
  } catch (e) { servidor = []; }
}

/* ================= Galeria ================= */
const meta = async () => {
  // a galeria só precisa dos dados leves; os bytes da ROM ficam no banco
  const jogos = (await DB.all('jogos')).map(({ dados, ...r }) => r);
  const saves = new Set((await DB.all('saves')).map(s => s.id));
  return { jogos: [...jogos, ...servidor], saves };
};

function cartaoConsole(c, n) {
  const i = info(c);
  return `<button class="console ${n ? '' : 'vazio'}" style="--c:${i.cor}" data-console="${c}">
    <span class="deco"></span><div class="sigla">${esc(i.sigla)}</div>
    <div class="nome">${esc(i.nome)}</div><div class="qtd">${n ? n + (n > 1 ? ' jogos' : ' jogo') : 'nenhum jogo'}</div>
  </button>`;
}

function cartaoJogo(j, temSave) {
  const i = info(j.console);
  return `<div class="jogo" data-id="${esc(j.id)}">
    ${j.servidor ? '' : '<button class="mais" data-mais aria-label="Opções">⋯</button>'}
    <button class="capa" style="--c:${i.cor}" data-jogar>
      <span class="selo">${temSave ? '<i>SAVE</i>' : ''}${j.servidor ? '<i>SERVIDOR</i>' : ''}</span>
      <span class="ini">${esc(iniciais(j.nome))}</span><span class="play">▶</span>
    </button>
    <div class="titulo">${esc(limparNome(j.nome))}</div>
  </div>`;
}

async function renderInicio() {
  $('#voltar').style.display = 'none';
  $('#titulo').innerHTML = 'PixelBoy<small>WEB</small>';
  const { jogos, saves } = await meta();
  const cont = {};
  jogos.forEach(j => cont[j.console] = (cont[j.console] || 0) + 1);
  const comJogos = Object.keys(CONSOLES).filter(c => cont[c]).sort((a, b) => cont[b] - cont[a]);
  const semJogos = Object.keys(CONSOLES).filter(c => !cont[c]);
  const recentes = jogos.filter(j => saves.has(j.id)).slice(0, 4);

  let h = '';
  if (!jogos.length) h += `<div class="vazio-box"><b>Sua biblioteca está vazia.</b><br>Toque em <b>＋ Adicionar</b> e escolha ROMs ou um pack .zip — o app separa cada jogo no console certo e guarda tudo neste aparelho.</div>`;
  if (recentes.length) h += `<div class="secao"><h2>Continuar jogando</h2></div><div class="grade">${recentes.map(j => cartaoJogo(j, true)).join('')}</div>`;
  if (comJogos.length) h += `<div class="secao"><h2>Seus consoles</h2><span>${jogos.length} jogos</span></div><div class="grade">${comJogos.map(c => cartaoConsole(c, cont[c])).join('')}</div>`;
  h += `<div class="secao"><h2>${comJogos.length ? 'Outros consoles' : 'Consoles'}</h2><span>${semJogos.length}</span></div><div class="grade">${semJogos.map(c => cartaoConsole(c, 0)).join('')}</div>`;
  $('#conteudo').innerHTML = h;
}

async function renderConsole(c) {
  const i = info(c);
  $('#voltar').style.display = 'grid';
  $('#titulo').textContent = i.nome;
  const { jogos, saves } = await meta();
  const meus = jogos.filter(j => j.console === c).sort((a, b) => a.nome.localeCompare(b.nome));
  let h = '';
  if (!meus.length) h += `<div class="vazio-box">Nenhum jogo de <b>${esc(i.nome)}</b> ainda.<br>Toque em <b>＋ Adicionar</b> para escolher ROMs ou um pack .zip.<br><br><small>Extensões: ${i.ext.length ? i.ext.map(e => '.' + e).join(' ') : '.zip / .chd / .cue (você escolhe o console ao adicionar)'}</small></div>`;
  else h += `<div class="secao"><h2>Jogos</h2><span>${meus.length}</span></div><div class="grade">${meus.map(j => cartaoJogo(j, saves.has(j.id))).join('')}</div>`;
  h += `<button class="pilula" style="width:100%;background:#2e2a40;box-shadow:none;padding:13px" data-ver-gestos="${c}">🖐 Ver gestos do modo celular</button>`;
  $('#conteudo').innerHTML = h;
}

const consoleAtual = () => (location.hash.match(/^#console-(.+)$/) || [])[1] || null;
function rota() { const c = consoleAtual(); (c && CONSOLES[c]) ? renderConsole(c) : renderInicio(); window.scrollTo(0, 0); }
window.addEventListener('hashchange', rota);
$('#voltar').onclick = () => { if (history.length > 1) history.back(); else location.hash = ''; };

$('#conteudo').addEventListener('click', async e => {
  const cc = e.target.closest('[data-console]');
  if (cc) { location.hash = 'console-' + cc.dataset.console; return; }
  const vg = e.target.closest('[data-ver-gestos]');
  if (vg) { mostrarGestos(vg.dataset.verGestos); return; }
  const card = e.target.closest('.jogo'); if (!card) return;
  const id = card.dataset.id;
  if (e.target.closest('[data-mais]')) return opcoesJogo(id);
  if (e.target.closest('[data-jogar]')) { const j = await acharJogo(id); if (j) jogar(j, true); }
});

async function acharJogo(id) { return (await DB.get('jogos', id)) || servidor.find(j => j.id === id) || null; }

async function opcoesJogo(id) {
  const j = await DB.get('jogos', id); if (!j) return;
  const s = await DB.get('saves', id);
  $('#jogo-corpo').innerHTML = `<h4>${esc(limparNome(j.nome))}</h4>
    <p>${esc(info(j.console).nome)} · ${(j.tamanho / 1048576).toFixed(1)} MB${s ? ' · tem save' : ''}</p>
    <button class="pilula destaque" data-o="jogar">▶ Jogar</button>
    <button class="pilula" data-o="console">🎮 Mudar console</button>
    ${s ? '<button class="pilula" data-o="limpar">🧹 Apagar só o save</button>' : ''}
    <button class="pilula" data-o="apagar" style="color:#ff8a8a">🗑 Apagar jogo e save</button>
    <button class="pilula" data-o="fechar">Fechar</button>`;
  abrir('#f-jogo');
  $('#jogo-corpo').onclick = async e => {
    const o = e.target.closest('[data-o]')?.dataset.o; if (!o) return;
    fechar('#f-jogo');
    if (o === 'jogar') jogar(j, true);
    if (o === 'console') { const c = await perguntarConsole(j.arquivo); if (c) { j.console = c; await DB.put('jogos', j); rota(); } }
    if (o === 'limpar' && confirm('Apagar o save deste jogo?')) { await DB.del('saves', id); rota(); aviso('Save apagado'); }
    if (o === 'apagar' && confirm(`Apagar "${limparNome(j.nome)}" e o save dele?`)) { await DB.del('jogos', id); await DB.del('saves', id); rota(); aviso('Jogo apagado', 2200, 'apagar'); }
  };
}

/* ================= Adicionar ROMs e packs ================= */
function perguntarConsole(nome) {
  return new Promise(ok => {
    const f = $('#f-console');
    $('#mc-nome').textContent = nome;
    $('#mc-lista').innerHTML = Object.keys(CONSOLES).map(c => `<button class="pilula" data-c="${c}">${CONSOLES[c].nome}</button>`).join('');
    abrir('#f-console');
    f.onclick = e => {
      const b = e.target.closest('[data-c]');
      if (b) { fechar('#f-console'); ok(b.dataset.c || null); }
      else if (e.target === f) { fechar('#f-console'); ok(null); }
    };
  });
}

async function guardarRom(nomeArquivo, dados, c) {
  const id = slug(semExt(nomeArquivo)) + '-' + dados.byteLength;
  await DB.put('jogos', { id, nome: limparNome(nomeArquivo), arquivo: nomeArquivo, console: c, tamanho: dados.byteLength, adicionado: Date.now(), dados });
  return id;
}

const PULAR = /(^|\/)(__MACOSX|\.)|\.(txt|nfo|jpg|jpeg|png|gif|pdf|url|htm|html|md|xml|dat|ini|cfg|sav|srm|state)$/i;

/* Abre um .zip: backup do app, pack com várias ROMs, ou uma ROM compactada (arcade, etc.) */
async function abrirZip(file, padrao) {
  const z = await JSZip.loadAsync(file);
  if (z.file('backup.json')) return importarBackup(z);
  const arquivos = Object.values(z.files).filter(f => !f.dir && !PULAR.test(f.name));
  const roms = arquivos.filter(f => consolePorExt(f.name));
  const zipsInternos = arquivos.filter(f => ext(f.name) === 'zip');

  // pack: várias ROMs reconhecíveis (ou zips dentro do zip)
  if (roms.length > 1 || (roms.length >= 1 && zipsInternos.length) || zipsInternos.length > 1) {
    let n = 0, c0 = null;
    aviso(`Importando pack: ${roms.length + zipsInternos.length} arquivos…`, 4000);
    for (const f of roms) {
      const c = consolePorExt(f.name);
      await guardarRom(f.name.split('/').pop(), await f.async('arraybuffer'), c); n++; c0 = c;
    }
    // zips dentro do pack: o nome da pasta diz o console (ex.: "SNES/jogo.zip" ou "arcade/jogo.zip")
    for (const f of zipsInternos) {
      const pasta = f.name.split('/').slice(-2, -1)[0] || '';
      const c = acharConsolePorNome(pasta) || padrao;
      if (!c) continue;
      await guardarRom(f.name.split('/').pop(), await f.async('arraybuffer'), c); n++; c0 = c;
    }
    aviso(`Pack importado: ${n} jogos`, 2200, 'ok');
    return c0;
  }
  // uma ROM só dentro do zip: guarda o zip inteiro (o EmulatorJS descompacta sozinho)
  const c = (roms[0] && consolePorExt(roms[0].name)) || padrao || await perguntarConsole(file.name);
  if (!c) return null;
  await guardarRom(file.name, await file.arrayBuffer(), c);
  aviso('Adicionado: ' + limparNome(file.name), 2200, 'ok');
  return c;
}

function acharConsolePorNome(txt) {
  const t = txt.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!t) return null;
  const apelidos = { snes: 'snes', supernintendo: 'snes', nes: 'nes', famicom: 'nes', n64: 'n64', nintendo64: 'n64', gba: 'gba', gameboyadvance: 'gba',
    gb: 'gb', gbc: 'gb', gameboy: 'gb', gameboycolor: 'gb', nds: 'nds', ds: 'nds', megadrive: 'segaMD', genesis: 'segaMD', md: 'segaMD',
    mastersystem: 'segaMS', sms: 'segaMS', gamegear: 'segaGG', gg: 'segaGG', psx: 'psx', ps1: 'psx', playstation: 'psx',
    arcade: 'arcade', fbneo: 'arcade', fba: 'arcade', mame: 'mame2003', mame2003: 'mame2003', neogeo: 'arcade', cps1: 'arcade', cps2: 'arcade',
    pce: 'pce', pcengine: 'pce', turbografx: 'pce', atari2600: 'atari2600', a2600: 'atari2600', atari7800: 'atari7800', atari5200: 'a5200',
    lynx: 'lynx', jaguar: 'jaguar', ngp: 'ngp', neogeopocket: 'ngp', wonderswan: 'ws', ws: 'ws', coleco: 'coleco', colecovision: 'coleco',
    segacd: 'segaCD', saturn: 'segaSaturn', sega32x: 'sega32x', '32x': 'sega32x', virtualboy: 'vb', vb: 'vb', '3do': '3do', pcfx: 'pcfx' };
  if (apelidos[t]) return apelidos[t];
  return Object.keys(CONSOLES).find(c => c.toLowerCase() === t) || null;
}

async function adicionarArquivo(file, padrao) {
  if (ext(file.name) === 'zip' && window.JSZip) {
    try { return await abrirZip(file, padrao); } catch (e) { /* zip ilegível: trata como arquivo comum */ }
  }
  const c = consolePorExt(file.name) || padrao || await perguntarConsole(file.name);
  if (!c) return null;
  await guardarRom(file.name, await file.arrayBuffer(), c);
  return c;
}

$('#b-add').onclick = () => $('#in-jogo').click();
$('#in-jogo').onchange = async e => {
  const files = [...e.target.files]; e.target.value = '';
  if (!files.length) return;
  const padrao = consoleAtual();
  let ultimo = null, n = 0;
  for (const f of files) {
    try { const c = await adicionarArquivo(f, padrao); if (c) { ultimo = c; n++; } }
    catch (err) { aviso('Erro ao adicionar ' + f.name, 2200, 'erro'); }
  }
  if (n > 1) aviso(`${n} arquivos adicionados`, 2200, 'ok');
  else if (n === 1 && files.length === 1 && ext(files[0].name) !== 'zip') aviso('Adicionado: ' + limparNome(files[0].name), 2200, 'ok');
  if (!padrao && ultimo && n === 1) location.hash = 'console-' + ultimo; else rota();
};

/* ================= Backup: exportar / importar ================= */
async function exportar() {
  if (!window.JSZip) return aviso('Sem conexão para carregar o zip');
  aviso('Gerando zip…', 5000);
  const z = new JSZip();
  const m = { app: 'pixelboy', versao: 2, criado: new Date().toISOString(), jogos: [], saves: [] };
  for (const j of await DB.all('jogos')) {
    const caminho = `jogos/${j.console}/${j.id}/${j.arquivo}`;
    z.file(caminho, j.dados);
    m.jogos.push({ id: j.id, nome: j.nome, arquivo: j.arquivo, console: j.console, adicionado: j.adicionado, caminho });
  }
  for (const s of await DB.all('saves')) {
    const r = { id: s.id, atualizado: s.atualizado };
    if (s.srm) { r.srm = `saves/${s.id}.srm`; z.file(r.srm, s.srm); }
    if (s.state) { r.state = `saves/${s.id}.state`; z.file(r.state, s.state); }
    m.saves.push(r);
  }
  z.file('backup.json', JSON.stringify(m, null, 2));
  const blob = await z.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pixelboy-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  aviso(`Backup: ${m.jogos.length} jogos, ${m.saves.length} saves`, 2200, 'ok');
}

async function importarBackup(z) {
  const m = JSON.parse(await z.file('backup.json').async('string'));
  let nj = 0, ns = 0;
  for (const j of m.jogos || []) {
    const f = z.file(j.caminho); if (!f) continue;
    const dados = await f.async('arraybuffer');
    await DB.put('jogos', { id: j.id, nome: j.nome, arquivo: j.arquivo, console: j.console, adicionado: j.adicionado || Date.now(), tamanho: dados.byteLength, dados });
    nj++;
  }
  for (const s of m.saves || []) {
    const o = { id: s.id, atualizado: s.atualizado || Date.now() };
    if (s.srm && z.file(s.srm)) o.srm = await z.file(s.srm).async('uint8array');
    if (s.state && z.file(s.state)) o.state = await z.file(s.state).async('uint8array');
    await DB.put('saves', o); ns++;
  }
  aviso(`Backup restaurado: ${nj} jogos, ${ns} saves`, 2200, 'ok');
  return null;
}

$('#in-zip').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try { await abrirZip(f, consoleAtual()); } catch (err) { aviso('Esse arquivo não é um zip válido', 2200, 'erro'); }
  rota();
};

/* ================= Configurações ================= */
const MODOS = [
  ['auto', 'Automático', 'Gestos nos consoles 3D (N64, PlayStation) e botões nos outros.'],
  ['gestos', 'Modo celular (gestos)', 'Arraste à esquerda para mover; toque, segure e deslize à direita para agir. Feito para jogar com os polegares.'],
  ['botoes', 'Botões clássicos', 'Direcional e botões desenhados como no console original.'],
];
function renderConfig() {
  $('#config-corpo').innerHTML = `<h4>Configurações</h4>
    <h5>Controles no celular</h5>
    <div class="opcoes">${MODOS.map(([v, t, d]) => `<button class="opcao ${cfg.modo === v ? 'sel' : ''}" data-modo="${v}"><span class="bola"></span><div><b>${t}</b><span>${d}</span></div></button>`).join('')}</div>
    <button class="linha-cfg" data-vibrar>Vibrar ao tocar <span class="chave ${cfg.vibrar ? 'on' : ''}"></span></button>
    <h5>Som</h5>
    <button class="linha-cfg" data-sons>Efeitos sonoros do app <span class="chave ${cfg.sons ? 'on' : ''}"></span></button>
    <p>O som do jogo fica sempre ligado: o app religa o áudio a cada toque e quando você volta para ele.</p>
    <h5>Gestos de cada console</h5>
    <div class="lista-consoles">${Object.keys(CONSOLES).map(c => `<button data-g="${c}">${CONSOLES[c].nome}</button>`).join('')}</div>
    <h5>Biblioteca e saves</h5>
    <div class="duas"><button class="pilula" data-exp>⬇ Exportar zip</button><button class="pilula" data-imp>⬆ Importar zip</button></div>
    <p>O backup leva todos os jogos e saves deste aparelho. "Importar" aceita um backup ou um pack com várias ROMs.</p>
    <button class="pilula destaque" data-fechar>Pronto</button>`;
}
$('#abrir-config').onclick = () => { renderConfig(); abrir('#f-config'); };
$('#config-corpo').addEventListener('click', e => {
  const m = e.target.closest('[data-modo]');
  if (m) { cfg.modo = m.dataset.modo; salvarCfg(); renderConfig(); aplicarModo(); return; }
  if (e.target.closest('[data-sons]')) { cfg.sons = !cfg.sons; salvarCfg(); renderConfig(); SFX.tocar('ok'); return; }
  if (e.target.closest('[data-vibrar]')) { cfg.vibrar = !cfg.vibrar; salvarCfg(); renderConfig(); vib(30); return; }
  const g = e.target.closest('[data-g]'); if (g) { mostrarGestos(g.dataset.g); return; }
  if (e.target.closest('[data-exp]')) { exportar().catch(() => aviso('Erro ao exportar')); return; }
  if (e.target.closest('[data-imp]')) { $('#in-zip').click(); return; }
  if (e.target.closest('[data-fechar]')) fechar('#f-config');
});

/* Legenda dos gestos */
const SETAS = { cima: '↑', baixo: '↓', esq: '←', dir: '→' };
function legenda(c) {
  const g = info(c).gestos;
  const movTxt = { dpad: 'direcional (8 direções)', analog: 'analógico (quanto mais longe, mais rápido)', ambos: 'analógico + direcional' }[g.mov];
  let l = `<div><b>Lado esquerdo</b>Arraste para mover — ${movTxt}</div>`;
  if (g.toque) l += `<div><b>Toque</b>${esc(g.toque[1])}</div>`;
  if (g.segurar) l += `<div><b>Segure</b>${esc(g.segurar[1])}</div>`;
  for (const [d, v] of Object.entries(g.deslizes || {})) l += `<div><b>Deslize ${SETAS[d]}</b>${esc(v[1])}</div>`;
  if (g.camera) l += `<div><b>Arraste à direita</b>Câmera / botões C (arraste devagar e mantenha)</div>`;
  if (g.extras && g.extras.length) l += `<div><b>Botões</b>${g.extras.map(x => x[0]).join(' · ')} (na barra de cima)</div>`;
  l += `<div><b>Dica</b>Use dois dedos à direita para combinar ações (ex.: segurar para correr e tocar para pular).</div>`;
  return l;
}
function mostrarGestos(c) {
  $('#gestos-corpo').innerHTML = `<h4>Gestos · ${esc(info(c).nome)}</h4><p>Modo celular: a tela vira um controle de toque.</p>
    <div class="legenda">${legenda(c)}</div><button class="pilula destaque" data-fechar>Entendi</button>`;
  $('#gestos-corpo').onclick = e => { if (e.target.closest('[data-fechar]')) fechar('#f-gestos'); };
  abrir('#f-gestos');
}

/* ================= Emulador ================= */
let atual = null, emuCarregado = false, pausado = false;
const gm = () => window.EJS_emulator && window.EJS_emulator.gameManager;
function press(i, v) { const g = gm(); if (g) try { g.simulateInput(0, i, v); } catch (e) {} }

function modoDe(c) { return cfg.modo === 'auto' ? (info(c).auto3d ? 'gestos' : 'botoes') : cfg.modo; }
function aplicarModo() {
  if (!atual) return;
  const gestos = modoDe(atual.console) === 'gestos';
  soltarTudo();
  document.body.classList.toggle('modo-gestos', gestos);
  if (gestos) montarGestos(atual.console);
}

function jogar(jogo, peloToque) {
  if (emuCarregado) {   // o EmulatorJS só inicia uma vez por página: recarrega e abre o próximo
    salvarSRAM().finally(() => { sessionStorage.setItem('pb-abrir', jogo.id); location.reload(); });
    return;
  }
  emuCarregado = true; atual = jogo;
  const i = info(jogo.console);
  document.body.classList.add('jogando');
  document.body.dataset.console = jogo.console;
  document.body.dataset.layout = i.layout;
  document.body.classList.toggle('sem-tela', i.gestos.tela === false);
  $('#rotulo-console').textContent = i.nome.toUpperCase();
  $('#nome-jogo').textContent = limparNome(jogo.nome);
  aplicarModo();

  Object.assign(window, {
    EJS_player: '#game',
    EJS_core: jogo.console,
    EJS_gameName: limparNome(jogo.nome),
    EJS_gameUrl: jogo.servidor ? jogo.url : new File([jogo.dados], jogo.arquivo),
    EJS_pathtodata: CDN,
    EJS_startOnLoaded: !!peloToque,
    EJS_color: '#a3195b',
    EJS_volume: 1,
    EJS_onGameStart: aoIniciar,
  });
  const s = document.createElement('script');
  s.src = CDN + 'loader.js';
  document.body.appendChild(s);
  if (peloToque) telaCheia();
}

async function aoIniciar() {
  const g = gm(); if (!g || !atual) return;
  try {
    const s = await DB.get('saves', atual.id);
    if (s && s.srm) { g.FS.writeFile(g.getSaveFilePath(), s.srm); g.loadSaveFiles(); }
  } catch (e) { console.warn('save', e); }
  setInterval(salvarSRAM, 20000);
  destravarAudio(); setTimeout(destravarAudio, 500);
  if (document.body.classList.contains('modo-gestos') && !cfg.legendaVista[atual.console]) {
    cfg.legendaVista[atual.console] = true; salvarCfg(); mostrarGestos(atual.console);
  }
}

async function salvarSRAM() {
  const g = gm(); if (!g || !atual) return;
  try {
    const d = g.getSaveFile();
    if (d && d.length) {
      const s = (await DB.get('saves', atual.id)) || { id: atual.id };
      s.srm = new Uint8Array(d); s.atualizado = Date.now();
      await DB.put('saves', s);
    }
  } catch (e) {}
}
async function salvarEstado() {
  const g = gm(); if (!g) return aviso('O jogo ainda não começou');
  try {
    const st = g.getState ? g.getState() : null;
    if (!st) return aviso('Este jogo não suporta estados');
    const s = (await DB.get('saves', atual.id)) || { id: atual.id };
    s.state = new Uint8Array(st); s.atualizado = Date.now();
    await DB.put('saves', s); await salvarSRAM();
    aviso('Estado salvo 💾', 2200, 'salvar'); vib(25);
  } catch (e) { aviso('Não foi possível salvar'); }
}
async function carregarEstado() {
  const g = gm(); if (!g) return aviso('O jogo ainda não começou');
  const s = await DB.get('saves', atual.id);
  if (!s || !s.state) return aviso('Nenhum estado salvo ainda', 2200, 'erro');
  try { g.loadState(s.state); aviso('Estado carregado', 2200, 'carregar'); } catch (e) { aviso('Erro ao carregar', 2200, 'erro'); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) salvarSRAM(); });
window.addEventListener('pagehide', salvarSRAM);

const ehToque = matchMedia('(pointer:coarse)').matches;
const horizontal = () => matchMedia('(orientation:landscape)').matches;
function telaCheia() {
  if (!ehToque || !horizontal() || document.fullscreenElement) return;
  const el = document.documentElement;
  try { const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); r && r.catch && r.catch(() => {}); } catch (e) {}
}
['#tela', '#gestos'].forEach(s => $(s).addEventListener('pointerdown', () => { if (document.body.classList.contains('jogando')) telaCheia(); }));

/* Menu do jogo */
function abrirMenu() {
  const gestos = document.body.classList.contains('modo-gestos');
  $('#menu-corpo').innerHTML = `<h4>${esc(limparNome(atual.nome))}</h4>
    <div class="duas"><button class="pilula" data-m="salvar">💾 Salvar estado</button><button class="pilula" data-m="carregar">📂 Carregar estado</button></div>
    <button class="pilula" data-m="modo">🎮 Trocar para ${gestos ? 'botões clássicos' : 'modo celular (gestos)'}</button>
    ${gestos ? '<button class="pilula" data-m="gestos">🖐 Ver gestos</button>' : ''}
    <div class="duas"><button class="pilula" data-m="pausar">${pausado ? '▶ Continuar' : '⏸ Pausar'}</button><button class="pilula" data-m="reiniciar">↺ Reiniciar</button></div>
    <button class="pilula destaque" data-m="sair">◀ Voltar à galeria</button>
    <button class="pilula" data-m="fechar">Fechar</button>`;
  abrir('#f-menu');
}
$('#menu-corpo').addEventListener('click', e => {
  const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
  fechar('#f-menu');
  const g = gm();
  if (m === 'salvar') salvarEstado();
  if (m === 'carregar') carregarEstado();
  if (m === 'modo') { cfg.modo = document.body.classList.contains('modo-gestos') ? 'botoes' : 'gestos'; salvarCfg(); aplicarModo(); aviso(cfg.modo === 'gestos' ? 'Modo celular ligado' : 'Botões clássicos'); }
  if (m === 'gestos') mostrarGestos(atual.console);
  if (m === 'pausar' && g) { pausado = !pausado; g.toggleMainLoop(pausado ? 0 : 1); }
  if (m === 'reiniciar' && g) { g.restart(); aviso('Reiniciado'); }
  if (m === 'sair') salvarSRAM().finally(() => { location.hash = atual ? 'console-' + atual.console : ''; location.reload(); });
});
document.addEventListener('click', e => {
  const a = e.target.closest('[data-acao]')?.dataset.acao; if (!a) return;
  if (a === 'salvar') salvarEstado();
  if (a === 'carregar') carregarEstado();
  if (a === 'menu') abrirMenu();
});

/* ================= Entrada: contagem por botão (vários dedos no mesmo botão) ================= */
const presos = new Map();
function down(i, v = 1) { const n = (presos.get(i) || 0) + 1; presos.set(i, n); if (n === 1) press(i, v); }
function up(i) { const n = (presos.get(i) || 0) - 1; if (n <= 0) { presos.delete(i); press(i, 0); } else presos.set(i, n); }
function pulso(i, ms = 90) { down(i); setTimeout(() => up(i), ms); }
function soltarTudo() { for (const i of presos.keys()) press(i, 0); presos.clear(); for (let i = 16; i <= 23; i++) press(i, 0); }

function ligarBotao(b) {
  const i = +b.dataset.btn, v = b.dataset.analog ? ANALOG : 1;
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {}
    if (b.classList.contains('on')) return;
    b.classList.add('on'); down(i, v); vib();
  });
  const solta = () => { if (!b.classList.contains('on')) return; b.classList.remove('on'); up(i); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, solta));
}
$$('#controles [data-btn]').forEach(ligarBotao);
document.addEventListener('contextmenu', e => { if (e.target.closest('#shell')) e.preventDefault(); });

/* ---- direcional clássico ---- */
const DIR_N64 = { 4: 19, 5: 18, 6: 17, 7: 16 };   // no N64 o direcional desenhado vira o analógico
function setDirsDe(estado, novas, modo) {
  for (const d of [4, 5, 6, 7]) {
    if (novas.has(d) === estado.has(d)) continue;
    const on = novas.has(d);
    if (modo === 'analog' || modo === 'ambos') on ? down(DIR_N64[d], ANALOG) : up(DIR_N64[d]);
    if (modo !== 'analog') on ? down(d) : up(d);
  }
  if (novas.size && !estado.size) vib();
}
function dirsDoVetor(x, y, zonaMorta) {
  const s = new Set();
  if (Math.hypot(x, y) < zonaMorta) return s;
  const a = Math.atan2(y, x) * 180 / Math.PI;   // 0 = direita, 90 = baixo
  if (a > -67.5 && a < 67.5) s.add(7);
  if (a > 112.5 || a < -112.5) s.add(6);
  if (a > 22.5 && a < 157.5) s.add(5);
  if (a < -22.5 && a > -157.5) s.add(4);
  return s;
}
(() => {
  const dpad = $('#dpad');
  let dirs = new Set();
  const modo = () => document.body.dataset.layout === 'n64' ? 'analog' : 'dpad';
  const set = n => { setDirsDe(dirs, n, modo()); dirs = n; dpad.dataset.dir = [...n].join(' '); };
  const ponto = e => { const r = dpad.getBoundingClientRect(); return dirsDoVetor(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2, r.width * 0.1); };
  dpad.addEventListener('pointerdown', e => { e.preventDefault(); try { dpad.setPointerCapture(e.pointerId); } catch (_) {} set(ponto(e)); });
  dpad.addEventListener('pointermove', e => { if (dpad.hasPointerCapture && dpad.hasPointerCapture(e.pointerId)) set(ponto(e)); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => dpad.addEventListener(ev, () => set(new Set())));
})();

/* ================= MODO CELULAR (gestos) ================= */
let preset = null;
function montarGestos(c) {
  preset = info(c).gestos;
  const ex = $('#g-extras');
  ex.innerHTML = (preset.extras || []).map(([r, i]) => `<button data-btn="${i}">${esc(r)}</button>`).join('') + '<button class="g-menu" data-acao="menu">☰</button>';
  ex.querySelectorAll('[data-btn]').forEach(ligarBotao);
  const t = preset.toque ? preset.toque[1].split('·')[0].trim() : '';
  const s = preset.segurar ? preset.segurar[1].split('·')[0].trim() : '';
  $('#dica-acao').innerHTML = `AÇÃO<br>toque: ${esc(t)} · segure: ${esc(s)}${preset.camera ? '<br>arraste: câmera' : ''}`;
  $('#dica-mov').innerHTML = `MOVER<br>${preset.mov === 'dpad' ? 'arraste' : 'analógico'}`;
}

/* Lado esquerdo: joystick flutuante (nasce onde o dedo encosta) */
(() => {
  const z = $('#z-mov'), stick = z.querySelector('.stick'), bola = stick.querySelector('i');
  let id = null, ox = 0, oy = 0, dirs = new Set(), analogAtual = [0, 0];
  const R = () => Math.min(64, z.clientWidth * 0.22);

  function analogico(x, y) {
    // envia os quatro sentidos do analógico esquerdo, proporcionais
    const v = [[16, Math.max(0, x)], [17, Math.max(0, -x)], [18, Math.max(0, y)], [19, Math.max(0, -y)]];
    for (const [i, a] of v) press(i, Math.round(a * ANALOG));
    analogAtual = [x, y];
  }
  function atualizar(e) {
    const r = z.getBoundingClientRect();
    let dx = e.clientX - r.left - ox, dy = e.clientY - r.top - oy;
    const raio = R(), d = Math.hypot(dx, dy);
    if (d > raio * 1.6) {                       // a base acompanha o dedo se ele for longe demais
      const k = (d - raio * 1.6) / d; ox += dx * k; oy += dy * k; dx -= dx * k; dy -= dy * k;
      stick.style.left = ox + 'px'; stick.style.top = oy + 'px';
    }
    let x = dx / raio, y = dy / raio; const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    bola.style.transform = `translate(${x * 34}px,${y * 34}px)`;
    const mov = preset ? preset.mov : 'dpad';
    if (mov === 'analog' || mov === 'ambos') {
      const zm = 0.12, mm = Math.hypot(x, y);
      if (mm < zm) analogico(0, 0); else { const k = (mm - zm) / (1 - zm) / mm; analogico(x * k, y * k); }
    }
    if (mov === 'dpad' || mov === 'ambos') {
      const n = dirsDoVetor(x, y, 0.35);
      for (const d of [4, 5, 6, 7]) if (n.has(d) !== dirs.has(d)) n.has(d) ? down(d) : up(d);
      if (n.size && !dirs.size) vib(6);
      dirs = n;
    }
  }
  z.addEventListener('pointerdown', e => {
    if (id !== null) return;
    e.preventDefault(); id = e.pointerId; try { z.setPointerCapture(id); } catch (_) {}
    const r = z.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
    stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; stick.classList.add('on');
    atualizar(e);
  });
  z.addEventListener('pointermove', e => { if (e.pointerId === id) atualizar(e); });
  const fim = e => {
    if (e.pointerId !== id) return;
    id = null; stick.classList.remove('on'); bola.style.transform = '';
    for (const d of dirs) up(d); dirs = new Set();
    if (analogAtual[0] || analogAtual[1]) analogico(0, 0);
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => z.addEventListener(ev, fim));
})();

/* Lado direito: toque, segurar, deslizar e arrastar (câmera) — cada dedo é independente */
(() => {
  const z = $('#z-acao');
  const dedos = new Map();
  const MOVE = 16, SEGURAR_MS = 190, DESLIZE_MS = 320, DESLIZE_PX = 34;

  function onda(x, y, segura) {
    const o = document.createElement('div'); o.className = 'onda' + (segura ? ' segura' : '');
    o.style.left = x + 'px'; o.style.top = y + 'px'; z.appendChild(o); setTimeout(() => o.remove(), 700);
  }
  function camera(x, y) {
    const v = [[20, Math.max(0, x)], [21, Math.max(0, -x)], [22, Math.max(0, y)], [23, Math.max(0, -y)]];
    for (const [i, a] of v) press(i, Math.round(a * ANALOG));
  }
  z.addEventListener('pointerdown', e => {
    e.preventDefault(); try { z.setPointerCapture(e.pointerId); } catch (_) {}
    const r = z.getBoundingClientRect();
    const d = { x0: e.clientX, y0: e.clientY, t0: performance.now(), estado: 'pendente', rx: e.clientX - r.left, ry: e.clientY - r.top };
    d.timer = setTimeout(() => {
      if (d.estado !== 'pendente' || !preset || !preset.segurar) return;
      d.estado = 'segurando'; down(preset.segurar[0]); vib(18); onda(d.rx, d.ry, true);
    }, SEGURAR_MS);
    dedos.set(e.pointerId, d);
  });
  z.addEventListener('pointermove', e => {
    const d = dedos.get(e.pointerId); if (!d || !preset) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (d.estado === 'pendente' && Math.hypot(dx, dy) > MOVE) { clearTimeout(d.timer); d.estado = 'arrasto'; }
    if (d.estado === 'arrasto' && preset.camera) {
      let x = dx / 70, y = dy / 70; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      camera(x, y); d.cam = true;
    }
  });
  const fim = e => {
    const d = dedos.get(e.pointerId); if (!d) return;
    dedos.delete(e.pointerId); clearTimeout(d.timer);
    if (!preset) return;
    const dur = performance.now() - d.t0, dx = e.clientX - d.x0, dy = e.clientY - d.y0, dist = Math.hypot(dx, dy);
    if (d.cam) camera(0, 0);
    if (d.estado === 'pendente' && e.type === 'pointerup') { if (preset.toque) { pulso(preset.toque[0], 90); vib(); onda(d.rx, d.ry); } }
    else if (d.estado === 'segurando') up(preset.segurar[0]);
    else if (d.estado === 'arrasto' && e.type === 'pointerup' && dur < DESLIZE_MS && dist > DESLIZE_PX) {
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy > 0 ? 'baixo' : 'cima');
      const acao = preset.deslizes && preset.deslizes[dir];
      if (acao) { pulso(acao[0], acao[2] || 90); vib(12); onda(d.rx, d.ry); }
    }
  };
  ['pointerup', 'pointercancel'].forEach(ev => z.addEventListener(ev, fim));
})();

/* ================= Início ================= */
(async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  await carregarServidor();
  const pendente = sessionStorage.getItem('pb-abrir');
  if (pendente) {
    sessionStorage.removeItem('pb-abrir');
    const j = await acharJogo(pendente);
    if (j) return jogar(j, false);
  }
  rota();
})();
