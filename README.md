# PixelBoy

Emulador de SNES, NES e Nintendo 64 que roda no navegador, usando o processamento do próprio aparelho
(EmulatorJS + núcleos libretro em WebAssembly).

- **Vertical:** visual de console portátil — tela em cima, controles e menu embaixo.
- **Horizontal:** jogo em tela cheia com os controles virtuais do EmulatorJS sobre a imagem.
- **PWA:** dá para instalar na tela inicial; funciona offline depois do primeiro uso.
- **IndexedDB:** jogos adicionados e saves (SRAM + estados) ficam guardados no aparelho.
- **Backup:** botão para exportar tudo num `.zip` e importar de volta.

## Estrutura

```
index.html            app completo
manifest.webmanifest  manifesto do PWA
sw.js                 service worker (cache offline)
icons/                ícones do app
roms/                 jogos servidos pelo site (ver roms/LEIA-ME.md)
```

Site estático: não precisa de build. Publicado no Vercel.

## Modo celular (gestos)

Em **⚙ Configurações** escolha *Automático*, *Modo celular (gestos)* ou *Botões clássicos*.
No modo celular o lado esquerdo vira um analógico/direcional flutuante e o lado direito
reconhece **toque**, **segurar**, **deslizar** (↑ ↓ ← →) e, nos consoles 3D, **arrastar = câmera**.
O mapeamento de cada console, com o raciocínio por tipo de jogo, está em `consoles.js`.

## Adicionar jogos

O botão **＋ Adicionar** aceita várias ROMs de uma vez, um `.zip` com uma ROM, um **pack .zip**
com várias ROMs (cada uma vai para o console certo) ou um backup exportado pelo próprio app.
