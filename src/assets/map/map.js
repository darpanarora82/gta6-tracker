/* trackgta6.com map: GTADB community tiles (CC BY 4.0) + our tracker items as pins.
   Coordinates: items store GTA world units [x, y]. One map unit = 32 world units, so
   zoom 5 shows the tiles at their native size. */
(function(){
  var W = 32, Z0 = 16384, KEY = "gta6-tracker-v1";
  var CAT = { story:"#ff6b8a", side:"#2bd38a", missables:"#ffd84d", collectibles:"#ff8a5b", activities:"#59c3ff", trophies:"#c59bff" };
  function ll(p){ return L.latLng(-(Z0 - p[1]) / W, (p[0] + Z0) / W); }
  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){ return {}; } }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
  function el(t, c, txt){ var n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; }

  var tileBounds = L.latLngBounds([[-800, 128], [-128, 622]]);
  var map = L.map("map", { crs: L.CRS.Simple, minZoom: -1, maxZoom: 7, zoomSnap: 0.5, zoomDelta: 0.5, preferCanvas: true, zoomControl: false,
    maxBounds: tileBounds.pad(0.15), maxBoundsViscosity: 0.8, attributionControl: true });
  map.attributionControl.setPrefix(false); window.gtaMap = map;
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer("/assets/map/t/{z}/{y}_{x}.jpg", { tileSize: 256, minZoom: -2, minNativeZoom: 0, maxNativeZoom: 5, maxZoom: 7, noWrap: true, bounds: tileBounds, keepBuffer: 3,
    attribution: 'Map: Yanis GTA VI Community Map v18 via <a href="https://map.gtadb.org" rel="noopener">GTADB</a> contributors, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>, legend panel cropped' }).addTo(map);
  /* Phones: the map fills the screen under the header; search and filters live in a pull-up sheet. */
  var PHONE = window.matchMedia("(max-width: 700px)");
  var wrap = document.querySelector(".mapwrap"), bar = document.querySelector(".bar"), panel = document.querySelector(".mpanel");
  function fitScreen(){
    if (PHONE.matches){ var top = bar ? bar.getBoundingClientRect().height : 0; wrap.style.height = Math.max(320, window.innerHeight - top) + "px"; }
    else wrap.style.height = "";
    map.invalidateSize();
  }
  var handle = document.createElement("button"); handle.type = "button"; handle.className = "mhandle"; handle.setAttribute("aria-expanded", "false");
  handle.innerHTML = '<span class="grab" aria-hidden="true"></span><span>Search &amp; filters</span>';
  handle.addEventListener("click", function(){ var o = panel.classList.toggle("open"); handle.setAttribute("aria-expanded", o ? "true" : "false"); });
  panel.insertBefore(handle, panel.firstChild);
  map.on("click", function(){ if (PHONE.matches && panel.classList.contains("open")){ panel.classList.remove("open"); handle.setAttribute("aria-expanded", "false"); if (EDIT) sheetWasOpen = true; } });
  L.DomEvent.disableClickPropagation(panel); L.DomEvent.disableScrollPropagation(panel);
  window.addEventListener("resize", fitScreen); window.addEventListener("orientationchange", function(){ setTimeout(fitScreen, 300); });
  if (PHONE.matches) document.body.classList.add("map-phone");
  fitScreen();
  map.fitBounds([[-790, 190], [-170, 610]], { paddingTopLeft: [PHONE.matches ? 0 : 360, 0], paddingBottomRight: [0, PHONE.matches ? 60 : 0] });

  var EDIT = /^\/edit\/map\/?$/.test(location.pathname);
  var done = load(), pins = {}, items = [], all = [], cats = [], regions = [], marks = [];
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
      pins[it.id] = L.marker(ll(it.pos), { icon: pinIcon(it), title: it.spoiler ? "Spoiler" : it.name, riseOnHover: true, draggable: EDIT }).bindPopup(function(){ return popup(it); }, { maxWidth: 280 }).addTo(itemLayer);
      if (EDIT) pins[it.id].on("dragend", function(e){ moved(it, e.target.getLatLng()); });
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

  /* ---------- editor mode (/edit/map, behind the editor password) ---------- */
  var moves = {}, addMode = false, placeId = "";
  function game(a){ return [Math.round(a.lng * W - Z0), Math.round(Z0 + a.lat * W)]; }
  function post(path, body){ return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: body })
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; }); }); }
  function shrink(file, max){ return new Promise(function(ok, bad){ var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function(){ var k = Math.min(1, max / img.width), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.8)); }; img.onerror = bad; img.src = url; }); }
  function upload(dataUrl){ return dataUrl ? post("/edit/blob", JSON.stringify({ content: dataUrl.slice(dataUrl.indexOf(",") + 1), encoding: "base64" })).then(function(j){ return j.sha; }) : Promise.resolve(null); }
  function say(msg){ var n = document.getElementById("edMsg"); if (n) n.textContent = msg; }
  function moved(it, latlng){ it.pos = game(latlng); moves[it.id] = it.pos; refreshSave(); say("Moved " + it.name + ". Press Save pin changes."); }
  function refreshSave(){ var n = Object.keys(moves).length, b = document.getElementById("edSave"); if (b){ b.disabled = !n; b.textContent = n ? "Save pin changes (" + n + ")" : "No pin changes"; } }
  function opt(sel, v, t){ var o = el("option", null, t); o.value = v; sel.appendChild(o); }
  function addForm(latlng){
    var pos = game(latlng), f = el("form", "edform");
    f.appendChild(el("strong", null, "New item here"));
    var nm = el("input"); nm.type = "text"; nm.placeholder = "Name, e.g. Jacket from the stranger"; nm.required = true; f.appendChild(nm);
    var cs = el("select"); cats.forEach(function(c){ opt(cs, c.id, c.name); }); cs.value = filt.cat !== "all" ? filt.cat : "missables"; f.appendChild(cs);
    var rs = el("select"); opt(rs, "", "No region"); regions.forEach(function(r){ opt(rs, r, r); }); f.appendChild(rs);
    var nt = el("textarea"); nt.rows = 3; nt.placeholder = "How to find or complete it"; f.appendChild(nt);
    var ph = el("input"); ph.type = "file"; ph.accept = "image/*"; f.appendChild(ph);
    var ck = el("div", "edchecks"), ms = el("input"), sp = el("input"); ms.type = sp.type = "checkbox";
    var l1 = el("label"); l1.appendChild(ms); l1.appendChild(document.createTextNode(" Missable")); var l2 = el("label"); l2.appendChild(sp); l2.appendChild(document.createTextNode(" Spoiler"));
    ck.appendChild(l1); ck.appendChild(l2); f.appendChild(ck);
    cs.addEventListener("change", function(){ if (cs.value === "story") sp.checked = true; }); if (cs.value === "story") sp.checked = true;
    var go = el("button", "mpop-btn solid", "Publish"); go.type = "submit"; f.appendChild(go);
    f.addEventListener("submit", function(e){
      e.preventDefault(); if (!nm.value.trim()) return; go.disabled = true; go.textContent = "Publishing…";
      var file = ph.files && ph.files[0];
      (file ? shrink(file, 1280).then(function(a){ return shrink(file, 480).then(function(b){ return Promise.all([upload(a), upload(b)]); }); }) : Promise.resolve([null, null]))
        .then(function(sh){ var x = { id: "", cat: cs.value, name: nm.value.trim(), region: rs.value, note: nt.value.trim(), missable: ms.checked, spoiler: sp.checked, added: new Date().toISOString().slice(0, 10), pos: pos };
          if (sh[0]) x.imgBlob = sh[0]; if (sh[1]) x.thumbBlob = sh[1]; return post("/edit/publish", JSON.stringify({ items: [x] })).then(function(j){ return [x, j]; }); })
        .then(function(r){ var x = r[0], id = r[1].ids[0]; var it = { id: id, cat: x.cat, catName: (cats.find(function(c){ return c.id === x.cat; }) || {}).name, name: x.name, region: x.region, note: x.note, missable: x.missable, spoiler: x.spoiler, pos: pos };
          all.push(it); items.push(it); map.closePopup(); if (f._close) f._close(); drawItems(); say("Published " + id + ". It goes live for visitors in about a minute."); })
        .catch(function(err){ go.disabled = false; go.textContent = "Publish"; say("Publish failed: " + err.message); });
    });
    if (PHONE.matches){
      // Phones: a full-screen sheet, so the keyboard and the header never hide the form.
      var back = el("div", "pick-back edsheet"), box = el("div", "pick"); box.appendChild(f); back.appendChild(box);
      var x = el("button", "qa-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Cancel"); f.insertBefore(x, f.firstChild);
      var marker = L.circleMarker(latlng, { radius: 9, color: "#120a2a", weight: 3, fillColor: "#ffd84d", fillOpacity: 1 }).addTo(map);
      var done = function(){ back.remove(); map.removeLayer(marker); };
      x.onclick = done; back.addEventListener("click", function(e){ if (e.target === back) done(); });
      f._close = done;
      document.body.appendChild(back); setTimeout(function(){ nm.focus(); }, 50); return;
    }
    L.popup({ maxWidth: 300, closeOnClick: false, autoPanPaddingTopLeft: L.point(16, 70), autoPanPaddingBottomRight: L.point(16, 70) }).setLatLng(latlng).setContent(f).openOn(map); setTimeout(function(){ nm.focus(); }, 50);
  }
  var sheetWasOpen = false;
  function closeSheet(){ var p = document.querySelector(".mpanel"); if (p && p.classList.contains("open")){ p.classList.remove("open"); var h = p.querySelector(".mhandle"); if (h) h.setAttribute("aria-expanded", "false"); } }
  function banner(text){
    var b = document.getElementById("edBanner");
    if (!b){ b = el("div", "edbanner"); b.id = "edBanner"; map.getContainer().appendChild(b); L.DomEvent.disableClickPropagation(b); }
    b.textContent = text;
  }
  function initEditor(){
    var box = el("div", "edbox");
    box.appendChild(el("h2", null, "Editor"));
    box.appendChild(el("p", "edhelp", "Tap anywhere on the map to add an item there. Drag a pin to move it. Items without a spot can be placed below."));
    var un = all.filter(function(i){ return !i.pos; });
    if (un.length){
      var row = el("div", "edrow"), sel = el("select"); opt(sel, "", "Not on the map yet (" + un.length + ")");
      un.forEach(function(i){ opt(sel, i.id, i.id + " · " + i.name); });
      var pl = el("button", "mpop-btn", "Place"); pl.type = "button";
      pl.onclick = function(){ if (!sel.value) return; placeId = sel.value; closeSheet(); say("Tap the map where " + placeId + " is."); banner("Tap where " + placeId + " is"); };
      row.appendChild(sel); row.appendChild(pl); box.appendChild(row);
    }
    var save = el("button", "mpop-btn solid", "No pin changes"); save.type = "button"; save.id = "edSave"; save.disabled = true; box.appendChild(save);
    save.onclick = function(){ var list = Object.keys(moves).map(function(id){ return { id: id, pos: moves[id] }; }); save.disabled = true; save.textContent = "Saving…";
      post("/edit/move", JSON.stringify({ moves: list })).then(function(j){ moves = {}; refreshSave(); say("Saved " + j.count + " pin" + (j.count === 1 ? "" : "s") + ". Live in about a minute."); }, function(err){ refreshSave(); say("Save failed: " + err.message); }); };
    var msg = el("p", "edmsg"); msg.id = "edMsg"; msg.setAttribute("role", "status"); box.appendChild(msg);
    var back = el("a", "edback", "← Back to the editor"); back.href = "/edit"; box.appendChild(back);
    document.querySelector(".mpanel").insertBefore(box, document.querySelector(".mpanel .msearch"));
    map.getContainer().classList.add("is-editing");
    banner("Editor: tap the map to add an item");
    map.on("popupopen", function(){ var b = document.getElementById("edBanner"); if (b) b.style.display = "none"; });
    map.on("popupclose", function(){ var b = document.getElementById("edBanner"); if (b) b.style.display = ""; });
    map.on("click", function(e){
      if (sheetWasOpen) { sheetWasOpen = false; return; }   // first tap just closes the phone sheet
      if (placeId){ var it = all.find(function(i){ return i.id === placeId; }); placeId = ""; banner("Editor: tap the map to add an item");
        if (it){ it.pos = game(e.latlng); moves[it.id] = it.pos; if (items.indexOf(it) < 0) items.push(it); drawItems(); refreshSave(); say("Placed " + it.name + ". Press Save pin changes."); } return; }
      addForm(e.latlng);
    });
    window.addEventListener("beforeunload", function(e){ if (Object.keys(moves).length){ e.preventDefault(); e.returnValue = ""; } });
  }

  fetch("/data.json", { cache: "no-cache" }).then(function(r){ return r.json(); }).then(function(d){
    cats = d.categories || []; regions = d.regions || [];
    cats.forEach(function(c){ (c.items || []).forEach(function(it){
      it.cat = c.id; it.catName = c.name; all.push(it);
      if (Array.isArray(it.pos) && it.pos.length === 2) items.push(it);
    }); });
    drawItems();
    if (EDIT) initEditor();
    var id = location.hash.slice(1);
    if (id && pins[id]){ map.setView(pins[id].getLatLng(), 4); pins[id].openPopup(); }
  }).catch(stats);
  fetch("/assets/map/landmarks.json").then(function(r){ return r.json(); }).then(function(m){ marks = m; drawLand(); syncLand(); });
})();
