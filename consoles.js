/* =====================================================================
   PixelBoy · tabela de consoles, botões reais de cada controle e gestos
   ---------------------------------------------------------------------
   Índices de entrada (RetroPad do libretro, usados pelo EmulatorJS):
     0 B · 1 Y · 2 SELECT · 3 START · 4 CIMA · 5 BAIXO · 6 ESQ · 7 DIR
     8 A · 9 X · 10 L · 11 R · 12 L2 · 13 R2 · 14 L3 · 15 R3
     16/17 analógico esq. X+/X−  · 18/19 analógico esq. Y+(baixo)/Y−(cima)
     20/21 analógico dir. X+/X−  · 22/23 analógico dir. Y+(baixo)/Y−(cima)

   "botoes" descreve o controle ORIGINAL de cada console, já convertido para
   o RetroPad conforme o núcleo (core) que o EmulatorJS usa:
     mov      'dpad' = direcional · 'analog' = analógico principal (N64)
     face     botões de ação. A ordem define o desenho:
              1 botão  · 2 = [de baixo/esq., de cima/dir.] · 3 = da esq. p/ dir.
              4 = [cima, esq., dir., baixo] (losango) · 6 = [linha de cima ×3, linha de baixo ×3]
     ombros   gatilhos/ombros, da esquerda para a direita
     sistema  START, SELECT, MODE, FICHA, PAUSE…
     extras   'cbotoes' (botões C do N64) · 'analogicos' (2 analógicos do PS1) · 'dpadMini' (direcional extra do N64)

   Mapeamentos (documentação dos núcleos libretro):
     NES fceumm ............. A=A · B=B
     SNES snes9x ............ A B X Y L R iguais
     N64 mupen64plus_next ... A=B(0) · B=Y(1) · Z=L2(12) · C = analógico direito
     GB gambatte / GBA mgba . A=A · B=B (+ L R no GBA)
     DS melonDS ............. A B X Y L R iguais (toque na tela do jogo)
     Master System / GG ..... botão 1=B(0) · botão 2=A(8)
     Mega Drive/32X/CD ...... A=Y(1) · B=B(0) · C=A(8) · X=L(10) · Y=X(9) · Z=R(11) · MODE=SELECT
     Saturn yabause ......... A=B(0) · B=A(8) · C=R2(13) · X=Y(1) · Y=X(9) · Z=L2(12)
     PlayStation pcsx ....... Cruz=B(0) · Círculo=A(8) · Quadrado=Y(1) · Triângulo=X(9) · L1 R1 L2 R2 L3 R3
     PC Engine .............. I=A(8) · II=B(0) · RUN=START
     PC-FX .................. I=A · II=B · III=Y · IV=X · V=L · VI=R
     Neo Geo Pocket ......... A=B(0) · B=A(8) · OPTION=START
     Lynx ................... A · B · OPTION 1=L · OPTION 2=R · PAUSE=START
     Jaguar ................. A=Y(1) · B=B(0) · C=A(8) · OPTION=SELECT · PAUSE=START
     Atari 2600 stella ...... FOGO=B · dificuldade E/D = L/R · SELECT · RESET=START
     3DO opera .............. A=B(0) · B=A(8) · C=Y(1) · X(stop)=SELECT · P(play)=START
     Fliperama FBNeo/MAME ... botões 1-6 = B A Y X L R · FICHA=SELECT

   Modo celular (gestos):
     toque / segurar / deslizes (cima, baixo, esq, dir) no lado direito, camera = arrastar.
     Todos os botões do controle que não viraram gesto aparecem como botões pequenos,
     então nenhum botão do console fica de fora.
   Raciocínio por tipo de jogo:
   • Plataforma 2D: pular é o mais usado → TOQUE; correr/atirar fica segurado → SEGURAR;
     pulo alto = segurar o pulo por mais tempo → DESLIZE ↑.
   • 3D (N64, PS1): mover com intensidade → ANALÓGICO; olhar em volta → ARRASTAR (câmera).
   • Luta/fliperama: soco e chute principais em toque e deslizes, o resto em botões.
   • Atari e similares: um botão de tiro → TOQUE e SEGURAR (tiro contínuo).
   ===================================================================== */

const S = { ss: [['SELECT', 2], ['START', 3]], st: [['START', 3]], lr: [['L', 10], ['R', 11]] };
const SEGA6 = { mov: 'dpad', face: [['X', 10], ['Y', 9], ['Z', 11], ['A', 1], ['B', 0], ['C', 8]], ombros: [], sistema: [['MODE', 2], ['START', 3]] };
const ARC6  = { mov: 'dpad', face: [['1', 0], ['2', 8], ['3', 1], ['4', 9], ['5', 10], ['6', 11]], ombros: [], sistema: [['FICHA', 2], ['START', 3]] };

const G = {
  ab:    { mov: 'dpad', toque: [8, 'A · pular / confirmar'], segurar: [0, 'B · correr / atirar'],
           deslizes: { cima: [8, 'Pulo alto (A longo)', 380], esq: [0, 'B · ataque rápido'], dir: [0, 'B · ataque rápido'] } },
  snes:  { mov: 'dpad', toque: [0, 'B · pular'], segurar: [1, 'Y · correr / atacar'],
           deslizes: { cima: [0, 'Pulo alto (B longo)', 380], dir: [8, 'A · ação'], esq: [1, 'Y · ataque'], baixo: [9, 'X · item / menu'] } },
  sega:  { mov: 'dpad', toque: [0, 'B · pular'], segurar: [1, 'A · atacar / correr'],
           deslizes: { cima: [0, 'Pulo alto', 380], dir: [8, 'C · especial'], esq: [1, 'A · ataque'] } },
  sms:   { mov: 'dpad', toque: [8, 'Botão 2 · pular'], segurar: [0, 'Botão 1 · atacar'],
           deslizes: { cima: [8, 'Pulo alto', 380], esq: [0, 'Botão 1'], dir: [0, 'Botão 1'] } },
  n64:   { mov: 'analog', toque: [0, 'A · pular'], segurar: [12, 'Z · agachar / mirar'], camera: true,
           deslizes: { esq: [1, 'B · atacar'], dir: [1, 'B · atacar'], baixo: [12, 'Z'], cima: [0, 'Pulo alto (A longo)', 380] } },
  psx:   { mov: 'ambos', toque: [0, 'Cruz · pular / confirmar'], segurar: [1, 'Quadrado · atacar / correr'], camera: true,
           deslizes: { dir: [8, 'Círculo · voltar / ação'], cima: [9, 'Triângulo · menu / especial'], esq: [1, 'Quadrado · ataque'] } },
  nds:   { mov: 'dpad', toque: [8, 'A · ação'], segurar: [0, 'B · correr / voltar'], tela: false,
           deslizes: { esq: [0, 'B'], cima: [9, 'X · menu'], baixo: [1, 'Y'] } },
  saturn:{ mov: 'dpad', toque: [0, 'A · pular / ação'], segurar: [8, 'B · ataque'],
           deslizes: { dir: [13, 'C'], esq: [1, 'X'], cima: [9, 'Y'], baixo: [12, 'Z'] } },
  arcade:{ mov: 'dpad', toque: [0, 'Botão 1'], segurar: [0, 'Botão 1 (contínuo)'],
           deslizes: { dir: [8, 'Botão 2'], esq: [1, 'Botão 3'], cima: [9, 'Botão 4'], baixo: [10, 'Botão 5'] } },
  tiro:  { mov: 'dpad', toque: [0, 'Tiro'], segurar: [0, 'Tiro contínuo'], deslizes: {} },
};
const comDeslize = (g, d) => ({ ...g, deslizes: { ...g.deslizes, ...d } });

const CONSOLES = {
  nes:        { nome: 'NES', sigla: 'NES', cor: '#c0392b', ext: ['nes','fds','unf','unif'],
                botoes: { mov: 'dpad', face: [['B', 0], ['A', 8]], ombros: [], sistema: S.ss }, gestos: G.ab },
  snes:       { nome: 'Super Nintendo', sigla: 'SNES', cor: '#6c4bd1', ext: ['smc','sfc','fig','swc','bs','st'],
                botoes: { mov: 'dpad', face: [['X', 9], ['Y', 1], ['A', 8], ['B', 0]], ombros: S.lr, sistema: S.ss }, gestos: G.snes },
  n64:        { nome: 'Nintendo 64', sigla: 'N64', cor: '#1f8a4c', ext: ['z64','n64','v64'], auto3d: true,
                botoes: { mov: 'analog', face: [['B', 1], ['A', 0]], ombros: [['L', 10], ['Z', 12], ['R', 11]], sistema: S.st, extras: ['cbotoes', 'dpadMini'] }, gestos: G.n64 },
  gb:         { nome: 'Game Boy / Color', sigla: 'GB', cor: '#7a8b2b', ext: ['gb','gbc','dmg','cgb','sgb'],
                botoes: { mov: 'dpad', face: [['B', 0], ['A', 8]], ombros: [], sistema: S.ss }, gestos: G.ab },
  gba:        { nome: 'Game Boy Advance', sigla: 'GBA', cor: '#4b3fa8', ext: ['gba','agb'],
                botoes: { mov: 'dpad', face: [['B', 0], ['A', 8]], ombros: S.lr, sistema: S.ss }, gestos: G.ab },
  nds:        { nome: 'Nintendo DS', sigla: 'DS', cor: '#5d6d7e', ext: ['nds'],
                botoes: { mov: 'dpad', face: [['X', 9], ['Y', 1], ['A', 8], ['B', 0]], ombros: S.lr, sistema: S.ss }, gestos: G.nds },
  vb:         { nome: 'Virtual Boy', sigla: 'VB', cor: '#b03030', ext: ['vb','vboy'],
                botoes: { mov: 'dpad', face: [['B', 0], ['A', 8]], ombros: S.lr, sistema: S.ss }, gestos: G.ab },
  segaMS:     { nome: 'Master System', sigla: 'SMS', cor: '#2c3e50', ext: ['sms'],
                botoes: { mov: 'dpad', face: [['1', 0], ['2', 8]], ombros: [], sistema: [['PAUSE', 3]] }, gestos: G.sms },
  segaMD:     { nome: 'Mega Drive', sigla: 'MD', cor: '#1b1b1b', ext: ['md','gen','smd','sg'], botoes: SEGA6,
                gestos: comDeslize(G.sega, { baixo: [11, 'Z'] }) },
  segaGG:     { nome: 'Game Gear', sigla: 'GG', cor: '#34495e', ext: ['gg'],
                botoes: { mov: 'dpad', face: [['1', 0], ['2', 8]], ombros: [], sistema: S.st }, gestos: G.sms },
  sega32x:    { nome: 'Sega 32X', sigla: '32X', cor: '#8e1b1b', ext: ['32x'], botoes: SEGA6, gestos: comDeslize(G.sega, { baixo: [11, 'Z'] }) },
  segaCD:     { nome: 'Sega CD', sigla: 'SCD', cor: '#2e4053', ext: [], botoes: SEGA6, gestos: comDeslize(G.sega, { baixo: [11, 'Z'] }) },
  segaSaturn: { nome: 'Sega Saturn', sigla: 'SAT', cor: '#3d3d3d', ext: [],
                botoes: { mov: 'dpad', face: [['X', 1], ['Y', 9], ['Z', 12], ['A', 0], ['B', 8], ['C', 13]], ombros: S.lr, sistema: S.st }, gestos: G.saturn },
  psx:        { nome: 'PlayStation', sigla: 'PS1', cor: '#7f8c8d', ext: ['pbp'], auto3d: true,
                botoes: { mov: 'dpad', face: [['ic:triangle', 9], ['ic:square', 1], ['ic:circle', 8], ['ic:x', 0]], ombros: [['L1', 10], ['L2', 12], ['R2', 13], ['R1', 11]],
                          sistema: [['SELECT', 2], ['START', 3], ['L3', 14], ['R3', 15]], extras: ['analogicos'] }, gestos: G.psx },
  pce:        { nome: 'PC Engine', sigla: 'PCE', cor: '#d35400', ext: ['pce','sgx'],
                botoes: { mov: 'dpad', face: [['II', 0], ['I', 8]], ombros: [], sistema: [['SELECT', 2], ['RUN', 3]] },
                gestos: { ...G.ab, toque: [8, 'I · pular'], segurar: [0, 'II · atacar'], deslizes: { cima: [8, 'Pulo alto', 380], esq: [0, 'II'], dir: [0, 'II'] } } },
  pcfx:       { nome: 'PC-FX', sigla: 'PCFX', cor: '#a04000', ext: [],
                botoes: { mov: 'dpad', face: [['IV', 9], ['V', 10], ['VI', 11], ['III', 1], ['II', 0], ['I', 8]], ombros: [], sistema: [['SELECT', 2], ['RUN', 3]] },
                gestos: { mov: 'dpad', toque: [8, 'I'], segurar: [0, 'II'], deslizes: { dir: [1, 'III'], esq: [9, 'IV'], cima: [10, 'V'], baixo: [11, 'VI'] } } },
  ngp:        { nome: 'Neo Geo Pocket', sigla: 'NGP', cor: '#16a085', ext: ['ngp','ngc'],
                botoes: { mov: 'dpad', face: [['B', 8], ['A', 0]], ombros: [], sistema: [['OPTION', 3]] },
                gestos: { mov: 'dpad', toque: [0, 'A · pular / confirmar'], segurar: [8, 'B · atacar'], deslizes: { cima: [0, 'Pulo alto', 380], esq: [8, 'B'], dir: [8, 'B'] } } },
  ws:         { nome: 'WonderSwan', sigla: 'WS', cor: '#2980b9', ext: ['ws','wsc'],
                botoes: { mov: 'dpad', face: [['B', 0], ['A', 8]], ombros: [], sistema: S.st }, gestos: G.ab },
  lynx:       { nome: 'Atari Lynx', sigla: 'LYNX', cor: '#e67e22', ext: ['lnx'],
                botoes: { mov: 'dpad', face: [['B', 0], ['A', 8]], ombros: [['OPT 1', 10], ['OPT 2', 11]], sistema: [['PAUSE', 3]] }, gestos: G.ab },
  jaguar:     { nome: 'Atari Jaguar', sigla: 'JAG', cor: '#922b21', ext: ['j64','jag'],
                botoes: { mov: 'dpad', face: [['A', 1], ['B', 0], ['C', 8]], ombros: [], sistema: [['OPTION', 2], ['PAUSE', 3]] },
                gestos: { mov: 'dpad', toque: [0, 'B · ação'], segurar: [1, 'A · segurar'], deslizes: { dir: [8, 'C'], esq: [1, 'A'] } } },
  atari2600:  { nome: 'Atari 2600', sigla: '2600', cor: '#795548', ext: ['a26'],
                botoes: { mov: 'dpad', face: [['FOGO', 0]], ombros: [['DIF. E', 10], ['DIF. D', 11]], sistema: [['SELECT', 2], ['RESET', 3]] }, gestos: G.tiro },
  a5200:      { nome: 'Atari 5200', sigla: '5200', cor: '#5d4037', ext: ['a52'],
                botoes: { mov: 'dpad', face: [['2', 8], ['1', 0]], ombros: [], sistema: [['PAUSE', 2], ['START', 3]] },
                gestos: { ...G.tiro, deslizes: { dir: [8, 'Botão 2'], esq: [8, 'Botão 2'] } } },
  atari7800:  { nome: 'Atari 7800', sigla: '7800', cor: '#4e342e', ext: ['a78'],
                botoes: { mov: 'dpad', face: [['2', 8], ['1', 0]], ombros: [['DIF. E', 10], ['DIF. D', 11]], sistema: [['SELECT', 2], ['PAUSE', 3]] },
                gestos: { ...G.tiro, deslizes: { dir: [8, 'Botão 2'], esq: [8, 'Botão 2'] } } },
  coleco:     { nome: 'ColecoVision', sigla: 'CV', cor: '#37474f', ext: ['col'],
                botoes: { mov: 'dpad', face: [['DIR.', 8], ['ESQ.', 0]], ombros: [], sistema: S.ss },
                gestos: { ...G.tiro, deslizes: { dir: [8, 'Botão direito'], esq: [8, 'Botão direito'] } } },
  '3do':      { nome: '3DO', sigla: '3DO', cor: '#1a5276', ext: [],
                botoes: { mov: 'dpad', face: [['A', 0], ['B', 8], ['C', 1]], ombros: S.lr, sistema: [['X · STOP', 2], ['P · PLAY', 3]] },
                gestos: { mov: 'dpad', toque: [0, 'A'], segurar: [8, 'B'], deslizes: { dir: [1, 'C'], esq: [8, 'B'] } } },
  arcade:     { nome: 'Arcade (FBNeo)', sigla: 'ARC', cor: '#b7950b', ext: [], botoes: ARC6, gestos: G.arcade },
  mame2003:   { nome: 'Arcade (MAME)', sigla: 'MAME', cor: '#9a7d0a', ext: [], botoes: ARC6, gestos: G.arcade },
};

/* Lista completa de botões de um console: [rótulo, índice] (ombros, ação, sistema) */
function todosBotoes(c) {
  const b = CONSOLES[c].botoes;
  return [...b.ombros, ...b.face, ...b.sistema];
}
/* No modo celular: botões que não viraram gesto viram botões pequenos */
function extrasGestos(c) {
  const g = CONSOLES[c].gestos, usados = new Set();
  if (g.toque) usados.add(g.toque[0]);
  if (g.segurar) usados.add(g.segurar[0]);
  // os deslizes são atalhos; o botão continua disponível se não for o toque/segurar
  return todosBotoes(c).filter(([, i]) => !usados.has(i));
}
