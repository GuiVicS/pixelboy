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
