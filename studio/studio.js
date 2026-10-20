/* Signature Studio — live preview, customization, and export.
 * Plain browser JS; depends on ../signature.config.js and ../src/signature.js. */
(function () {
  "use strict";

  var R = window.SignatureRenderer;
  var DEFAULTS = window.SIGNATURE_CONFIG;
  var STORE = "signature-studio.v1";
  var VARIANT_DESC = {
    D: "Neon scarlet/blue HUD card for Outlook: perception-style portrait, roles grid, EcoCAR, leadership, buttons.",
    A: "Recruiter-ready. Name, identity, two leadership roles, school, links.",
    B: "Every leadership role on its own line, for engineering and research contacts.",
    C: "Monogram, tracked caps, and an accent trace, for founders and conferences.",
  };

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  // ---------- state ----------
  var BASELINE = JSON.stringify(DEFAULTS);
  var state = load();
  // URL overrides, e.g. ?variant=B&view=all&bg=invert&width=mobile (used by scripts/screenshots.mjs).
  new URLSearchParams(location.search).forEach(function (val, key) {
    if (["variant", "view", "bg", "width"].indexOf(key) !== -1) state[key] = val;
  });
  function load() {
    var base = { config: clone(DEFAULTS), variant: "D", view: "thread", bg: "light", width: "desktop" };
    try {
      var saved = JSON.parse(localStorage.getItem(STORE) || "null");
      // Edits made against an older config file are dropped so file changes always show up.
      if (saved && saved.config && saved.baseline === BASELINE) return Object.assign(base, saved);
    } catch (e) { /* private mode or corrupt — use defaults */ }
    return base;
  }
  function save() {
    state.baseline = BASELINE;
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* quota (large uploads) */ }
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var keys = path.split("."), last = keys.pop();
    keys.reduce(function (o, k) { return o[k]; }, obj)[last] = value;
  }

  // Preview resolves assets relative to the repo root; export uses the hosted base URL.
  var LOCAL_BASE = new URL("../", location.href).href;
  function renderPreview(v, extra) {
    return R.render(state.config, v || state.variant, Object.assign({ assetBase: LOCAL_BASE }, extra));
  }
  function renderExport(v) { return R.render(state.config, v || state.variant); }

  // ---------- panel ----------
  function buildVariantSeg() {
    var seg = $("#variant-seg");
    seg.innerHTML = "";
    R.variants.forEach(function (v) {
      var b = document.createElement("button");
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(v === state.variant));
      b.textContent = v + " · " + state.config.variants[v].label.split(" ")[0];
      b.title = state.config.variants[v].label;
      b.onclick = function () { state.variant = v; refresh(); };
      seg.appendChild(b);
    });
    $("#variant-desc").textContent = state.config.variants[state.variant].label + ". " + VARIANT_DESC[state.variant];
  }

  function buildAvatarSeg() {
    var seg = $("#avatar-seg"), cur = state.config.variants[state.variant].avatar;
    seg.innerHTML = "";
    [["headshot", "Headshot"], ["monogram", "DN monogram"], ["none", "None"]].forEach(function (o) {
      var b = document.createElement("button");
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(cur === o[0]));
      b.textContent = o[1];
      b.onclick = function () { state.config.variants[state.variant].avatar = o[0]; refresh(); };
      seg.appendChild(b);
    });
  }

  function toggleIn(list, v, on) {
    var i = list.indexOf(v);
    if (on && i === -1) list.push(v);
    if (!on && i !== -1) list.splice(i, 1);
  }

  function buildRoles() {
    var ul = $("#roles"), v = state.variant;
    ul.innerHTML = "";
    var active = 0;
    state.config.roles.forEach(function (r) {
      var on = r.variants.indexOf(v) !== -1;
      if (on) active++;
      var li = document.createElement("li");
      li.innerHTML = '<input type="checkbox" id="role-' + r.id + '"' + (on ? " checked" : "") + '>' +
        '<label class="t" for="role-' + r.id + '"><b></b><span></span></label>';
      li.querySelector("b").textContent = r.org;
      li.querySelector("span").textContent = r.role + (r.group === "student" ? " · student org" : "");
      li.querySelector("input").onchange = function (e) { toggleIn(r.variants, v, e.target.checked); refresh(); };
      ul.appendChild(li);
    });
    $("#roles-count").textContent = active + " shown" + (v === "A" && active > 2 ? " · A shows the first 2" : "");
  }

  function buildLogos() {
    var ul = $("#logos"), v = state.variant;
    ul.innerHTML = "";
    state.config.logos.forEach(function (l) {
      var has = !!l.src, on = has && l.variants.indexOf(v) !== -1;
      var li = document.createElement("li");
      li.innerHTML = '<input type="checkbox" id="logo-' + l.id + '"' + (on ? " checked" : "") + (has ? "" : " disabled") + '>' +
        '<label class="t" for="logo-' + l.id + '"><b></b><span></span></label>' +
        '<label class="file">' + (has ? "Replace" : "Add file") + '<input type="file" accept="image/png,image/jpeg"></label>';
      li.querySelector("b").textContent = l.name;
      var note = li.querySelector("span");
      if (!has) { note.textContent = "No official file yet"; note.className = "missing"; }
      else if (/^data:/.test(l.src)) note.textContent = "Uploaded · preview only until hosted";
      else note.textContent = l.src.split("/").pop();
      li.querySelector('input[type="checkbox"]').onchange = function (e) { toggleIn(l.variants, v, e.target.checked); refresh(); };
      li.querySelector('input[type="file"]').onchange = function (e) {
        readImage(e.target.files[0], function (url, w, h) {
          l.src = url; l.width = w; l.heightPx = h;
          toggleIn(l.variants, v, true);
          refresh();
        });
      };
      ul.appendChild(li);
    });
  }

  function readImage(file, done) {
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () { done(fr.result, im.naturalWidth, im.naturalHeight); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  function bindInputs() {
    $$("[data-bind]").forEach(function (el) {
      el.value = getPath(state.config, el.dataset.bind) || "";
      el.oninput = function () {
        setPath(state.config, el.dataset.bind, el.value.trim() ? el.value : "");
        renderStage();
        updateContrast();
        save();
      };
    });
    $$("[data-upload]").forEach(function (el) {
      el.onchange = function (e) {
        readImage(e.target.files[0], function (url) {
          state.config.images[el.dataset.upload] = url;
          state.config.variants[state.variant].avatar = el.dataset.upload;
          refresh();
          toast("Previewing upload. Host the file before using this signature in real email.");
        });
      };
    });
  }

  // WCAG contrast of the link color on white — cyan accents are decorative, links must stay legible.
  function luminance(hex) {
    var c = hex.replace("#", "").match(/../g).map(function (x) {
      x = parseInt(x, 16) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function updateContrast() {
    var hint = $("#contrast-hint"), link = state.config.theme.link;
    if (!/^#[0-9a-f]{6}$/i.test(link)) return;
    var ratio = 1.05 / (luminance(link) + 0.05);
    hint.textContent = "Link contrast on white: " + ratio.toFixed(1) + ":1" + (ratio < 4.5 ? " (below 4.5:1, so choose a darker link color)" : " ✓");
    hint.className = "hint" + (ratio < 4.5 ? " warn" : "");
  }

  // ---------- stage ----------
  function mailThread(sigHtml) {
    var p = state.config.person, k = state.config.contact;
    var photo = state.config.images.headshot;
    var avatarUrl = photo ? (/^(data:|https?:)/.test(photo) ? photo : LOCAL_BASE + photo) : "";
    var div = document.createElement("div");
    div.className = "mail" + (state.width === "mobile" ? " mobile" : "");
    div.innerHTML =
      '<div class="mail-head"><h2 class="mail-subject">Re: Perception &amp; planning stack: architecture notes</h2>' +
      '<div class="mail-from"><div class="dot"></div><div><b class="from-name"></b> <span class="from-mail"></span><br><span>to Engineering Team · 10:42 AM</span></div></div></div>' +
      '<div class="mail-body">' +
      "<p>Hi all,</p>" +
      "<p>Thank you for the conversation yesterday. I’ve attached a short write-up of the sensor-fusion and localization pipeline we discussed, along with the repository link and current benchmark results.</p>" +
      "<p>I’m happy to walk through the architecture or set up a working session whenever suits your team.</p>" +
      "<p>Best regards,</p>" +
      '<div class="sig"></div>' +
      '<div class="mail-quote">On Mon, Oct 19 the Engineering Team wrote:<br>Thanks for presenting today. Could you share more detail on the localization approach?</div>' +
      "</div>";
    div.querySelector(".from-name").textContent = p.name;
    div.querySelector(".from-mail").textContent = k.email ? "<" + k.email + ">" : "";
    if (avatarUrl) div.querySelector(".dot").style.backgroundImage = 'url("' + avatarUrl + '")';
    div.querySelector(".sig").innerHTML = sigHtml;
    return div;
  }

  function allVariants() {
    var wrap = document.createElement("div");
    wrap.className = "cards" + (state.width === "mobile" ? " mobile" : "");
    R.variants.forEach(function (v) {
      var card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-current", String(v === state.variant));
      card.innerHTML = "<h3></h3><div class=\"sig\"></div>";
      card.querySelector("h3").textContent = "Variant " + v + " — " + state.config.variants[v].label;
      card.querySelector(".sig").innerHTML = renderPreview(v);
      card.onclick = card.onkeydown = function (e) {
        if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
        state.variant = v; refresh();
      };
      wrap.appendChild(card);
    });
    return wrap;
  }

  function renderStage() {
    var canvas = $("#canvas");
    canvas.innerHTML = "";
    canvas.appendChild(state.view === "all" ? allVariants() : mailThread(renderPreview()));
    document.body.classList.remove("bg-light", "bg-invert", "bg-raw");
    document.body.classList.add("bg-" + state.bg);
    updateStatus();
  }

  var assetCache = {};
  function updateStatus() {
    var html = renderExport();
    var n = html.length, cc = $("#char-count");
    cc.textContent = n.toLocaleString() + " / " + R.GMAIL_LIMIT.toLocaleString() + " characters (Gmail limit)";
    cc.className = n > R.GMAIL_LIMIT ? "bad" : "";

    var srcs = (html.match(/src="[^"]+"/g) || []).map(function (s) { return s.slice(5, -1).replace(/&amp;/g, "&"); });
    var embedded = srcs.filter(function (s) { return /^data:/.test(s); }).length;
    var hosted = srcs.filter(function (s) { return /^https?:/.test(s); });
    var el = $("#asset-status");
    if (embedded) {
      el.textContent = embedded + " uploaded image(s) are embedded. Host them before copying, because Gmail strips embedded images.";
      el.className = "bad";
      return;
    }
    if (!hosted.length) { el.textContent = "No images in this variant"; el.className = ""; return; }
    Promise.all(hosted.map(checkImage)).then(function (res) {
      var ok = res.filter(Boolean).length;
      if (ok === hosted.length) {
        el.textContent = "All " + ok + " hosted images reachable ✓";
        el.className = "ok";
      } else {
        el.textContent = (hosted.length - ok) + " of " + hosted.length + " hosted images not reachable yet. Push assets/ to GitHub Pages.";
        el.className = "bad";
      }
    });
  }
  function checkImage(url) {
    if (assetCache[url] !== undefined) return Promise.resolve(assetCache[url]);
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(assetCache[url] = true); };
      im.onerror = function () { resolve(assetCache[url] = false); };
      im.src = url;
    });
  }

  function syncToolbar() {
    $$("#view-seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.view === state.view)); });
    $$("#bg-seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.bg === state.bg)); });
    $$("#width-seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.width === state.width)); });
  }

  function refresh() {
    buildVariantSeg();
    buildAvatarSeg();
    buildRoles();
    buildLogos();
    syncToolbar();
    renderStage();
    updateContrast();
    save();
  }

  // ---------- export ----------
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function copyRich(html, text) {
    if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
      return navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      })]).then(function () { return true; }, function () { return copyViaSelection(html); });
    }
    return Promise.resolve(copyViaSelection(html));
  }
  // Fallback for file:// and older browsers: select rendered nodes and copy.
  function copyViaSelection(html) {
    var box = document.createElement("div");
    box.contentEditable = "true";
    box.style.cssText = "position:fixed;left:-10000px;top:0;background:#fff;";
    box.innerHTML = html;
    document.body.appendChild(box);
    var range = document.createRange();
    range.selectNodeContents(box);
    var sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    sel.removeAllRanges();
    box.remove();
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; });
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    var ok = document.execCommand("copy");
    ta.remove();
    return Promise.resolve(ok);
  }

  function download(name, content, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type: type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function slug() {
    var label = state.config.variants[state.variant].label.toLowerCase().replace(/[^a-z]+/g, "-");
    return "signature-" + state.variant.toLowerCase() + "-" + label;
  }

  function toDataUrl(url) {
    if (/^data:/.test(url)) return Promise.resolve(url);
    return fetch(url).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(b); });
    });
  }

  // Review image only: rasterizes the preview via SVG <foreignObject>. Never use the PNG as the signature itself.
  function exportPng() {
    var dark = state.bg !== "light";
    var holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-10000px;top:0;display:inline-block;box-sizing:border-box;padding:28px 32px;background:" + (dark ? "#1f1f1f" : "#ffffff");
    holder.innerHTML = renderPreview();
    if (state.bg === "invert") holder.firstChild.style.filter = "invert(1) hue-rotate(180deg)";
    document.body.appendChild(holder);
    var imgs = $$("img", holder);
    Promise.all(imgs.map(function (im) {
      return toDataUrl(im.src).then(function (d) {
        im.src = d;
        if (state.bg === "invert") im.style.filter = "invert(1) hue-rotate(180deg)";
      });
    })).then(function () {
      // Pin the measured size (plus a pixel of slack) so text cannot rewrap inside the SVG.
      var box = holder.getBoundingClientRect();
      var w = Math.ceil(box.width) + 2, h = Math.ceil(box.height);
      holder.style.width = w + "px";
      var xml = new XMLSerializer().serializeToString(holder);
      holder.remove();
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject x="0" y="0" width="100%" height="100%">' +
        xml.replace("position: fixed; left: -10000px; top: 0px;", "") + "</foreignObject></svg>";
      var im = new Image();
      im.onload = function () {
        var scale = 2, c = document.createElement("canvas");
        c.width = w * scale; c.height = h * scale;
        var ctx = c.getContext("2d");
        ctx.scale(scale, scale);
        ctx.drawImage(im, 0, 0);
        c.toBlob(function (b) { download(slug() + "-preview.png", b); toast("Preview PNG downloaded"); });
      };
      im.onerror = function () { toast("PNG export failed. Try npm run screenshots instead."); };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }).catch(function () {
      holder.remove();
      toast("PNG export needs the Studio served over http (npm run studio).");
    });
  }

  function exportConfig() {
    var body = JSON.stringify(state.config, null, 2);
    if (/"data:/.test(body)) toast("Note: uploaded images are embedded as data URLs. Replace them with hosted paths.");
    var js = "/*\n * Signature configuration — exported from Signature Studio.\n * Replace signature.config.js with this file, then run `npm run build`.\n */\n" +
      "(function (root, factory) {\n  if (typeof module === \"object\" && module.exports) module.exports = factory();\n" +
      "  else root.SIGNATURE_CONFIG = factory();\n})(typeof self !== \"undefined\" ? self : this, function () {\n  return " +
      body.replace(/\n/g, "\n  ") + ";\n});\n";
    download("signature.config.js", js, "text/javascript");
  }

  function wireActions() {
    $("#copy-rich").onclick = function () {
      copyRich(renderExport(), R.renderText(state.config, state.variant)).then(function (ok) {
        toast(ok ? "Copied. Paste into Gmail → Settings → Signature" : "Copy failed. Use Download .html instead");
      });
    };
    $("#copy-html").onclick = function () {
      copyText(renderExport()).then(function (ok) { toast(ok ? "Raw HTML copied" : "Copy failed"); }, function () { toast("Copy failed"); });
    };
    $("#download-html").onclick = function () {
      download(slug() + ".html", R.standalone(state.config, state.variant), "text/html");
    };
    $("#export-png").onclick = exportPng;
    $("#export-config").onclick = exportConfig;
    $("#reset").onclick = function () {
      if (!confirm("Discard Studio edits and reload signature.config.js?")) return;
      state.config = clone(DEFAULTS);
      bindInputs();
      refresh();
      toast("Reset to config file");
    };
    $$("#view-seg button").forEach(function (b) { b.onclick = function () { state.view = b.dataset.view; refresh(); }; });
    $$("#bg-seg button").forEach(function (b) { b.onclick = function () { state.bg = b.dataset.bg; refresh(); }; });
    $$("#width-seg button").forEach(function (b) { b.onclick = function () { state.width = b.dataset.width; refresh(); }; });
    $$(".tabs button").forEach(function (b) {
      b.onclick = function () {
        $$(".tabs button").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
        $("#tab-design").hidden = b.dataset.tab !== "design";
        $("#tab-install").hidden = b.dataset.tab !== "install";
      };
    });
    $("#guide-base").textContent = state.config.assetBaseUrl;
  }

  bindInputs();
  wireActions();
  refresh();
})();
