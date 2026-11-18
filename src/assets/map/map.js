/* trackgta6.com map: GTADB community tiles (CC BY 4.0) + our tracker items as pins.
   Coordinates: items store GTA world units [x, y]. One map unit = 32 world units, so
   zoom 5 shows the tiles at their native size. */
(function(){
  var W = 32, Z0 = 16384, KEY = "gta6-tracker-v1";
  var CAT = { missables:"#ffd84d", collectibles:"#ff8a5b", activities:"#59c3ff", trophies:"#c59bff" };
  function ll(p){ return L.latLng(-(Z0 - p[1]) / W, (p[0] + Z0) / W); }
  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){ return {}; } }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
  function el(t, c, txt){ var n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; }

  var tileBounds = L.latLngBounds([[-800, 128], [-128, 622]]);
  var map = L.map("map", { crs: L.CRS.Simple, minZoom: 1, maxZoom: 7, zoomSnap: 0.5, zoomDelta: 0.5, preferCanvas: true, zoomControl: false,
    maxBounds: tileBounds.pad(0.15), maxBoundsViscosity: 0.8, attributionControl: true });
  map.attributionControl.setPrefix(false); window.gtaMap = map;
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer("/assets/map/t/{z}/{y}_{x}.jpg", { tileSize: 256, minZoom: 0, maxNativeZoom: 5, maxZoom: 7, noWrap: true, bounds: tileBounds, keepBuffer: 3,
    attribution: 'Map: Yanis GTA VI Community Map v18 via <a href="https://map.gtadb.org" rel="noopener">GTADB</a> contributors, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>, legend panel cropped' }).addTo(map);
  map.fitBounds([[-790, 190], [-170, 610]], { paddingTopLeft: [window.innerWidth > 700 ? 360 : 0, 0] });

  var done = load(), pins = {}, items = [], marks = [];
  var itemLayer = L.layerGroup().addTo(map), landLayer = L.layerGroup();

  function pinIcon(it){
    var c = CAT[it.cat] || "#fff";
    return L.divIcon({ className: "mpin" + (done[it.id] ? " is-done" : ""), iconSize: [26, 34], iconAnchor: [13, 32], popupAnchor: [0, -28],
      html: '<svg viewBox="0 0 26 34" aria-hidden="true"><path d="M13 1C6.4 1 1.5 5.9 1.5 12.3c0 7.6 9 14.7 10.7 16a1.3 1.3 0 0 0 1.6 0c1.7-1.3 10.7-8.4 10.7-16C24.5 5.9 19.6 1 13 1z" fill="' + c + '" stroke="#120a2a" stroke-width="2"/>' +
        (done[it.id] ? '<path d="M8 12.5l3.3 3.3 6.5-6.8" fill="none" stroke="#120a2a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' : '<circle cx="13" cy="12.3" r="4" fill="#120a2a"/>') + '</svg>' });
  }
  function popup(it){
    var box = el("div", "mpop"), hidden = it.spoiler;
    var h = el("strong", hidden ? "blur" : null, it.name); box.appendChild(h);
    var meta = el("div", "mpop-meta", (it.catName || it.cat) + (it.region ? " · " + it.region : "")); box.appendChild(meta);
    if (it.thumb) { var im = el("img"); im.src = it.thumb; im.alt = ""; im.loading = "lazy"; if (hidden) im.className = "blur"; box.appendChild(im); }
    var txt = it.desc || it.note; if (txt){ var p = el("p", hidden ? "blur" : null, (it.desc && it.note ? it.desc + " Tip: " + it.note : txt)); box.appendChild(p); }
    if (hidden){ var rv = el("button", "mpop-btn ghost", "Show spoiler"); rv.type = "button"; rv.onclick = function(){ box.querySelectorAll(".blur").forEach(function(n){ n.classList.remove("blur"); }); rv.remove(); }; box.appendChild(rv); }
    var lab = el("label", "mpop-done"), cb = el("input"); cb.type = "checkbox"; cb.checked = !!done[it.id];
    cb.onchange = function(){ done = load(); if (cb.checked) done[it.id] = 1; else delete done[it.id]; save(done); pins[it.id].setIcon(pinIcon(it)); stats(); };
    lab.appendChild(cb); lab.appendChild(document.createTextNode(" Done")); box.appendChild(lab);
    var a = el("a", "mpop-link", "Open in the tracker"); a.href = "/tracker/"; box.appendChild(a);
    return box;
  }
  var filt = { cat: "all", land: true, hideDone: false };
  function drawItems(){
    itemLayer.clearLayers();
    items.forEach(function(it){
      if (filt.cat !== "all" && it.cat !== filt.cat) return;
      if (filt.hideDone && done[it.id]) return;
      pins[it.id] = L.marker(ll(it.pos), { icon: pinIcon(it), title: it.spoiler ? "Spoiler" : it.name, riseOnHover: true }).bindPopup(function(){ return popup(it); }, { maxWidth: 280 }).addTo(itemLayer);
    });
    stats();
  }
  function stats(){
    var n = items.length, d = items.filter(function(i){ return done[i.id]; }).length;
    document.getElementById("mStats").textContent = n ? (d + " of " + n + " pinned items done") : "No items pinned yet. They appear here as they're mapped from launch night.";
  }
  function drawLand(){
    landLayer.clearLayers();
    marks.forEach(function(m){
      L.circleMarker(ll([m[1], m[2]]), { radius: 3.5, weight: 1, color: "#120a2a", fillColor: "#ffffff", fillOpacity: .85 })
        .bindTooltip(m[0], { direction: "top", offset: [0, -4] }).addTo(landLayer);
    });
  }

  // filters
  document.querySelectorAll("[data-mcat]").forEach(function(b){
    b.addEventListener("click", function(){
      filt.cat = b.dataset.mcat;
      document.querySelectorAll("[data-mcat]").forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      drawItems();
    });
  });
  // fan landmarks only once zoomed in, so the overview stays readable
  function syncLand(){ var on = filt.land && map.getZoom() >= 3; if (on && !map.hasLayer(landLayer)) landLayer.addTo(map); if (!on && map.hasLayer(landLayer)) map.removeLayer(landLayer); }
  map.on("zoomend", syncLand);
  document.getElementById("mLand").addEventListener("change", function(e){ filt.land = e.target.checked; syncLand(); });
  document.getElementById("mHide").addEventListener("change", function(e){ filt.hideDone = e.target.checked; drawItems(); });

  // search across pinned items and fan landmarks
  var q = document.getElementById("mSearch"), res = document.getElementById("mResults");
  q.addEventListener("input", function(){
    var s = q.value.trim().toLowerCase(); res.innerHTML = "";
    if (s.length < 2) return;
    var hits = items.filter(function(i){ return !i.spoiler && (i.name || "").toLowerCase().indexOf(s) > -1; }).slice(0, 5).map(function(i){ return { t: i.name, k: "Tracker", p: i.pos, id: i.id }; })
      .concat(marks.filter(function(m){ return m[0].toLowerCase().indexOf(s) > -1; }).slice(0, 8).map(function(m){ return { t: m[0], k: "Place", p: [m[1], m[2]] }; }));
    if (!hits.length){ res.appendChild(el("li", "none", "Nothing found")); return; }
    hits.forEach(function(h){
      var li = el("li"), b = el("button", null); b.type = "button";
      b.appendChild(el("span", null, h.t)); b.appendChild(el("small", null, h.k));
      b.onclick = function(){ map.flyTo(ll(h.p), 5, { duration: .8 }); if (h.id && pins[h.id]) setTimeout(function(){ pins[h.id].openPopup(); }, 850); res.innerHTML = ""; q.value = ""; };
      li.appendChild(b); res.appendChild(li);
    });
  });

  fetch("/data.json", { cache: "no-cache" }).then(function(r){ return r.json(); }).then(function(d){
    (d.categories || []).forEach(function(c){ (c.items || []).forEach(function(it){
      if (Array.isArray(it.pos) && it.pos.length === 2){ it.cat = c.id; it.catName = c.name; items.push(it); }
    }); });
    drawItems();
    var id = location.hash.slice(1);
    if (id && pins[id]){ map.setView(pins[id].getLatLng(), 4); pins[id].openPopup(); }
  }).catch(stats);
  fetch("/assets/map/landmarks.json").then(function(r){ return r.json(); }).then(function(m){ marks = m; drawLand(); syncLand(); });
})();
