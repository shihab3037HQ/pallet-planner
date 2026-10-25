# Pallet & Container Planner

Built by **Gaziur Rahman Shihab** · **HexaEcom**

Live at **https://pallet.hexaecom.com**

A free website for planning pallets, sea containers and air ULDs for Amazon inbound shipments (AWD / FBA). Everything runs in the browser: nothing is uploaded, and projects are saved in your own browser.

## What it does

- Imports the same Excel file you upload to Seller Central (Merchant SKU, units per box, number of boxes, box size, box weight).
- Numbers boxes in Amazon's label order (SKU A to Z), so box numbers match the printed box labels.
- Builds pallets with full flat layers and no overhang. Only the top layer can be part full, and part-full pallets always go on top of a stack.
- Checks the height and weight limits you set (defaults: 52 in per stackable pallet, 100 in per stack of two, 72 in single, 1,500 lb).
- **Sea:** 20', 40', 45' standard and high cube, 20' / 40' reefer, open top and flat rack. Two floor patterns, stacking, loading order, door height and payload checks, fill and weight-centre stats, and how many containers you need.
- **Floor-loaded cartons:** plan loose cartons in walls from the front wall to the doors, with box numbers per wall.
- **Air:** PMC, PAG and PLA pallets and AKE (LD3), DQF (LD8) and ALP (LD11) containers, with their contours. Tall pallets go where the contour allows; anything outside shows in red. Chargeable weight with a 6000 or 5000 divisor.
- **3D:** every pallet, container and ULD, with step-by-step loading, camera presets and click-for-details.
- **Compare:** sea vs air for the same boxes, with your own rates; every container type and every ULD type.
- **Output:** printable pallet sheets and loading plan (Print / PDF, with 3D pictures), Excel export, project save/open, and share links.
- Light and dark theme, works on phones.

## Site map

| Path | What |
|---|---|
| `/` | Landing page |
| `/app/` | The planner (v2) |
| `/guide/` | How to use it |
| `/v1/` | Version 1, frozen and unchanged, as a fallback |

## Files

```
CNAME                  custom domain for GitHub Pages (pallet.hexaecom.com)
.nojekyll              serve files as they are (no Jekyll build)
index.html             landing page
app/index.html         planner page
guide/index.html       guide
v1/index.html          version 1 (do not edit)
404.html, robots.txt, sitemap.xml
assets/
  css/   base.css (theme, header, footer) · app.css (planner) · site.css (landing, guide)
  img/   logo.svg · logo-mark.svg · logo-mark-white.svg · favicon.svg · og-image.png · hero-*.png
  js/
    data/    constants · colors · containers · uld · example
    engine/  state · units · pack (pallet builder) · sea · air
    views/   draw (2D drawings) · common · side · shipments · plan · container · airview · pallets · compare
    three/   scene · pallet3d · container3d · uld3d
    io/      import · export · print · storage · share
    app.js   events and start-up
```

There is no build step. The scripts are plain files loaded in order by `app/index.html`. All sizes are stored in cm and kg; the display converts to inches and pounds.

## Hosting on GitHub Pages with pallet.hexaecom.com

1. In the repository, go to **Settings > Pages**. Set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`, and click **Save**.
2. Under **Custom domain**, enter `pallet.hexaecom.com` and click **Save**. (The `CNAME` file in this repository already holds the same name.)
3. At the DNS provider for `hexaecom.com`, add one record:

   | Type | Name / Host | Value / Target | TTL |
   |---|---|---|---|
   | CNAME | `pallet` | `shihab3037hq.github.io` | Auto or 3600 |

   The target is the GitHub username plus `.github.io`, without the repository name and without `https://`. If the domain is on Cloudflare, set this record to **DNS only** (grey cloud) so GitHub can issue the HTTPS certificate.
4. When the DNS check in **Settings > Pages** turns green, tick **Enforce HTTPS**. The certificate usually takes 15 minutes to a few hours.
5. Recommended: verify `hexaecom.com` under your GitHub **profile Settings > Pages > Add a domain**, and add the TXT record it gives you. This stops anyone else from using your subdomains on GitHub Pages.

## Logo

The logo files in `assets/img/` are SVG redraws of the HexaEcom logo. To use the original artwork, replace `logo-mark.svg` (black mark), `logo-mark-white.svg` (white mark, used on the dark header) and `logo.svg` (mark with "Hexa Ecom / Your Growth Partner") with files of the same names.

## Notes

- The built-in example is made-up demo data. Shipments you import are saved only in your own browser, never in this repository, so client data stays private even though the site is public.
- A share link holds the plan after the `#` in the link; browsers never send that part to the server. Anyone with the link can see the plan, including SKUs.
- The 3D view (three.js 0.160) and the Excel import/export (SheetJS 0.18.5) load from public CDNs, so they need an internet connection. The rest works offline once the page is open.
- Projects saved in version 1 (in the browser or as a file) open in v2 automatically. Version 1 keeps working at `/v1/`.
- Container sizes, door heights, payloads, ULD contours and weights are typical values. Always confirm the final plan with your forwarder or airline.
