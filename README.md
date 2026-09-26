# Pallet & Container Planner

Built by **Gaziur Rahman Shihab** · **HexaEcom**

A single-page tool for planning pallets, stacks and container or air loads for Amazon inbound shipments (AWD / FBA). It runs in the browser. Nothing is uploaded anywhere, and projects are saved in your own browser.

## What it does

- Imports the same Excel file you upload to Seller Central (Merchant SKU, units per box, number of boxes, box size, box weight).
- Numbers boxes in Amazon's label order (SKU A to Z), so box numbers match the printed box labels.
- Builds pallets with full flat layers and no overhang. Only the top layer can be part full, and part-full pallets always go on top of a stack.
- Groups pallets by box size, or mixes sizes to use fewer pallets (a switch in the settings).
- Checks the height and weight limits you set (defaults: 52 in per stackable pallet, 100 in per stack of two, 72 in single, 1,500 lb).
- Sea: 20', 20' HQ, 40', 40' HQ and 45' HQ containers, with floor plan, side view, loading order, door height and weight checks, and how many containers you need.
- Air: pallet height by aircraft type and chargeable (volume) weight.
- A 3D view of every pallet and of the loaded container.
- Printable pallet sheets (Print / PDF), Excel export, and project save/open.

## Put it on GitHub Pages

1. Create a new repository on github.com (for example `pallet-planner`).
2. Click **Add file > Upload files** and upload `index.html` (and this README).
3. Go to **Settings > Pages**, set **Source** to "Deploy from a branch", pick `main` and `/ (root)`, then click **Save**.
4. After a minute your tool is live at `https://YOUR-USERNAME.github.io/pallet-planner/`.

To host it on your own website instead, upload `index.html` to any folder on the site.

## Notes

- The built-in example is made-up demo data. Shipments you import are saved only in your own browser, never in this repository, so client data stays private even though the site is public.

- The 3D view and the Excel import/export load two free libraries (three.js and SheetJS) from public CDNs, so they need an internet connection. The rest works offline.
- Container sizes, door heights and payloads are typical values. Always confirm the final plan with your forwarder.
