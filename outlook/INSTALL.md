# Installing the signature in Outlook

**Files in this folder**

| File | What it's for |
|---|---|
| `Copy Signature.html` | **Start here.** Open it and click **Copy signature**. It also previews how the card resizes. |
| `Danish Nadar.htm` | The signature as a file, for the classic Outlook installer. |
| `Danish Nadar.txt` | Plain-text version Outlook uses for plain-text emails. |
| `Install-ClassicOutlook.ps1` | One-click installer for classic Outlook for Windows. |

> **Before you start:** the photo and Illinois Tech wordmark load from
> `https://danishnadar.github.io/Email-Signatures/assets/…`. Push this repo to
> GitHub first and wait about a minute for Pages to publish. If you skip this, recipients see
> alt text instead of images. To check, open
> <https://danishnadar.github.io/Email-Signatures/assets/brand/headshot-hud.png>.
> You should see your photo.

---

## New Outlook for Windows / Outlook on the web (outlook.office.com)

Your `@hawk.illinoistech.edu` account most likely uses one of these.

1. Double-click **`Copy Signature.html`** to open it in Edge or Chrome.
2. Click **Copy signature**. Don't use Ctrl + A: it freezes the card's width to your browser window.
3. In Outlook, open **Settings** (gear icon) → **Account** → **Signatures**.
4. Click **+ New signature** (or open your existing one and select everything in the editor), then press **Ctrl + V**.
5. Under *Select default signatures*, choose **Danish Nadar** for **New messages** and **Replies/forwards**.
6. Click **Save**.

## Classic Outlook for Windows

**Option A, installer:** right-click `Install-ClassicOutlook.ps1` → **Run with PowerShell**.
Restart Outlook, then go to **File → Options → Mail → Signatures…**, set *New messages* and
*Replies/forwards* to **Danish Nadar**, and click **OK**.

**Option B, paste:** use **Copy signature** as in steps 1–2 above, then go to **File → Options → Mail → Signatures… → New**,
name it, paste into the editor, set the defaults, and click **OK**.

> If the installed signature doesn't appear, your Outlook is syncing signatures from the cloud.
> Use Option B, or the web steps above, which sync to classic Outlook automatically.

## Outlook for Mac

1. Open `Copy Signature.html` in Safari or Chrome and click **Copy signature**.
2. **Outlook → Settings → Signatures → +**, paste, name it, and close the editor to save.
3. In the same window, choose it under *Default signatures*.

## Outlook mobile (iOS / Android)

The mobile app only supports a basic signature. The full design is used when you send from
desktop or web.

---

### What to expect

- **Card:** the dark background is a solid table color, so it shows in every Outlook. Classic Outlook draws square corners instead of rounded ones.
- **Width, at any zoom:** the card fills the message body up to 860px (`hud.width` in
  `signature.config.js`). If you zoom in or narrow the reading pane, it shrinks to fit. The tags
  wrap, and below about 650px the buttons move under your name. Classic Outlook for Windows
  doesn't support this kind of resizing, so there it stays a fixed 860px.
- **Buttons:** *Book a Meeting*, *LinkedIn*, *danishnadar.com*, and *GitHub* are real links styled as
  buttons. Classic Outlook shows them with square corners; everywhere else they're rounded.
- **Dark mode:** the card is already dark, so it looks the same in dark mode. A few apps fully invert
  colors and turn it into a light card. It stays readable there, and the portrait has a transparent
  background, so it works on both.
- **Blocked images:** all text, including your name, roles, phone, emails, and links, is real text and
  still shows when images are blocked.
- **Test it:** send yourself an email from Outlook and open it on your phone and in Gmail to see
  what recipients see.

### Updating it later

Edit `signature.config.js` (or use the Studio: `npm run studio`), run `npm run build`, and
reinstall from this folder.
