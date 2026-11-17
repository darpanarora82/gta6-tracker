/* Region: works out the visitor's country from the device's time zone (no IP lookup),
   remembers a manual choice, and fills in prices and unlock times on the page. */
(function () {
  "use strict";
  var RAW = "Afghanistan|AF|Asia/Kabul;Albania|AL|Europe/Tirane;Algeria|DZ|Africa/Algiers;Andorra|AD|Europe/Andorra;Angola|AO|Africa/Luanda;Antigua and Barbuda|AG|America/Antigua;Argentina|AR|America/Argentina/Buenos_Aires;Armenia|AM|Asia/Yerevan;Australia|AU|Australia/Sydney;Austria|AT|Europe/Vienna;Azerbaijan|AZ|Asia/Baku;Bahamas|BS|America/Nassau;Bahrain|BH|Asia/Bahrain;Bangladesh|BD|Asia/Dhaka;Barbados|BB|America/Barbados;Belarus|BY|Europe/Minsk;Belgium|BE|Europe/Brussels;Belize|BZ|America/Belize;Benin|BJ|Africa/Porto-Novo;Bhutan|BT|Asia/Thimphu;Bolivia|BO|America/La_Paz;Bosnia and Herzegovina|BA|Europe/Sarajevo;Botswana|BW|Africa/Gaborone;Brazil|BR|America/Sao_Paulo;Brunei|BN|Asia/Brunei;Bulgaria|BG|Europe/Sofia;Burkina Faso|BF|Africa/Ouagadougou;Burundi|BI|Africa/Bujumbura;Cabo Verde|CV|Atlantic/Cape_Verde;Cambodia|KH|Asia/Phnom_Penh;Cameroon|CM|Africa/Douala;Canada|CA|America/Toronto;Central African Republic|CF|Africa/Bangui;Chad|TD|Africa/Ndjamena;Chile|CL|America/Santiago;China|CN|Asia/Shanghai;Colombia|CO|America/Bogota;Comoros|KM|Indian/Comoro;Congo|CG|Africa/Brazzaville;Costa Rica|CR|America/Costa_Rica;Côte d'Ivoire|CI|Africa/Abidjan;Croatia|HR|Europe/Zagreb;Cuba|CU|America/Havana;Cyprus|CY|Asia/Nicosia;Czechia|CZ|Europe/Prague;DR Congo|CD|Africa/Kinshasa;Denmark|DK|Europe/Copenhagen;Djibouti|DJ|Africa/Djibouti;Dominica|DM|America/Dominica;Dominican Republic|DO|America/Santo_Domingo;Ecuador|EC|America/Guayaquil;Egypt|EG|Africa/Cairo;El Salvador|SV|America/El_Salvador;Equatorial Guinea|GQ|Africa/Malabo;Eritrea|ER|Africa/Asmara;Estonia|EE|Europe/Tallinn;Eswatini|SZ|Africa/Mbabane;Ethiopia|ET|Africa/Addis_Ababa;Fiji|FJ|Pacific/Fiji;Finland|FI|Europe/Helsinki;France|FR|Europe/Paris;Gabon|GA|Africa/Libreville;Gambia|GM|Africa/Banjul;Georgia|GE|Asia/Tbilisi;Germany|DE|Europe/Berlin;Ghana|GH|Africa/Accra;Greece|GR|Europe/Athens;Grenada|GD|America/Grenada;Guatemala|GT|America/Guatemala;Guinea|GN|Africa/Conakry;Guinea-Bissau|GW|Africa/Bissau;Guyana|GY|America/Guyana;Haiti|HT|America/Port-au-Prince;Honduras|HN|America/Tegucigalpa;Hong Kong|HK|Asia/Hong_Kong;Hungary|HU|Europe/Budapest;Iceland|IS|Atlantic/Reykjavik;India|IN|Asia/Kolkata;Indonesia|ID|Asia/Jakarta;Iran|IR|Asia/Tehran;Iraq|IQ|Asia/Baghdad;Ireland|IE|Europe/Dublin;Israel|IL|Asia/Jerusalem;Italy|IT|Europe/Rome;Jamaica|JM|America/Jamaica;Japan|JP|Asia/Tokyo;Jordan|JO|Asia/Amman;Kazakhstan|KZ|Asia/Almaty;Kenya|KE|Africa/Nairobi;Kiribati|KI|Pacific/Tarawa;Kosovo|XK|Europe/Belgrade;Kuwait|KW|Asia/Kuwait;Kyrgyzstan|KG|Asia/Bishkek;Laos|LA|Asia/Vientiane;Latvia|LV|Europe/Riga;Lebanon|LB|Asia/Beirut;Lesotho|LS|Africa/Maseru;Liberia|LR|Africa/Monrovia;Libya|LY|Africa/Tripoli;Liechtenstein|LI|Europe/Vaduz;Lithuania|LT|Europe/Vilnius;Luxembourg|LU|Europe/Luxembourg;Macao|MO|Asia/Macau;Madagascar|MG|Indian/Antananarivo;Malawi|MW|Africa/Blantyre;Malaysia|MY|Asia/Kuala_Lumpur;Maldives|MV|Indian/Maldives;Mali|ML|Africa/Bamako;Malta|MT|Europe/Malta;Marshall Islands|MH|Pacific/Majuro;Mauritania|MR|Africa/Nouakchott;Mauritius|MU|Indian/Mauritius;Mexico|MX|America/Mexico_City;Micronesia|FM|Pacific/Pohnpei;Moldova|MD|Europe/Chisinau;Monaco|MC|Europe/Monaco;Mongolia|MN|Asia/Ulaanbaatar;Montenegro|ME|Europe/Podgorica;Morocco|MA|Africa/Casablanca;Mozambique|MZ|Africa/Maputo;Myanmar|MM|Asia/Yangon;Namibia|NA|Africa/Windhoek;Nauru|NR|Pacific/Nauru;Nepal|NP|Asia/Kathmandu;Netherlands|NL|Europe/Amsterdam;New Zealand|NZ|Pacific/Auckland;Nicaragua|NI|America/Managua;Niger|NE|Africa/Niamey;Nigeria|NG|Africa/Lagos;North Korea|KP|Asia/Pyongyang;North Macedonia|MK|Europe/Skopje;Norway|NO|Europe/Oslo;Oman|OM|Asia/Muscat;Pakistan|PK|Asia/Karachi;Palau|PW|Pacific/Palau;Palestine|PS|Asia/Hebron;Panama|PA|America/Panama;Papua New Guinea|PG|Pacific/Port_Moresby;Paraguay|PY|America/Asuncion;Peru|PE|America/Lima;Philippines|PH|Asia/Manila;Poland|PL|Europe/Warsaw;Portugal|PT|Europe/Lisbon;Puerto Rico|PR|America/Puerto_Rico;Qatar|QA|Asia/Qatar;Romania|RO|Europe/Bucharest;Russia|RU|Europe/Moscow;Rwanda|RW|Africa/Kigali;Saint Kitts and Nevis|KN|America/St_Kitts;Saint Lucia|LC|America/St_Lucia;Saint Vincent and the Grenadines|VC|America/St_Vincent;Samoa|WS|Pacific/Apia;San Marino|SM|Europe/San_Marino;São Tomé and Príncipe|ST|Africa/Sao_Tome;Saudi Arabia|SA|Asia/Riyadh;Senegal|SN|Africa/Dakar;Serbia|RS|Europe/Belgrade;Seychelles|SC|Indian/Mahe;Sierra Leone|SL|Africa/Freetown;Singapore|SG|Asia/Singapore;Slovakia|SK|Europe/Bratislava;Slovenia|SI|Europe/Ljubljana;Solomon Islands|SB|Pacific/Guadalcanal;Somalia|SO|Africa/Mogadishu;South Africa|ZA|Africa/Johannesburg;South Korea|KR|Asia/Seoul;South Sudan|SS|Africa/Juba;Spain|ES|Europe/Madrid;Sri Lanka|LK|Asia/Colombo;Sudan|SD|Africa/Khartoum;Suriname|SR|America/Paramaribo;Sweden|SE|Europe/Stockholm;Switzerland|CH|Europe/Zurich;Syria|SY|Asia/Damascus;Taiwan|TW|Asia/Taipei;Tajikistan|TJ|Asia/Dushanbe;Tanzania|TZ|Africa/Dar_es_Salaam;Thailand|TH|Asia/Bangkok;Timor-Leste|TL|Asia/Dili;Togo|TG|Africa/Lome;Tonga|TO|Pacific/Tongatapu;Trinidad and Tobago|TT|America/Port_of_Spain;Tunisia|TN|Africa/Tunis;Türkiye|TR|Europe/Istanbul;Turkmenistan|TM|Asia/Ashgabat;Tuvalu|TV|Pacific/Funafuti;Uganda|UG|Africa/Kampala;Ukraine|UA|Europe/Kiev;United Arab Emirates|AE|Asia/Dubai;United Kingdom|GB|Europe/London;United States|US|America/New_York;Uruguay|UY|America/Montevideo;Uzbekistan|UZ|Asia/Tashkent;Vanuatu|VU|Pacific/Efate;Vatican City|VA|Europe/Vatican;Venezuela|VE|America/Caracas;Vietnam|VN|Asia/Ho_Chi_Minh;Yemen|YE|Asia/Aden;Zambia|ZM|Africa/Lusaka;Zimbabwe|ZW|Africa/Harare", ALIAS = {"America/Chicago":"US","America/Denver":"US","America/Los_Angeles":"US","America/Phoenix":"US","America/Anchorage":"US","Pacific/Honolulu":"US","America/Vancouver":"CA","America/Edmonton":"CA","America/Winnipeg":"CA","America/Halifax":"CA","America/Regina":"CA","America/St_Johns":"CA","Asia/Calcutta":"IN","Australia/Melbourne":"AU","Australia/Brisbane":"AU","Australia/Perth":"AU","Australia/Adelaide":"AU","Australia/Hobart":"AU","Australia/Darwin":"AU","Europe/Kyiv":"UA","Asia/Saigon":"VN","Asia/Rangoon":"MM","Asia/Katmandu":"NP","America/Buenos_Aires":"AR","Asia/Makassar":"ID","Asia/Jayapura":"ID","America/Manaus":"BR","America/Fortaleza":"BR","America/Recife":"BR","America/Bahia":"BR","America/Belem":"BR","America/Monterrey":"MX","America/Tijuana":"MX","America/Cancun":"MX","America/Mazatlan":"MX","America/Hermosillo":"MX","Asia/Yekaterinburg":"RU","Asia/Novosibirsk":"RU","Asia/Vladivostok":"RU","Europe/Samara":"RU","Asia/Krasnoyarsk":"RU","Asia/Irkutsk":"RU","Europe/Kaliningrad":"RU","Asia/Gaza":"PS","Asia/Qyzylorda":"KZ","Asia/Aqtobe":"KZ","Atlantic/Canary":"ES","Africa/Ceuta":"ES","Atlantic/Madeira":"PT","Atlantic/Azores":"PT","Africa/Lubumbashi":"CD","Pacific/Chatham":"NZ","America/Punta_Arenas":"CL","Pacific/Kiritimati":"KI","Asia/Urumqi":"CN","Asia/Kuching":"MY"};
  var EURO = "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES".split(" ");
  // Official store prices: [standard, ultimate, difference]
  var PRICE = {
    IN: ["₹5,999", "₹7,499", "₹1,500"], US: ["$79.99", "$99.99", "$20"], CA: ["C$109.99", "C$139.99", "C$30"],
    GB: ["£69.99", "£89.99", "£20"], EU: ["€79.99", "€99.99", "€20"], AU: ["A$129.95", "A$159.95", "A$30"], NZ: ["NZ$139.95", "NZ$174.95", "NZ$35"]
  };
  var Z = {}, LIST = [];
  RAW.split(";").forEach(function (r) { var a = r.split("|"); Z[a[1]] = { name: a[0], tz: a[2] }; LIST.push(a[1]); });
  LIST.sort(function (a, b) { return Z[a].name.localeCompare(Z[b].name); });
  var tz = "UTC";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
  function detect() { for (var cc in Z) if (Z[cc].tz === tz) return cc; return ALIAS[tz] || null; }
  var cc = null;
  try { cc = localStorage.getItem("gta6-country"); } catch (e) {}
  if (!cc || !Z[cc]) cc = detect();
  function flag(c) { return c && c !== "XK" ? String.fromCodePoint.apply(null, c.split("").map(function (x) { return 0x1F1E6 + x.charCodeAt(0) - 65; })) : "🌐"; }
  function offsetAt(zone, t) {
    var p = {}; new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t;
  }
  function midnightIn(zone) { var b = Date.UTC(2026, 10, 19); var t = b - offsetAt(zone, b); return b - offsetAt(zone, t); }
  function priceKey(c) { return PRICE[c] ? c : EURO.indexOf(c) > -1 ? "EU" : null; }
  var fmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  var R = window.GTAR = {
    list: LIST, flag: flag, name: function (c) { return Z[c] ? Z[c].name : "your time zone"; },
    get cc() { return cc; },
    unlockAt: function (c) { c = c === undefined ? cc : c; var zone = c === "US" || c === "CA" ? "America/New_York" : Z[c] ? Z[c].tz : tz; try { return midnightIn(zone); } catch (e) { return Date.UTC(2026, 10, 19, 5); } },
    price: function (c) { c = c === undefined ? cc : c; var k = priceKey(c); return { known: !!k, p: PRICE[k || "US"] }; },
    set: function (c) { cc = c; try { localStorage.setItem("gta6-country", c); } catch (e) {} paint(); },
    paint: paint
  };
  function paint() {
    var pr = R.price(), at = R.unlockAt(), nm = cc ? flag(cc) + " " + R.name(cc) : "your time zone";
    var put = function (k, v) { document.querySelectorAll('[data-r="' + k + '"]').forEach(function (el) { el.textContent = v; }); };
    put("name", nm); put("country", cc ? R.name(cc) : "your country");
    put("std", pr.p[0]); put("ult", pr.p[1]); put("diff", pr.p[2]);
    put("unlock", fmt.format(new Date(at)));
    document.querySelectorAll('[data-r="note"]').forEach(function (el) { el.hidden = pr.known; });
    document.querySelectorAll("select[data-region-picker]").forEach(function (s) {
      if (!s.options.length) {
        LIST.forEach(function (c) { var o = document.createElement("option"); o.value = c; o.textContent = flag(c) + "  " + Z[c].name; s.appendChild(o); });
        s.addEventListener("change", function () { R.set(s.value); });
      }
      if (cc) s.value = cc;
    });
    document.querySelectorAll("[data-price-region]").forEach(function (el) { el.classList.toggle("me", el.getAttribute("data-price-region") === (priceKey(cc) || "")); });
    document.dispatchEvent(new CustomEvent("gta-region"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
})();
