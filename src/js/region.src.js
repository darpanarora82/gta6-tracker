/* Region: works out the visitor's country from the device's time zone (no IP lookup),
   remembers a manual choice, and fills in prices and unlock times on the page. */
(function () {
  "use strict";
  var RAW = "__RAW__", ALIAS = __ALIAS__;
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
