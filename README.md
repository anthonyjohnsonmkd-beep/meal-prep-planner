# Meal Prep Planner

A phone-first app for planning, prepping and logging meals with calories, macros and micronutrients. It installs to the iPhone home screen, works offline, and keeps all data on the device.

## What it does

- **Today**: calorie ring, protein / carbs / fat against your targets, micronutrients, and today's meals. Starts at 0 each day.
- **Add a meal**: pick Breakfast, Lunch, Dinner or Snacks, then a saved meal or create a new one. Adjust amounts for this time only, and add it to several days at once for meal prep.
- **Saved meals**: built from ingredients, so totals are always calculated. Duplicate a meal to make a variation.
- **Edit a logged meal**: change amounts for that day only, reset to the saved recipe, update the saved recipe, or save the day's version as a new meal.
- **Pantry**: your ingredient list by category, with favourites. Nutrition per piece, per 100 g or per 100 ml. Calories are checked against the macros to catch label typos.
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

- Barcode scanning and nutrition-label photos to fill in ingredients
- Shopping list from the week's planned meals, with "running low" markers in the Pantry
