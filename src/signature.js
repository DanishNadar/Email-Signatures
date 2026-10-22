/*
 * Email signature renderer — shared by the Studio (browser) and scripts/build.mjs (Node).
 *
 * Output is deliberately old-school: nested tables, inline styles, explicit
 * image dimensions, no <style> blocks, flexbox, SVG, or background images.
 * That is what survives Gmail's signature editor and Outlook's Word engine.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SignatureRenderer = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FONT = "Arial, Helvetica, sans-serif";
  var GMAIL_LIMIT = 10000; // Gmail rejects signatures longer than 10,000 characters.

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inVariant(item, v) {
    return item.variants && item.variants.indexOf(v) !== -1;
  }

  function prettyUrl(url) {
    return String(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }

  // Base text style: every cell restates the font because Outlook does not
  // reliably inherit it into nested tables.
  function txt(size, lineHeight, color, extra) {
    return "font-family:" + FONT + ";font-size:" + size + "px;line-height:" + lineHeight +
      "px;color:" + color + ";mso-line-height-rule:exactly;" + (extra || "");
  }

  function makeCtx(config, variant, opts) {
    opts = opts || {};
    var base = opts.assetBase != null ? opts.assetBase : config.assetBaseUrl || "";
    return {
      c: config,
      v: variant,
      t: config.theme,
      asset: function (path) {
        if (!path) return "";
        if (opts.blockImages) return "blocked-image-" + Math.random().toString(36).slice(2) + ".png";
        if (/^(https?:|data:|blob:)/.test(path)) return path;
        return base + path;
      },
    };
  }

  // ---------- building blocks ----------

  function nowrap(html) {
    return '<span style="white-space:nowrap;">' + html + "</span>";
  }

  function sep(ctx, ch) {
    return ' <span style="color:' + (ctx.t.separator || ctx.t.muted) + ';">' + (ch || "|") + "</span> ";
  }

  function link(ctx, href, label, extra) {
    return '<a href="' + esc(href) + '" target="_blank" style="color:' + ctx.t.link +
      ";text-decoration:none;" + (extra || "") + '">' + label + "</a>";
  }

  function img(ctx, src, w, h, alt, extra) {
    return '<img src="' + esc(ctx.asset(src)) + '" width="' + w + '" height="' + h + '" alt="' + esc(alt) +
      '" style="display:block;width:' + w + "px;height:" + h + "px;max-width:" + w +
      "px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" +
      "font-family:" + FONT + ";font-size:10px;color:" + ctx.t.muted + ";" + (extra || "") + '">';
  }

  // Solid bar built from table cells (renders in Outlook, unlike borders on divs).
  function bar(segments) {
    var cells = segments.map(function (s) {
      return '<td width="' + s.w + '" height="' + s.h + '" bgcolor="' + (s.color || "") + '" style="width:' + s.w +
        "px;height:" + s.h + "px;" + (s.color ? "background-color:" + s.color + ";" : "") +
        'font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>';
    });
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' +
      cells.join("") + "</tr></table>";
  }

  function avatar(ctx) {
    var mode = (ctx.c.variants[ctx.v] || {}).avatar || "headshot";
    if (mode === "none") return null;
    if (mode === "monogram" && ctx.c.images.monogram) {
      return img(ctx, ctx.c.images.monogram, 64, 64, "DN", "border-radius:13px;");
    }
    if (ctx.c.images.headshot) {
      return img(ctx, ctx.c.images.headshot, 80, 80, ctx.c.person.name, "border-radius:40px;");
    }
    return null;
  }

  function roleLine(ctx, r, short) {
    var org = short ? r.orgShort || r.org : r.org;
    var orgHtml = '<b style="color:' + ctx.t.slate + ';font-weight:bold;">' + esc(org) + "</b>";
    if (r.url) orgHtml = link(ctx, r.url, orgHtml, "color:" + ctx.t.slate + ";");
    // Two nowrap units so a narrow screen breaks between role and organization.
    return nowrap(esc(r.role) + ",") + " " + nowrap(orgHtml);
  }

  function rolesFor(ctx) {
    return ctx.c.roles.filter(function (r) { return inVariant(r, ctx.v); });
  }

  function educationLine(ctx, schoolKey, withMinor, shortProgram) {
    var e = ctx.c.education;
    var parts = [];
    var program = (shortProgram && e.programShort) || e.program;
    if (e[schoolKey]) parts.push(nowrap(esc(e[schoolKey])));
    if (program) parts.push(nowrap(esc(program) + (e.classYear ? " " + esc(e.classYear) : "")));
    if (withMinor && e.minor) parts.push(nowrap(esc(e.minor)));
    return parts.join(sep(ctx, "&middot;"));
  }

  // Text links with readable labels; the email address is shown in full so it
  // survives copy, forwarding, and blocked images.
  function linksLine(ctx) {
    var k = ctx.c.contact;
    var items = [];
    if (k.email) items.push(link(ctx, "mailto:" + k.email, esc(k.email)));
    if (k.email2) items.push(link(ctx, "mailto:" + k.email2, esc(k.email2)));
    if (k.phone) items.push(link(ctx, "tel:" + k.phone.replace(/[^+\d]/g, ""), esc(k.phone)));
    if (k.linkedin) items.push(link(ctx, k.linkedin, "LinkedIn"));
    if (k.github) items.push(link(ctx, k.github, "GitHub"));
    if (k.portfolio) items.push(link(ctx, k.portfolio, "Portfolio"));
    if (k.website) items.push(link(ctx, k.website, esc(k.websiteLabel || prettyUrl(k.website))));
    if (k.booking) items.push(link(ctx, k.booking, "Book a meeting"));
    return items.map(nowrap).join(sep(ctx));
  }

  function logosRow(ctx) {
    var logos = ctx.c.logos.filter(function (l) { return l.src && inVariant(l, ctx.v); });
    if (!logos.length) return "";
    var cells = logos.map(function (l, i) {
      var h = l.height || 20;
      var w = l.width && l.heightPx ? Math.round((h * l.width) / l.heightPx) : h;
      var mark = img(ctx, l.src, w, h, l.alt || l.name);
      if (l.url) mark = '<a href="' + esc(l.url) + '" target="_blank" style="text-decoration:none;">' + mark + "</a>";
      var pad = i === 0 ? "0" : "0 0 0 14px";
      var divider = i === 0 ? "" :
        '<td valign="middle" style="padding:0 0 0 14px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td width="1" height="16" bgcolor="' + ctx.t.rule + '" style="width:1px;height:16px;background-color:' + ctx.t.rule +
        ';font-size:0;line-height:0;">&nbsp;</td></tr></table></td>';
      return divider + '<td valign="middle" style="padding:' + pad + ';">' + mark + "</td>";
    });
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' +
      cells.join("") + "</tr></table>";
  }

  function row(content, style) {
    return '<tr><td style="' + (style || "") + '">' + content + "</td></tr>";
  }

  function stack(rows) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
      rows.join("") + "</table>";
  }

  function frame(ctx, left, right, opts) {
    opts = opts || {};
    var html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" ' +
      'style="border-collapse:collapse;font-family:' + FONT + ';"><tr>';
    if (left) {
      html += '<td valign="top" width="' + opts.leftWidth + '" style="width:' + opts.leftWidth + "px;padding:" +
        (opts.leftPad || "2px 18px 0 0") + ';">' + left + "</td>";
      html += '<td width="' + (opts.ruleWidth || 1) + '" bgcolor="' + opts.ruleColor + '" style="width:' +
        (opts.ruleWidth || 1) + "px;background-color:" + opts.ruleColor + ';font-size:0;line-height:0;">&nbsp;</td>';
    }
    html += '<td valign="top" style="padding:0 0 0 ' + (left ? 18 : 0) + 'px;">' + right + "</td>";
    return html + "</tr></table>";
  }

  // ---------- variants ----------

  // A — Executive Minimal: name, identity, two leadership roles, school, links.
  function variantA(ctx) {
    var p = ctx.c.person, t = ctx.t;
    var roles = rolesFor(ctx).slice(0, 2);
    var rows = [
      row(esc(p.name), txt(20, 24, t.ink, "font-weight:bold;letter-spacing:0.2px;white-space:nowrap;")),
      row(nowrap(esc(p.title)) + (p.specialty ? sep(ctx) + esc(p.specialty) : ""),
        txt(12.5, 18, t.slate, "padding:2px 0 0 0;")),
      row(bar([{ w: 24, h: 2, color: t.accent }]), "padding:9px 0 8px 0;font-size:0;line-height:0;"),
    ];
    if (roles.length) {
      rows.push(row(roles.map(function (r) { return roleLine(ctx, r); }).join(sep(ctx, "&middot;")),
        txt(11, 17, t.muted)));
    }
    rows.push(row(educationLine(ctx, "school", false), txt(11, 17, t.muted)));
    rows.push(row(linksLine(ctx), txt(11, 17, t.muted, "padding:8px 0 0 0;")));
    var logos = logosRow(ctx);
    if (logos) rows.push(row(logos, "padding:11px 0 0 0;"));
    return frame(ctx, avatar(ctx), stack(rows), { leftWidth: 80, ruleColor: t.rule });
  }

  // B — Technical Leadership: every active role on its own line.
  function variantB(ctx) {
    var p = ctx.c.person, t = ctx.t;
    var rows = [
      row(esc(p.name), txt(20, 24, t.ink, "font-weight:bold;letter-spacing:0.2px;white-space:nowrap;")),
      row(nowrap(esc(p.title)) + (p.specialty ? sep(ctx) + esc(p.specialty) : ""),
        txt(12.5, 18, t.slate, "padding:2px 0 0 0;")),
      row(educationLine(ctx, "schoolShort", true, true), txt(11, 17, t.muted, "padding:1px 0 0 0;")),
      row(bar([{ w: 24, h: 2, color: t.accent }]), "padding:9px 0 7px 0;font-size:0;line-height:0;"),
    ];
    rolesFor(ctx).forEach(function (r) {
      rows.push(row(roleLine(ctx, r), txt(11, 17, t.muted)));
    });
    rows.push(row(linksLine(ctx), txt(11, 17, t.muted, "padding:8px 0 0 0;")));
    var logos = logosRow(ctx);
    if (logos) rows.push(row(logos, "padding:11px 0 0 0;"));
    return frame(ctx, avatar(ctx), stack(rows), { leftWidth: 80, ruleColor: t.rule });
  }

  // C — Personal Brand: monogram, tracked caps, accent rail, trace motif.
  function variantC(ctx) {
    var p = ctx.c.person, e = ctx.c.education, t = ctx.t;
    var roles = rolesFor(ctx);
    var identity = esc(p.title.toUpperCase()) +
      (p.specialty ? " &middot; " + esc(p.specialty.replace(/Machine Learning/i, "ML").toUpperCase()) : "");
    var rows = [
      row(esc(p.name).toUpperCase(), txt(19, 23, t.ink, "font-weight:bold;letter-spacing:2px;white-space:nowrap;")),
      row(identity, txt(10, 15, t.link, "font-weight:bold;letter-spacing:1.2px;padding:3px 0 0 0;")),
    ];
    var detail = roles.map(function (r) { return roleLine(ctx, r, true); });
    rows.push(row(detail.join(sep(ctx, "&middot;")), txt(11, 17, t.muted, "padding:9px 0 0 0;")));
    var place = [];
    if (e.schoolShort) place.push(nowrap(esc(e.schoolShort) + (e.classYear ? " " + esc(e.classYear) : "")));
    if (p.location) place.push(nowrap(esc(p.location)));
    if (place.length) rows.push(row(place.join(sep(ctx, "&middot;")), txt(11, 17, t.muted)));
    rows.push(row(linksLine(ctx), txt(11, 17, t.muted, "padding:7px 0 0 0;")));
    rows.push(row(bar([
      { w: 36, h: 2, color: t.accent },
      { w: 4, h: 2 },
      { w: 8, h: 2, color: t.crimson },
      { w: 4, h: 2 },
      { w: 160, h: 1, color: t.rule },
    ]), "padding:12px 0 0 0;font-size:0;line-height:0;"));
    var logos = logosRow(ctx);
    if (logos) rows.push(row(logos, "padding:10px 0 0 0;"));
    var left = avatar(ctx);
    return frame(ctx, left, stack(rows), {
      leftWidth: left && left.indexOf('width="64"') !== -1 ? 64 : 80,
      leftPad: "1px 18px 0 0",
      ruleColor: t.accent,
      ruleWidth: 2,
    });
  }

  // D — Flagship HUD: a dark card in neon scarlet / electric blue. Perception-style
  // portrait beside the identity; a 3-column roles grid sweeping scarlet → violet →
  // blue; grouped student leadership; contact, buttons, and wordmark along the bottom.
  // Everything decorative is a solid bgcolor or a PNG, so it holds up in Outlook.
  function hudButton(ctx, href, label, bg, fg, border, stacked) {
    if (stacked) {
      return '<tr><td align="center" bgcolor="' + bg + '" style="background-color:' + bg + ";border:1px solid " + (border || bg) +
        ';border-radius:4px;mso-padding-alt:6px 0;">' +
        '<a href="' + esc(href) + '" target="_blank" style="display:block;padding:6px 0;' +
        txt(9, 12, fg, "font-weight:bold;letter-spacing:1.2px;text-decoration:none;text-align:center;white-space:nowrap;") +
        '">' + label + "</a></td></tr>" +
        '<tr><td height="6" style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>';
    }
    return '<td align="center" bgcolor="' + bg + '" style="background-color:' + bg + ";border:1px solid " + (border || bg) +
      ';border-radius:4px;mso-padding-alt:5px 11px;">' +
      '<a href="' + esc(href) + '" target="_blank" style="display:inline-block;padding:5px 11px;' +
      txt(9, 12, fg, "font-weight:bold;letter-spacing:1.2px;text-decoration:none;white-space:nowrap;") +
      '">' + label + "</a></td>";
  }

  // Each tag is a left-floated table (align="left" floats in every client,
  // Outlook included), so tags wrap onto a new line when the card narrows.
  function hudTag(text, color) {
    return '<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" style="float:left;"><tr>' +
      '<td style="padding:0 5px 5px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td style="border:1px solid ' + color + ";border-radius:3px;padding:2px 6px;" +
      txt(8.5, 12, color, "font-weight:bold;letter-spacing:1px;white-space:nowrap;") + '">' + esc(text.toUpperCase()) +
      "</td></tr></table></td></tr></table>";
  }

  // Role cell: accent bar, the org's logo tile (or its initials as plain text when
  // no official logo exists), then role and organization.
  function hudCell(ctx, h, item, color) {
    var T = 34;
    var org = esc(item.org);
    if (item.url) org = link(ctx, item.url, org, "color:" + h.muted + ";");
    var mark = item.logo ? img(ctx, item.logo, T, T, item.org, "border-radius:7px;") :
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="' + T + '" height="' + T +
      '" align="center" valign="middle" bgcolor="' + h.line + '" style="width:' + T + "px;height:" + T + "px;background-color:" + h.line +
      ";border-radius:7px;" + txt(9, 11, h.muted, "font-weight:bold;letter-spacing:0.5px;") + '">' +
      esc((item.orgShort || item.org).replace(/[^A-Za-z ]/g, "").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 3).toUpperCase()) +
      "</td></tr></table>";
    if (item.logo && item.url) mark = '<a href="' + esc(item.url) + '" target="_blank" style="text-decoration:none;">' + mark + "</a>";
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' +
      '<td width="2" bgcolor="' + color + '" style="width:2px;background-color:' + color + ';font-size:0;line-height:0;">&nbsp;</td>' +
      '<td valign="middle" width="' + T + '" style="width:' + T + 'px;padding:0 0 0 7px;">' + mark + "</td>" +
      '<td valign="middle" style="padding:0 0 0 8px;">' +
      '<span style="' + txt(10, 13, h.text, "font-weight:bold;") + '">' + esc(item.role) + "</span><br>" +
      '<span style="' + txt(9, 12, h.muted) + '">' + org + "</span></td></tr></table>";
  }

  function mix(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var ch = function (sh) { return Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k); };
    return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1).toUpperCase();
  }

  // Gradient approximated by 20 solid cells at 5% each: stretches with the card,
  // unlike an image (Outlook ignores percentage widths on <img>).
  function sweepBar(stops, height) {
    var n = 20, cells = "";
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1) * (stops.length - 1), seg = Math.min(Math.floor(t), stops.length - 2);
      var col = mix(stops[seg], stops[seg + 1], t - seg);
      cells += '<td width="5%" height="' + height + '" bgcolor="' + col + '" style="width:5%;height:' + height +
        "px;background-color:" + col + ';font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>';
    }
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>' +
      cells + "</tr></table>";
  }

  function hudRule(h, pad) {
    return row('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' +
      '<td height="1" bgcolor="' + h.line + '" style="height:1px;background-color:' + h.line + ';font-size:0;line-height:0;">&nbsp;</td></tr></table>',
      "padding:" + pad + ";font-size:0;line-height:0;");
  }

  function variantD(ctx) {
    var c = ctx.c, p = c.person, e = c.education, k = c.contact, h = c.hud;
    var W = h.width || 720, PAD = 20, PIC = 112;
    var roles = rolesFor(ctx);
    var student = roles.filter(function (r) { return r.group === "student"; });
    var cells = roles.filter(function (r) { return r.group !== "student"; })
      .map(function (r) { return { role: r.roleShort || r.role, org: r.hudOrg || r.org, orgShort: r.orgShort, url: r.url, logo: r.logo }; })
      .concat(h.highlights || []);
    var sweep = [h.red, h.violet || h.red, h.blue];
    var hue = function (i) { return i % 2 ? h.blue : h.red; };
    var dot = ' <span style="color:' + h.sep + ';">&middot;</span> ';
    var slash = ' <span style="color:' + h.sep + ';">//</span> ';

    // ----- header: HUD portrait + identity -----
    var mode = (c.variants.D || {}).avatar || "headshot";
    var portrait = mode === "monogram" ? c.images.monogram : mode === "none" ? "" : h.portrait || c.images.headshot;
    var id = [
      row(esc(p.name.toUpperCase()), txt(22, 26, h.text, "font-weight:bold;letter-spacing:2.5px;")),
      row((h.headline || [p.title]).map(function (seg, i) {
        return '<span style="color:' + hue(i) + ';">' + esc(seg.toUpperCase()) + "</span>";
      }).join(slash), txt(9.5, 14, h.red, "font-weight:bold;letter-spacing:1.3px;padding:4px 0 0 0;")),
      row(nowrap(esc(e.schoolShort || e.school)) + dot +
        nowrap(esc(e.programShort || e.program) + (e.classYear ? " " + esc(e.classYear) : "")),
        txt(11, 15, h.text, "padding:8px 0 0 0;")),
    ];
    if (e.honor) id.push(row(esc(e.honor), txt(10, 14, h.muted)));
    if (h.focus && h.focus.length) {
      id.push(row(h.focus.map(function (f, i) { return hudTag(f, hue(i)); }).join(""), "padding:9px 0 0 0;"));
    }
    // Stacked buttons fill the right of the header on wide reading panes.
    var BTN = 140, btns = "";
    if (k.booking) btns += hudButton(ctx, k.booking, "BOOK A MEETING &#9656;", h.red, "#FFFFFF", null, true);
    if (k.linkedin) btns += hudButton(ctx, k.linkedin, "LINKEDIN", h.blue, "#FFFFFF", null, true);
    if (k.portfolio) btns += hudButton(ctx, k.portfolio, esc(prettyUrl(k.portfolio).toUpperCase()), h.bg, h.text, h.red, true);
    if (k.github) btns += hudButton(ctx, k.github, "GITHUB", h.bg, h.text, h.blue, true);
    // Hybrid header: identity and buttons are two floated blocks. They sit side by
    // side while the card has room and the buttons drop below as it narrows (zoom,
    // small panes). Classic Outlook ignores floats/max-width, so the [if mso]
    // ghost table gives it a fixed two-column row instead.
    var ID = 500;
    var identity = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' +
      (portrait ? '<td valign="middle" width="' + PIC + '" style="width:' + PIC + 'px;padding:0 16px 0 0;">' +
        img(ctx, portrait, PIC, PIC, p.name) + "</td>" : "") +
      '<td valign="middle">' + stack(id) + "</td></tr></table>";
    var header =
      '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td valign="middle"><![endif]-->' +
      '<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" style="float:left;width:100%;max-width:' + ID +
      'px;border-collapse:collapse;"><tr><td style="padding:0 0 12px 0;">' + identity + "</td></tr></table>" +
      (btns ? '<!--[if mso]></td><td width="' + BTN + '" valign="middle" align="right"><![endif]-->' +
        '<table role="presentation" align="right" width="' + BTN + '" cellpadding="0" cellspacing="0" border="0" style="float:right;width:' + BTN +
        'px;border-collapse:separate;">' + btns + "</table>" : "") +
      '<!--[if mso]></td></tr></table><![endif]-->';

    var rows = [];
    rows.push(row(sweepBar([h.red, h.violet || h.red, h.blue], 3), "padding:16px " + PAD + "px 0 " + PAD + "px;font-size:0;line-height:0;"));
    rows.push(row(header, "padding:14px " + PAD + "px 0 " + PAD + "px;"));

    // ----- roles grid: floated cells, scarlet → violet → blue -----
    // Each cell floats at up to CELL px, so the grid shows 3 columns at full width,
    // 2 when zoomed in, and 1 on very narrow panes. Classic Outlook gets a fixed
    // 3-column ghost table instead.
    if (cells.length) {
      var CELL = 270, grid = "";
      cells.forEach(function (item, i) {
        var col = i % 3;
        if (i > 0) {
          grid += col === 0 ? '<!--[if mso]></td></tr><tr><td width="33%" valign="top"><![endif]-->'
            : '<!--[if mso]></td><td width="33%" valign="top"><![endif]-->';
        }
        grid += '<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" style="float:left;width:100%;max-width:' + CELL +
          'px;border-collapse:collapse;"><tr><td valign="top" style="padding:0 8px 10px 0;">' + hudCell(ctx, h, item, sweep[col]) + "</td></tr></table>";
      });
      grid = '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="33%" valign="top"><![endif]-->' +
        grid + "<!--[if mso]></td></tr></table><![endif]-->";
      rows.push(hudRule(h, "12px " + PAD + "px 11px " + PAD + "px"));
      rows.push(row(grid, "padding:0 " + PAD + "px;"));
    }

    // ----- student leadership, grouped by role -----
    if (student.length) {
      var groups = [];
      student.forEach(function (r) {
        var g = groups.filter(function (x) { return x.role === r.role; })[0];
        if (!g) groups.push(g = { role: r.role, orgs: [] });
        var org = '<b style="color:' + h.text + ';font-weight:bold;">' + esc(r.orgBrief || r.orgShort || r.org) + "</b>";
        if (r.url) org = link(ctx, r.url, org, "color:" + h.text + ";");
        // Inline 16px logo before the org name, when an official one exists.
        if (r.logo) {
          org = '<img src="' + esc(ctx.asset(r.logo)) + '" width="16" height="16" alt="" align="absmiddle" ' +
            'style="width:16px;height:16px;border:0;border-radius:4px;vertical-align:middle;">&nbsp;' + org;
        }
        g.orgs.push(org);
      });
      // Each group stays on one line so a role never strands its organizations.
      var lead = groups.map(function (g) { return nowrap(esc(g.role) + dot + g.orgs.join(", ")); })
        .join(' <span style="color:' + h.sep + ';">/</span> ');
      rows.push(row('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>' +
        '<td valign="top" width="84" style="width:84px;' + txt(8.5, 14, h.blue, "font-weight:bold;letter-spacing:1.4px;white-space:nowrap;") +
        '">LEADERSHIP</td>' +
        '<td valign="top" style="' + txt(10, 14, h.muted) + '">' + lead + "</td></tr></table>",
        "padding:12px " + PAD + "px 0 " + PAD + "px;"));
    }

    // ----- footer: contact + wordmark, then buttons -----
    var reach = [];
    if (k.phone) reach.push(nowrap(link(ctx, "tel:" + k.phone.replace(/[^+\d]/g, ""), esc(k.phone), "color:" + h.text + ";")));
    if (k.email) reach.push(nowrap(link(ctx, "mailto:" + k.email, esc(k.email), "color:" + h.link + ";")));
    if (k.email2) reach.push(nowrap(link(ctx, "mailto:" + k.email2, esc(k.email2), "color:" + h.link + ";")));
    var wm = h.wordmark, mark = "";
    if (wm && wm.src) {
      mark = img(ctx, wm.src, Math.round((wm.height * wm.width) / wm.heightPx), wm.height, wm.alt || "");
      if (wm.url) mark = '<a href="' + esc(wm.url) + '" target="_blank" style="text-decoration:none;">' + mark + "</a>";
    }
    rows.push(hudRule(h, "13px " + PAD + "px 0 " + PAD + "px"));
    rows.push(row('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>' +
      '<td valign="middle" style="' + txt(10.5, 15, h.muted) + '">' + reach.join(dot) + "</td>" +
      (mark ? '<td valign="middle" align="right" style="padding:0 0 0 10px;">' + mark + "</td>" : "") + "</tr></table>",
      "padding:10px " + PAD + "px 14px " + PAD + "px;"));

    // Fluid: fills the message body up to hud.width, and shrinks with zoom or a
    // narrower pane. Classic Outlook ignores max-width, so the [if mso] ghost table
    // caps it there. Paste it from outlook/Copy Signature.html: copying a rendered
    // page with Ctrl+A freezes the percentage to the browser's width.
    return "<!--[if mso]><table role=\"presentation\" width=\"" + W + "\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td><![endif]-->" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + h.bg +
      '" style="width:100%;max-width:' + W + 'px;border-collapse:separate;background-color:' + h.bg + ";border:1px solid " + h.line +
      ";border-radius:14px;font-family:" + FONT + ';">' + rows.join("") + "</table>" +
      "<!--[if mso]></td></tr></table><![endif]-->";
  }

  var RENDERERS = { D: variantD, A: variantA, B: variantB, C: variantC };

  function render(config, variant, opts) {
    var fn = RENDERERS[variant];
    if (!fn) throw new Error("Unknown variant: " + variant);
    return fn(makeCtx(config, variant, opts));
  }

  // Plain-text alternative for clipboard/plain-text mail clients.
  function renderText(config, variant) {
    var p = config.person, e = config.education, k = config.contact;
    var lines = [p.name, p.title + (p.specialty ? " | " + p.specialty : "")];
    lines.push(e.school + " | " + e.program + (e.classYear ? " " + e.classYear : ""));
    if (e.honor && variant === "D") lines.push(e.honor);
    lines.push("");
    config.roles.filter(function (r) { return inVariant(r, variant); })
      .slice(0, variant === "A" ? 2 : 99)
      .forEach(function (r) { lines.push(r.role + ", " + r.org); });
    if (variant === "D" && config.hud) {
      (config.hud.highlights || []).forEach(function (hl) { lines.push(hl.role + ", " + hl.org); });
    }
    lines.push("");
    [k.phone, k.email, k.email2, k.linkedin, k.github, k.portfolio, k.website]
      .filter(Boolean).forEach(function (x) { lines.push(x); });
    if (k.booking) lines.push("Book a meeting: " + k.booking);
    return lines.join("\n");
  }

  function standalone(config, variant, opts) {
    var label = (config.variants[variant] || {}).label || variant;
    return "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n" +
      "<title>" + esc(config.person.name) + " — " + esc(label) + " signature</title>\n</head>\n" +
      "<body style=\"margin:0;padding:32px 24px;background:#ffffff;\">\n" +
      "<!-- SIGNATURE START -->\n" + render(config, variant, opts) + "\n<!-- SIGNATURE END -->\n" +
      "</body>\n</html>\n";
  }

  return {
    render: render,
    renderText: renderText,
    standalone: standalone,
    variants: Object.keys(RENDERERS),
    GMAIL_LIMIT: GMAIL_LIMIT,
  };
});
