# GitHub Pages Deploy

The app is configured for the repository Pages path:

https://topicit.github.io/first-tackle/

Vite uses `base: '/first-tackle/'`, so assets resolve correctly from GitHub Pages and local development still works through Vite.

## Enable Pages

1. Open the GitHub repo: `TopicIt/first-tackle`.
2. Go to Settings.
3. Open Pages.
4. Set Source to GitHub Actions.
5. Open the Actions tab.
6. Run or confirm `Deploy to GitHub Pages` on `codex/first-tackle-mobile`.
7. Wait for the deploy job to finish successfully.
8. Visit https://topicit.github.io/first-tackle/
9. Open Settings in the game and check Build info:
   - Branch should be `codex/first-tackle-mobile`.
   - Commit should match the latest short commit hash.
   - Build time should show the latest UTC deploy timestamp.

If a phone still shows the old game, hard refresh the page or clear site data for `topicit.github.io` in the mobile browser. On iOS Safari, close the tab, clear website data for GitHub Pages, and open the URL again. On Android Chrome, use Site settings -> Clear data, then reload.

GitHub Pages Source is a repository setting. Code can provide the workflow, but Pages may still need to be manually set to GitHub Actions once in Settings -> Pages.

## Asset Paths

Place optional location images here:

- `public/assets/locations/grandma-house.webp`
- `public/assets/locations/fishing-canal.webp`
- `public/assets/locations/kanava-alt.png`
- `public/assets/locations/shliuz.png`
- `public/assets/locations/stavky-pozhara.png`
- `public/assets/locations/gryada.png`
- `public/assets/locations/ozero-tur.png`
- `public/assets/locations/hirnytske-ozero.png`

Place optional fish images here:

- `public/assets/fish/okun.png`
- `public/assets/fish/lynok.png`
- `public/assets/fish/som.png`
- `public/assets/fish/sudak.png`

Place optional transition videos here:

- `public/assets/transitions/grandma-house/grandma-house-flyin.webm`
- `public/assets/transitions/grandma-house/grandma-house-flyin.mp4`
- `public/assets/transitions/grandma-house/grandma-house-flyin-2.mp4`
- `public/assets/transitions/fishing-canal/fishing-canal-flyin.webm`
- `public/assets/transitions/fishing-canal/fishing-canal-flyin.mp4`

Videos are referenced from `public/` by URL and are not bundled into JavaScript.
