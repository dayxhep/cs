(function () {
  var SCOPE = document;
  var enc = function (v) { return JSON.stringify(v == null ? "" : v); };
  var dec = function (a) { if (a == null) return ""; try { return JSON.parse(a); } catch { return a; } };

  function hydrate(el) {
    if (el.tagName === "TEXTAREA") {
      var v = dec(el.getAttribute("data-value")) || el.getAttribute("value");
      if (v != null) el.value = v;
      return;
    }
    if (el.tagName === "SELECT") {
      var raw = el.getAttribute("data-value");
      var fromData = dec(raw);
      var wanted = el.multiple ? (Array.isArray(fromData) ? fromData : []) : (fromData ?? el.value);
      var set = new Set(el.multiple ? wanted : [wanted]);
      Array.from(el.options).forEach(function (opt) { opt.selected = set.has(opt.value); });
      return;
    }
    if (el.type === "checkbox") {
      el.checked = el.getAttribute("data-checked") === "1" || el.hasAttribute("checked");
      if (el.hasAttribute("data-value")) el.value = dec(el.getAttribute("data-value"));
      return;
    }
    if (el.type === "radio") {
      el.checked = el.getAttribute("data-checked") === "1" || el.hasAttribute("checked");
      return;
    }
    if (el.type !== "file") {
      var v2 = el.hasAttribute("data-value") ? dec(el.getAttribute("data-value")) : el.getAttribute("value");
      if (v2 != null) el.value = v2;
    }
  }

  function persist(el) {
    if (el.tagName === "TEXTAREA") {
      el.setAttribute("data-value", enc(el.value));
      el.setAttribute("value", el.value);
      return;
    }
    if (el.tagName === "SELECT") {
      var selected = Array.from(el.selectedOptions).map(function (o) { return o.value; });
      var val = el.multiple ? selected : (selected[0] || "");
      el.setAttribute("data-value", enc(val));
      Array.from(el.options).forEach(function (opt) {
        if (opt.selected) opt.setAttribute("selected", "");
        else opt.removeAttribute("selected");
      });
      return;
    }
    if (el.type === "checkbox") {
      if (el.checked) el.setAttribute("checked", "");
      else el.removeAttribute("checked");
      if (el.checked) el.setAttribute("data-checked", "1"); else el.removeAttribute("data-checked");
      el.setAttribute("data-value", enc(el.value));
      return;
    }
    if (el.type === "radio") {
      if (el.name) {
        SCOPE.querySelectorAll('input[type="radio"][name="' + CSS.escape(el.name) + '"]').forEach(function (r) {
          r.removeAttribute("data-checked"); r.removeAttribute("checked");
        });
      }
      if (el.checked) { el.setAttribute("data-checked", "1"); el.setAttribute("checked", ""); }
      return;
    }
    if (el.type !== "file") {
      el.setAttribute("data-value", enc(el.value));
      el.setAttribute("value", el.value);
    }
  }

  function attach(el) {
    if (!(el instanceof Element)) return;
    if (!el.matches("input, textarea, select")) return;
    hydrate(el);
    var h = function () { persist(el); };
    el.addEventListener("input", h);
    el.addEventListener("change", h);
  }

  function init() {
    SCOPE.querySelectorAll("input, textarea, select").forEach(attach);
    new MutationObserver(function (muts) {
      for (var m of muts) {
        m.addedNodes.forEach(function (n) {
          if (!(n instanceof Element)) return;
          if (n.matches("input, textarea, select")) attach(n);
          n.querySelectorAll && n.querySelectorAll("input, textarea, select").forEach(attach);
        });
      }
    }).observe(SCOPE, { childList: true, subtree: true });
  }

  // API minimale si besoin
  window.FormAutosave = {
    init: init,
    snapshot: function () { SCOPE.querySelectorAll("input, textarea, select").forEach(persist); }
  };

  // auto-init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
