# MERCH ENSAMR

The storefront uses the supplied Bloxic Homepage One package as its design source, ported into the React application and adapted for the ENSAM Rabat catalog and WhatsApp ordering flow.

Local preview only; not deployed. Run npm run dev.

## Collection

Dedicated collection and product pages use all six supplied mockups. MIND IN MOTION: 135 MAD. Be creART(et métiers)ive and Think Beyond Limits: 120 MAD each. Sizes: S, M, L, XL, XXL. Includes photo browsing, enlarged galleries, size and quantity selection, subtotal, order review, order-text copy/download and related products.

## Customizer

The separate `/design-studio` page explains the custom-print service, what customers should send, and how the team confirms the final placement and price. WhatsApp contact buttons appear automatically after contacts are added to `app/shop-config.ts`.

Save editable designs as JSON and reopen them with validated embedded images. Existing version-1 files are accepted. Imports can be undone. Download the current garment view or a complete front/back contact sheet including sleeve and neck artwork, color, size and quantity. Review and copy order details before contacting the team. Original artwork and exported mockups must be attached manually to WhatsApp. Files remain in browser memory until saved/shared; there is no cloud persistence. Physical print dimensions, actual garment appearance, available options and custom pricing require team confirmation. The neck area is shown on the upper back as a placement illustration, not an interior-label production proof.

## Before deployment

Add the four WhatsApp contacts in app/shop-config.ts. Ordering/payment are arranged on WhatsApp. Custom designs request a quote; there are no invented custom-print prices. Confirm printable dimensions against the supplier's templates. Browser visual/interaction QA has not been performed.

## Design and assets

Charcoal/white/light gray/red storefront inspired by https://html.themexriver.com/bloxic/?storefront=envato-elements . Original collection imagery is user supplied. The editor workflow references the user-authorized Todify designer. No third-party template code or store imagery was copied.

Built-in imagegen produced public/garment-sprite-sheet.png, 1254×1254 with four 627×627 quadrants. Final asset brief: one square 2×2 sprite, top-left white front, top-right white back, bottom-left black front, bottom-right black back; identical upright flat-lay blank crewneck short-sleeve geometry; centered shirt in each quadrant, light gray background, realistic smooth cotton; no logos, artwork, labels, text or grid. Requested 2048 square; tool returned 1254 square. Canvas draws source quadrants directly without modifying the generated asset.

## Validation

Build and TypeScript pass. Collection checks cover prices, six assets, 45 order totals, WhatsApp encoding, invalid input, seven routes and unknown-product 404. Studio checks cover rotated containment across five print areas, hit testing, resize/rotation handles, save/reopen data round-trip, order details and rejected invalid imports. Studio route and garment asset return 200.

## Todify-style designer continuation

The designer now occupies the full viewport with a left tool rail, changing left panel, floating side/preset selector, cyan placement overlay, green Save button and bottom Editor/Preview controls. Shop styling remains on other routes.

Observed preset dimensions: Front 35×40, 40×50, 30×25 and two 25×45 cm placements; Back 35×40 and 40×50; Neck label 6×6; each sleeve 11×15. Side tabs and size thumbnails are separate selections. Pixel positions were estimated from the displayed reference and are not certified supplier production coordinates. Selected presets persist through saves, imports and undo. Tests cover all 10 presets and rotated containment, including saved geometry.

Save offers an editable local JSON file, a five-view mockup sheet, per-area transparent PNGs rendered at 300 pixels per inch, and a text sheet with center coordinates, dimensions and rotation. Match the full exported area to the same supplier preset and verify the result in Todify before ordering. The JSON is NOT a Todify template file, and no order or save is sent to the supplier account.

Remaining exact-match gaps: supplier-front.png was obtained from the observed public CDN asset through the browser asset export. Other garment views remain substitutes from the generated sprite; font catalog, text rendering and some control arrangements differ from Todify. This is a functional reconstruction, not the original source package or a verified pixel-identical clone. Exact supplier mockup assets/source and reference interaction QA are still needed for that claim. Browser QA of the local site has not been performed. Latest TypeScript/build and all-preset geometry checks passed.

## Hybrid customizer

The default customer experience is a guided three-step flow: choose shirt options, select one of eight familiar placements, then upload artwork or add text. The placement choices map to the observed Todify print-area presets. Customers can drag artwork directly on the mockup, then open the Advanced editor for print-size presets, layers, exact dimensions, rotation, locking, hiding and transfer exports. Switching modes preserves the same design.
