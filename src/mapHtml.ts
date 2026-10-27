// One small web page (Leaflet, free, no key) used by every map in the app. The OpenStreetMap tiles are
// desaturated in CSS (and inverted for dark mode), so the pins are the only colour. On the web it runs in an iframe, on phones in a WebView.
//
//   app -> map   { type:'init', mode:'view'|'pick', dark, center:[lat,lng], zoom, houses:[{id,name,lat,lng,status,order}], selectedId, route:[[lat,lng],...], pin:[lat,lng] }
//   map -> app   { type:'ready' } | { type:'select', id } | { type:'pick', lat, lng }

export const STATUS_COLORS: Record<string, string> = {
  none: '#98989D',
  planned: '#0A84FF', // pending
  told: '#0A84FF', // pending, family told
  arrived: '#FF9500', // carollers are there now
  done: '#30D158', // finished singing
  missed: '#FF453A', // tried, nobody available
};

export const MAP_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html,body,#m{height:100%;margin:0;background:#e9e9ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,system-ui,sans-serif}
.dark,.dark body,.dark #m{background:#111}
.leaflet-container{font-family:inherit}
.leaflet-tile-pane{filter:grayscale(.88) contrast(.95) brightness(1.07)}
.dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) grayscale(.75) brightness(.82) contrast(.92)}
.leaflet-control-attribution{background:rgba(255,255,255,.6)!important;backdrop-filter:blur(8px);font-size:9px;color:#555;border-radius:8px 0 0 0}
.dark .leaflet-control-attribution{background:rgba(30,30,32,.6)!important;color:#aaa}
.dark .leaflet-control-attribution a{color:#ccc}
.pin{box-sizing:border-box;width:20px;height:20px;border-radius:50%;border:2.5px solid #fff;color:#fff;font-weight:700;font-size:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.35);transition:transform .18s ease,box-shadow .18s ease;text-shadow:0 0 2px rgba(0,0,0,.25)}
.pin.sel{transform:scale(1.45);box-shadow:0 0 0 6px var(--c,rgba(10,132,255,.3)),0 3px 10px rgba(0,0,0,.35);z-index:9999}
.drop{width:30px;height:30px;border-radius:50% 50% 50% 0;background:#C8202F;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;margin:-15px 0 0 -15px}
.drop:after{content:'';width:10px;height:10px;border-radius:50%;background:#fff;display:block}
.glass{position:absolute;z-index:1000;border:0;color:#1d1d1f;background:rgba(255,255,255,.72);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);box-shadow:0 2px 10px rgba(0,0,0,.18),inset 0 0 0 .5px rgba(255,255,255,.8)}
.dark .glass{color:#f5f5f7;background:rgba(40,40,44,.7);box-shadow:0 2px 10px rgba(0,0,0,.5),inset 0 0 0 .5px rgba(255,255,255,.12)}
.ctl{right:12px;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;top:12px}
.ctl button{width:40px;height:40px;border:0;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer}
.ctl button+button{border-top:.5px solid rgba(120,120,128,.3)}
.loc{right:12px;bottom:28px;width:40px;height:40px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.note{left:12px;top:12px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:500}
</style></head><body><div id="m"></div>
<div class="glass ctl"><button id="zi">+</button><button id="zo">&minus;</button></div>
<button class="glass loc" id="loc" aria-label="My location"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg></button>
<div class="glass note" id="note" style="display:none"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var COL=${JSON.stringify(STATUS_COLORS)};
var map=L.map('m',{zoomControl:false,attributionControl:true}).setView([13.07,80.22],14);
var tiles=null, dark=null;
function setTheme(d){
  d=!!d; if(dark===d)return; dark=d;
  document.documentElement.className=d?'dark':'';
  if(tiles)map.removeLayer(tiles);
  tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
}
setTheme(false);
var layer=L.layerGroup().addTo(map), routeLine=null, pinMarker=null, mode='view', fitted=false;
function post(o){var s=JSON.stringify(o);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else window.parent.postMessage(s,'*');}
function setPin(lat,lng,send){
  if(pinMarker)pinMarker.setLatLng([lat,lng]);
  else{
    pinMarker=L.marker([lat,lng],{draggable:true,icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="drop"></div>'})}).addTo(map);
    pinMarker.on('dragend',function(){var p=pinMarker.getLatLng();post({type:'pick',lat:p.lat,lng:p.lng});});
  }
  if(send)post({type:'pick',lat:lat,lng:lng});
}
function init(d){
  setTheme(d.dark);
  mode=d.mode||'view';
  layer.clearLayers(); if(routeLine){map.removeLayer(routeLine);routeLine=null;}
  var pts=[], missing=0;
  (d.houses||[]).forEach(function(h){
    if(h.lat==null||h.lng==null){missing++;return;}
    var c=COL[h.status||'none']||COL.none;
    var sel=d.selectedId===h.id;
    var icon=L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:'<div class="pin'+(sel?' sel':'')+'" style="background:'+c+';--c:'+c+'55">'+(h.status==='done'?'&#10003;':h.status==='missed'?'!':(h.order||''))+'</div>'});
    var m=L.marker([h.lat,h.lng],{icon:icon,title:h.name,zIndexOffset:sel?1000:0}).addTo(layer);
    m.on('click',function(){post({type:'select',id:h.id});});
    pts.push([h.lat,h.lng]);
  });
  if(d.route&&d.route.length>1){routeLine=L.polyline(d.route,{color:'#C8202F',weight:3,opacity:.75,lineCap:'round',lineJoin:'round'}).addTo(map);}
  var n=document.getElementById('note');
  if(missing){n.style.display='block';n.textContent=missing+' without a pin';}else n.style.display='none';
  if(mode==='pick'){ if(d.pin)setPin(d.pin[0],d.pin[1],false); }
  if(d.center&&!fitted){map.setView(d.center,d.zoom||15);}
  if(pts.length&&mode==='view'&&!fitted){map.fitBounds(pts,{padding:[40,40],maxZoom:17});fitted=true;}
  if(mode==='pick')fitted=true;
}
window.__init=init;
map.on('click',function(e){if(mode==='pick')setPin(e.latlng.lat,e.latlng.lng,true);});
document.getElementById('zi').onclick=function(){map.zoomIn();};
document.getElementById('zo').onclick=function(){map.zoomOut();};
document.getElementById('loc').onclick=function(){
  if(!navigator.geolocation)return;
  navigator.geolocation.getCurrentPosition(function(p){map.setView([p.coords.latitude,p.coords.longitude],17);if(mode==='pick')setPin(p.coords.latitude,p.coords.longitude,true);},function(){},{enableHighAccuracy:true,timeout:10000});
};
function onMsg(e){try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;if(d&&d.type==='init')init(d);}catch(x){}}
window.addEventListener('message',onMsg);document.addEventListener('message',onMsg);
post({type:'ready'});
</script></body></html>`;
