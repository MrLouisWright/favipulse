(function () {
  var F = window.favipulse; if (!F) return;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // hero grid
  var hero = $('hero-grid');
  ['acme', 'globex', 'initech', 'umbrella'].forEach(function (s) { ['dev', 'staging', 'prod', null].forEach(function (e, i) {
    if (i > 2) e = 'prod';
    var d = document.createElement('div');
    d.innerHTML = i == 3 ? F.toSVG(F.icon(s, { style: 'rings' })) : F.envSVG(s, e); d.title = s + (i == 3 ? ' (rings)' : ' · ' + e); hero.appendChild(d);
  }); });
  var st = { seed: 'my-app', env: '', style: '', badge: 0, progress: null, pulse: false };
  var fav = F.favipulse({ seed: st.seed });
  if (reduced) $('rm').hidden = false;
  function opts() { var o = { seed: st.seed || ' ', env: st.env || undefined }; if (st.style) o.style = st.style; else if (!st.env) o.style = 'grid'; return o; }
  function paint() {
    var svg = fav.svg, uri = F.dataURI(svg);
    $('preview').innerHTML = svg; $('tab-ico').src = $('s16').src = $('s32').src = $('s64').src = uri;
    $('tab-title').textContent = (st.badge ? '(' + F.badgeText(st.badge) + ') ' : '') + st.seed + ' — favipulse demo';
    var lines = ["import { favipulse } from 'favipulse';", '', 'const fav = favipulse(' + JSON.stringify(opts()).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ').replace(/"/g, "'") + ');'];
    if (st.badge) lines.push('fav.badge(' + st.badge + ');');
    if (st.progress != null) lines.push('fav.progress(' + st.progress / 100 + ');');
    if (st.pulse) lines.push('fav.pulse();');
    $('snippet').textContent = lines.join('\n');
  }
  // keep previews in sync with animation frames
  new MutationObserver(paint).observe(fav.link, { attributes: true, attributeFilter: ['href'] });
  function apply() { fav.set(opts()); fav.badge(st.badge); fav.progress(st.progress == null ? null : st.progress / 100); paint(); }
  function seg(id, key) {
    var bs = $(id).querySelectorAll('button');
    [].forEach.call(bs, function (b) { b.addEventListener('click', function () {
      [].forEach.call(bs, function (x) { x.setAttribute('aria-pressed', x == b); }); st[key] = b.getAttribute('data-' + key); apply(); }); });
    bs[0].setAttribute('aria-pressed', 'true');
  }
  seg('envs', 'env'); seg('styles', 'style');
  $('seed').addEventListener('input', function (e) { st.seed = e.target.value; apply(); });
  $('prog').addEventListener('input', function (e) { var v = +e.target.value; st.progress = v < 0 ? null : v; $('pv').textContent = v < 0 ? 'off' : v + '%'; apply(); });
  function setBadge(n) { st.badge = Math.max(0, n); $('bv').textContent = F.badgeText(st.badge) || '0'; apply(); }
  $('bm').onclick = function () { setBadge(st.badge - 1); };
  $('bp').onclick = function () { setBadge(st.badge + 1); };
  $('b100').onclick = function () { setBadge(120); };
  $('draw').onclick = function () { fav.draw(1200); };
  $('pulse').onclick = function () { st.pulse = !st.pulse; this.setAttribute('aria-pressed', st.pulse); fav.pulse(st.pulse); paint(); };
  var bt = 0;
  $('build').onclick = function () {
    clearInterval(bt); var p = 0;
    bt = setInterval(function () { p += 4 + Math.random() * 6; if (p >= 100) { clearInterval(bt); st.progress = null; $('prog').value = -1; $('pv').textContent = 'done ✔'; setBadge(st.badge + 1); return; }
      st.progress = Math.round(p); $('prog').value = st.progress; $('pv').textContent = st.progress + '%'; apply(); }, 180);
  };
  $('reset').onclick = function () { clearInterval(bt); st.badge = 0; st.progress = null; st.pulse = false; $('prog').value = -1; $('pv').textContent = 'off'; $('bv').textContent = '0'; $('pulse').setAttribute('aria-pressed', 'false'); fav.reset(); paint(); };
  apply(); fav.draw(1400);
})();
