/* =====================================================================
   PixelBoy · tabela de consoles e estudo de controles
   ---------------------------------------------------------------------
   Índices de entrada (RetroPad do libretro, usados pelo EmulatorJS):
     0 B · 1 Y · 2 SELECT · 3 START · 4 CIMA · 5 BAIXO · 6 ESQ · 7 DIR
     8 A · 9 X · 10 L · 11 R · 12 L2 · 13 R2
     16/17 analógico esq. X+/X−  · 18/19 analógico esq. Y+(baixo)/Y−(cima)
     20/21 analógico dir. X+/X−  · 22/23 analógico dir. Y+(baixo)/Y−(cima)

   Modo celular (gestos) — como ler cada preset:
     mov       'dpad' = direcional digital · 'analog' = analógico · 'ambos'
     toque     toque rápido no lado direito          [índice, rótulo]
     segurar   segurar parado no lado direito        [índice, rótulo]
     deslizes  deslizar rápido ↑ ↓ ← → no lado direito [índice, rótulo, ms]
     camera    arrastar devagar no lado direito move o analógico direito
     extras    botões pequenos na tela               [rótulo, índice]
     tela      false = não cobrir a tela do jogo (ex.: DS, que usa toque)

   Raciocínio por tipo de jogo:
   • Plataforma 2D (NES, SNES, GB, Mega Drive…): o botão mais usado é o de
     pular → vira TOQUE. Correr/atirar costuma ficar segurado → vira
     SEGURAR. Pulo alto = segurar o botão de pulo por mais tempo → DESLIZE ↑.
   • 3D (N64, PS1): andar precisa de intensidade → ANALÓGICO no lado
     esquerdo; olhar em volta → ARRASTAR no lado direito (câmera).
     Ataque, pulo e mira continuam como toque / deslize / segurar.
   • Fliperama e Atari: quase tudo é um botão de tiro → TOQUE e SEGURAR
     no mesmo botão (tiro contínuo), extras para FICHA/START.
   ===================================================================== */

const P = {
  // Plataforma 2D com A = pular e B = correr/atirar (NES, Game Boy…)
  ab: {
    mov: 'dpad',
    toque: [8, 'A · pular / confirmar'],
    segurar: [0, 'B · correr / atirar'],
    deslizes: { cima: [8, 'Pulo alto (A longo)', 380], esq: [0, 'B · ataque rápido'], dir: [0, 'B · ataque rápido'] },
  },
  // SNES: B pula, Y corre/ataca, A e X são ações extras
  snes: {
    mov: 'dpad',
    toque: [0, 'B · pular'],
    segurar: [1, 'Y · correr / atacar'],
    deslizes: { cima: [0, 'Pulo alto (B longo)', 380], dir: [8, 'A · ação'], esq: [1, 'Y · ataque'], baixo: [9, 'X · item / menu'] },
  },
  // Sega 3 botões: B costuma pular, A atacar, C especial
  sega3: {
    mov: 'dpad',
    toque: [0, 'B · pular'],
    segurar: [1, 'A · atacar / correr'],
    deslizes: { cima: [0, 'Pulo alto', 380], dir: [8, 'C · especial'], esq: [1, 'A · ataque'] },
  },
  // Master System / Game Gear: botão 2 pula, botão 1 ataca
  sms: {
    mov: 'dpad',
    toque: [8, 'Botão 2 · pular'],
    segurar: [0, 'Botão 1 · atacar'],
    deslizes: { cima: [8, 'Pulo alto', 380], esq: [0, 'Botão 1'] },
  },
  // Nintendo 64: tudo 3D
  n64: {
    mov: 'analog',
    toque: [0, 'A · pular'],
    segurar: [12, 'Z · agachar / mirar'],
    deslizes: { esq: [1, 'B · atacar'], dir: [1, 'B · atacar'], baixo: [12, 'Z'], cima: [0, 'Pulo alto (A longo)', 380] },
    camera: true,
  },
  // PlayStation: analógico + direcional ao mesmo tempo (jogos antigos só leem o direcional)
  psx: {
    mov: 'ambos',
    toque: [0, '✕ · pular / confirmar'],
    segurar: [1, '□ · atacar / correr'],
    deslizes: { dir: [8, '◯ · voltar / ação'], cima: [9, '△ · menu / especial'], esq: [1, '□ · ataque'] },
    camera: true,
  },
  // Nintendo DS: o toque na tela é do jogo, então os gestos ficam fora dela
  nds: {
    mov: 'dpad',
    toque: [8, 'A · ação'],
    segurar: [0, 'B · correr / voltar'],
    deslizes: { esq: [0, 'B'], cima: [9, 'X · menu'], baixo: [1, 'Y'] },
    tela: false,
  },
  // Fliperama: botão 1 é o principal
  arcade: {
    mov: 'dpad',
    toque: [0, 'Botão 1'],
    segurar: [0, 'Botão 1 (contínuo)'],
    deslizes: { dir: [8, 'Botão 2'], esq: [1, 'Botão 3'], cima: [9, 'Botão 4'] },
  },
  // Atari e consoles de 1 botão de tiro
  tiro: {
    mov: 'dpad',
    toque: [0, 'Tiro'],
    segurar: [0, 'Tiro contínuo'],
    deslizes: { dir: [8, 'Botão 2'], esq: [8, 'Botão 2'] },
  },
  // Genérico de 6 botões (Saturn, 3DO, PC-FX, Jaguar)
  seis: {
    mov: 'dpad',
    toque: [0, 'B · ação principal'],
    segurar: [1, 'Y · segurar'],
    deslizes: { dir: [8, 'A'], esq: [1, 'Y'], cima: [9, 'X'], baixo: [10, 'L'] },
  },
};

const E = {
  ss: [['SELECT', 2], ['START', 3]],
  st: [['START', 3]],
  lr: [['L', 10], ['R', 11]],
};

/* layout: botões do modo clássico no vertical — '4' (D-pad+ABXY+L/R), '2' (A/B), '2lr' (A/B+L/R), 'n64'
   auto3d: no modo "Automático" já começa com gestos */
const CONSOLES = {
  nes:        { nome: 'NES',              sigla: 'NES',  cor: '#c0392b', ext: ['nes','fds','unf','unif'], layout: '2',   gestos: { ...P.ab, extras: E.ss } },
  snes:       { nome: 'Super Nintendo',   sigla: 'SNES', cor: '#6c4bd1', ext: ['smc','sfc','fig','swc','bs','st'], layout: '4', gestos: { ...P.snes, extras: [...E.lr, ...E.ss] } },
  n64:        { nome: 'Nintendo 64',      sigla: 'N64',  cor: '#1f8a4c', ext: ['z64','n64','v64'], layout: 'n64', auto3d: true, gestos: { ...P.n64, extras: [['R', 11], ['L', 10], ['START', 3]] } },
  gb:         { nome: 'Game Boy / Color', sigla: 'GB',   cor: '#7a8b2b', ext: ['gb','gbc','dmg','cgb','sgb'], layout: '2', gestos: { ...P.ab, extras: E.ss } },
  gba:        { nome: 'Game Boy Advance', sigla: 'GBA',  cor: '#4b3fa8', ext: ['gba','agb'], layout: '2lr', gestos: { ...P.ab, extras: [...E.lr, ...E.ss] } },
  nds:        { nome: 'Nintendo DS',      sigla: 'DS',   cor: '#5d6d7e', ext: ['nds'], layout: '4', gestos: { ...P.nds, extras: [...E.lr, ...E.ss] } },
  vb:         { nome: 'Virtual Boy',      sigla: 'VB',   cor: '#b03030', ext: ['vb','vboy'], layout: '2lr', gestos: { ...P.ab, extras: [...E.lr, ...E.ss] } },
  segaMS:     { nome: 'Master System',    sigla: 'SMS',  cor: '#2c3e50', ext: ['sms'], layout: '2', gestos: { ...P.sms, extras: [['PAUSE', 3]] } },
  segaMD:     { nome: 'Mega Drive',       sigla: 'MD',   cor: '#1b1b1b', ext: ['md','gen','smd','sg'], layout: '4', gestos: { ...P.sega3, extras: [['MODE', 2], ['START', 3]] } },
  segaGG:     { nome: 'Game Gear',        sigla: 'GG',   cor: '#34495e', ext: ['gg'], layout: '2', gestos: { ...P.sms, extras: E.st } },
  sega32x:    { nome: 'Sega 32X',         sigla: '32X',  cor: '#8e1b1b', ext: ['32x'], layout: '4', gestos: { ...P.sega3, extras: [['MODE', 2], ['START', 3]] } },
  segaCD:     { nome: 'Sega CD',          sigla: 'SCD',  cor: '#2e4053', ext: [], layout: '4', gestos: { ...P.sega3, extras: [['MODE', 2], ['START', 3]] } },
  segaSaturn: { nome: 'Sega Saturn',      sigla: 'SAT',  cor: '#3d3d3d', ext: [], layout: '4', gestos: { ...P.seis, extras: [...E.lr, ...E.st] } },
  psx:        { nome: 'PlayStation',      sigla: 'PS1',  cor: '#7f8c8d', ext: ['pbp'], layout: '4', auto3d: true, gestos: { ...P.psx, extras: [['L1', 10], ['R1', 11], ['L2', 12], ['R2', 13], ['SELECT', 2], ['START', 3]] } },
  pce:        { nome: 'PC Engine',        sigla: 'PCE',  cor: '#d35400', ext: ['pce','sgx'], layout: '2', gestos: { ...P.ab, toque: [8, 'I · pular'], segurar: [0, 'II · atacar'], extras: [['SELECT', 2], ['RUN', 3]] } },
  pcfx:       { nome: 'PC-FX',            sigla: 'PCFX', cor: '#a04000', ext: [], layout: '4', gestos: { ...P.seis, extras: [...E.lr, ...E.ss] } },
  ngp:        { nome: 'Neo Geo Pocket',   sigla: 'NGP',  cor: '#16a085', ext: ['ngp','ngc'], layout: '2', gestos: { ...P.ab, extras: [['OPTION', 3]] } },
  ws:         { nome: 'WonderSwan',       sigla: 'WS',   cor: '#2980b9', ext: ['ws','wsc'], layout: '2', gestos: { ...P.ab, extras: E.st } },
  lynx:       { nome: 'Atari Lynx',       sigla: 'LYNX', cor: '#e67e22', ext: ['lnx'], layout: '2', gestos: { ...P.ab, extras: [['PAUSE', 3]] } },
  jaguar:     { nome: 'Atari Jaguar',     sigla: 'JAG',  cor: '#922b21', ext: ['j64','jag'], layout: '4', gestos: { ...P.seis, extras: [['OPTION', 2], ['PAUSE', 3]] } },
  atari2600:  { nome: 'Atari 2600',       sigla: '2600', cor: '#795548', ext: ['a26'], layout: '2', gestos: { ...P.tiro, extras: [['SELECT', 2], ['RESET', 3]] } },
  a5200:      { nome: 'Atari 5200',       sigla: '5200', cor: '#5d4037', ext: ['a52'], layout: '2', gestos: { ...P.tiro, extras: E.st } },
  atari7800:  { nome: 'Atari 7800',       sigla: '7800', cor: '#4e342e', ext: ['a78'], layout: '2', gestos: { ...P.tiro, extras: [['SELECT', 2], ['PAUSE', 3]] } },
  coleco:     { nome: 'ColecoVision',     sigla: 'CV',   cor: '#37474f', ext: ['col'], layout: '2', gestos: { ...P.tiro, extras: E.st } },
  '3do':      { nome: '3DO',              sigla: '3DO',  cor: '#1a5276', ext: [], layout: '4', gestos: { ...P.seis, extras: [...E.lr, ...E.st] } },
  arcade:     { nome: 'Arcade (FBNeo)',   sigla: 'ARC',  cor: '#b7950b', ext: [], layout: '4', gestos: { ...P.arcade, extras: [['FICHA', 2], ['START', 3], ['5', 10], ['6', 11]] } },
  mame2003:   { nome: 'Arcade (MAME)',    sigla: 'MAME', cor: '#9a7d0a', ext: [], layout: '4', gestos: { ...P.arcade, extras: [['FICHA', 2], ['START', 3], ['5', 10], ['6', 11]] } },
};
