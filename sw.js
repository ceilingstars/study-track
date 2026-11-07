/* Study Track service worker. Network first, so updates always arrive; cached copy only when offline. */
const V="study-track-v6",SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","app-sync.js","supabase-config.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>fetch(u,{cache:"reload"}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data=="skip")self.skipWaiting()});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!="GET")return;const u=new URL(r.url);
 if(u.hostname=="cdn.jsdelivr.net"){e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})));return}
 if(u.origin!=location.origin)return;
 e.respondWith((async()=>{const c=await caches.open(V);
  try{const res=await Promise.race([fetch(r.url,{cache:"no-cache"}),new Promise((_,j)=>setTimeout(j,6000))]);if(res&&res.ok){c.put(r.mode=="navigate"?"index.html":r,res.clone());return res}return res}
  catch(x){const h=await c.match(r.mode=="navigate"?"index.html":r,{ignoreSearch:true});if(h)return h;throw x}})())});
