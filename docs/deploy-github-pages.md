# GitHub Pages Deploy

The app is configured for the repository Pages path:

https://topicit.github.io/first-tackle/

Vite uses `base: '/first-tackle/'`, so assets resolve correctly from GitHub Pages and local development still works through Vite.

## Enable Pages

1. Open the GitHub repo: `TopicIt/first-tackle`.
2. Go to Settings.
3. Open Pages.
4. Set Source to GitHub Actions.
5. Open the Actions tab and run or wait for `Deploy to GitHub Pages`.
6. Visit https://topicit.github.io/first-tackle/

## Asset Paths

Place optional location images here:

- `public/assets/locations/grandma-house.webp`
- `public/assets/locations/fishing-canal.webp`

Place optional transition videos here:

- `public/assets/transitions/grandma-house/grandma-house-flyin.webm`
- `public/assets/transitions/grandma-house/grandma-house-flyin.mp4`
- `public/assets/transitions/fishing-canal/fishing-canal-flyin.webm`
- `public/assets/transitions/fishing-canal/fishing-canal-flyin.mp4`

Videos are referenced from `public/` by URL and are not bundled into JavaScript.
