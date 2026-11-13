// Service worker do PixelBoy: deixa o app e o emulador funcionando offline depois do primeiro uso.
const VERSAO = 'pixelboy-v1';
const BASE = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
];
const CDNS = ['cdn.emulatorjs.org', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function redePrimeiro(req, reserva){
  const c = await caches.open(VERSAO);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch (e) {
    return (await c.match(req)) || (reserva && await c.match(reserva)) || Response.error();
  }
}

async function cachePrimeiro(req){
  const c = await caches.open(VERSAO);
  const salvo = await c.match(req);
  if (salvo) return salvo;
  const r = await fetch(req);
  if (r.ok || r.type === 'opaque') c.put(req, r.clone());
  return r;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') e.respondWith(redePrimeiro(req, './index.html'));
    else e.respondWith(redePrimeiro(req));
  } else if (CDNS.includes(url.hostname)) {
    e.respondWith(cachePrimeiro(req));
  }
});
