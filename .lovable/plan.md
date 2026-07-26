# Spice Got Cars — Build Plan

Build a mobile-first car sales site using the selected "Kenya road ready" direction (navy + emerald on slate, Inter). Demo data now; backend later. Placeholder WhatsApp number (`254700000000`) and Ruaka address that you can swap later.

## Routes (TanStack Start file-based)

- `/` — Home: hero + quick search, trust bar, featured listings (first 6), sell CTA, footer.
- `/inventory` — Full grid with keyword search, filters (price, year, body, transmission, fuel, condition), sort (price/year/mileage/newest). Filters as a top bar on desktop, collapsible sheet on mobile.
- `/inventory/$id` — Detail: photo gallery (thumbnails + main), full spec table, description, trust notes (logbook, NTSA), sticky WhatsApp + Call CTAs. Sold state visually locks CTAs.
- `/sell` — Lead-capture form + 3-step "how it works" + success confirmation state. Floating WhatsApp hidden on this page.
- `/about` — Company story, Ruaka location, trust points.
- `/contact` — Address, tap-to-call, WhatsApp button, hours, email, lazy-loaded Google Maps iframe embed.

Each route sets its own `head()` metadata; `__root.tsx` gets a real site title/description and social tags.

## Shared components

- `SiteHeader` — nav, mobile menu (sheet).
- `SiteFooter` — contact snippet + links.
- `FloatingWhatsApp` — fixed bottom-right, hidden on `/sell` (via `useRouterState` pathname check).
- `ListingCard` — photo, badge, price (KES + neg.), specs grid, View Details + WhatsApp icon button. Sold variant grays photo, shows "SOLD" stamp, disables CTAs.
- `Gallery` — main image + thumbnail strip, keyboard/click nav.
- `SoldBadge`, `ConditionBadge`, `SpecRow`.

## Data model (demo)

`src/data/listings.ts` — TypeScript module exporting `Car[]`:
```
id, make, model, trim, year, priceKes, negotiable, mileageKm,
transmission, fuelType, engineSize, bodyType, condition,
photos: string[], description, status: 'available'|'reserved'|'sold',
ntsaInspected: boolean, logbookVerified: boolean
```
Seed ~10 listings across body types, including 1 sold + 1 reserved. Photos: generate 4 hero car images in `src/assets/` (Prado, X-Trail, Mazda CX-5, Subaru Forester) and reuse across cards; gallery uses duplicates for now.

## WhatsApp utility

`src/lib/whatsapp.ts`:
- `WHATSAPP_NUMBER = '254700000000'` (constant, easy to swap).
- `buildCarInquiryLink(car)` → `https://wa.me/{n}?text={encoded per-car message}` matching the spec's copy.
- `buildGeneralInquiryLink()` → generic pre-filled message.

Used by `ListingCard`, detail page CTA, and `FloatingWhatsApp`.

## Filtering & sorting

Client-only. State via URL search params on `/inventory` (typed via TanStack `validateSearch` with zod) so filters are shareable and back-button friendly. `useMemo` derives filtered/sorted list from static `listings`.

## Sell form

React Hook Form + zod validation. Fields per spec (name, phone, make/model/year, mileage, condition, asking price, location, photos). Photo input is a stub `<input type="file" multiple>` that just displays selected filenames — no upload yet (backend later). On submit: show success card ("Thanks! Our team will call you within 1 business day.").

## Design tokens (from selected direction)

Update `src/styles.css`:
- `--brand-navy: #0f172a`, `--brand-accent: #059669` (emerald), `--brand-muted: #64748b`.
- Map to shadcn tokens: `--primary` → navy, `--accent`/success → emerald.
- Load Inter via `<link>` in `__root.tsx` head (per Tailwind v4 rules), register `--font-sans`.

Reuse existing shadcn Button/Input/Select/Sheet/Dialog/Form for interactive bits, restyled with brand tokens; keep the direction's card composition (rounded-2xl, subtle shadow, badge treatment, sold stamp).

## Out of scope this pass

- Real database, admin CRUD, image uploads, auth.
- Real WhatsApp Business number / real address (placeholders; swap when provided).
- Real Google Maps embed src (uses a generic Ruaka `q=` embed URL; swap for exact pin later).

Follow-up: enable Lovable Cloud to move listings into a DB with admin CRUD and image storage, wire the sell form to insert leads, and add an admin gate.
