// Draws the premium GM logo (same GM lettering as the site header) and renders the web app icons with headless Edge.
// node build/make-brand-icons.mjs <path-to-cdp.mjs>
import fs from 'fs';
import { pathToFileURL } from 'url';
const { open } = await import(pathToFileURL(process.argv[2]).href);
const R = 'D:/GM_Claude/assets/img/pwa/';
const G = 'M15.6 5.9A8 8 0 1 0 17.5 11H10.5', M = 'M22.5 19V3.5l7 10 7-10V19';
const spark = (x, y, r) => `<path d="M${x} ${y - r}C${x + r * .18} ${y - r * .3} ${x + r * .3} ${y - r * .18} ${x + r} ${y}C${x + r * .3} ${y + r * .18} ${x + r * .18} ${y + r * .3} ${x} ${y + r}C${x - r * .18} ${y + r * .3} ${x - r * .3} ${y + r * .18} ${x - r} ${y}C${x - r * .3} ${y - r * .18} ${x - r * .18} ${y - r * .3} ${x} ${y - r}z" fill="#ffd66b"/>`;
// 512 canvas. "rounded" = tile with transparent corners; "full" = edge-to-edge for maskable icons (art stays in the safe circle).
export function logo(shape) {
  const rounded = shape === 'rounded', k = rounded ? 9.6 : 8.2;
  const tile = rounded ? 'x="16" y="16" width="480" height="480" rx="116"' : 'width="512" height="512"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6bff"/><stop offset=".55" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b3ff0"/></linearGradient>
<radialGradient id="s" cx=".28" cy=".08" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="d" cx=".85" cy=".95" r=".7"><stop offset="0" stop-color="#22d3ee" stop-opacity=".2"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient></defs>
<rect ${tile} fill="url(#g)"/><rect ${tile} fill="url(#s)"/><rect ${tile} fill="url(#d)"/>
<g transform="translate(${256 - 19 * k} ${262 - 11 * k}) scale(${k})" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4">
<g stroke="#1b1464" stroke-opacity=".32" transform="translate(0 .85)"><path d="${G}"/><path d="${M}"/></g>
<g stroke="#fff"><path d="${G}"/><path d="${M}"/></g></g>
${spark(rounded ? 386 : 362, rounded ? 122 : 142, rounded ? 36 : 29)}${spark(rounded ? 434 : 398, rounded ? 88 : 116, rounded ? 13 : 11)}
</svg>`;
}
fs.writeFileSync(R + 'gm-logo.svg', logo('rounded'));
const b = await open(9441);
await b.send('Page.enable');
await b.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
const shots = [['icon-512.png', 'rounded', 512], ['icon-192.png', 'rounded', 192], ['maskable-512.png', 'full', 512], ['maskable-192.png', 'full', 192]];
for (const [name, shape, size] of shots) {
  await b.send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await b.go('data:text/html;charset=utf-8,' + encodeURIComponent('<body style="margin:0">' + logo(shape).replace('width="512" height="512">', `width="${size}" height="${size}">`)));
  await new Promise(r => setTimeout(r, 400));
  fs.writeFileSync(R + name, Buffer.from((await b.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  console.log(name, fs.statSync(R + name).size, 'bytes');
}
b.close(); process.exit(0);
