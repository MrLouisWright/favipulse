# Progress & Badges

## Badges

```js
fav.badge(3);          // number
fav.badge(120);        // shows 99+
fav.badge('new');      // up to 3 characters
fav.badge(0);          // hides (so do null and '')
fav.badge(1, { badgeBg: '#16a34a', badgeFg: '#fff' });
```

Badges sit top-right on a pill that grows with the text. Text is escaped, so user data can't inject markup.

## Progress ring

```js
fav.progress(0.25);   // 0-1
fav.progress(75);     // values above 1 are treated as percentages
fav.progress(null);   // hide
```

The ring runs clockwise from 12 o'clock around the tile with a faint track behind it. Colour defaults to the icon foreground; set `ringColor` to change it.

### Recipes

**Upload**
```js
xhr.upload.onprogress = (e) => fav.progress(e.loaded / e.total);
xhr.onloadend = () => fav.progress(null);
```

**fetch with streams**
```js
const res = await fetch(url), total = +res.headers.get('content-length');
let got = 0; const reader = res.body.getReader();
for (;;) { const { done, value } = await reader.read(); if (done) break; fav.progress((got += value.length) / total); }
fav.progress(null).badge('✓');
```

**Long build / CI dashboard**
```js
socket.on('build', ({ percent, status }) => {
  fav.progress(status === 'running' ? percent : null);
  if (status === 'failed') fav.badge('!', { badgeBg: '#dc2626' }).pulse();
});
```

## Pulse

```js
fav.pulse();        // start
fav.pulse(false);   // stop
```

A halo expands from the badge (or from a dot when there's no badge) about once a second, at `fps` frames per second (12 by default).

## Self-drawing

```js
await fav.draw(1200);
```

Cells appear one by one in a deterministic order, then the promise resolves.

## Reduced motion

With `prefers-reduced-motion: reduce`, `draw()` jumps to the final frame and `pulse()` shows a static halo. Opt out with `reducedMotion: false` only if the animation is essential.

## Background tabs

Browsers throttle timers in hidden tabs, so animations slow down there, but badges and progress updates still land.
