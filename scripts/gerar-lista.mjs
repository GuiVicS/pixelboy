// Gera roms/lista.json a partir das pastas roms/<console>/ — roda no build do Vercel.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = 'roms';
const IGNORAR = new Set(['.gitkeep', '.DS_Store', 'LEIA-ME.md', 'lista.json']);
const lista = [];

for (const console of readdirSync(RAIZ)) {
  const pasta = join(RAIZ, console);
  if (!statSync(pasta).isDirectory()) continue;
  for (const arquivo of readdirSync(pasta).sort()) {
    if (IGNORAR.has(arquivo) || arquivo.startsWith('.')) continue;
    if (!statSync(join(pasta, arquivo)).isFile()) continue;
    lista.push({ arquivo: `${console}/${arquivo}`, nome: arquivo.replace(/\.[^.]+$/, ''), console });
  }
}

writeFileSync(join(RAIZ, 'lista.json'), JSON.stringify(lista, null, 2) + '\n');
console.log(`roms/lista.json: ${lista.length} jogo(s)`);
