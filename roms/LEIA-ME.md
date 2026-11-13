# Pasta de jogos do servidor

Coloque cada ROM na pasta do console dela. No deploy, o Vercel roda `scripts/gerar-lista.mjs`,
que monta `lista.json` sozinho, e os jogos aparecem na seção **"No servidor"** do app.

| Pasta | Console | Extensões comuns |
|---|---|---|
| nes | NES | .nes |
| snes | Super Nintendo | .smc .sfc |
| n64 | Nintendo 64 | .z64 .n64 .v64 |
| gb | Game Boy / Color | .gb .gbc |
| gba | Game Boy Advance | .gba |
| nds | Nintendo DS | .nds |
| vb | Virtual Boy | .vb |
| segaMS | Master System | .sms |
| segaMD | Mega Drive | .md .gen .smd |
| segaGG | Game Gear | .gg |
| sega32x | Sega 32X | .32x |
| segaCD | Sega CD | .chd .cue/.bin (prefira .chd) |
| segaSaturn | Sega Saturn | .chd |
| psx | PlayStation | .chd .pbp |
| pce | PC Engine | .pce |
| pcfx | PC-FX | .chd |
| ngp | Neo Geo Pocket | .ngp .ngc |
| ws | WonderSwan | .ws .wsc |
| lynx | Atari Lynx | .lnx |
| jaguar | Atari Jaguar | .j64 |
| atari2600 / a5200 / atari7800 | Atari | .a26 .a52 .a78 |
| coleco | ColecoVision | .col |
| 3do | 3DO | .chd .iso |
| arcade | Arcade (FBNeo) | .zip |
| mame2003 | Arcade (MAME 2003) | .zip |

Atenção: o site é público. Coloque aqui só jogos que você pode distribuir
(homebrew, domínio público ou com licença para isso).

## Como adicionar uma ROM sua para todos os aparelhos

1. No GitHub, abra `roms/<console>/` (ex.: `roms/snes/`).
2. **Add file → Upload files**, solte a ROM e clique em **Commit changes**.
3. Em cerca de 1 minuto o Vercel publica de novo e o jogo aparece em todos os aparelhos,
   na galeria do console, com o selo **SERVIDOR**.

Limites do GitHub: pelo site, até **25 MB** por arquivo; por `git push`, até **100 MB**.
ROMs maiores (alguns jogos de N64, PS1 e Saturn) precisam ir pelo terminal ou ser compactadas em .zip.

Os saves de jogos do servidor ficam em cada aparelho (IndexedDB) e entram no backup .zip do app.
