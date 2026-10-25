# Andrew Matthew Uy · Industrial Design Portfolio

Static Astro site rebuilt from the Canva design "drew's portfolio". Run `npm install`, then `npm run dev` (local site), `npm test` (unit tests), `npm run test:e2e` (browser tests) or `npm run build`. All text lives in `src/content/` and all images in `src/assets/images/`; edit them in code or through Pages CMS (`.pages.yml`), which commits to the same files, so always `git pull` before editing.

## Fonts

Canva font references in `design/canva/*.json` map to web fonts. Futura PT comes from Drew's Adobe Fonts web project `ruh1bpa` (League Spartan is the fallback); the rest are self-hosted through Fontsource:

| Canva font ref | Used for | Web font |
| --- | --- | --- |
| `YAFcfgcNhWk` | Headlines, labels, most body text | Futura PT (Adobe Fonts), League Spartan fallback |
| `YAFcf7zkXN0`, `YAFanRK9Tic` | "MY DESIGN PROCESS", project names, team heading | Arimo (Helvetica/Arial metrics) |
| `YAFdtQi73Xs` | CV details on the home page | Montserrat (variable) |
| `YAFancOAWqc` | Two giant decorative glyphs ("!!", "3") | Arimo Bold (closest match) |

## Checking against Canva

With the site running (`npm run dev`), `node scripts/compare.mjs pipboy 2` writes `compare/pipboy.png` (the site at 50 % over the Canva export) and `compare/pipboy-side.png`. The Canva exports live in `canva-export/` (not committed); the text-free copy used for images is the Canva design `DAHY7vYzgg8`.

## Editing in Pages CMS

[Pages CMS](https://app.pagescms.org/voiditive/portfolio/launch) edits `src/content/` through `.pages.yml`: text, images, alt text, titles and page order. Every save is a commit, so pull before working locally. Layout (positions and type styles) is hidden in the editor; it comes from Canva.

## Hosting

Cloudflare Workers serves the static build (`wrangler.jsonc`, assets from `dist/`, `404.html` for unknown addresses). Every push to `launch` (the production branch until launch) builds with `npm run build` and deploys with `npx wrangler deploy`; other branches get preview addresses. Node is pinned in `.node-version`.
