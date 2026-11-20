# Meal Prep Planner

A phone-first app for planning, prepping and logging meals with calories, macros and micronutrients. It installs to the iPhone home screen, works offline, and keeps all data on the device.

## What it does

- **Today**: what you've eaten against your targets (calories, protein / carbs / fat, micronutrients), with planned meals shown lighter. Tick a meal ✓ when eaten. Starts at 0 each day.
- **Add a meal**: pick Breakfast, Lunch, Dinner or Snacks, then a saved meal or create a new one. Adjust amounts for this time only, and add it to several days at once for meal prep.
- **Saved meals**: built from ingredients, so totals are always calculated. Duplicate a meal to make a variation.
- **Edit a logged meal**: change amounts for that day only, reset to the saved recipe, update the saved recipe, or save the day's version as a new meal.
- **Pantry**: your ingredient list by category, with favourites. Nutrition is entered raw, as on the package, per piece, per 100 g or per 100 ml. Calories are checked against the macros to catch label typos. Optional cooked weight (100 g raw → 75 g cooked), pack size, and a "running low" flag.
- **Raw or cooked**: in a meal, each weighed ingredient can be marked as weighed raw or cooked. Cooked amounts are converted back to raw for nutrition and shopping.
- **Stock**: each ingredient tracks how much you have at home. Log groceries with **Pantry → I bought…** (one tap adds a pack) or by finishing a shopping trip. Ticking a meal as eaten takes its raw amounts off stock; unticking puts them back. Optional "warn me below" level puts it on the shopping list.
- **Barcode scanning**: scan a product with the camera (or type the number) to fill in an ingredient from [Open Food Facts](https://world.openfoodfacts.org), a free public food database. Works in New ingredient, Add ingredient (in a meal) and I bought…. Scanned barcodes are remembered, so the next scan finds the product instantly, even offline. Name search is also available.
- **What can I make?**: saved meals show how many portions your stock covers, or what's short.
- **Shop**: a shopping list built from the planned meals for the days you shop for (today or tomorrow, 3–14 days). Raw amounts, added up and grouped by aisle, in packs where a pack size is set. Stock is taken off what to buy. Tick items off, add other things, share the list, and finish shopping to add what you bought to stock.
- **Week**: daily calories against your target and which meals are planned.
- **Goals**: daily targets, plus backup and restore of all data as a JSON file.

## Install on iPhone

1. Open the app link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open it from the home screen. It runs full screen and works offline.

Data is stored in the browser's IndexedDB on the phone. Use **Goals → Save backup** now and then, and before changing phones.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (nutrition maths, dates)
npm run build    # production build into dist/
```

Pushing to `main` builds, tests and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Stack: React, TypeScript, Vite, Tailwind CSS, Zustand (persisted to IndexedDB), vite-plugin-pwa.

## Planned

- Nutrition-label photos to fill in products that aren't in the database
