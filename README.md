# Div & Conquer Collective

Static homepage for Div & Conquer Collective, deployed with GitHub Pages.

![Div & Conquer Collective homepage screenshot](assets/homepage-screenshot.png)

## Live site

[https://divandconquer.io/](https://divandconquer.io/)

## Project structure

- `index.html` - homepage markup and styles, based on the supplied standalone design.
- `assets/homepage/` - local fonts, portfolio imagery, animation scripts, and showreel.
- `assets/homepage-screenshot.png` - current homepage screenshot used in this README.
- `.nojekyll` - keeps GitHub Pages from running the site through Jekyll.

## Local preview

Open `index.html` directly in a browser, or serve the folder with any static server:

```powershell
npx serve .
```

## Deployment

GitHub Pages is configured to publish from the root of the `main` branch. Any commit pushed to `main` will update the live site after the Pages build completes.

## Homepage media

The October 2026 homepage uses the supplied `Untitled design (15).mp4` reel, encoded as a muted 1080p H.264 MP4 with fast-start metadata for web playback. The previous reel's timestamp skip does not apply to this edit. All design assets are served as local files so browsers can cache them independently.

## Updating the screenshot

After changing the homepage, refresh the screenshot from the repository root:

```powershell
& 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' --headless --disable-gpu --hide-scrollbars --window-size=1440,1100 --screenshot='assets\homepage-screenshot.png' 'https://divandconquer-llc.github.io/DivAndConquer-Website/'
```
