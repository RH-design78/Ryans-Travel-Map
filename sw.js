// Keeps the travel map working with no signal.
// The page itself: newest copy when online, saved copy when offline.
// Photo bundles: saved once, then served from the phone. Videos and map tiles always come from the internet.
const SHELL='travelmap-shell-v2', MEDIA='travelmap-media-v1';
self.addEventListener('install',e=>{ e.waitUntil(caches.open(SHELL).then(c=>c.addAll(['./','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png']).catch(()=>{}))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![SHELL,MEDIA].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET') return;
  if(url.origin!==location.origin){
    // MapLibre library and fonts: reuse a saved copy when offline
    if(/unpkg\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.host)){
      e.respondWith(caches.open(SHELL).then(c=>c.match(req).then(hit=>{ const net=fetch(req).then(r=>{ if(r.ok||r.type==='opaque') c.put(req,r.clone()); return r; }).catch(()=>hit); return hit||net; })));
    }
    return;
  }
  if(url.pathname.includes('/media/v/')) return;
  if(url.pathname.includes('/media/p/')){
    e.respondWith(caches.open(MEDIA).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{ if(r.ok) c.put(req,r.clone()); return r; }))));
    return;
  }
  // page and small files: try the internet first, fall back to the saved copy
  e.respondWith(fetch(req).then(r=>{ if(r.ok && !r.redirected){ const cp=r.clone(); caches.open(SHELL).then(c=>c.put(req,cp)); } return r; })
    .catch(()=>caches.match(req).then(hit=>hit||caches.match('./'))));
});
