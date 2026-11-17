(function(){
  "use strict";
  // name | ISO code | IANA zone used for the unlock (capital, or the store's nationwide zone)
  var RAW = "Afghanistan|AF|Asia/Kabul;Albania|AL|Europe/Tirane;Algeria|DZ|Africa/Algiers;Andorra|AD|Europe/Andorra;Angola|AO|Africa/Luanda;Antigua and Barbuda|AG|America/Antigua;Argentina|AR|America/Argentina/Buenos_Aires;Armenia|AM|Asia/Yerevan;Australia|AU|Australia/Sydney;Austria|AT|Europe/Vienna;Azerbaijan|AZ|Asia/Baku;Bahamas|BS|America/Nassau;Bahrain|BH|Asia/Bahrain;Bangladesh|BD|Asia/Dhaka;Barbados|BB|America/Barbados;Belarus|BY|Europe/Minsk;Belgium|BE|Europe/Brussels;Belize|BZ|America/Belize;Benin|BJ|Africa/Porto-Novo;Bhutan|BT|Asia/Thimphu;Bolivia|BO|America/La_Paz;Bosnia and Herzegovina|BA|Europe/Sarajevo;Botswana|BW|Africa/Gaborone;Brazil|BR|America/Sao_Paulo;Brunei|BN|Asia/Brunei;Bulgaria|BG|Europe/Sofia;Burkina Faso|BF|Africa/Ouagadougou;Burundi|BI|Africa/Bujumbura;Cabo Verde|CV|Atlantic/Cape_Verde;Cambodia|KH|Asia/Phnom_Penh;Cameroon|CM|Africa/Douala;Canada|CA|America/Toronto;Central African Republic|CF|Africa/Bangui;Chad|TD|Africa/Ndjamena;Chile|CL|America/Santiago;China|CN|Asia/Shanghai;Colombia|CO|America/Bogota;Comoros|KM|Indian/Comoro;Congo|CG|Africa/Brazzaville;Costa Rica|CR|America/Costa_Rica;Côte d'Ivoire|CI|Africa/Abidjan;Croatia|HR|Europe/Zagreb;Cuba|CU|America/Havana;Cyprus|CY|Asia/Nicosia;Czechia|CZ|Europe/Prague;DR Congo|CD|Africa/Kinshasa;Denmark|DK|Europe/Copenhagen;Djibouti|DJ|Africa/Djibouti;Dominica|DM|America/Dominica;Dominican Republic|DO|America/Santo_Domingo;Ecuador|EC|America/Guayaquil;Egypt|EG|Africa/Cairo;El Salvador|SV|America/El_Salvador;Equatorial Guinea|GQ|Africa/Malabo;Eritrea|ER|Africa/Asmara;Estonia|EE|Europe/Tallinn;Eswatini|SZ|Africa/Mbabane;Ethiopia|ET|Africa/Addis_Ababa;Fiji|FJ|Pacific/Fiji;Finland|FI|Europe/Helsinki;France|FR|Europe/Paris;Gabon|GA|Africa/Libreville;Gambia|GM|Africa/Banjul;Georgia|GE|Asia/Tbilisi;Germany|DE|Europe/Berlin;Ghana|GH|Africa/Accra;Greece|GR|Europe/Athens;Grenada|GD|America/Grenada;Guatemala|GT|America/Guatemala;Guinea|GN|Africa/Conakry;Guinea-Bissau|GW|Africa/Bissau;Guyana|GY|America/Guyana;Haiti|HT|America/Port-au-Prince;Honduras|HN|America/Tegucigalpa;Hong Kong|HK|Asia/Hong_Kong;Hungary|HU|Europe/Budapest;Iceland|IS|Atlantic/Reykjavik;India|IN|Asia/Kolkata;Indonesia|ID|Asia/Jakarta;Iran|IR|Asia/Tehran;Iraq|IQ|Asia/Baghdad;Ireland|IE|Europe/Dublin;Israel|IL|Asia/Jerusalem;Italy|IT|Europe/Rome;Jamaica|JM|America/Jamaica;Japan|JP|Asia/Tokyo;Jordan|JO|Asia/Amman;Kazakhstan|KZ|Asia/Almaty;Kenya|KE|Africa/Nairobi;Kiribati|KI|Pacific/Tarawa;Kosovo|XK|Europe/Belgrade;Kuwait|KW|Asia/Kuwait;Kyrgyzstan|KG|Asia/Bishkek;Laos|LA|Asia/Vientiane;Latvia|LV|Europe/Riga;Lebanon|LB|Asia/Beirut;Lesotho|LS|Africa/Maseru;Liberia|LR|Africa/Monrovia;Libya|LY|Africa/Tripoli;Liechtenstein|LI|Europe/Vaduz;Lithuania|LT|Europe/Vilnius;Luxembourg|LU|Europe/Luxembourg;Macao|MO|Asia/Macau;Madagascar|MG|Indian/Antananarivo;Malawi|MW|Africa/Blantyre;Malaysia|MY|Asia/Kuala_Lumpur;Maldives|MV|Indian/Maldives;Mali|ML|Africa/Bamako;Malta|MT|Europe/Malta;Marshall Islands|MH|Pacific/Majuro;Mauritania|MR|Africa/Nouakchott;Mauritius|MU|Indian/Mauritius;Mexico|MX|America/Mexico_City;Micronesia|FM|Pacific/Pohnpei;Moldova|MD|Europe/Chisinau;Monaco|MC|Europe/Monaco;Mongolia|MN|Asia/Ulaanbaatar;Montenegro|ME|Europe/Podgorica;Morocco|MA|Africa/Casablanca;Mozambique|MZ|Africa/Maputo;Myanmar|MM|Asia/Yangon;Namibia|NA|Africa/Windhoek;Nauru|NR|Pacific/Nauru;Nepal|NP|Asia/Kathmandu;Netherlands|NL|Europe/Amsterdam;New Zealand|NZ|Pacific/Auckland;Nicaragua|NI|America/Managua;Niger|NE|Africa/Niamey;Nigeria|NG|Africa/Lagos;North Korea|KP|Asia/Pyongyang;North Macedonia|MK|Europe/Skopje;Norway|NO|Europe/Oslo;Oman|OM|Asia/Muscat;Pakistan|PK|Asia/Karachi;Palau|PW|Pacific/Palau;Palestine|PS|Asia/Hebron;Panama|PA|America/Panama;Papua New Guinea|PG|Pacific/Port_Moresby;Paraguay|PY|America/Asuncion;Peru|PE|America/Lima;Philippines|PH|Asia/Manila;Poland|PL|Europe/Warsaw;Portugal|PT|Europe/Lisbon;Puerto Rico|PR|America/Puerto_Rico;Qatar|QA|Asia/Qatar;Romania|RO|Europe/Bucharest;Russia|RU|Europe/Moscow;Rwanda|RW|Africa/Kigali;Saint Kitts and Nevis|KN|America/St_Kitts;Saint Lucia|LC|America/St_Lucia;Saint Vincent and the Grenadines|VC|America/St_Vincent;Samoa|WS|Pacific/Apia;San Marino|SM|Europe/San_Marino;São Tomé and Príncipe|ST|Africa/Sao_Tome;Saudi Arabia|SA|Asia/Riyadh;Senegal|SN|Africa/Dakar;Serbia|RS|Europe/Belgrade;Seychelles|SC|Indian/Mahe;Sierra Leone|SL|Africa/Freetown;Singapore|SG|Asia/Singapore;Slovakia|SK|Europe/Bratislava;Slovenia|SI|Europe/Ljubljana;Solomon Islands|SB|Pacific/Guadalcanal;Somalia|SO|Africa/Mogadishu;South Africa|ZA|Africa/Johannesburg;South Korea|KR|Asia/Seoul;South Sudan|SS|Africa/Juba;Spain|ES|Europe/Madrid;Sri Lanka|LK|Asia/Colombo;Sudan|SD|Africa/Khartoum;Suriname|SR|America/Paramaribo;Sweden|SE|Europe/Stockholm;Switzerland|CH|Europe/Zurich;Syria|SY|Asia/Damascus;Taiwan|TW|Asia/Taipei;Tajikistan|TJ|Asia/Dushanbe;Tanzania|TZ|Africa/Dar_es_Salaam;Thailand|TH|Asia/Bangkok;Timor-Leste|TL|Asia/Dili;Togo|TG|Africa/Lome;Tonga|TO|Pacific/Tongatapu;Trinidad and Tobago|TT|America/Port_of_Spain;Tunisia|TN|Africa/Tunis;Türkiye|TR|Europe/Istanbul;Turkmenistan|TM|Asia/Ashgabat;Tuvalu|TV|Pacific/Funafuti;Uganda|UG|Africa/Kampala;Ukraine|UA|Europe/Kiev;United Arab Emirates|AE|Asia/Dubai;United Kingdom|GB|Europe/London;United States|US|America/New_York;Uruguay|UY|America/Montevideo;Uzbekistan|UZ|Asia/Tashkent;Vanuatu|VU|Pacific/Efate;Vatican City|VA|Europe/Vatican;Venezuela|VE|America/Caracas;Vietnam|VN|Asia/Ho_Chi_Minh;Yemen|YE|Asia/Aden;Zambia|ZM|Africa/Lusaka;Zimbabwe|ZW|Africa/Harare";

  // Extra zones a viewer might be in, mapped to their country (for auto-detect)
  var ALIAS = {"America/Chicago":"US","America/Denver":"US","America/Los_Angeles":"US","America/Phoenix":"US","America/Anchorage":"US","Pacific/Honolulu":"US","America/Vancouver":"CA","America/Edmonton":"CA","America/Winnipeg":"CA","America/Halifax":"CA","America/Regina":"CA","America/St_Johns":"CA","Asia/Calcutta":"IN","Australia/Melbourne":"AU","Australia/Brisbane":"AU","Australia/Perth":"AU","Australia/Adelaide":"AU","Australia/Hobart":"AU","Australia/Darwin":"AU","Europe/Kyiv":"UA","Asia/Saigon":"VN","Asia/Rangoon":"MM","Asia/Katmandu":"NP","America/Buenos_Aires":"AR","Asia/Makassar":"ID","Asia/Jayapura":"ID","America/Manaus":"BR","America/Fortaleza":"BR","America/Recife":"BR","America/Bahia":"BR","America/Belem":"BR","America/Monterrey":"MX","America/Tijuana":"MX","America/Cancun":"MX","America/Mazatlan":"MX","America/Hermosillo":"MX","Asia/Yekaterinburg":"RU","Asia/Novosibirsk":"RU","Asia/Vladivostok":"RU","Europe/Samara":"RU","Asia/Krasnoyarsk":"RU","Asia/Irkutsk":"RU","Europe/Kaliningrad":"RU","Asia/Gaza":"PS","Asia/Qyzylorda":"KZ","Asia/Aqtobe":"KZ","Atlantic/Canary":"ES","Africa/Ceuta":"ES","Atlantic/Madeira":"PT","Atlantic/Azores":"PT","Africa/Lubumbashi":"CD","Pacific/Chatham":"NZ","America/Punta_Arenas":"CL","Pacific/Kiritimati":"KI","Asia/Urumqi":"CN","Asia/Kuching":"MY"};

  var viewerTZ = "UTC";
  try { viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch(e){}

  // UTC offset (ms) of a zone at a given instant
  function offsetAt(tz, t){
    var f = new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
    var p = {}; f.formatToParts(new Date(t)).forEach(function(x){p[x.type]=x.value;});
    var asUTC = Date.UTC(+p.year, +p.month-1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return asUTC - t;
  }
  // instant when the wall clock in tz reads 2026-11-19 00:00
  function midnightIn(tz){
    var base = Date.UTC(2026,10,19,0,0,0);
    var t = base - offsetAt(tz, base);
    t = base - offsetAt(tz, t);
    return t;
  }
  function flag(cc){
    if (cc === "XK") return "🏳️";
    return String.fromCodePoint.apply(null, cc.split("").map(function(c){return 0x1F1E6 + c.charCodeAt(0) - 65;}));
  }

  var countries = [];
  RAW.split(";").forEach(function(r){
    var a = r.split("|");
    try { countries.push({name:a[0], cc:a[1], tz:a[2], t:midnightIn(a[2])}); } catch(e){}
  });

  var youFmt = new Intl.DateTimeFormat(undefined,{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  var hourFmt = new Intl.DateTimeFormat(undefined,{weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  function localLabel(c){
    try {
      var s = new Intl.DateTimeFormat(undefined,{timeZone:c.tz,weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(c.t));
      if (c.cc === "US" || c.cc === "CA") s += " (nationwide)";
      return s;
    } catch(e){ return ""; }
  }
  countries.forEach(function(c){ c.local = localLabel(c); c.you = youFmt.format(new Date(c.t)); });

  // "Your time zone" entry
  var mine = {name:"My time zone", cc:"", tz:viewerTZ, t:0, mine:true};
  try { mine.t = midnightIn(viewerTZ); } catch(e){ mine.t = Date.UTC(2026,10,19); }
  mine.local = localLabel(mine); mine.you = youFmt.format(new Date(mine.t));

  // pick starting country
  var detectedCC = null;
  countries.forEach(function(c){ if (c.tz === viewerTZ && !detectedCC) detectedCC = c.cc; });
  if (!detectedCC && ALIAS[viewerTZ]) detectedCC = ALIAS[viewerTZ];
  var saved = null;
  try { saved = localStorage.getItem("gta6-country"); } catch(e){}
  if (saved === "mine") saved = null;
  var selected = saved || detectedCC || "mine";

  function byCC(cc){ if (cc === "mine") return mine; for (var i=0;i<countries.length;i++) if (countries[i].cc===cc) return countries[i]; return mine; }

  // select
  var sel = document.getElementById("country");
  var alpha = countries.slice().sort(function(a,b){return a.name.localeCompare(b.name);});
  var o = document.createElement("option"); o.value="mine"; o.textContent="🕛 My time zone ("+viewerTZ.replace(/_/g," ")+")"; sel.appendChild(o);
  alpha.forEach(function(c){ var op=document.createElement("option"); op.value=c.cc; op.textContent=flag(c.cc)+"  "+c.name; sel.appendChild(op); });
  sel.addEventListener("change", function(){ choose(sel.value); });

  function pad(n){ return (n<10?"0":"")+n; }
  function split(ms){
    var s = Math.max(0, Math.floor(ms/1000));
    return {d:Math.floor(s/86400), h:Math.floor(s%86400/3600), m:Math.floor(s%3600/60), s:s%60};
  }
  function short(ms){
    if (ms <= 0) return "Out now";
    var x = split(ms);
    return (x.d? x.d+"d ":"") + pad(x.h)+":"+pad(x.m)+":"+pad(x.s);
  }
  function since(ms){
    var x = split(ms);
    if (x.d) return x.d+"d "+x.h+"h ago";
    if (x.h) return x.h+"h "+x.m+"m ago";
    return x.m+"m ago";
  }

  // hero
  var hero = document.getElementById("hero");
  var el = {d:document.getElementById("d"),h:document.getElementById("h"),m:document.getElementById("m"),s:document.getElementById("s"),
            name:document.getElementById("heroName"),local:document.getElementById("heroLocal"),you:document.getElementById("heroYou"),out:document.getElementById("outMsg")};

  function paintHero(now){
    var c = byCC(selected);
    el.name.textContent = c.mine ? "your time zone" : c.name;
    el.local.textContent = c.local;
    el.you.textContent = c.you;
    var left = c.t - now;
    if (left <= 0){
      hero.classList.add("is-out");
      el.out.textContent = "It's out · unlocked " + since(-left);
    } else {
      hero.classList.remove("is-out");
      var x = split(left);
      el.d.textContent = pad(x.d); el.h.textContent = pad(x.h); el.m.textContent = pad(x.m); el.s.textContent = pad(x.s);
    }
  }

  // wave strip
  var wave = document.getElementById("wave");
  var groups = {};
  countries.forEach(function(c){ (groups[c.t] = groups[c.t] || []).push(c); });
  var times = Object.keys(groups).map(Number).sort(function(a,b){return a-b;});
  var HOUR = 3600000;
  var start = Math.floor(times[0]/HOUR)*HOUR - HOUR;
  var end = Math.ceil(times[times.length-1]/HOUR)*HOUR + HOUR;
  function pct(t){ return Math.max(0, Math.min(100, (t-start)/(end-start)*100)); }

  wave.innerHTML = '<div class="track"></div><div class="lit" id="lit"></div>';
  for (var t = Math.ceil(start/(3*HOUR))*3*HOUR; t <= end; t += 3*HOUR){
    var tk = document.createElement("div"); tk.className="tick"; tk.style.left = pct(t)+"%"; tk.textContent = hourFmt.format(new Date(t)); wave.appendChild(tk);
  }
  var dots = [];
  var maxN = 0; times.forEach(function(t){ maxN = Math.max(maxN, groups[t].length); });
  var lastLabelPct = -100;
  times.forEach(function(t){
    var g = groups[t].slice().sort(function(a,b){return a.name.localeCompare(b.name);});
    var size = 10 + Math.round(16 * Math.sqrt(g.length / maxN));
    var b = document.createElement("button");
    b.type = "button"; b.className = "dot";
    b.style.left = pct(t)+"%"; b.style.width = b.style.height = size+"px";
    var names = g.map(function(c){return c.name;});
    b.title = youFmt.format(new Date(t)) + " — " + names.join(", ");
    b.setAttribute("aria-label", "Unlocks " + youFmt.format(new Date(t)) + ": " + names.join(", "));
    b.addEventListener("click", function(){ var pick = g.filter(function(c){return c.cc===detectedCC;})[0] || g[0]; choose(pick.cc); });
    wave.appendChild(b);
    dots.push({el:b, t:t, ccs:g.map(function(c){return c.cc;})});
    // label the busiest / first waves without collisions
    var p = pct(t);
    if (p - lastLabelPct > 9 && (g.length >= 6 || t === times[0])){
      var lb = document.createElement("div"); lb.className="dot-label"; lb.style.left = p+"%";
      lb.textContent = t === times[0] ? g[0].name.split(" ")[0] + " first" : g.length + " countries";
      wave.appendChild(lb); lastLabelPct = p;
    }
  });
  var nowEl = document.createElement("div"); nowEl.className="now"; nowEl.innerHTML="<span></span>"; wave.appendChild(nowEl);
  var lit = document.getElementById("lit");

  function paintWave(now){
    var p = pct(now);
    lit.style.width = p+"%";
    nowEl.style.left = p+"%";
    var lab = nowEl.firstChild;
    if (now < times[0]) lab.textContent = "Now · first unlock in " + short(times[0]-now);
    else if (now > times[times.length-1]) lab.textContent = "Out everywhere";
    else lab.textContent = "Now";
    // keep the label inside the strip
    lab.style.transform = p < 20 ? "translateX(-4px)" : (p > 80 ? "translateX(calc(-100% + 4px))" : "translateX(-50%)");
    lab.style.left = p < 20 ? "0" : (p > 80 ? "0" : "50%");
    dots.forEach(function(d){
      d.el.classList.toggle("done", d.t <= now);
      d.el.classList.toggle("sel", d.ccs.indexOf(selected) > -1);
    });
  }

  // board
  var board = document.getElementById("board");
  var q = document.getElementById("q");
  var sortMode = "time";
  var rows = [];
  function buildBoard(){
    board.innerHTML = "";
    var head = document.createElement("div"); head.className = "row head"; head.setAttribute("role","presentation");
    head.innerHTML = "<span>Country</span><span>Local unlock</span><span>On your clock</span><span>Countdown</span><span>Status</span>";
    board.appendChild(head);
    var list = countries.slice();
    list.sort(sortMode === "time" ? function(a,b){return a.t-b.t || a.name.localeCompare(b.name);} : function(a,b){return a.name.localeCompare(b.name);});
    var needle = q.value.trim().toLowerCase();
    rows = [];
    list.forEach(function(c){
      if (needle && c.name.toLowerCase().indexOf(needle) === -1 && c.cc.toLowerCase() !== needle) return;
      var r = document.createElement("button"); r.type="button"; r.className="row"; r.setAttribute("role","listitem");
      r.innerHTML = '<span class="c-name"><span class="flag" aria-hidden="true">'+flag(c.cc)+'</span><span class="nm"></span></span>'+
                    '<span class="c-time c-local"></span><span class="c-time c-you"></span><span class="c-cd"></span><span class="pill"></span>';
      r.querySelector(".nm").textContent = c.name;
      r.querySelector(".c-local").textContent = c.local;
      r.querySelector(".c-you").textContent = "You: " + c.you;
      r.addEventListener("click", function(){ choose(c.cc); document.getElementById("hero").scrollIntoView({block:"start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); });
      board.appendChild(r);
      rows.push({c:c, el:r, cd:r.querySelector(".c-cd"), pill:r.querySelector(".pill")});
    });
    if (!rows.length){ var e=document.createElement("div"); e.className="empty"; e.textContent="No country matches “"+q.value+"”. Try another spelling, or pick “My time zone” above."; board.appendChild(e); }
    paintBoard(Date.now());
  }
  function paintBoard(now){
    var live = 0;
    countries.forEach(function(c){ if (c.t <= now) live++; });
    document.getElementById("count").textContent = live + " of " + countries.length + " countries unlocked";
    rows.forEach(function(r){
      var left = r.c.t - now;
      r.cd.textContent = left > 0 ? short(left) : "Out now";
      var cls = "pill", txt = "Waiting";
      if (left <= 0){ cls += " live"; txt = "Unlocked"; }
      else if (left < HOUR){ cls += " hour"; txt = "Under 1 hour"; }
      else if (left < 24*HOUR){ cls += " soon"; txt = "Under 24h"; }
      if (r.pill.className !== cls){ r.pill.className = cls; r.pill.textContent = txt; }
      r.el.classList.toggle("sel", r.c.cc === selected);
    });
  }
  q.addEventListener("input", buildBoard);
  var bT = document.getElementById("sortTime"), bN = document.getElementById("sortName");
  bT.addEventListener("click", function(){ sortMode="time"; bT.setAttribute("aria-pressed","true"); bN.setAttribute("aria-pressed","false"); buildBoard(); });
  bN.addEventListener("click", function(){ sortMode="name"; bN.setAttribute("aria-pressed","true"); bT.setAttribute("aria-pressed","false"); buildBoard(); });

  function choose(cc){
    selected = cc; sel.value = cc;
    try { if (cc !== "mine") localStorage.setItem("gta6-country", cc); } catch(e){}
    if (window.GTAR && cc !== "mine") GTAR.set(cc);
    tick();
  }

  function tick(){
    var now = Date.now();
    paintHero(now); paintWave(now); paintBoard(now);
  }
  sel.value = selected; if (sel.value !== selected){ selected = "mine"; sel.value = "mine"; }
  buildBoard();
  tick();
  setInterval(tick, 1000);
})();
